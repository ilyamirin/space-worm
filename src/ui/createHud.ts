import type { AudioCredit, SceneBridge } from "../game/types";

interface HudController {
  destroy: () => void;
}

export type UiSoundCue = "open" | "close";

export function createHud(
  mountNode: HTMLElement,
  bridge: SceneBridge,
  audioCredits: AudioCredit[],
  playUiSound: (cue: UiSoundCue) => void
): HudController {
  mountNode.innerHTML = `
    <section class="hud">
      <div class="hud__topbar">
        <div class="score-orb" aria-label="Score">
          <span class="score-orb__ring"></span>
          <span class="score-orb__glyph" aria-hidden="true"></span>
          <strong class="score-orb__value" id="score-value">0</strong>
        </div>
        <div class="satiety-ribbon" aria-label="Satiety">
          <span class="satiety-ribbon__icon" aria-hidden="true"></span>
          <div class="satiety-ribbon__track">
            <div class="satiety-ribbon__glow"></div>
            <div class="satiety-ribbon__fill" id="satiation-fill"></div>
          </div>
        </div>
        <button class="hud-button hud-button--icon" id="credits-toggle" type="button" aria-label="Audio credits">
          <span class="hud-button__sound" aria-hidden="true"></span>
        </button>
      </div>

      <div class="overlay overlay--visible" id="start-overlay">
        <div class="overlay__panel overlay__panel--compact">
          <div class="overlay__halo"></div>
          <p class="eyebrow">Space Worm</p>
          <h1>Hunt</h1>
          <button class="overlay__action" id="start-button" type="button">Play</button>
        </div>
      </div>

      <div class="overlay" id="gameover-overlay">
        <div class="overlay__panel overlay__panel--danger overlay__panel--compact">
          <div class="overlay__halo overlay__halo--danger"></div>
          <p class="eyebrow">Game Over</p>
          <h2 id="gameover-score">0</h2>
          <button class="overlay__action overlay__action--danger" id="restart-button" type="button">Again</button>
        </div>
      </div>

      <aside class="credits" id="credits-drawer" aria-hidden="true">
        <div class="credits__scrim" id="credits-scrim"></div>
        <div class="credits__panel">
          <div class="credits__glow"></div>
          <div class="credits__header">
            <div>
              <p class="eyebrow">Audio Credits</p>
              <h3>Open-source soundtrack and interface sounds</h3>
            </div>
            <button class="hud-button hud-button--ghost" id="credits-close" type="button">Close</button>
          </div>
          <ul class="credits__list">
            ${audioCredits
              .map(
                (credit) => `
                <li class="credits__item">
                  <strong>${credit.title}</strong>
                  <span>${credit.author} · ${credit.license}</span>
                  <a href="${credit.sourceUrl}" target="_blank" rel="noreferrer">Source</a>
                </li>`
              )
              .join("")}
          </ul>
        </div>
      </aside>
    </section>
  `;

  const scoreValue = mountNode.querySelector<HTMLElement>("#score-value");
  const satiationFill = mountNode.querySelector<HTMLElement>("#satiation-fill");
  const startOverlay = mountNode.querySelector<HTMLElement>("#start-overlay");
  const gameoverOverlay =
    mountNode.querySelector<HTMLElement>("#gameover-overlay");
  const gameoverScore = mountNode.querySelector<HTMLElement>("#gameover-score");
  const creditsDrawer = mountNode.querySelector<HTMLElement>("#credits-drawer");
  const creditsToggle =
    mountNode.querySelector<HTMLButtonElement>("#credits-toggle");
  const creditsClose =
    mountNode.querySelector<HTMLButtonElement>("#credits-close");
  const creditsScrim =
    mountNode.querySelector<HTMLDivElement>("#credits-scrim");
  const startButton =
    mountNode.querySelector<HTMLButtonElement>("#start-button");
  const restartButton =
    mountNode.querySelector<HTMLButtonElement>("#restart-button");

  const openCredits = (): void => {
    creditsDrawer?.classList.add("credits--open");
    creditsDrawer?.setAttribute("aria-hidden", "false");
    playUiSound("open");
  };

  const closeCredits = (): void => {
    creditsDrawer?.classList.remove("credits--open");
    creditsDrawer?.setAttribute("aria-hidden", "true");
    playUiSound("close");
  };

  startButton?.addEventListener("click", () => bridge.dispatch("startRun"));
  restartButton?.addEventListener("click", () => bridge.dispatch("restartRun"));
  creditsToggle?.addEventListener("click", openCredits);
  creditsClose?.addEventListener("click", closeCredits);
  creditsScrim?.addEventListener("click", closeCredits);

  const unsubscribe = bridge.subscribe((state) => {
    if (scoreValue) {
      scoreValue.textContent = String(state.score);
    }

    if (satiationFill) {
      const normalized = Math.max(0, Math.min(1, state.satiation / 100));
      satiationFill.style.transform = `scaleX(${normalized})`;
      satiationFill.style.opacity = String(0.68 + normalized * 0.32);
      satiationFill.parentElement?.parentElement?.toggleAttribute(
        "data-low",
        state.satiation <= 25
      );
    }

    if (state.phase === "ready") {
      startOverlay?.classList.add("overlay--visible");
      gameoverOverlay?.classList.remove("overlay--visible");
    } else if (state.phase === "gameOver") {
      startOverlay?.classList.remove("overlay--visible");
      gameoverOverlay?.classList.add("overlay--visible");
      if (gameoverScore) {
        gameoverScore.textContent = String(state.score);
      }
    } else {
      startOverlay?.classList.remove("overlay--visible");
      gameoverOverlay?.classList.remove("overlay--visible");
    }
  });

  return {
    destroy: () => {
      unsubscribe();
      mountNode.innerHTML = "";
    }
  };
}
