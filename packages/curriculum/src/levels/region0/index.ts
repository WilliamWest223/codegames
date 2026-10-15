import type { Level } from '@codegames/shared';
import { sequencingLevels } from './sequencing';
import { outputLevels } from './output';
import { commentsLevels } from './comments';
import { customCommandsLevels } from './custom-commands';
import { repeatLevels } from './repeat';
import { firstErrorsLevels } from './first-errors';
import { boss0Levels } from './boss-0';

/** region0: one file per concept; this order is the play order. */
export const region0Levels: Level[] = [...sequencingLevels, ...outputLevels, ...commentsLevels, ...customCommandsLevels, ...repeatLevels, ...firstErrorsLevels, ...boss0Levels];
