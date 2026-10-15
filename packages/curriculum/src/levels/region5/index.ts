import type { Level } from '@codegames/shared';
import { higherOrderFunctionsLevels } from './higher-order-functions';
import { mapFilterReduceLevels } from './map-filter-reduce';
import { closuresLevels } from './closures';
import { recursionLevels } from './recursion';
import { recursiveDataLevels } from './recursive-data';
import { inheritanceLevels } from './inheritance';
import { polymorphismLevels } from './polymorphism';
import { valueVsReferenceLevels } from './value-vs-reference';
import { boss5Levels } from './boss-5';

/** region5: one file per concept; this order is the play order. */
export const region5Levels: Level[] = [...higherOrderFunctionsLevels, ...mapFilterReduceLevels, ...closuresLevels, ...recursionLevels, ...recursiveDataLevels, ...inheritanceLevels, ...polymorphismLevels, ...valueVsReferenceLevels, ...boss5Levels];
