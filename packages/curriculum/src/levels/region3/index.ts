import type { Level } from '@codegames/shared';
import { functionsLevels } from './functions';
import { returnValuesLevels } from './return-values';
import { scopeLevels } from './scope';
import { collectionsLevels } from './collections';
import { iteratingCollectionsLevels } from './iterating-collections';
import { stringsLevels } from './strings';
import { errorHandlingLevels } from './error-handling';
import { boss3Levels } from './boss-3';

/** region3: one file per concept; this order is the play order. */
export const region3Levels: Level[] = [...functionsLevels, ...returnValuesLevels, ...scopeLevels, ...collectionsLevels, ...iteratingCollectionsLevels, ...stringsLevels, ...errorHandlingLevels, ...boss3Levels];
