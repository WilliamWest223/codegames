import type { ComponentType } from 'react';
import type { GameType, Level } from '@codegames/shared';
import { BuildItGame } from './BuildItGame';
import { GridGame } from './GridGame';
import { ParsonsGame } from './ParsonsGame';
import { PredictGame } from './PredictGame';
import type { GameProps } from './types';

/** Maps each GameType to its component. TypeScript forces every type to be handled. */
export const gameRegistry: Record<GameType, ComponentType<GameProps<never>> | null> = {
  'grid-quest': GridGame,
  'predict-output': PredictGame,
  parsons: ParsonsGame,
  'bug-hunt': BuildItGame,
  'build-it': BuildItGame,
  'speed-run': null,
};

export function gameFor(level: Level): ComponentType<GameProps<Level>> | null {
  return gameRegistry[level.game] as ComponentType<GameProps<Level>> | null;
}
