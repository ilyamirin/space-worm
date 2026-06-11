import Phaser from "phaser";
import { SHIP_ARCHETYPES } from "../content/shipArchetypes";
import type {
  GameState,
  InputAction,
  ShipArchetype,
  ShipInstance,
  TapStrikePayload
} from "../types";
import {
  DIFFICULTY_STEP_MS,
  FLIGHT_LANES,
  HIT_BITE_HOLD_MS,
  MISS_PENALTY,
  MISS_RECOVERY_MS,
  POST_HIT_COOLDOWN_MS,
  SATIATION_DRAIN_PER_SECOND,
  SATIATION_MAX,
  SHIP_LANE_JITTER,
  SPAWN_PADDING,
  WORLD_WIDTH
} from "./config";
import { createInitialState, createInitialWormState } from "./createState";

const MAX_SHIPS_BY_TIER = [2, 3, 3, 4, 5];

type Listener = (state: Readonly<GameState>) => void;

export class GameSimulation {
  private state: GameState = createInitialState();

  private listeners = new Set<Listener>();

  private shipId = 0;

  private spawnCooldownMs = 700;

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  getState(): Readonly<GameState> {
    return this.state;
  }

  dispatch(action: InputAction, payload?: TapStrikePayload): void {
    switch (action) {
      case "startRun":
        if (this.state.phase === "ready") {
          this.state.phase = "running";
          this.state.elapsedMs = 0;
          this.state.score = 0;
          this.state.satiation = SATIATION_MAX;
          this.state.difficultyTier = 0;
          this.state.activeShips = [];
          this.state.worm = createInitialWormState();
          this.spawnCooldownMs = 250;
          this.emit();
        }
        break;
      case "restartRun":
        this.state = createInitialState();
        this.state.phase = "running";
        this.spawnCooldownMs = 250;
        this.emit();
        break;
      case "tapShip":
        if (typeof payload?.x === "number" && typeof payload?.y === "number") {
          this.handleStrikeTap(payload.x, payload.y);
        }
        break;
      default:
        break;
    }
  }

  update(deltaMs: number): void {
    if (this.state.phase === "ready" || this.state.phase === "gameOver") {
      return;
    }

    const safeDeltaMs = Math.min(deltaMs, 50);

    this.state.elapsedMs += safeDeltaMs;
    this.state.difficultyTier = Math.floor(
      this.state.elapsedMs / DIFFICULTY_STEP_MS
    );

    const drain = (SATIATION_DRAIN_PER_SECOND * safeDeltaMs) / 1000;
    this.state.satiation = Math.max(0, this.state.satiation - drain);

    if (this.state.satiation <= 0) {
      this.state.phase = "gameOver";
      this.state.worm = createInitialWormState();
      this.emit();
      return;
    }

    this.updateShips(safeDeltaMs);
    this.updateSpawn(safeDeltaMs);
    this.updateWorm(safeDeltaMs);
    this.emit();
  }

  private updateShips(deltaMs: number): void {
    const travelSeconds = deltaMs / 1000;

    this.state.activeShips = this.state.activeShips
      .map((ship) => ({
        ...ship,
        x: ship.x + ship.velocityX * travelSeconds
      }))
      .filter((ship) => {
        const escapedLeft = ship.velocityX < 0 && ship.x < -SPAWN_PADDING;
        const escapedRight =
          ship.velocityX > 0 && ship.x > WORLD_WIDTH + SPAWN_PADDING;
        return !(escapedLeft || escapedRight);
      });
  }

  private updateSpawn(deltaMs: number): void {
    const maxShips =
      MAX_SHIPS_BY_TIER[
        Math.min(this.state.difficultyTier, MAX_SHIPS_BY_TIER.length - 1)
      ];

    if (this.state.activeShips.length >= maxShips) {
      this.spawnCooldownMs = Math.max(
        this.spawnCooldownMs - deltaMs * 0.35,
        120
      );
      return;
    }

    this.spawnCooldownMs -= deltaMs;

    if (this.spawnCooldownMs > 0) {
      return;
    }

    this.state.activeShips.push(this.createShipInstance());
    const baseDelay = Math.max(1250 - this.state.difficultyTier * 75, 520);
    this.spawnCooldownMs = baseDelay + Math.random() * 240;
  }

  private updateWorm(deltaMs: number): void {
    const worm = this.state.worm;

    if (worm.cooldownMs > 0) {
      worm.cooldownMs = Math.max(0, worm.cooldownMs - deltaMs);
    }

    if (
      this.state.phase === "recovering" &&
      worm.cooldownMs === 0 &&
      worm.attackPhase === "recovering"
    ) {
      worm.attackPhase = "idle";
      this.state.phase = "running";
    }

    if (worm.attackPhase === "idle" || worm.attackPhase === "recovering") {
      worm.tipX = worm.anchorX;
      worm.tipY = worm.anchorY;
      return;
    }

    worm.strikeElapsedMs += deltaMs;

    if (worm.attackPhase === "extending") {
      const progress = Math.min(
        1,
        worm.strikeElapsedMs / worm.strikeDurationMs
      );
      worm.tipX = Phaser.Math.Linear(worm.anchorX, worm.targetX, progress);
      worm.tipY = Phaser.Math.Linear(worm.anchorY, worm.targetY, progress);

      if (
        progress >= worm.contactWindowStartsAt &&
        this.tryCaptureTargetShip(worm)
      ) {
        return;
      }

      if (progress >= 1) {
        this.startMissRetract(worm);
      }

      return;
    }

    if (worm.attackPhase === "biting") {
      if (worm.strikeElapsedMs >= worm.strikeDurationMs) {
        worm.attackPhase = "retracting";
        worm.strikeElapsedMs = 0;
        worm.strikeDurationMs = Math.max(180, worm.strikeDurationMs);
      }
      return;
    }

    if (worm.attackPhase === "retracting") {
      const progress = Math.min(
        1,
        worm.strikeElapsedMs / Math.max(1, worm.strikeDurationMs)
      );
      worm.tipX = Phaser.Math.Linear(worm.targetX, worm.anchorX, progress);
      worm.tipY = Phaser.Math.Linear(worm.targetY, worm.anchorY, progress);

      if (progress >= 1) {
        worm.tipX = worm.anchorX;
        worm.tipY = worm.anchorY;
        worm.targetShipId = null;
        worm.targetX = worm.anchorX;
        worm.targetY = worm.anchorY;
        worm.strikeElapsedMs = 0;
        worm.strikeDurationMs = 0;
        worm.hasContactThisStrike = false;

        if (worm.didHit) {
          worm.attackPhase = "idle";
          worm.cooldownMs = POST_HIT_COOLDOWN_MS;
          worm.didHit = false;
        } else {
          this.state.satiation = Math.max(
            0,
            this.state.satiation - MISS_PENALTY
          );
          worm.attackPhase = "recovering";
          worm.cooldownMs = MISS_RECOVERY_MS;
          this.state.phase = "recovering";
        }
      }
    }
  }

  private handleStrikeTap(targetX: number, targetY: number): void {
    if (this.state.phase !== "running") {
      return;
    }

    const worm = this.state.worm;
    if (worm.attackPhase !== "idle" || worm.cooldownMs > 0) {
      return;
    }

    const dx = targetX - worm.anchorX;
    const dy = targetY - worm.anchorY;
    const distance = Math.hypot(dx, dy);

    if (distance < 8) {
      return;
    }

    const heading = Math.atan2(dy, dx);
    const reach = Math.min(distance, worm.maxReachPx);
    const clampedTargetX = worm.anchorX + Math.cos(heading) * reach;
    const clampedTargetY = worm.anchorY + Math.sin(heading) * reach;

    worm.attackPhase = "extending";
    worm.targetShipId = null;
    worm.targetX = clampedTargetX;
    worm.targetY = clampedTargetY;
    worm.tipX = worm.anchorX;
    worm.tipY = worm.anchorY;
    worm.strikeElapsedMs = 0;
    worm.strikeDurationMs = Phaser.Math.Clamp(reach * 0.48, 180, 360);
    worm.didHit = false;
    worm.hasContactThisStrike = false;
  }

  private createShipInstance(): ShipInstance {
    const archetype = this.pickArchetype();
    const lane = Phaser.Utils.Array.GetRandom(FLIGHT_LANES);
    const direction = Math.random() > 0.5 ? 1 : -1;
    const speedBoost = this.state.difficultyTier * 18;
    const speed = archetype.baseSpeed + speedBoost + Math.random() * 32;
    const x = direction > 0 ? -SPAWN_PADDING : WORLD_WIDTH + SPAWN_PADDING;
    const velocityX = speed * direction;

    this.shipId += 1;

    return {
      id: `ship-${this.shipId}`,
      archetypeId: archetype.id,
      lane,
      x,
      y: lane + Phaser.Math.Between(-SHIP_LANE_JITTER, SHIP_LANE_JITTER),
      velocityX,
      state: "flying"
    };
  }

  private pickArchetype(): ShipArchetype {
    const weightSum = SHIP_ARCHETYPES.reduce(
      (sum, item) => sum + item.spawnWeight,
      0
    );
    let roll = Math.random() * weightSum;

    for (const archetype of SHIP_ARCHETYPES) {
      roll -= archetype.spawnWeight;
      if (roll <= 0) {
        return archetype;
      }
    }

    return SHIP_ARCHETYPES[0];
  }

  private getArchetype(archetypeId: string): ShipArchetype {
    const archetype = SHIP_ARCHETYPES.find((item) => item.id === archetypeId);
    if (!archetype) {
      throw new Error(`Unknown archetype: ${archetypeId}`);
    }
    return archetype;
  }

  private tryCaptureTargetShip(worm: GameState["worm"]): boolean {
    const heading = Phaser.Math.Angle.Between(
      worm.anchorX,
      worm.anchorY,
      worm.targetX,
      worm.targetY
    );
    const jawX = worm.tipX + Math.cos(heading) * worm.jawForwardOffsetPx;
    const jawY = worm.tipY + Math.sin(heading) * worm.jawForwardOffsetPx;

    const ship = this.pickCapturedShip(
      worm.tipX,
      worm.tipY,
      worm.headContactRadiusPx,
      jawX,
      jawY,
      worm.jawCaptureRadiusPx
    );

    if (!ship) {
      return false;
    }

    const archetype = this.getArchetype(ship.archetypeId);
    this.state.score += archetype.scoreValue;
    this.state.satiation = Math.min(
      SATIATION_MAX,
      this.state.satiation + archetype.satiationValue
    );
    this.state.activeShips = this.state.activeShips.filter(
      (candidate) => candidate.id !== ship.id
    );

    worm.hasContactThisStrike = true;
    worm.didHit = true;
    worm.targetShipId = ship.id;
    worm.attackPhase = "biting";
    worm.strikeElapsedMs = 0;
    worm.strikeDurationMs = HIT_BITE_HOLD_MS;
    worm.targetX = ship.x;
    worm.targetY = ship.y;
    worm.tipX = ship.x;
    worm.tipY = ship.y;
    return true;
  }

  private startMissRetract(worm: GameState["worm"]): void {
    worm.didHit = false;
    worm.attackPhase = "retracting";
    worm.strikeElapsedMs = 0;
    worm.strikeDurationMs = Math.max(180, worm.strikeDurationMs);
  }

  private pickCapturedShip(
    headX: number,
    headY: number,
    headRadius: number,
    jawX: number,
    jawY: number,
    jawRadius: number
  ): ShipInstance | null {
    let bestShip: ShipInstance | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (const ship of this.state.activeShips) {
      const archetype = this.getArchetype(ship.archetypeId);
      const headDistance = Math.hypot(ship.x - headX, ship.y - headY);
      const jawDistance = Math.hypot(ship.x - jawX, ship.y - jawY);
      const headReach = archetype.hitRadius + headRadius;
      const jawReach = archetype.hitRadius + jawRadius;
      const inHead = headDistance <= headReach;
      const inJaw = jawDistance <= jawReach;

      if (!inHead && !inJaw) {
        continue;
      }

      const contactDistance = Math.min(
        headDistance - headReach,
        jawDistance - jawReach
      );

      if (contactDistance < bestDistance) {
        bestDistance = contactDistance;
        bestShip = ship;
      }
    }

    return bestShip;
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}
