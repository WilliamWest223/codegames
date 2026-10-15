import { describe, expect, it } from 'vitest';
import { BLOCKED_GLOBALS, BLOCKED_NAVIGATOR, lockDown } from '../lockdown';

/** A stand-in for a worker global: methods on a prototype, constructors as own properties. */
function fakeScope() {
  const sent: unknown[] = [];
  class Proto {
    postMessage(message: unknown) {
      sent.push(message);
    }
    fetch() {
      return 'network!';
    }
  }
  class Nav {
    sendBeacon() {
      return true;
    }
  }
  const navigator = Object.assign(new Nav(), { locks: {}, serviceWorker: {}, storage: {} });
  const scope = Object.assign(new Proto(), {
    XMLHttpRequest: class {},
    WebSocket: class {},
    caches: {},
    importScripts: () => undefined,
    BroadcastChannel: class {},
    MessageChannel: class {},
    MessagePort: class {},
    navigator,
  });
  return { scope, sent };
}

describe('lockDown (round-8 P1-1/P1-2)', () => {
  it('keeps a private way to post and removes it from the global', () => {
    const { scope, sent } = fakeScope();
    const post = lockDown(scope);
    post({ type: 'ready' });
    expect(sent).toEqual([{ type: 'ready' }]);
    // What learner code finds via Function('return this')() or `import js`:
    const escaped = scope as unknown as Record<string, unknown>;
    expect(escaped.postMessage).toBeUndefined();
    expect(escaped.fetch).toBeUndefined();
  });

  it('removes every network and persistence API it lists', () => {
    const { scope } = fakeScope();
    lockDown(scope);
    const escaped = scope as unknown as Record<string, unknown>;
    for (const name of BLOCKED_GLOBALS) expect(escaped[name], name).toBeUndefined();
  });

  it('cannot be undone by reassigning', () => {
    const { scope } = fakeScope();
    lockDown(scope);
    const escaped = scope as unknown as Record<string, unknown>;
    expect(() => {
      escaped.fetch = () => 'again';
    }).toThrow(TypeError);
  });

  it('blocks cross-context and beacon primitives', () => {
    for (const name of ['BroadcastChannel', 'MessageChannel', 'MessagePort', 'RTCPeerConnection', 'WebSocketStream', 'CacheStorage']) {
      expect(BLOCKED_GLOBALS as readonly string[], name).toContain(name);
    }
    expect(BLOCKED_NAVIGATOR as readonly string[]).toContain('sendBeacon');
    const { scope } = fakeScope();
    lockDown(scope);
    const escaped = scope as unknown as Record<string, Record<string, unknown> | undefined>;
    expect(escaped.BroadcastChannel).toBeUndefined();
    expect(escaped.MessageChannel).toBeUndefined();
    const nav = escaped.navigator!;
    for (const name of BLOCKED_NAVIGATOR) expect(nav[name], name).toBeUndefined();
    expect(() => {
      nav.sendBeacon = () => true;
    }).toThrow(TypeError);
  });

  it('survives a scope with no navigator', () => {
    const scope = { postMessage: () => undefined };
    expect(() => lockDown(scope)).not.toThrow();
  });
});
