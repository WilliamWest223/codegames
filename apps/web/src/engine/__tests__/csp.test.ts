import { describe, expect, it } from 'vitest';
import sw from '../../../public/sw.js?raw';
import { contentSecurityPolicy } from '../../csp';

/** CSP tests verifying origin isolation in dev, preview, and service worker. */
describe('Content-Security-Policy', () => {
  const directives = (policy: string) =>
    Object.fromEntries(
      policy
        .split(';')
        .map((d) => d.trim().split(/\s+/))
        .map(([k, ...v]) => [k, v])
    );

  it('keeps every connection on the same origin in production default', () => {
    const csp = directives(contentSecurityPolicy({ dev: false }));
    expect(csp['connect-src']).toEqual(["'self'"]);
    expect(csp['default-src']).toEqual(["'self'"]);
    expect(csp['worker-src']).toEqual(["'self'"]);
    expect(csp['object-src']).toEqual(["'none'"]);
    // Only what the engines need: new Function (JS worker) and WebAssembly (Pyodide).
    expect(csp['script-src']).toEqual(["'self'", "'unsafe-eval'", "'wasm-unsafe-eval'"]);
  });

  it('only loosens what Vite needs in dev (inline refresh preamble, HMR websocket)', () => {
    const csp = directives(contentSecurityPolicy({ dev: true }));
    expect(csp['script-src']).toContain("'unsafe-inline'");
    expect(csp['connect-src']).toEqual(["'self'", 'ws:', 'wss:']);
  });

  it('allows Supabase origins when configured', () => {
    const csp = directives(
      contentSecurityPolicy({ dev: false, supabaseUrl: 'https://test-project.supabase.co' })
    );
    expect(csp['connect-src']).toContain('https://test-project.supabase.co');
    expect(csp['connect-src']).toContain('wss://test-project.supabase.co');
  });

  it('contains security headers in the service worker', () => {
    expect(sw).toContain("'Content-Security-Policy': CSP");
    expect(sw).toContain("'Cross-Origin-Opener-Policy': 'same-origin'");
    expect(sw).toContain("'Cross-Origin-Embedder-Policy': 'require-corp'");
  });
});
