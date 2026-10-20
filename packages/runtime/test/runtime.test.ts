import { beforeAll, describe, expect, it } from 'vitest';
import type { PyodideInterface } from 'pyodide';
import { normalizeOutput, outputsMatch } from '../src';
import { runJavaScript } from '../src/javascript';
import { runPython } from '../src/python';
import { getPyodide } from './pyodide';

const grid = { rows: ['#####', '#>.G#', '#####'] };

describe('runJavaScript', () => {
  it('captures console.log with Node-style formatting', () => {
    const r = runJavaScript('console.log("hi", 3, [1, "a"], { x: true });');
    expect(r.error).toBeUndefined();
    expect(r.stdout).toBe("hi 3 [ 1, 'a' ] { x: true }\n");
  });

  it('reports runtime errors with the learner line number', () => {
    const r = runJavaScript('let a = 1;\nconsole.log(b);');
    expect(r.error?.name).toBe('ReferenceError');
    expect(r.error?.line).toBe(2);
    expect(r.error?.friendly).toMatch(/spelling/);
  });

  it('runs in strict mode so undeclared variables are errors', () => {
    expect(runJavaScript('x = 5;').error?.name).toBe('ReferenceError');
  });

  it('reports syntax errors', () => {
    expect(runJavaScript('console.log("oops"').error?.kind).toBe('syntax');
  });

  it('reads stdin through prompt()', () => {
    const r = runJavaScript('const a = prompt(); const b = prompt(); console.log(Number(a) + Number(b));', { stdin: '2\n3\n' });
    expect(r.stdout).toBe('5\n');
  });

  it('stops runaway output', () => {
    expect(runJavaScript('while (true) console.log("x");').error?.kind).toBe('output-limit');
  });

  it('drives the robot', () => {
    const r = runJavaScript('move(); move(); collect();', { grid });
    expect(r.grid?.success).toBe(true);
    expect(r.grid?.actions).toHaveLength(3);
  });

  it('explains wall bumps', () => {
    const r = runJavaScript('move(); move(); move();', { grid });
    expect(r.error?.kind).toBe('robot');
    expect(r.grid?.success).toBe(false);
  });

  it('stops infinite robot loops', () => {
    const r = runJavaScript('while (true) { turnLeft(); }', { grid });
    expect(r.error?.message).toMatch(/energy/);
  });
});

describe('runPython', () => {
  let py: PyodideInterface;
  beforeAll(async () => {
    py = await getPyodide();
  }, 60_000);

  it('captures print output', async () => {
    const r = await runPython(py, 'print("hi", 3)\nprint([1, "a"])');
    expect(r.error).toBeUndefined();
    expect(r.stdout).toBe("hi 3\n[1, 'a']\n");
  });

  it('gives each run fresh globals', async () => {
    await runPython(py, 'leak = 1');
    const r = await runPython(py, 'print(leak)');
    expect(r.error?.name).toBe('NameError');
  });

  it('reports errors with line numbers and explanations', async () => {
    const r = await runPython(py, 'a = 1\nprint(b)');
    expect(r.error).toMatchObject({ name: 'NameError', line: 2, kind: 'runtime' });
    expect(r.error?.friendly).toMatch(/doesn't know/);
  });

  it('reports syntax errors', async () => {
    const r = await runPython(py, 'if True\n  print(1)');
    expect(r.error?.kind).toBe('syntax');
    expect(r.error?.line).toBe(1);
  });

  it('reads stdin through input()', async () => {
    const r = await runPython(py, 'a = int(input())\nb = int(input())\nprint(a + b)', { stdin: '2\n3' });
    expect(r.stdout).toBe('5\n');
  });

  it('raises EOFError when input runs out', async () => {
    const r = await runPython(py, 'input()');
    expect(r.error?.name).toBe('EOFError');
  });

  it('stops runaway output', async () => {
    const r = await runPython(py, 'while True:\n    print("x")');
    expect(r.error?.kind).toBe('output-limit');
  });

  it('drives the robot', async () => {
    const r = await runPython(py, 'move()\nmove()\ncollect()', { grid });
    expect(r.error).toBeUndefined();
    expect(r.grid?.success).toBe(true);
  });

  it('explains wall bumps', async () => {
    const r = await runPython(py, 'move()\nmove()\nmove()', { grid });
    expect(r.error).toMatchObject({ kind: 'robot', line: 3 });
    expect(r.error?.message).toMatch(/Bonk/);
  });

  it('robot sensors return Python booleans', async () => {
    const r = await runPython(py, 'while not is_blocked():\n    move()\nprint(type(on_gem()).__name__)\ncollect()', { grid });
    expect(r.stdout).toBe('bool\n');
    expect(r.grid?.success).toBe(true);
  });
});

describe('output comparison', () => {
  it('ignores trailing whitespace and final newlines', () => {
    expect(outputsMatch('a  \nb\n\n', 'a\nb')).toBe(true);
    expect(normalizeOutput('x\r\ny')).toBe('x\ny');
  });
});

describe('requirements', () => {
  it('ignores keywords that only appear in comments', async () => {
    const { checkRequirements } = await import('../src');
    const req = [{ pattern: 'for\\s', message: 'use for' }];
    expect(checkRequirements('# for later\nprint(1)', req, 'python')).toEqual(['use for']);
    expect(checkRequirements('// for later\nconsole.log(1);', req, 'javascript')).toEqual(['use for']);
    expect(checkRequirements('for i in range(3):\n    print("#")', req, 'python')).toEqual([]);
  });

  it('ignores words inside string literals but keeps string-syntax patterns', async () => {
    const { checkRequirements } = await import('../src');
    const len = [{ pattern: 'len\\(', message: 'use len' }];
    expect(checkRequirements('x = \"\"\"len(\"\"\"', len, 'python')).toEqual(['use len']);
    expect(checkRequirements('print(len("abc"))', len, 'python')).toEqual([]);
    expect(checkRequirements('print("sorted(x)")', [{ pattern: 'sorted\\(', forbid: true, message: 'no sort' }], 'python')).toEqual([]);
    expect(checkRequirements('name = "Ada"\nprint(f"Hi {name}")', [{ pattern: 'f"', message: 'f-string' }], 'python')).toEqual([]);
    expect(checkRequirements('const s = "x";', [{ pattern: '`', message: 'template' }], 'javascript')).toEqual(['template']);
    expect(checkRequirements('x = "open4sesame"', [{ pattern: 'open4sesame', forbid: true, message: 'no password' }], 'python')).toEqual(['no password']);
  });

  it('keeps comment markers inside strings', async () => {
    const { stripComments } = await import('../src');
    expect(stripComments('print("#") # note', 'python')).toBe('print("#") ');
    expect(stripComments('console.log("//"); // note', 'javascript')).toBe('console.log("//"); ');
  });
});

describe('round-1 audit fixes', () => {
  let py: PyodideInterface;
  beforeAll(async () => {
    py = await getPyodide();
  }, 60_000);

  it('Python input("prompt") does not echo the prompt into the output', async () => {
    const r = await runPython(py, 'name = input("What is your name? ")\nprint(f"Hello, {name}!")', { stdin: 'Ada' });
    expect(r.stdout).toBe('Hello, Ada!\n');
  });

  it('learner code cannot break later Python runs by patching builtins or streams', async () => {
    await runPython(py, 'import builtins, sys\nbuiltins.print = lambda *a: None\nsys.setrecursionlimit(50)');
    const r = await runPython(py, 'print("still works")');
    expect(r.stdout).toBe('still works\n');
  });

  it('Python warnings go to stderr, not graded output', async () => {
    const r = await runPython(py, 'import warnings\nwarnings.warn("careful")\nprint("ok")');
    expect(r.stdout).toBe('ok\n');
    expect(r.stderr).toMatch(/careful/);
  });

  it('JS console.error goes to stderr', () => {
    const r = runJavaScript('console.error("oops"); console.log("ok");');
    expect(r.stdout).toBe('ok\n');
    expect(r.stderr).toBe('oops\n');
  });

  it('JS prompt() errors clearly when input runs out', () => {
    const r = runJavaScript('while (true) { const x = prompt(); }', { stdin: '1\n2' });
    expect(r.error).toMatchObject({ name: 'InputError', kind: 'runtime' });
    expect(r.error?.friendly).toMatch(/prompt\(\)/);
  });

  it('JS syntax errors report a line number', () => {
    const r = runJavaScript('let a = 1;\nconsole.log("oops);\n');
    expect(r.error).toMatchObject({ kind: 'syntax', line: 2 });
  });

  it('JS errors get JavaScript explanations, not Python ones', () => {
    const r = runJavaScript('console.Log("x");');
    expect(r.error?.friendly).toMatch(/console\.log/);
    expect(r.error?.friendly).not.toMatch(/int\(\)|Python/);
    expect(runJavaScript('if (true {').error?.friendly).not.toMatch(/Python/);
  });

  it('robot actions carry the learner line number in both languages', async () => {
    const js = runJavaScript('move();\n\nmove();\ncollect();', { grid });
    expect(js.grid?.actions.map((a) => a.line)).toEqual([1, 3, 4]);
    const p = await runPython(py, 'def go():\n    move()\n\ngo()\nmove()\ncollect()', { grid });
    expect(p.grid?.actions.map((a) => a.line)).toEqual([2, 5, 6]);
  });
});

describe('round-1 student fixes', () => {
  it('lint spots commands without brackets and uncalled definitions', async () => {
    const { lintCode } = await import('../src');
    expect(lintCode('move()\nturn_left\ncollect()', 'python').join()).toMatch(/turn_left.*brackets/);
    expect(lintCode('turnLeft;\n', 'javascript').join()).toMatch(/turnLeft.*brackets/);
    expect(lintCode('while not is_blocked:\n    move()', 'python').join()).toMatch(/condition/);
    expect(lintCode('if (onGem) { collect(); }', 'javascript').join()).toMatch(/condition/);
    expect(lintCode('def turn_right():\n    turn_left()\nmove()', 'python').join()).toMatch(/never called/);
    expect(lintCode('def turn_right():\n    turn_left()\nturn_right()\nmove()', 'python')).toEqual([]);
    expect(lintCode('while (!isBlocked()) { move(); }', 'javascript')).toEqual([]);
  });

  it('missing quotes get a quotes hint', async () => {
    const { explainError } = await import('../src');
    expect(explainError('NameError', "name 'Ari' is not defined", 'python')).toMatch(/quotes/);
    expect(explainError('ReferenceError', 'Ari is not defined', 'javascript')).toMatch(/quotes/);
  });
});

describe('round-2 developer fixes', () => {
  let py: PyodideInterface;
  beforeAll(async () => {
    py = await getPyodide();
  }, 60_000);

  it('restores stdlib module state between Python runs', async () => {
    await runPython(py, 'import math, random\nmath.pi = 3\nrandom.seed(1)\nimport __main__\n__main__.x = 1');
    const r = await runPython(py, 'import math\nprint(math.pi > 3.14)');
    expect(r.stdout).toBe('True\n');
  });

  it('explains Region 3 errors precisely (round 4)', async () => {
    const onePath = await runPython(py, 'def f():\n    try:\n        x = int("a")\n    except ValueError:\n        print("bad")\n    return x\nf()');
    expect(onePath.error?.friendly).toMatch(/only gets a value on some paths/);
    const outer = await runPython(py, 'score = 0\ndef add():\n    score += 1\nadd()');
    expect(outer.error?.friendly).toMatch(/parameter/);
    expect((await runPython(py, 'nums = [1, 2]\nfor i in range(nums):\n    print(i)')).error?.friendly).toMatch(/range\(len/);
    expect((await runPython(py, 'nums = [1, 2]\nprint(nums[4 / 2])')).error?.friendly).toMatch(/\/\//);
    expect((await runPython(py, 'sum = 0\nprint(sum([1]))')).error?.friendly).toMatch(/reuse the name/);
    const raised = await runPython(py, 'def average(nums):\n    if not nums:\n        raise ValueError("no numbers")\naverage([])');
    expect(raised.error?.friendly).toMatch(/on purpose/);
    expect((await runPython(py, 'int("hello")')).error?.friendly).not.toMatch(/on purpose/);
    const thrown = runJavaScript('function average(nums) {\n  if (nums.length === 0) {\n    throw new Error("no numbers");\n  }\n}\naverage([]);');
    expect(thrown.error?.friendly).toMatch(/on purpose/);
  });

  it('explains character-code errors (security side quest)', async () => {
    const f = async (code: string) => (await runPython(py, code)).error?.friendly ?? '';
    expect(await f('ord("hello")')).toMatch(/exactly \*\*one\*\* character/);
    expect(await f('ord(65)')).toMatch(/chr\(n\)/);
    expect(await f('chr(-1)')).toMatch(/0 to 1114111/);
  });

  it('explains Region 4 errors (dicts, sets, classes)', async () => {
    const f = async (code: string) => (await runPython(py, code)).error?.friendly ?? '';
    expect(await f('d = {}\nd["a"] += 1')).toMatch(/first time you count/);
    expect(await f('d = {"a": 1}\nprint(d["b"])')).toMatch(/no key `'b'`/);
    expect(await f('s = {}\ns.add(1)')).toMatch(/set\(\)/);
    expect(await f('d = {"a": 1}\nprint(d.a)')).toMatch(/d\["a"\]/);
    expect(await f('class Pet:\n    def __init__(self, name):\n        name = name\np = Pet("Rex")\nprint(p.name)')).toMatch(/self\.name = /);
    expect(await f('class Pet:\n    def speak():\n        print("hi")\nPet().speak()')).toMatch(/needs `self`/);
    expect(await f('class Pet:\n    def _init_(self, name):\n        self.name = name\nPet("Rex")')).toMatch(/__init__/);
    expect(await f('class Pet:\n    def __init__(self, name):\n        self.name = name\nPet()')).toMatch(/Creating a `Pet` needs/);
    expect(await f('class Pet:\n    def __init__(self, name):\n        self.name = name\n    def hi(self):\n        print(name)\nPet("Rex").hi()')).toMatch(/self\.name/);
    expect(await f('d = {[1]: 2}')).toMatch(/can't change/);
    expect(await f('x = [3, 1].sort()\nx.append(2)')).toMatch(/None/);
    expect(await f('d = {"a": 1}\nfor k, v in d:\n    print(k)')).toMatch(/d\.items\(\)/);
    expect(await f('d = {"a": 1}\nfor k in d.items:\n    print(k)')).toMatch(/without calling/);
    expect(await f('s = {1, 2}\nprint(s[0])')).toMatch(/no positions/);
    expect(await f('s = set()\ns.append(1)')).toMatch(/\.add/);
    expect(await f('d = {}\nd.append(1)')).toMatch(/d\[key\] = value/);
    expect(await f('class P:\n    def __init__(self):\n        self.name = "a"\nprint(P()["name"])')).toMatch(/not a dictionary/);
    expect(await f('class P:\n    def __init__(self):\n        self.x = 1\ndef move(self):\n    pass\nP().move()')).toMatch(/not \*\*inside\*\* the class/);
    expect(runJavaScript('const o = { a: 1 };\nfor (const x of o) {\n  console.log(x);\n}').error?.friendly).toMatch(/for \(const key in obj\)/);
    expect(runJavaScript('const s = new Set();\ns.push(1);').error?.friendly).toMatch(/\.add/);
    expect(await f('x = [3, 1].sort()\nx.append(2)')).not.toMatch(/self\./);
    expect(await f('class Pet:\n    def speak(self):\n        return 1\nPet().speek()')).toMatch(/Did you mean `speak`/);
    const js = (code: string) => runJavaScript(code).error?.friendly ?? '';
    expect(js('class Pet {}\nconst p = Pet();')).toMatch(/new Pet/);
    expect(js('const s = {};\ns.add(1);')).toMatch(/new Set/);
    expect(js('class Pet {\n  constructor(name) {\n    this.name = name;\n  }\n  hi() {\n    console.log(name);\n  }\n}\nnew Pet("Rex").hi();')).toMatch(/this\.name/);
    expect(runJavaScript('class Pet {\n  constructor(n) {\n    this.name = n;\n  }\n}\nconsole.log(new Pet("Rex"));').stdout).toBe("Pet { name: 'Rex' }\n");
  });

  it('keeps input working after exit() or quit() (round-4 P0)', async () => {
    for (const end of ['exit()', 'quit()', 'exit(0)']) {
      expect((await runPython(py, `print("bye")\n${end}`)).error, end).toBeUndefined();
      const after = await runPython(py, 'print(input())', { stdin: 'still here' });
      expect(after.error, end).toBeUndefined();
      expect(after.stdout, end).toBe('still here\n');
    }
    expect((await runPython(py, 'exit(3)')).error?.name).toBe('SystemExit');
    await runPython(py, 'import sys\nsys.stdin.close()');
    expect((await runPython(py, 'print(input())', { stdin: 'reopened' })).stdout).toBe('reopened\n');
  });

  it('treats sys.exit() as a normal end but reports non-zero exits', async () => {
    expect((await runPython(py, 'import sys\nprint("bye")\nsys.exit()')).error).toBeUndefined();
    expect((await runPython(py, 'import sys\nsys.exit(0)')).error).toBeUndefined();
    expect((await runPython(py, 'import sys\nsys.exit(2)')).error?.name).toBe('SystemExit');
  });

  it('keeps the name of a bare raise', async () => {
    expect((await runPython(py, 'raise ValueError')).error).toMatchObject({ name: 'ValueError', line: 1 });
  });

  it('JS learner code cannot reach the worker messaging', () => {
    expect(runJavaScript('console.log(typeof postMessage, typeof self, typeof globalThis);').stdout).toBe('undefined undefined undefined\n');
  });

  it('lint ignores command names inside strings', async () => {
    const { lintCode } = await import('../src');
    expect(lintCode('print("Do not move")\nmove()', 'python')).toEqual([]);
  });
});

describe('round-2 teacher fixes: error advice', () => {
  let py: PyodideInterface;
  beforeAll(async () => {
    py = await getPyodide();
  }, 60_000);

  it('Python = in an if points at ==, not a colon', async () => {
    const r = await runPython(py, 'score = 1\nif score = 100:\n    print("x")');
    expect(r.error?.friendly).toMatch(/==/);
    expect(r.error?.friendly).not.toMatch(/colon/);
  });
  it('print without brackets', async () => {
    expect((await runPython(py, 'print "x"')).error?.friendly).toMatch(/brackets/);
  });
  it('robot commands with an argument', async () => {
    expect((await runPython(py, 'move(3)', { grid })).error?.friendly).toMatch(/loop/);
    expect(runJavaScript('move(3);', { grid }).error?.message).toMatch(/loop/);
  });
  it('mixing up languages', async () => {
    expect(runJavaScript('print("hi")').error?.friendly).toMatch(/console\.log/);
    expect((await runPython(py, 'console.log("hi")')).error?.friendly).toMatch(/print/);
    expect((await runPython(py, 'x = true')).error?.friendly).toMatch(/True/);
  });
  it('JS # comment is explained', () => {
    expect(runJavaScript('# note\nconsole.log(1);').error?.friendly).toMatch(/\/\//);
  });
});

describe('round-2 student fixes', () => {
  it('points a missing } at the opening brace', () => {
    const code = 'function turnRight() {\n  turnLeft();\n\nmove();\n';
    const r = runJavaScript(code);
    expect(r.error?.line).toBe(1);
    expect(r.error?.friendly).toMatch(/never closed/);
  });
  it('suggests the right name for typos', () => {
    expect(runJavaScript('const word = "hi";\nconsole.log(word.toUppercase());').error?.friendly).toMatch(/toUpperCase/);
    expect(runJavaScript('turnleft();', { grid }).error?.friendly).toMatch(/turnLeft/);
  });
  it('warns about placeholders in the wrong quotes', async () => {
    const { lintCode } = await import('../src');
    expect(lintCode('const name = "Ada";\nconsole.log("Hi ${name}");', 'javascript').join()).toMatch(/backticks/);
    expect(lintCode('name = "Ada"\nprint("Hi {name}")', 'python').join()).toMatch(/f-string/);
    expect(lintCode('name = "Ada"\nprint(f"Hi {name}")', 'python')).toEqual([]);
  });
});

describe('round-3 developer fixes', () => {
  let py: PyodideInterface;
  beforeAll(async () => {
    py = await getPyodide();
  }, 60_000);

  it('line budgets count statements packed with semicolons', async () => {
    const { codeLines } = await import('../src');
    expect(codeLines('step(); step(); step()', 'javascript')).toBe(3);
    expect(codeLines('for (let i = 0; i < 5; i++) {\n  move();\n}', 'javascript')).toBe(3);
    expect(codeLines('step(); step()\n# note', 'python')).toBe(2);
  });

  it('Python random differs between runs unless seeded', async () => {
    const a = await runPython(py, 'import random\nprint(random.random())');
    const b = await runPython(py, 'import random\nprint(random.random())');
    expect(a.stdout).not.toBe(b.stdout);
    const c = await runPython(py, 'import random\nprint(random.random())', { seed: 7 });
    const d = await runPython(py, 'import random\nprint(random.random())', { seed: 7 });
    expect(c.stdout).toBe(d.stdout);
  });

  it('JS Math.random is reproducible with a seed', () => {
    const run = (seed?: number) => runJavaScript('console.log(Math.random());', { seed }).stdout;
    expect(run(3)).toBe(run(3));
    expect(run(3)).not.toBe(run(4));
  });

  it('records input events with prompts and output offsets', async () => {
    const p = await runPython(py, 'print("Hi")\nname = input("Name? ")\nprint(name)', { stdin: 'Ada' });
    expect(p.inputs).toEqual([{ offset: 3, prompt: 'Name? ' }]);
    const j = runJavaScript('console.log("Hi");\nconst n = prompt("Name?");\nconsole.log(n);', { stdin: 'Ada' });
    expect(j.inputs).toEqual([{ offset: 3, prompt: 'Name?' }]);
  });
});

describe('round-3 teacher blockers: feedback', () => {
  let py: PyodideInterface;
  beforeAll(async () => {
    py = await getPyodide();
  }, 60_000);

  it('a missing quote is reported as a missing quote, not a bracket', () => {
    const r = runJavaScript('console.log("Hello, coder!);');
    expect(r.error?.friendly).toMatch(/closing/);
    expect(r.error?.friendly).not.toMatch(/Add a `\)`/);
  });
  it('an undefined turn_right explains defining it, not quotes', async () => {
    const p = await runPython(py, 'move()\nturn_right()', { grid });
    expect(p.error?.friendly).toMatch(/define your right turn/);
    expect(runJavaScript('move();\nturnRight();', { grid }).error?.friendly).toMatch(/define your right turn/);
  });
  it('misspelled commands get "did you mean", not quotes', async () => {
    const p = await runPython(py, 'move()\ncolect()', { grid });
    expect(p.error?.friendly).toMatch(/collect/);
    expect(p.error?.friendly).not.toMatch(/quotes/);
  });
  it('JS True and Python else if', async () => {
    expect(runJavaScript('const ok = True;').error?.friendly).toMatch(/lowercase/);
    expect((await runPython(py, 'x = 1\nif x > 2:\n    print(1)\nelse if x > 0:\n    print(2)')).error?.friendly).toMatch(/elif/);
  });
});

describe('remixNumbers', () => {
  it('changes puzzle numbers but not strings, comments, 0/1, or decimals', async () => {
    const { remixNumbers } = await import('../src');
    const code = 'x = 7 + 3  # 99\nprint("10 apples", x * 2, 0, 1, 2.5)';
    const remixed = remixNumbers(code, 42, 'python');
    expect(remixed).toContain('"10 apples"');
    expect(remixed).toContain('# 99');
    expect(remixed).toContain(', 0, 1, 2.5)');
    expect(remixed).not.toBe(code);
    expect(remixNumbers(code, 42, 'python')).toBe(remixed);
  });
});

describe('round-3 student fixes', () => {
  it('explains commands stuck together on one line', async () => {
    const py = await getPyodide();
    expect((await runPython(py, 'move()move()', { grid })).error?.friendly).toMatch(/own line/);
    expect(runJavaScript('move()move();', { grid }).error?.friendly).toMatch(/own line/);
  });
});

describe('region 3 engine', () => {
  let py: PyodideInterface;
  beforeAll(async () => {
    py = await getPyodide();
  }, 60_000);
  const exec = {
    python: (code: string, o: object) => runPython(py, code, o),
    javascript: async (code: string, o: object) => runJavaScript(code, o),
  };

  it('harness tests grade returned values, not printed ones', async () => {
    const { gradeSubmission } = await import('../src');
    const level = {
      id: 't', conceptId: 'x', title: 't', role: 'intro', mode: 'guided', prompt: '', reinforces: [], hints: [],
      game: 'build-it', starterCode: {}, solution: {},
      tests: [{ name: 'doubles 21', expectedOutput: '42', harness: { python: 'print(double(21))', javascript: 'console.log(double(21));' } }],
    } as const;
    const returns = await gradeSubmission(level as never, 'python', 'def double(n):\n    return n * 2\nprint(double(3))', exec.python);
    expect(returns.passed).toBe(true);
    const prints = await gradeSubmission(level as never, 'python', 'def double(n):\n    print(n * 2)', exec.python);
    expect(prints.passed).toBe(false);
    expect(prints.tests[0]!.actual).toMatch(/42\nNone/);
    const js = await gradeSubmission(level as never, 'javascript', 'function double(n) { console.log(n * 2); }', exec.javascript);
    expect(js.tests[0]!.actual).toMatch(/undefined/);
  });

  it('predictions can expect an error name', async () => {
    const { gradePrediction } = await import('../src');
    const r = await gradePrediction('items = [1, 2]\nprint(items[0])\nprint(items[2])', undefined, '1\nIndexError', exec.python, true);
    expect(r.correct).toBe(true);
    const full = await gradePrediction('items = [1, 2]\nprint(items[0])\nprint(items[2])', undefined, '1\nIndexError: list index out of range', exec.python, true);
    expect(full.correct).toBe(true);
    const wrongName = await gradePrediction('items = [1, 2]\nprint(items[2])', undefined, 'KeyError: 2', exec.python, true);
    expect(wrongName.correct).toBe(false);
    const spaced = await gradePrediction('console.log([1, 2]);', undefined, '[1,2]', exec.javascript);
    expect(spaced.correct).toBe(true);
    expect((await gradePrediction('print([1, 2])', undefined, '[ 1, 2 ]', exec.python)).correct).toBe(true);
    expect((await gradePrediction('print([1, 2])', undefined, '[1, 3]', exec.python)).correct).toBe(false);
    expect((await gradePrediction('print(1, ["bonus"])', undefined, '1 ["bonus"]', exec.python)).correct).toBe(true);
    expect((await gradePrediction('console.log({ a: 1 });', undefined, "{'a':1}", exec.javascript, false, 'javascript')).correct).toBe(true);
    expect((await gradePrediction('print({"apple": 4})', undefined, '{"apple":4}', exec.python, false, 'python')).correct).toBe(true);
    expect((await gradePrediction('print({"apple": 4})', undefined, '{apple: 4}', exec.python, false, 'python')).correct).toBe(false);
  });

  it('explains item-as-index, len, return and cross-language string methods', async () => {
    expect((await runPython(py, 'items = ["a"]\nfor i in items:\n    print(items[i])')).error?.friendly).toMatch(/items\*\*, not their positions/);
    expect((await runPython(py, 'print(len(5))')).error?.friendly).toMatch(/single int/);
    expect((await runPython(py, 'return 5')).error?.friendly).toMatch(/inside a function/);
    expect((await runPython(py, 'print("a".toUpperCase())')).error?.friendly).toMatch(/upper\(\)/);
    expect(runJavaScript('console.log("a".upper());').error?.friendly).toMatch(/toUpperCase/);
    expect(runJavaScript('const a = [1];\nconsole.log(a.length());').error?.friendly).toMatch(/no brackets/);
    expect(runJavaScript('function byNumber(a, b) { return a - b; }\n[2, 1].sort(byNumber());').error?.friendly).toMatch(/without brackets/);
    expect(runJavaScript('prompt();').error?.friendly).toMatch(/loop has a way to stop/);
  });

  it('harness tests resist spoofing and explain when the main program stops first', async () => {
    const { gradeSubmission, HARNESS_MARKER } = await import('../src');
    const level = {
      id: 't', conceptId: 'x', title: 't', role: 'intro', mode: 'guided', prompt: '', reinforces: [], hints: [],
      game: 'build-it', starterCode: {}, solution: {},
      tests: [{ name: 'doubles 21', input: '1', expectedOutput: '42', harness: { python: 'print(double(21))', javascript: 'console.log(double(21));' } }],
    } as const;
    const spoof = await gradeSubmission(level as never, 'python', `def double(n):\n    return 0\nprint("${HARNESS_MARKER}")\nprint(42)\nimport sys\nsys.exit()`, exec.python);
    expect(spoof.passed).toBe(false);
    expect(spoof.tests[0]!.mainStopped).toBe(true);
    const extraInput = await gradeSubmission(level as never, 'python', 'def double(n):\n    return n * 2\ninput()\ninput()', exec.python);
    expect(extraInput.tests[0]!.mainStopped).toBe(true);
    expect(extraInput.tests[0]!.call).toBe('print(double(21))');
    const misnamed = await gradeSubmission(level as never, 'javascript', 'function twice(n) {\n  return n * 2;\n}', exec.javascript);
    expect(misnamed.tests[0]!.mainStopped).toBe(false);
    expect(misnamed.tests[0]!.error?.line).toBeUndefined();
  });

  it('region 3 error explanations', async () => {
    expect((await runPython(py, 'def greet():\n    print("hi")\ngreet("Bo")')).error?.friendly).toMatch(/parameter/);
    expect((await runPython(py, 'def greet(name):\n    print(name)\ngreet()')).error?.friendly).toMatch(/needs a value for/);
    expect((await runPython(py, 'score = 0\ndef add(p):\n    score += p\nadd(1)')).error?.friendly).toMatch(/local variable/);
    expect((await runPython(py, 'def f():\n    print(1)\nx = f()\nprint(x[0])')).error?.friendly).toMatch(/printed/);
    expect((await runPython(py, 'a = []\na.push(1)')).error?.friendly).toMatch(/append/);
    expect(runJavaScript('const a = [];\na.append(1);').error?.friendly).toMatch(/push/);
    expect((await runPython(py, 'w = "cat"\nw[0] = "b"')).error?.friendly).toMatch(/in place/);
  });
});

describe('Python output limit without console noise (round-8 P2)', () => {
  it('stops a print flood with OutputLimitError raised inside Python', async () => {
    const py = await getPyodide();
    const r = await runPython(py, 'while True:\n    try:\n        print("spam")\n    except Exception:\n        pass');
    expect(r.error?.name).toBe('OutputLimitError');
    expect(r.error?.kind).toBe('output-limit');
    const next = await runPython(py, 'print("ok")');
    expect(next.stdout).toBe('ok\n');
  });
});

describe('variant starting lines', () => {
  const level = {
    id: 't', conceptId: 'x', title: 't', role: 'intro', mode: 'guided', prompt: '', reinforces: [], hints: [],
    game: 'build-it', starterCode: {}, solution: {},
    tests: [{ name: 'prints', expectedOutput: '3' }],
    variants: [{ name: 'five', replace: { javascript: [['pizzas = 3', 'pizzas = $& 5']] as [string, string][] }, expectedOutput: '5' }],
  } as const;
  const exec = async (code: string, o: object) => runJavaScript(code, o);

  it('does not match inside a longer name', async () => {
    const { gradeSubmission } = await import('../src');
    const r = await gradeSubmission(level as never, 'javascript', 'let big_pizzas = 3;\nconsole.log(big_pizzas);', exec);
    expect(r.blocked?.[0]).toMatch(/Keep the line/);
  });

  it('ignores commented copies and treats $ in the replacement literally', async () => {
    const { gradeSubmission } = await import('../src');
    const code = '// pizzas = 3\nlet pizzas = 3;\nconsole.log(pizzas);';
    const lit = { ...level, variants: [{ name: 'five', replace: { javascript: [['pizzas = 3', 'pizzas = 5 /* $& */']] as [string, string][] }, expectedOutput: '5' }] };
    const r = await gradeSubmission(lit as never, 'javascript', code, exec);
    expect(r.blocked).toBeUndefined();
    expect(r.passed).toBe(true);
  });
});
