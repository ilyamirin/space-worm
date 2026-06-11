import Phaser from "phaser";
import { SHIP_ARCHETYPES } from "../../game/content/shipArchetypes";
import { WORLD_HEIGHT, WORLD_WIDTH } from "../../game/simulation/config";
import type { SceneBridge, ShipInstance } from "../../game/types";
import { ParallaxField } from "../view/ParallaxField";
import { WormView } from "../view/WormView";

interface ShipVisual {
  sprite: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Ellipse;
  trail: Phaser.GameObjects.Graphics;
}

interface ShipMotionPose {
  offsetX: number;
  offsetY: number;
  rotationOffset: number;
  scaleX: number;
  scaleY: number;
  glowScaleX: number;
  glowScaleY: number;
  glowAlphaBoost: number;
  trailAlphaBoost: number;
}

export class GameplayScene extends Phaser.Scene {
  private bridge!: SceneBridge;

  private wormView!: WormView;

  private parallax!: ParallaxField;

  private shipVisuals = new Map<string, ShipVisual>();

  private music?: Phaser.Sound.BaseSound;

  private previousScore = 0;

  private previousPhase = "boot";

  private previousAttackPhase = "idle";

  private previousSatiation = 100;

  private knownShipIds = new Set<string>();

  private shipPassCooldownMs = 0;

  private lowSatietyCooldownMs = 0;

  constructor() {
    super("gameplay");
  }

  init(data: { bridge: SceneBridge }): void {
    this.bridge = data.bridge ?? (this.registry.get("bridge") as SceneBridge);
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#07111d");
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    this.parallax = new ParallaxField(this);
    this.wormView = new WormView(this);

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.bridge.dispatch("tapShip", {
        x: pointer.worldX,
        y: pointer.worldY
      });
    });

    this.music = this.sound.add("music-loop", {
      loop: true,
      volume: 0.48
    });

    this.previousScore = this.bridge.getState().score;
    this.previousPhase = this.bridge.getState().phase;
    this.previousAttackPhase = this.bridge.getState().worm.attackPhase;
    this.previousSatiation = this.bridge.getState().satiation;
  }

  update(_time: number, delta: number): void {
    this.bridge.tick(delta);
    const state = this.bridge.getState();

    this.shipPassCooldownMs = Math.max(0, this.shipPassCooldownMs - delta);
    this.lowSatietyCooldownMs = Math.max(0, this.lowSatietyCooldownMs - delta);

    this.syncShips(state.activeShips, state.elapsedMs);
    this.wormView.sync(state.worm, state.elapsedMs);
    this.parallax.update(state);
    this.syncAudio(state.phase);
    this.syncFeedback(state);
  }

  private syncShips(ships: readonly ShipInstance[], elapsedMs: number): void {
    const liveIds = new Set(ships.map((ship) => ship.id));

    this.shipVisuals.forEach((visual, shipId) => {
      if (!liveIds.has(shipId)) {
        visual.trail.destroy();
        visual.glow.destroy();
        visual.sprite.destroy();
        this.shipVisuals.delete(shipId);
      }
    });

    ships.forEach((ship) => {
      const archetype = SHIP_ARCHETYPES.find(
        (item) => item.id === ship.archetypeId
      );
      if (!archetype) {
        return;
      }

      let visual = this.shipVisuals.get(ship.id);
      if (!visual) {
        const trail = this.add.graphics().setDepth(49);
        trail.setBlendMode(Phaser.BlendModes.ADD);

        const glow = this.add
          .ellipse(ship.x, ship.y, 180, 76, archetype.glowColor, 0.18)
          .setDepth(50);
        glow.setBlendMode(Phaser.BlendModes.ADD);

        const sprite = this.add
          .image(ship.x, ship.y, archetype.spriteKey)
          .setDepth(52);

        visual = { sprite, glow, trail };
        this.shipVisuals.set(ship.id, visual);
      }

      const floatOffset =
        Math.sin(elapsedMs * 0.0016 + ship.id.length + ship.lane * 0.02) * 6;
      const dir = ship.direction;
      const shipRotation = ship.direction > 0 ? 0 : Math.PI;
      const scaleMultiplier = ship.state === "targeted" ? 1.1 : 1;
      const pulse = 0.72 + Math.sin(elapsedMs * 0.004 + ship.y * 0.01) * 0.12;
      const trailLength = 96 + Math.min(46, Math.abs(ship.velocityX) * 0.09);
      const verticalLean = Math.sin(elapsedMs * 0.002 + ship.x * 0.01) * 12;
      const cueAlpha = this.getPatternCueAlpha(ship, elapsedMs);
      const patternTrailWidth = this.getTrailWidth(ship);
      const motionPose = this.getShipMotionPose(ship);

      visual.sprite.setPosition(
        ship.x + motionPose.offsetX,
        ship.y + floatOffset + motionPose.offsetY
      );
      visual.sprite.setRotation(shipRotation + motionPose.rotationOffset);
      visual.sprite.setScale(
        archetype.renderScale * scaleMultiplier * motionPose.scaleX,
        archetype.renderScale * scaleMultiplier * motionPose.scaleY
      );
      visual.sprite.setDepth(ship.state === "targeted" ? 56 : 52);
      if (ship.state === "targeted") {
        visual.sprite.setTint(0xfff1bf);
      } else {
        visual.sprite.clearTint();
      }

      visual.glow.setPosition(
        ship.x - dir * 14 + motionPose.offsetX * 0.6,
        ship.y + floatOffset + motionPose.offsetY * 0.4
      );
      visual.glow.setScale(
        archetype.renderScale *
          (1.12 + pulse * 0.24) *
          scaleMultiplier *
          motionPose.glowScaleX,
        archetype.renderScale * (0.72 + pulse * 0.1) * motionPose.glowScaleY
      );
      visual.glow.setDepth(ship.state === "targeted" ? 55 : 50);
      visual.glow.setFillStyle(
        archetype.glowColor,
        Math.max(
          ship.state === "targeted" ? 0.34 : 0.16 + pulse * 0.08,
          cueAlpha + motionPose.glowAlphaBoost
        )
      );

      visual.trail.clear();
      visual.trail.lineStyle(
        ship.state === "targeted" ? patternTrailWidth + 2 : patternTrailWidth,
        archetype.trailColor,
        Math.min(
          0.34,
          (ship.state === "targeted" ? 0.28 : 0.16) + motionPose.trailAlphaBoost
        )
      );
      this.strokeQuadraticTrail(
        visual.trail,
        ship.x - dir * 34,
        ship.y + floatOffset + motionPose.offsetY * 0.3,
        ship.x - dir * (trailLength * 0.4),
        ship.y + floatOffset + verticalLean * 0.35,
        ship.x - dir * trailLength,
        ship.y + floatOffset + verticalLean
      );
      visual.trail.lineStyle(
        Math.max(2, patternTrailWidth * 0.42),
        0xf3fbff,
        ship.state === "targeted" ? 0.24 : 0.18 + motionPose.trailAlphaBoost
      );
      this.strokeQuadraticTrail(
        visual.trail,
        ship.x - dir * 26,
        ship.y + floatOffset + motionPose.offsetY * 0.22,
        ship.x - dir * (trailLength * 0.28),
        ship.y + floatOffset + verticalLean * 0.22,
        ship.x - dir * (trailLength * 0.68),
        ship.y + floatOffset + verticalLean * 0.72
      );
      visual.trail.fillStyle(
        archetype.trailColor,
        Math.min(
          0.28,
          (ship.state === "targeted" ? 0.22 : 0.12) +
            motionPose.trailAlphaBoost * 0.8
        )
      );
      visual.trail.fillCircle(
        ship.x - dir * 18,
        ship.y + floatOffset + motionPose.offsetY * 0.2,
        ship.state === "targeted" ? 8 : 6
      );
      visual.trail.fillStyle(
        0xf3fbff,
        ship.state === "targeted" ? 0.34 : 0.24 + motionPose.trailAlphaBoost
      );
      visual.trail.fillCircle(
        ship.x - dir * 12,
        ship.y + floatOffset + motionPose.offsetY * 0.16,
        ship.state === "targeted" ? 5 : 4
      );
      visual.trail.fillCircle(
        ship.x - dir * (trailLength + 8),
        ship.y + floatOffset + verticalLean,
        ship.state === "targeted" ? 9 : 7
      );
    });
  }

  private getPatternCueAlpha(ship: ShipInstance, elapsedMs: number): number {
    const ageSeconds = ship.ageMs / 1000;

    if (ship.movementPattern === "dashStop") {
      const cycleProgress = (ageSeconds + ship.movementPhase * 0.11) % 1.55;
      return cycleProgress > 0.52 && cycleProgress < 0.72 ? 0.45 : 0;
    }

    if (ship.movementPattern === "zigzagBlink") {
      const cycleProgress = (ageSeconds + ship.movementPhase * 0.07) % 1.35;
      return cycleProgress > 0.62 && cycleProgress < 0.74
        ? 0.5 + Math.sin(elapsedMs * 0.04) * 0.18
        : 0;
    }

    if (ship.movementPattern === "sidestepClamp") {
      const cycleProgress = (ageSeconds + ship.movementPhase * 0.09) % 1.08;
      return cycleProgress > 0.58 && cycleProgress < 0.74 ? 0.42 : 0;
    }

    if (ship.movementPattern === "tidalBloom") {
      const cycleProgress = (ageSeconds + ship.movementPhase * 0.13) % 3.8;
      return cycleProgress > 2.72 && cycleProgress < 3.32
        ? 0.42 + Math.sin(elapsedMs * 0.018) * 0.12
        : 0;
    }

    return 0;
  }

  private getTrailWidth(ship: ShipInstance): number {
    switch (ship.movementPattern) {
      case "dashStop":
        return ship.velocityX === 0 ? 4 : 8;
      case "wideSCurve":
        return 9;
      case "zigzagBlink":
        return 7;
      case "sidestepClamp":
        return Math.abs(ship.velocityX) < ship.speed * 0.5 ? 7 : 5;
      case "tidalBloom":
        return Math.abs(ship.velocityX) < ship.speed * 0.6 ? 9 : 6;
      default:
        return 6;
    }
  }

  private getShipMotionPose(ship: ShipInstance): ShipMotionPose {
    const ageSeconds = ship.ageMs / 1000;
    const driftWave = ageSeconds * 2.2 + ship.movementPhase * 0.3;
    const fineWave = ageSeconds * 4.8 + ship.movementPhase * 0.17;

    switch (ship.archetypeId) {
      case "falconish":
        return {
          offsetX: Math.sin(driftWave) * 4,
          offsetY: Math.cos(fineWave * 0.6) * 3,
          rotationOffset: Math.sin(driftWave * 0.7) * 0.045,
          scaleX: 1 + Math.sin(fineWave) * 0.016,
          scaleY: 1 - Math.sin(fineWave) * 0.012,
          glowScaleX: 1.08,
          glowScaleY: 1.04,
          glowAlphaBoost: 0.05,
          trailAlphaBoost: 0.03
        };
      case "saucer":
        return {
          offsetX: Math.sin(driftWave * 0.5) * 2,
          offsetY: Math.cos(driftWave * 0.9) * 5,
          rotationOffset: Math.sin(fineWave * 0.35) * 0.022,
          scaleX: 1 + Math.sin(fineWave * 0.55) * 0.02,
          scaleY: 1 + Math.cos(fineWave * 0.55) * 0.03,
          glowScaleX: 1.14,
          glowScaleY: 1.12,
          glowAlphaBoost: 0.07,
          trailAlphaBoost: 0.01
        };
      case "arrow":
        return {
          offsetX: Math.sin(fineWave * 0.8) * 3,
          offsetY: Math.sin(driftWave * 1.5) * 2,
          rotationOffset: Math.sin(driftWave * 1.1) * 0.03,
          scaleX: 1 + Math.max(0, Math.sin(fineWave * 1.3)) * 0.05,
          scaleY: 1 - Math.max(0, Math.sin(fineWave * 1.3)) * 0.028,
          glowScaleX: 1.18,
          glowScaleY: 0.98,
          glowAlphaBoost: 0.11,
          trailAlphaBoost: 0.07
        };
      case "ring":
        return {
          offsetX: Math.cos(driftWave * 0.8) * 3,
          offsetY: Math.sin(driftWave * 0.8) * 3,
          rotationOffset: Math.sin(fineWave * 0.9) * 0.038,
          scaleX: 1 + Math.sin(fineWave * 1.4) * 0.018,
          scaleY: 1 + Math.cos(fineWave * 1.4) * 0.018,
          glowScaleX: 1.22,
          glowScaleY: 1.16,
          glowAlphaBoost: 0.09,
          trailAlphaBoost: 0.04
        };
      case "triwing":
        return {
          offsetX: Math.sin(driftWave * 1.7) * 5,
          offsetY: Math.cos(fineWave * 0.9) * 2,
          rotationOffset: Math.sin(driftWave * 1.8) * 0.062,
          scaleX: 1 + Math.sin(fineWave * 1.8) * 0.024,
          scaleY: 1 - Math.sin(fineWave * 1.8) * 0.018,
          glowScaleX: 1.16,
          glowScaleY: 1.02,
          glowAlphaBoost: 0.1,
          trailAlphaBoost: 0.06
        };
      case "blockade":
        return {
          offsetX: Math.sin(driftWave * 0.45) * 2,
          offsetY: Math.cos(driftWave * 0.55) * 4,
          rotationOffset: Math.sin(driftWave * 0.45) * 0.024,
          scaleX: 1 + Math.cos(fineWave * 0.4) * 0.018,
          scaleY: 1 + Math.sin(fineWave * 0.4) * 0.012,
          glowScaleX: 1.1,
          glowScaleY: 1.08,
          glowAlphaBoost: 0.06,
          trailAlphaBoost: 0.025
        };
      case "crab":
        return {
          offsetX: Math.sin(fineWave * 0.85) * 2,
          offsetY: Math.sign(Math.sin(driftWave * 0.5)) * 3,
          rotationOffset: Math.sin(fineWave * 0.42) * 0.028,
          scaleX: 1 + Math.max(0, Math.sin(fineWave * 0.9)) * 0.035,
          scaleY: 1 - Math.max(0, Math.sin(fineWave * 0.9)) * 0.018,
          glowScaleX: 1.2,
          glowScaleY: 1.02,
          glowAlphaBoost: 0.08,
          trailAlphaBoost: 0.045
        };
      case "starfish":
        return {
          offsetX: Math.sin(driftWave * 0.7) * 3,
          offsetY: Math.cos(driftWave * 0.9) * 4,
          rotationOffset: Math.sin(fineWave * 0.22) * 0.085,
          scaleX: 1 + Math.max(0, Math.sin(fineWave * 0.42)) * 0.05,
          scaleY: 1 + Math.max(0, Math.sin(fineWave * 0.42)) * 0.05,
          glowScaleX: 1.28,
          glowScaleY: 1.22,
          glowAlphaBoost: 0.09,
          trailAlphaBoost: 0.055
        };
      default:
        return {
          offsetX: 0,
          offsetY: 0,
          rotationOffset: 0,
          scaleX: 1,
          scaleY: 1,
          glowScaleX: 1,
          glowScaleY: 1,
          glowAlphaBoost: 0,
          trailAlphaBoost: 0
        };
    }
  }

  private syncAudio(phase: string): void {
    if (!this.music) {
      return;
    }

    const canPlay = phase === "running" || phase === "recovering";
    const contextState =
      "context" in this.sound && this.sound.context
        ? this.sound.context.state
        : "running";

    if (canPlay && !this.music.isPlaying && contextState === "running") {
      this.music.play();
    }

    if (phase === "gameOver" && this.music.isPlaying) {
      this.music.stop();
    }
  }

  private syncFeedback(state: ReturnType<SceneBridge["getState"]>): void {
    const nextShipIds = new Set(state.activeShips.map((ship) => ship.id));
    const spawnedShips = state.activeShips.filter(
      (ship) => !this.knownShipIds.has(ship.id)
    );

    if (spawnedShips.length > 0 && this.shipPassCooldownMs === 0) {
      this.sound.play("sfx-ship-pass", { volume: 0.16 });
      this.shipPassCooldownMs = 900;
    }

    if (
      state.worm.attackPhase === "extending" &&
      this.previousAttackPhase !== "extending"
    ) {
      this.sound.play("sfx-bite-windup", { volume: 0.4 });
    }

    if (state.score > this.previousScore) {
      this.sound.play("sfx-bite-hit", { volume: 0.72 });
    }

    if (state.phase === "recovering" && this.previousPhase !== "recovering") {
      this.sound.play("sfx-bite-miss", { volume: 0.66 });
    }

    if (state.phase === "gameOver" && this.previousPhase !== "gameOver") {
      this.sound.play("sfx-game-over", { volume: 0.7 });
    }

    const crossedIntoLowSatiety =
      state.satiation <= 25 && this.previousSatiation > 25;
    const stillLowSatiety =
      state.satiation <= 25 && this.previousSatiation <= 25;

    if (
      crossedIntoLowSatiety ||
      (stillLowSatiety && this.lowSatietyCooldownMs === 0)
    ) {
      this.sound.play("sfx-satiety-low", { volume: 0.22 });
      this.lowSatietyCooldownMs = 6000;
    }

    this.knownShipIds = nextShipIds;
    this.previousScore = state.score;
    this.previousPhase = state.phase;
    this.previousAttackPhase = state.worm.attackPhase;
    this.previousSatiation = state.satiation;
  }

  private strokeQuadraticTrail(
    graphics: Phaser.GameObjects.Graphics,
    startX: number,
    startY: number,
    controlX: number,
    controlY: number,
    endX: number,
    endY: number
  ): void {
    const curve = new Phaser.Curves.QuadraticBezier(
      new Phaser.Math.Vector2(startX, startY),
      new Phaser.Math.Vector2(controlX, controlY),
      new Phaser.Math.Vector2(endX, endY)
    );
    const points = curve.getPoints(16);

    graphics.beginPath();
    graphics.moveTo(startX, startY);
    points.forEach((point) => {
      graphics.lineTo(point.x, point.y);
    });
    graphics.strokePath();
  }
}
