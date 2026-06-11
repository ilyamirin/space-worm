export type GamePhase =
  | "boot"
  | "ready"
  | "running"
  | "recovering"
  | "gameOver";

export type InputAction = "tapShip" | "startRun" | "restartRun";

export interface TapStrikePayload {
  shipId?: string;
  x?: number;
  y?: number;
}

export type ShipStatus = "flying" | "targeted" | "escaped";

export type ShipMovementPattern =
  | "sine"
  | "arc"
  | "sCurve"
  | "dashStop"
  | "wideSCurve"
  | "zigzagBlink";

export type WormAttackPhase =
  | "idle"
  | "extending"
  | "biting"
  | "retracting"
  | "recovering";

export interface ShipArchetype {
  id: string;
  parodyName: string;
  spriteKey: string;
  hitRadius: number;
  renderScale: number;
  glowColor: number;
  trailColor: number;
  baseSpeed: number;
  scoreValue: number;
  satiationValue: number;
  spawnWeight: number;
  movementPattern: ShipMovementPattern;
}

export interface ShipInstance {
  id: string;
  archetypeId: string;
  lane: number;
  x: number;
  y: number;
  spawnX: number;
  spawnY: number;
  direction: 1 | -1;
  speed: number;
  ageMs: number;
  movementPhase: number;
  movementPattern: ShipMovementPattern;
  velocityX: number;
  state: ShipStatus;
}

export interface WormState {
  attackPhase: WormAttackPhase;
  anchorX: number;
  anchorY: number;
  targetShipId: string | null;
  segmentCount: number;
  maxReachPx: number;
  cooldownMs: number;
  tipX: number;
  tipY: number;
  targetX: number;
  targetY: number;
  strikeElapsedMs: number;
  strikeDurationMs: number;
  didHit: boolean;
  headContactRadiusPx: number;
  jawCaptureRadiusPx: number;
  jawForwardOffsetPx: number;
  hasContactThisStrike: boolean;
  contactWindowStartsAt: number;
}

export interface GameState {
  phase: GamePhase;
  score: number;
  satiation: number;
  elapsedMs: number;
  difficultyTier: number;
  activeShips: ShipInstance[];
  worm: WormState;
}

export interface AssetDescriptor {
  key: string;
  url: string;
}

export interface AudioCredit {
  key: string;
  title: string;
  author: string;
  license: string;
  sourceUrl: string;
  downloadUrl: string;
}

export interface AssetManifest {
  images: AssetDescriptor[];
  audio: AssetDescriptor[];
  audioCredits: AudioCredit[];
}

export interface SceneBridge {
  getState: () => Readonly<GameState>;
  tick: (deltaMs: number) => void;
  dispatch: (action: InputAction, payload?: TapStrikePayload) => void;
  subscribe: (listener: (state: Readonly<GameState>) => void) => () => void;
}
