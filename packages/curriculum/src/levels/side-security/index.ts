import type { Level } from '@codegames/shared';
import { encodingLevels } from './encoding';
import { ciphersLevels } from './ciphers';
import { passwordsLevels } from './passwords';
import { inputValidationLevels } from './input-validation';
import { bossSecurityLevels } from './boss-security';

/** Side quest: Security (region 10). One file per concept; this order is the play order. */
export const sideSecurityLevels: Level[] = [...encodingLevels, ...ciphersLevels, ...passwordsLevels, ...inputValidationLevels, ...bossSecurityLevels];
