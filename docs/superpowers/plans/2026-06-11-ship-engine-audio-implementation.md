# Ship Engine Audio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single harsh ship-pass sound with 8 softer per-ship engine cues that pan with ship movement and stay controlled in the mix.

**Architecture:** Keep ship-engine ownership in render/data layers only. Add declarative engine metadata to `ShipArchetype`, register one audio key per archetype in the asset manifest and credits, and let `GameplayScene` manage loop lifecycle plus pan/volume updates for the most audible active ships.

**Tech Stack:** TypeScript, Phaser 3 WebAudio, Vite, local OGG assets, Kenney Sci-fi Sounds (`CC0`), JSON credits metadata, existing `pnpm run verify` pipeline.

---

## File Structure

- Create: `public/assets/audio/ship-engine-*.ogg` for each of the 8 ship archetypes.
- Modify: `public/assets/data/audioCredits.json` to include every new engine file.
- Modify: `src/game/types.ts` to extend `ShipArchetype` with engine metadata.
- Modify: `src/game/content/shipArchetypes.ts` to declare per-ship engine keys and tuning.
- Modify: `src/game/assets/manifest.ts` to preload new audio files.
- Modify: `src/phaser/scenes/GameplayScene.ts` to replace the single `sfx-ship-pass` cue with per-ship loop management and stereo movement.

## Task 1: Prepare Open-Licensed Ship Engine Assets

**Files:**

- Create: `public/assets/audio/ship-engine-falconish.ogg`
- Create: `public/assets/audio/ship-engine-saucer.ogg`
- Create: `public/assets/audio/ship-engine-arrow.ogg`
- Create: `public/assets/audio/ship-engine-ring.ogg`
- Create: `public/assets/audio/ship-engine-triwing.ogg`
- Create: `public/assets/audio/ship-engine-blockade.ogg`
- Create: `public/assets/audio/ship-engine-crab.ogg`
- Create: `public/assets/audio/ship-engine-starfish.ogg`
- Temporary: `/private/tmp/sci-fi_sounds.zip`
- Temporary: `/private/tmp/sci-fi_sounds_extract/`

- [ ] **Step 1: Download the open sound pack**

Run:

```bash
curl -fL "https://opengameart.org/sites/default/files/sci-fi_sounds.zip" \
  -o /private/tmp/sci-fi_sounds.zip
```

Expected: `/private/tmp/sci-fi_sounds.zip` exists.

- [ ] **Step 2: Inspect the pack contents**

Run:

```bash
rm -rf /private/tmp/sci-fi_sounds_extract
mkdir -p /private/tmp/sci-fi_sounds_extract
unzip -q /private/tmp/sci-fi_sounds.zip -d /private/tmp/sci-fi_sounds_extract
find /private/tmp/sci-fi_sounds_extract -type f | sort
```

Expected: extracted `.ogg` files are listed.

- [ ] **Step 3: Choose eight soft engine-adjacent source files**

Pick one source file per ship that matches the spec:

```text
falconish -> light airy engine
saucer -> smooth hover hum
arrow -> thin fast glide
ring -> resonant tech tone
triwing -> ghostly fluttering engine
blockade -> broad low thrum
crab -> muted mechanical drone
starfish -> blooming ambient pulse
```

Expected: 8 source filenames are identified from the pack.

- [ ] **Step 4: Copy the selected files into project-local keys**

Run commands in this form with the chosen source files:

```bash
cp "/private/tmp/sci-fi_sounds_extract/<source-a>.ogg" public/assets/audio/ship-engine-falconish.ogg
cp "/private/tmp/sci-fi_sounds_extract/<source-b>.ogg" public/assets/audio/ship-engine-saucer.ogg
cp "/private/tmp/sci-fi_sounds_extract/<source-c>.ogg" public/assets/audio/ship-engine-arrow.ogg
cp "/private/tmp/sci-fi_sounds_extract/<source-d>.ogg" public/assets/audio/ship-engine-ring.ogg
cp "/private/tmp/sci-fi_sounds_extract/<source-e>.ogg" public/assets/audio/ship-engine-triwing.ogg
cp "/private/tmp/sci-fi_sounds_extract/<source-f>.ogg" public/assets/audio/ship-engine-blockade.ogg
cp "/private/tmp/sci-fi_sounds_extract/<source-g>.ogg" public/assets/audio/ship-engine-crab.ogg
cp "/private/tmp/sci-fi_sounds_extract/<source-h>.ogg" public/assets/audio/ship-engine-starfish.ogg
```

Expected: all 8 local files exist under `public/assets/audio/`.

- [ ] **Step 5: Validate the copied assets**

Run:

```bash
file public/assets/audio/ship-engine-*.ogg
```

Expected: each file reports Ogg data.

## Task 2: Add Engine Metadata To Ship Data And Credits

**Files:**

- Modify: `src/game/types.ts`
- Modify: `src/game/content/shipArchetypes.ts`
- Modify: `src/game/assets/manifest.ts`
- Modify: `public/assets/data/audioCredits.json`

- [ ] **Step 1: Extend `ShipArchetype` in `src/game/types.ts`**

Update the interface to include:

```ts
export interface ShipArchetype {
  id: string;
  parodyName: string;
  spriteKey: string;
  hitRadius: number;
  renderScale: number;
  glowColor: number;
  trailColor: number;
  engineSoundKey: string;
  engineBaseVolume: number;
  enginePlaybackRate: number;
  baseSpeed: number;
  scoreValue: number;
  satiationValue: number;
  spawnWeight: number;
  movementPattern: ShipMovementPattern;
}
```

- [ ] **Step 2: Add per-ship engine metadata in `src/game/content/shipArchetypes.ts`**

For each archetype, add values like:

```ts
engineSoundKey: "ship-engine-falconish",
engineBaseVolume: 0.1,
enginePlaybackRate: 1
```

Use slightly different `engineBaseVolume` and `enginePlaybackRate` per ship to keep the family soft but distinct.

- [ ] **Step 3: Register the 8 new audio files in `src/game/assets/manifest.ts`**

Add entries in `ASSET_MANIFEST.audio`:

```ts
{ key: "ship-engine-falconish", url: "assets/audio/ship-engine-falconish.ogg" },
{ key: "ship-engine-saucer", url: "assets/audio/ship-engine-saucer.ogg" },
{ key: "ship-engine-arrow", url: "assets/audio/ship-engine-arrow.ogg" },
{ key: "ship-engine-ring", url: "assets/audio/ship-engine-ring.ogg" },
{ key: "ship-engine-triwing", url: "assets/audio/ship-engine-triwing.ogg" },
{ key: "ship-engine-blockade", url: "assets/audio/ship-engine-blockade.ogg" },
{ key: "ship-engine-crab", url: "assets/audio/ship-engine-crab.ogg" },
{ key: "ship-engine-starfish", url: "assets/audio/ship-engine-starfish.ogg" }
```

- [ ] **Step 4: Add audio credit records in `public/assets/data/audioCredits.json`**

Add one JSON object per new engine key with:

```json
{
  "key": "ship-engine-falconish",
  "title": "<actual source filename>.ogg from Sci-fi Sounds",
  "author": "Kenney",
  "license": "CC0 1.0",
  "sourceUrl": "https://kenney.nl/assets/sci-fi-sounds",
  "downloadUrl": "https://opengameart.org/sites/default/files/sci-fi_sounds.zip"
}
```

Repeat for all 8 keys with the correct `title`.

- [ ] **Step 5: Run type and formatting checks for data files**

Run:

```bash
pnpm eslint src/game/types.ts src/game/content/shipArchetypes.ts src/game/assets/manifest.ts
pnpm prettier --check src/game/types.ts src/game/content/shipArchetypes.ts src/game/assets/manifest.ts public/assets/data/audioCredits.json
```

Expected: no errors, formatting clean.

## Task 3: Replace Shared Ship-Pass Cue With Spatial Per-Ship Loops

**Files:**

- Modify: `src/phaser/scenes/GameplayScene.ts`

- [ ] **Step 1: Define a runtime record for ship audio**

Add near the top of the file:

```ts
interface ShipEngineAudio {
  sound: Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound;
  targetVolume: number;
  currentVolume: number;
}
```

- [ ] **Step 2: Add scene state for ship engine loops**

Add members to `GameplayScene`:

```ts
private shipEngineAudio = new Map<string, ShipEngineAudio>();

private shipAudioUpdateAccumulatorMs = 0;
```

- [ ] **Step 3: Call a new sync method from `update()`**

After `this.syncShips(...)`, call:

```ts
this.syncShipEngineAudio(state.activeShips, delta);
```

- [ ] **Step 4: Implement `syncShipEngineAudio()`**

Create a method that:

```ts
private syncShipEngineAudio(
  ships: readonly ShipInstance[],
  delta: number
): void {
  this.shipAudioUpdateAccumulatorMs += delta;

  const liveIds = new Set(ships.map((ship) => ship.id));

  this.shipEngineAudio.forEach((engine, shipId) => {
    if (!liveIds.has(shipId)) {
      engine.sound.stop();
      engine.sound.destroy();
      this.shipEngineAudio.delete(shipId);
    }
  });

  const prioritizedShips = [...ships]
    .sort((left, right) => {
      const leftCenterScore = Math.abs(left.x - WORLD_WIDTH / 2);
      const rightCenterScore = Math.abs(right.x - WORLD_WIDTH / 2);
      return leftCenterScore - rightCenterScore;
    })
    .slice(0, 2);

  const audibleIds = new Set(prioritizedShips.map((ship) => ship.id));

  ships.forEach((ship) => {
    const archetype = SHIP_ARCHETYPES.find((item) => item.id === ship.archetypeId);
    if (!archetype) {
      return;
    }

    let engine = this.shipEngineAudio.get(ship.id);
    if (!engine) {
      const sound = this.sound.add(archetype.engineSoundKey, {
        loop: true,
        volume: 0
      });

      if (!sound.isPlaying) {
        sound.play({ rate: archetype.enginePlaybackRate });
      }

      engine = {
        sound: sound as Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound,
        targetVolume: 0,
        currentVolume: 0
      };
      this.shipEngineAudio.set(ship.id, engine);
    }

    const centered = 1 - Math.min(1, Math.abs(ship.x - WORLD_WIDTH / 2) / (WORLD_WIDTH / 2));
    const audible = audibleIds.has(ship.id) && ship.state === "flying";
    engine.targetVolume = audible ? archetype.engineBaseVolume * (0.45 + centered * 0.55) : 0;

    engine.currentVolume = Phaser.Math.Linear(
      engine.currentVolume,
      engine.targetVolume,
      0.14
    );

    engine.sound.setVolume(engine.currentVolume);

    if ("setPan" in engine.sound && typeof engine.sound.setPan === "function") {
      engine.sound.setPan(Phaser.Math.Clamp((ship.x / WORLD_WIDTH) * 1.5 - 0.75, -0.75, 0.75));
    }
  });
}
```

- [ ] **Step 5: Remove the old global ship-pass trigger**

Delete this block from `syncFeedback()`:

```ts
if (spawnedShips.length > 0 && this.shipPassCooldownMs === 0) {
  this.sound.play("sfx-ship-pass", { volume: 0.16 });
  this.shipPassCooldownMs = 900;
}
```

Also remove any now-unused `shipPassCooldownMs` member and related updates.

- [ ] **Step 6: Stop all ship engine loops on phase shutdown**

Inside `syncAudio()` or a new helper, ensure that when the phase becomes `gameOver`, every loop is stopped and destroyed:

```ts
if (phase === "gameOver") {
  this.shipEngineAudio.forEach((engine) => {
    engine.sound.stop();
    engine.sound.destroy();
  });
  this.shipEngineAudio.clear();
}
```

- [ ] **Step 7: Run code checks for the scene**

Run:

```bash
pnpm eslint src/phaser/scenes/GameplayScene.ts
pnpm prettier --check src/phaser/scenes/GameplayScene.ts
```

Expected: no lint or formatting errors.

## Task 4: Verify Audio Behavior And Commit

**Files:**

- Modify: none
- Test target: local app

- [ ] **Step 1: Start the local app**

Run:

```bash
pnpm dev --host 127.0.0.1 --port 4177
```

Expected: Vite prints `Local:   http://127.0.0.1:4177/`

- [ ] **Step 2: Manual audio smoke test**

Check in browser:

- two different ship archetypes do not sound identical
- a ship moving left-to-right audibly shifts stereo position
- no more than `1-2` ships are strongly audible at once
- the mix stays softer than music and bite cues

- [ ] **Step 3: Verify credits coverage**

Open the credits data and confirm the 8 new engine keys are present:

```bash
rg -n '"key": "ship-engine-' public/assets/data/audioCredits.json
```

Expected: 8 entries.

- [ ] **Step 4: Run full project verification**

Run:

```bash
pnpm run verify
```

Expected: lint, format, security, and build checks pass.

- [ ] **Step 5: Commit the ship-engine audio work**

Run:

```bash
git add public/assets/audio/ship-engine-*.ogg public/assets/data/audioCredits.json src/game/types.ts src/game/content/shipArchetypes.ts src/game/assets/manifest.ts src/phaser/scenes/GameplayScene.ts docs/superpowers/plans/2026-06-11-ship-engine-audio-implementation.md
git commit -m "Add spatial ship engine audio"
```

## Self-Review

- Spec coverage:
  - 8 distinct archetype engines: Tasks 1 and 2
  - spatial left-right motion: Task 3
  - anti-noise mixing: Task 3
  - credits coverage: Task 2 and Task 4
- Placeholder scan:
  - concrete files, commands, and fields are specified
- Type consistency:
  - `engineSoundKey`, `engineBaseVolume`, and `enginePlaybackRate` are used consistently across types, content, and scene code
