import type { Level } from '@codegames/shared';
import { conditionalsLevels } from './conditionals';
import { elseIfChainsLevels } from './else-if-chains';
import { whileLoopsLevels } from './while-loops';
import { loopsLevels } from './loops';
import { loopControlLevels } from './loop-control';
import { nestedLoopsLevels } from './nested-loops';
import { boss2Levels } from './boss-2';

/** region2: one file per concept; this order is the play order. */
export const region2Levels: Level[] = [...conditionalsLevels, ...elseIfChainsLevels, ...whileLoopsLevels, ...loopsLevels, ...loopControlLevels, ...nestedLoopsLevels, ...boss2Levels];
