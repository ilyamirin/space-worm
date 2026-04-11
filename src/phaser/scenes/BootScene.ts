import Phaser from "phaser";
import { ASSET_MANIFEST } from "../../game/assets/manifest";

export class BootScene extends Phaser.Scene {
  private bridge?: unknown;

  constructor() {
    super("boot");
  }

  init(data: { bridge?: unknown }): void {
    this.bridge = data.bridge ?? this.registry.get("bridge");
  }

  preload(): void {
    ASSET_MANIFEST.images.forEach((asset) => {
      this.load.svg(asset.key, asset.url, { width: 512, height: 512 });
    });

    this.load.audio("music-loop", ASSET_MANIFEST.audio[0].url);
    this.load.audio("sfx-bite", ASSET_MANIFEST.audio[1].url);
    this.load.audio("sfx-miss", ASSET_MANIFEST.audio[2].url);
    this.load.json("audio-credits", "assets/data/audioCredits.json");
  }

  create(): void {
    this.scene.start("gameplay", { bridge: this.bridge });
  }
}
