import Phaser from "phaser";
import type { GameState } from "../../game/types";
import { WORLD_HEIGHT, WORLD_WIDTH } from "../../game/simulation/config";

interface LayerConfig {
  speed: number;
  depth: number;
  sprites: Phaser.GameObjects.Image[];
}

interface TwinkleStar {
  star: Phaser.GameObjects.Ellipse;
  baseX: number;
  baseY: number;
  amplitude: number;
  speed: number;
  phase: number;
  driftFactor: number;
}

interface HazeBand {
  band: Phaser.GameObjects.Ellipse;
  baseX: number;
  baseY: number;
  scale: number;
  speed: number;
  driftFactor: number;
}

interface DustMote {
  mote: Phaser.GameObjects.Ellipse;
  baseX: number;
  baseY: number;
  sway: number;
  speed: number;
  phase: number;
}

export class ParallaxField {
  private layers: LayerConfig[] = [];

  private farStars: TwinkleStar[] = [];

  private nearStars: TwinkleStar[] = [];

  private hazeBands: HazeBand[] = [];

  private dustMotes: DustMote[] = [];

  private constellationLines!: Phaser.GameObjects.Graphics;

  private auroraStrands!: Phaser.GameObjects.Graphics;

  private bottomGlow!: Phaser.GameObjects.Ellipse;

  constructor(private scene: Phaser.Scene) {
    this.createBackdrop();
  }

  update(state: Readonly<GameState>): void {
    const elapsed = state.elapsedMs * 0.001;
    const swayX = Math.sin(elapsed * 0.32) * 22;
    const swayY = Math.cos(elapsed * 0.27) * 14;

    this.updateStars(this.farStars, elapsed, swayX * 0.42, swayY * 0.24);
    this.updateStars(this.nearStars, elapsed, swayX * 0.68, swayY * 0.4);
    this.updateHaze(elapsed, swayX, swayY);
    this.updateConstellations(elapsed);
    this.updateLayers(elapsed, swayX, swayY);
    this.updateDustMotes(elapsed, swayX, swayY);

    this.bottomGlow.setPosition(
      WORLD_WIDTH * 0.5 + swayX * 0.14,
      WORLD_HEIGHT - 206 + swayY * 0.08
    );
    this.bottomGlow.setScale(
      1 + Math.sin(elapsed * 0.34) * 0.06,
      1 + Math.cos(elapsed * 0.21) * 0.04
    );
  }

  private updateStars(
    stars: TwinkleStar[],
    elapsed: number,
    swayX: number,
    swayY: number
  ): void {
    stars.forEach((entry) => {
      const twinkle =
        0.55 + Math.sin(elapsed * entry.speed + entry.phase) * entry.amplitude;
      entry.star.setPosition(
        entry.baseX + swayX * entry.driftFactor,
        entry.baseY + swayY * entry.driftFactor
      );
      entry.star.setAlpha(Phaser.Math.Clamp(twinkle, 0.16, 0.95));
      entry.star.setScale(
        1 +
          Math.max(0, Math.sin(elapsed * (entry.speed * 0.8) + entry.phase)) *
            0.28
      );
    });
  }

  private updateHaze(elapsed: number, swayX: number, swayY: number): void {
    this.hazeBands.forEach((entry, index) => {
      const pulse = 1 + Math.sin(elapsed * entry.speed + index) * 0.06;
      entry.band.setPosition(
        entry.baseX + swayX * entry.driftFactor,
        entry.baseY + swayY * (entry.driftFactor * 0.5)
      );
      entry.band.setScale(entry.scale * pulse, pulse);
      entry.band.setAlpha(
        0.16 + Math.max(0, Math.sin(elapsed * entry.speed + index)) * 0.1
      );
    });
  }

  private updateConstellations(elapsed: number): void {
    this.constellationLines.clear();
    this.constellationLines.lineStyle(2, 0xbfdfff, 0.12);

    const clusters = [
      [
        [122, 202],
        [236, 254],
        [332, 186],
        [440, 238],
        [528, 176]
      ],
      [
        [734, 188],
        [826, 264],
        [918, 206],
        [988, 288],
        [868, 340]
      ]
    ];

    clusters.forEach((cluster, clusterIndex) => {
      const driftX = Math.sin(elapsed * 0.26 + clusterIndex * 0.8) * 8;
      const driftY = Math.cos(elapsed * 0.21 + clusterIndex * 0.5) * 4;
      this.constellationLines.beginPath();
      cluster.forEach(([x, y], pointIndex) => {
        const px = x + driftX + Math.sin(elapsed + pointIndex) * 2;
        const py = y + driftY + Math.cos(elapsed * 0.9 + pointIndex) * 2;
        if (pointIndex === 0) {
          this.constellationLines.moveTo(px, py);
        } else {
          this.constellationLines.lineTo(px, py);
        }
      });
      this.constellationLines.strokePath();
    });

    this.auroraStrands.clear();
    this.auroraStrands.lineStyle(6, 0x7be7ff, 0.08);
    this.drawQuadraticPath(
      this.auroraStrands,
      -40,
      970 + Math.sin(elapsed * 0.45) * 20,
      280,
      870 + Math.cos(elapsed * 0.36) * 24,
      560,
      940 + Math.sin(elapsed * 0.32) * 18
    );
    this.drawQuadraticPath(
      this.auroraStrands,
      560,
      940 + Math.sin(elapsed * 0.32) * 18,
      840,
      1010 + Math.sin(elapsed * 0.28) * 20,
      WORLD_WIDTH + 40,
      930 + Math.cos(elapsed * 0.41) * 20
    );

    this.auroraStrands.lineStyle(3, 0xffb4dd, 0.06);
    this.drawQuadraticPath(
      this.auroraStrands,
      -30,
      1090 + Math.cos(elapsed * 0.3) * 16,
      300,
      1170 + Math.sin(elapsed * 0.27) * 18,
      610,
      1080 + Math.cos(elapsed * 0.33) * 14
    );
    this.drawQuadraticPath(
      this.auroraStrands,
      610,
      1080 + Math.cos(elapsed * 0.33) * 14,
      870,
      1010 + Math.sin(elapsed * 0.23) * 16,
      WORLD_WIDTH + 30,
      1060 + Math.cos(elapsed * 0.37) * 18
    );
  }

  private updateLayers(elapsed: number, swayX: number, swayY: number): void {
    this.layers.forEach((layer, layerIndex) => {
      layer.sprites.forEach((sprite, spriteIndex) => {
        const baseX = sprite.getData("baseX") as number;
        const baseY = sprite.getData("baseY") as number;
        const amplitude = sprite.getData("amplitude") as number;
        const wobble = sprite.getData("wobble") as number;
        const drift = elapsed * layer.speed * 32;

        sprite.setPosition(
          baseX +
            swayX * (0.12 + layerIndex * 0.08) +
            Math.sin(elapsed * wobble + spriteIndex) * amplitude,
          baseY +
            swayY * (0.1 + layerIndex * 0.06) +
            Math.cos(elapsed * (wobble * 0.8) + spriteIndex) *
              (amplitude * 0.35) +
            drift * 0.04
        );

        sprite.setRotation(
          Math.sin(elapsed * 0.18 + spriteIndex + layer.speed) * 0.022
        );
        sprite.setScale(
          (sprite.getData("baseScale") as number) *
            (1 + Math.sin(elapsed * 0.22 + spriteIndex) * 0.02)
        );
        sprite.setDepth(layer.depth + layerIndex * 4);
      });
    });
  }

  private updateDustMotes(elapsed: number, swayX: number, swayY: number): void {
    this.dustMotes.forEach((entry, index) => {
      const driftX =
        Math.sin(elapsed * entry.speed + entry.phase) * entry.sway +
        swayX * 0.22;
      const driftY =
        Math.cos(elapsed * (entry.speed * 0.7) + entry.phase) *
          (entry.sway * 0.4) +
        swayY * 0.12;
      entry.mote.setPosition(entry.baseX + driftX, entry.baseY + driftY);
      entry.mote.setAlpha(
        0.08 + Math.max(0, Math.sin(elapsed * entry.speed + index)) * 0.14
      );
      entry.mote.setScale(
        1 +
          Math.max(0, Math.cos(elapsed * (entry.speed * 0.85) + entry.phase)) *
            0.24
      );
    });
  }

  private createBackdrop(): void {
    this.scene.add
      .rectangle(
        WORLD_WIDTH / 2,
        WORLD_HEIGHT / 2,
        WORLD_WIDTH,
        WORLD_HEIGHT,
        0x050b14
      )
      .setDepth(-260);

    this.scene.add
      .ellipse(280, 210, 650, 420, 0x1b3655, 0.34)
      .setDepth(-250)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    this.scene.add
      .ellipse(888, 382, 540, 440, 0x24466f, 0.28)
      .setDepth(-249)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    this.scene.add
      .ellipse(530, 1180, 900, 720, 0x162d3d, 0.2)
      .setDepth(-248)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    this.scene.add
      .ellipse(790, 1310, 780, 540, 0x5b214a, 0.08)
      .setDepth(-247)
      .setBlendMode(Phaser.BlendModes.SCREEN);

    this.constellationLines = this.scene.add.graphics().setDepth(-218);
    this.auroraStrands = this.scene.add.graphics().setDepth(-214);

    this.createStarField(
      86,
      this.farStars,
      -236,
      [0xcde8ff, 0xfef6dd, 0xbbe5ff]
    );
    this.createStarField(
      34,
      this.nearStars,
      -230,
      [0xfaf4d4, 0xd7efff, 0xfcd6f1]
    );

    this.createHazeBands();

    const layerPlanet = this.scene.add
      .image(856, 482, "planet-home")
      .setAlpha(0.94)
      .setScale(1.26);
    const layerConstellationA = this.scene.add
      .image(284, 404, "constellation-glyph")
      .setAlpha(0.24)
      .setScale(0.94);
    const layerConstellationB = this.scene.add
      .image(854, 244, "constellation-glyph")
      .setAlpha(0.18)
      .setScale(0.62)
      .setFlipX(true);
    const layerStationA = this.scene.add
      .image(164, 662, "station-spire")
      .setAlpha(0.44)
      .setScale(0.96);
    const layerStationB = this.scene.add
      .image(958, 902, "station-spire")
      .setAlpha(0.3)
      .setScale(0.7)
      .setFlipX(true);
    const layerCometA = this.scene.add
      .image(206, 290, "comet-tail")
      .setAlpha(0.58)
      .setScale(1);
    const layerCometB = this.scene.add
      .image(888, 1030, "comet-tail")
      .setAlpha(0.42)
      .setScale(0.82)
      .setFlipY(true);
    const layerDustA = this.scene.add
      .image(146, 1248, "dust-rock")
      .setAlpha(0.56)
      .setScale(0.98);
    const layerDustB = this.scene.add
      .image(910, 1364, "dust-rock")
      .setAlpha(0.62)
      .setScale(0.86)
      .setFlipX(true);

    this.layers = [
      this.prepareLayer(0.08, -208, [layerConstellationA, layerConstellationB]),
      this.prepareLayer(0.16, -198, [layerPlanet]),
      this.prepareLayer(0.24, -188, [layerStationA, layerStationB]),
      this.prepareLayer(0.34, -178, [layerCometA, layerCometB]),
      this.prepareLayer(0.48, -160, [layerDustA, layerDustB])
    ];

    this.bottomGlow = this.scene.add
      .ellipse(WORLD_WIDTH * 0.5, WORLD_HEIGHT - 206, 840, 260, 0x4af0cf, 0.08)
      .setDepth(62)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.createDustMotes();
  }

  private createStarField(
    count: number,
    target: TwinkleStar[],
    depth: number,
    palette: number[]
  ): void {
    for (let index = 0; index < count; index += 1) {
      const color = palette[index % palette.length];
      const star = this.scene.add
        .ellipse(
          Math.random() * WORLD_WIDTH,
          Math.random() * WORLD_HEIGHT * 0.82,
          Math.random() > 0.82 ? 5 : 3,
          Math.random() > 0.82 ? 5 : 3,
          color,
          0.35 + Math.random() * 0.4
        )
        .setDepth(depth + Math.random() * 4);
      star.setBlendMode(Phaser.BlendModes.SCREEN);

      target.push({
        star,
        baseX: star.x,
        baseY: star.y,
        amplitude: 0.12 + Math.random() * 0.22,
        speed: 0.5 + Math.random() * 1.4,
        phase: Math.random() * Math.PI * 2,
        driftFactor: 0.14 + Math.random() * 0.5
      });
    }
  }

  private createHazeBands(): void {
    const configs = [
      { x: 220, y: 846, width: 580, height: 220, color: 0x64dff8, scale: 1 },
      {
        x: 860,
        y: 1188,
        width: 620,
        height: 260,
        color: 0xffa0d5,
        scale: 0.94
      },
      { x: 520, y: 650, width: 760, height: 280, color: 0xa0f3cf, scale: 0.88 }
    ];

    configs.forEach((config, index) => {
      const band = this.scene.add
        .ellipse(
          config.x,
          config.y,
          config.width,
          config.height,
          config.color,
          0.16
        )
        .setDepth(-224 + index)
        .setBlendMode(Phaser.BlendModes.SCREEN);
      this.hazeBands.push({
        band,
        baseX: config.x,
        baseY: config.y,
        scale: config.scale,
        speed: 0.16 + index * 0.08,
        driftFactor: 0.18 + index * 0.1
      });
    });
  }

  private createDustMotes(): void {
    for (let index = 0; index < 18; index += 1) {
      const mote = this.scene.add
        .ellipse(
          60 + Math.random() * (WORLD_WIDTH - 120),
          980 + Math.random() * 760,
          12 + Math.random() * 24,
          6 + Math.random() * 12,
          index % 3 === 0 ? 0xffd8a6 : 0x8bf0ff,
          0.12
        )
        .setDepth(60 + index * 0.1)
        .setBlendMode(Phaser.BlendModes.SCREEN);

      this.dustMotes.push({
        mote,
        baseX: mote.x,
        baseY: mote.y,
        sway: 8 + Math.random() * 16,
        speed: 0.22 + Math.random() * 0.32,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  private prepareLayer(
    speed: number,
    depth: number,
    sprites: Phaser.GameObjects.Image[]
  ): LayerConfig {
    sprites.forEach((sprite) => {
      sprite.setDepth(depth);
      sprite.setData("baseX", sprite.x);
      sprite.setData("baseY", sprite.y);
      sprite.setData("baseScale", sprite.scaleX);
      sprite.setData("amplitude", 8 + Math.random() * 18);
      sprite.setData("wobble", 0.16 + Math.random() * 0.24);
      sprite.setBlendMode(Phaser.BlendModes.SCREEN);
    });

    return { speed, depth, sprites };
  }

  private drawQuadraticPath(
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
    const points = curve.getPoints(18);

    graphics.beginPath();
    graphics.moveTo(startX, startY);
    points.forEach((point) => {
      graphics.lineTo(point.x, point.y);
    });
    graphics.strokePath();
  }
}
