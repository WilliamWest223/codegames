/** Proxies the learner made, with their targets: printed via the target so no trap runs (as in Node). */
const proxyTargets = new WeakMap<object, object>();

/** A `Proxy` constructor for learner code that remembers each proxy's target (see `formatValue`). */
export const TrackedProxy: ProxyConstructor = new Proxy(Proxy, {
  construct(target, args: [object, ProxyHandler<object>], newTarget) {
    const proxy = Reflect.construct(target, args, newTarget) as object;
    proxyTargets.set(proxy, args[0]);
    return proxy;
  },
});

function describeFunction(value: Function): string {
  let source = '';
  try {
    source = Function.prototype.toString.call(value);
  } catch {
    // Not inspectable (e.g. a revoked proxy); treat it as a plain function.
  }
  if (/^class\b/.test(source)) {
    const parent = Object.getPrototypeOf(value) as Function | null;
    const extendsName = parent && parent !== Function.prototype && parent.name ? ` extends ${parent.name}` : '';
    return `[class ${value.name || '(anonymous)'}${extendsName}]`;
  }
  // Node: `[Function: name]`, but `[Function (anonymous)]` with no name.
  return value.name ? `[Function: ${value.name}]` : '[Function (anonymous)]';
}

/** Caps for step-through previews: a huge value is cut, not formatted in full on every step. */
export interface PreviewLimit {
  items: number;
  chars: number;
}
export const PREVIEW_LIMIT: PreviewLimit = { items: 50, chars: 200 };

/** Node's marker for elided items, if any. */
const more = (n: number): string[] => (n > 0 ? [`... ${n} more item${n === 1 ? '' : 's'}`] : []);

/** The first `n` entries of an iterable, without walking the rest. */
function firstItems<T>(items: Iterable<T>, n: number): T[] {
  const out: T[] = [];
  for (const item of items) {
    if (out.length >= n) break;
    out.push(item);
  }
  return out;
}

/**
 * Format values like Node's console.log so JavaScript output is predictable
 * and identical in the browser worker and in tests. Like Node, it never runs learner code:
 * accessors print as `[Getter]`/`[Setter]` and proxies print through their target.
 */
/** Runtime objects (DOM elements, the document) print a short preview instead of their internals. */
export const PREVIEW = Symbol.for('codegames.preview');

function preview(value: unknown): string | undefined {
  const fn = (value as { [PREVIEW]?: unknown })[PREVIEW];
  return typeof fn === 'function' ? String((fn as () => unknown).call(value)) : undefined;
}

export function formatValue(value: unknown, nested = false, seen = new Set<unknown>(), limit?: PreviewLimit): string {
  if (typeof value === 'string') {
    const text = limit && value.length > limit.chars ? `${value.slice(0, limit.chars)}… ${value.length - limit.chars} more chars` : value;
    return nested ? `'${text}'` : text;
  }
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return typeof value === 'bigint' ? `${value}n` : Object.is(value, -0) ? '-0' : String(value);
  }
  if (typeof value === 'symbol') return value.toString();
  if (proxyTargets.has(value as object)) return formatValue(proxyTargets.get(value as object), nested, seen, limit);
  if (typeof value === 'function') return describeFunction(value as Function);
  const short = preview(value);
  if (short !== undefined) return short;
  if (seen.has(value)) return '[Circular]';
  seen.add(value);
  try {
    if (Array.isArray(value)) {
      if (value.length === 0) return '[]';
      const shown = limit ? value.slice(0, limit.items) : value;
      return `[ ${[...shown.map((v) => formatValue(v, true, seen, limit)), ...more(value.length - shown.length)].join(', ')} ]`;
    }
    if (value instanceof Map) {
      const all = limit ? firstItems(value, limit.items) : [...value];
      const items = all.map(([k, v]) => `${formatValue(k, true, seen, limit)} => ${formatValue(v, true, seen, limit)}`);
      items.push(...more(value.size - all.length));
      return `Map(${value.size}) {${items.length ? ` ${items.join(', ')} ` : ''}}`;
    }
    if (value instanceof Set) {
      const all = limit ? firstItems(value, limit.items) : [...value];
      const items = all.map((v) => formatValue(v, true, seen, limit));
      items.push(...more(value.size - all.length));
      return `Set(${value.size}) {${items.length ? ` ${items.join(', ')} ` : ''}}`;
    }
    if (value instanceof Error) return `${value.name}: ${value.message}`;
    // Own enumerable keys, read through descriptors so getters don't run.
    const keys = Object.keys(value as object);
    const shownKeys = limit ? keys.slice(0, limit.items) : keys;
    const entries = shownKeys.map((k): [string, string] => {
      const d = Object.getOwnPropertyDescriptor(value, k);
      if (d && (d.get || d.set)) return [k, d.get && d.set ? '[Getter/Setter]' : d.get ? '[Getter]' : '[Setter]'];
      return [k, formatValue(d?.value, true, seen, limit)];
    });
    // Like Node, class instances show their class: `Pet { name: 'Rex' }`.
    const proto = Object.getPrototypeOf(value) as { constructor?: { name?: string } } | null;
    const className = proto && proto !== Object.prototype ? proto.constructor?.name : undefined;
    const prefix = className ? `${className} ` : '';
    if (entries.length === 0) return `${prefix}{}`;
    const body = [...entries.map(([k, v]) => `${/^[A-Za-z_$][\w$]*$/.test(k) ? k : `'${k}'`}: ${v}`), ...more(keys.length - shownKeys.length)].join(', ');
    return `${prefix}{ ${body} }`;
  } finally {
    seen.delete(value);
  }
}

export function formatLogArgs(args: unknown[]): string {
  return args.map((a) => formatValue(a)).join(' ');
}
