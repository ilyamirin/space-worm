# Ship Variety Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all six ships visually and mechanically distinct with unique SVG styling, readable animation cues, patterned movement, and the approved score curve.

**Architecture:** Add a small movement-pattern module and store spawn-time movement data on each ship instance. `GameSimulation` remains responsible for spawning, collision, capture, and score; `shipMovement.ts` owns deterministic position calculation. SVG files stay in `public/assets/characters/`, and Phaser continues to render them through the existing asset manifest.

**Tech Stack:** TypeScript, Phaser 3, Vite, SVG assets, existing `pnpm run verify` pipeline.

---

## File Structure

- Modify `src/game/types.ts`: add `ShipMovementPattern`, add `movementPattern` to archetypes, and add deterministic movement fields to `ShipInstance`.
- Modify `src/game/content/shipArchetypes.ts`: assign approved score values and movement pattern ids.
- Create `src/game/simulation/shipMovement.ts`: pure movement helpers for all six patterns.
- Modify `src/game/simulation/GameSimulation.ts`: spawn ships with movement metadata and update positions through `shipMovement.ts`.
- Modify `src/phaser/scenes/GameplayScene.ts`: make visual bob/trail treatment aware of movement pattern and add readable cues for dash/blink ships.
- Replace `public/assets/characters/ship-falconish.svg`, `ship-saucer.svg`, `ship-ring.svg`, `ship-arrow.svg`, `ship-blockade.svg`, `ship-triwing.svg`: unique silhouettes plus lightweight embedded SVG animation.
- Verify with `pnpm run verify` and a local playtest.

## Task 1: Add Movement Types and Score Curve

**Files:**

- Modify: `src/game/types.ts`
- Modify: `src/game/content/shipArchetypes.ts`

- [ ] **Step 1: Extend ship types**

In `src/game/types.ts`, add this type after `ShipStatus`:

```ts
export type ShipMovementPattern =
  | "sine"
  | "arc"
  | "sCurve"
  | "dashStop"
  | "wideSCurve"
  | "zigzagBlink";
```

Then update `ShipArchetype` to include:

```ts
movementPattern: ShipMovementPattern;
```

Then replace `ShipInstance` with:

```ts
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
```

- [ ] **Step 2: Apply approved score values and pattern ids**

In `src/game/content/shipArchetypes.ts`, keep the current order and existing fields, but update each object with these values:

```ts
scoreValue: 10,
movementPattern: "sine",
```

for `falconish`.

```ts
scoreValue: 14,
movementPattern: "arc",
```

for `saucer`.

```ts
scoreValue: 18,
movementPattern: "dashStop",
```

must become:

```ts
scoreValue: 21,
movementPattern: "dashStop",
```

for `arrow`.

```ts
scoreValue: 16,
movementPattern: "sCurve",
```

must become:

```ts
scoreValue: 17,
movementPattern: "sCurve",
```

for `ring`.

```ts
scoreValue: 22,
movementPattern: "zigzagBlink",
```

must become:

```ts
scoreValue: 30,
movementPattern: "zigzagBlink",
```

for `triwing`.

```ts
scoreValue: 20,
movementPattern: "wideSCurve",
```

must become:

```ts
scoreValue: 23,
movementPattern: "wideSCurve",
```

for `blockade`.

- [ ] **Step 3: Run typecheck**

Run:

```bash
pnpm run typecheck
```

Expected: TypeScript fails because `ShipInstance` construction does not yet provide the new fields.

- [ ] **Step 4: Commit after Task 2 passes**

Do not commit at the failing point. Commit after Task 2 makes typecheck pass:

```bash
git add src/game/types.ts src/game/content/shipArchetypes.ts
git commit -m "feat: define ship movement roles"
```

## Task 2: Add Deterministic Ship Movement

**Files:**

- Create: `src/game/simulation/shipMovement.ts`
- Modify: `src/game/simulation/GameSimulation.ts`

- [ ] **Step 1: Create movement helper**

Create `src/game/simulation/shipMovement.ts`:

```ts
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
    default:
      return {
        x: baseX,
        y: ship.spawnY,
        velocityX: ship.speed * ship.direction
      };
  }
}
```

- [ ] **Step 2: Wire ship spawn metadata**

In `src/game/simulation/GameSimulation.ts`, add the import:

```ts
import { calculateShipPosition } from "./shipMovement";
```

Then replace `createShipInstance()` with:

```ts
  private createShipInstance(): ShipInstance {
    const archetype = this.pickArchetype();
    const lane = Phaser.Utils.Array.GetRandom(FLIGHT_LANES);
    const direction = Math.random() > 0.5 ? 1 : -1;
    const speedBoost = this.state.difficultyTier * 18;
    const speed = archetype.baseSpeed + speedBoost + Math.random() * 32;
    const spawnX = direction > 0 ? -SPAWN_PADDING : WORLD_WIDTH + SPAWN_PADDING;
    const spawnY = lane + Phaser.Math.Between(-SHIP_LANE_JITTER, SHIP_LANE_JITTER);
    const movementPhase = Math.random() * Math.PI * 2;

    this.shipId += 1;

    const ship: ShipInstance = {
      id: `ship-${this.shipId}`,
      archetypeId: archetype.id,
      lane,
      x: spawnX,
      y: spawnY,
      spawnX,
      spawnY,
      direction,
      speed,
      ageMs: 0,
      movementPhase,
      movementPattern: archetype.movementPattern,
      velocityX: speed * direction,
      state: "flying"
    };

    return {
      ...ship,
      ...calculateShipPosition(ship)
    };
  }
```

- [ ] **Step 3: Use patterned updates**

Replace `updateShips(deltaMs: number)` with:

```ts
  private updateShips(deltaMs: number): void {
    this.state.activeShips = this.state.activeShips
      .map((ship) => {
        const agedShip = {
          ...ship,
          ageMs: ship.ageMs + deltaMs
        };

        return {
          ...agedShip,
          ...calculateShipPosition(agedShip)
        };
      })
      .filter((ship) => {
        const escapedLeft = ship.direction < 0 && ship.x < -SPAWN_PADDING;
        const escapedRight =
          ship.direction > 0 && ship.x > WORLD_WIDTH + SPAWN_PADDING;
        return !(escapedLeft || escapedRight);
      });
  }
```

- [ ] **Step 4: Run typecheck**

Run:

```bash
pnpm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/game/types.ts src/game/content/shipArchetypes.ts src/game/simulation/GameSimulation.ts src/game/simulation/shipMovement.ts
git commit -m "feat: add patterned ship movement"
```

## Task 3: Add Gameplay Visual Cues in Phaser

**Files:**

- Modify: `src/phaser/scenes/GameplayScene.ts`

- [ ] **Step 1: Add local cue helpers**

In `src/phaser/scenes/GameplayScene.ts`, add these private methods near `strokeQuadraticTrail` or before `syncAudio`:

```ts
  private getPatternCueAlpha(ship: ShipInstance, elapsedMs: number): number {
    const ageSeconds = ship.ageMs / 1000;

    if (ship.movementPattern === "dashStop") {
      const cycleProgress = (ageSeconds + ship.movementPhase * 0.11) % 1.55;
      return cycleProgress > 0.52 && cycleProgress < 0.72 ? 0.45 : 0;
    }

    if (ship.movementPattern === "zigzagBlink") {
      const cycleProgress = (ageSeconds + ship.movementPhase * 0.07) % 1.35;
      return cycleProgress > 0.62 && cycleProgress < 0.74
        ? 0.5 + Math.sin(elapsedMs * 0.04) * 0.18
        : 0;
    }

    return 0;
  }

  private getTrailWidth(ship: ShipInstance): number {
    switch (ship.movementPattern) {
      case "dashStop":
        return ship.velocityX === 0 ? 4 : 8;
      case "wideSCurve":
        return 9;
      case "zigzagBlink":
        return 7;
      default:
        return 6;
    }
  }
```

- [ ] **Step 2: Use helpers inside `syncShips`**

Inside `syncShips`, after `const verticalLean = ...`, add:

```ts
const cueAlpha = this.getPatternCueAlpha(ship, elapsedMs);
const patternTrailWidth = this.getTrailWidth(ship);
```

Then replace the current `visual.glow.setFillStyle(...)` block with:

```ts
visual.glow.setFillStyle(
  archetype.glowColor,
  Math.max(ship.state === "targeted" ? 0.34 : 0.16 + pulse * 0.08, cueAlpha)
);
```

Then replace the first argument to `visual.trail.lineStyle(...)` with:

```ts
        ship.state === "targeted" ? patternTrailWidth + 2 : patternTrailWidth,
```

- [ ] **Step 3: Run typecheck**

Run:

```bash
pnpm run typecheck
```

Expected: PASS.

- [ ] **Step 4: Commit**

Run:

```bash
git add src/phaser/scenes/GameplayScene.ts
git commit -m "feat: telegraph advanced ship movement"
```

## Task 4: Refresh Ship SVG Assets

**Files:**

- Modify: `public/assets/characters/ship-falconish.svg`
- Modify: `public/assets/characters/ship-saucer.svg`
- Modify: `public/assets/characters/ship-ring.svg`
- Modify: `public/assets/characters/ship-arrow.svg`
- Modify: `public/assets/characters/ship-blockade.svg`
- Modify: `public/assets/characters/ship-triwing.svg`

- [ ] **Step 1: Replace `ship-falconish.svg` with animated starter silhouette**

Use width `320`, height `180`, and preserve a left-to-right nose orientation. Include these animated elements:

```svg
<animateTransform attributeName="transform" type="rotate" values="-1 160 90;2 160 90;-1 160 90" dur="2.8s" repeatCount="indefinite"/>
```

on the main hull group, and:

```svg
<animate attributeName="opacity" values="0.45;1;0.45" dur="0.8s" repeatCount="indefinite"/>
```

on the engine flame path. The silhouette must keep asymmetric side fins and a cyan cockpit.

- [ ] **Step 2: Replace `ship-saucer.svg` with royal saucer silhouette**

Use a broad oval body, gold rim, dark central dome, and rim marker circles. Add this animation to the rim marker group:

```svg
<animateTransform attributeName="transform" type="rotate" from="0 160 90" to="360 160 90" dur="3.6s" repeatCount="indefinite"/>
```

Add a dome pulse:

```svg
<animate attributeName="opacity" values="0.55;1;0.55" dur="1.4s" repeatCount="indefinite"/>
```

- [ ] **Step 3: Replace `ship-ring.svg` with courier ring silhouette**

Use a diamond or ring outer hull with an open dark center and a bright core. Add orbiting dots in a group with:

```svg
<animateTransform attributeName="transform" type="rotate" from="0 160 90" to="-360 160 90" dur="2.4s" repeatCount="indefinite"/>
```

Add a core warning pulse:

```svg
<animate attributeName="r" values="9;14;9" dur="1.2s" repeatCount="indefinite"/>
```

- [ ] **Step 4: Replace `ship-arrow.svg` with needle frigate silhouette**

Use a sharp needle nose, compact central body, and small stabilizers. Add an engine charge group with:

```svg
<animate attributeName="opacity" values="0.25;0.25;1;0.25" keyTimes="0;0.55;0.75;1" dur="1.55s" repeatCount="indefinite"/>
```

Add a short cyan residual trail behind the tail with a second opacity animation using the same duration.

- [ ] **Step 5: Replace `ship-blockade.svg` with heavy lantern silhouette**

Use a large rounded hull, thick underside band, and two warm lantern windows. Add lantern blink:

```svg
<animate attributeName="opacity" values="0.5;1;0.5" dur="1.8s" repeatCount="indefinite"/>
```

Add hull sag on the main group:

```svg
<animateTransform attributeName="transform" type="translate" values="0 -2;0 4;0 -2" dur="3.8s" repeatCount="indefinite"/>
```

- [ ] **Step 6: Replace `ship-triwing.svg` with phantom silhouette**

Use three clear wing masses, magenta hull, pale phantom wing accents, and a bright center. Add shimmer warning:

```svg
<animate attributeName="opacity" values="0.25;0.25;0.9;0.25" keyTimes="0;0.55;0.74;1" dur="1.35s" repeatCount="indefinite"/>
```

Add brief phase flicker on a duplicate ghost group:

```svg
<animate attributeName="opacity" values="0;0;0.55;0" keyTimes="0;0.72;0.82;1" dur="1.35s" repeatCount="indefinite"/>
```

- [ ] **Step 7: Verify SVG files parse**

Run:

```bash
pnpm run typecheck
```

Expected: PASS. This does not validate SVG syntax, but it confirms TypeScript references remain valid.

- [ ] **Step 8: Commit**

Run:

```bash
git add public/assets/characters/ship-falconish.svg public/assets/characters/ship-saucer.svg public/assets/characters/ship-ring.svg public/assets/characters/ship-arrow.svg public/assets/characters/ship-blockade.svg public/assets/characters/ship-triwing.svg
git commit -m "feat: refresh ship silhouettes"
```

## Task 5: Full Verification and Playtest

**Files:**

- No planned code changes unless verification finds an issue.

- [ ] **Step 1: Run full verification**

Run:

```bash
pnpm run verify
```

Expected: PASS for lint, format check, security check, typecheck, and Vite build.

- [ ] **Step 2: Start local dev server**

Run:

```bash
pnpm dev
```

Expected: Vite prints a local URL, usually `http://localhost:5173/`.

- [ ] **Step 3: Manual gameplay checks**

Open the local URL and verify:

- Millennial Kestrel is easy to track and scores 10.
- Royal Saucer visibly floats and scores 14.
- Halo Courier follows a smooth S-curve and scores 17.
- Needle Frigate visibly charges before dash movement and scores 21.
- Blockade Lantern is slower, heavier, and scores 23.
- Tri-Wing Phantom shimmers before blink movement and scores 30.
- Captures and escapes still remove ships correctly.
- The worm collision uses the visible ship position.
- No ship visual overlaps the HUD in normal desktop or mobile viewport play.

- [ ] **Step 4: Commit verification fixes if needed**

If verification or playtest requires fixes, commit only the fix files:

```bash
git add src/game src/phaser public/assets/characters
git commit -m "fix: polish ship variety gameplay"
```

If no fixes are needed, do not create an empty commit.

## Self-Review

- Spec coverage: score curve, per-ship movement, visual uniqueness, animation cues, collision consistency, and manual mobile checks are covered.
- Placeholder scan: no deferred requirements are left for the implementer.
- Type consistency: `movementPattern`, `movementPhase`, `ageMs`, `spawnX`, `spawnY`, `direction`, and `speed` are introduced in Task 1 and used consistently in later tasks.
