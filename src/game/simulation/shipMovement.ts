import type { ShipInstance } from "../types";

export interface ShipPosition {
  x: number;
  y: number;
  velocityX: number;
}

const SECOND = 1000;

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
  }
}
