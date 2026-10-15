import { expect, type Page } from '@playwright/test';
import { levels } from '@codegames/curriculum';
import type { CodeLevel } from '@codegames/shared';
import { REGION_0, REGION_1, REGION_2, REGION_3, REGION_4, pickLanguage, seedCompleted, typeCode } from '../helpers';

export { pickLanguage, seedCompleted, typeCode };

export type Lang = 'python' | 'javascript';
export const LANG_NAME = { python: 'Python', javascript: 'JavaScript' } as const;

/** A plain free-form code level (no boss, no input): the playground for learner code. */
export const FREE_LEVEL = levels.find((l): l is CodeLevel => l.game === 'build-it' && l.conceptId === 'variables' && l.role !== 'boss')!.id;

export const BEFORE_BOSS_3 = [...REGION_0, ...REGION_1, ...REGION_2, ...REGION_3.filter((c) => c !== 'boss-3')];
export const BEFORE_BOSS_4 = [...REGION_0, ...REGION_1, ...REGION_2, ...REGION_3, ...REGION_4.filter((c) => c !== 'boss-4')];

export const RUN = /▶ Run/;

/** Pick the language, then open a level with every earlier region marked completed. */
export async function openLevel(page: Page, lang: Lang, id = FREE_LEVEL) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear()); // a fresh learner, even when a test switches language
  await pickLanguage(page, LANG_NAME[lang]);
  await seedCompleted(page, lang, [...REGION_0, ...REGION_1]);
  await page.goto(`/play/${id}`);
  await expect(page.locator('.cm-content').first()).toBeVisible();
}

/** Type code and press Run; wait until the Run button is enabled again. Returns the output text. */
export async function runCode(page: Page, code: string, timeout = 40_000): Promise<string> {
  await typeCode(page, code);
  await page.getByRole('button', { name: RUN }).click();
  await expect(page.getByRole('button', { name: RUN })).toBeEnabled({ timeout });
  await page.waitForTimeout(300);
  return (await page.locator('.game-output').innerText()).replace(/\s+/g, ' ');
}

/** After an abusive run, the very next run in the same page (no reload) must work. */
export async function expectRecovers(page: Page, lang: Lang) {
  const out = await runCode(page, lang === 'python' ? 'print(6 * 7)' : 'console.log(6 * 7)', 60_000);
  expect(out).toContain('42');
}

/** Record dialogs (alert/confirm/prompt), page errors and outbound requests. */
export function watch(page: Page) {
  const dialogs: string[] = [];
  const pageErrors: string[] = [];
  const outbound: string[] = [];
  page.on('dialog', (d) => {
    dialogs.push(`${d.type()}: ${d.message()}`);
    void d.dismiss();
  });
  page.on('pageerror', (e) => pageErrors.push(e.message));
  page.context().on('request', (r) => {
    const url = r.url();
    if (!url.startsWith('http://localhost:4173') && !url.startsWith('data:') && !url.startsWith('blob:')) outbound.push(url);
  });
  return { dialogs, pageErrors, outbound };
}

export const crashedScreen = (page: Page) => page.getByText('Oops, the game tripped over itself');

/** Progress as stored (or null when nothing is stored). */
export const stored = (page: Page) =>
  page.evaluate(() => {
    const raw = localStorage.getItem('codegames-progress');
    return raw ? (JSON.parse(raw) as { state: Record<string, unknown>; version: number }) : null;
  });

/** Is the level recorded as completed for the language? */
export const isCompleted = (page: Page, lang: Lang, id: string) =>
  page.evaluate(({ lang, id }) => !!JSON.parse(localStorage.getItem('codegames-progress')!).state.completed[lang][id], { lang, id });

/** Remove a completion, so a fake pass would be visible. */
export async function uncomplete(page: Page, lang: Lang, id: string) {
  await page.evaluate(({ lang, id }) => {
    const raw = JSON.parse(localStorage.getItem('codegames-progress')!);
    delete raw.state.completed[lang][id];
    localStorage.setItem('codegames-progress', JSON.stringify(raw));
  }, { lang, id });
}

/** The cheapest level to fake: one visible test, expected output "Hello, World!". */
export const GRADED_LEVEL = 'output-1';

/** Open `output-1` for a learner who has NOT completed it yet (so a fake pass would show). */
export async function openUngraded(page: Page, lang: Lang) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await pickLanguage(page, LANG_NAME[lang]);
  await seedCompleted(page, lang, REGION_0.filter((c) => c !== 'output'));
  await page.goto(`/play/${GRADED_LEVEL}`);
  await expect(page.locator('.cm-content').first()).toBeVisible();
}

/**
 * Press Check and wait for a verdict (the "Nice work" dialog or the "n/m PASSED" panel),
 * then a moment longer so a late forged message would have landed. Returns whether it passed.
 */
export async function check(page: Page): Promise<{ passed: boolean; text: string }> {
  await page.getByRole('button', { name: /✓ Check/ }).click();
  await page.getByRole('dialog').or(page.getByText(/\d+\/\d+ passed/i)).first().waitFor({ timeout: 60_000 });
  await page.waitForTimeout(1_200);
  const passed = await page.getByRole('dialog').filter({ hasText: /Nice work|LEVEL COMPLETE/ }).isVisible();
  return { passed, text: (await page.locator('.game').innerText()).replace(/\s+/g, ' ') };
}

/** The code that solves `output-1` honestly (the control: Check can pass when it should). */
export const HONEST: Record<Lang, string> = { python: 'print("Hello, World!")', javascript: 'console.log("Hello, World!");' };

/** Saved progress without the editor drafts (which legitimately change as the learner types). */
export async function coreProgress(page: Page) {
  const saved = await stored(page);
  const { drafts: _drafts, ...rest } = (saved?.state ?? {}) as Record<string, unknown>;
  return rest;
}
