import type { WormAttackPhase } from "../../game/types";

export interface Point {
  x: number;
  y: number;
}

interface WormHeadAppendageInput {
  attackPhase: WormAttackPhase;
  elapsedMs: number;
  heading: number;
  headVelocityX: number;
  headVelocityY: number;
  normalizedReach: number;
  planetCenterX: number;
  planetCenterY: number;
  targetX: number;
  targetY: number;
  tipX: number;
  tipY: number;
}

export interface CurveAppendage {
  root: Point;
  control: Point;
  end: Point;
  length: number;
  glowAlpha: number;
}

export interface WormHeadAppendagePose {
  lantern: CurveAppendage;
  whiskers: CurveAppendage[];
  tip: Point;
}

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const normalize = (x: number, y: number): Point => {
  const length = Math.hypot(x, y);
  if (length < 0.001) {
    return { x: 1, y: 0 };
  }
  return { x: x / length, y: y / length };
};

const mixDirection = (from: Point, to: Point, targetWeight: number): Point =>
  normalize(
    from.x * (1 - targetWeight) + to.x * targetWeight,
    from.y * (1 - targetWeight) + to.y * targetWeight
  );

export function getWormHeadAppendagePose({
  attackPhase,
  elapsedMs,
  heading,
  headVelocityX,
  headVelocityY,
  normalizedReach,
  planetCenterX,
  planetCenterY,
  targetX,
  targetY,
  tipX,
  tipY
}: WormHeadAppendageInput): WormHeadAppendagePose {
  const reach = clamp01(normalizedReach);
  const forward = { x: Math.cos(heading), y: Math.sin(heading) };
  const worldUp = { x: 0, y: -1 };
  const side = {
    x: Math.cos(heading + Math.PI / 2),
    y: Math.sin(heading + Math.PI / 2)
  };
  const targetDirection = normalize(targetX - tipX, targetY - tipY);
  const planetDirection = normalize(planetCenterX - tipX, planetCenterY - tipY);
  const idleDirection = mixDirection(forward, worldUp, 0.82);
  const targetAim = mixDirection(forward, targetDirection, 0.72);
  const speed = Math.hypot(headVelocityX, headVelocityY);
  const throwLag =
    clamp01(speed / 1800) * (attackPhase === "extending" ? 1 : 0.62);
  const aim =
    attackPhase === "idle" || attackPhase === "recovering"
      ? idleDirection
      : mixDirection(targetAim, planetDirection, throwLag * 0.18);
  const sideSign =
    forward.x * targetDirection.y - forward.y * targetDirection.x >= 0 ? 1 : -1;
  const biting = attackPhase === "biting";
  const sway = Math.sin(elapsedMs * 0.0032) * 7;
  const glowBase = biting ? 0.74 : 0.28 + reach * 0.22;
  const tip = { x: tipX, y: tipY };

  const lanternLength = 464 + reach * 96;
  const retraction =
    attackPhase === "idle"
      ? 1
      : attackPhase === "recovering"
        ? 0.78
        : attackPhase === "retracting"
          ? 0.32
          : biting
            ? 0.1
            : 0.24 + (1 - throwLag) * 0.06;
  const visibleLanternLength = lanternLength * retraction;
  const lanternRoot = {
    x: tipX - forward.x * 62 + side.x * sideSign * 18,
    y: tipY - forward.y * 62 + side.y * sideSign * 18
  };
  const lanternEnd = {
    x:
      lanternRoot.x +
      aim.x * visibleLanternLength +
      side.x *
        sideSign *
        (attackPhase === "idle" ? 64 + sway : 28 + sway * 0.7) -
      headVelocityX * throwLag * 0.014,
    y:
      lanternRoot.y +
      aim.y * visibleLanternLength +
      side.y *
        sideSign *
        (attackPhase === "idle" ? 64 + sway : 28 + sway * 0.7) -
      headVelocityY * throwLag * 0.014
  };
  const foldTowardBody =
    attackPhase === "idle" ? 0 : (0.55 + throwLag * 0.45) * 220;
  const bendWidth = attackPhase === "idle" ? 280 : biting ? 76 : 104;
  const lanternControl = {
    x:
      lanternRoot.x +
      aim.x * (visibleLanternLength * 0.34) +
      planetDirection.x * foldTowardBody +
      side.x * sideSign * (bendWidth + sway),
    y:
      lanternRoot.y +
      aim.y * (visibleLanternLength * 0.34) +
      planetDirection.y * foldTowardBody +
      side.y * sideSign * (bendWidth + sway)
  };

  const whiskers = [-1, -1, -1, 1, 1, 1].map((whiskerSide, index) => {
    const row = index % 3;
    const length = 70 + row * 18 + reach * 10;
    const root = {
      x:
        tipX +
        forward.x * (24 + row * 12) +
        side.x * whiskerSide * (25 + row * 9),
      y:
        tipY +
        forward.y * (24 + row * 12) +
        side.y * whiskerSide * (25 + row * 9)
    };
    const direction = normalize(
      forward.x * (0.38 + row * 0.08) +
        side.x * whiskerSide * (0.9 - row * 0.12),
      forward.y * (0.38 + row * 0.08) +
        side.y * whiskerSide * (0.9 - row * 0.12)
    );
    const localSway =
      Math.sin(elapsedMs * (0.004 + row * 0.0005) + index * 1.3) * 6;
    const end = {
      x: root.x + direction.x * length + side.x * whiskerSide * localSway,
      y: root.y + direction.y * length + side.y * whiskerSide * localSway
    };

    return {
      root,
      control: {
        x:
          root.x +
          direction.x * (length * 0.46) +
          planetDirection.x * throwLag * (72 + row * 18),
        y:
          root.y +
          direction.y * (length * 0.46) +
          planetDirection.y * throwLag * (72 + row * 18)
      },
      end,
      length,
      glowAlpha: Math.min(0.34, 0.12 + reach * 0.08 + throwLag * 0.08)
    };
  });

  return {
    lantern: {
      root: lanternRoot,
      control: lanternControl,
      end: lanternEnd,
      length: lanternLength,
      glowAlpha: Math.min(0.9, glowBase + 0.08)
    },
    whiskers,
    tip
  };
}
