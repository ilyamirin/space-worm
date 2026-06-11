import { WORLD_HEIGHT } from "../../game/simulation/config";

export const ATMOSPHERE_BURN_START_Y = WORLD_HEIGHT - 760;
const ATMOSPHERE_BURN_DEPTH = 110;

interface PixelCometRenderInput {
  driftY: number;
  progress: number;
  shimmer: number;
}

export interface PixelCometRenderState {
  alive: boolean;
  burnProgress: number;
  containerAlpha: number;
  headAlpha: number;
  scale: number;
  sparkAlpha: number;
  trailAlphaMultiplier: number;
}

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

export function calculatePixelCometRenderState({
  driftY,
  progress,
  shimmer
}: PixelCometRenderInput): PixelCometRenderState {
  const burnProgress = clamp01(
    (driftY - ATMOSPHERE_BURN_START_Y) / ATMOSPHERE_BURN_DEPTH
  );
  const lifetimeAlpha = Math.max(0, Math.min(1, (1 - progress) * 1.08 + 0.18));
  const burnFade = Math.pow(1 - burnProgress, 1.35);
  const containerAlpha = lifetimeAlpha * burnFade;

  return {
    alive: burnProgress < 1,
    burnProgress,
    containerAlpha,
    headAlpha: shimmer * (1 - burnProgress * 0.64),
    scale: 1 - burnProgress * 0.78,
    sparkAlpha: (0.72 + shimmer * 0.46) * burnFade,
    trailAlphaMultiplier: burnFade
  };
}
