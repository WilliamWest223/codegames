import { beforeAll, describe, expect, it } from 'vitest';
import type { PyodideInterface } from 'pyodide';
import { runJavaScript } from '../src/javascript';
import { runPython } from '../src/python';
import { getPyodide } from './pyodide';

/** Round-8 audit: learner code must not crash the tab, fake results or escape the sandbox. */
describe('JavaScript sandbox', () => {
  it('stops a memory bomb with a friendly MemoryError (P0-1)', () => {
    const r = runJavaScript('const a = []; for (;;) a.push(new Array(1e6).fill(1));');
    expect(r.error?.name).toBe('MemoryError');
    expect(r.error?.friendly).toMatch(/too much memory/);
  });

  it('counts other ways of growing arrays too', () => {
    for (const code of [
      'const a = []; for (;;) a.push(...Array.from({ length: 1e4 }, () => 0));',
      'let a = []; for (;;) a = a.concat(new Array(1e5));',
      'const a = []; for (;;) a.splice(a.length, 0, ...new Array(1e4));',
    ]) {
      expect(runJavaScript(code).error?.name, code).toBe('MemoryError');
    }
  });

  it('reports output overflow even when the program catches the error', () => {
    const r = runJavaScript('try { for (;;) console.log("spam spam spam"); } catch (e) {}\nconsole.log("after");', { maxOutput: 100 });
    expect(r.error?.name).toBe('OutputLimitError');
    expect(r.stdout.length).toBeLessThanOrEqual(100);
  });

  it('leaves normal array code and Array semantics alone', () => {
    const r = runJavaScript(
      'const a = new Array(3).fill(0); a.push(1); const b = Array(2); class Stack extends Array {}\nconst s = new Stack(); s.push(5);\nconsole.log(a, b.length, a instanceof Array, s instanceof Array, s.length, Array.isArray([]));',
    );
    expect(r.error).toBeUndefined();
    expect(r.stdout).toBe('[ 0, 0, 0, 1 ] 2 true true 1 true\n');
  });

  it('restores Array methods after the run', () => {
    const push = Array.prototype.push;
    runJavaScript('const a = []; for (;;) a.push(new Array(1e6));');
    expect(Array.prototype.push).toBe(push);
    const big: number[] = [];
    for (let i = 0; i < 20; i++) big.push(...new Array(1e6).fill(0).slice(0, 10));
    expect(big.length).toBe(200);
  });
});

describe('JavaScript global escapes (round-8 P1-1)', () => {
  const escapes = {
    'Function constructor': 'const g = Function("return this")(); console.log(typeof g.postMessage);',
    'constructor of constructor': 'const g = [].constructor.constructor("return globalThis")(); console.log(typeof g);',
    'arrow constructor': 'const g = (() => {}).constructor("return this")(); console.log(typeof g);',
    'async function constructor': 'const AsyncFn = (async () => {}).constructor; AsyncFn("return this"); console.log("escaped");',
    'generator constructor': 'const Gen = (function* () {}).constructor; Gen("yield this"); console.log("escaped");',
    'indirect eval': 'const g = (0, eval)("this"); console.log(typeof g);',
    'string timer': 'setTimeout("postMessage(1)", 0); console.log("escaped");',
  };
  for (const [name, code] of Object.entries(escapes)) {
    it(`blocks ${name}`, () => {
      const r = runJavaScript(code);
      expect(r.error?.name, name).toBe('SecurityError');
      expect(r.stdout, name).toBe('');
    });
  }

  it('keeps the guards up for promise callbacks, then restores them', async () => {
    await new Promise((resolve) => setTimeout(resolve, 5)); // let earlier runs finish restoring
    const before = (() => undefined).constructor;
    const g = globalThis as unknown as Record<string, unknown>;
    runJavaScript('Promise.resolve().then(() => { [].constructor.constructor("return globalThis")().LEAK = 1; }).catch(() => {});');
    await Promise.resolve();
    await Promise.resolve();
    expect(g.LEAK).toBeUndefined();
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect((() => undefined).constructor).toBe(before);
  });

  it('restores the constructors and eval after the run', async () => {
    await new Promise((resolve) => setTimeout(resolve, 5));
    const before = (() => undefined).constructor;
    runJavaScript('Function("return 1")');
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect((() => undefined).constructor).toBe(before);
    expect(typeof globalThis.eval('1')).toBe('number');
  });

  it('still lets learners use globalThis-free code, timers with functions, and classes', () => {
    const r = runJavaScript('class A { constructor() { this.x = 1; } }\nconsole.log(new A().x, typeof globalThis, typeof self, (() => 1) instanceof Function, typeof Function.prototype.call);');
    expect(r.error).toBeUndefined();
    expect(r.stdout).toBe('1 undefined undefined true function\n');
  });
});

describe('Python can not reach the browser (round-8 P1-1/P1-2)', () => {
  let py: PyodideInterface;
  beforeAll(async () => {
    py = await getPyodide();
  }, 60_000);

  for (const code of ['import js', 'import pyodide_js', 'from pyodide.ffi import to_js', 'import pyodide.code', 'from js import postMessage', 'import _pyodide']) {
    it(`blocks \`${code}\``, async () => {
      const r = await runPython(py, `${code}\nprint("escaped")`);
      expect(r.stdout).toBe('');
      expect(r.error?.name).toBe('ModuleNotFoundError');
      expect(r.error?.friendly).toMatch(/closed sandbox/);
    });
  }

  it('blocks imports inside the learner\'s own functions too', async () => {
    const r = await runPython(py, 'def sneaky():\n    import js\n    return js\nsneaky()');
    expect(r.error?.name).toBe('ModuleNotFoundError');
  });

  it('puts everything back after the run, and normal imports still work', async () => {
    const r = await runPython(py, 'import json, math\nprint(json.dumps([math.floor(2.5)]))');
    expect(r.error).toBeUndefined();
    expect(r.stdout).toBe('[2]\n');
    expect(py.runPython('import sys\nnot any(type(f).__name__ == "_BlockJs" or getattr(f, "__name__", "") == "_BlockJs" for f in sys.meta_path)')).toBe(true);
  });
});
