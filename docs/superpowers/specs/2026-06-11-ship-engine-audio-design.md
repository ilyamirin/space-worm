# Space Worm Ship Engine Audio Redesign

Date: 2026-06-11
Status: Approved direction
Chosen format: `Layered Open Library Set`
Character target: `Soft Atmospheric Per-Ship Engines`

## Goal

Replace the current single unpleasant ship-pass engine sound with a softer spatial ship-audio layer where each ship archetype has its own distinct engine tone and the sound image moves with the ship across the screen.

## Scope

In scope:

- per-archetype ship engine sounds
- open-license audio sourcing
- local engine asset integration
- archetype-level audio metadata
- spatial pan and distance-style volume behavior in gameplay
- updated audio credits for all new ship-engine assets

Out of scope:

- music replacement
- bite / miss / game-over sound redesign
- fully procedural synth generation
- desktop-specific surround mixing

## Experience Summary

### Current Problem

The current ship movement audio is driven by one shared cue. It sounds harsh and repetitive, and it does not read as belonging to different ship silhouettes. Because it is not truly tied to each active ship, it also fails to convey movement in a satisfying way.

### Target Experience

Ships should feel alive through sound, but the mix must stay restrained.

The player should perceive:

1. Different ships have different engine personalities.
2. The sound image shifts left and right with the ship position.
3. Fast ships feel light and airy rather than shrill.
4. Heavy ships feel fuller and lower rather than louder and more annoying.
5. The music remains dominant; ship engines stay secondary.

## Audio Direction

### Tone

The engine palette should feel:

- soft
- atmospheric
- readable
- lightly sci-fi
- never abrasive

Avoid:

- harsh buzzes
- piercing alarms
- distorted industrial grind
- comedy spaceship sounds
- anything that competes with music or bite feedback

### Archetype Intent

Each archetype gets its own engine identity, but all must still sound like part of one world.

- `falconish`: light, nimble, airy drive
- `saucer`: smooth circular hum
- `arrow`: thin fast glide
- `ring`: elegant resonant tech tone
- `triwing`: soft unstable phantom flutter
- `blockade`: broad low engine bed
- `crab`: mechanical but muted clampback thrum
- `starfish`: drifting bloom-like ambient pulse

These are character guides, not excuses for extreme sound design.

## Source Strategy

Primary source set:

- [Kenney Sci-fi Sounds](https://kenney.nl/assets/sci-fi-sounds), `CC0`
- [OpenGameArt mirror for Kenney Sci-fi Sounds](https://opengameart.org/content/sci-fi-sounds), `CC0`

Why this source:

- openly reusable
- already partially present in the project
- normalized volume
- consistent tonal family
- enough sci-fi engine / pass / hum material to stay coherent

Fallback policy:

- prefer additional files from the same Kenney pack first
- if a direct one-to-one engine match does not exist, create distinct ship identities through careful source selection and light per-ship rate/volume tuning
- do not pull random mismatched assets from unrelated libraries unless the tonal family still fits the game

## Playback Model

### Per-Ship Ownership

Each live ship owns its own engine loop instance.

Lifecycle:

1. Ship spawns.
2. Scene creates or starts that ship's engine loop.
3. Loop updates its `pan` and `volume` while the ship remains active.
4. Loop fades out when the ship disappears, is eaten, or otherwise stops mattering.
5. Audio instance is destroyed after fade-out.

### Spatial Behavior

Sound should move with the ship in a simple stereo way.

- `pan` maps from ship `x` position across the world width into a restrained stereo range
- ships near the center can be slightly louder than those at the far edges
- vertical position should not dominate the mix; horizontal travel is the main spatial read

This is not full 3D audio. It is a controlled left-right movement cue suitable for mobile headphones and laptop speakers.

### Anti-Noise Rules

Without limits, 8 ship loops would become exhausting. The mix must enforce discipline.

Rules:

- only `1-2` ships should be strongly audible at a time
- other active ships may remain extremely quiet or fully muted
- engine loops should use gentle fade-in / fade-out
- targeted ships may duck slightly if needed to keep bite readability clean
- no ship engine should be louder than the core bite hit or the satiety warning

Priority heuristics may use:

- proximity to screen center
- on-screen prominence
- current velocity or movement clarity

The important thing is perceptual calm, not perfect simulation.

## Data Model

The mapping belongs in ship data, not in scene-specific if/else logic.

Recommended `ShipArchetype` additions:

- `engineSoundKey`
- `engineBaseVolume`
- `enginePlaybackRate`

This keeps sound identity declarative and easy to rebalance without rewriting scene logic.

## Scene Responsibilities

`GameplayScene` remains the correct place for ship-engine runtime behavior.

It should:

- create engine loop instances for active ships
- keep a lookup from `ship.id` to sound instance
- update pan / volume over time
- fade and destroy loops for removed ships
- apply global anti-spam / audible-count limits

It should not:

- own license data
- hardcode archetype-to-sound mapping in scene logic
- change simulation rules

## Credits / Attribution

Every new ship-engine local key must appear in:

- `src/game/assets/manifest.ts`
- `public/assets/data/audioCredits.json`

Each entry must include:

- `key`
- `title`
- `author`
- `license`
- `sourceUrl`
- `downloadUrl`

Even with `CC0`, keep the source trace explicit.

## Risks

- too many loops can create constant hum and listener fatigue
- over-aggressive stereo panning can feel gimmicky on speakers
- per-ship uniqueness can drift into tonal inconsistency
- aggressive engine sounds can overpower music and bite feedback

## Acceptance Criteria

- each of the 8 ship archetypes has its own engine cue
- engine cues feel softer and less annoying than the current shared sound
- ship sound shifts left/right with the ship's movement
- the mix never turns into a constant noisy wall
- credits cover every new engine file with open-license attribution
- current build, lint, format, and security checks still pass
