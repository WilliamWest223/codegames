import type { Level } from '@codegames/shared';
import { mapsLevels } from './maps';
import { mapPatternsLevels } from './map-patterns';
import { setsLevels } from './sets';
import { nestedDataLevels } from './nested-data';
import { classesLevels } from './classes';
import { methodsLevels } from './methods';
import { encapsulationLevels } from './encapsulation';
import { boss4Levels } from './boss-4';

/** region4: one file per concept; this order is the play order. */
export const region4Levels: Level[] = [...mapsLevels, ...mapPatternsLevels, ...setsLevels, ...nestedDataLevels, ...classesLevels, ...methodsLevels, ...encapsulationLevels, ...boss4Levels];
