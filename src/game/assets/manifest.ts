import type { AssetManifest } from "../types";

const imageBase = "assets";

export const ASSET_MANIFEST: AssetManifest = {
  images: [
    { key: "worm-head", url: `${imageBase}/characters/worm-head.svg` },
    { key: "worm-segment", url: `${imageBase}/characters/worm-segment.svg` },
    { key: "worm-jaw-top", url: `${imageBase}/characters/worm-jaw-top.svg` },
    {
      key: "worm-jaw-bottom",
      url: `${imageBase}/characters/worm-jaw-bottom.svg`
    },
    {
      key: "space-backdrop",
      url: `${imageBase}/environment/space-backdrop.jpg`
    },
    {
      key: "moon-satellite",
      url: `${imageBase}/environment/moon-satellite.svg`
    },
    { key: "asteroid-lair", url: `${imageBase}/environment/asteroid-lair.svg` },
    { key: "planet-home", url: `${imageBase}/environment/planet-home.svg` },
    { key: "dust-rock", url: `${imageBase}/environment/dust-rock.svg` },
    {
      key: "constellation-glyph",
      url: `${imageBase}/environment/constellation-glyph.svg`
    },
    {
      key: "ship-falconish",
      url: `${imageBase}/characters/ship-falconish.svg`
    },
    { key: "ship-saucer", url: `${imageBase}/characters/ship-saucer.svg` },
    { key: "ship-arrow", url: `${imageBase}/characters/ship-arrow.svg` },
    { key: "ship-ring", url: `${imageBase}/characters/ship-ring.svg` },
    { key: "ship-triwing", url: `${imageBase}/characters/ship-triwing.svg` },
    { key: "ship-blockade", url: `${imageBase}/characters/ship-blockade.svg` }
  ],
  audio: [
    { key: "music-loop", url: "assets/audio/music-loop.ogg" },
    { key: "sfx-bite-windup", url: "assets/audio/sfx-bite-windup.ogg" },
    { key: "sfx-bite-hit", url: "assets/audio/sfx-bite-hit.ogg" },
    { key: "sfx-bite-miss", url: "assets/audio/sfx-bite-miss.ogg" },
    { key: "sfx-ship-pass", url: "assets/audio/sfx-ship-pass.ogg" },
    { key: "sfx-satiety-low", url: "assets/audio/sfx-satiety-low.ogg" },
    { key: "sfx-game-over", url: "assets/audio/sfx-game-over.ogg" },
    { key: "sfx-ui-open", url: "assets/audio/sfx-ui-open.ogg" },
    { key: "sfx-ui-close", url: "assets/audio/sfx-ui-close.ogg" }
  ],
  audioCredits: [
    {
      key: "music-loop",
      title: "Out There",
      author: "yd",
      license: "CC0 1.0",
      sourceUrl: "https://opengameart.org/content/space-music-out-there",
      downloadUrl: "https://opengameart.org/sites/default/files/OutThere_0.ogg"
    },
    {
      key: "sfx-bite-windup",
      title: "forceField_002.ogg from Sci-Fi Sounds",
      author: "Kenney",
      license: "CC0 1.0",
      sourceUrl: "https://kenney.nl/assets/sci-fi-sounds",
      downloadUrl:
        "https://opengameart.org/sites/default/files/sci-fi_sounds.zip"
    },
    {
      key: "sfx-bite-hit",
      title: "slime_000.ogg from Sci-Fi Sounds",
      author: "Kenney",
      license: "CC0 1.0",
      sourceUrl: "https://kenney.nl/assets/sci-fi-sounds",
      downloadUrl:
        "https://opengameart.org/sites/default/files/sci-fi_sounds.zip"
    },
    {
      key: "sfx-bite-miss",
      title: "error_005.ogg from Interface Sounds",
      author: "Kenney",
      license: "CC0 1.0",
      sourceUrl: "https://kenney.nl/assets/interface-sounds",
      downloadUrl:
        "https://opengameart.org/sites/default/files/kenney_interfaceSounds.zip"
    },
    {
      key: "sfx-ship-pass",
      title: "spaceEngine_003.ogg from Sci-Fi Sounds",
      author: "Kenney",
      license: "CC0 1.0",
      sourceUrl: "https://kenney.nl/assets/sci-fi-sounds",
      downloadUrl:
        "https://opengameart.org/sites/default/files/sci-fi_sounds.zip"
    },
    {
      key: "sfx-satiety-low",
      title: "computerNoise_001.ogg from Sci-Fi Sounds",
      author: "Kenney",
      license: "CC0 1.0",
      sourceUrl: "https://kenney.nl/assets/sci-fi-sounds",
      downloadUrl:
        "https://opengameart.org/sites/default/files/sci-fi_sounds.zip"
    },
    {
      key: "sfx-game-over",
      title: "lowFrequency_explosion_000.ogg from Sci-Fi Sounds",
      author: "Kenney",
      license: "CC0 1.0",
      sourceUrl: "https://kenney.nl/assets/sci-fi-sounds",
      downloadUrl:
        "https://opengameart.org/sites/default/files/sci-fi_sounds.zip"
    },
    {
      key: "sfx-ui-open",
      title: "open_002.ogg from Interface Sounds",
      author: "Kenney",
      license: "CC0 1.0",
      sourceUrl: "https://kenney.nl/assets/interface-sounds",
      downloadUrl:
        "https://opengameart.org/sites/default/files/kenney_interfaceSounds.zip"
    },
    {
      key: "sfx-ui-close",
      title: "close_002.ogg from Interface Sounds",
      author: "Kenney",
      license: "CC0 1.0",
      sourceUrl: "https://kenney.nl/assets/interface-sounds",
      downloadUrl:
        "https://opengameart.org/sites/default/files/kenney_interfaceSounds.zip"
    }
  ]
};
