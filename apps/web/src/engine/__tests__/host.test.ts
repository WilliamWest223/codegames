import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkerHost } from '../host';
import type { RunMessage, WorkerMessage } from '../protocol';

type Behavior = 'ok' | 'hang' | 'fail-load' | 'slow' | 'crash' | 'crash-other' | 'forge' | 'malformed';

/** Minimal Worker stand-in: answers runs according to `behavior`. */
class FakeWorker {
  static created = 0;
  static terminated = 0;
  private listeners = new Map<string, Set<(e: { data: WorkerMessage }) => void>>();
  constructor(private behavior: Behavior) {
    FakeWorker.created++;
    queueMicrotask(() =>
      this.emit(behavior === 'fail-load' ? { type: 'load-error', message: 'no python today' } : { type: 'ready' }),
    );
  }
  addEventListener(type: string, fn: (e: { data: WorkerMessage }) => void) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(fn);
  }
  removeEventListener(type: string, fn: (e: { data: WorkerMessage }) => void) {
    this.listeners.get(type)?.delete(fn);
  }
  postMessage(msg: RunMessage | { type: 'interrupt-buffer' }) {
    if (msg.type !== 'run' || this.behavior === 'hang') return;
    if (this.behavior === 'crash' || this.behavior === 'crash-other') {
      // The worker dies mid-run without answering (e.g. it ran out of memory).
      const message = this.behavior === 'crash' ? 'Out of memory' : 'Script error.';
      queueMicrotask(() => this.listeners.get('error')?.forEach((fn) => fn({ data: { type: 'ready' }, message } as never)));
      return;
    }
    if (this.behavior === 'slow') {
      // Answers after the timeout, as an interrupted Python run does inside the grace period.
      const step = { line: 1, scope: '', vars: [], stack: [{ name: '', id: 0, vars: [] }], depth: 1, out: 0 };
      setTimeout(() => this.emit({ type: 'result', id: msg.id, nonce: msg.nonce, result: { stdout: 'partial', durationMs: 1, trace: [step], traceTruncated: false, error: { kind: 'runtime', name: 'KeyboardInterrupt', message: '', friendly: '' } } }), 40);
      return;
    }
    if (this.behavior === 'malformed') {
      queueMicrotask(() => this.emit({ type: 'result', id: msg.id, nonce: msg.nonce, result: { stdout: 42, durationMs: 1 } as unknown as never }));
      return;
    }
    if (this.behavior === 'forge') {
      // Learner code posting its own "result" (no nonce, or a guessed one), then the real one.
      queueMicrotask(() => {
        this.emit({ type: 'result', id: msg.id, nonce: '', result: { stdout: 'Hello, World!\n', durationMs: 1 } });
        this.emit({ type: 'result', id: msg.id, nonce: 'guess', result: { stdout: 'Hello, World!\n', durationMs: 1 } });
        this.emit({ type: 'result', id: msg.id, nonce: msg.nonce, result: { stdout: '', durationMs: 1 } });
      });
      return;
    }
    queueMicrotask(() => this.emit({ type: 'result', id: msg.id, nonce: msg.nonce, result: { stdout: `ran: ${msg.code}`, durationMs: 1 } }));
  }
  terminate() {
    FakeWorker.terminated++;
  }
  private emit(data: WorkerMessage) {
    this.listeners.get('message')?.forEach((fn) => fn({ data }));
  }
}

function host(behaviors: Behavior[], opts: { timeoutMs?: number; freshWorkerPerRun?: boolean; interruptible?: boolean } = {}) {
  let i = 0;
  return new WorkerHost(() => new FakeWorker(behaviors[Math.min(i++, behaviors.length - 1)]!) as unknown as Worker, {
    timeoutMs: opts.timeoutMs ?? 100,
    freshWorkerPerRun: opts.freshWorkerPerRun,
    interruptible: opts.interruptible,
  });
}

beforeEach(() => {
  FakeWorker.created = 0;
  FakeWorker.terminated = 0;
});
afterEach(() => vi.useRealTimers());

describe('WorkerHost', () => {
  it('runs code and reports ready', async () => {
    const h = host(['ok']);
    expect(await h.run('x')).toMatchObject({ stdout: 'ran: x' });
    expect(h.status).toBe('ready');
  });

  it('times out a hung run, replaces the worker, and keeps working', async () => {
    const h = host(['hang', 'ok'], { timeoutMs: 20 });
    const hung = await h.run('while(true){}');
    expect(hung.error).toMatchObject({ kind: 'timeout', name: 'TimeoutError' });
    expect(FakeWorker.terminated).toBe(1);
    expect(await h.run('y')).toMatchObject({ stdout: 'ran: y' });
  });

  it('turns a load failure into an error result instead of hanging, and can retry', async () => {
    const h = host(['fail-load', 'ok']);
    const failed = await h.run('x');
    expect(failed.error).toMatchObject({ kind: 'internal', name: 'LoadError' });
    expect(h.status).toBe('error');
    expect(await h.run('x')).toMatchObject({ stdout: 'ran: x' });
    expect(h.status).toBe('ready');
  });

  it('can use a fresh worker for every run', async () => {
    const h = host(['ok'], { freshWorkerPerRun: true });
    await h.run('a');
    await h.run('b');
    expect(FakeWorker.created).toBe(3); // first, after a, after b (pre-warmed)
    expect(FakeWorker.terminated).toBe(2);
  });

  it('keeps the partial trace of an interrupted run that answers in time (round-7 P1-1)', async () => {
    vi.stubGlobal('crossOriginIsolated', true);
    try {
      const h = host(['slow'], { timeoutMs: 20, interruptible: true });
      const r = await h.run('while True: pass', { trace: true });
      expect(r.error).toMatchObject({ kind: 'timeout', name: 'TimeoutError' });
      expect(r.trace).toHaveLength(1);
      expect(r.stdout).toBe('partial');
      expect(FakeWorker.terminated).toBe(0);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('does not call a non-memory worker crash a MemoryError', async () => {
    const h = host(['crash-other', 'ok'], { timeoutMs: 5_000 });
    const crashed = await h.run('1');
    expect(crashed.error?.name).toBe('InternalError');
    expect(crashed.error?.kind).toBe('internal');
  });

  it('queues runs one at a time', async () => {
    const h = host(['ok']);
    const results = await Promise.all([h.run('1'), h.run('2'), h.run('3')]);
    expect(results.map((r) => r.stdout)).toEqual(['ran: 1', 'ran: 2', 'ran: 3']);
  });
  it('reports a worker that dies mid-run as a memory error and replaces it (round-8 P0-1)', async () => {
    const h = host(['crash', 'ok'], { timeoutMs: 5_000 });
    const crashed = await h.run('for (;;) a.push(new Array(1e6))');
    expect(crashed.error?.name).toBe('MemoryError');
    expect(FakeWorker.terminated).toBeGreaterThanOrEqual(1);
    const next = await h.run('1');
    expect(next.stdout).toBe('ran: 1');
    expect(h.status).toBe('ready');
  });
  it('ignores results that do not carry the run nonce (round-8 P1-1)', async () => {
    const h = host(['forge']);
    const r = await h.run('Function("return this")().postMessage(...)');
    expect(r.stdout).toBe('');
  });
  it('turns a malformed worker result into a safe InternalError', async () => {
    const h = host(['malformed']);
    const r = await h.run('1');
    expect(r.error?.name).toBe('InternalError');
    expect(r.error?.kind).toBe('internal');
    expect(r.stdout).toBe('');
  });
});
