import { expect, test } from '../fixtures';
import type { Page } from '@playwright/test';
import { BEFORE_BOSS_4, openLevel, pickLanguage, runCode, seedCompleted, typeCode, watch, type Lang, LANG_NAME } from './util';

/**
 * Anything a learner (or a loaded file / saved game) can put on screen must render as TEXT.
 * Two independent checks per case: no element was injected, and no script ran. In the production
 * build the CSP (no 'unsafe-inline' in script-src) would also stop an injected inline handler, so
 * the element checks are what prove the app escapes its output rather than leaning on the CSP.
 */

const PWNED = 'window.__pwned=1';
const IMG = `<img src=x onerror=${PWNED}>`;
const SVG = `<svg onload=${PWNED}>`;
const BOLD = '<b id=inj>bold</b>';

/** Elements that only exist if something was injected. */
const INJECTED = '[onerror], [onload], #inj, #xssb, img[src="x"], a[href^="javascript:" i], main script, .game script';

async function expectNoInjection(page: Page, w: ReturnType<typeof watch>) {
  await expect(page.locator(INJECTED)).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as { __pwned?: number }).__pwned)).toBeUndefined();
  expect(w.dialogs, 'no alert/confirm/prompt fired').toEqual([]);
  expect(w.pageErrors, 'no uncaught page error').toEqual([]);
}

test.describe('program output and errors render as text', () => {
  const programs: Record<Lang, { name: string; code: string; shows: string[] }[]> = {
    python: [
      { name: 'print', code: `print("${IMG}")\nprint("${SVG}${BOLD}")`, shows: [IMG, BOLD] },
      { name: 'exception message', code: `raise ValueError("${IMG}")`, shows: [IMG] },
      { name: 'custom __str__', code: `class A:\n    def __str__(self):\n        return "${IMG}"\nprint(A())`, shows: [IMG] },
      { name: 'markdown and links in output', code: 'print("**md** _md_ [click](javascript:alert(3)) `code`")', shows: ['**md**', '[click](javascript:alert(3))'] },
      { name: 'HTML inside an identifier (syntax error)', code: `x_<img_src=x_onerror=${PWNED}> = 1`, shows: [] },
      { name: 'HTML after a def (syntax error)', code: `def <b id=inj>x</b>(): pass`, shows: [] },
      { name: 'unknown name next to HTML', code: `print(undefined_name)  # ${IMG}`, shows: [] },
    ],
    javascript: [
      { name: 'console.log', code: `console.log("${IMG}");\nconsole.log("${SVG}${BOLD}");`, shows: [IMG, BOLD] },
      { name: 'thrown error message', code: `throw new Error("${IMG}");`, shows: [IMG] },
      { name: 'custom toString', code: `const o = { toString() { return "${IMG}"; } };\nconsole.log(String(o));\nconsole.log(\`\${o}\`);`, shows: [IMG] },
      { name: 'markdown and links in output', code: 'console.log("**md** _md_ [click](javascript:alert(3)) `code`");', shows: ['**md**', '[click](javascript:alert(3))'] },
      { name: 'object keys that look like HTML', code: `console.log({ "${IMG}": 1, "${BOLD}": [2] });`, shows: [] },
      { name: 'HTML inside an identifier (syntax error)', code: `let \`${BOLD}\`;`, shows: [] },
      { name: 'HTML after function (syntax error)', code: `function ${IMG}() {}`, shows: [] },
      { name: 'method call on the wrong type', code: `const v = 1;\nv.map(\`${IMG}\`);`, shows: [] },
      { name: 'unknown name next to HTML', code: `console.log(nmae); // ${IMG}`, shows: [] },
    ],
  };
  for (const lang of ['python', 'javascript'] as Lang[]) {
    for (const p of programs[lang]) {
      test(`${lang}: ${p.name}`, async ({ page }) => {
        test.setTimeout(60_000);
        const w = watch(page);
        await openLevel(page, lang);
        const out = await runCode(page, p.code, 50_000);
        for (const text of p.shows) expect(out, 'the markup is shown literally').toContain(text.replace(/\s+/g, ' '));
        // Printed text and the raw error line are plain <pre> text: no child element may exist there.
        // (The friendly explanation may legitimately use <code> for the learner's identifiers.)
        await expect(page.locator('.out-console pre > *, .out-error-raw > *, .out-error-friendly a, .out-error-friendly img')).toHaveCount(0);
        await expectNoInjection(page, w);
        // Nothing the program printed was left half-rendered: the page still works.
        await expect(page.getByRole('button', { name: /▶ Run/ })).toBeEnabled();
      });
    }
  }
});

test.describe('workshop content renders as text', () => {
  // No spaces: the adventure engine splits commands on spaces. `/` separates HTML attributes just as well.
  const HOSTILE_ROOM = '<img/src=x/onerror=window.__pwned=1>';
  const HOSTILE_ITEM = '<svg/onload=window.__pwned=1>';
  const HOSTILE_ROOM_2 = '<b/id=inj>bold</b>';

  const worlds: Record<Lang, string> = {
    python: `rooms = {\n    "hall": {"exits": {"${HOSTILE_ROOM}": "${HOSTILE_ROOM}"}, "items": ["${HOSTILE_ITEM}"]},\n    "${HOSTILE_ROOM}": {"exits": {"back": "hall", "${HOSTILE_ROOM_2}": "${HOSTILE_ROOM_2}"}, "items": []},\n    "${HOSTILE_ROOM_2}": {"exits": {"back": "${HOSTILE_ROOM}"}, "items": ["${HOSTILE_ITEM}"]},\n}`,
    javascript: `const rooms = {\n  hall: { exits: { "${HOSTILE_ROOM}": "${HOSTILE_ROOM}" }, items: ["${HOSTILE_ITEM}"] },\n  "${HOSTILE_ROOM}": { exits: { back: "hall", "${HOSTILE_ROOM_2}": "${HOSTILE_ROOM_2}" }, items: [] },\n  "${HOSTILE_ROOM_2}": { exits: { back: "${HOSTILE_ROOM}" }, items: ["${HOSTILE_ITEM}"] },\n};`,
  };
  const words: Record<Lang, string> = {
    python: `words = ["<img/src=x/onerror=window.__pwned=1>", "<b/id=inj>x</b>"]\nstart_lives = 9`,
    javascript: `const words = ["<img/src=x/onerror=window.__pwned=1>", "<b/id=inj>x</b>"];\nconst startLives = 9;`,
  };

  /** Type one line into the running program. Skips quietly if the program has already ended. */
  async function sendLine(page: Page, text: string) {
    const box = page.getByLabel('Your program is waiting for input:');
    const enter = page.getByRole('button', { name: /Enter/ });
    if (!(await enter.isEnabled({ timeout: 3_000 }).catch(() => false))) return;
    await box.fill(text);
    await enter.click();
  }

  for (const lang of ['python', 'javascript'] as Lang[]) {
    test(`${lang}: Text Adventure room, exit and item names`, async ({ page }) => {
      test.setTimeout(75_000);
      const w = watch(page);
      await pickLanguage(page, LANG_NAME[lang]);
      await seedCompleted(page, lang, [...BEFORE_BOSS_4, 'boss-4']);
      await page.goto('/play/boss-4?mode=world');
      await typeCode(page, worlds[lang]);
      await page.getByRole('button', { name: /Play your world/ }).click();
      await expect(page.locator('.play-screen')).toContainText('Exits:', { timeout: 50_000 });
      await sendLine(page, `go ${HOSTILE_ROOM}`);
      await expect(page.locator('.adventure h3')).toHaveText(HOSTILE_ROOM);
      await sendLine(page, `go ${HOSTILE_ROOM_2}`);
      await expect(page.locator('.adventure h3')).toHaveText(HOSTILE_ROOM_2);
      await sendLine(page, `take ${HOSTILE_ITEM}`);
      await sendLine(page, `look ${HOSTILE_ROOM}`);
      await sendLine(page, 'inventory');
      await expect(page.locator('.play-screen')).toContainText(HOSTILE_ITEM);
      await expectNoInjection(page, w);
    });

    test(`${lang}: Hangman word list`, async ({ page }) => {
      test.setTimeout(75_000);
      const w = watch(page);
      await pickLanguage(page, LANG_NAME[lang]);
      await seedCompleted(page, lang, [...BEFORE_BOSS_4, 'boss-3']);
      await page.goto('/play/boss-3?mode=words');
      await typeCode(page, words[lang]);
      await page.getByRole('button', { name: /Play with your words/ }).click();
      await expect(page.getByLabel('Your program is waiting for input:')).toBeVisible({ timeout: 50_000 });
      await expect(page.locator('.hangman-tile').first()).toBeVisible(); // the hostile word really is on the board
      for (const guess of ['<', 'i', 'm', 'g', '>', '/', 'a', 'b', 'z']) await sendLine(page, guess);
      await expectNoInjection(page, w);
    });
  }

  test('opening a hostile file puts it in the editor as plain text', async ({ page }) => {
    const w = watch(page);
    await pickLanguage(page, 'JavaScript');
    await seedCompleted(page, 'javascript', [...BEFORE_BOSS_4, 'boss-3']);
    await page.goto('/play/boss-3?mode=words');
    const content = `const words = ["${IMG}"]; // ${SVG}${BOLD}\nconst startLives = 2;`;
    await page.locator('input[type=file]').setInputFiles({ name: 'evil.js', mimeType: 'text/javascript', buffer: Buffer.from(content) });
    await expect(page.locator('.cm-content')).toContainText('<img src=x onerror=');
    await expectNoInjection(page, w);
  });
});
