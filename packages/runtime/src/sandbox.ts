/**
 * Closes the ways learner JavaScript can reach the real global object (round-8 P1-1).
 *
 * Learner code runs inside `new Function` with `self`, `globalThis`, `postMessage` … shadowed
 * by parameters, but code compiled at run time doesn't see those parameters:
 * `Function('return this')()`, `[].constructor.constructor('return globalThis')()`,
 * `(async () => {}).constructor`, indirect `(0, eval)('this')` and `setTimeout('code')` all
 * evaluate in the global scope. While learner code runs, every function constructor and the
 * global `eval` are replaced by stubs that throw, and restored afterwards.
 * The web worker also deletes `postMessage` and the network from its global (apps/web
 * engine/lockdown.ts), so even an escape that slips through finds nothing to abuse.
 */

class EscapeBlocked extends Error {
  constructor(what: string) {
    super(`${what} isn't available in CodeGames programs. Write the code directly instead.`);
    this.name = 'SecurityError';
  }
}

/** Every kind of function constructor: plain, async, generator, async generator. */
function functionPrototypes(): object[] {
  const samples = [function () {}, async function () {}, function* () {}, async function* () {}];
  return samples.map((f) => Object.getPrototypeOf(f) as object);
}

/**
 * The global `Function`, for learner code: `instanceof Function` and `Function.prototype` still
 * work, but calling or constructing it (which compiles code in the global scope) throws.
 */
export const blockedFunction: FunctionConstructor = new Proxy(Function, {
  apply() {
    throw new EscapeBlocked('Making functions from text');
  },
  construct() {
    throw new EscapeBlocked('Making functions from text');
  },
});

/** `setTimeout`/`setInterval` that refuse a string of code (which would run in the global scope). */
export function noStringTimers<T extends (...args: never[]) => unknown>(timer: T | undefined, name: string): T | undefined {
  if (!timer) return undefined;
  return ((handler: unknown, ...rest: unknown[]) => {
    if (typeof handler !== 'function') throw new EscapeBlocked(`${name} with a string of code`);
    return (timer as unknown as (...a: unknown[]) => unknown)(handler, ...rest);
  }) as unknown as T;
}

/** True inside a Web Worker, which is torn down after the run: the guards never need to come off. */
function inWorker(): boolean {
  const scope = (globalThis as { WorkerGlobalScope?: new () => object }).WorkerGlobalScope;
  return typeof scope === 'function' && globalThis instanceof scope;
}

let guardDepth = 0;
let restoreGuards: (() => void) | undefined;

function installGuards(): () => void {
  const g = globalThis as unknown as Record<string, unknown>;
  const saved: [object, PropertyDescriptor][] = [];
  for (const proto of functionPrototypes()) {
    const descriptor = Object.getOwnPropertyDescriptor(proto, 'constructor');
    if (!descriptor?.configurable) continue;
    saved.push([proto, descriptor]);
    Object.defineProperty(proto, 'constructor', {
      ...descriptor,
      value: function blocked() {
        throw new EscapeBlocked('Making functions from text');
      },
    });
  }
  const evalDescriptor = Object.getOwnPropertyDescriptor(g, 'eval');
  if (evalDescriptor?.configurable) {
    Object.defineProperty(g, 'eval', {
      ...evalDescriptor,
      value: function blocked() {
        throw new EscapeBlocked('eval');
      },
    });
  }
  return () => {
    for (const [proto, descriptor] of saved) Object.defineProperty(proto, 'constructor', descriptor);
    if (evalDescriptor?.configurable) Object.defineProperty(g, 'eval', evalDescriptor);
  };
}

/**
 * Runs `fn` with the escapes closed. Learner callbacks (promises, timers, DOM listeners) run after
 * `fn` returns, so the guards outlive it: in a worker they are never removed; elsewhere (Node
 * tests) they come off in a later macrotask, once the microtasks and zero-delay timers it queued
 * have run. Overlapping runs share one set of guards.
 */
export function withClosedEscapes<T>(fn: () => T): T {
  if (guardDepth === 0 && !restoreGuards) restoreGuards = installGuards();
  guardDepth++;
  try {
    return fn();
  } finally {
    guardDepth--;
    if (guardDepth === 0 && !inWorker()) {
      const timer = setTimeout(() => {
        if (guardDepth !== 0) return;
        restoreGuards?.();
        restoreGuards = undefined;
      }, 0);
      (timer as { unref?: () => void }).unref?.();
    }
  }
}
