import { describe, expect, it } from 'vitest';
import { levels, localize, REFRESHERS } from '../src';

describe('repeated-error refreshers', () => {
  it('render in both languages with no leftover tokens', () => {
    for (const [name, r] of Object.entries(REFRESHERS)) {
      for (const language of ['python', 'javascript'] as const) {
        expect(localize(r.text, language), name).not.toMatch(/\{\{(py|js):/);
        expect(localize(r.text, language).length, name).toBeGreaterThan(40);
      }
    }
  });

  it('link to practice levels that are core bug hunts in both languages', () => {
    const practiced = Object.entries(REFRESHERS).filter(([, r]) => r.practice);
    expect(practiced.length).toBeGreaterThanOrEqual(8);
    for (const [name, r] of practiced) {
      const level = levels.find((l) => l.id === r.practice);
      expect(level, `${name} → ${r.practice}`).toBeDefined();
      expect(level!.game, name).toBe('bug-hunt');
      if (level!.game !== 'bug-hunt') continue;
      expect(level!.starterCode.python && level!.starterCode.javascript, name).toBeTruthy();
    }
  });
});
