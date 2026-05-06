import Phaser from "phaser";
import { ASSET_MANIFEST } from "./game/assets/manifest";
import { WORLD_HEIGHT, WORLD_WIDTH } from "./game/simulation/config";
import { createSceneBridge } from "./phaser/adapters/sceneBridge";
import { BootScene } from "./phaser/scenes/BootScene";
import { GameplayScene } from "./phaser/scenes/GameplayScene";
import { createHud, type UiSoundCue } from "./ui/createHud";
import "./styles.css";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root not found");
}

app.innerHTML = `
  <main class="shell">
    <section class="frame">
      <div id="game-root" class="frame__canvas"></div>
      <div id="hud-root" class="frame__hud"></div>
    </section>
  </main>
`;

const bridge = createSceneBridge();
const hudRoot = document.querySelector<HTMLElement>("#hud-root");
const gameRoot = document.querySelector<HTMLElement>("#game-root");

if (!hudRoot || !gameRoot) {
  throw new Error("Game mount nodes are missing");
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: gameRoot,
  width: WORLD_WIDTH,
  height: WORLD_HEIGHT,
  backgroundColor: "#07111d",
  transparent: false,
  scene: [BootScene, GameplayScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: WORLD_WIDTH,
    height: WORLD_HEIGHT
  },
  render: {
    antialias: true,
    pixelArt: false
  },
  callbacks: {
    preBoot: (phaserGame) => {
      phaserGame.registry.set("bridge", bridge);
    }
  }
});

const playUiSound = (cue: UiSoundCue) => {
  const key = cue === "open" ? "sfx-ui-open" : "sfx-ui-close";
  const volume = cue === "open" ? 0.5 : 0.42;

  if ("context" in game.sound && game.sound.context?.state !== "running") {
    void game.sound.context.resume().then(() => {
      game.sound.play(key, { volume });
    });
    return;
  }

  game.sound.play(key, { volume });
};

createHud(hudRoot, bridge, ASSET_MANIFEST.audioCredits, playUiSound);

const unlockAudio = () => {
  if ("context" in game.sound && game.sound.context) {
    void game.sound.context.resume();
  }
};

window.addEventListener("pointerdown", unlockAudio, { passive: true });
