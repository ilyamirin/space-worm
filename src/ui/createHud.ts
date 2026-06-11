import type { SceneBridge } from "../game/types";

interface HudController {
  destroy: () => void;
}

export function createHud(
  mountNode: HTMLElement,
  bridge: SceneBridge
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
      </div>

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

      <div class="overlay overlay--gameover" id="gameover-overlay">
        <div class="restart-modal">
          <div class="restart-modal__score" id="gameover-score">0</div>
          <button
            class="restart-modal__button"
            id="restart-button"
            type="button"
            aria-label="Restart run"
          >
            <span class="restart-modal__icon"></span>
          </button>
        </div>
      </div>
    </section>
  `;

  const scoreValue = mountNode.querySelector<HTMLElement>("#score-value");
  const satiationFill = mountNode.querySelector<HTMLElement>("#satiation-fill");
  const startOverlay = mountNode.querySelector<HTMLElement>("#start-overlay");
  const gameoverOverlay =
    mountNode.querySelector<HTMLElement>("#gameover-overlay");
  const gameoverScore = mountNode.querySelector<HTMLElement>("#gameover-score");
  const startIntro = mountNode.querySelector<HTMLElement>("#start-intro");
  const startButton =
    mountNode.querySelector<HTMLButtonElement>("#start-button");
  const restartButton =
    mountNode.querySelector<HTMLButtonElement>("#restart-button");
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

  startButton?.addEventListener("click", () => {
    clearIntroTimer();
    bridge.dispatch("startRun");
  });
  restartButton?.addEventListener("click", () => {
    bridge.dispatch("restartRun");
  });

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
  });

  return {
    destroy: () => {
      clearIntroTimer();
      unsubscribe();
      mountNode.innerHTML = "";
    }
  };
}
