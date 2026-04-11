import type { GameState, WormState } from "../types";
import {
  SATIATION_MAX,
  WORM_ANCHOR_X,
  WORM_ANCHOR_Y,
  WORM_CONTACT_WINDOW_START,
  WORM_HEAD_CONTACT_RADIUS,
  WORM_JAW_CAPTURE_RADIUS,
  WORM_JAW_FORWARD_OFFSET,
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
    didHit: false,
    headContactRadiusPx: WORM_HEAD_CONTACT_RADIUS,
    jawCaptureRadiusPx: WORM_JAW_CAPTURE_RADIUS,
    jawForwardOffsetPx: WORM_JAW_FORWARD_OFFSET,
    hasContactThisStrike: false,
    contactWindowStartsAt: WORM_CONTACT_WINDOW_START
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
