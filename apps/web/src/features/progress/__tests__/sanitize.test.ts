import { describe, expect, it } from 'vitest';
import { concepts, levels } from '@codegames/curriculum';
import { MAX_DRAFT_CHARS, MAX_DRAFTS, migrateProgress, PROGRESS_VERSION, sanitize, useProgress } from '../store';

const LEVEL = levels[0]!.id;
const CONCEPT = concepts[0]!.id;
const NOW = Date.now();
const good = { at: 1_700_000_000_000, attempts: 1, hintsUsed: 0, stars: 3 };
const noProto = (s: string) => JSON.parse(s) as unknown;

describe('sanitize: hostile input', () => {
  it('returns {} for non-records', () => {
    for (const v of [null, undefined, 5, 'x', [], [1]]) expect(sanitize(v)).toEqual({});
  });

  it('keeps a well-formed save intact', () => {
    const s = sanitize({
      language: 'python',
      xp: 120,
      skin: 'sky',
      completed: { python: { [LEVEL]: good }, javascript: {} },
      attempts: { [`python:${LEVEL}`]: 2 },
      reviews: { python: { [CONCEPT]: { count: 2, at: 1_700_000_000_000, spaced: 1 } } },
      activity: { '2026-10-13': 2 },
      reflections: { [`python:${LEVEL}`]: { text: 'I built it', at: 1_700_000_000_000 } },
    });
    expect(s.xp).toBe(120);
    expect(s.skin).toBe('sky');
    expect(s.completed!.python[LEVEL]).toEqual(good);
    expect(s.attempts).toEqual({ [`python:${LEVEL}`]: 2 });
    expect(s.reviews!.python[CONCEPT]).toEqual({ count: 2, at: 1_700_000_000_000, spaced: 1 });
    expect(s.activity).toEqual({ '2026-10-13': 2 });
    expect(s.reflections![`python:${LEVEL}`]!.text).toBe('I built it');
  });

  it('bounds xp and counters to safe integers in range', () => {
    expect(sanitize({ xp: 1e999 }).xp).toBe(0);
    expect(sanitize({ xp: Infinity }).xp).toBe(0);
    expect(sanitize({ xp: NaN }).xp).toBe(0);
    expect(sanitize({ xp: -1 }).xp).toBe(0);
    expect(sanitize({ xp: 1.5 }).xp).toBe(0);
    expect(sanitize({ xp: 1_000_001 }).xp).toBe(0);
    expect(sanitize({ xp: Number.MAX_SAFE_INTEGER + 2 }).xp).toBe(0);
    expect(sanitize({ xp: 1_000_000 }).xp).toBe(1_000_000);
    const k = `python:${LEVEL}`;
    const s = sanitize({ attempts: { [k]: 1e999 }, hints: { [k]: -1 }, errorCounts: { 'python:TypeError': 1_000_001 }, errorStreaks: { 'python:TypeError': 2 } });
    expect(s.attempts).toEqual({});
    expect(s.hints).toEqual({});
    expect(s.errorCounts).toEqual({});
    expect(s.errorStreaks).toEqual({ 'python:TypeError': 2 });
  });

  it('requires stars to be an integer 1..3, and drops the whole completion otherwise', () => {
    for (const stars of [1.5, 0, 4, -1, 1e999, '3', null, NaN]) {
      expect(sanitize({ completed: { python: { [LEVEL]: { ...good, stars } } } }).completed!.python).toEqual({});
    }
    expect(sanitize({ completed: { python: { [LEVEL]: { at: good.at } } } }).completed!.python[LEVEL]).toEqual({ at: good.at, attempts: 0, hintsUsed: 0 });
  });

  it('requires timestamps between 2020 and tomorrow', () => {
    const at = (t: unknown) => sanitize({ completed: { python: { [LEVEL]: { ...good, at: t } } } }).completed!.python[LEVEL];
    expect(at(NOW)).toBeDefined();
    expect(at(NOW + 3 * 86_400_000)).toBeUndefined();
    expect(at(1_000)).toBeUndefined();
    expect(at(Date.UTC(2019, 11, 31))).toBeUndefined();
    expect(at(1e999)).toBeUndefined();
    expect(at(NaN)).toBeUndefined();
    expect(at('1700000000000')).toBeUndefined();
    const rev = sanitize({ reviews: { python: { [CONCEPT]: { count: 1, at: NOW + 1e12 } } } });
    expect(rev.reviews!.python).toEqual({});
  });

  it('filters keys to known languages, levels and concepts', () => {
    const s = sanitize({
      completed: { python: { [LEVEL]: good, 'no-such-level': good }, ruby: { [LEVEL]: good } },
      attempts: { [`python:${LEVEL}`]: 1, [`python:nope`]: 1, [`ruby:${LEVEL}`]: 1, [LEVEL]: 1 },
      reviews: { javascript: { [CONCEPT]: { count: 1, at: good.at }, nope: { count: 1, at: good.at } } },
      drafts: { [`python:${LEVEL}`]: 'x', 'python:nope': 'x', 'javascript:hangman-word-builder': 'words' },
      activity: { '2026-10-13': 1, 'not-a-day': 1 },
    });
    expect(Object.keys(s.completed!.python)).toEqual([LEVEL]);
    expect(s.completed).not.toHaveProperty('ruby');
    expect(Object.keys(s.attempts!)).toEqual([`python:${LEVEL}`]);
    expect(Object.keys(s.reviews!.javascript)).toEqual([CONCEPT]);
    expect(Object.keys(s.drafts!).sort()).toEqual([`javascript:hangman-word-builder`, `python:${LEVEL}`].sort());
    expect(Object.keys(s.activity!)).toEqual(['2026-10-13']);
  });

  it('survives __proto__ and constructor keys without polluting prototypes', () => {
    const hostile = noProto(
      `{"__proto__": {"polluted": true}, "xp": 5, "completed": {"__proto__": {"x": 1}, "python": {"__proto__": ${JSON.stringify(good)}, "constructor": ${JSON.stringify(good)}, "${LEVEL}": ${JSON.stringify(good)}}},
        "attempts": {"__proto__": 1, "constructor": 1, "python:constructor": 1}, "drafts": {"__proto__": "x", "constructor": "x"}}`,
    );
    const s = sanitize(hostile);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(s.xp).toBe(5);
    expect(Object.keys(s.completed!.python)).toEqual([LEVEL]);
    expect(Object.keys(s.attempts!)).toEqual([]);
    expect(Object.keys(s.drafts!)).toEqual([]);
    expect(Object.getPrototypeOf(s.completed!.python)).toBe(Object.prototype);
  });

  it('handles nulls, arrays and wrong types where objects are expected', () => {
    const s = sanitize({
      completed: [1, 2],
      attempts: [1],
      reviews: { python: null, javascript: [] },
      drafts: 'oops',
      reflections: { [`python:${LEVEL}`]: null },
      bestBelt: [],
      goalHistory: null,
      language: { toString: 'x' },
    });
    expect(s.completed).toEqual({ python: {}, javascript: {} });
    expect(s.attempts).toEqual({});
    expect(s.reviews).toEqual({ python: {}, javascript: {} });
    expect(s.drafts).toEqual({});
    expect(s.reflections).toEqual({});
    expect(s.bestBelt).toEqual({});
    expect(s.language).toBeNull();
    expect(sanitize({ completed: { python: { [LEVEL]: null }, javascript: { [LEVEL]: [good] } } }).completed).toEqual({ python: {}, javascript: {} });
  });

  it('caps drafts at 50 KB each and 500 keys, and reflections at 300 chars', () => {
    const k = `python:${LEVEL}`;
    const huge = 'x'.repeat(MAX_DRAFT_CHARS + 1);
    expect(sanitize({ drafts: { [k]: huge } }).drafts).toEqual({});
    expect(sanitize({ drafts: { [k]: 'x'.repeat(MAX_DRAFT_CHARS) } }).drafts![k]).toHaveLength(MAX_DRAFT_CHARS);
    // 700 distinct keys is more than the cap, even if every one were valid-looking.
    const many = Object.fromEntries(levels.slice(0, 700).flatMap((l) => [[`python:${l.id}`, 'x'], [`javascript:${l.id}`, 'x']]));
    expect(Object.keys(sanitize({ drafts: many }).drafts!).length).toBeLessThanOrEqual(MAX_DRAFTS);
    const long = 'y'.repeat(100_000);
    const r = sanitize({ reflections: { [k]: { text: long, at: good.at } } }).reflections![k]!;
    expect(r.text).toHaveLength(300);
    expect(sanitize({ reflections: { [k]: { text: '   ', at: good.at } } }).reflections).toEqual({});
  });

  it('only accepts known skins, belts, goals', () => {
    expect(sanitize({ skin: 'mint' }).skin).toBe('mint');
    expect(sanitize({ skin: 'obsidian' }).skin).toBe('obsidian');
    for (const skin of ['hacker', '__proto__', '<script>', 5, null, 'x'.repeat(100_000)]) expect(sanitize({ skin }).skin).toBe('mint');
    expect(sanitize({ dailyGoal: 99 }).dailyGoal).toBe(3);
    expect(sanitize({ goalHistory: { '': 1, '2026-10-13': 5, 'zzz': 3, '2026-10-14': 7 } }).goalHistory).toEqual({ '': 1, '2026-10-13': 5 });
  });

  it('drops hostile error names and non-literal reveals', () => {
    expect(sanitize({ errorCounts: { 'python:<img onerror>': 1, 'python:ZeroDivisionError': 2 } }).errorCounts).toEqual({ 'python:ZeroDivisionError': 2 });
    expect(sanitize({ reveals: { [`python:${LEVEL}`]: 2 } }).reveals).toEqual({});
  });
});

describe('migrateProgress is total', () => {
  const inputs: unknown[] = [
    null,
    undefined,
    5,
    'str',
    [],
    { completed: null },
    { completed: { python: null, javascript: [null] } },
    { completed: { python: { a: null, b: 5, c: { at: 'x' } } }, reviews: null },
    { completed: 'x', reviews: { python: { a: null }, javascript: 5 } },
    { reviews: [null, 1], activity: 7, bestBelt: 'x' },
    { completed: { python: { [LEVEL]: { at: 1e999 } } } },
    noProto('{"__proto__": {"x": 1}, "completed": {"__proto__": null}}'),
  ];
  const versions = [0, 1, 2, 3, 4, 5, 6, 99, -1, NaN, Infinity, '3', null] as unknown as number[];

  it('never throws, and always produces something sanitize accepts', () => {
    for (const input of inputs) {
      for (const v of versions) {
        const out = migrateProgress(input, v);
        expect(out).toBeTypeOf('object');
        expect(() => sanitize(out)).not.toThrow();
      }
    }
  });

  it('falls back to a fresh save on unparseable input', () => {
    expect(migrateProgress(null, 4)).toMatchObject({ language: null, xp: 0, completed: { python: {}, javascript: {} } });
    expect(migrateProgress({ xp: 9 }, NaN)).toMatchObject({ xp: 0 });
    expect(migrateProgress({ xp: 9 }, 1)).toMatchObject({ xp: 0 });
  });

  it('skips null entries when rebuilding activity from older saves', () => {
    const out = migrateProgress({ completed: { python: { a: null, b: { at: 1_700_000_000_000 } } }, reviews: { python: { c: null } } }, 3);
    expect(Object.values(out.activity as Record<string, number>)).toEqual([1]);
  });
});

/** Saves written by older app versions must still load: only malformed data is dropped. */
describe('legacy fixtures (v2 to v5)', () => {
  const at = 1_700_000_000_000;
  const v2 = { language: 'python', xp: 30, completed: { python: { [LEVEL]: { at, attempts: 0, hintsUsed: 0, stars: 2 } }, javascript: {} }, attempts: {}, hints: {}, reveals: {}, drafts: { [`python:${LEVEL}`]: 'print(1)' } };
  const v3 = { ...v2, reviews: { python: { [CONCEPT]: { count: 1, at } }, javascript: {} } };
  const v4 = { ...v3, activity: { '2026-10-13': 3 }, errorCounts: { 'python:NameError': 2 }, errorStreaks: {}, reflections: {}, skin: 'mint', dailyGoal: 5, goalHistory: { '': 3 } };
  const v5 = { ...v4, bestBelt: { python: 'white' } };

  it.each([
    [2, v2],
    [3, v3],
    [4, v4],
    [5, v5],
  ])('v%i save keeps its progress through migrate + sanitize', (version, save) => {
    const s = sanitize(migrateProgress(save, version));
    expect(s.xp).toBe(30);
    expect(s.language).toBe('python');
    expect(s.completed!.python[LEVEL]?.stars).toBe(2);
    expect(s.drafts![`python:${LEVEL}`]).toBe('print(1)');
    if (version >= 3) expect(s.reviews!.python[CONCEPT]?.count).toBe(1);
    if (version >= 4) expect(s.activity).toEqual({ '2026-10-13': 3 });
    expect(Object.keys(s.activity!).length).toBeGreaterThan(0);
  });

  it('a v1 save starts fresh (as before)', () => {
    expect(sanitize(migrateProgress({ xp: 99 }, 1)).xp).toBe(0);
  });

  it('PROGRESS_VERSION matches the migration ladder', () => {
    expect(PROGRESS_VERSION).toBe(5);
  });
});

describe('saveDraft caps', () => {
  it('ignores a draft over 50 KB and keeps the previous one', () => {
    useProgress.getState().resetProgress();
    useProgress.getState().saveDraft('python', LEVEL, 'ok');
    useProgress.getState().saveDraft('python', LEVEL, 'x'.repeat(MAX_DRAFT_CHARS + 1));
    expect(useProgress.getState().drafts[`python:${LEVEL}`]).toBe('ok');
    useProgress.getState().saveDraft('python', LEVEL, 'x'.repeat(MAX_DRAFT_CHARS));
    expect(useProgress.getState().drafts[`python:${LEVEL}`]).toHaveLength(MAX_DRAFT_CHARS);
  });

  it('stops adding new drafts at the key limit but still updates existing ones', () => {
    useProgress.getState().resetProgress();
    for (let i = 0; i < MAX_DRAFTS + 20; i++) useProgress.getState().saveDraft('python', `lvl${i}`, 'x');
    expect(Object.keys(useProgress.getState().drafts)).toHaveLength(MAX_DRAFTS);
    useProgress.getState().saveDraft('python', 'lvl0', 'changed');
    expect(useProgress.getState().drafts['python:lvl0']).toBe('changed');
    useProgress.getState().resetProgress();
  });
});
