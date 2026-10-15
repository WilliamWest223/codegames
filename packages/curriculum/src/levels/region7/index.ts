import type { Level } from '@codegames/shared';
import { treesLevels } from './trees';
import { bstLevels } from './bst';
import { heapsLevels } from './heaps';
import { graphsLevels } from './graphs';
import { shortestPathLevels } from './shortest-path';
import { backtrackingLevels } from './backtracking';
import { dynamicProgrammingLevels } from './dynamic-programming';
import { greedyIntervalsLevels } from './greedy-intervals';
import { boss7Levels } from './boss-7';

/** region7: one file per concept; this order is the play order. */
export const region7Levels: Level[] = [
  ...treesLevels,
  ...bstLevels,
  ...heapsLevels,
  ...graphsLevels,
  ...shortestPathLevels,
  ...backtrackingLevels,
  ...dynamicProgrammingLevels,
  ...greedyIntervalsLevels,
  ...boss7Levels,
];
