import { beforeAll, describe, expect, it } from 'vitest';
import type { PyodideInterface } from 'pyodide';
import { runJavaScript } from '../src/javascript';
import { runPython } from '../src/python';
import { codeSpan, explainError } from '../src/errors';
import { getPyodide } from './pyodide';

/** Spec E3 (docs/specs/region5-and-security.md): every row, with the messages the executors really produce. */
describe('Region 5 error explanations (E3)', () => {
  let py: PyodideInterface;
  beforeAll(async () => {
    py = await getPyodide();
  }, 60_000);
  const pyError = async (code: string) => (await runPython(py, code)).error!;
  const jsError = (code: string) => runJavaScript(code).error!;

  it('runaway recursion points at the base case', async () => {
    const p = await pyError('def count(n):\n    return count(n - 2)\ncount(5)');
    expect(p.message).toMatch(/maximum recursion depth exceeded/);
    expect(p.friendly).toMatch(/never reached a \*\*base case\*\*.*`<= 1`/);
    const j = jsError('function count(n) {\n  return count(n - 2);\n}\ncount(5);');
    expect(j.message).toMatch(/Maximum call stack size exceeded/);
    expect(j.friendly).toMatch(/base case.*filled the call stack/);
  });

  it('sorting records without a key', async () => {
    const p = await pyError('items = [{"hp": 2}, {"hp": 1}]\nprint(sorted(items))');
    expect(p.message).toMatch(/'<' not supported between instances of 'dict' and 'dict'/);
    expect(p.friendly).toBe("Python can't put two `dict`s in order by itself. Tell `sorted` what to compare: `sorted(items, key=lambda x: x[\"hp\"])`.");
  });

  it('key=f() and .sort(f()) call the function instead of passing it', async () => {
    const p = await pyError('def hp_of(p):\n    return p["hp"]\nitems = [{"hp": 2}]\nprint(sorted(items, key=hp_of()))');
    expect(p.message).toMatch(/^hp_of\(\) missing 1 required positional argument/);
    expect(p.friendly).toBe('You **called** `hp_of()` with empty brackets where a function was expected. Pass the function itself: `key=hp_of`.');
    // Without key=, the usual missing-argument advice stays.
    expect((await pyError('def hp_of(p):\n    return p\nhp_of()')).friendly).toMatch(/needs a value for/);
    const j = jsError('function byPoints(a, b) {\n  return a.points - b.points;\n}\nconst xs = [{ points: 1 }, { points: 2 }];\nconsole.log([...xs].sort(byPoints()));');
    expect(j.message).toMatch(/Cannot read properties of undefined/);
    expect(j.friendly).toBe('You called the function inside `.sort( )`. Pass the function itself, without brackets: `.sort(byPoints)`.');
  });

  it('a closure changing an outer variable needs nonlocal', async () => {
    const p = await pyError('def make_counter():\n    count = 0\n    def inc():\n        count += 1\n        return count\n    return inc\nc = make_counter()\nc()');
    expect(p.message).toMatch(/cannot access local variable 'count'/);
    expect(p.friendly).toMatch(/put `nonlocal count` as the first line of the inner function/);
    // A module-level variable keeps the parameter advice.
    expect((await pyError('score = 0\ndef add():\n    score += 1\nadd()')).friendly).toMatch(/parameter/);
  });

  it('super() in constructors', async () => {
    const j = jsError('class Pet {\n  constructor(name) {\n    this.name = name;\n  }\n}\nclass Dog extends Pet {\n  constructor(name) {\n    this.tricks = [];\n  }\n}\nnew Dog("Rex");');
    expect(j.message).toMatch(/Must call super constructor in derived class before accessing 'this'/);
    expect(j.friendly).toBe("A subclass constructor must call `super(...)` (the parent's constructor) before it uses `this`.");
    const p = await pyError(
      'class Pet:\n    def __init__(self, name):\n        self.name = name\nclass Dog(Pet):\n    def __init__(self, name):\n        self.tricks = []\nd = Dog("Rex")\nprint(d.name)',
    );
    expect(p.message).toMatch(/'Dog' object has no attribute 'name'/);
    expect(p.friendly).toBe("`Dog` has its own `__init__`, which replaces the parent's. Call `super().__init__(...)` first so the parent sets `name`.");
  });

  it('storing a function result in a command table', async () => {
    const p = await pyError('def move():\n    print("moved")\nactions = {"M": move()}\nactions["M"]()');
    expect(p.message).toMatch(/'NoneType' object is not callable/);
    expect(p.friendly).toMatch(/store a function's \*\*result\*\* \(`move\(\)`\) where you meant the function itself \(`move`\)/);
    const j = jsError('function move() {\n  return 1;\n}\nconst actions = { M: move() };\nconst letter = "M";\nactions[letter]();');
    expect(j.message).toMatch(/is not a function/);
    expect(j.friendly).toBe('The table holds `undefined` there. Did you store `move()` (its result) instead of `move`, or is the key missing from the table?');
  });

  it('a method taken off its object loses this', () => {
    const j = jsError(
      'class Board {\n  constructor() {\n    this.grid = [[0]];\n  }\n  reveal(r, c) {\n    return this.grid[r][c];\n  }\n}\nconst board = new Board();\nconst actions = { reveal: board.reveal };\nactions.reveal(0, 0);',
    );
    expect(j.message).toMatch(/Cannot read properties of undefined \(reading '0'\)/);
    expect(j.friendly).toBe('A method taken off its object (`board.reveal`) forgets its `this`. Wrap it: `(r, c) => board.reveal(r, c)`.');
  });

  it('character codes, binary and lazy map objects', async () => {
    expect((await pyError('ord("hello")')).friendly).toMatch(/exactly \*\*one\*\* character/);
    expect((await pyError('ord(65)')).friendly).toMatch(/chr\(n\)/);
    expect((await pyError('chr(-1)')).friendly).toMatch(/0 to 1114111/);
    const bin = await pyError('int("102", 2)');
    expect(bin.message).toMatch(/invalid literal for int\(\) with base 2/);
    expect(bin.friendly).toBe('In base 2 only the digits 0 and 1 are allowed.');
    const m = await pyError('doubled = map(lambda x: x * 2, [1, 2])\nprint(doubled[0])');
    expect(m.message).toBe("'map' object is not subscriptable");
    expect(m.friendly).toMatch(/lazy object, not a list. Wrap it in `list\(...\)`/);
    // The class-object rule still answers for the learner's own classes.
    expect((await pyError('class Pet:\n    pass\nprint(Pet()["name"])')).friendly).toMatch(/read its data with a dot/);
  });
});

describe('learner text in explanations can not inject HTML (round-8 P2)', () => {
  it('wraps it in a code span whose fence can not be closed from inside', () => {
    expect(codeSpan('<img src=x onerror=alert(1)>')).toBe('`<img src=x onerror=alert(1)>`');
    expect(codeSpan('a`b')).toBe('``a`b``');
    expect(codeSpan('`x')).toBe('`` `x ``');
  });

  it('keeps a hostile key or int() text inside code', () => {
    const key = explainError('KeyError', "'<img src=x onerror=alert(1)>'", 'python');
    expect(key).toContain('`\'<img src=x onerror=alert(1)>\'`');
    const int = explainError('ValueError', "invalid literal for int() with base 10: '<b>hi</b>`'", 'python');
    expect(int).toContain('``"<b>hi</b>`"``');
  });
});
