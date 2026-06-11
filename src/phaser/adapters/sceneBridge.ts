import { GameSimulation } from "../../game/simulation/GameSimulation";
import type {
  InputAction,
  SceneBridge,
  TapStrikePayload
} from "../../game/types";

export function createSceneBridge(): SceneBridge {
  const simulation = new GameSimulation();

  return {
    getState: () => simulation.getState(),
    tick: (deltaMs: number) => simulation.update(deltaMs),
    dispatch: (action: InputAction, payload?: TapStrikePayload) =>
      simulation.dispatch(action, payload),
    subscribe: (listener) => simulation.subscribe(listener)
  };
}
