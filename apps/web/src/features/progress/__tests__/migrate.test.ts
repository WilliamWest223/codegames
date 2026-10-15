import { describe, expect, it } from 'vitest';
import { beltProgress } from '@codegames/curriculum';
import { migrateProgress, sanitize } from '../store';

const done = (...ids: string[]) => Object.fromEntries(ids.map((id) => [id, { at: 1_700_000_000_000, attempts: 0, hintsUsed: 0, stars: 3 }]));
const REGION_BOSSES = ['boss-0', 'boss-1', 'boss-2'];

/** Round-8 P1-3: the Region 5 belt retier must not take belts away from existing learners. */
describe('migrateProgress v4 → v5 (best belt)', () => {
  it('keeps the belt each language had under the old tiers', () => {
    const v4 = {
      language: 'python',
      xp: 500,
      completed: { python: done(...REGION_BOSSES, 'boss-3'), javascript: done(...REGION_BOSSES, 'boss-3', 'boss-4') },
      reviews: { python: {}, javascript: {} },
      activity: {},
    };
    const migrated = sanitize(migrateProgress(v4, 4));
    expect(migrated.bestBelt).toEqual({ python: 'yellow', javascript: 'orange' });

    // What the header shows afterwards: Yellow stays Yellow (was White under the new tiers)…
    const py = beltProgress(new Set(Object.keys(migrated.completed!.python)), migrated.bestBelt!.python);
    expect(py.earned?.id).toBe('yellow');
    expect(py.working?.id).toBe('orange');
    // …and Orange stays Orange (was Yellow).
    const js = beltProgress(new Set(Object.keys(migrated.completed!.javascript)), migrated.bestBelt!.javascript);
    expect(js.earned?.id).toBe('orange');
  });

  it('records nothing for learners without a belt, and keeps the rest of the state', () => {
    const v4 = { language: 'javascript', xp: 10, completed: { python: {}, javascript: done('boss-0') }, reviews: { python: {}, javascript: {} }, activity: { '2026-10-13': 2 } };
    const migrated = migrateProgress(v4, 4);
    expect(migrated.bestBelt).toEqual({});
    expect(migrated.xp).toBe(10);
    expect(migrated.activity).toEqual({ '2026-10-13': 2 });
  });

  it('migrates older saves all the way, and survives malformed completions', () => {
    const v3 = { language: 'python', xp: 0, completed: { python: done(...REGION_BOSSES), javascript: 'garbage' } };
    const migrated = migrateProgress(v3, 3);
    expect(migrated.bestBelt).toEqual({ python: 'white' });
    expect(migrateProgress(null, 4)).toMatchObject({ language: null, xp: 0 });
  });

  it('leaves a v5 best belt alone, and sanitize drops unknown belt ids', () => {
    expect(migrateProgress({ bestBelt: { python: 'yellow' } }, 5).bestBelt).toEqual({ python: 'yellow' });
    expect(sanitize({ bestBelt: { python: 'black', javascript: 'white' } }).bestBelt).toEqual({ javascript: 'white' });
  });
});
