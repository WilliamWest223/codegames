import { describe, expect, it } from 'vitest';
import type { Concept, Level } from '@codegames/shared';
import { computeMastery } from '../src';

const concepts: Concept[] = [
  { id: 'a', title: 'A', summary: '', region: 0, requires: [] },
  { id: 'b', title: 'B', summary: '', region: 0, requires: ['a'] },
  { id: 'boss', title: 'Boss', summary: '', region: 0, requires: ['b'], boss: true },
  { id: 'c', title: 'C', summary: '', region: 1, requires: ['boss'] },
];
const lvl = (id: string, conceptId: string, role: Level['role'], reinforces: string[] = []): Level => ({
  id, conceptId, role, reinforces, title: id, mode: 'guided', prompt: '', hints: [], game: 'build-it',
  starterCode: {}, solution: {}, tests: [],
});
const levels: Level[] = [
  lvl('a1', 'a', 'intro'), lvl('a2', 'a', 'combine'), lvl('a3', 'a', 'integrate'),
  lvl('b1', 'b', 'intro', ['a']), lvl('b2', 'b', 'combine', ['a']), lvl('b3', 'b', 'integrate', ['a']),
  lvl('b4', 'b', 'challenge', ['a']),
  lvl('boss1', 'boss', 'boss', ['a', 'b']),
  lvl('c1', 'c', 'intro'),
];

describe('computeMastery', () => {
  it('starts with only the root available', () => {
    const m = computeMastery(concepts, levels, new Set());
    expect(m).toEqual({ a: 'available', b: 'locked', boss: 'locked', c: 'locked' });
  });

  it('moves from learned to practiced and unlocks dependents', () => {
    expect(computeMastery(concepts, levels, new Set(['a1'])).a).toBe('learned');
    const m = computeMastery(concepts, levels, new Set(['a1', 'a2', 'a3']));
    expect(m.a).toBe('practiced');
    expect(m.b).toBe('available');
  });

  it('does not require challenge levels for practiced', () => {
    const m = computeMastery(concepts, levels, new Set(['a1', 'a2', 'a3', 'b1', 'b2', 'b3']));
    expect(m.b).toBe('practiced');
  });

  it('becomes proficient after being reinforced by 3 later levels', () => {
    const m = computeMastery(concepts, levels, new Set(['a1', 'a2', 'a3', 'b1', 'b2', 'b3']));
    expect(m.a).toBe('proficient');
  });

  it('gates the next region behind the boss', () => {
    const before = computeMastery(concepts, levels, new Set(['a1', 'a2', 'a3', 'b1', 'b2', 'b3']));
    expect(before.boss).toBe('available');
    expect(before.c).toBe('locked');
    const after = computeMastery(concepts, levels, new Set(['a1', 'a2', 'a3', 'b1', 'b2', 'b3', 'boss1']));
    expect(after.c).toBe('available');
  });
});

describe('assisted solves', () => {
  const all = new Set(['a1', 'a2', 'a3', 'b1', 'b2', 'b3']);

  it('still count as done, so they practice and unlock', () => {
    const m = computeMastery(concepts, levels, all, {}, new Set(), new Set(['a1', 'b1', 'b2', 'b3']));
    expect(m.a).toBe('practiced');
    expect(m.b).toBe('practiced');
    expect(m.boss).toBe('available');
  });

  it('do not count as uses toward proficient', () => {
    expect(computeMastery(concepts, levels, all, {}, new Set(), new Set(['b2'])).a).toBe('practiced');
    // An unassisted challenge level makes up the third use.
    expect(computeMastery(concepts, levels, new Set([...all, 'b4']), {}, new Set(), new Set(['b2'])).a).toBe('proficient');
  });

  it('can be made up with spaced reviews', () => {
    expect(computeMastery(concepts, levels, all, { a: 1 }, new Set(), new Set(['b2'])).a).toBe('proficient');
  });
});

describe('reviews', () => {
  it('count toward proficient', () => {
    const done = new Set(['a1', 'a2', 'a3']);
    expect(computeMastery(concepts, levels, done).a).toBe('practiced');
    expect(computeMastery(concepts, levels, done, { a: 3 }).a).toBe('proficient');
  });

  it('pickReview offers only due concepts, most overdue first, and rotates puzzles', async () => {
    const { pickReview, REVIEW_INTERVALS } = await import('../src');
    const quick: Level = { ...lvl('a-quick', 'a', 'combine'), game: 'predict-output', code: {} } as Level;
    const all = [...levels, quick];
    const done = new Set(['a1', 'a2', 'a3', 'a-quick', 'b1', 'b2', 'b3']);
    const mastery = computeMastery(concepts, all, done);
    const completedAt = { a1: 0, a2: 0, a3: 0, 'a-quick': 0, b1: 5, b2: 5, b3: 5 };
    // Nothing is due right after practicing.
    expect(pickReview(concepts, all, mastery, completedAt, {}, 1000)).toEqual([]);
    const later = REVIEW_INTERVALS[0]! + 10;
    const picks = pickReview(concepts, all, mastery, completedAt, {}, later, 2);
    expect(picks.map((p) => p.concept.id)).toEqual(['a', 'b']);
    expect(picks[0]!.level.id).toBe('a-quick');
    // After one review, "a" waits a whole day and its next puzzle rotates.
    const reviewed = { a: { count: 1, at: later } };
    expect(pickReview(concepts, all, mastery, completedAt, reviewed, later + 1000).map((p) => p.concept.id)).toEqual(['b']);
    const nextDay = later + REVIEW_INTERVALS[1]! + 1;
    const again = pickReview(concepts, all, mastery, completedAt, reviewed, nextDay);
    expect(again.find((p) => p.concept.id === 'a')!.level.id).not.toBe('a-quick');
  });
});

describe('cross-language transfer', () => {
  it('unlocks dependents of concepts practiced in another language', () => {
    const m = computeMastery(concepts, levels, new Set(), {}, new Set(['a', 'b', 'boss']));
    expect(m.b).toBe('available');
    expect(m.c).toBe('available');
    expect(m.a).toBe('available');
  });
});

describe('weak levels in review (round-7 pedagogy plan)', () => {
  it('come due sooner and are resurfaced', async () => {
    const { pickReview, concepts, levels, computeMastery, REVIEW_INTERVALS } = await import('../src');
    const done = levels.filter((l) => l.conceptId === 'sequencing' || l.conceptId === 'output').map((l) => l.id);
    const mastery = computeMastery(concepts, levels, new Set(done));
    const at = 1_000_000;
    const completedAt = Object.fromEntries(done.map((id) => [id, at]));
    // Just over half the first interval: due only with a weak level.
    const now = at + REVIEW_INTERVALS[0]! * 0.6;
    expect(pickReview(concepts, levels, mastery, completedAt, {}, now)).toHaveLength(0);
    const weak = new Set(['output-3']);
    const picks = pickReview(concepts, levels, mastery, completedAt, {}, now, 3, weak);
    expect(picks.map((p) => p.concept.id)).toEqual(['output']);
    expect(picks[0]!.level.id).toBe('output-3');
  });
});
