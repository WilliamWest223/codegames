import { beforeAll, describe, expect, it } from 'vitest';
import type { PyodideInterface } from 'pyodide';
import { runJavaScript } from '../src/javascript';
import { runPython } from '../src/python';
import { MAX_TRACE_FRAMES, MAX_TRACE_STEPS } from '../src/types';
import { getPyodide } from './pyodide';

const lines = (r: { trace?: { line: number }[] }) => r.trace!.map((s) => s.line);
const varsAt = (r: { trace?: { vars: [string, string][] }[] }, i: number) => Object.fromEntries(r.trace![i]!.vars);

describe('step-through tracing', () => {
  let py: PyodideInterface;
  beforeAll(async () => {
    py = await getPyodide();
  }, 60_000);

  it('records lines and variables in Python, including inside functions', async () => {
    const code = 'def double(n):\n    return n * 2\n\ntotal = 0\nfor i in range(2):\n    total += double(i)\nprint(total)';
    const r = await runPython(py, code, { trace: true });
    expect(r.stdout).toBe('2\n');
    expect(lines(r)).toEqual([1, 4, 5, 6, 2, 5, 6, 2, 5, 7, -1]);
    expect(r.trace!.find((s) => s.scope === 'double')!.vars).toEqual([['n', '0']]);
    expect(varsAt(r, r.trace!.length - 1)).toEqual({ total: '2', i: '1' });
    // Output offsets let the visualizer show what had been printed at each step.
    expect(r.trace!.at(-1)!.out).toBe(2);
    expect(r.trace!.at(-2)!.out).toBe(0);
  });

  it('records lines and variables in JavaScript', () => {
    const code = 'function double(n) {\n  return n * 2;\n}\nlet total = 0;\nfor (let i = 0; i < 2; i++) {\n  total += double(i);\n}\nconsole.log(total);';
    const r = runJavaScript(code, { trace: true });
    expect(r.stdout).toBe('2\n');
    expect(lines(r)).toEqual([4, 5, 6, 2, 6, 2, 8, -1]);
    expect(r.trace!.find((s) => s.scope === 'double')!.vars).toContainEqual(['n', '0']);
    expect(varsAt(r, r.trace!.length - 1)).toEqual({ total: '2' });
  });

  it('quotes strings, skips functions, and stops recording at the cap without changing results', async () => {
    const js = runJavaScript('const name = "Ada";\nconsole.log(name);', { trace: true });
    expect(varsAt(js, 1)).toEqual({ name: "'Ada'" });
    const pyr = await runPython(py, 'name = "Ada"\nprint(name)', { trace: true });
    expect(varsAt(pyr, 1)).toEqual({ name: "'Ada'" });
  });

  it('stops a traced run at MAX_TRACE_STEPS instead of timing out (round-7 P1-1)', async () => {
    const started = Date.now();
    const js = runJavaScript('let x = 0;\nlet y = 0;\nwhile (x < 10) {\n  y++;\n}', { trace: true });
    expect(js.trace).toHaveLength(MAX_TRACE_STEPS);
    expect(js.traceTruncated).toBe(true);
    expect(js.error).toBeUndefined();
    const pyLoop = await runPython(py, 'while True:\n    pass', { trace: true });
    expect(pyLoop.trace).toHaveLength(MAX_TRACE_STEPS);
    expect(pyLoop.traceTruncated).toBe(true);
    expect(pyLoop.error).toBeUndefined();
    const pyLong = await runPython(py, 'total = 0\nfor i in range(300000):\n    total += i\nprint(total)', { trace: true });
    expect(pyLong.trace).toHaveLength(MAX_TRACE_STEPS);
    expect(pyLong.stdout).toBe('');
    expect(Date.now() - started).toBeLessThan(3000);
    // `except Exception` doesn't swallow the stop.
    const guarded = await runPython(py, 'while True:\n    try:\n        pass\n    except Exception:\n        pass', { trace: true });
    expect(guarded.traceTruncated).toBe(true);
    const jsGuarded = runJavaScript('while (true) {\n  try {\n    let a = 1;\n  } catch (e) {}\n}', { trace: true });
    expect(jsGuarded.traceTruncated).toBe(true);
    // Plain runs are untouched.
    expect(runJavaScript('let n = 0;\nwhile (n < 5000) {\n  n++;\n}\nconsole.log(n);').stdout).toBe('5000\n');
  });

  it('records a call stack with one frame per call, newest first (E2)', async () => {
    const pyr = await runPython(py, 'def fact(n):\n    if n <= 1:\n        return 1\n    return n * fact(n - 1)\n\nprint(fact(3))', { trace: true });
    expect(pyr.stdout).toBe('6\n');
    const deepest = pyr.trace!.reduce((a, b) => (b.depth > a.depth ? b : a));
    expect(deepest.depth).toBe(4);
    expect(deepest.stack.map((f) => f.name)).toEqual(['fact', 'fact', 'fact', '']);
    expect(deepest.stack.map((f) => Object.fromEntries(f.vars).n)).toEqual(['1', '2', '3', undefined]);
    expect(deepest.vars).toEqual(deepest.stack[0]!.vars);
    expect(deepest.scope).toBe('fact');
    expect(new Set(deepest.stack.map((f) => f.id)).size).toBe(4);
    const js = runJavaScript('function fact(n) {\n  if (n <= 1) {\n    return 1;\n  }\n  return n * fact(n - 1);\n}\nconsole.log(fact(3));', { trace: true });
    expect(js.stdout).toBe('6\n');
    const jsDeepest = js.trace!.reduce((a, b) => (b.depth > a.depth ? b : a));
    expect(jsDeepest.stack.map((f) => f.name)).toEqual(['fact', 'fact', 'fact', '']);
    expect(jsDeepest.stack.map((f) => Object.fromEntries(f.vars).n)).toEqual(['1', '2', '3', undefined]);
    // Frames are popped on return, also when a call throws.
    expect(js.trace!.at(-1)!.depth).toBe(1);
    const thrown = runJavaScript('function boom() {\n  throw new Error("x");\n}\ntry {\n  boom();\n} catch (e) {\n  let after = 1;\n}', { trace: true });
    expect(thrown.trace!.at(-1)!.depth).toBe(1);
  });

  it('caps the recorded stack for runaway recursion', async () => {
    const js = runJavaScript('function down(n) {\n  return down(n + 1);\n}\ndown(0);', { trace: true });
    expect(js.traceTruncated).toBe(true); // the step cap comes first
    const deep = js.trace!.at(-1)!;
    expect(deep.stack).toHaveLength(MAX_TRACE_FRAMES);
    expect(deep.depth).toBeGreaterThan(MAX_TRACE_FRAMES);
    const pyr = await runPython(py, 'def down(n):\n    return down(n + 1)\ndown(0)', { trace: true });
    expect(pyr.trace!.at(-1)!.stack.length).toBeLessThanOrEqual(MAX_TRACE_FRAMES);
  });

  it('shows closure variables and names arrow functions after their variable', () => {
    const js = runJavaScript('function counter() {\n  let count = 0;\n  return () => {\n    count++;\n    return count;\n  };\n}\nconst next = counter();\nnext();', { trace: true });
    const inner = js.trace!.find((s) => s.scope === 'next' || s.line === 4)!;
    expect(inner.stack.map((f) => f.name)).toEqual(['(anonymous)', '']);
    expect(Object.fromEntries(inner.vars)).toEqual({ count: '0' });
    const named = runJavaScript('const twice = (n) => {\n  return n * 2;\n};\ntwice(2);', { trace: true });
    expect(named.trace!.find((s) => s.line === 2)!.scope).toBe('twice');
  });

  it('never runs learner code while formatting variables (round-7 P1-2)', async () => {
    const getter = runJavaScript('const o = { get x() { console.log("side effect"); return 1; } };\nconsole.log("done");', { trace: true });
    expect(getter.stdout).toBe('done\n');
    expect(getter.error).toBeUndefined();
    expect(varsAt(getter, 1).o).toBe('{ x: [Getter] }');
    const proxy = runJavaScript('const p = new Proxy({ a: 1 }, { ownKeys() { console.log("trap"); return []; } });\nconsole.log("done");', { trace: true });
    expect(proxy.stdout).toBe('done\n');
    expect(varsAt(proxy, 1).p).toBe('{ a: 1 }');
    const repr = await runPython(
      py,
      'class Pet:\n    def __init__(self, name):\n        self.name = name\n    def __repr__(self):\n        print("REPR CALLED")\n        return "Pet(" + self.name + ")"\np = Pet("Rex")\nprint("done")',
      { trace: true },
    );
    expect(repr.stdout).toBe('done\n');
    expect(repr.trace!.find((s) => s.scope === 'Pet.__init__')!.vars).toContainEqual(['self', 'Pet object']);
    // The learner's __repr__ is never called while tracing (round-8 P1-4).
    expect(Object.fromEntries(repr.trace!.at(-1)!.vars).p).toBe('Pet object');
  });

  it('shows only names the learner declared (round-7 P2-1, P3)', async () => {
    // `name` is a real global in a Web Worker; here it stands in for any global.
    const js = runJavaScript('const names = ["a"];\nfor (const name of names) {\n  console.log(name);\n}\nconsole.log("end");', { trace: true });
    expect(Object.keys(varsAt(js, js.trace!.length - 2))).toEqual(['names']);
    const pyr = await runPython(py, 'input = 3\n_count = 2\nsquares = list(x * x for x in range(2))\nprint(input, _count)', { trace: true });
    expect(varsAt(pyr, pyr.trace!.length - 1)).toEqual({ input: '3', _count: '2', squares: '[0, 1]' });
    expect(pyr.trace!.flatMap((s) => s.vars.map(([n]) => n))).not.toContain('.0');
    const cls = await runPython(py, 'class Pet:\n    kind = "pet"\np = Pet()', { trace: true });
    expect(cls.trace!.find((s) => s.line === 2)!.scope).toBe('class Pet');
  });

  it('a Python crash does not end on a finished step (round-7 P3)', async () => {
    const crash = await runPython(py, 'a = 1\nb = 0\nprint(a / b)', { trace: true });
    expect(crash.error?.name).toBe('ZeroDivisionError');
    expect(lines(crash)).toEqual([1, 2, 3]);
    const handled = await runPython(py, 'try:\n    x = 1 / 0\nexcept ZeroDivisionError:\n    x = 0\nprint(x)', { trace: true });
    expect(handled.trace!.at(-1)!.line).toBe(-1);
  });

  it('instruments empty function bodies into valid code (round-8 P0-2)', () => {
    const forms: Record<string, string> = {
      'function declaration': 'function f() {}\nf();\nconsole.log("ok");',
      'function expression': 'const f = function () {};\nf();\nconsole.log("ok");',
      'arrow function': 'const f = () => {};\nf();\nconsole.log("ok");',
      constructor: 'class A {\n  constructor() {}\n}\nnew A();\nconsole.log("ok");',
      method: 'class A {\n  go() {}\n}\nnew A().go();\nconsole.log("ok");',
      'nested empty': 'function outer() {\n  const inner = () => {};\n  inner();\n}\nouter();\nconsole.log("ok");',
    };
    for (const [form, code] of Object.entries(forms)) {
      const r = runJavaScript(code, { trace: true });
      expect(r.error, form).toBeUndefined();
      expect(r.stdout, form).toBe('ok\n');
      expect(r.trace!.length, form).toBeGreaterThan(1);
    }
  });

  it('never calls a learner __repr__ or __str__ while tracing Python (round-8 P1-4)', async () => {
    const mutating = 'log = []\nclass Pet:\n    def __repr__(self):\n        log.append(1)\n        return "Pet!"\n    __str__ = __repr__\np = Pet()\npets = [p, p]\nprint(len(log))';
    const r = await runPython(py, mutating, { trace: true });
    expect(r.stdout).toBe('0\n');
    expect(varsAt(r, r.trace!.length - 1)).toMatchObject({ p: 'Pet object', pets: '[Pet object, Pet object]' });

    const reading = 'class Spy:\n    def __repr__(self):\n        return input()\ns = Spy()\nname = input()\nprint(name)';
    const r2 = await runPython(py, reading, { trace: true, stdin: 'Ada\n' });
    expect(r2.error).toBeUndefined();
    expect(r2.stdout).toBe('Ada\n');

    // Built-in values still read like repr; one that fails to format falls back without crashing.
    const plain = await runPython(py, 'a = [1, "x", (2,), {3: None}, set()]\nbig = 10 ** 5000\nprint("ok")', { trace: true });
    expect(plain.stdout).toBe('ok\n');
    expect(varsAt(plain, plain.trace!.length - 1)).toMatchObject({ a: "[1, 'x', (2,), {3: None}, set()]", big: 'int object' });
  });

  it('keeps the Python tracer out of the learner\'s globals (round-8 P1-5)', async () => {
    const r = await runPython(py, '_tstate = 5\n_ttracer = None\n_trace_rec = 1\nprint(sorted(k for k in globals() if k.startswith("_t")))', { trace: true });
    expect(r.error).toBeUndefined();
    expect(r.stdout).toBe("['_trace_rec', '_tstate', '_ttracer']\n");
    expect(r.trace!.length).toBeGreaterThan(3);
    expect(varsAt(r, r.trace!.length - 1)).toMatchObject({ _tstate: '5' });
  });

  it('cuts huge values while tracing instead of formatting them in full (round-8 P1-6)', async () => {
    const started = Date.now();
    const pyRun = await runPython(py, 'big = list(range(100000))\ntext = "x" * 5000\nfor i in range(200):\n    big[0] = i\nprint(len(big))', { trace: true });
    expect(pyRun.stdout).toBe('100000\n');
    const last = varsAt(pyRun, pyRun.trace!.length - 1);
    expect(last.big).toMatch(/^\[199, 1, 2/);
    expect(last.big!.length).toBeLessThanOrEqual(80);
    expect(last.text!.length).toBeLessThanOrEqual(80);

    const js = runJavaScript('const big = Array.from({ length: 100000 }, (_, i) => i);\nconst text = "x".repeat(5000);\nfor (let i = 0; i < 200; i++) {\n  big[0] = i;\n}\nconsole.log(big.length);', { trace: true });
    expect(js.stdout).toBe('100000\n');
    expect(varsAt(js, js.trace!.length - 1).big).toMatch(/^\[ 199, 1, 2/);
    // Formatting 100,000 items at each of ~600 steps would take far longer than this.
    expect(Date.now() - started).toBeLessThan(10_000);
  });

  it('a learner catch can not swallow the JavaScript step limit (round-8 P2)', () => {
    for (const code of ['let n = 0;\nfor (;;) try { n++; } catch {}', 'let n = 0;\nwhile (true)\n  try {\n    n++;\n  } catch (e) {\n    n--;\n  }', 'for (;;) {\n  try { JSON.parse("{"); } catch {}\n}']) {
      const started = Date.now();
      const r = runJavaScript(code, { trace: true });
      expect(r.traceTruncated, code).toBe(true);
      expect(r.error, code).toBeUndefined();
      expect(r.trace!.length, code).toBe(MAX_TRACE_STEPS);
      expect(Date.now() - started, code).toBeLessThan(2_000);
    }
    // Ordinary catch blocks still work.
    const ok = runJavaScript('try {\n  JSON.parse("{");\n} catch (e) {\n  console.log("caught");\n}', { trace: true });
    expect(ok.stdout).toBe('caught\n');
  });

  it('keeps error line numbers and leaves untraced runs alone', async () => {
    const js = runJavaScript('let a = 1;\nconsole.log(b);', { trace: true });
    expect(js.error?.line).toBe(2);
    expect(runJavaScript('console.log(1);').trace).toBeUndefined();
    const pyErr = await runPython(py, 'a = 1\nprint(b)', { trace: true });
    expect(pyErr.error?.line).toBe(2);
    // The tracer is removed afterwards: the next run isn't traced.
    expect((await runPython(py, 'print(1)')).trace).toBeUndefined();
  });
});
