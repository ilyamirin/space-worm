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
  const extending = attackPhase === "extending";
  const biting = attackPhase === "biting";
  const sway = Math.sin(elapsedMs * 0.0032) * 7;
  const glowBase = biting ? 0.74 : 0.28 + reach * 0.22;
  const tip = { x: tipX, y: tipY };

  const lanternLength = 220 + reach * 68 + (extending ? 30 : 0);
  const lanternRoot = {
    x: tipX - forward.x * 44 + side.x * sideSign * 32,
    y: tipY - forward.y * 44 + side.y * sideSign * 32
  };
  const lanternEnd = {
    x: lanternRoot.x + aim.x * lanternLength + side.x * sideSign * (10 + sway),
    y: lanternRoot.y + aim.y * lanternLength + side.y * sideSign * (10 + sway)
  };
  const lanternControl = {
    x:
      lanternRoot.x +
      aim.x * (lanternLength * 0.46) +
      planetDirection.x * throwLag * 120 +
      side.x * sideSign * (54 + sway * 0.6),
    y:
      lanternRoot.y +
      aim.y * (lanternLength * 0.46) +
      planetDirection.y * throwLag * 120 +
      side.y * sideSign * (54 + sway * 0.6)
  };

  const whiskers = [-1, -1, -1, 1, 1, 1].map((whiskerSide, index) => {
    const row = index % 3;
    const length = 76 + row * 17 + reach * 10;
    const root = {
      x:
        tipX -
        forward.x * (44 + row * 9) +
        side.x * whiskerSide * (34 + row * 15),
      y:
        tipY -
        forward.y * (44 + row * 9) +
        side.y * whiskerSide * (34 + row * 15)
    };
    const direction = mixDirection(
      idleDirection,
      {
        x: forward.x * 0.78 + side.x * whiskerSide * (0.34 + row * 0.08),
        y: forward.y * 0.78 + side.y * whiskerSide * (0.34 + row * 0.08)
      },
      0.56
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
          direction.x * (length * 0.44) +
          planetDirection.x * throwLag * (92 + row * 18),
        y:
          root.y +
          direction.y * (length * 0.44) +
          planetDirection.y * throwLag * (92 + row * 18)
      },
      end,
      length,
      glowAlpha: Math.min(0.48, 0.18 + reach * 0.16 + throwLag * 0.12)
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
