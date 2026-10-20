import { expect, test } from '../fixtures';
import type { Page } from '@playwright/test';
import { crashedScreen, pickLanguage, seedCompleted, typeCode, watch } from './util';
import { REGION_0 } from '../helpers';

/**
 * A backup file (or a tampered localStorage) is untrusted input. Whatever it contains, the app
 * must keep working: no crash screen, no blank page, no prototype pollution, no NaN on screen,
 * a readable message for files that are refused, and the previous progress untouched when it is
 * refused.
 */

const KEY = 'codegames-progress';
const BACKUP_FORMAT = 'codegames-progress-backup';
const wrap = (data: string) => `{"format":"${BACKUP_FORMAT}","exportedAt":"2026-01-01T00:00:00.000Z","data":${data}}`;
const state = (s: object, version = 5) => JSON.stringify({ state: s, version });
const NOW = Date.now();

/** Persisted payloads (raw JSON text: `__proto__` keys only survive as text). */
const PAYLOADS: Record<string, string> = {
  'state is null': JSON.stringify({ state: null, version: 5 }),
  'future version': state({ language: 'python', xp: 10 }, 99),
  'version zero': state({ language: 'python', xp: 10 }, 0),
  'negative version': state({ language: 'python', xp: 10 }, -3),
  'v1 shape': state({ language: 'python' }, 1),
  'v2 shape': state({ language: 'javascript', xp: 50, completed: { python: {}, javascript: { 'sequencing-1': { at: 1700000000000, attempts: 0, hintsUsed: 0 } } } }, 2),
  'v3 null maps': state({ language: 'python', completed: null, reviews: null }, 3),
  'wrong types everywhere': state({ language: 'klingon', xp: 'lots', completed: 'yes', drafts: [1], skin: { a: 1 }, dailyGoal: 999, reviews: { python: { loops: { count: 'x' } } }, activity: 7, errorCounts: 'no' }),
  'completed is an array': state({ language: 'python', completed: [1, 2, 3] }),
  'language-keyed maps are strings': state({ language: 'python', completed: { python: 'x', javascript: 5 } }),
  'huge xp': state({ language: 'python', xp: 1e308, completed: { python: {}, javascript: {} } }),
  'negative and fractional xp': state({ language: 'python', xp: -50.5, completed: { python: {}, javascript: {} } }),
  'bad stars and unknown levels': state({ language: 'python', completed: { python: { 'sequencing-1': { at: NOW, stars: 0 }, 'sequencing-2': { at: NOW, stars: 7 }, 'nope-9': { at: NOW, stars: 3 }, 'sequencing-3': { at: 'later', stars: 'many' } }, javascript: {} } }),
  'timestamps in the far future': state({ language: 'python', completed: { python: { 'sequencing-1': { at: 9e15, stars: 3 } }, javascript: {} }, activity: { '9999-99-99': 5, garbage: 3 } }),
  '__proto__ keys': '{"state":{"language":"python","__proto__":{"polluted":"yes"},"completed":{"python":{"__proto__":{"at":1,"polluted":"yes"}},"javascript":{}},"drafts":{"__proto__":"x"},"reviews":{"__proto__":{"polluted":"yes"}}},"version":5}',
  'constructor.prototype keys': '{"state":{"language":"python","constructor":{"prototype":{"polluted":"yes"}},"completed":{"python":{"constructor":{"prototype":{"polluted":"yes"}},"__proto__":{"polluted":"yes"}},"javascript":{"prototype":{"polluted":"yes"}}},"drafts":{"constructor":"x","prototype":"y","toString":"z"}},"version":5}',
  'level ids that are Object.prototype names': state({ language: 'python', completed: { python: { constructor: { at: NOW, stars: 3 }, toString: { at: NOW, stars: 3 }, hasOwnProperty: { at: NOW, stars: 3 }, valueOf: { at: NOW, stars: 3 } }, javascript: {} } }),
  'HTML in skin and reflections': state({ language: 'python', skin: '"><img src=x onerror=window.__pwned=1>', reflections: { 'python:sequencing-1': { text: '<img src=x onerror=window.__pwned=1><script>window.__pwned=1</script>', at: NOW } }, drafts: { 'python:sequencing-1': '<img src=x onerror=window.__pwned=1>' }, completed: { python: { 'sequencing-1': { at: NOW, stars: 3 } }, javascript: {} } }),
};

/** Stuff that must never appear on screen as a value. */
const BAD_TEXT = /\bNaN\b|Infinity|\[object Object\]/;

async function seedProgress(page: Page) {
  await pickLanguage(page, 'JavaScript');
  await seedCompleted(page, 'javascript', REGION_0);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'World Map' })).toBeVisible();
}

const pristinePrototype = (page: Page) =>
  page.evaluate(() => ({
    polluted: ({} as Record<string, unknown>).polluted ?? null,
    keys: Object.keys(Object.prototype),
    pwned: (window as unknown as { __pwned?: number }).__pwned ?? null,
  }));

/** Visit the screens that read progress; none may crash, go blank, or show junk numbers. */
async function expectHealthyEverywhere(page: Page, w: ReturnType<typeof watch>) {
  for (const path of ['/', '/journal', '/review', '/play/sequencing-1']) {
    await page.goto(path);
    await expect(page.locator('#root')).not.toBeEmpty();
    await expect(crashedScreen(page)).toHaveCount(0);
    // Poll: right after the launch gate closes, only the header has rendered.
    const bodyText = async () => (await page.locator('body').innerText()).trim();
    await expect.poll(async () => (await bodyText()).length, { message: `${path} is not blank` }).toBeGreaterThan(20);
    const text = await bodyText();
    expect(text, `${path} shows no junk values`).not.toMatch(BAD_TEXT);
  }
  expect(await pristinePrototype(page)).toEqual({ polluted: null, keys: [], pwned: null });
  await expect(page.locator('[onerror], img[src="x"], main script')).toHaveCount(0);
  expect(w.dialogs).toEqual([]);
  expect(w.pageErrors).toEqual([]);
}

/** Import through the real menu. Resolves after the confirm and any alert (or the reload). */
async function importFile(page: Page, name: string, content: string | Buffer): Promise<string[]> {
  const messages: string[] = [];
  page.removeAllListeners('dialog');
  page.on('dialog', (d) => {
    if (d.type() === 'alert') messages.push(d.message());
    void d.accept();
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.locator('input[type=file]').setInputFiles({ name, mimeType: 'application/json', buffer: Buffer.isBuffer(content) ? content : Buffer.from(content) });
  await page.waitForTimeout(1_500);
  await page.waitForLoadState('load');
  return messages;
}

test.describe('tampered localStorage', () => {
  for (const [name, raw] of Object.entries({ 'not JSON': 'not json{{{', 'the string null': 'null', 'a bare array': '[1,2,3]', 'an empty string': '' , ...PAYLOADS })) {
    test(`stored progress: ${name}`, async ({ page }) => {
      test.setTimeout(60_000);
      const w = watch(page);
      await page.goto('/');
      await page.evaluate(({ key, raw }) => localStorage.setItem(key, raw), { key: KEY, raw });
      await expectHealthyEverywhere(page, w);
    });
  }
});

test.describe('refused backup files leave progress untouched', () => {
  const refused: Record<string, string | Buffer> = {
    'not JSON': 'hello',
    'empty file': '',
    'JSON null': 'null',
    'JSON array': '[]',
    'JSON string': '"codegames"',
    'another app\'s JSON': JSON.stringify({ hello: 'world' }),
    'wrong format tag': JSON.stringify({ format: 'something-else', data: { state: {}, version: 5 } }),
    'no data': JSON.stringify({ format: BACKUP_FORMAT, data: null }),
    'data without a version': JSON.stringify({ format: BACKUP_FORMAT, data: { state: {} } }),
    'version is a string': JSON.stringify({ format: BACKUP_FORMAT, data: { state: {}, version: '5' } }),
    'binary junk': Buffer.from([0, 255, 254, 1, 2, 3, 0, 0, 200, 13, 10]),
  };
  for (const [name, content] of Object.entries(refused)) {
    test(name, async ({ page }) => {
      const w = watch(page);
      await seedProgress(page);
      const before = await page.evaluate((k) => localStorage.getItem(k), KEY);
      const messages = await importFile(page, 'backup.json', content);
      expect(messages.length, 'the learner is told it was refused').toBe(1);
      expect(messages[0]!.length).toBeGreaterThan(5);
      expect(await page.evaluate((k) => localStorage.getItem(k), KEY)).toBe(before);
      await expectHealthyEverywhere(page, w);
    });
  }

  test('a file far bigger than localStorage is refused or accepted, never a crash', async ({ page }) => {
    test.setTimeout(60_000);
    const w = watch(page);
    await seedProgress(page);
    const before = await page.evaluate((k) => localStorage.getItem(k), KEY);
    const huge = wrap(JSON.stringify({ state: { language: 'javascript', drafts: { 'javascript:x-1': 'y'.repeat(14_000_000) } }, version: 5 }));
    const messages = await importFile(page, 'huge.json', huge);
    const after = await page.evaluate((k) => localStorage.getItem(k), KEY);
    if (messages.length > 0) expect(after, 'a refused import keeps the old progress').toBe(before);
    expect(() => JSON.parse(after ?? 'null')).not.toThrow();
    await expectHealthyEverywhere(page, w);
  });
});

test.describe('accepted-but-hostile backup files', () => {
  for (const [name, raw] of Object.entries(PAYLOADS)) {
    test(`imported: ${name}`, async ({ page }) => {
      test.setTimeout(60_000);
      const w = watch(page);
      await seedProgress(page);
      await importFile(page, 'hostile.json', wrap(raw));
      await expectHealthyEverywhere(page, w);
      // Whatever is stored afterwards is still a well-formed save.
      const stored = await page.evaluate((k) => localStorage.getItem(k), KEY);
      if (stored !== null) {
        const parsed = JSON.parse(stored) as { version?: unknown };
        expect(typeof parsed.version).toBe('number');
      }
    });
  }

  test('after prototype-pollution attempts a level can still be completed and saved', async ({ page }) => {
    test.setTimeout(60_000);
    await seedProgress(page);
    await importFile(page, 'proto.json', wrap('{"state":{"language":"javascript","__proto__":{"polluted":"yes"},"completed":{"python":{},"javascript":{"__proto__":{"at":1,"polluted":"yes"}}},"drafts":{"__proto__":"x"}},"version":5}'));
    // Import replaces progress (nothing completed now), so unlock output-1's prerequisite again.
    await seedCompleted(page, 'javascript', ['sequencing']);
    await page.goto('/play/output-1');
    await typeCode(page, 'console.log("Hello, World!");');
    await page.getByRole('button', { name: /✓ Check/ }).click();
    await expect(page.getByRole('dialog')).toContainText('Nice work', { timeout: 30_000 });
    await page.waitForTimeout(600);
    const completed = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!).state.completed, KEY);
    expect(Object.keys(completed).some((lang) => completed[lang]['output-1'])).toBe(true);
    expect(await pristinePrototype(page)).toEqual({ polluted: null, keys: [], pwned: null });
  });
});
