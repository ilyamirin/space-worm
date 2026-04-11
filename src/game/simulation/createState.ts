import type { GameState, WormState } from "../types";
import {
  SATIATION_MAX,
  WORM_ANCHOR_X,
  WORM_ANCHOR_Y,
  WORM_MAX_REACH,
  WORM_SEGMENTS
} from "./config";

export function createInitialWormState(): WormState {
  return {
    attackPhase: "idle",
    anchorX: WORM_ANCHOR_X,
    anchorY: WORM_ANCHOR_Y,
    targetShipId: null,
    segmentCount: WORM_SEGMENTS,
    maxReachPx: WORM_MAX_REACH,
    cooldownMs: 0,
    tipX: WORM_ANCHOR_X,
    tipY: WORM_ANCHOR_Y,
    targetX: WORM_ANCHOR_X,
    targetY: WORM_ANCHOR_Y,
    strikeElapsedMs: 0,
    strikeDurationMs: 0,
    didHit: false
  };
}

export function createInitialState(): GameState {
  return {
    phase: "ready",
    score: 0,
    satiation: SATIATION_MAX,
    elapsedMs: 0,
    difficultyTier: 0,
    activeShips: [],
    worm: createInitialWormState()
  };
}
