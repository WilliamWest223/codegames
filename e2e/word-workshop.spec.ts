import { expect, test } from './fixtures';
import type { Page } from '@playwright/test';
import { levels } from '@codegames/curriculum';
import { REGION_0, REGION_1, REGION_2, REGION_3, pickLanguage, seedCompleted, typeCode } from './helpers';

const BEFORE_BOSS_3 = [...REGION_0, ...REGION_1, ...REGION_2, ...REGION_3.filter((c) => c !== 'boss-3')];
const WORDS_DRAFT = 'hangman-word-builder';
const boss3 = levels.find((l) => l.id === 'boss-3');
const BOSS_SOLUTION = boss3 && 'solution' in boss3 ? boss3.solution : {};

const ONE_WORD_JS = 'const words = ["cat"];\nconst startLives = 2;';

type Saved = { xp: number; completed: Record<string, Record<string, unknown>>; drafts: Record<string, string> };

async function saved(page: Page): Promise<Saved> {
  return page.evaluate(() => JSON.parse(localStorage.getItem('codegames-progress')!).state);
}

async function guess(page: Page, letter: string) {
  await page.getByLabel('Your program is waiting for input:').fill(letter);
  await page.getByRole('button', { name: /Enter/ }).click();
}

test('the word workshop is locked until Hangman is beaten in that language', async ({ page }) => {
  await pickLanguage(page, 'Python');
  await seedCompleted(page, 'python', BEFORE_BOSS_3);
  await page.goto('/play/boss-3?mode=words');
  await expect(page.getByRole('heading', { name: /Make your own word list is locked/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Play with your words/ })).toHaveCount(0);
  await page.getByRole('link', { name: /Back to Hangman/ }).click();
  await expect(page).toHaveURL(/\/play\/boss-3$/);
});

test('beating Hangman opens a word workshop that plays your words and never touches progress', async ({ page }) => {
  await pickLanguage(page, 'JavaScript');
  await seedCompleted(page, 'javascript', BEFORE_BOSS_3);
  await page.goto('/play/boss-3');
  await typeCode(page, BOSS_SOLUTION.javascript!);
  await page.getByRole('button', { name: /Check/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await page.waitForTimeout(600);
  const afterBoss = await saved(page);
  expect(afterBoss.completed.javascript!['boss-3']).toBeTruthy();

  await dialog.getByRole('link', { name: /Make your own word list/ }).click();
  await expect(page).toHaveURL(/\/play\/boss-3\?mode=words$/);
  await expect(page.getByRole('heading', { name: 'Make your own word list' })).toBeVisible();
  await expect(page.locator('.creator .chip')).toHaveText('JavaScript');
  await expect(page.locator('.cm-content')).toContainText('const words = [');
  await expect(page.getByRole('button', { name: /Check/ })).toHaveCount(0);

  await typeCode(page, ONE_WORD_JS);
  await page.getByRole('button', { name: /Play with your words/ }).click();
  await expect(page.locator('.hangman-tile')).toHaveCount(3);
  await expect(page.locator('.hangman-lives .is-full')).toHaveCount(2);
  await guess(page, 'c');
  await guess(page, 'x');
  await expect(page.locator('.hangman-lives .is-full')).toHaveCount(1);
  await guess(page, 'a');
  await guess(page, 't');
  await expect(page.locator('.play-screen')).toContainText('You win! The word was cat');

  await page.waitForTimeout(600);
  const afterPlay = await saved(page);
  expect(afterPlay.drafts[`javascript:${WORDS_DRAFT}`]).toBe(ONE_WORD_JS);
  expect(afterPlay.completed).toEqual(afterBoss.completed);
  expect(afterPlay.xp).toBe(afterBoss.xp);

  await page.reload();
  await expect(page.locator('.cm-content')).toContainText('"cat"');
  await page.getByRole('button', { name: /Reset words/ }).click();
  await expect(page.locator('.cm-content')).toContainText('galaxy');
});

test('a broken word list shows the usual error box, and the workshop fits a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await pickLanguage(page, 'Python');
  await seedCompleted(page, 'python', [...BEFORE_BOSS_3, 'boss-3']);
  await page.goto('/play/boss-3?mode=words');
  await expect(page.getByRole('heading', { name: 'Make your own word list' })).toBeVisible();
  await expect(page.locator('.creator-editor')).toContainText('start_lives');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Download my-words\.py/ }).click()]);
  expect(download.suggestedFilename()).toBe('my-words.py');

  await typeCode(page, 'start_lives = 6\nwords = ["moon", "star"\n');
  await page.getByRole('button', { name: /Play with your words/ }).click();
  const error = page.locator('.play .out-error');
  await expect(error).toBeVisible();
  await expect(error).toContainText('line 2');

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
