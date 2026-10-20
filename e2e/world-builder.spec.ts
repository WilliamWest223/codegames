import { readFileSync } from 'node:fs';
import { expect, test } from './fixtures';
import type { Page } from '@playwright/test';
import { ADVENTURE_WORLD, adventureWithWorld } from '@codegames/curriculum';
import { REGION_0, REGION_1, REGION_2, REGION_3, REGION_4, pickLanguage, seedCompleted, typeCode } from './helpers';

/** The boss's reference solution: the default world plus the engine. */
const ADVENTURE = adventureWithWorld(ADVENTURE_WORLD);

const BEFORE_BOSS_4 = [...REGION_0, ...REGION_1, ...REGION_2, ...REGION_3, ...REGION_4.filter((c) => c !== 'boss-4')];
const WORLD_DRAFT = 'adventure-world-builder';

const CUSTOM_JS = 'const rooms = {\n  hall: { exits: { down: "cellar" }, items: ["torch"] },\n  cellar: { exits: { up: "hall" }, items: ["crown"] },\n};';

type Saved = { xp: number; completed: Record<string, Record<string, unknown>>; drafts: Record<string, string> };

async function saved(page: Page): Promise<Saved> {
  return page.evaluate(() => JSON.parse(localStorage.getItem('codegames-progress')!).state);
}

async function command(page: Page, text: string) {
  await page.getByLabel('Your program is waiting for input:').fill(text);
  await page.getByRole('button', { name: /Enter/ }).click();
}

test('the world builder is locked until the Text Adventure is beaten in that language', async ({ page }) => {
  await pickLanguage(page, 'Python');
  await seedCompleted(page, 'python', BEFORE_BOSS_4);
  await page.goto('/play/boss-4?mode=world');
  await expect(page.getByRole('heading', { name: /Build your own world is locked/ })).toBeVisible();
  await expect(page.locator('.cm-content')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Play your world/ })).toHaveCount(0);
  await page.getByRole('link', { name: /Back to Text Adventure/ }).click();
  await expect(page.locator('.boss-bar')).toBeVisible();
});

test('beating the boss opens a separate world builder that never touches progress', async ({ page }) => {
  await pickLanguage(page, 'JavaScript');
  await seedCompleted(page, 'javascript', BEFORE_BOSS_4);
  await page.goto('/play/boss-4');
  await typeCode(page, ADVENTURE.javascript!);
  await page.getByRole('button', { name: /Check/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await page.waitForTimeout(600);
  const afterBoss = await saved(page);
  expect(afterBoss.completed.javascript!['boss-4']).toBeTruthy();
  expect(afterBoss.drafts['javascript:boss-4']).toBe(ADVENTURE.javascript);

  await dialog.getByRole('link', { name: /Build your own world/ }).click();
  await expect(page).toHaveURL(/\/play\/boss-4\?mode=world$/);
  await expect(page.getByRole('heading', { name: 'Build your own world' })).toBeVisible();
  await expect(page.locator('.creator .chip')).toHaveText('JavaScript');
  await expect(page.locator('.cm-content')).toContainText('const rooms = {');
  // A creative sandbox: nothing to check, so nothing to grade or reward.
  await expect(page.getByRole('button', { name: /Check/ })).toHaveCount(0);

  await typeCode(page, CUSTOM_JS);
  await page.getByRole('button', { name: /Play your world/ }).click();
  await expect(page.locator('.adventure h3')).toHaveText('hall');
  await expect(page.locator('.play-screen')).toContainText('Exits: down. Items: torch');
  await command(page, 'go down');
  await expect(page.locator('.adventure h3')).toHaveText('cellar');
  await command(page, 'take crown');
  await expect(page.locator('.play-screen')).toContainText('You win! Rooms explored: 2');

  await page.waitForTimeout(600);
  const afterPlay = await saved(page);
  expect(afterPlay.drafts[`javascript:${WORLD_DRAFT}`]).toBe(CUSTOM_JS);
  expect(afterPlay.drafts['javascript:boss-4']).toBe(ADVENTURE.javascript);
  expect(afterPlay.completed).toEqual(afterBoss.completed);
  expect(afterPlay.xp).toBe(afterBoss.xp);

  // The world survives a refresh, and Reset brings back the starter world.
  await page.reload();
  await expect(page.locator('.cm-content')).toContainText('cellar');
  await page.getByRole('button', { name: /Reset world/ }).click();
  await expect(page.locator('.cm-content')).toContainText('kitchen');
  await expect(page.locator('.cm-content')).not.toContainText('cellar');
  await page.waitForTimeout(600);
  const afterReset = await saved(page);
  // The editor echoes the restored starter through onChange, so it may be saved as the draft.
  expect(afterReset.drafts[`javascript:${WORLD_DRAFT}`] ?? ADVENTURE_WORLD.javascript).toBe(ADVENTURE_WORLD.javascript);
  expect(afterReset.drafts['javascript:boss-4']).toBe(ADVENTURE.javascript);
  await page.reload();
  await expect(page.locator('.cm-content')).toContainText('kitchen');
});

test('the world builder follows the selected language and keeps each draft separate', async ({ page }) => {
  await pickLanguage(page, 'JavaScript');
  await seedCompleted(page, 'javascript', [...BEFORE_BOSS_4, 'boss-4']);
  await seedCompleted(page, 'python', [...BEFORE_BOSS_4, 'boss-4']);
  await page.goto('/play/boss-4?mode=world');
  await typeCode(page, CUSTOM_JS);
  await page.waitForTimeout(600);

  // Switching language while the workshop is open loads that language's own world.
  await page.getByRole('radio', { name: 'Python' }).click();
  await expect(page.locator('.creator .chip')).toHaveText('Python');
  await expect(page.locator('.cm-content')).toContainText('rooms = {');
  await expect(page.locator('.cm-content')).not.toContainText('cellar');
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+End');
  await page.keyboard.insertText('\n# my python world');
  await page.getByRole('button', { name: /Play your world/ }).click();
  await expect(page.locator('.adventure h3')).toHaveText('hall');

  await page.waitForTimeout(600);
  const state = await saved(page);
  expect(state.drafts[`javascript:${WORLD_DRAFT}`]).toBe(CUSTOM_JS);
  const python = state.drafts[`python:${WORLD_DRAFT}`] ?? '';
  expect(python.startsWith('rooms = {')).toBe(true);
  expect(python).toContain('# my python world');
  expect(python).not.toContain('cellar');
});

test('a world can be downloaded as a file and opened again (locally, size-capped)', async ({ page }) => {
  await pickLanguage(page, 'JavaScript');
  await seedCompleted(page, 'javascript', [...BEFORE_BOSS_4, 'boss-4']);
  await page.goto('/play/boss-4?mode=world');
  await typeCode(page, CUSTOM_JS);

  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Download my-world\.js/ }).click()]);
  expect(download.suggestedFilename()).toBe('my-world.js');
  const path = await download.path();
  expect(readFileSync(path, 'utf8')).toBe(CUSTOM_JS);

  await page.getByRole('button', { name: /Reset world/ }).click();
  await expect(page.locator('.cm-content')).not.toContainText('cellar');
  await page.getByLabel('Open a file').setInputFiles(path);
  await expect(page.locator('.cm-content')).toContainText('cellar');
  await page.getByRole('button', { name: /Play your world/ }).click();
  await expect(page.locator('.adventure h3')).toHaveText('hall');
  await expect(page.locator('.play-screen')).toContainText('Exits: down. Items: torch');

  await page.getByLabel('Open a file').setInputFiles({ name: 'huge.js', mimeType: 'text/javascript', buffer: Buffer.alloc(60_000, 'a') });
  await expect(page.getByRole('alert')).toContainText('too big');
  await expect(page.locator('.cm-content')).toContainText('cellar');
});

test('a broken world shows the usual error box, and the workshop fits a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await pickLanguage(page, 'Python');
  await seedCompleted(page, 'python', [...BEFORE_BOSS_4, 'boss-4']);
  await page.goto('/play/boss-4?mode=world');
  await expect(page.getByRole('heading', { name: 'Build your own world' })).toBeVisible();

  await typeCode(page, 'rooms = {\n    "hall": {"exits": {}, "items": [}\n}');
  await page.getByRole('button', { name: /Play your world/ }).click();
  const error = page.locator('.play .out-error');
  await expect(error).toBeVisible();
  await expect(error).toContainText('SyntaxError');
  await expect(error).toContainText('line 2');

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
