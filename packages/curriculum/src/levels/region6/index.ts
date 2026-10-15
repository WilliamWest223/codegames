import type { Level } from '@codegames/shared';
import { bigOLevels } from './big-o';
import { linearSearchLevels } from './linear-search';
import { binarySearchLevels } from './binary-search';
import { sortingBasicsLevels } from './sorting-basics';
import { hashingLevels } from './hashing';
import { twoPointersLevels } from './two-pointers';
import { stacksQueuesLevels } from './stacks-queues';
import { linkedListsLevels } from './linked-lists';
import { boss6Levels } from './boss-6';

/** region6: one file per concept; this order is the play order. */
export const region6Levels: Level[] = [
  ...bigOLevels,
  ...linearSearchLevels,
  ...binarySearchLevels,
  ...sortingBasicsLevels,
  ...hashingLevels,
  ...twoPointersLevels,
  ...stacksQueuesLevels,
  ...linkedListsLevels,
  ...boss6Levels,
];
