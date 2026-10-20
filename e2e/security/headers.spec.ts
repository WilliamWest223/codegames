import { expect, test } from '../fixtures';
import { openLevel, runCode } from './util';

/**
 * The production Content-Security-Policy, written out in full on purpose: a change to
 * `contentSecurityPolicy()` in apps/web/vite.config.ts (and public/sw.js) must be a deliberate
 * edit here too. `connect-src 'self'` is what keeps learner code off the network.
 */
const EXPECTED_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

test('the CSP header on the document is exactly the expected policy', async ({ page }) => {
  const res = await page.goto('/');
  expect(res?.headers()['content-security-policy']).toBe(EXPECTED_CSP);
});

test('the meta CSP fallback equals the header', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveAttribute('content', EXPECTED_CSP);
  // It must come first in <head>, so it governs every tag after it.
  const firstMeta = await page.evaluate(() => document.head.firstElementChild?.getAttribute('http-equiv'));
  expect(firstMeta).toBe('Content-Security-Policy');
});

test('COOP and COEP are set and the page is cross-origin isolated', async ({ page }) => {
  const res = await page.goto('/');
  const headers = res!.headers();
  expect(headers['cross-origin-opener-policy']).toBe('same-origin');
  expect(headers['cross-origin-embedder-policy']).toBe('require-corp');
  expect(await page.evaluate(() => crossOriginIsolated)).toBe(true);
  // SharedArrayBuffer is what lets Python be interrupted in place.
  expect(await page.evaluate(() => typeof SharedArrayBuffer)).toBe('function');
});

test('the page itself cannot reach another origin (connect-src is enforced)', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const violations: string[] = [];
    document.addEventListener('securitypolicyviolation', (e) => violations.push(e.violatedDirective));
    let outcome = 'reached';
    try {
      await fetch('https://example.com/csp-probe');
    } catch {
      outcome = 'blocked';
    }
    await new Promise((r) => setTimeout(r, 100));
    return { outcome, violations };
  });
  expect(result.outcome).toBe('blocked');
  expect(result.violations.some((v) => v.startsWith('connect-src'))).toBe(true);
});

test('documents, scripts and both worker scripts carry the CSP (also through the service worker)', async ({ page }) => {
  await page.goto('/');
  // The service worker registers on load; once it controls the page, every response is served by it.
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  const seen: { url: string; type: string; csp: string | undefined }[] = [];
  page.on('response', (r) => {
    const type = r.request().resourceType();
    // A 304 revalidation carries no headers of its own; the browser keeps the cached 200's.
    if (r.status() === 200 && (type === 'document' || type === 'script')) seen.push({ url: r.url(), type, csp: r.headers()['content-security-policy'] });
  });
  await openLevel(page, 'javascript');
  await runCode(page, 'console.log(1)');
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  expect(seen.length).toBeGreaterThan(3);
  expect(seen.some((s) => /js\.worker/.test(s.url)), 'the JS worker script was fetched').toBe(true);
  for (const s of seen) expect(s.csp, `${s.type} ${s.url}`).toBe(EXPECTED_CSP);
});

test('the Python worker script and Pyodide runtime also carry the CSP', async ({ page }) => {
  test.setTimeout(60_000);
  const seen: { url: string; csp: string | undefined }[] = [];
  page.on('response', (r) => {
    const type = r.request().resourceType();
    if (r.status() === 200 && (type === 'document' || type === 'script') && r.url().startsWith('http://localhost:4173')) seen.push({ url: r.url(), csp: r.headers()['content-security-policy'] });
  });
  await openLevel(page, 'python');
  await runCode(page, 'print(1)', 50_000);
  expect(seen.some((s) => /py.*worker|pyodide/i.test(s.url)), 'the Python worker script was fetched').toBe(true);
  for (const s of seen) expect(s.csp, s.url).toBe(EXPECTED_CSP);
});
