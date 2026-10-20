import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const pushSnapshot = vi.fn();
const pullSnapshot = vi.fn();
vi.mock('../syncApi', () => ({
  pushSnapshot: (...a: unknown[]) => pushSnapshot(...a),
  pullSnapshot: (...a: unknown[]) => pullSnapshot(...a),
}));
vi.mock('../../auth/useAuth', () => ({
  useAuth: { getState: () => ({ status: 'signed-in', isGuest: false }) },
}));

import { syncEngine } from '../engine';

type Store = Record<string, unknown>;

function setup() {
  let store: Store = { n: 0 };
  syncEngine.init(
    () => store,
    (d) => {
      store = { ...store, ...(d as Store) };
      syncEngine.notifyChange(); // mimics the zustand subscription in main.tsx
    },
  );
}

describe('SyncEngine', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Node test env: provide the minimal browser surface the engine touches.
    const mem = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => void mem.delete(k),
    });
    vi.stubGlobal('document', { visibilityState: 'hidden' });
    vi.stubGlobal('window', {
      addEventListener: () => undefined,
      setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms),
      clearTimeout: (id: number) => clearTimeout(id),
    });
    pushSnapshot.mockReset();
    pullSnapshot.mockReset();
    syncEngine.reset();
    setup();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('re-pushes edits made while a push was in flight', async () => {
    let release: (v: unknown) => void = () => undefined;
    pushSnapshot.mockImplementationOnce(() => new Promise((r) => (release = r)));
    pushSnapshot.mockResolvedValue({ ok: true, revision: 2 });

    syncEngine.notifyChange();
    await vi.advanceTimersByTimeAsync(3000); // push #1 starts, stays in flight
    syncEngine.notifyChange(); // edit mid-flight
    release({ ok: true, revision: 1 });
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(3000);

    expect(pushSnapshot).toHaveBeenCalledTimes(2);
  });

  it('resets revision to 0 when the server snapshot is empty', async () => {
    pullSnapshot.mockResolvedValueOnce({ ok: true, revision: 7, data: {} });
    await syncEngine.pull();
    pullSnapshot.mockResolvedValueOnce({ ok: true, empty: true });
    await syncEngine.pull();
    pushSnapshot.mockResolvedValue({ ok: true, revision: 1 });
    syncEngine.notifyChange();
    await vi.advanceTimersByTimeAsync(3000);
    expect(pushSnapshot.mock.calls[0]?.[2]).toBe(0);
  });

  it('retries a push after a conflict', async () => {
    pullSnapshot.mockResolvedValue({ ok: true, empty: true });
    pushSnapshot.mockResolvedValueOnce({ ok: false, code: 'conflict' });
    pushSnapshot.mockResolvedValue({ ok: true, revision: 1 });
    syncEngine.notifyChange();
    await vi.advanceTimersByTimeAsync(3000);
    await vi.advanceTimersByTimeAsync(2000);
    expect(pushSnapshot).toHaveBeenCalledTimes(2);
  });

  it('does not push after a pull writes remote data', async () => {
    pullSnapshot.mockResolvedValue({ ok: true, revision: 3, data: {} });
    await syncEngine.pull();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(pushSnapshot).not.toHaveBeenCalled();
  });
});
