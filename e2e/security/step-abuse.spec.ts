import { expect, test } from '../fixtures';
import type { Page } from '@playwright/test';
import { crashedScreen, expectRecovers, openLevel, runCode, stored, typeCode, watch, type Lang } from './util';

/**
 * Step-through re-runs the learner's program under a tracer and then formats every variable at
 * every step. Hostile objects (a `__repr__` / getter / Proxy trap with side effects, or one that
 * never returns) must not change what the program does, hang the page, or corrupt progress.
 * Round-8 P1-4 / P1-6 describe the original holes.
 */

const STEP = /Step through/;

async function trace(page: Page, code: string) {
  await typeCode(page, code);
  await page.getByRole('button', { name: STEP }).click();
  // The button is disabled while tracing; a hang here means the UI is stuck.
  await expect(page.getByRole('button', { name: STEP })).toBeEnabled({ timeout: 40_000 });
}

/** Jump to the last step and arrow through the rest; returns how long the UI took to respond. */
async function exercise(page: Page): Promise<number> {
  const started = Date.now();
  await page.getByRole('button', { name: 'Last step' }).click({ timeout: 20_000 });
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));
  const elapsed = Date.now() - started;
  await page.getByRole('button', { name: 'First step' }).click({ timeout: 20_000 });
  for (let i = 0; i < 12; i++) await page.keyboard.press('ArrowRight');
  await page.getByRole('button', { name: 'Last step' }).click({ timeout: 20_000 });
  return elapsed;
}

const outputOf = async (page: Page) => ((await page.locator('.steps-out').innerText()).replace(/\s+/g, ' ').replace(/^OUTPUT SO FAR\s*/i, '').trim());

interface Case {
  lang: Lang;
  name: string;
  code: string;
  /** What the program itself prints when it just runs. */
  prints: string;
  /** Text that may only appear if the tracer invoked learner code while formatting. */
  forbidden: RegExp;
}

const SIDE_EFFECTS: Case[] = [
  {
    lang: 'python',
    name: '__repr__ and __str__ with side effects',
    code: [
      'log = []',
      'class A:',
      '    def __repr__(self):',
      '        log.append(1)',
      '        print("REPR RAN")',
      '        return "A()"',
      '    def __str__(self):',
      '        log.append(2)',
      '        print("STR RAN")',
      '        return "a"',
      'a = A()',
      'items = [a, a]',
      'pair = {"k": a}',
      'print(len(log))',
    ].join('\n'),
    prints: '0',
    forbidden: /REPR RAN|STR RAN/,
  },
  {
    lang: 'python',
    name: 'property, __getattr__ and __len__ with side effects',
    code: [
      'log = []',
      'class A:',
      '    @property',
      '    def x(self):',
      '        log.append(1)',
      '        print("PROP RAN")',
      '        return 1',
      '    def __getattr__(self, name):',
      '        log.append(2)',
      '        print("GETATTR RAN")',
      '        return 0',
      '    def __len__(self):',
      '        log.append(3)',
      '        print("LEN RAN")',
      '        return 1',
      '    def __iter__(self):',
      '        log.append(4)',
      '        print("ITER RAN")',
      '        return iter([])',
      'a = A()',
      'b = 2',
      'print(len(log))',
    ].join('\n'),
    prints: '0',
    forbidden: /PROP RAN|GETATTR RAN|LEN RAN|ITER RAN/,
  },
  {
    lang: 'python',
    name: 'a __repr__ that never returns',
    code: 'class A:\n    def __repr__(self):\n        while True:\n            pass\na = A()\nb = [a]\nprint("done")',
    prints: 'done',
    forbidden: /^$/,
  },
  {
    lang: 'python',
    name: 'a __repr__ that raises',
    code: 'class A:\n    def __repr__(self):\n        raise RuntimeError("repr boom")\na = A()\nb = {"k": a}\nprint("ok")',
    prints: 'ok',
    forbidden: /repr boom/,
  },
  {
    lang: 'javascript',
    name: 'getters, toString and Proxy traps with side effects',
    code: [
      'let n = 0;',
      'const o = { get x() { n++; console.log("GETTER RAN"); return 1; } };',
      'const p = new Proxy({}, {',
      '  get() { n++; console.log("TRAP RAN"); return 1; },',
      '  ownKeys() { n++; console.log("KEYS RAN"); return []; },',
      '  has() { n++; console.log("HAS RAN"); return true; },',
      '  getPrototypeOf() { n++; console.log("PROTO RAN"); return null; },',
      '});',
      'class T { toString() { n++; console.log("TOSTRING RAN"); return "t"; } valueOf() { n++; return 1; } }',
      'const t = new T();',
      'const list = [o, p, t];',
      'let b = 2;',
      'console.log(n);',
    ].join('\n'),
    prints: '0',
    forbidden: /GETTER RAN|TRAP RAN|KEYS RAN|HAS RAN|PROTO RAN|TOSTRING RAN/,
  },
  {
    lang: 'javascript',
    name: 'a toString that never returns and a Proxy that throws',
    code: 'const h = { toString() { for (;;) {} } };\nconst p = new Proxy({}, { get() { throw new Error("trap boom"); }, ownKeys() { throw new Error("keys boom"); } });\nconst list = [h, p];\nconsole.log("done");',
    prints: 'done',
    forbidden: /trap boom|keys boom/,
  },
];

for (const c of SIDE_EFFECTS) {
  test(`${c.lang}: ${c.name} does not change the program or hang the page`, async ({ page }) => {
    test.setTimeout(90_000);
    const w = watch(page);
    await openLevel(page, c.lang);
    const before = await stored(page);

    // What the program really does.
    const runOutput = await runCode(page, c.code, 50_000);
    expect(runOutput).toContain(c.prints);

    await trace(page, c.code);
    await expect(page.locator('.steps')).toBeVisible();
    await expect(page.getByRole('slider', { name: 'Step' })).toBeVisible();
    const ms = await exercise(page);
    expect(ms, 'jumping to the last step responds quickly').toBeLessThan(8_000);

    // The trace shows what the program prints, and nothing the tracer caused.
    const stepped = await outputOf(page);
    expect(stepped).toContain(c.prints);
    expect(stepped).not.toMatch(c.forbidden);
    await expect(page.locator('.steps-vars')).not.toContainText(/RAN|boom/);

    await expect(crashedScreen(page)).toHaveCount(0);
    expect(w.pageErrors).toEqual([]);
    // Stepping is read-only: no completion, no XP.
    const after = await stored(page);
    expect((after!.state as { completed: unknown }).completed).toEqual((before!.state as { completed: unknown }).completed);
    expect((after!.state as { xp: unknown }).xp).toEqual((before!.state as { xp: unknown }).xp);
    // And the program still runs identically afterwards (nothing was left patched in the worker).
    expect(await runCode(page, c.code, 50_000)).toContain(c.prints);
    await expectRecovers(page, c.lang);
  });
}

test.describe('step-through resource abuse', () => {
  const abuse: { lang: Lang; name: string; code: string }[] = [
    { lang: 'python', name: 'infinite loop', code: 'i = 0\nwhile True:\n    i += 1' },
    { lang: 'javascript', name: 'infinite loop', code: 'let i = 0;\nwhile (true) { i++; }' },
    { lang: 'python', name: 'recursion 3000 deep', code: 'def f(n):\n    if n == 0:\n        return 0\n    return 1 + f(n - 1)\nprint(f(3000))' },
    { lang: 'javascript', name: 'recursion 3000 deep', code: 'function f(n) { return n === 0 ? 0 : 1 + f(n - 1); }\nconsole.log(f(3000));' },
    { lang: 'python', name: 'huge structures', code: 'big = list(range(100000))\nd = {i: str(i) * 50 for i in range(2000)}\ns = "x" * 100000\nx = 1' },
    { lang: 'javascript', name: 'huge structures', code: 'const big = Array.from({ length: 100000 }, (_, i) => i);\nconst s = "x".repeat(100000);\nconst m = new Map(big.map((i) => [i, "v" + i]));\nlet x = 1;' },
  ];
  for (const a of abuse) {
    test(`${a.lang}: ${a.name} traces within limits and the UI stays responsive`, async ({ page }) => {
      test.setTimeout(90_000);
      const w = watch(page);
      await openLevel(page, a.lang);
      await trace(page, a.code);
      await expect(page.locator('.steps')).toBeVisible();
      const ms = await exercise(page);
      expect(ms, 'last-step jump').toBeLessThan(8_000);
      // Values are cut down for display, so the page stays small.
      const text = await page.locator('.steps').innerText();
      expect(text.length).toBeLessThan(30_000);
      await expect(crashedScreen(page)).toHaveCount(0);
      expect(w.pageErrors).toEqual([]);
      await expectRecovers(page, a.lang);
    });
  }

  test('an infinite loop stops at the step cap with an explanation', async ({ page }) => {
    await openLevel(page, 'javascript');
    await trace(page, 'let i = 0;\nwhile (true) { i++; }');
    // The explanation sits on the last step (StepThrough starts at step 1).
    await page.getByRole('button', { name: 'Last step' }).click();
    await expect(page.locator('.steps-note')).toContainText('Stopped after');
  });

  /**
   * KNOWN, ACCEPTED LIMIT (docs/audits/round-8/report.md, "Known limits", 2nd bullet): a traced
   * Python program that swallows the step limit with a bare `except:` falls back to the normal
   * timeout. Asserts that fallback: tracing ends (button comes back), the page stays usable and
   * the next run works.
   */
  test('known limit: python bare except around the loop falls back to the timeout and recovers', async ({ page }) => {
    test.setTimeout(90_000);
    const w = watch(page);
    await openLevel(page, 'python');
    await trace(page, 'while True:\n    try:\n        while True:\n            pass\n    except:\n        pass');
    await expect(crashedScreen(page)).toHaveCount(0);
    expect(w.pageErrors).toEqual([]);
    await expectRecovers(page, 'python');
  });

  test('a syntax error is explained, not a blank panel', async ({ page }) => {
    for (const [lang, code] of [['python', 'def f(:\n    pass'], ['javascript', 'function f( {\n}']] as const) {
      await openLevel(page, lang);
      await trace(page, code);
      await expect(page.locator('.steps-empty')).not.toBeEmpty();
      await expect(crashedScreen(page)).toHaveCount(0);
    }
  });
});
