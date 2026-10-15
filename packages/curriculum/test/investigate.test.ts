import { describe, expect, it } from 'vitest';
import type { PredictLevel } from '@codegames/shared';
import { levels, localize } from '../src';

const investigated = levels.filter((l): l is PredictLevel => l.game === 'predict-output' && !!l.investigate);

describe('investigate questions', () => {
  it('exist on at least six predict levels', () => {
    expect(investigated.length).toBeGreaterThanOrEqual(6);
  });

  it.each(investigated.map((l) => [l.id, l] as const))('%s has well-formed questions', (_id, level) => {
    for (const q of level.investigate!) {
      expect(q.question.trim()).not.toBe('');
      expect(q.choices.length).toBeGreaterThanOrEqual(3);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.choices.length);
      for (const language of ['python', 'javascript'] as const) {
        const shown = [q.question, ...q.choices].map((t) => localize(t, language));
        for (const text of shown) expect(text).not.toMatch(/\{\{py:/);
        expect(new Set(shown.slice(1)).size).toBe(q.choices.length);
      }
    }
  });
});
