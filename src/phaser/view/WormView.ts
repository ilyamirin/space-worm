import Phaser from "phaser";
import {
  WORM_ANCHOR_X,
  WORM_ANCHOR_Y,
  WORM_SEGMENTS
} from "../../game/simulation/config";
import type { WormState } from "../../game/types";
import {
  getWormHeadAppendagePose,
  type CurveAppendage
} from "./wormHeadAppendages";

export class WormView {
  private spineGlow: Phaser.GameObjects.Graphics;

  private segmentSprites: Phaser.GameObjects.Image[] = [];

  private head: Phaser.GameObjects.Image;

  private jawTop: Phaser.GameObjects.Image;

  private jawBottom: Phaser.GameObjects.Image;

  private headAura: Phaser.GameObjects.Ellipse;

  private biteFlash: Phaser.GameObjects.Ellipse;

  private appendageGlow: Phaser.GameObjects.Graphics;

  private appendageLines: Phaser.GameObjects.Graphics;

  private lanternHalo: Phaser.GameObjects.Ellipse;

  private lanternCore: Phaser.GameObjects.Ellipse;

  private previousTipX = WORM_ANCHOR_X;

  private previousTipY = WORM_ANCHOR_Y;

  private previousElapsedMs: number | null = null;

  constructor(scene: Phaser.Scene) {
    this.spineGlow = scene.add.graphics().setDepth(63);
    this.spineGlow.setBlendMode(Phaser.BlendModes.ADD);

    for (let index = 0; index < WORM_SEGMENTS; index += 1) {
      const segment = scene.add
        .image(WORM_ANCHOR_X, WORM_ANCHOR_Y, "worm-segment")
        .setDepth(65 + index * 0.2);
      this.segmentSprites.push(segment);
    }

    this.head = scene.add
      .image(WORM_ANCHOR_X, WORM_ANCHOR_Y, "worm-head")
      .setDepth(102);
    this.jawTop = scene.add
      .image(WORM_ANCHOR_X, WORM_ANCHOR_Y, "worm-jaw-top")
      .setDepth(103);
    this.jawBottom = scene.add
      .image(WORM_ANCHOR_X, WORM_ANCHOR_Y, "worm-jaw-bottom")
      .setDepth(103);
    this.headAura = scene.add
      .ellipse(WORM_ANCHOR_X, WORM_ANCHOR_Y, 164, 72, 0x8fffe5, 0.16)
      .setDepth(101);
    this.headAura.setBlendMode(Phaser.BlendModes.ADD);
    this.biteFlash = scene.add
      .ellipse(WORM_ANCHOR_X, WORM_ANCHOR_Y, 84, 84, 0xfff1c7, 0)
      .setDepth(104);
    this.biteFlash.setBlendMode(Phaser.BlendModes.ADD);

    this.appendageGlow = scene.add.graphics().setDepth(105);
    this.appendageGlow.setBlendMode(Phaser.BlendModes.ADD);
    this.appendageLines = scene.add.graphics().setDepth(106);

    this.lanternHalo = scene.add
      .ellipse(WORM_ANCHOR_X, WORM_ANCHOR_Y, 76, 76, 0xfff1c7, 0)
      .setDepth(107);
    this.lanternHalo.setBlendMode(Phaser.BlendModes.ADD);
    this.lanternCore = scene.add
      .ellipse(WORM_ANCHOR_X, WORM_ANCHOR_Y, 42, 42, 0xfff7dc, 0)
      .setDepth(108);
    this.lanternCore.setBlendMode(Phaser.BlendModes.ADD);
  }

  sync(worm: Readonly<WormState>, elapsedMs = worm.strikeElapsedMs): void {
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
    const iridescentPhase = Math.sin(
      worm.strikeElapsedMs * 0.014 + normalized * 6
    );
    const bodyWarm = Phaser.Display.Color.GetColor(
      230,
      172 + Math.floor((iridescentPhase + 1) * 22),
      108 + Math.floor((iridescentPhase + 1) * 26)
    );
    const bodyCool = Phaser.Display.Color.GetColor(
      128 + Math.floor((iridescentPhase + 1) * 22),
      210 + Math.floor((iridescentPhase + 1) * 18),
      225 + Math.floor((iridescentPhase + 1) * 14)
    );
    const bodyShadow = Phaser.Display.Color.GetColor(
      106,
      72 + Math.floor((iridescentPhase + 1) * 8),
      58 + Math.floor((iridescentPhase + 1) * 8)
    );
    const pulseAlpha =
      worm.attackPhase === "biting"
        ? 0.42
        : 0.14 + normalized * 0.12 + Math.max(0, iridescentPhase) * 0.08;
    const spinePoints: Array<{ x: number; y: number }> = [];

    this.segmentSprites.forEach((segment, index) => {
      const t = (index + 1) / this.segmentSprites.length;
      const x = Phaser.Math.Linear(worm.anchorX, worm.tipX, t);
      const y = Phaser.Math.Linear(worm.anchorY, worm.tipY, t);
      const wiggle =
        Math.sin(t * 11 + worm.strikeElapsedMs * 0.02) * 12 * normalized;
      const offsetX = Math.cos(heading + Math.PI / 2) * wiggle * (1 - t * 0.64);
      const offsetY = Math.sin(heading + Math.PI / 2) * wiggle * (1 - t * 0.64);
      const scaleX = 0.88 - t * 0.22;
      const scaleY = 0.42 - t * 0.15 + normalized * 0.04;
      const segmentX = x + offsetX;
      const segmentY = y + offsetY;

      segment.setPosition(segmentX, segmentY);
      segment.setRotation(
        heading + Math.sin(index * 0.6 + worm.strikeElapsedMs * 0.016) * 0.05
      );
      segment.setScale(scaleX, scaleY);
      segment.setAlpha(0.92 - t * 0.1);
      segment.setTint(bodyWarm, bodyCool, bodyWarm, bodyShadow);
      spinePoints.push({ x: segmentX, y: segmentY });
    });

    this.spineGlow.clear();
    this.spineGlow.lineStyle(
      worm.attackPhase === "biting" ? 18 : 14,
      0x8fffe5,
      pulseAlpha
    );
    this.spineGlow.beginPath();
    this.spineGlow.moveTo(worm.anchorX, worm.anchorY);
    spinePoints.forEach((point) => {
      this.spineGlow.lineTo(point.x, point.y);
    });
    this.spineGlow.strokePath();

    this.head.setPosition(worm.tipX, worm.tipY);
    this.head.setRotation(heading);
    this.head.setScale(0.94 + normalized * 0.08, 0.88 + normalized * 0.04);
    this.head.setTint(0xffd79f, 0xfff2c9, 0xffcc8e, 0x8a592e);

    const jawOpen =
      worm.attackPhase === "biting" ? 0.92 : 0.28 + normalized * 0.18;
    const forwardX = Math.cos(heading) * 28;
    const forwardY = Math.sin(heading) * 28;
    const spreadX = Math.cos(heading + Math.PI / 2) * 22;
    const spreadY = Math.sin(heading + Math.PI / 2) * 22;

    this.jawTop.setPosition(
      worm.tipX + forwardX - spreadX * 0.42,
      worm.tipY + forwardY - spreadY * 0.42
    );
    this.jawTop.setRotation(heading - jawOpen);
    this.jawTop.setScale(1.02 + normalized * 0.08, 1.02 + normalized * 0.08);
    this.jawTop.setTint(0x684126, 0xf2dbc3, 0x684126, 0x3b2314);

    this.jawBottom.setPosition(
      worm.tipX + forwardX + spreadX * 0.42,
      worm.tipY + forwardY + spreadY * 0.42
    );
    this.jawBottom.setRotation(heading + jawOpen);
    this.jawBottom.setScale(1.02 + normalized * 0.08, 1.02 + normalized * 0.08);
    this.jawBottom.setTint(0x5d3720, 0xf5e6d1, 0x5d3720, 0x3b2314);

    this.headAura.setPosition(
      worm.tipX - Math.cos(heading) * 8,
      worm.tipY - Math.sin(heading) * 8
    );
    this.headAura.setScale(0.9 + normalized * 0.5, 0.72 + normalized * 0.22);
    this.headAura.setFillStyle(
      worm.attackPhase === "biting" ? 0xffcc9d : 0x8fffe5,
      pulseAlpha
    );

    const flashAlpha =
      worm.attackPhase === "biting"
        ? 0.22 + Math.sin(worm.strikeElapsedMs * 0.05) * 0.06
        : 0;
    this.biteFlash.setPosition(
      worm.tipX + Math.cos(heading) * 28,
      worm.tipY + Math.sin(heading) * 28
    );
    this.biteFlash.setScale(0.7 + normalized * 0.8, 0.44 + normalized * 0.26);
    this.biteFlash.setFillStyle(0xfff7dc, Math.max(0, flashAlpha));

    this.syncAppendages(worm, heading, normalized, elapsedMs);
    this.previousTipX = worm.tipX;
    this.previousTipY = worm.tipY;
    this.previousElapsedMs = elapsedMs;
  }

  private syncAppendages(
    worm: Readonly<WormState>,
    heading: number,
    normalized: number,
    elapsedMs: number
  ): void {
    const deltaMs =
      this.previousElapsedMs === null
        ? 0
        : Math.max(16, elapsedMs - this.previousElapsedMs);
    const headVelocityX =
      deltaMs > 0 ? ((worm.tipX - this.previousTipX) / deltaMs) * 1000 : 0;
    const headVelocityY =
      deltaMs > 0 ? ((worm.tipY - this.previousTipY) / deltaMs) * 1000 : 0;
    const pose = getWormHeadAppendagePose({
      attackPhase: worm.attackPhase,
      elapsedMs,
      heading,
      headVelocityX,
      headVelocityY,
      normalizedReach: normalized,
      planetCenterX: worm.anchorX,
      planetCenterY: worm.anchorY,
      targetX: worm.targetX,
      targetY: worm.targetY,
      tipX: worm.tipX,
      tipY: worm.tipY
    });
    const biting = worm.attackPhase === "biting";

    this.appendageGlow.clear();
    this.appendageLines.clear();

    this.appendageGlow.lineStyle(28, 0xfff1c7, pose.lantern.glowAlpha * 0.34);
    this.drawCurve(this.appendageGlow, pose.lantern);
    pose.whiskers.forEach((whisker, index) => {
      this.appendageGlow.lineStyle(
        8.5 - (index % 3) * 0.8,
        index < 3 ? 0xfff1d5 : 0xb6c791,
        whisker.glowAlpha * 0.24
      );
      this.drawCurve(this.appendageGlow, whisker);
    });

    this.appendageLines.lineStyle(10, 0xfff1d5, 0.9);
    this.drawCurve(this.appendageLines, pose.lantern);
    pose.whiskers.forEach((whisker, index) => {
      this.appendageLines.lineStyle(
        4.6 - (index % 3) * 0.35,
        index < 3 ? 0xfff1d5 : 0xb6c791,
        0.82
      );
      this.drawCurve(this.appendageLines, whisker);
    });

    this.lanternHalo.setPosition(pose.lantern.end.x, pose.lantern.end.y);
    this.lanternHalo.setScale(biting ? 1.55 : 1.18, biting ? 1.55 : 1.18);
    this.lanternHalo.setFillStyle(0xfff1c7, pose.lantern.glowAlpha * 0.46);
    this.lanternCore.setPosition(pose.lantern.end.x, pose.lantern.end.y);
    this.lanternCore.setScale(biting ? 1.32 : 1.08);
    this.lanternCore.setFillStyle(0xfff7dc, 0.92);
  }

  private drawCurve(
    graphics: Phaser.GameObjects.Graphics,
    appendage: CurveAppendage
  ): void {
    graphics.beginPath();
    graphics.moveTo(appendage.root.x, appendage.root.y);
    for (let step = 1; step <= 8; step += 1) {
      const t = step / 8;
      const inverse = 1 - t;
      graphics.lineTo(
        inverse * inverse * appendage.root.x +
          2 * inverse * t * appendage.control.x +
          t * t * appendage.end.x,
        inverse * inverse * appendage.root.y +
          2 * inverse * t * appendage.control.y +
          t * t * appendage.end.y
      );
    }
    graphics.strokePath();
  }
}
