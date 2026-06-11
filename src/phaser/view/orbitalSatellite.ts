export interface OrbitalSatelliteConfig {
  elapsedMs: number;
  centerX: number;
  centerY: number;
  radiusX: number;
  radiusY: number;
  pointerParallaxX: number;
  pointerParallaxY: number;
}

export interface OrbitalSatellitePosition {
  x: number;
  y: number;
  scale: number;
  alpha: number;
}

const VISIBLE_ORBIT_MS = 180_000;
const HIDDEN_RESET_MS = 10_000;
const START_OFFSET_MS = 55_000;

export function calculateOrbitalSatellitePosition({
  elapsedMs,
  centerX,
  centerY,
  radiusX,
  radiusY,
  pointerParallaxX,
  pointerParallaxY
}: OrbitalSatelliteConfig): OrbitalSatellitePosition {
  const cycleMs = VISIBLE_ORBIT_MS + HIDDEN_RESET_MS;
  const cycleElapsedMs = (elapsedMs + START_OFFSET_MS) % cycleMs;

  if (cycleElapsedMs > VISIBLE_ORBIT_MS) {
    return {
      x: centerX + radiusX + pointerParallaxX,
      y: centerY + pointerParallaxY,
      scale: 0.9,
      alpha: 0
    };
  }

  const progress = cycleElapsedMs / VISIBLE_ORBIT_MS;
  const depth = Math.sin(progress * Math.PI);

  return {
    x: centerX - radiusX + progress * radiusX * 2 + pointerParallaxX,
    y: centerY - depth * radiusY + pointerParallaxY,
    scale: 0.9 + depth * 0.18,
    alpha: 1
  };
}
