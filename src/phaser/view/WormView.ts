import Phaser from "phaser";
import type { WormState } from "../../game/types";

export class WormView {
  private segmentSprites: Phaser.GameObjects.Image[] = [];

  private head: Phaser.GameObjects.Image;

  private jawTop: Phaser.GameObjects.Image;

  private jawBottom: Phaser.GameObjects.Image;

  private lair: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene) {
    this.lair = scene.add.image(540, 1600, "asteroid-lair").setDepth(90);

    for (let index = 0; index < 18; index += 1) {
      const segment = scene.add
        .image(540, 1500, "worm-segment")
        .setDepth(65 + index * 0.2);
      this.segmentSprites.push(segment);
    }

    this.head = scene.add.image(540, 1500, "worm-head").setDepth(102);
    this.jawTop = scene.add.image(540, 1500, "worm-jaw-top").setDepth(103);
    this.jawBottom = scene.add
      .image(540, 1500, "worm-jaw-bottom")
      .setDepth(103);
  }

  sync(worm: Readonly<WormState>): void {
    const heading = Phaser.Math.Angle.Between(
      worm.anchorX,
      worm.anchorY,
      worm.tipX,
      worm.tipY
    );
    const distance = Math.hypot(
      worm.tipX - worm.anchorX,
      worm.tipY - worm.anchorY
    );
    const normalized = worm.maxReachPx > 0 ? distance / worm.maxReachPx : 0;

    this.segmentSprites.forEach((segment, index) => {
      const t = (index + 1) / this.segmentSprites.length;
      const x = Phaser.Math.Linear(worm.anchorX, worm.tipX, t);
      const y = Phaser.Math.Linear(worm.anchorY, worm.tipY, t);
      const wiggle =
        Math.sin(t * 10 + worm.strikeElapsedMs * 0.025) * 18 * normalized;
      const offsetX = Math.cos(heading + Math.PI / 2) * wiggle * (1 - t * 0.7);
      const offsetY = Math.sin(heading + Math.PI / 2) * wiggle * (1 - t * 0.7);

      segment.setPosition(x + offsetX, y + offsetY);
      segment.setRotation(
        heading + Math.sin(index + worm.strikeElapsedMs * 0.02) * 0.05
      );
      segment.setScale(1.08 - t * 0.28);
    });

    this.head.setPosition(worm.tipX, worm.tipY);
    this.head.setRotation(heading);
    this.head.setScale(1 + normalized * 0.08);

    const jawOpen =
      worm.attackPhase === "biting" ? 0.4 : 0.14 + normalized * 0.18;
    this.jawTop.setPosition(worm.tipX, worm.tipY - 8);
    this.jawTop.setRotation(heading - jawOpen);

    this.jawBottom.setPosition(worm.tipX, worm.tipY + 8);
    this.jawBottom.setRotation(heading + jawOpen);

    this.lair.setRotation(Math.sin(worm.strikeElapsedMs * 0.006) * 0.015);
  }
}
