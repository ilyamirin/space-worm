# Ship Variety Design

Date: 2026-06-11
Status: Approved for implementation planning

## Goal

Make the six existing ships feel like distinct skill targets rather than straight-line score pickups. Each ship should have a recognizable silhouette, a small SVG animation that hints at its behavior, and a movement pattern that changes how the player times a strike.

## Design Direction

Use the "skill targets" direction:

- The visual design tells the player how the ship moves.
- Harder movement patterns receive higher score rewards.
- Sharp or surprising motion must be telegraphed before it happens.
- SVG animation is functional feedback first and decoration second.

## Ship Roles

| Ship               | New score | Role          | Movement                      | Visual animation                                           |
| ------------------ | --------: | ------------- | ----------------------------- | ---------------------------------------------------------- |
| Millennial Kestrel |        10 | Starter read  | Soft sine wave                | Engine pulse, gentle hull tilt, cockpit scan line          |
| Royal Saucer       |        14 | Float target  | Arc path with vertical bob    | Dome shimmer, counter-rotating rim markers                 |
| Halo Courier       |        17 | Curve read    | Smooth S-curve                | Orbiting ring dots, core pulse before curve changes        |
| Needle Frigate     |        21 | Timing target | Dash-stop-dash                | Engine charge before dash, short residual trail after dash |
| Blockade Lantern   |        23 | Heavy reward  | Slow wide S-curve             | Lantern blinks, heavy hull sag on turns                    |
| Tri-Wing Phantom   |        30 | Elite target  | Zigzag with short blink shift | Wing shimmer warning, brief phase flicker on blink         |

## Balance Rules

The score curve should reward difficulty without making simple ships feel worthless:

- Low-risk ships stay useful but score less than before.
- Mid-tier ships should be worth chasing when their path is favorable.
- Elite ships should feel like a clear reward moment.
- The Tri-Wing Phantom blink must have a readable warning; an untelegraphed teleport is out of scope.

Approved score curve: `10 / 14 / 17 / 21 / 23 / 30`.

## Movement Model

Add movement behavior per archetype instead of hard-coding straight-line travel for every ship.

Each active ship should retain enough spawn-time parameters to make its path deterministic during its lifetime:

- `spawnX`, `spawnY`
- `direction`
- `speed`
- `spawnedAtMs` or equivalent elapsed age
- movement pattern id
- optional pattern seed or phase offset

The simulation should compute position from the ship age and pattern. This keeps visuals and collision using the same world coordinates.

## Visual Model

Keep SVGs as asset files under `public/assets/characters/`. Improve each ship SVG directly with lightweight internal SVG animation where useful:

- animated engine glow
- blinking lights
- cockpit or core pulse
- rotating or orbiting detail groups
- phase/shimmer warning states

If Phaser image loading does not reliably animate embedded SVGs in all target browsers, move the animation layer into Phaser using separate glow/trail graphics and keep SVG files static. The implementation should verify this before relying on embedded SVG animation.

## Gameplay Feedback

The player should be able to infer risk from the ship:

- Needle Frigate charges visibly before dashing.
- Halo Courier pulses before an S-curve direction change.
- Blockade Lantern looks heavy and slow, with a wider path.
- Tri-Wing Phantom shimmers before its blink shift.

Targeted ships can still receive the existing tint/glow treatment, but that treatment should not hide the unique ship animation.

## Testing

Implementation should include focused checks for:

- score values match the approved curve
- each archetype maps to the intended movement pattern
- ships are removed correctly after capture or escape
- collision uses actual patterned position, not an obsolete straight-line position
- game remains playable on mobile viewport sizes

Manual playtest should confirm:

- every ship is visually distinguishable at gameplay size
- high-reward ships feel harder but fair
- blink and dash behaviors have readable warnings
- score pacing still feels satisfying

## Out of Scope

- Adding new ship archetypes beyond the existing six
- Changing worm controls or strike rules
- Reworking audio
- Adding powerups or ship health
