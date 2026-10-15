import { beforeAll, describe, expect, it } from 'vitest';
import { PLAYABLE_LANGUAGES, type Level } from '@codegames/shared';
import { gradeModify, gradeSubmission, type Executor } from '@codegames/runtime';
import { nodeExecutors } from '@codegames/runtime/node';
import { levelsFor } from '../src';

let executors: Record<'python' | 'javascript', Executor>;

beforeAll(async () => {
  executors = await nodeExecutors();
}, 60_000);

/** Every level's reference solution must pass, and its starter code must not. */
describe.each(PLAYABLE_LANGUAGES)('%s', (language) => {
  it.each(levelsFor(language).map((l) => [l.id, l] as [string, Level]))('%s', async (_id, level) => {
    const execute = executors[language];
    if (level.game === 'predict-output') {
      const run = await execute(level.code[language]!, { stdin: level.stdin });
      if (!level.expectError) expect(run.error, JSON.stringify(run.error)).toBeUndefined();
      expect(run.stdout.trim().length).toBeGreaterThan(0);
      if (level.modify) {
        const modified = await gradeModify(level, language, level.modify.solution[language]!, execute);
        expect(modified, JSON.stringify(modified, null, 2)).toMatchObject({ passed: true });
        const unchanged = await gradeModify(level, language, level.code[language]!, execute);
        expect(unchanged.passed, 'the original code should not pass the modify step').toBe(false);
      }
      return;
    }
    const result = await gradeSubmission(level, language, level.solution[language]!, execute);
    expect(result, JSON.stringify(result, null, 2)).toMatchObject({ passed: true });

    if ('starterCode' in level) {
      const starter = await gradeSubmission(level, language, level.starterCode[language] ?? '', execute);
      expect(starter.passed, 'starter code should not already pass').toBe(false);
    }
  });
});

/** Remixable predict levels must still run cleanly with changed numbers. */
describe.each(PLAYABLE_LANGUAGES)('remixes (%s)', (language) => {
  it.each(levelsFor(language).filter((l) => l.game === 'predict-output' && l.remix).map((l) => [l.id, l] as [string, Level]))('%s', async (_id, level) => {
    if (level.game !== 'predict-output') return;
    const { remixNumbers } = await import('@codegames/runtime');
    for (const seed of [1, 2, 3]) {
      const run = await executors[language](remixNumbers(level.code[language]!, seed, language), {});
      expect(run.error, `seed ${seed}`).toBeUndefined();
      expect(run.stdout.trim().length).toBeGreaterThan(0);
    }
  });
});
