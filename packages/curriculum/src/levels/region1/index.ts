import type { Level } from '@codegames/shared';
import { variablesLevels } from './variables';
import { typesLevels } from './types';
import { operatorsLevels } from './operators';
import { booleansLevels } from './booleans';
import { stringsBasicsLevels } from './strings-basics';
import { stringFormattingLevels } from './string-formatting';
import { typeConversionLevels } from './type-conversion';
import { inputLevels } from './input';
import { boss1Levels } from './boss-1';

/** region1: one file per concept; this order is the play order. */
export const region1Levels: Level[] = [...variablesLevels, ...typesLevels, ...operatorsLevels, ...booleansLevels, ...stringsBasicsLevels, ...stringFormattingLevels, ...typeConversionLevels, ...inputLevels, ...boss1Levels];
