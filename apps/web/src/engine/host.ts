import { DEFAULT_MAX_OUTPUT, MAX_TRACE_FRAMES, MAX_TRACE_STEPS, explainError, type ExecErrorKind, type ExecOptions, type ExecResult, type PageNode, type RobotState, type TraceStep } from '@codegames/runtime';
import type { WorkerMessage } from './protocol';

export type EngineStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface WorkerHostOptions {
  timeoutMs: number;
  /**
   * Replace the worker after every run, so learner code that patches globals
   * (e.g. `Array.prototype`) can't affect later runs. Cheap for JS; Python instead
   * restores interpreter state inside the runtime, because reloading Pyodide is slow.
   */
  freshWorkerPerRun?: boolean;
  /**
   * Python: stop a runaway program by setting a shared interrupt flag instead of killing the
   * worker (reloading Pyodide takes seconds). Needs cross-origin isolation for
   * SharedArrayBuffer; without it, the host falls back to replacing the worker.
   */
  interruptible?: boolean;
}

/** A per-run secret (128 random bits). */
function newNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** How long a run gets to stop after an interrupt before its worker is replaced anyway. */
const INTERRUPT_GRACE_MS = 1500;

function failure(name: 'TimeoutError' | 'LoadError' | 'MemoryError' | 'InternalError', message: string, durationMs: number): ExecResult {
  const kind = name === 'TimeoutError' ? 'timeout' : name === 'LoadError' || name === 'InternalError' ? 'internal' : 'runtime';
  return { stdout: '', durationMs, error: { kind, name, message, friendly: explainError(name) } };
}

// ── Checking what a worker sends back ──
// The worker is our own code, but it runs learner code beside it, so its answer is data from
// outside: every field is checked and capped before the UI draws it. Anything that does not fit
// becomes a safe InternalError (see `validateExecResult`).

const MAX_MESSAGE = 2000;
const MAX_NAME = 100;
const MAX_PAGE_NODES = 2000;
const MAX_PAGE_DEPTH = 50;
const MAX_PAGE_TEXT = 10_000;
const MAX_ATTR_VALUE = 10_000;
/** A hard ceiling on trace steps: the runtime stops at MAX_TRACE_STEPS (plus one final-state step). */
const TRACE_HARD_CAP = 5000;
const MAX_GRID_ACTIONS = 500;
const MAX_INPUTS = 1000;
const MAX_VARS = 500;
const ERROR_KINDS: ReadonlySet<string> = new Set<ExecErrorKind>(['syntax', 'runtime', 'timeout', 'output-limit', 'robot', 'internal']);

class Malformed extends Error {}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown, what: string): number => {
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new Malformed(`${what} is not a number`);
  return v;
};
const str = (v: unknown, what: string, max: number): string => {
  if (typeof v !== 'string') throw new Malformed(`${what} is not text`);
  return v.length > max ? v.slice(0, max) : v;
};
const optNum = (v: unknown, what: string): number | undefined => (v === undefined ? undefined : num(v, what));

function checkTrace(raw: unknown): TraceStep[] {
  if (!Array.isArray(raw)) throw new Malformed('trace is not a list');
  if (raw.length > TRACE_HARD_CAP) throw new Malformed('trace is too long');
  const vars = (v: unknown, what: string): [string, string][] => {
    if (!Array.isArray(v) || v.length > MAX_VARS) throw new Malformed(`${what} is not a list`);
    return v.map((pair): [string, string] => {
      if (!Array.isArray(pair) || pair.length !== 2) throw new Malformed(`${what} entry is not a pair`);
      return [str(pair[0], 'variable name', 200), str(pair[1], 'variable value', 400)];
    });
  };
  return raw.slice(0, MAX_TRACE_STEPS + 1).map((step): TraceStep => {
    if (!isObject(step)) throw new Malformed('trace step is not an object');
    const stack = step.stack;
    if (!Array.isArray(stack) || stack.length > MAX_TRACE_FRAMES) throw new Malformed('trace stack is not a short list');
    return {
      line: num(step.line, 'trace line'),
      scope: str(step.scope, 'trace scope', 200),
      vars: vars(step.vars, 'trace vars'),
      stack: stack.map((f) => {
        if (!isObject(f)) throw new Malformed('trace frame is not an object');
        return { name: str(f.name, 'frame name', 200), id: num(f.id, 'frame id'), vars: vars(f.vars, 'frame vars') };
      }),
      depth: num(step.depth, 'trace depth'),
      out: num(step.out, 'trace out'),
    };
  });
}

/** Rebuild a page snapshot, refusing more than 2000 nodes or more than 50 levels. */
function checkPage(raw: unknown): PageNode {
  let nodes = 0;
  const visit = (node: unknown, depth: number): PageNode => {
    if (!isObject(node)) throw new Malformed('page node is not an object');
    if (depth > MAX_PAGE_DEPTH) throw new Malformed('page is nested too deeply');
    if (++nodes > MAX_PAGE_NODES) throw new Malformed('page has too many nodes');
    const tag = str(node.tag, 'page tag', 20);
    if (!/^[a-z][a-z0-9]*$/.test(tag)) throw new Malformed('page tag is not a tag name');
    if (!isObject(node.attrs)) throw new Malformed('page attrs is not an object');
    const attrs: Record<string, string> = {};
    for (const [name, value] of Object.entries(node.attrs)) {
      if (!/^[a-z][a-z0-9-]*$/i.test(name) || name.length > 100) throw new Malformed('page attribute name is not valid');
      attrs[name] = str(value, 'page attribute', MAX_ATTR_VALUE);
    }
    if (!Array.isArray(node.children) || node.children.length > MAX_PAGE_NODES) throw new Malformed('page children is not a list');
    const children = node.children.map((c): PageNode | string => {
      if (typeof c === 'string') {
        if (++nodes > MAX_PAGE_NODES) throw new Malformed('page has too many nodes');
        return c.length > MAX_PAGE_TEXT ? c.slice(0, MAX_PAGE_TEXT) : c;
      }
      return visit(c, depth + 1);
    });
    const path = str(node.path, 'page path', 500);
    if (!/^@[0-9/]*$/.test(path)) throw new Malformed('page path is not a path');
    return { tag, attrs, children, path };
  };
  return visit(raw, 0);
}

function checkGrid(raw: Record<string, unknown>): NonNullable<ExecResult['grid']> {
  if (!Array.isArray(raw.actions) || raw.actions.length > MAX_GRID_ACTIONS) throw new Malformed('grid actions is not a short list');
  const robot = (r: unknown): RobotState => {
    if (!isObject(r) || (r.dir !== 'N' && r.dir !== 'E' && r.dir !== 'S' && r.dir !== 'W')) throw new Malformed('grid robot is not valid');
    return { x: num(r.x, 'robot x'), y: num(r.y, 'robot y'), dir: r.dir };
  };
  const actions = raw.actions.map((a): NonNullable<ExecResult['grid']>['actions'][number] => {
    if (!isObject(a)) throw new Malformed('grid action is not an object');
    const line = optNum(a.line, 'action line');
    const base = { robot: robot(a.robot), ...(line !== undefined ? { line } : {}) };
    if (a.type === 'move') return { type: 'move', ...base };
    if (a.type === 'turn') return { type: 'turn', ...base };
    if (a.type === 'collect') {
      if (!Array.isArray(a.gem) || a.gem.length !== 2) throw new Malformed('grid gem is not a pair');
      return { type: 'collect', ...base, gem: [num(a.gem[0], 'gem x'), num(a.gem[1], 'gem y')] };
    }
    throw new Malformed('grid action type is unknown');
  });
  if (typeof raw.success !== 'boolean') throw new Malformed('grid success is not true or false');
  return {
    actions,
    success: raw.success,
    ...(raw.reason !== undefined ? { reason: str(raw.reason, 'grid reason', 500) } : {}),
    gemsCollected: num(raw.gemsCollected, 'gemsCollected'),
    totalGems: num(raw.totalGems, 'totalGems'),
  };
}

/**
 * Check a worker's answer field by field and rebuild it, so the UI never sees an unexpected
 * type or an oversized value. Text is cut to its cap (stdout and stderr to `maxOutput`,
 * `error.message` to 2000); a result that does not fit the shape at all (or has a page over
 * 2000 nodes / 50 levels, or a trace over 5000 steps) is replaced by a safe InternalError.
 */
export function validateExecResult(raw: unknown, maxOutput: number = DEFAULT_MAX_OUTPUT): ExecResult {
  try {
    if (!isObject(raw)) throw new Malformed('result is not an object');
    const out: ExecResult = {
      stdout: str(raw.stdout, 'stdout', maxOutput),
      durationMs: num(raw.durationMs, 'durationMs'),
    };
    if (raw.stderr !== undefined) out.stderr = str(raw.stderr, 'stderr', maxOutput);
    if (raw.inputs !== undefined) {
      if (!Array.isArray(raw.inputs) || raw.inputs.length > MAX_INPUTS) throw new Malformed('inputs is not a list');
      out.inputs = raw.inputs.map((i) => {
        if (!isObject(i)) throw new Malformed('input is not an object');
        return { offset: num(i.offset, 'input offset'), prompt: str(i.prompt, 'input prompt', 500) };
      });
    }
    if (raw.error !== undefined) {
      const e = raw.error;
      if (!isObject(e)) throw new Malformed('error is not an object');
      if (typeof e.kind !== 'string' || !ERROR_KINDS.has(e.kind)) throw new Malformed('error kind is unknown');
      const line = optNum(e.line, 'error line');
      out.error = {
        kind: e.kind as ExecErrorKind,
        name: str(e.name, 'error name', MAX_NAME),
        message: str(e.message, 'error message', MAX_MESSAGE),
        ...(line !== undefined ? { line } : {}),
        friendly: str(e.friendly, 'error explanation', MAX_MESSAGE),
      };
    }
    if (raw.grid !== undefined) {
      if (!isObject(raw.grid)) throw new Malformed('grid is not an object');
      out.grid = checkGrid(raw.grid);
    }
    if (raw.trace !== undefined) out.trace = checkTrace(raw.trace);
    if (raw.traceTruncated !== undefined) {
      if (typeof raw.traceTruncated !== 'boolean') throw new Malformed('traceTruncated is not true or false');
      out.traceTruncated = raw.traceTruncated;
    }
    if (raw.page !== undefined) out.page = checkPage(raw.page);
    return out;
  } catch (e) {
    if (e instanceof Malformed) return failure('InternalError', `The code engine sent back something unexpected (${e.message}).`, 0);
    throw e;
  }
}

/**
 * Owns one Web Worker for a language. Runs are queued one at a time; a run that
 * exceeds the timeout gets its worker terminated and replaced (the only reliable
 * way to stop an infinite loop). Runs never reject: failures come back as errors.
 */
export class WorkerHost {
  private worker?: Worker;
  private readyPromise?: Promise<void>;
  private nextId = 1;
  private queue: Promise<unknown> = Promise.resolve();
  private listeners = new Set<(s: EngineStatus) => void>();
  status: EngineStatus = 'idle';
  /** After the first successful load, quick worker replacements don't show as "loading". */
  private everReady = false;
  private interrupt?: Int32Array;

  constructor(
    private readonly create: () => Worker,
    private readonly options: WorkerHostOptions,
  ) {}

  subscribe(listener: (s: EngineStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setStatus(status: EngineStatus) {
    this.status = status;
    this.listeners.forEach((l) => l(status));
  }

  /** Start the worker (and e.g. download Python) ahead of the first run. Retries after a failure. */
  warmUp(): Promise<void> {
    if (!this.readyPromise) {
      if (!this.everReady) this.setStatus('loading');
      let worker: Worker;
      try {
        worker = this.create();
      } catch (e) {
        this.setStatus('error');
        return Promise.reject(e);
      }
      this.worker = worker;
      this.interrupt = undefined;
      if (this.options.interruptible && typeof SharedArrayBuffer !== 'undefined' && globalThis.crossOriginIsolated) {
        this.interrupt = new Int32Array(new SharedArrayBuffer(4));
        worker.postMessage({ type: 'interrupt-buffer', buffer: this.interrupt });
      }
      this.readyPromise = new Promise<void>((resolve, reject) => {
        const fail = (message: string) => {
          worker.removeEventListener('message', onMessage);
          worker.terminate();
          if (this.worker === worker) this.worker = undefined;
          this.readyPromise = undefined;
          this.setStatus('error');
          reject(new Error(message));
        };
        const onStartError = (e: ErrorEvent) => fail(e.message || 'Worker failed to start');
        const onMessage = (event: MessageEvent<WorkerMessage>) => {
          if (event.data.type === 'ready') {
            worker.removeEventListener('message', onMessage);
            // From here on, a crash belongs to the run in progress (see runNow), not to startup.
            worker.removeEventListener('error', onStartError);
            this.everReady = true;
            if (this.status !== 'ready') this.setStatus('ready');
            resolve();
          } else if (event.data.type === 'load-error') {
            fail(event.data.message);
          }
        };
        worker.addEventListener('message', onMessage);
        worker.addEventListener('error', onStartError, { once: true });
      });
    }
    return this.readyPromise;
  }

  private replaceWorker() {
    this.worker?.terminate();
    this.worker = undefined;
    this.readyPromise = undefined;
    void this.warmUp().catch(() => undefined);
  }

  run(code: string, options: ExecOptions = {}): Promise<ExecResult> {
    const job = this.queue.then(() => this.runNow(code, options));
    this.queue = job.catch(() => undefined);
    return job;
  }

  private async runNow(code: string, options: ExecOptions): Promise<ExecResult> {
    try {
      await this.warmUp();
    } catch (e) {
      return failure('LoadError', e instanceof Error ? e.message : String(e), 0);
    }
    const worker = this.worker!;
    const id = this.nextId++;
    // Only the worker's own code knows this, so learner code can't forge a result (round-8 P1-1).
    const nonce = newNonce();
    const { timeoutMs } = this.options;
    const interrupt = this.interrupt;
    if (interrupt) Atomics.store(interrupt, 0, 0);
    return new Promise<ExecResult>((resolve) => {
      let timedOut = false;
      let grace: ReturnType<typeof setTimeout> | undefined;
      const timeout = () => resolve(failure('TimeoutError', `Stopped after ${timeoutMs / 1000} seconds.`, timeoutMs));
      const timer = setTimeout(() => {
        timedOut = true;
        if (!interrupt) {
          worker.removeEventListener('message', onMessage);
          this.replaceWorker();
          timeout();
          return;
        }
        // Ask Python to stop (SIGINT); keep the worker if it answers in time.
        Atomics.store(interrupt, 0, 2);
        grace = setTimeout(() => {
          worker.removeEventListener('message', onMessage);
          this.replaceWorker();
          timeout();
        }, INTERRUPT_GRACE_MS);
      }, timeoutMs);
      // A worker that dies mid-run (e.g. out of memory) never answers: report it and start a
      // fresh worker instead of waiting for the timeout (round-8 P0-1).
      const onCrash = () => {
        clearTimeout(timer);
        if (grace) clearTimeout(grace);
        worker.removeEventListener('message', onMessage);
        this.replaceWorker();
        resolve(failure('MemoryError', 'The program stopped the code engine. It probably used too much memory.', 0));
      };
      const onMessage = (event: MessageEvent<WorkerMessage>) => {
        if (event.data.type !== 'result' || event.data.id !== id || event.data.nonce !== nonce) return;
        clearTimeout(timer);
        if (grace) clearTimeout(grace);
        worker.removeEventListener('message', onMessage);
        worker.removeEventListener('error', onCrash);
        if (this.options.freshWorkerPerRun) this.replaceWorker();
        const checked = validateExecResult(event.data.result, options.maxOutput ?? DEFAULT_MAX_OUTPUT);
        if (timedOut) {
          // Interrupted in time: the worker (and loaded Python) stays alive. Keep what the run
          // recorded (output so far, a step-through trace) and report the timeout.
          if (interrupt) Atomics.store(interrupt, 0, 0);
          const stopped = failure('TimeoutError', `Stopped after ${timeoutMs / 1000} seconds.`, timeoutMs);
          const { trace, traceTruncated, stdout } = checked;
          resolve({ ...stopped, stdout, ...(trace ? { trace, traceTruncated } : {}) });
          return;
        }
        resolve(checked);
      };
      worker.addEventListener('message', onMessage);
      worker.addEventListener('error', onCrash, { once: true });
      worker.postMessage({ type: 'run', id, nonce, code, options });
    });
  }
}
