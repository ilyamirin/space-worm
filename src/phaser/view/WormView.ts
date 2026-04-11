import Phaser from "phaser";
import { WORM_SEGMENTS } from "../../game/simulation/config";
import type { WormState } from "../../game/types";

export class WormView {
  private segmentSprites: Phaser.GameObjects.Image[] = [];

  private head: Phaser.GameObjects.Image;

  private jawTop: Phaser.GameObjects.Image;

  private jawBottom: Phaser.GameObjects.Image;

  private lair: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene) {
    this.lair = scene.add.image(540, 1600, "asteroid-lair").setDepth(90);

    for (let index = 0; index < WORM_SEGMENTS; index += 1) {
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
      Math.abs(worm.tipX - worm.anchorX) < 2 ? worm.targetX : worm.tipX,
      Math.abs(worm.tipY - worm.anchorY) < 2 ? worm.targetY : worm.tipY
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
        Math.sin(t * 11 + worm.strikeElapsedMs * 0.02) * 10 * normalized;
      const offsetX = Math.cos(heading + Math.PI / 2) * wiggle * (1 - t * 0.64);
      const offsetY = Math.sin(heading + Math.PI / 2) * wiggle * (1 - t * 0.64);
      const scaleX = 0.84 - t * 0.18;
      const scaleY = 0.56 - t * 0.2;

      segment.setPosition(x + offsetX, y + offsetY);
      segment.setRotation(
        heading + Math.sin(index * 0.6 + worm.strikeElapsedMs * 0.016) * 0.04
      );
      segment.setScale(scaleX, scaleY);
    });

    this.head.setPosition(worm.tipX, worm.tipY);
    this.head.setRotation(heading);
    this.head.setScale(0.88 + normalized * 0.04, 0.82 + normalized * 0.03);

    const jawOpen =
      worm.attackPhase === "biting" ? 0.78 : 0.22 + normalized * 0.12;
    const forwardX = Math.cos(heading) * 22;
    const forwardY = Math.sin(heading) * 22;
    const spreadX = Math.cos(heading + Math.PI / 2) * 18;
    const spreadY = Math.sin(heading + Math.PI / 2) * 18;

    this.jawTop.setPosition(
      worm.tipX + forwardX - spreadX * 0.34,
      worm.tipY + forwardY - spreadY * 0.34
    );
    this.jawTop.setRotation(heading - jawOpen);
    this.jawTop.setScale(0.96, 0.96);

    this.jawBottom.setPosition(
      worm.tipX + forwardX + spreadX * 0.34,
      worm.tipY + forwardY + spreadY * 0.34
    );
    this.jawBottom.setRotation(heading + jawOpen);
    this.jawBottom.setScale(0.96, 0.96);

    this.lair.setRotation(Math.sin(worm.strikeElapsedMs * 0.006) * 0.015);
  }
}
