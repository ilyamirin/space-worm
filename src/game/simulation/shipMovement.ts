import type { ShipInstance } from "../types";

export interface ShipPosition {
  x: number;
  y: number;
  velocityX: number;
}

const SECOND = 1000;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function smoothStep(value: number): number {
  const clamped = clamp01(value);
  return clamped * clamped * (3 - 2 * clamped);
}

export function calculateShipPosition(ship: ShipInstance): ShipPosition {
  const ageSeconds = ship.ageMs / SECOND;
  const forward = ship.speed * ageSeconds;
  const baseX = ship.spawnX + ship.direction * forward;
  const wave = Math.sin(ageSeconds * 2.2 + ship.movementPhase);
  const slowWave = Math.sin(ageSeconds * 1.25 + ship.movementPhase);

  switch (ship.movementPattern) {
    case "sine":
      return {
        x: baseX,
        y: ship.spawnY + wave * 32,
        velocityX: ship.speed * ship.direction
      };
    case "arc":
      return {
        x: baseX,
        y: ship.spawnY + Math.sin(ageSeconds * 1.45 + ship.movementPhase) * 44,
        velocityX: ship.speed * ship.direction
      };
    case "sCurve":
      return {
        x: baseX,
        y: ship.spawnY + Math.sin(ageSeconds * 1.8 + ship.movementPhase) * 58,
        velocityX: ship.speed * ship.direction
      };
    case "dashStop": {
      const cycle = 1.55;
      const cycleProgress = (ageSeconds + ship.movementPhase * 0.11) % cycle;
      const dashProgress = cycleProgress < 0.72 ? cycleProgress / 0.72 : 1;
      const cycleCount = Math.floor(
        (ageSeconds + ship.movementPhase * 0.11) / cycle
      );
      const cycleDistance = ship.speed * 1.05;
      const x =
        ship.spawnX +
        ship.direction *
          (cycleCount * cycleDistance + dashProgress * cycleDistance);

      return {
        x,
        y: ship.spawnY + Math.sin(ageSeconds * 3.4 + ship.movementPhase) * 18,
        velocityX: cycleProgress < 0.72 ? ship.speed * 1.45 * ship.direction : 0
      };
    }
    case "wideSCurve":
      return {
        x: baseX,
        y: ship.spawnY + slowWave * 78,
        velocityX: ship.speed * ship.direction
      };
    case "zigzagBlink": {
      const cycle = 1.35;
      const cycleProgress = (ageSeconds + ship.movementPhase * 0.07) % cycle;
      const blinkOffset =
        cycleProgress > 0.74 && cycleProgress < 0.9 ? ship.direction * 52 : 0;
      const zigzag = cycleProgress < cycle / 2 ? -46 : 46;

      return {
        x: baseX + blinkOffset,
        y: ship.spawnY + zigzag,
        velocityX: ship.speed * ship.direction
      };
    }
    case "sidestepClamp": {
      const cycle = 1.08;
      const phasedAge = ageSeconds + ship.movementPhase * 0.09;
      const cycleProgress = phasedAge % cycle;
      const stepIndex = Math.floor(phasedAge / cycle);
      const sideSign = stepIndex % 2 === 0 ? 1 : -1;
      const stepProgress = clamp01((cycleProgress - 0.18) / 0.34);
      const easedStep = smoothStep(stepProgress);
      const settle = cycleProgress > 0.68 ? 0.82 : 1;

      return {
        x: baseX + Math.sin(phasedAge * 1.7) * 8,
        y:
          ship.spawnY +
          sideSign * 46 * easedStep * settle +
          Math.sin(phasedAge * 7.2) * 4,
        velocityX:
          cycleProgress > 0.72
            ? ship.speed * 0.38 * ship.direction
            : ship.speed * 0.92 * ship.direction
      };
    }
    case "tidalBloom": {
      const bloomCycle = 3.8;
      const phasedAge = ageSeconds + ship.movementPhase * 0.13;
      const bloomProgress = phasedAge % bloomCycle;
      const isBlooming = bloomProgress > 2.72 && bloomProgress < 3.32;
      const petalWave = Math.sin(phasedAge * 4.4);
      const tideWave = Math.sin(phasedAge * 1.05 + ship.movementPhase);

      return {
        x: baseX + Math.sin(phasedAge * 2.1) * 26,
        y: ship.spawnY + tideWave * 64 + petalWave * (isBlooming ? 34 : 18),
        velocityX: ship.speed * (isBlooming ? 0.44 : 0.82) * ship.direction
      };
    }
  }
}
