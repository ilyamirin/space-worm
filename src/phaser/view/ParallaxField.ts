import Phaser from "phaser";
import type { GameState } from "../../game/types";
import { WORLD_HEIGHT, WORLD_WIDTH } from "../../game/simulation/config";
import { calculateOrbitalSatellitePosition } from "./orbitalSatellite";
import { calculatePixelCometRenderState } from "./pixelComets";

interface DriftStar {
  star: Phaser.GameObjects.Ellipse;
  baseX: number;
  baseY: number;
  speed: number;
  phase: number;
  amplitude: number;
}

interface PixelComet {
  container: Phaser.GameObjects.Container;
  head: Phaser.GameObjects.Rectangle;
  spark: Phaser.GameObjects.Rectangle;
  trail: Phaser.GameObjects.Rectangle[];
  startX: number;
  startY: number;
  velocityX: number;
  velocityY: number;
  spawnAtMs: number;
  lifetimeMs: number;
}

export interface MoonSatelliteFocus {
  x: number;
  y: number;
  visibility: number;
}

export class ParallaxField {
  private backdrop!: Phaser.GameObjects.Image;

  private edgeGlow!: Phaser.GameObjects.Graphics;

  private stars: DriftStar[] = [];

  private activeComets: PixelComet[] = [];

  private moonSatellite!: Phaser.GameObjects.Image;

  private moonSatelliteFocus: MoonSatelliteFocus = {
    x: WORLD_WIDTH * 0.5,
    y: WORLD_HEIGHT - 610,
    visibility: 0
  };

  private bottomGlow!: Phaser.GameObjects.Ellipse;

  private nextCometSpawnAtMs = 900;

  private lastElapsedMs = 0;

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

    if (state.elapsedMs < this.lastElapsedMs) {
      this.resetPixelComets();
    }
    this.lastElapsedMs = state.elapsedMs;

    this.updatePixelComets(state.elapsedMs, swayX, swayY);
  }

  getMoonSatelliteFocus(): MoonSatelliteFocus {
    return { ...this.moonSatelliteFocus };
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
    this.moonSatelliteFocus = {
      x: position.x,
      y: position.y,
      visibility: position.alpha
    };
  }

  private updatePixelComets(
    elapsedMs: number,
    swayX: number,
    swayY: number
  ): void {
    if (elapsedMs >= this.nextCometSpawnAtMs) {
      this.spawnPixelComet(elapsedMs);
      this.nextCometSpawnAtMs = elapsedMs + Phaser.Math.Between(2_800, 5_200);
    }

    this.activeComets = this.activeComets.filter((comet, index) => {
      const ageMs = elapsedMs - comet.spawnAtMs;

      if (ageMs >= comet.lifetimeMs) {
        comet.container.destroy();
        return false;
      }

      const ageSeconds = ageMs / 1000;
      const progress = ageMs / comet.lifetimeMs;
      const driftX = comet.startX + comet.velocityX * ageSeconds + swayX * 0.16;
      const driftY = comet.startY + comet.velocityY * ageSeconds + swayY * 0.08;
      const shimmer =
        0.82 + Math.max(0, Math.sin(ageSeconds * 8 + index)) * 0.18;
      const renderState = calculatePixelCometRenderState({
        driftY,
        progress,
        shimmer
      });

      if (!renderState.alive) {
        comet.container.destroy();
        return false;
      }

      comet.container.setPosition(driftX, driftY);
      comet.container.setScale(renderState.scale);
      comet.container.setAlpha(renderState.containerAlpha);

      comet.head.setAlpha(renderState.headAlpha);
      comet.head.setScale(1 + renderState.burnProgress * 0.35);
      comet.spark.setAlpha(renderState.sparkAlpha);
      comet.spark.setScale(1 + renderState.burnProgress * 1.2);
      comet.trail.forEach((segment, segmentIndex) => {
        segment.setScale(1 + renderState.burnProgress * 0.24);
        segment.setAlpha(
          Math.max(
            0.08,
            shimmer *
              (0.76 - segmentIndex * 0.075) *
              renderState.trailAlphaMultiplier
          )
        );
      });

      return true;
    });
  }

  private spawnPixelComet(elapsedMs: number): void {
    const routes = [
      {
        startX: -56,
        startY: Phaser.Math.Between(180, 660),
        velocityX: Phaser.Math.Between(250, 340),
        velocityY: Phaser.Math.Between(42, 88)
      },
      {
        startX: WORLD_WIDTH + 56,
        startY: Phaser.Math.Between(220, 720),
        velocityX: -Phaser.Math.Between(250, 340),
        velocityY: Phaser.Math.Between(36, 84)
      },
      {
        startX: Phaser.Math.Between(140, 940),
        startY: -56,
        velocityX: Phaser.Math.Between(-150, 150),
        velocityY: Phaser.Math.Between(260, 340)
      },
      {
        startX: Phaser.Math.Between(180, 900),
        startY: Phaser.Math.Between(240, 560),
        velocityX: Phaser.Math.Between(-270, -210),
        velocityY: Phaser.Math.Between(108, 170)
      }
    ];

    const route = Phaser.Utils.Array.GetRandom(routes);
    const container = this.scene.add
      .container(route.startX, route.startY)
      .setDepth(46)
      .setRotation(Math.atan2(route.velocityY, route.velocityX));

    const trail = [0, 1, 2, 3, 4, 5, 6].map((segmentIndex) =>
      this.scene.add
        .rectangle(
          -15 - segmentIndex * 8,
          0,
          Math.max(5, 13 - segmentIndex),
          segmentIndex < 2 ? 5 : 4,
          segmentIndex < 2 ? 0xffffff : 0xd9f5ff,
          0.72 - segmentIndex * 0.07
        )
        .setOrigin(0.5)
    );

    const head = this.scene.add
      .rectangle(0, 0, 10, 10, 0xffffff, 1)
      .setOrigin(0.5);
    head.setStrokeStyle(1, 0xe9fbff, 1);

    const spark = this.scene.add
      .rectangle(-7, 0, 7, 7, 0xf4fdff, 0.92)
      .setOrigin(0.5);

    container.add([...trail, spark, head]);
    container.setBlendMode(Phaser.BlendModes.SCREEN);

    const cometDistance = Math.max(WORLD_WIDTH, WORLD_HEIGHT) + 280;
    const velocityMagnitude = Math.hypot(route.velocityX, route.velocityY);
    const lifetimeMs = (cometDistance / velocityMagnitude) * 1000;

    this.activeComets.push({
      container,
      head,
      spark,
      trail,
      startX: route.startX,
      startY: route.startY,
      velocityX: route.velocityX,
      velocityY: route.velocityY,
      spawnAtMs: elapsedMs,
      lifetimeMs
    });
  }

  private resetPixelComets(): void {
    this.activeComets.forEach((comet) => {
      comet.container.destroy();
    });
    this.activeComets = [];
    this.nextCometSpawnAtMs = 900;
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
