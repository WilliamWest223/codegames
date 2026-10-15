import { describe, expect, it } from 'vitest';
import { PLAYABLE_LANGUAGES } from '@codegames/shared';
import { concepts, glossary, localize } from '../src';

describe('glossary', () => {
  it('links every term to a real concept', () => {
    const ids = new Set(concepts.map((c) => c.id));
    expect(glossary.filter((t) => !ids.has(t.conceptId)).map((t) => t.term)).toEqual([]);
  });
  it('resolves language tokens and has unique terms per language', () => {
    for (const language of PLAYABLE_LANGUAGES) {
      const terms = glossary.map((t) => localize(t.term, language));
      expect(new Set(terms).size).toBe(terms.length);
      const text = glossary.map((t) => [t.term, t.definition, t.example ?? ''].map((x) => localize(x, language)).join(' ')).join('\n');
      expect(text).not.toMatch(/\{\{(py|js):/);
    }
  });
});
