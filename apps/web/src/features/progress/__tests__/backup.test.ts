import { afterEach, describe, expect, it, vi } from 'vitest';
import { levels } from '@codegames/curriculum';
import { cleanBackup, importProgress, MAX_BACKUP_BYTES, parseBackup } from '../backup';
import { PROGRESS_VERSION } from '../store';

const FORMAT = 'codegames-progress-backup';
const envelope = (data: unknown, format: unknown = FORMAT) => JSON.stringify({ format, exportedAt: 'x', data });
const LEVEL = levels[0]!.id;

describe('parseBackup', () => {
  it('accepts a valid backup', () => {
    const data = { state: { xp: 5 }, version: 3 };
    expect(parseBackup(envelope(data))).toEqual(data);
    expect(parseBackup(envelope({ state: {}, version: PROGRESS_VERSION }))).toEqual({ state: {}, version: PROGRESS_VERSION });
  });

  it('rejects other files with a readable message', () => {
    expect(() => parseBackup('not json')).toThrow(/valid JSON/);
    expect(() => parseBackup('{"hello": 1}')).toThrow(/CodeGames/);
    expect(() => parseBackup('{"format": "codegames-progress-backup", "data": {}}')).toThrow(/missing/);
  });

  it('rejects a wrong or hostile envelope', () => {
    for (const text of ['null', '[]', '5', '"x"', envelope({}, 'other'), envelope({ state: {}, version: 1 }, null)]) {
      expect(() => parseBackup(text)).toThrow();
    }
    // state must be a plain record
    for (const state of [null, [], 'x', 5, undefined]) expect(() => parseBackup(envelope({ state, version: 3 }))).toThrow(/missing/);
    // data must be a plain record
    for (const data of [null, [], 'x', 5]) expect(() => parseBackup(envelope(data))).toThrow(/missing/);
  });

  it('requires an integer version no newer than the app', () => {
    for (const version of ['3', null, 1.5, -1, undefined]) expect(() => parseBackup(envelope({ state: {}, version }))).toThrow(/missing/);
    expect(() => parseBackup(envelope({ state: {}, version: PROGRESS_VERSION + 1 }))).toThrow(/newer version/);
    expect(() => parseBackup('{"format":"codegames-progress-backup","data":{"state":{},"version":1e999}}')).toThrow();
  });

  it('rejects text over the size limit', () => {
    expect(() => parseBackup('x'.repeat(MAX_BACKUP_BYTES + 1))).toThrow(/too big/);
  });
});

describe('cleanBackup', () => {
  it('migrates, sanitizes and stamps the current version', () => {
    const clean = cleanBackup({
      version: 4,
      state: { xp: 1e999, language: 'python', completed: { python: { [LEVEL]: { at: 1_700_000_000_000, attempts: 0, stars: 3, evil: '<script>' } } }, extra: 'dropped', skin: 'hacker' },
    });
    expect(clean.version).toBe(PROGRESS_VERSION);
    expect(clean.state.xp).toBe(0);
    expect(clean.state.skin).toBe('mint');
    expect(clean.state).not.toHaveProperty('extra');
    expect(clean.state.completed).toEqual({ python: { [LEVEL]: { at: 1_700_000_000_000, attempts: 0, hintsUsed: 0, stars: 3 } }, javascript: {}, cybersecurity: {} });
  });
});

describe('importProgress', () => {
  afterEach(() => vi.unstubAllGlobals());

  function stub() {
    const store = new Map<string, string>();
    const reload = vi.fn();
    vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) });
    vi.stubGlobal('window', { location: { reload } });
    return { store, reload };
  }

  it('stores only the sanitized result, never the raw blob', () => {
    const { store, reload } = stub();
    importProgress(envelope({ version: 5, state: { xp: 40, skin: 'sky', sneaky: { deep: 'x'.repeat(5000) }, drafts: { [`python:${LEVEL}`]: 'x'.repeat(60_000) } } }));
    const saved = JSON.parse(store.get('codegames-progress')!) as { state: Record<string, unknown>; version: number };
    expect(saved.version).toBe(PROGRESS_VERSION);
    expect(saved.state.xp).toBe(40);
    expect(saved.state).not.toHaveProperty('sneaky');
    expect(saved.state.drafts).toEqual({});
    expect(store.get('codegames-progress')!.length).toBeLessThan(2000);
    expect(reload).toHaveBeenCalled();
  });

  it('stores nothing when validation fails', () => {
    const { store, reload } = stub();
    expect(() => importProgress('{"format":"codegames-progress-backup","data":{"state":[],"version":5}}')).toThrow();
    expect(store.size).toBe(0);
    expect(reload).not.toHaveBeenCalled();
  });

  it('turns a full storage into a readable error', () => {
    const reload = vi.fn();
    vi.stubGlobal('localStorage', { setItem: () => { throw new DOMException('full', 'QuotaExceededError'); } });
    vi.stubGlobal('window', { location: { reload } });
    expect(() => importProgress(envelope({ version: 5, state: {} }))).toThrow(/storage is full/);
    expect(reload).not.toHaveBeenCalled();
  });

  it('a 3 MB file is rejected on size (the same limit AppShell applies before reading it)', () => {
    const big = envelope({ version: 5, state: { pad: 'x'.repeat(3_000_000) } });
    expect(big.length).toBeGreaterThan(3_000_000);
    expect(big.length).toBeGreaterThan(MAX_BACKUP_BYTES);
    expect(() => parseBackup(big)).toThrow(/too big/);
  });
});
