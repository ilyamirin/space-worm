# Space Worm Overlay Redesign

Date: 2026-06-11
Status: Revised approved direction
Chosen format: `A. Cinematic Intro + Trophy Restart`
Intro revision: `Full Motion Intro` with a single small falling spore

## Goal

Replace the current text-heavy start and restart overlays with:

- a short cinematic intro that explains the worm's origin with almost no text
- a separate fast restart screen that behaves like a clean trophy modal

The result should feel atmospheric on first launch and frictionless on replay.

Revision note:

- the intro must read as exactly one spore, not a large static spore in the sky plus a second small animated one
- the final approved direction is a short full-motion intro over a clean crater background

## Scope

In scope:

- start overlay redesign
- restart overlay redesign
- intro artwork generation workflow
- DOM overlay structure, timing, transitions, and responsive behavior

Out of scope:

- gameplay rule changes
- HUD redesign beyond what is needed for overlays
- new progression systems
- voice-over or narrative text sequences

## Experience Summary

### Start Flow

The first screen becomes a short auto-playing mini-scene built from one generated hero background plus one animated spore actor.

Narrative:

1. A single small bright cosmic spore appears high in the frame.
2. The spore travels along a readable arc toward the crater on the worm planet.
3. The spore accelerates slightly before contact, lands in the crater, and flashes briefly.
4. The spore disappears into the crater, the scene settles, then the play action appears.

Player interaction:

- no tap required during the intro itself
- after the short auto-intro finishes, the start control appears
- one tap starts the run and unlocks audio as before

Text budget:

- no paragraph copy
- optional tiny wordmark only: `SPACE WORM`
- no `Hunt`, no explanatory text, no metrics

### Restart Flow

The game-over screen becomes a separate minimal modal, not a second intro.

Narrative:

- the run ends
- the background game scene stays visible but dimmed
- a central trophy-like score medallion appears
- a single restart control invites immediate replay

Text budget:

- no `Game Over`
- no sentence copy
- score stays as the main content
- restart may be icon-only or icon + very short label during implementation review

## Visual Direction

### Start Overlay

Mood:

- mysterious
- naturalistic but stylized
- quiet and expensive

Composition:

- planet occupies the lower portion of frame
- crater is clearly visible
- no large static spore should exist in the painted background
- the only spore on screen is the animated falling one
- the animated spore is the brightest moving object, but remains physically small in frame

Visual language:

- near-black space
- soft planetary glow
- luminous spore with filament or dandelion-like structure
- clear read that the crater is where the egg lands
- short impact flash at the crater instead of a persistent second light source

### Restart Overlay

Mood:

- clean
- model-like
- immediate

Composition:

- dimmed live game scene behind
- centered score emblem
- one large restart control below it

Visual language:

- less cinematic than the intro
- stronger geometry
- minimal chrome
- should feel like a polished replay affordance, not a story beat

## Intro Art Strategy

The intro art should be generated from the existing game background and world motifs, not invented from scratch without reference.

Production model:

- use `replicate-nano-banana-2-http`
- use the current gameplay backdrop or screenshot as image input
- ask for a variant with no spore in the sky at all, only black space, the planet, and the crater
- keep palette continuity with the in-game planet and sky

Recommended generation target:

- portrait aspect ratio matching the game frame
- one clean master image that leaves enough negative space for a small animated spore path

Prompt intent:

- black cosmic sky
- earthlike small planet with readable forests, lakes, mountains
- visible crater on the surface
- no large glowing object in the upper sky
- moody, high contrast, painterly but clean
- consistent with existing game art

## Motion Design

### Start Intro Timing

Target duration:

- 2.4s to 3.2s total before the start control appears

Recommended stage timing:

1. Stage 1, approach: `~700ms`
2. Stage 2, descent: `~950ms`
3. Stage 3, impact: `~350ms`
4. Stage 4, settle to ready: `~500ms`
5. CTA fade-in: `~250ms`

Motion types:

- one small animated spore moving on a clear arc
- compact tail or glow streak during descent only
- brief crater impact flash
- subtle scene settle before CTA reveal

Avoid:

- busy particle storms
- giant comet-like trails
- long cinematic delay
- camera shake
- any composition that reads as two spores
- anything that obscures tap readiness

### Restart Motion

Target duration:

- modal enters within `180ms` to `260ms`

Motion types:

- background dim
- central score medallion scale/fade pop
- restart control fades in immediately after

Avoid:

- long transitions
- a second story beat
- large text reveals

## Interaction Design

### Start Screen

- intro auto-plays once whenever the app is in `ready`
- start control appears only after the intro finishes
- tapping before CTA appears should be ignored; the CTA reveal is the explicit readiness signal
- start control should stay large and thumb-friendly

### Restart Screen

- score remains visible as the main reward signal
- restart control is the dominant affordance
- no extra choices on the first version

## DOM / UI Structure

Keep these overlays DOM-based inside the existing HUD layer.

Recommended structure:

- `start-overlay`
  - clean crater background image layer
  - optional logo micro-label
  - single animated spore layer
  - optional compact tail/glow layer
  - crater impact glow layer
  - primary play control

- `gameover-overlay`
  - dim scrim
  - score medallion
  - restart control

This keeps layout responsive and separates cinematic surfaces from Phaser world rendering.

## Accessibility / Readability

- overlays must remain readable on portrait mobile first
- controls remain large enough for thumb tap
- score must remain visually dominant on restart
- if text is reduced to near-zero, controls still need clear iconography and contrast

## Implementation Notes

Recommended implementation order:

1. Regenerate the intro background without a large spore
2. Retune the start overlay stages to `approach`, `descent`, `impact`, `ready`
3. Replace the current falling-spore motion with a smaller and clearer trajectory
4. Keep the restart overlay direction as the separate trophy modal
5. Tune mobile spacing and contrast

Likely files:

- `src/ui/createHud.ts`
- `src/styles.css`
- possibly one or two new intro assets under `public/assets/ui` or `public/assets/environment`

## Risks

- too much motion can make first start feel slow
- the falling spore can become too small to read if the glow is underplayed
- generated art may drift from the in-game palette if not grounded by reference
- icon-only restart can become ambiguous if contrast or affordance is weak

## Acceptance Criteria

- start screen reads as a short origin-story intro with almost no text
- exactly one spore is readable on screen throughout the intro
- the spore-to-crater idea is understandable without paragraphs
- no large static spore remains in the background art
- restart screen is clearly separate from the start intro
- restart screen is faster and simpler than start
- both overlays feel premium and mobile-safe
- implementation preserves current gameplay start/restart flow
