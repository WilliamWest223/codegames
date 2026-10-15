import type { Level } from '@codegames/shared';
import { domElementsLevels } from './dom-elements';
import { domEventsLevels } from './dom-events';
import { domListsLevels } from './dom-lists';
import { domFormsLevels } from './dom-forms';
import { bossWebLevels } from './boss-web';

/** Side quest: Web Pages (region 8, JavaScript only). One file per concept; this order is the play order. */
export const region8Levels: Level[] = [...domElementsLevels, ...domEventsLevels, ...domListsLevels, ...domFormsLevels, ...bossWebLevels];
