import Phaser from "phaser";
import type { GameState } from "../../game/types";
import { WORLD_HEIGHT, WORLD_WIDTH } from "../../game/simulation/config";
import { calculateOrbitalSatellitePosition } from "./orbitalSatellite";

interface DriftStar {
  star: Phaser.GameObjects.Ellipse;
  baseX: number;
  baseY: number;
  speed: number;
  phase: number;
  amplitude: number;
}

export class ParallaxField {
  private backdrop!: Phaser.GameObjects.Image;

  private edgeGlow!: Phaser.GameObjects.Graphics;

  private stars: DriftStar[] = [];

  private moonSatellite!: Phaser.GameObjects.Image;

  private bottomGlow!: Phaser.GameObjects.Ellipse;

  constructor(private scene: Phaser.Scene) {
    this.createBackdrop();
  }

  update(state: Readonly<GameState>): void {
    const elapsed = state.elapsedMs * 0.001;
    const swayX = Math.sin(elapsed * 0.18) * 14;
    const swayY = Math.cos(elapsed * 0.15) * 10;

    this.backdrop.setPosition(
      WORLD_WIDTH * 0.5 + swayX * 0.18,
      WORLD_HEIGHT * 0.5 + swayY * 0.12
    );

    this.stars.forEach((entry, index) => {
      const shimmer =
        0.18 + Math.max(0, Math.sin(elapsed * entry.speed + entry.phase)) * 0.4;
      entry.star.setPosition(
        entry.baseX + Math.sin(elapsed * 0.12 + index) * entry.amplitude,
        entry.baseY + Math.cos(elapsed * 0.08 + index) * entry.amplitude * 0.6
      );
      entry.star.setAlpha(shimmer);
    });

    this.updateMoonSatellite(state.elapsedMs);

    this.bottomGlow.setPosition(
      WORLD_WIDTH * 0.5 + swayX * 0.14,
      WORLD_HEIGHT - 196 + swayY * 0.1
    );
    this.bottomGlow.setAlpha(
      0.08 + Math.max(0, Math.sin(elapsed * 0.3)) * 0.04
    );
  }

  private createBackdrop(): void {
    this.scene.add
      .rectangle(
        WORLD_WIDTH / 2,
        WORLD_HEIGHT / 2,
        WORLD_WIDTH,
        WORLD_HEIGHT,
        0x010205
      )
      .setDepth(-320);

    this.backdrop = this.scene.add
      .image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, "space-backdrop")
      .setDepth(-315)
      .setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT)
      .setAlpha(0.54);

    this.scene.add
      .rectangle(
        WORLD_WIDTH / 2,
        WORLD_HEIGHT / 2,
        WORLD_WIDTH,
        WORLD_HEIGHT,
        0x010205,
        0.28
      )
      .setDepth(-314);

    this.coverBackdropArtifacts();

    this.edgeGlow = this.scene.add.graphics().setDepth(-313);
    this.edgeGlow.fillStyle(0x5ecfff, 0.012);
    this.edgeGlow.fillEllipse(136, 342, 220, 560);
    this.edgeGlow.fillStyle(0x79e7cb, 0.01);
    this.edgeGlow.fillEllipse(954, 1310, 200, 600);
    this.edgeGlow.fillStyle(0xd2b171, 0.006);
    this.edgeGlow.fillEllipse(540, 1810, 660, 180);

    this.createStars();
    this.createMoonSatellite();

    this.bottomGlow = this.scene.add
      .ellipse(WORLD_WIDTH * 0.5, WORLD_HEIGHT - 184, 780, 160, 0x5cffd4, 0.045)
      .setDepth(62)
      .setBlendMode(Phaser.BlendModes.ADD);
  }

  private createStars(): void {
    for (let index = 0; index < 18; index += 1) {
      const star = this.scene.add
        .ellipse(
          70 + Math.random() * (WORLD_WIDTH - 140),
          50 + Math.random() * 980,
          Math.random() > 0.86 ? 4 : 3,
          Math.random() > 0.86 ? 4 : 3,
          index % 6 === 0 ? 0xffefc6 : 0xbfe9ff,
          0.1
        )
        .setDepth(-300 + Math.random() * 6);
      star.setBlendMode(Phaser.BlendModes.SCREEN);

      this.stars.push({
        star,
        baseX: star.x,
        baseY: star.y,
        speed: 0.4 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
        amplitude: 2 + Math.random() * 6
      });
    }
  }

  private createMoonSatellite(): void {
    this.moonSatellite = this.scene.add
      .image(WORLD_WIDTH * 0.5, WORLD_HEIGHT - 610, "moon-satellite")
      .setDepth(-292)
      .setDisplaySize(30, 30)
      .setAlpha(1);
  }

  private updateMoonSatellite(elapsedMs: number): void {
    const pointer = this.scene.input.activePointer;
    const pointerX =
      typeof pointer?.x === "number" && this.scene.scale.width > 0
        ? Phaser.Math.Clamp(pointer.x / this.scene.scale.width - 0.5, -0.5, 0.5)
        : 0;
    const pointerY =
      typeof pointer?.y === "number" && this.scene.scale.height > 0
        ? Phaser.Math.Clamp(
            pointer.y / this.scene.scale.height - 0.5,
            -0.5,
            0.5
          )
        : 0;
    const position = calculateOrbitalSatellitePosition({
      elapsedMs,
      centerX: WORLD_WIDTH * 0.5,
      centerY: WORLD_HEIGHT - 710,
      radiusX: 620,
      radiusY: 240,
      pointerParallaxX: pointerX * 10,
      pointerParallaxY: pointerY * 8
    });

    this.moonSatellite.setPosition(position.x, position.y);
    this.moonSatellite.setDisplaySize(30 * position.scale, 30 * position.scale);
    this.moonSatellite.setAlpha(position.alpha);
  }

  private coverBackdropArtifacts(): void {
    const cleanup = this.scene.add.graphics().setDepth(-312);
    cleanup.fillStyle(0x02050a, 0.82);
    cleanup.fillEllipse(148, 405, 132, 340);
    cleanup.fillStyle(0x03060c, 0.9);
    cleanup.fillEllipse(798, 1160, 150, 110);
    cleanup.fillStyle(0x04080f, 0.68);
    cleanup.fillEllipse(824, 1170, 230, 170);
  }
}
