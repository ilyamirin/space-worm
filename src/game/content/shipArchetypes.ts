import type { ShipArchetype } from "../types";

export const SHIP_ARCHETYPES: ShipArchetype[] = [
  {
    id: "falconish",
    parodyName: "Millennial Kestrel",
    spriteKey: "ship-falconish",
    hitRadius: 84,
    baseSpeed: 290,
    scoreValue: 12,
    satiationValue: 14,
    spawnWeight: 5
  },
  {
    id: "saucer",
    parodyName: "Royal Saucer",
    spriteKey: "ship-saucer",
    hitRadius: 88,
    baseSpeed: 240,
    scoreValue: 14,
    satiationValue: 16,
    spawnWeight: 4
  },
  {
    id: "arrow",
    parodyName: "Needle Frigate",
    spriteKey: "ship-arrow",
    hitRadius: 72,
    baseSpeed: 360,
    scoreValue: 18,
    satiationValue: 18,
    spawnWeight: 3
  },
  {
    id: "ring",
    parodyName: "Halo Courier",
    spriteKey: "ship-ring",
    hitRadius: 80,
    baseSpeed: 320,
    scoreValue: 16,
    satiationValue: 17,
    spawnWeight: 4
  },
  {
    id: "triwing",
    parodyName: "Tri-Wing Phantom",
    spriteKey: "ship-triwing",
    hitRadius: 76,
    baseSpeed: 385,
    scoreValue: 22,
    satiationValue: 21,
    spawnWeight: 2
  },
  {
    id: "blockade",
    parodyName: "Blockade Lantern",
    spriteKey: "ship-blockade",
    hitRadius: 92,
    baseSpeed: 260,
    scoreValue: 20,
    satiationValue: 24,
    spawnWeight: 2
  }
];
