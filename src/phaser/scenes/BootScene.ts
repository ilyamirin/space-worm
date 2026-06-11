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
      if (asset.url.endsWith(".svg")) {
        this.load.svg(asset.key, asset.url, { width: 512, height: 512 });
        return;
      }

      this.load.image(asset.key, asset.url);
    });

    ASSET_MANIFEST.audio.forEach((asset) => {
      this.load.audio(asset.key, asset.url);
    });
    this.load.json("audio-credits", "assets/data/audioCredits.json");
  }

  create(): void {
    this.scene.start("gameplay", { bridge: this.bridge });
  }
}
