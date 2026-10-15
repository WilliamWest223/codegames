import { PLAYABLE_LANGUAGES, levelLanguages, type Concept, type Language, type Level } from '@codegames/shared';
import { region0Levels } from './levels/region0';
import { region1Levels } from './levels/region1';
import { region2Levels } from './levels/region2';
import { region3Levels } from './levels/region3';
import { region4Levels } from './levels/region4';
import { region5Levels } from './levels/region5';
import { region6Levels } from './levels/region6';
import { region7Levels } from './levels/region7';
import { region8Levels } from './levels/region8';
import { sideSecurityLevels } from './levels/side-security';

import { concepts } from './concepts';

export { concepts, REGION_NAMES } from './concepts';
export { HANGMAN_WORDS, hangmanWithWords } from './levels/region3/shared';
export { ADVENTURE_WORLD, adventureWithWorld } from './levels/region4/shared';
export * from './mastery';
export * from './review';
export { localize, lang } from './localize';
export * from './belts';
export * from './refreshers';

const NUMBER_RULE = {
  pattern: 'Number\\(|parseInt\\(|parseFloat\\(',
  message: 'Convert the input with Number(): prompt() always gives text, and JavaScript quietly does odd things with text and math.',
};

/**
 * JavaScript happily does math on text ("4" * 2 is 8, but "3" + "4" is "34"), so a level
 * can pass without converting input. Every JS level that reads numbers must convert them.
 */
function requireNumberConversion(level: Level): Level {
  if (level.game !== 'build-it' && level.game !== 'bug-hunt') return level;
  const reads = (level.solution.javascript ?? '').match(/Number\(prompt\(/g)?.length ?? 0;
  if (reads === 0) return level;
  const js = level.requirements?.javascript ?? [];
  if (js.some((r) => r.pattern.includes('Number'))) return level;
  // One conversion per numeric read: converting just the first prompt() isn't enough.
  const rule = reads === 1 ? NUMBER_RULE : { ...NUMBER_RULE, pattern: `((${NUMBER_RULE.pattern})[\\s\\S]*){${reads}}` };
  return { ...level, requirements: { ...level.requirements, javascript: [...js, rule] } };
}

const DUMMY_LOOP = {
  python: { pattern: 'range\\(\\s*(0|1)\\s*\\)', forbid: true, message: 'A loop that runs once (or never) doesn\'t repeat anything. Find the real repeating pattern.' },
  javascript: { pattern: '<\\s*(0|1)\\s*;|<=\\s*0\\s*;', forbid: true, message: 'A loop that runs once (or never) doesn\'t repeat anything. Find the real repeating pattern.' },
};

/** Robot levels with a line budget also reject do-nothing loops that only satisfy "use a loop". */
function rejectDummyLoops(level: Level): Level {
  if (level.game !== 'grid-quest' || !level.maxLines) return level;
  return {
    ...level,
    requirements: {
      ...level.requirements,
      python: [...(level.requirements?.python ?? []), DUMMY_LOOP.python],
      javascript: [...(level.requirements?.javascript ?? []), DUMMY_LOOP.javascript],
    },
  };
}

/** All levels, in play order within each concept. */
export const levels: Level[] = [...region0Levels, ...region1Levels, ...region2Levels, ...region3Levels, ...region4Levels, ...region5Levels, ...region6Levels, ...region7Levels, ...region8Levels, ...sideSecurityLevels].map(requireNumberConversion).map(rejectDummyLoops);
export { glossary, type GlossaryTerm } from './glossary';

/** Languages a concept can be played in (`Concept.languages`, or every playable language). */
export function conceptLanguages(concept: Concept): readonly Language[] {
  return concept.languages ?? ['python', 'javascript'];
}

/** The world map as seen in one language: concepts restricted to other languages are left out. */
export function conceptsFor(language: Language): Concept[] {
  if (language === 'cybersecurity') {
    return concepts.filter((c) => c.region === 10);
  }
  return concepts.filter((c) => c.region !== 10 && conceptLanguages(c).includes(language));
}

/** Levels that exist in one language (Web Pages levels are JavaScript only). */
export function levelsFor(language: Language): Level[] {
  if (language === 'cybersecurity') {
    return sideSecurityLevels;
  }
  return levels.filter(
    (l) =>
      !['encoding', 'ciphers', 'passwords', 'input-validation', 'boss-security'].includes(l.conceptId) &&
      levelLanguages(l).includes(language),
  );
}
