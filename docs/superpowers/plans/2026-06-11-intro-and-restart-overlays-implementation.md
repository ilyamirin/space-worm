# Intro And Restart Overlays Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current overlay implementation with a single-spore full-motion intro and keep the separate trophy-style restart modal.

**Architecture:** Keep the whole change inside the existing DOM HUD layer. Regenerate the intro background so it contains only sky, planet, and crater; then retune the `createHud.ts` intro stages to `approach`, `descent`, `impact`, and `ready`, with one animated spore actor and one crater-flash layer in CSS. Do not touch simulation state or Phaser scenes.

**Tech Stack:** TypeScript, Phaser 3, Vite, DOM HUD overlays, CSS transitions, Replicate Nano Banana 2 helper scripts, Chrome headless screenshot capture, existing `pnpm run verify` pipeline.

---

## File Structure

- Create `public/assets/ui/intro-spore-crater.png`: clean intro background with no large spore in the sky.
- Modify `src/ui/createHud.ts`: retune intro overlay stages, timer names, and CTA reveal timing while keeping the restart modal structure.
- Modify `src/styles.css`: replace the current two-read interpretation with a single small falling spore, a compact descent trail, and a crater impact flash.
- Verify in browser at `390x844` and `1440x900`, then run `pnpm run verify`.

## Task 1: Regenerate The Intro Background Without A Sky Spore

**Files:**

- Create: `public/assets/ui/intro-spore-crater.png`
- Temporary artifact: `/private/tmp/space-worm-intro-reference.png`

- [ ] **Step 1: Start the local game on a clean port**

Run:

```bash
pnpm dev --host 127.0.0.1 --port 4176
```

Expected: Vite prints `Local:   http://127.0.0.1:4176/`

- [ ] **Step 2: Capture a fresh gameplay reference**

Run:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new \
  --disable-gpu \
  --hide-scrollbars \
  --window-size=390,844 \
  --virtual-time-budget=5000 \
  --screenshot=/private/tmp/space-worm-intro-reference.png \
  http://127.0.0.1:4176/
```

Expected: `/private/tmp/space-worm-intro-reference.png` exists.

- [ ] **Step 3: Generate the clean crater background**

Run:

```bash
/Users/ilyagmirin/PycharmProjects/codex_skills/skills/engineering/replicate-nano-banana-2-http/scripts/run-image.sh \
  --prompt "Portrait mobile game intro background. Keep the existing black cosmic sky, the small earthlike planet, readable forests, lakes, mountains, and the crater on the surface. Remove any large spore or glowing object from the sky. Leave clean negative space above the planet for a later animated falling spore. High contrast, moody, premium, painterly but clean, consistent with the current game palette. No typography, no UI, no ships, no giant comet trail." \
  --image-input /private/tmp/space-worm-intro-reference.png \
  --aspect-ratio "9:16" \
  --resolution "1K" \
  --output-format "png" \
  --output /Users/ilyagmirin/PycharmProjects/space_worm/public/assets/ui/intro-spore-crater.png
```

Expected:

- stdout contains `prediction_id=...`
- stdout contains `output_file=/Users/ilyagmirin/PycharmProjects/space_worm/public/assets/ui/intro-spore-crater.png`
- the output file exists locally

- [ ] **Step 4: Validate the generated file**

Run:

```bash
file public/assets/ui/intro-spore-crater.png
```

Expected: PNG image data is reported.

- [ ] **Step 5: Visual review the background**

Inspect the image and confirm:

- the crater is clearly visible
- there is no large static spore in the sky
- the upper half leaves room for a small falling object
- the bottom of frame still leaves room for the start button

- [ ] **Step 6: Stage the new intro background only**

Run:

```bash
git add public/assets/ui/intro-spore-crater.png
```

Do not commit yet.

## Task 2: Retune HUD Intro Stages In `createHud.ts`

**Files:**

- Modify: `src/ui/createHud.ts`

- [ ] **Step 1: Point the intro markup at the same actor model**

Keep the restart modal structure as-is. In the start overlay markup, keep exactly one animated spore element and one crater glow element:

```ts
<div class="overlay overlay--visible overlay--intro" id="start-overlay">
  <div class="start-intro" id="start-intro" data-stage="approach">
    <div class="start-intro__art"></div>
    <div class="start-intro__shade"></div>
    <div class="start-intro__spore"></div>
    <div class="start-intro__trail"></div>
    <div class="start-intro__crater-glow"></div>
    <p class="start-intro__wordmark" aria-hidden="true">SPACE WORM</p>
    <button
      class="start-intro__play"
      id="start-button"
      type="button"
      aria-label="Start game"
    >
      <span class="start-intro__play-core"></span>
    </button>
  </div>
</div>
```

This replaces the previous interpretation where the background art itself also contained a large spore.

- [ ] **Step 2: Change the intro stage type and timer flow**

Replace the local helpers with:

```ts
const startIntro = mountNode.querySelector<HTMLElement>("#start-intro");
let introTimer: number | null = null;
let introPlayedForReady = false;

const clearIntroTimer = (): void => {
  if (introTimer !== null) {
    window.clearTimeout(introTimer);
    introTimer = null;
  }
};

const setIntroStage = (
  stage: "approach" | "descent" | "impact" | "ready"
): void => {
  startIntro?.setAttribute("data-stage", stage);
};

const playIntroSequence = (): void => {
  clearIntroTimer();
  startButton?.setAttribute("data-visible", "false");
  setIntroStage("approach");

  window.setTimeout(() => setIntroStage("descent"), 700);
  window.setTimeout(() => setIntroStage("impact"), 1650);
  introTimer = window.setTimeout(() => {
    setIntroStage("ready");
    startButton?.setAttribute("data-visible", "true");
  }, 2500);
};
```

This matches the approved `approach → descent → impact → ready` sequence.

- [ ] **Step 3: Keep the ready/gameOver state transitions explicit**

Use this state block inside `bridge.subscribe`:

```ts
if (state.phase === "ready") {
  startOverlay?.classList.add("overlay--visible");
  gameoverOverlay?.classList.remove("overlay--visible");

  if (!introPlayedForReady) {
    introPlayedForReady = true;
    playIntroSequence();
  }
} else if (state.phase === "gameOver") {
  clearIntroTimer();
  startOverlay?.classList.remove("overlay--visible");
  gameoverOverlay?.classList.add("overlay--visible");
  if (gameoverScore) {
    gameoverScore.textContent = String(state.score);
  }
} else {
  clearIntroTimer();
  startOverlay?.classList.remove("overlay--visible");
  gameoverOverlay?.classList.remove("overlay--visible");
}
```

This preserves the separate restart flow.

- [ ] **Step 4: Keep pre-CTA taps impossible**

Use this button behavior:

```ts
startButton?.addEventListener("click", () => {
  clearIntroTimer();
  bridge.dispatch("startRun");
});

restartButton?.addEventListener("click", () => {
  bridge.dispatch("restartRun");
});
```

The visual gating is handled in CSS by `visibility: hidden` and `pointer-events: none` until `data-visible="true"`.

- [ ] **Step 5: Ensure cleanup still clears timers**

Use:

```ts
destroy: () => {
  clearIntroTimer();
  unsubscribe();
  mountNode.innerHTML = "";
};
```

- [ ] **Step 6: Run a quick TS-side smoke check**

Run:

```bash
pnpm eslint src/ui/createHud.ts
```

Expected: no lint errors.

## Task 3: Replace The Intro Animation In `styles.css`

**Files:**

- Modify: `src/styles.css`

- [ ] **Step 1: Point the art layer at the new background**

Set:

```css
.start-intro__art {
  background: center / cover no-repeat url("/assets/ui/intro-spore-crater.png");
  transform: scale(1.035);
  transition:
    transform 800ms ease,
    filter 600ms ease;
}
```

- [ ] **Step 2: Add the one-spore actor and compact trail**

Add or replace these blocks:

```css
.start-intro__spore,
.start-intro__trail,
.start-intro__crater-glow {
  position: absolute;
  pointer-events: none;
}

.start-intro__spore {
  left: 50%;
  top: 18%;
  width: 18px;
  height: 18px;
  margin-left: -9px;
  border-radius: 999px;
  background: radial-gradient(
    circle,
    rgba(255, 248, 226, 0.98),
    rgba(159, 242, 255, 0.88) 58%,
    transparent 74%
  );
  box-shadow:
    0 0 12px rgba(159, 242, 255, 0.4),
    0 0 24px rgba(255, 231, 180, 0.24);
  opacity: 0.9;
  transform: translate(-90px, -36px) scale(0.72);
  transition:
    transform 920ms cubic-bezier(0.23, 0.76, 0.18, 1),
    opacity 260ms ease,
    filter 260ms ease;
}

.start-intro__trail {
  left: 50%;
  top: 19%;
  width: 112px;
  height: 18px;
  margin-left: -56px;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(165, 243, 255, 0.1) 28%,
    rgba(255, 224, 171, 0.34) 100%
  );
  filter: blur(5px);
  opacity: 0;
  transform-origin: center;
  transform: translate(-122px, -18px) rotate(22deg) scaleX(0.64);
  transition:
    transform 920ms cubic-bezier(0.23, 0.76, 0.18, 1),
    opacity 220ms ease;
}

.start-intro__crater-glow {
  left: 50%;
  bottom: 17.6%;
  width: 164px;
  height: 70px;
  margin-left: -82px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(199, 248, 214, 0.34),
    rgba(150, 234, 255, 0.14) 46%,
    transparent 72%
  );
  opacity: 0;
  transform: scale(0.8);
  transition:
    opacity 180ms ease,
    transform 220ms ease;
}
```

- [ ] **Step 3: Implement the approved stage motion**

Add:

```css
.start-intro[data-stage="approach"] .start-intro__art {
  transform: scale(1.05) translateY(-0.8%);
}

.start-intro[data-stage="approach"] .start-intro__spore {
  transform: translate(-102px, -48px) scale(0.62);
}

.start-intro[data-stage="approach"] .start-intro__trail {
  opacity: 0;
}

.start-intro[data-stage="descent"] .start-intro__art {
  transform: scale(1.03) translateY(0);
}

.start-intro[data-stage="descent"] .start-intro__spore {
  transform: translate(8px, 248px) scale(0.92);
}

.start-intro[data-stage="descent"] .start-intro__trail {
  opacity: 0.92;
  transform: translate(-18px, 176px) rotate(62deg) scaleX(1);
}

.start-intro[data-stage="impact"] .start-intro__spore {
  transform: translate(20px, 292px) scale(0.34);
  opacity: 0.18;
  filter: blur(1.2px);
}

.start-intro[data-stage="impact"] .start-intro__trail {
  opacity: 0;
}

.start-intro[data-stage="impact"] .start-intro__crater-glow {
  opacity: 1;
  transform: scale(1.08);
}

.start-intro[data-stage="ready"] .start-intro__spore,
.start-intro[data-stage="ready"] .start-intro__trail {
  opacity: 0;
}

.start-intro[data-stage="ready"] .start-intro__crater-glow {
  opacity: 0.28;
  transform: scale(1);
}
```

- [ ] **Step 4: Keep the CTA hidden until ready**

Use:

```css
.start-intro__play {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: translateY(14px) scale(0.94);
}

.start-intro__play[data-visible="true"] {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: translateY(0) scale(1);
}
```

- [ ] **Step 5: Preserve reduced-motion and mobile sizing**

Inside the existing reduced-motion block, add:

```css
.start-intro__art,
.start-intro__spore,
.start-intro__trail,
.start-intro__crater-glow,
.start-intro__play {
  transition: none;
}
```

Inside the mobile breakpoint, keep:

```css
.start-intro__play {
  width: 82px;
  height: 82px;
  margin-left: -41px;
}

.restart-modal {
  width: min(78vw, 228px);
}
```

- [ ] **Step 6: Run CSS checks**

Run:

```bash
pnpm stylelint "src/**/*.css"
pnpm prettier --check src/styles.css src/ui/createHud.ts
```

Expected:

- Stylelint passes
- Prettier reports both files are correctly formatted

## Task 4: Verify The Full Flow And Commit Overlay Work

**Files:**

- Modify: none
- Test target: `http://127.0.0.1:4176/`

- [ ] **Step 1: Run the app and inspect the first screen**

Run:

```bash
pnpm dev --host 127.0.0.1 --port 4176
```

Check visually:

- only one spore is readable
- the background contains no large sky spore
- the spore path clearly points to the crater
- the CTA appears only after the impact settles

- [ ] **Step 2: Smoke test mobile portrait**

Check at `390x844`:

- no cropped CTA
- crater remains visible
- spore remains small but readable
- no console errors

- [ ] **Step 3: Smoke test wide desktop**

Check at `1440x900`:

- portrait frame stays centered
- intro still reads as one object and one landing
- restart modal remains centered and distinct
- no console errors

- [ ] **Step 4: Run the full verification pipeline**

Run:

```bash
pnpm run verify
```

Expected: lint, format, security, and build checks all pass.

- [ ] **Step 5: Commit only the overlay implementation files**

Run:

```bash
git add public/assets/ui/intro-spore-crater.png src/ui/createHud.ts src/styles.css
git commit -m "Refine intro overlay to single-spore motion"
```

If the older generated file `public/assets/ui/intro-spore-landing.png` is no longer referenced anywhere, delete it before commit and include that deletion in the same commit:

```bash
git rm public/assets/ui/intro-spore-landing.png
```

## Self-Review

- Spec coverage:
  - one-spore reading: covered by Tasks 1, 2, and 3
  - full-motion intro: covered by Tasks 2 and 3
  - crater-only background art: covered by Task 1
  - preserved trophy restart modal: covered by Task 2 and Task 4
  - mobile and wide responsiveness: covered by Task 3 Step 5 and Task 4 Steps 2-3
- Placeholder scan:
  - no `TODO`, `TBD`, or deferred requirements remain
- Type consistency:
  - stage names are consistently `approach`, `descent`, `impact`, `ready`
  - art file name is consistently `intro-spore-crater.png`
