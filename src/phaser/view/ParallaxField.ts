import Phaser from "phaser";
import type { GameState } from "../../game/types";
import { WORLD_HEIGHT, WORLD_WIDTH } from "../../game/simulation/config";

interface LayerConfig {
  speed: number;
  sprites: Phaser.GameObjects.Image[];
}

export class ParallaxField {
  private layers: LayerConfig[] = [];

  constructor(private scene: Phaser.Scene) {
    this.createBackdrop();
  }

  update(state: Readonly<GameState>): void {
    const elapsed = state.elapsedMs * 0.001;
    const swayX = Math.sin(elapsed * 0.5) * 18;
    const swayY = Math.cos(elapsed * 0.4) * 10;

    this.layers.forEach((layer, index) => {
      layer.sprites.forEach((sprite, spriteIndex) => {
        const drift = elapsed * layer.speed * 60;
        const baseX = sprite.getData("baseX") as number;
        const baseY = sprite.getData("baseY") as number;
        const amplitude = sprite.getData("amplitude") as number;

        sprite.x =
          baseX +
          swayX * (0.1 + index * 0.08) +
          Math.sin(elapsed + spriteIndex) * amplitude;
        sprite.y = baseY + swayY * (0.08 + index * 0.06) + drift * 0.06;
      });
    });
  }

  private createBackdrop(): void {
    const gradient = this.scene.add.rectangle(
      WORLD_WIDTH / 2,
      WORLD_HEIGHT / 2,
      WORLD_WIDTH,
      WORLD_HEIGHT,
      0x07111d
    );
    gradient.setDepth(-200);

    const starfield = this.scene.add.graphics();
    starfield.setDepth(-190);
    for (let i = 0; i < 120; i += 1) {
      const alpha = 0.25 + Math.random() * 0.55;
      const size = Math.random() > 0.9 ? 4 : 2;
      starfield.fillStyle(0xeef6ff, alpha);
      starfield.fillCircle(
        Math.random() * WORLD_WIDTH,
        Math.random() * WORLD_HEIGHT * 0.92,
        size
      );
    }

    const layerPlanet = this.scene.add
      .image(840, 520, "planet-home")
      .setScale(1.12);
    const layerConstellationA = this.scene.add
      .image(250, 450, "constellation-glyph")
      .setAlpha(0.32)
      .setScale(0.85);
    const layerConstellationB = this.scene.add
      .image(860, 210, "constellation-glyph")
      .setAlpha(0.24)
      .setScale(0.55)
      .setFlipX(true);
    const layerStationA = this.scene.add
      .image(200, 680, "station-spire")
      .setAlpha(0.66)
      .setScale(0.8);
    const layerStationB = this.scene.add
      .image(950, 880, "station-spire")
      .setAlpha(0.48)
      .setScale(0.6)
      .setFlipX(true);
    const layerCometA = this.scene.add
      .image(240, 310, "comet-tail")
      .setAlpha(0.6)
      .setScale(0.9);
    const layerCometB = this.scene.add
      .image(870, 980, "comet-tail")
      .setAlpha(0.45)
      .setScale(0.75)
      .setFlipY(true);
    const layerDustA = this.scene.add
      .image(170, 1220, "dust-rock")
      .setAlpha(0.45)
      .setScale(0.85);
    const layerDustB = this.scene.add
      .image(880, 1330, "dust-rock")
      .setAlpha(0.52)
      .setScale(0.74)
      .setFlipX(true);

    this.layers = [
      this.prepareLayer(0.12, [layerConstellationA, layerConstellationB]),
      this.prepareLayer(0.18, [layerPlanet]),
      this.prepareLayer(0.24, [layerStationA, layerStationB]),
      this.prepareLayer(0.38, [layerCometA, layerCometB]),
      this.prepareLayer(0.5, [layerDustA, layerDustB])
    ];
  }

  private prepareLayer(
    speed: number,
    sprites: Phaser.GameObjects.Image[]
  ): LayerConfig {
    sprites.forEach((sprite) => {
      sprite.setDepth(-160 + speed * 100);
      sprite.setData("baseX", sprite.x);
      sprite.setData("baseY", sprite.y);
      sprite.setData("amplitude", 8 + Math.random() * 20);
    });

    return { speed, sprites };
  }
}
