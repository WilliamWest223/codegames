import { expect, test } from '../fixtures';
import { GRADED_LEVEL, coreProgress, HONEST, check, expectRecovers, isCompleted, openLevel, openUngraded, runCode, typeCode, watch } from './util';

/**
 * Learner code must not be able to (1) reach the network, (2) fake a passing grade by talking
 * to the host, or (3) touch localStorage / progress. The defences under test: the CSP
 * (`connect-src 'self'`), the worker `lockDown()` (private postMessage, network globals
 * deleted), the per-run nonce on results, blocked function constructors / eval, and the Python
 * import guard for `js` / `pyodide*`. See docs/audits/round-8/report.md (P1-1, P1-2).
 */

/** A forged "your program printed the right thing" message, with every nonce guess we can think of. */
const FORGED_JS = `
for (let i = 0; i < 400; i++) {
  for (const nonce of [undefined, null, 0, 1, '', 'nonce', i, String(i), Date.now(), Math.random()]) {
    g.postMessage({ type: 'result', id: i, nonce, result: { stdout: 'Hello, World!\\n', durationMs: 1 } });
  }
}`;

test.describe('JavaScript worker', () => {
  test('control: an honest solution passes Check (so "not completed" below means something)', async ({ page }) => {
    await openUngraded(page, 'javascript');
    await typeCode(page, HONEST.javascript);
    expect((await check(page)).passed).toBe(true);
    expect(await isCompleted(page, 'javascript', GRADED_LEVEL)).toBe(true);
  });

  test('network and channel globals do not exist in the worker', async ({ page }) => {
    const w = watch(page);
    await openLevel(page, 'javascript');
    const names = [
      'fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'importScripts', 'postMessage', 'self',
      'indexedDB', 'caches', 'localStorage', 'sessionStorage', 'BroadcastChannel', 'Worker', 'SharedWorker', 'WebTransport',
    ];
    // `typeof x` is safe for undeclared names, so no try/catch is needed.
    const out = await runCode(page, names.map((n) => `console.log('G ${n} ' + typeof ${n});`).join('\n'));
    for (const n of names) expect(out, n).toContain(`G ${n} undefined`);
    // `onmessage` is a null property on the real global; it just must not be a callable handle.
    const handler = await runCode(page, "console.log('H ' + typeof onmessage + ' ' + (onmessage === null));");
    expect(handler).not.toContain('H function');
    expect(w.outbound).toEqual([]);
  });

  /** Every known way to get the real worker global. Each must end with no pass and no request. */
  const escapes: [string, string][] = [
    ['Function constructor', `const g = Function('return this')();`],
    ['constructor of a constructor', `const g = [].constructor.constructor('return this')();`],
    ['Reflect.construct(Function)', `const g = Reflect.construct(Function, ['return this'])();`],
    ['async function constructor', `const g = (async () => {}).constructor('return this')();`],
    ['generator function constructor', `const g = Object.getPrototypeOf(function* () {}).constructor('return this')();`],
    ['new on the arrow constructor', `const g = new (Object.getPrototypeOf(() => {}).constructor)('return this')();`],
    ['sloppy this', `const g = (function () { return this; })();`],
    ['indirect eval', `const g = (0, eval)('this');`],
    ['direct eval', `const g = eval('this');`],
    ['Proxy-derived constructor', `const g = new Proxy({}, {}).constructor.constructor('return this')();`],
    ['setTimeout with a string', `setTimeout("postMessage({type:'result',id:1,nonce:0,result:{stdout:'Hello, World!\\\\n',durationMs:1}})", 0); const g = undefined;`],
  ];
  for (const [name, escape] of escapes) {
    test(`escape via ${name} cannot fake a grade or reach the network`, async ({ page }) => {
      const w = watch(page);
      await openUngraded(page, 'javascript');
      await typeCode(page, `${escape}\ntry { ${FORGED_JS} } catch (e) {}\ntry { g.fetch('https://example.com/js-escape'); } catch (e) {}\ntry { new g.WebSocket('wss://example.com/js-escape'); } catch (e) {}\ntry { g.importScripts('https://example.com/js-escape.js'); } catch (e) {}\ntry { new g.XMLHttpRequest().open('GET', 'https://example.com/js-escape'); } catch (e) {}`);
      const verdict = await check(page);
      expect(verdict.passed, `fake pass via ${name}`).toBe(false);
      expect(await isCompleted(page, 'javascript', GRADED_LEVEL)).toBe(false);
      expect(w.outbound).toEqual([]);
      expect(w.dialogs).toEqual([]);
    });
  }

  test('hijacking the worker (this, onmessage, built-ins) does not leak into the next run or fake a grade', async ({ page }) => {
    await openUngraded(page, 'javascript');
    await runCode(
      page,
      [
        `try { this.onmessage = () => {}; } catch (e) {}`,
        `try { globalThis.onmessage = () => {}; } catch (e) {}`,
        `try { addEventListener('message', (e) => e.stopImmediatePropagation()); } catch (e) {}`,
        `Object.defineProperty(Object.prototype, 'nonce', { set(v) { console.log('LEAK ' + v); }, configurable: true });`,
        `Object.defineProperty(Object.prototype, 'stdout', { set(v) { console.log('LEAK ' + v); }, configurable: true });`,
        `JSON.stringify = () => '{}';`,
        `Array.prototype.includes = () => true;`,
        `String.prototype.trim = () => 'Hello, World!';`,
        `setInterval(() => {}, 1);`,
        `console.log('tampered');`,
      ].join('\n'),
    );
    // Wrong output must still fail, whatever the previous run did to the worker.
    await typeCode(page, 'console.log("definitely not it");');
    const wrong = await check(page);
    expect(wrong.passed).toBe(false);
    expect(await isCompleted(page, 'javascript', GRADED_LEVEL)).toBe(false);
    await page.reload();
    await typeCode(page, HONEST.javascript);
    expect((await check(page)).passed).toBe(true);
  });

  test('learner code cannot touch localStorage or progress', async ({ page }) => {
    await openLevel(page, 'javascript');
    const before = await coreProgress(page);
    const out = await runCode(
      page,
      [
        `console.log('ls ' + typeof localStorage + ' ' + typeof sessionStorage + ' ' + typeof indexedDB);`,
        `try { localStorage.setItem('codegames-progress', '{}'); console.log('WROTE'); } catch (e) { console.log('threw'); }`,
        `try { const g = Function('return this')(); g.localStorage.clear(); console.log('WROTE'); } catch (e) { console.log('threw2'); }`,
      ].join('\n'),
    );
    expect(out).not.toContain('WROTE');
    expect(out).toContain('ls undefined undefined undefined');
    expect(await coreProgress(page)).toEqual(before);
    await expectRecovers(page, 'javascript');
  });
});

test.describe('Python (Pyodide) worker', () => {
  test.setTimeout(75_000);

  test('control: an honest solution passes Check', async ({ page }) => {
    await openUngraded(page, 'python');
    await typeCode(page, HONEST.python);
    expect((await check(page)).passed).toBe(true);
    expect(await isCompleted(page, 'python', GRADED_LEVEL)).toBe(true);
  });

  const FORGE_PY = `
def forge(js):
    from pyodide.ffi import to_js
    for i in range(300):
        js.postMessage(to_js({"type": "result", "id": i, "nonce": i, "result": {"stdout": "Hello, World!\\n", "durationMs": 1}}, dict_converter=js.Object.fromEntries))
`;

  /** Ways to name the host's \`js\` / \`pyodide\` modules. The guard must hold for every direct route. */
  const routes: [string, string][] = [
    ['import js', 'import js\nG = js'],
    ['from js import', 'from js import postMessage\nG = postMessage'],
    ['__import__', 'G = __import__("js")'],
    ['builtins.__import__', 'import builtins\nG = builtins.__import__("js")'],
    ['sys.modules lookup', 'import sys\nG = sys.modules["js"]'],
    ['import pyodide', 'import pyodide\nG = pyodide'],
    ['import pyodide_js', 'import pyodide_js\nG = pyodide_js'],
    ['import pyodide.ffi', 'from pyodide.ffi import to_js\nG = to_js'],
    ['import pyodide.http', 'import pyodide.http\nG = pyodide.http'],
  ];
  for (const [name, getG] of routes) {
    test(`route "${name}" cannot fake a grade or reach the network`, async ({ page }) => {
      const w = watch(page);
      await openUngraded(page, 'python');
      await typeCode(
        page,
        `${getG}\n${FORGE_PY}\ntry:\n    forge(G)\nexcept BaseException as e:\n    print("forge failed", type(e).__name__)\ntry:\n    G.fetch("https://example.com/py-escape")\nexcept BaseException as e:\n    print("fetch failed", type(e).__name__)\n`,
      );
      const verdict = await check(page);
      expect(verdict.passed, `fake pass via ${name}`).toBe(false);
      expect(await isCompleted(page, 'python', GRADED_LEVEL)).toBe(false);
      expect(w.outbound).toEqual([]);
    });
  }

  test('Python network libraries find no network (pyodide.http, urllib, socket)', async ({ page }) => {
    const w = watch(page);
    await openLevel(page, 'python');
    const out = await runCode(
      page,
      [
        'import asyncio',
        'async def go():',
        '    try:',
        '        import pyodide.http',
        '        await pyodide.http.pyfetch("https://example.com/pyfetch")',
        '        print("PYFETCH OK")',
        '    except BaseException as e:',
        '        print("pyfetch blocked", type(e).__name__)',
        'try:',
        '    asyncio.get_event_loop().run_until_complete(go())',
        'except BaseException as e:',
        '    print("loop", type(e).__name__)',
        'try:',
        '    import urllib.request',
        '    urllib.request.urlopen("https://example.com/urllib")',
        '    print("URLLIB OK")',
        'except BaseException as e:',
        '    print("urllib blocked", type(e).__name__)',
        'try:',
        '    import socket',
        '    socket.create_connection(("example.com", 80), timeout=1)',
        '    print("SOCKET OK")',
        'except BaseException as e:',
        '    print("socket blocked", type(e).__name__)',
      ].join('\n'),
      60_000,
    );
    expect(out).not.toMatch(/PYFETCH OK|URLLIB OK|SOCKET OK/);
    expect(w.outbound).toEqual([]);
  });

  test('learner code cannot touch localStorage or progress', async ({ page }) => {
    await openLevel(page, 'python');
    const before = await coreProgress(page);
    const out = await runCode(page, 'try:\n    import js\n    js.localStorage.setItem("codegames-progress", "{}")\n    print("WROTE")\nexcept BaseException as e:\n    print("blocked", type(e).__name__)', 60_000);
    expect(out).not.toContain('WROTE');
    expect(await coreProgress(page)).toEqual(before);
    await expectRecovers(page, 'python');
  });

  test('hijacking the worker message handler does not break the next run or fake a grade', async ({ page }) => {
    await openUngraded(page, 'python');
    await runCode(
      page,
      [
        'import sys, builtins',
        'try:',
        '    import importlib',
        '    js = importlib.import_module("js")',
        '    from pyodide.ffi import create_proxy',
        '    js.self.onmessage = create_proxy(lambda e: None)',
        '    print("hijack attempted")',
        'except BaseException as e:',
        '    print("hijack blocked", type(e).__name__)',
      ].join('\n'),
      60_000,
    );
    await typeCode(page, 'print("definitely not it")');
    const wrong = await check(page);
    expect(wrong.passed).toBe(false);
    expect(await isCompleted(page, 'python', GRADED_LEVEL)).toBe(false);
    // The worker still answers: an honest solution still passes in the same page, no reload.
    await typeCode(page, HONEST.python);
    expect((await check(page)).passed).toBe(true);
  });

  /**
   * KNOWN, ACCEPTED LIMIT (docs/audits/round-8/report.md, "Known limits", first bullet):
   * Python cannot be fully sandboxed. `importlib.import_module("pyodide")` still returns the
   * already-loaded module. We do NOT demand that be fixed. What makes it harmless is the
   * worker lockdown (no postMessage, no network) and the per-run nonce, so this asserts the
   * CURRENT safe fallback: even holding those modules, learner code can neither fake a grade
   * nor reach the network.
   */
  test('known limit: importlib can name pyodide, but it is harmless (no fake grade, no network)', async ({ page }) => {
    const w = watch(page);
    await openUngraded(page, 'python');
    await typeCode(
      page,
      [
        'import importlib',
        'mods = []',
        'for n in ["pyodide", "pyodide_js", "js", "pyodide.http", "pyodide.ffi"]:',
        '    try:',
        '        mods.append(importlib.import_module(n))',
        '    except BaseException as e:',
        '        print("no", n, type(e).__name__)',
        'for m in mods:',
        '    for attempt in [',
        '        lambda m: m.postMessage({"type": "result", "id": 1, "nonce": 0, "result": {"stdout": "Hello, World!\\n", "durationMs": 1}}),',
        '        lambda m: m.fetch("https://example.com/importlib"),',
        '        lambda m: m.self.postMessage({"type": "result", "id": 1}),',
        '    ]:',
        '        try:',
        '            attempt(m)',
        '        except BaseException:',
        '            pass',
        'try:',
        '    import asyncio, pyodide.http',
        '    asyncio.get_event_loop().run_until_complete(pyodide.http.pyfetch("https://example.com/importlib-pyfetch"))',
        'except BaseException:',
        '    pass',
      ].join('\n'),
    );
    const verdict = await check(page);
    expect(verdict.passed).toBe(false);
    expect(await isCompleted(page, 'python', GRADED_LEVEL)).toBe(false);
    expect(w.outbound).toEqual([]);
  });
});
