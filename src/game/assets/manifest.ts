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
    { key: "asteroid-lair", url: `${imageBase}/environment/asteroid-lair.svg` },
    { key: "planet-home", url: `${imageBase}/environment/planet-home.svg` },
    { key: "station-spire", url: `${imageBase}/environment/station-spire.svg` },
    { key: "comet-tail", url: `${imageBase}/environment/comet-tail.svg` },
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
    {
      key: "music-loop",
      url: "assets/audio/music-loop.ogg"
    },
    {
      key: "sfx-bite",
      url: "assets/audio/select_004.ogg"
    },
    {
      key: "sfx-miss",
      url: "assets/audio/error_005.ogg"
    }
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
      key: "sfx-bite",
      title: "select_004.ogg from Interface Sounds",
      author: "Kenney",
      license: "CC0 1.0",
      sourceUrl: "https://opengameart.org/content/interface-sounds",
      downloadUrl:
        "https://opengameart.org/sites/default/files/kenney_interfaceSounds.zip"
    },
    {
      key: "sfx-miss",
      title: "error_005.ogg from Interface Sounds",
      author: "Kenney",
      license: "CC0 1.0",
      sourceUrl: "https://opengameart.org/content/interface-sounds",
      downloadUrl:
        "https://opengameart.org/sites/default/files/kenney_interfaceSounds.zip"
    }
  ]
};
