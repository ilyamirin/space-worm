# Space Worm

Space Worm is a fully AI-generated small cinematic arcade game about an enormous
cosmic predator rising from a living planet to snap passing ships out of orbit.

You control the worm with one action: click or tap a ship. The worm lunges,
bites, retracts, and must keep feeding before its satiety runs out. The game is
built for quick dramatic runs: neon ships cut across a dark orbital sky,
pixel comets streak through the background, and the planet waits below like a
stage for the next strike.

![Space Worm gameplay screenshot](docs/gameplay-screenshot.jpg)

## What Makes It Interesting

- One-button arcade loop: target ships, strike, recover, repeat.
- A satiety meter that constantly drains and turns every miss into pressure.
- Multiple ship archetypes with different silhouettes, values, speeds, and
  movement patterns.
- A layered Phaser scene with parallax space, an orbital moon, pixel comets,
  ship trails, worm appendages, bite feedback, start/restart overlays, and audio
  cues.
- A compact TypeScript/Vite codebase that is easy to run locally and modify.

## How The Game Works

The game runs as a Phaser scene backed by a small deterministic-ish simulation
layer:

1. The simulation spawns ships into flight lanes.
2. Each ship follows its archetype movement pattern.
3. The player clicks or taps a target.
4. The worm extends toward the target and either captures it or misses.
5. A hit adds score and restores satiety.
6. A miss costs satiety and forces a short recovery.
7. The run ends when satiety reaches zero.

The UI is deliberately minimal: score, satiety, and the game world stay visible
without menus interrupting the action.

## Controls

- Start run: click/tap the start button after the intro.
- Attack: click/tap a ship.
- Restart: click/tap the restart button after game over.

## Tech Stack

- [Phaser 3](https://phaser.io/) for rendering, input, scenes, audio, and game
  objects.
- [TypeScript](https://www.typescriptlang.org/) for game state and view logic.
- [Vite](https://vite.dev/) for local development and production builds.
- Plain DOM/CSS for the HUD and overlays.

## Run Locally

Requirements:

- Node.js 20+ recommended.
- pnpm.

Install dependencies:

```bash
pnpm install
```

Start the development server:

```bash
pnpm dev
```

Build a production bundle:

```bash
pnpm build
```

Preview the production bundle:

```bash
pnpm preview
```

Run the project checks:

```bash
pnpm verify
```

Note: in local worktrees, `pnpm verify` can fail if unrelated generated build
artifacts are present under ignored or auxiliary worktree folders. The game
build itself is `pnpm build`.

## Project Structure

```text
src/game/               Simulation, content definitions, asset manifest, types
src/phaser/             Phaser scenes, view objects, scene bridge
src/ui/                 DOM HUD and overlay creation
src/styles.css          App frame, HUD, intro, and restart styling
public/assets/          Runtime image, audio, and data assets
docs/                   Design notes and README screenshot
```

## AI Generation Disclosure

This project is intentionally fully AI-generated, except for the credited CC0
third-party audio assets.

All original project work was produced with AI assistance, including the game
concept, TypeScript implementation, CSS, generated visual art direction, SVG
game objects, UI composition, documentation, and the gameplay screenshot. Human
direction was used to steer the result, choose the style, request fixes, and
approve changes.

Third-party audio assets are not claimed as AI-generated. They are credited
below and are used under free licenses.

## Assets And Credits

Original project assets:

- Worm, ships, UI composition, generated environment imagery, intro artwork,
  gameplay visuals, code, and documentation: AI-generated for this project.

Free third-party audio assets:

- Music: **"Out There"** by **yd**, licensed **CC0 1.0**.
  Source: <https://opengameart.org/content/space-music-out-there>
- Sound effects and ship engine sounds from **Kenney Sci-Fi Sounds**, licensed
  **CC0 1.0**.
  Source: <https://kenney.nl/assets/sci-fi-sounds>
- Interface sounds from **Kenney Interface Sounds**, licensed **CC0 1.0**.
  Source: <https://kenney.nl/assets/interface-sounds>

The machine-readable audio credit list lives in
[`public/assets/data/audioCredits.json`](public/assets/data/audioCredits.json).

## License

The project code and original project assets are released under the MIT License.
See [LICENSE](LICENSE).

Third-party audio remains under its original CC0 1.0 terms as credited above.
