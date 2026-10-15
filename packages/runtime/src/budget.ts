/**
 * An allocation budget for learner JavaScript (round-8 P0-1).
 *
 * A runaway like `for (;;) a.push(new Array(1e6).fill(1))` grows the worker's heap faster than
 * the 3-second timeout can stop it, and in Chrome a worker that runs out of memory takes the
 * whole tab down with it. So array growth is counted while learner code runs, and the program
 * is stopped with a friendly `MemoryError` long before the heap is in danger. The count is
 * coarse on purpose (elements, not bytes): it only has to catch runaways, never real programs.
 */

/** Array elements a single run may create (≈ 80 MB of numbers): far beyond any level's needs. */
export const MAX_ARRAY_ELEMENTS = 10_000_000;

/** Thrown when a program creates too much data. Reported like Python's MemoryError. */
export class MemoryLimitError extends Error {
  constructor() {
    super('Your program used too much memory. Is a loop adding to a list forever?');
    this.name = 'MemoryError';
  }
}

type Counter = (elements: number) => void;

/**
 * Run `fn` with array growth counted against `limit`. Patches `Array` methods for the duration
 * of the call and always restores them, so Node tests and later runs are unaffected. Returns
 * `fn`'s result and the `Array` stand-in the learner's code should see (it counts `new Array(n)`
 * and `Array(n)` while staying `instanceof`-compatible).
 */
export function withAllocationBudget<T>(limit: number, fn: (ArrayBinding: ArrayConstructor) => T): T {
  let used = 0;
  const count: Counter = (elements) => {
    if (!(elements > 0)) return;
    used += elements;
    if (used > limit) throw new MemoryLimitError();
  };
  type Method = (this: unknown, ...args: unknown[]) => unknown;
  const proto = Array.prototype as unknown as Record<string, Method>;
  // What each method adds, counted before the real method runs.
  const growth: Record<string, (self: unknown[], args: unknown[]) => number> = {
    push: (_self, args) => args.length,
    unshift: (_self, args) => args.length,
    fill: (self) => self.length,
    splice: (_self, args) => Math.max(0, args.length - 2),
    concat: (self, args) => self.length + args.reduce<number>((n, x) => n + (Array.isArray(x) ? x.length : 1), 0),
  };
  const saved: Record<string, Method> = {};
  for (const [name, added] of Object.entries(growth)) {
    const original = proto[name]!;
    saved[name] = original;
    proto[name] = function (this: unknown, ...args: unknown[]) {
      if (Array.isArray(this)) count(added(this, args));
      return original.apply(this, args);
    };
  }
  const savedFrom = Array.from;
  const statics = Array as unknown as Record<string, Method>;
  statics.from = function (this: unknown, ...args: unknown[]) {
    const source = args[0] as { length?: unknown } | null | undefined;
    if (source && typeof source.length === 'number') count(source.length);
    return (savedFrom as unknown as Method).apply(this, args);
  };
  const sizeOf = (args: unknown[]) => (args.length === 1 && typeof args[0] === 'number' ? args[0] : args.length);
  const ArrayBinding = new Proxy(Array, {
    apply(target, _this, args: unknown[]) {
      count(sizeOf(args));
      return Reflect.apply(target, undefined, args);
    },
    construct(target, args: unknown[], newTarget) {
      count(sizeOf(args));
      return Reflect.construct(target, args, newTarget);
    },
  });
  try {
    return fn(ArrayBinding);
  } finally {
    for (const [name, original] of Object.entries(saved)) proto[name] = original;
    Array.from = savedFrom;
  }
}
