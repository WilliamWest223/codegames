import { describe, expect, it } from 'vitest';
import type { Level } from '@codegames/shared';
import { concepts, levels } from '../src';

const sideQuestIds = new Set(concepts.filter((c) => c.sideQuest && c.region === 10).map((c) => c.id));
const security = levels.filter((l) => sideQuestIds.has(l.conceptId));

function allText(level: Level): string {
  const code = level.game === 'predict-output' ? level.code : level.solution;
  return [level.prompt, level.takeaway ?? '', ...level.hints, code.python ?? '', code.javascript ?? ''].join('\n');
}

describe('security side quest safety rules', () => {
  it('has all 13 levels', () => {
    expect(security.map((l) => l.id)).toHaveLength(13);
  });

  it('labels every toy hash or cipher as NOT real security', () => {
    const toys = security.filter((l) => /toy_hash|toyHash|caesar|shift_letter|shiftLetter|checksum/.test(allText(l)));
    expect(toys.length).toBeGreaterThan(0);
    for (const level of toys) {
      expect(allText(level), level.id).toMatch(/NOT real security/);
    }
  });

  it('frames the brute-force level as testing your own system with permission', () => {
    const codebreaker = security.find((l) => l.id === 'ciphers-3')!;
    expect(codebreaker.prompt).toMatch(/your own/);
    expect(codebreaker.prompt).toMatch(/permission/);
  });

  it('never reaches the network or real systems', () => {
    for (const level of security) {
      expect(allText(level), level.id).not.toMatch(/\b(fetch|XMLHttpRequest|import\s+(socket|requests|urllib)|open\()/);
    }
  });
});

describe('security levels stay out of programming languages', () => {
  it('excludes exactly the levels of region-10 concepts', async () => {
    const { concepts, levels, levelsFor } = await import('../src');
    const security = new Set(concepts.filter((c) => c.region === 10).map((c) => c.id));
    expect(security.size).toBeGreaterThan(0);
    for (const language of ['python', 'javascript'] as const) {
      const ids = new Set(levelsFor(language).map((l) => l.id));
      for (const level of levels) {
        if (security.has(level.conceptId)) expect(ids.has(level.id), level.id).toBe(false);
      }
    }
  });
});
