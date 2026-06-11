# Space Worm Overlay Redesign

Date: 2026-06-11
Status: Approved direction
Chosen format: `A. Cinematic Intro + Trophy Restart`

## Goal

Replace the current text-heavy start and restart overlays with:

- a short cinematic intro that explains the worm's origin with almost no text
- a separate fast restart screen that behaves like a clean trophy modal

The result should feel atmospheric on first launch and frictionless on replay.

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

The first screen becomes a short auto-playing intro built from one generated hero image plus light staged motion.

Narrative:

1. A bright cosmic spore drifts toward the worm planet.
2. The spore descends toward the crater on the planet surface.
3. The spore lands in the crater and reads as the worm egg.
4. The image settles, then the play action appears.

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
- spore is the brightest object in the upper or middle field
- motion is mostly depth/parallax/fade/scale, not full animation

Visual language:

- near-black space
- soft planetary glow
- luminous spore with filament or dandelion-like structure
- clear read that the crater is where the egg lands

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
- ask for a variant where a bright cosmic spore approaches and lands in the crater
- keep palette continuity with the in-game planet and sky

Recommended generation target:

- portrait aspect ratio matching the game frame
- one master image with enough composition space for a staged 3-beat reveal

Prompt intent:

- black cosmic sky
- earthlike small planet with readable forests, lakes, mountains
- visible crater on the surface
- luminous cosmic spore like a space dandelion seed
- landing trajectory toward crater
- moody, high contrast, painterly but clean
- consistent with existing game art

## Motion Design

### Start Intro Timing

Target duration:

- 2.4s to 3.2s total before the start control appears

Recommended stage timing:

1. Stage 1, approach: `~900ms`
2. Stage 2, descent: `~800ms`
3. Stage 3, settle in crater: `~700ms`
4. CTA fade-in: `~250ms`

Motion types:

- subtle zoom
- controlled vertical drift
- light glow pulse on the spore
- tiny atmospheric fade between states

Avoid:

- busy particle storms
- long cinematic delay
- camera shake
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
- tapping before CTA appears may either queue start or be ignored; implementation should prefer explicit CTA appearance for clarity
- start control should stay large and thumb-friendly

### Restart Screen

- score remains visible as the main reward signal
- restart control is the dominant affordance
- no extra choices on the first version

## DOM / UI Structure

Keep these overlays DOM-based inside the existing HUD layer.

Recommended structure:

- `start-overlay`
  - hero image layer
  - optional logo micro-label
  - staged spore/egg animation layers or masks
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

1. Replace current start overlay layout and timing model
2. Replace current restart overlay with trophy modal
3. Generate and integrate intro hero art
4. Tune mobile spacing and contrast

Likely files:

- `src/ui/createHud.ts`
- `src/styles.css`
- possibly one or two new intro assets under `public/assets/ui` or `public/assets/environment`

## Risks

- too much motion can make first start feel slow
- generated art may drift from the in-game palette if not grounded by reference
- icon-only restart can become ambiguous if contrast or affordance is weak

## Acceptance Criteria

- start screen reads as a short origin-story intro with almost no text
- the spore-to-crater idea is understandable without paragraphs
- restart screen is clearly separate from the start intro
- restart screen is faster and simpler than start
- both overlays feel premium and mobile-safe
- implementation preserves current gameplay start/restart flow
