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

export class GameplayScene extends Phaser.Scene {
  private bridge!: SceneBridge;

  private wormView!: WormView;

  private parallax!: ParallaxField;

  private shipVisuals = new Map<string, ShipVisual>();

  private music?: Phaser.Sound.BaseSound;

  private previousScore = 0;

  private previousPhase = "boot";

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

    this.input.on(
      "gameobjectdown",
      (
        _pointer: Phaser.Input.Pointer,
        gameObject: Phaser.GameObjects.GameObject
      ) => {
        const shipId = gameObject.getData("shipId") as string | undefined;
        if (shipId) {
          this.bridge.dispatch("tapShip", { shipId });
        }
      }
    );

    this.music = this.sound.add("music-loop", {
      loop: true,
      volume: 0.48
    });

    this.previousScore = this.bridge.getState().score;
    this.previousPhase = this.bridge.getState().phase;
  }

  update(_time: number, delta: number): void {
    this.bridge.tick(delta);
    const state = this.bridge.getState();

    this.syncShips(state.activeShips, state.elapsedMs);
    this.wormView.sync(state.worm);
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
        sprite.setInteractive({ pixelPerfect: false, useHandCursor: true });
        sprite.setData("shipId", ship.id);

        visual = { sprite, glow, trail };
        this.shipVisuals.set(ship.id, visual);
      }

      const floatOffset =
        Math.sin(elapsedMs * 0.0016 + ship.id.length + ship.lane * 0.02) * 6;
      const dir = ship.velocityX > 0 ? 1 : -1;
      const shipRotation = ship.velocityX > 0 ? 0 : Math.PI;
      const scaleMultiplier = ship.state === "targeted" ? 1.1 : 1;
      const pulse = 0.72 + Math.sin(elapsedMs * 0.004 + ship.y * 0.01) * 0.12;
      const trailLength = 96 + Math.min(46, Math.abs(ship.velocityX) * 0.09);
      const verticalLean = Math.sin(elapsedMs * 0.002 + ship.x * 0.01) * 12;

      visual.sprite.setPosition(ship.x, ship.y + floatOffset);
      visual.sprite.setRotation(shipRotation);
      visual.sprite.setScale(archetype.renderScale * scaleMultiplier);
      visual.sprite.setDepth(ship.state === "targeted" ? 56 : 52);
      if (ship.state === "targeted") {
        visual.sprite.setTint(0xfff1bf);
      } else {
        visual.sprite.clearTint();
      }

      visual.glow.setPosition(ship.x - dir * 14, ship.y + floatOffset);
      visual.glow.setScale(
        archetype.renderScale * (1.12 + pulse * 0.24) * scaleMultiplier,
        archetype.renderScale * (0.72 + pulse * 0.1)
      );
      visual.glow.setDepth(ship.state === "targeted" ? 55 : 50);
      visual.glow.setFillStyle(
        archetype.glowColor,
        ship.state === "targeted" ? 0.34 : 0.16 + pulse * 0.08
      );

      visual.trail.clear();
      visual.trail.lineStyle(
        ship.state === "targeted" ? 8 : 6,
        archetype.trailColor,
        ship.state === "targeted" ? 0.28 : 0.16
      );
      this.strokeQuadraticTrail(
        visual.trail,
        ship.x - dir * 34,
        ship.y + floatOffset,
        ship.x - dir * (trailLength * 0.4),
        ship.y + floatOffset + verticalLean * 0.35,
        ship.x - dir * trailLength,
        ship.y + floatOffset + verticalLean
      );
      visual.trail.fillStyle(
        archetype.trailColor,
        ship.state === "targeted" ? 0.22 : 0.12
      );
      visual.trail.fillCircle(
        ship.x - dir * (trailLength + 8),
        ship.y + floatOffset + verticalLean,
        ship.state === "targeted" ? 9 : 7
      );
    });
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
    if (state.score > this.previousScore) {
      this.sound.play("sfx-bite", { volume: 0.72 });
    }

    if (state.phase === "recovering" && this.previousPhase !== "recovering") {
      this.sound.play("sfx-miss", { volume: 0.66 });
    }

    this.previousScore = state.score;
    this.previousPhase = state.phase;
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
