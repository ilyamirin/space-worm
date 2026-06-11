import Phaser from "phaser";
import type { GameState } from "../../game/types";
import { WORLD_HEIGHT, WORLD_WIDTH } from "../../game/simulation/config";

interface DriftStar {
  star: Phaser.GameObjects.Ellipse;
  baseX: number;
  baseY: number;
  speed: number;
  phase: number;
  amplitude: number;
}

interface DriftObject {
  sprite: Phaser.GameObjects.Image;
  baseX: number;
  baseY: number;
  phase: number;
  swayX: number;
  swayY: number;
  speed: number;
  driftX: number;
  driftY: number;
  rotationRange: number;
  baseScale: number;
}

export class ParallaxField {
  private backdrop!: Phaser.GameObjects.Image;

  private edgeGlow!: Phaser.GameObjects.Graphics;

  private stars: DriftStar[] = [];

  private driftObjects: DriftObject[] = [];

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

    this.driftObjects.forEach((entry, index) => {
      entry.sprite.setPosition(
        entry.baseX +
          Math.sin(elapsed * entry.speed + index) * entry.swayX +
          elapsed * entry.driftX +
          swayX * 0.2,
        entry.baseY +
          Math.cos(elapsed * (entry.speed * 0.84) + entry.phase) * entry.swayY +
          elapsed * entry.driftY +
          swayY * 0.14
      );
      entry.sprite.setRotation(
        Math.sin(elapsed * (entry.speed * 0.4) + index) * entry.rotationRange
      );
      entry.sprite.setScale(
        entry.baseScale *
          (1 + Math.sin(elapsed * (entry.speed * 0.32) + index) * 0.015)
      );
    });

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

    this.edgeGlow = this.scene.add.graphics().setDepth(-313);
    this.edgeGlow.fillStyle(0x5ecfff, 0.012);
    this.edgeGlow.fillEllipse(136, 342, 220, 560);
    this.edgeGlow.fillStyle(0x79e7cb, 0.01);
    this.edgeGlow.fillEllipse(954, 1310, 200, 600);
    this.edgeGlow.fillStyle(0xd2b171, 0.006);
    this.edgeGlow.fillEllipse(540, 1810, 660, 180);

    this.createStars();
    this.createDriftObjects();

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

  private createDriftObjects(): void {
    const objects: Array<{
      key: string;
      x: number;
      y: number;
      scale: number;
      alpha: number;
      depth: number;
      tint?: number;
      flipX?: boolean;
      flipY?: boolean;
      swayX: number;
      swayY: number;
      speed: number;
      driftX: number;
      driftY: number;
      rotationRange: number;
    }> = [
      {
        key: "station-spire",
        x: 958,
        y: 636,
        scale: 0.15,
        alpha: 0.06,
        depth: -289,
        tint: 0xc2d7e8,
        flipX: true,
        swayX: 4,
        swayY: 6,
        speed: 0.08,
        driftX: -0.22,
        driftY: 0.06,
        rotationRange: 0.008
      },
      {
        key: "comet-tail",
        x: 194,
        y: 362,
        scale: 0.26,
        alpha: 0.05,
        depth: -288,
        tint: 0xb6ddea,
        swayX: 3,
        swayY: 6,
        speed: 0.08,
        driftX: 0.2,
        driftY: 0.04,
        rotationRange: 0.008
      }
    ];

    objects.forEach((config) => {
      const sprite = this.scene.add
        .image(config.x, config.y, config.key)
        .setDepth(config.depth)
        .setAlpha(config.alpha)
        .setScale(config.scale);
      sprite.setBlendMode(Phaser.BlendModes.SCREEN);
      if (config.tint) {
        sprite.setTint(config.tint);
      }
      if (config.flipX) {
        sprite.setFlipX(true);
      }
      if (config.flipY) {
        sprite.setFlipY(true);
      }

      this.driftObjects.push({
        sprite,
        baseX: config.x,
        baseY: config.y,
        phase: Math.random() * Math.PI * 2,
        swayX: config.swayX,
        swayY: config.swayY,
        speed: config.speed,
        driftX: config.driftX,
        driftY: config.driftY,
        rotationRange: config.rotationRange,
        baseScale: config.scale
      });
    });
  }
}
