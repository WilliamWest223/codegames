import { beforeAll, describe, expect, it } from 'vitest';
import { looseContainers, outputsMatch, type Executor } from '@codegames/runtime';
import { nodeExecutors } from '@codegames/runtime/node';
import type { PredictLevel } from '@codegames/shared';
import { levels } from '../src';

let executors: Record<'python' | 'javascript', Executor>;
beforeAll(async () => {
  executors = await nodeExecutors();
}, 60_000);

const withChoices = levels.filter((l): l is PredictLevel => l.game === 'predict-output' && !!l.choices);

describe('multiple-choice predictions', () => {
  it('exist for the early predict levels', () => {
    expect(withChoices.length).toBeGreaterThanOrEqual(9);
  });
  it.each(withChoices.flatMap((l) => (['python', 'javascript'] as const).map((lang) => [`${l.id} (${lang})`, l, lang] as const)))(
    '%s has exactly one correct choice',
    async (_name, level, lang) => {
      const run = await executors[lang](level.code[lang]!, { stdin: level.stdin, seed: 1 });
      const choices = level.choices![lang]!;
      expect(choices.length).toBeGreaterThanOrEqual(3);
      const right = choices.filter((c) => outputsMatch(looseContainers(c, lang), looseContainers(run.stdout, lang)));
      expect(right, JSON.stringify(run.stdout)).toHaveLength(1);
    },
  );
});
