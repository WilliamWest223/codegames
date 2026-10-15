/// <reference lib="webworker" />
import type { WorkerMessage } from './protocol';

/**
 * Worker globals learner code must never reach (round-8 P1-1, P1-2). Learner code can always
 * find the real worker global (`Function('return this')()` in JS, `import js` in Python), so
 * hiding names is not enough: these are deleted from the global and its prototype chain.
 * - `postMessage`: faking a passing result. The worker keeps a private bound copy.
 * - Network: `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `WebTransport`,
 *   `importScripts`, and nested `Worker`s (which would get their own `fetch`).
 * - Persistence: `caches` (could poison the offline app shell), `indexedDB`.
 * - Cross-context messaging: `BroadcastChannel` and `MessageChannel`/`MessagePort` could talk to
 *   other tabs or workers (including a later run's worker) without going through the host.
 * - Beacons and sockets that bypass `fetch`: `navigator.sendBeacon`, `WebSocketStream`, WebRTC.
 * The Content-Security-Policy (`connect-src 'self'`) is the second line of defence.
 */
export const BLOCKED_GLOBALS = [
  'postMessage',
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
  'EventSource',
  'WebTransport',
  'importScripts',
  'Worker',
  'SharedWorker',
  'caches',
  'indexedDB',
  'BroadcastChannel',
  'MessageChannel',
  'MessagePort',
  'WebSocketStream',
  'RTCPeerConnection',
  'RTCDataChannel',
  'Cache',
  'CacheStorage',
  'IDBFactory',
  'openDatabase',
  'webkitRequestFileSystem',
  'webkitRequestFileSystemSync',
] as const;

/** Members of `navigator` that reach outside the worker (network, other contexts, storage). */
export const BLOCKED_NAVIGATOR = ['sendBeacon', 'serviceWorker', 'locks', 'storage', 'connection', 'mediaDevices'] as const;

/** Remove `name` wherever it is defined on `target`'s prototype chain. */
function erase(target: object, name: string) {
  for (let o: object | null = target; o; o = Object.getPrototypeOf(o) as object | null) {
    if (Object.getOwnPropertyDescriptor(o, name)) {
      try {
        delete (o as Record<string, unknown>)[name];
      } catch {
        // Non-configurable: shadowed below instead.
      }
    }
  }
  // Pin it to undefined, so learner code can't put something back under the same name.
  try {
    Object.defineProperty(target, name, { value: undefined, writable: false, configurable: false });
  } catch {
    // Best effort: the CSP still blocks the network.
  }
}

/**
 * Lock the worker down and return the only way left to talk to the host. Call once, at the
 * top of the worker module, after anything that needs the network (e.g. loading Pyodide).
 */
export function lockDown(scope: { postMessage(message: unknown): void } = self): (message: WorkerMessage) => void {
  const post = scope.postMessage.bind(scope) as (message: WorkerMessage) => void;
  for (const name of BLOCKED_GLOBALS) erase(scope, name);
  const nav = (scope as { navigator?: unknown }).navigator;
  if (nav && typeof nav === 'object') for (const name of BLOCKED_NAVIGATOR) erase(nav, name);
  return post;
}
