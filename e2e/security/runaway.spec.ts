import { expect, test } from '@playwright/test';
import { crashedScreen, expectRecovers, openLevel, runCode, typeCode, watch, type Lang } from './util';

/**
 * Runaway programs (loops, floods, recursion, memory) must stop on their own with a message a
 * beginner can act on, must not crash the tab or the React app, and the very next run must work
 * in the same page, without a reload.
 */

/** Raw engine noise we never want a learner to be shown. */
const RAW_NOISE = /Traceback \(most recent call last\)|\bat \S+ \(.*:\d+:\d+\)|\[object Object\]|undefined is not/;

interface Case {
  lang: Lang;
  name: string;
  code: string;
  /** The learner-friendly explanation the output must contain. */
  says: RegExp;
  /** Test budget; Python timeouts are 6 s plus the interrupt. */
  ms?: number;
}

const TIMEOUT = /took too long/i;
const OUTPUT_LIMIT = /printed far too much/i;
const MEMORY = /used too much memory/i;
const SELF_CALL = /kept calling itself/i;

const cases: Case[] = [
  { lang: 'python', name: 'infinite loop', code: 'while True:\n    pass', says: TIMEOUT },
  { lang: 'python', name: 'output flood', code: 'while True:\n    print("spam" * 1000)', says: OUTPUT_LIMIT },
  { lang: 'python', name: 'one gigantic line', code: 'print("x" * 10**7)', says: OUTPUT_LIMIT },
  { lang: 'python', name: 'deep recursion', code: 'def f(n):\n    return f(n + 1)\nf(0)', says: SELF_CALL },
  { lang: 'python', name: 'recursion limit raised sky-high', code: 'import sys\nsys.setrecursionlimit(10**6)\ndef f(n):\n    return f(n + 1)\nf(0)', says: /took too long|kept calling itself|used too much memory/i, ms: 30_000 },
  { lang: 'python', name: 'memory bomb (list of big strings)', code: 'x = []\nwhile True:\n    x.append("a" * 10**6)', says: MEMORY },
  { lang: 'python', name: 'input() in a loop', code: 'while True:\n    input()', says: /asked for more input/i },
  { lang: 'javascript', name: 'infinite loop', code: 'while (true) {}', says: TIMEOUT },
  { lang: 'javascript', name: 'output flood', code: 'for (;;) console.log("spam".repeat(1000));', says: OUTPUT_LIMIT },
  { lang: 'javascript', name: 'one gigantic line', code: 'console.log("x".repeat(2 ** 28));', says: OUTPUT_LIMIT },
  { lang: 'javascript', name: 'deep recursion', code: 'function f(n) { return f(n + 1); }\nf(0);', says: SELF_CALL },
  { lang: 'javascript', name: 'memory bomb (array growth)', code: 'const a = []; for (;;) a.push(new Array(1e6).fill(1));', says: MEMORY },
  { lang: 'javascript', name: 'prompt() in a loop', code: 'for (;;) prompt("again?");', says: /asked for more input/i },
  { lang: 'javascript', name: 'prototype vandalism', code: 'Array.prototype.map = null; Object.prototype.toString = () => "hacked"; console.log([1, 2], { a: 1 });', says: /./ },
];

for (const c of cases) {
  test(`${c.lang}: ${c.name} stops with a friendly message and the next run works`, async ({ page }) => {
    test.setTimeout(c.ms ?? 45_000);
    let tabCrashed = false;
    page.on('crash', () => (tabCrashed = true));
    const w = watch(page);
    await openLevel(page, c.lang);
    const out = await runCode(page, c.code, 40_000);
    expect(out).toMatch(c.says);
    expect(out).not.toMatch(RAW_NOISE);
    // Display stays bounded, even when the program tried to print gigabytes.
    expect(out.length).toBeLessThan(20_000);
    expect(tabCrashed, 'the tab must survive').toBe(false);
    await expect(crashedScreen(page)).toHaveCount(0);
    expect(w.pageErrors).toEqual([]);
    await expectRecovers(page, c.lang);
  });
}

test.describe('known limits: the current safe fallback', () => {
  /**
   * KNOWN, ACCEPTED LIMIT (docs/audits/round-8/report.md, "Known limits", 2nd bullet):
   * a Python program that catches the interrupt with a bare `except:` can swallow it. The
   * fallback is the normal hard timeout, which terminates the worker. This asserts exactly that:
   * the run still ends with "took too long", and the next run works.
   */
  test('python: a bare except around an infinite loop still times out and recovers', async ({ page }) => {
    test.setTimeout(60_000);
    const w = watch(page);
    await openLevel(page, 'python');
    const out = await runCode(page, 'while True:\n    try:\n        while True:\n            pass\n    except:\n        pass', 50_000);
    expect(out).toMatch(TIMEOUT);
    expect(w.pageErrors).toEqual([]);
    await expectRecovers(page, 'python');
  });

  /**
   * KNOWN, ACCEPTED LIMIT (report, 3rd bullet): the JS memory budget counts array growth only.
   * A runaway made of plain objects is still stopped, by the 3 s timeout instead of the
   * MemoryError; one made of strings by V8's own string-length limit. Both must end cleanly.
   */
  test('javascript: an object-growth bomb (not an array) is stopped by the timeout and recovers', async ({ page }) => {
    test.setTimeout(60_000);
    let tabCrashed = false;
    page.on('crash', () => (tabCrashed = true));
    await openLevel(page, 'javascript');
    const out = await runCode(page, 'const o = {}; for (let i = 0; ; i++) o["k" + i] = { i };', 50_000);
    expect(out).toMatch(/took too long|used too much memory/i);
    expect(tabCrashed).toBe(false);
    await expectRecovers(page, 'javascript');
  });

  test('javascript: a string-doubling bomb ends with V8\'s own length error and recovers', async ({ page }) => {
    let tabCrashed = false;
    page.on('crash', () => (tabCrashed = true));
    await openLevel(page, 'javascript');
    const out = await runCode(page, 'let s = "x"; for (;;) s += s;', 40_000);
    expect(out).toMatch(/RangeError|took too long|used too much memory/i);
    expect(out).not.toMatch(RAW_NOISE);
    expect(tabCrashed).toBe(false);
    await expectRecovers(page, 'javascript');
  });
});

test.describe('interrupting a run', () => {
  for (const lang of ['python', 'javascript'] as Lang[]) {
    test(`${lang}: leaving the level mid-run and coming back leaves a working editor`, async ({ page }) => {
      test.setTimeout(75_000);
      const w = watch(page);
      await openLevel(page, lang);
      await typeCode(page, lang === 'python' ? 'while True:\n    pass' : 'while (true) {}');
      await page.getByRole('button', { name: /▶ Run/ }).click();
      const url = page.url();
      await page.goto('/');
      await page.goto(url);
      await expectRecovers(page, lang);
      await expect(crashedScreen(page)).toHaveCount(0);
      expect(w.pageErrors).toEqual([]);
    });

    test(`${lang}: mashing Run and Check cannot wedge the runner`, async ({ page }) => {
      test.setTimeout(75_000);
      await openLevel(page, lang);
      await typeCode(page, lang === 'python' ? 'for i in range(3):\n    print(i)' : 'for (let i = 0; i < 3; i++) console.log(i);');
      const run = page.getByRole('button', { name: /▶ Run/ });
      const check = page.getByRole('button', { name: /✓ Check/ });
      for (let i = 0; i < 8; i++) {
        await run.click({ force: true, noWaitAfter: true }).catch(() => undefined);
        await check.click({ force: true, noWaitAfter: true }).catch(() => undefined);
      }
      await page.keyboard.press('ControlOrMeta+Enter');
      await page.keyboard.press('ControlOrMeta+Enter');
      await expect(run).toBeEnabled({ timeout: 40_000 });
      await expect(crashedScreen(page)).toHaveCount(0);
      await expectRecovers(page, lang);
    });
  }
});
