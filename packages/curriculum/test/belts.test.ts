import { describe, expect, it } from 'vitest';
import { BELTS, beltProgress, concepts, legacyBelt, REGION_STORY, SECURITY_PATCH } from '../src';

describe('belts', () => {
  it('are earned only by real boss levels, in region order', () => {
    const bosses = concepts.filter((c) => c.boss && !c.comingSoon).map((c) => c.id);
    for (const belt of BELTS) for (const b of belt.bosses) expect(bosses, b).toContain(b);
  });

  it('count stripes inside a belt and move on once it is earned', () => {
    expect(beltProgress(new Set())).toEqual({ earned: undefined, working: BELTS[0], stripes: 0 });
    expect(beltProgress(new Set(['boss-0', 'boss-1'])).stripes).toBe(2);
    const white = beltProgress(new Set(['boss-0', 'boss-1', 'boss-2']));
    expect(white.earned?.id).toBe('white');
    expect(white.working?.id).toBe('yellow');
  });

  it('never make a side quest boss part of a belt', () => {
    const sideBosses = concepts.filter((c) => c.sideQuest && c.boss).map((c) => c.id);
    expect(sideBosses).toContain(SECURITY_PATCH.boss);
    for (const belt of BELTS) for (const b of sideBosses) expect(belt.bosses).not.toContain(b);
    const withPatch = beltProgress(new Set(['boss-0', 'boss-1', 'boss-2', SECURITY_PATCH.boss]));
    expect(withPatch).toEqual(beltProgress(new Set(['boss-0', 'boss-1', 'boss-2'])));
  });

  it('give every playable region a story beat', () => {
    for (const region of new Set(concepts.filter((c) => !c.comingSoon).map((c) => c.region))) {
      expect(REGION_STORY[region], `region ${region}`).toBeDefined();
    }
  });

  it('never show a belt lower than the best one already reached (round-8 P1-3)', () => {
    const through3 = new Set(['boss-0', 'boss-1', 'boss-2', 'boss-3']);
    const through4 = new Set([...through3, 'boss-4']);
    // Under the old tiers boss-3 earned Yellow and boss-4 earned Orange.
    expect(legacyBelt(through3)).toBe('yellow');
    expect(legacyBelt(through4)).toBe('orange');
    expect(legacyBelt(new Set(['boss-0', 'boss-1', 'boss-2']))).toBe('white');
    expect(legacyBelt(new Set(['boss-0']))).toBeUndefined();

    // Today boss-3 alone is one Yellow stripe; with the old Yellow kept, work moves on to Orange.
    expect(beltProgress(through3).earned?.id).toBe('white');
    const kept3 = beltProgress(through3, legacyBelt(through3));
    expect(kept3.earned?.id).toBe('yellow');
    expect(kept3.working?.id).toBe('orange');
    expect(kept3.stripes).toBe(0);

    // The old Orange is kept; work moves on to Green (Region 6).
    const kept4 = beltProgress(through4, legacyBelt(through4));
    expect(kept4.earned?.id).toBe('orange');
    expect(kept4.working?.id).toBe('green');

    // The top belt today is Blue: nothing left to work toward after boss-7.
    const everything = new Set([...through4, 'boss-5', 'boss-6', 'boss-7']);
    expect(beltProgress(everything).earned?.id).toBe('blue');
    expect(beltProgress(everything).working).toBeUndefined();

    // A best belt never lowers anything: progress past it wins.
    expect(beltProgress(new Set([...through4, 'boss-5']), 'white').earned?.id).toBe('orange');
    expect(beltProgress(new Set(), 'nonsense')).toEqual(beltProgress(new Set()));
  });
});
