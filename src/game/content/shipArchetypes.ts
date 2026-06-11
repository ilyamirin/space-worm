import type { ShipArchetype } from "../types";

export const SHIP_ARCHETYPES: ShipArchetype[] = [
  {
    id: "falconish",
    parodyName: "Millennial Kestrel",
    spriteKey: "ship-falconish",
    hitRadius: 58,
    renderScale: 0.7,
    glowColor: 0x90d4ff,
    trailColor: 0x74c8ff,
    baseSpeed: 290,
    scoreValue: 10,
    satiationValue: 14,
    spawnWeight: 5,
    movementPattern: "sine"
  },
  {
    id: "saucer",
    parodyName: "Royal Saucer",
    spriteKey: "ship-saucer",
    hitRadius: 61,
    renderScale: 0.68,
    glowColor: 0xffd68e,
    trailColor: 0xffb160,
    baseSpeed: 240,
    scoreValue: 14,
    satiationValue: 16,
    spawnWeight: 4,
    movementPattern: "arc"
  },
  {
    id: "arrow",
    parodyName: "Needle Frigate",
    spriteKey: "ship-arrow",
    hitRadius: 49,
    renderScale: 0.61,
    glowColor: 0x8af7e0,
    trailColor: 0x59d6c4,
    baseSpeed: 360,
    scoreValue: 21,
    satiationValue: 18,
    spawnWeight: 3,
    movementPattern: "dashStop"
  },
  {
    id: "ring",
    parodyName: "Halo Courier",
    spriteKey: "ship-ring",
    hitRadius: 54,
    renderScale: 0.65,
    glowColor: 0xc0b7ff,
    trailColor: 0x9787ff,
    baseSpeed: 320,
    scoreValue: 17,
    satiationValue: 17,
    spawnWeight: 4,
    movementPattern: "sCurve"
  },
  {
    id: "triwing",
    parodyName: "Tri-Wing Phantom",
    spriteKey: "ship-triwing",
    hitRadius: 52,
    renderScale: 0.63,
    glowColor: 0xff94d2,
    trailColor: 0xff6db3,
    baseSpeed: 385,
    scoreValue: 30,
    satiationValue: 21,
    spawnWeight: 2,
    movementPattern: "zigzagBlink"
  },
  {
    id: "blockade",
    parodyName: "Blockade Lantern",
    spriteKey: "ship-blockade",
    hitRadius: 65,
    renderScale: 0.74,
    glowColor: 0xaef0ff,
    trailColor: 0x86bfd7,
    baseSpeed: 260,
    scoreValue: 23,
    satiationValue: 24,
    spawnWeight: 2,
    movementPattern: "wideSCurve"
  }
];
