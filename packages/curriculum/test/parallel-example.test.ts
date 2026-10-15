import { beforeAll, describe, expect, it } from 'vitest';
import { gradeSubmission, type Executor } from '@codegames/runtime';
import { nodeExecutors } from '@codegames/runtime/node';
import type { CodeLevel } from '@codegames/shared';
import { levels, localize } from '../src';

let executors: Record<'python' | 'javascript', Executor>;
beforeAll(async () => {
  executors = await nodeExecutors();
}, 60_000);

const withExample = levels.filter((l): l is CodeLevel => (l.game === 'build-it' || l.game === 'bug-hunt') && !!l.parallelExample);

describe('parallel worked examples', () => {
  it('exist on at least six build-it levels', () => {
    expect(withExample.length).toBeGreaterThanOrEqual(6);
    for (const level of withExample) expect(level.game).toBe('build-it');
  });

  it.each(withExample.flatMap((l) => (['python', 'javascript'] as const).map((lang) => [`${l.id} (${lang})`, l, lang] as const)))(
    '%s runs cleanly and does not solve the level',
    async (_name, level, lang) => {
      const example = level.parallelExample!;
      expect(localize(example.prompt, lang)).not.toMatch(/\{\{py:/);
      const source = example.code[lang]!;
      const run = await executors[lang](source, { seed: 1 });
      expect(run.error, run.error?.message).toBeUndefined();
      expect(run.stdout.trim()).not.toBe('');
      const grade = await gradeSubmission(level, lang, source, executors[lang]);
      expect(grade.passed).toBe(false);
    },
  );
});
