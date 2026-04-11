import Phaser from "phaser";
import { SHIP_ARCHETYPES } from "../../game/content/shipArchetypes";
import { WORLD_HEIGHT, WORLD_WIDTH } from "../../game/simulation/config";
import type { SceneBridge, ShipInstance } from "../../game/types";
import { ParallaxField } from "../view/ParallaxField";
import { WormView } from "../view/WormView";

export class GameplayScene extends Phaser.Scene {
  private bridge!: SceneBridge;

  private wormView!: WormView;

  private parallax!: ParallaxField;

  private shipSprites = new Map<string, Phaser.GameObjects.Image>();

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

    this.syncShips(state.activeShips);
    this.wormView.sync(state.worm);
    this.parallax.update(state);
    this.syncAudio(state.phase);
    this.syncFeedback(state);
  }

  private syncShips(ships: readonly ShipInstance[]): void {
    const liveIds = new Set(ships.map((ship) => ship.id));

    this.shipSprites.forEach((sprite, shipId) => {
      if (!liveIds.has(shipId)) {
        sprite.destroy();
        this.shipSprites.delete(shipId);
      }
    });

    ships.forEach((ship) => {
      const archetype = SHIP_ARCHETYPES.find(
        (item) => item.id === ship.archetypeId
      );
      if (!archetype) {
        return;
      }

      let sprite = this.shipSprites.get(ship.id);
      if (!sprite) {
        sprite = this.add
          .image(ship.x, ship.y, archetype.spriteKey)
          .setDepth(52);
        sprite.setInteractive({ pixelPerfect: false, useHandCursor: true });
        sprite.setData("shipId", ship.id);
        this.shipSprites.set(ship.id, sprite);
      }

      sprite.setPosition(ship.x, ship.y);
      sprite.setRotation(ship.velocityX > 0 ? 0 : Math.PI);
      const scaleMultiplier = ship.state === "targeted" ? 1.1 : 1;
      sprite.setScale(archetype.renderScale * scaleMultiplier);
      sprite.setDepth(ship.state === "targeted" ? 56 : 52);
      if (ship.state === "targeted") {
        sprite.setTint(0xfff1bf);
      } else {
        sprite.clearTint();
      }
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
}
