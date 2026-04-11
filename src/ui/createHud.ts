import type { AudioCredit, SceneBridge } from "../game/types";

interface HudController {
  destroy: () => void;
}

export function createHud(
  mountNode: HTMLElement,
  bridge: SceneBridge,
  audioCredits: AudioCredit[]
): HudController {
  mountNode.innerHTML = `
    <section class="hud">
      <div class="hud__topbar">
        <div class="chip chip--score">
          <span class="chip__label">Score</span>
          <strong id="score-value">0</strong>
        </div>
        <button class="chip chip--credits" id="credits-toggle" type="button">Credits</button>
      </div>
      <div class="hud__status">
        <div class="satiation">
          <div class="satiation__meta">
            <span>Satiety</span>
            <strong id="satiation-value">100%</strong>
          </div>
          <div class="satiation__track">
            <div class="satiation__fill" id="satiation-fill"></div>
          </div>
        </div>
      </div>
      <div class="overlay overlay--visible" id="start-overlay">
        <div class="overlay__panel">
          <p class="eyebrow">Space Worm</p>
          <h1>Хватай пролетающие корабли, пока сытость не обнулилась.</h1>
          <p class="overlay__copy">
            Тап по кораблю запускает атаку. Промах дает короткий recovery и штраф к сытости.
          </p>
          <button class="overlay__action" id="start-button" type="button">Tap To Start</button>
        </div>
      </div>
      <div class="overlay" id="gameover-overlay">
        <div class="overlay__panel overlay__panel--danger">
          <p class="eyebrow">Game Over</p>
          <h2>Червь проголодался и спрятался в астероид.</h2>
          <p class="overlay__copy">Рекорд этого забега: <strong id="gameover-score">0</strong></p>
          <button class="overlay__action" id="restart-button" type="button">Hunt Again</button>
        </div>
      </div>
      <aside class="credits" id="credits-drawer" aria-hidden="true">
        <div class="credits__panel">
          <div class="credits__header">
            <p class="eyebrow">Audio Credits</p>
            <button class="credits__close" id="credits-close" type="button">Close</button>
          </div>
          <ul class="credits__list">
            ${audioCredits
              .map(
                (credit) => `
                <li>
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
  const satiationValue =
    mountNode.querySelector<HTMLElement>("#satiation-value");
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
  const startButton =
    mountNode.querySelector<HTMLButtonElement>("#start-button");
  const restartButton =
    mountNode.querySelector<HTMLButtonElement>("#restart-button");

  startButton?.addEventListener("click", () => bridge.dispatch("startRun"));
  restartButton?.addEventListener("click", () => bridge.dispatch("restartRun"));
  creditsToggle?.addEventListener("click", () => {
    creditsDrawer?.classList.add("credits--open");
    creditsDrawer?.setAttribute("aria-hidden", "false");
  });
  creditsClose?.addEventListener("click", () => {
    creditsDrawer?.classList.remove("credits--open");
    creditsDrawer?.setAttribute("aria-hidden", "true");
  });

  const unsubscribe = bridge.subscribe((state) => {
    if (scoreValue) {
      scoreValue.textContent = String(state.score);
    }

    if (satiationValue) {
      satiationValue.textContent = `${Math.round(state.satiation)}%`;
    }

    if (satiationFill) {
      satiationFill.style.transform = `scaleX(${Math.max(0, state.satiation / 100)})`;
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
