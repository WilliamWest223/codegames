import { expect, test } from './fixtures';
import { levels } from '@codegames/curriculum';
import { REGION_0, REGION_1, REGION_2, REGION_3, REGION_4, REGION_5, pickLanguage, seedCompleted, typeCode } from './helpers';

const THROUGH_BOSS_4 = [...REGION_0, ...REGION_1, ...REGION_2, ...REGION_3, ...REGION_4];
const BEFORE_BOSS_5 = [...THROUGH_BOSS_4, ...REGION_5.filter((c) => c !== 'boss-5')];

const boss5 = levels.find((l) => l.id === 'boss-5');
const BOSS_5_JS = boss5?.game === 'build-it' ? boss5.solution.javascript! : '';

test('Region 5 stays locked until the Text Adventure is beaten', async ({ page }) => {
  await pickLanguage(page, 'Python');
  await seedCompleted(page, 'python', THROUGH_BOSS_4.filter((c) => c !== 'boss-4'));
  await page.goto('/play/higher-order-functions-1');
  await expect(page.getByRole('heading', { name: /locked/ })).toBeVisible();

  await seedCompleted(page, 'python', ['boss-4']);
  await page.goto('/play/higher-order-functions-1');
  await expect(page.getByRole('heading', { name: 'Pick One' })).toBeVisible();
});

test('recursion-1: a right pick, then Step through shows the waiting calls on the call stack', async ({ page }) => {
  await pickLanguage(page, 'Python');
  await seedCompleted(page, 'python', THROUGH_BOSS_4);
  await page.goto('/play/recursion-1');
  await page.locator('.predict-choice', { hasText: /Liftoff!\s*back in 1\s*back in 2\s*back in 3\s*$/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Nice work');
  await dialog.getByRole('button', { name: 'Stay here' }).click();

  await page.getByRole('button', { name: /Watch it run, step by step/ }).click();
  const slider = page.getByRole('slider', { name: 'Step' });
  await expect(slider).toBeVisible();
  // Step forward until more than one call is active.
  for (let i = 0; i < 40 && (await page.locator('.steps-stack').count()) === 0; i++) await page.getByRole('button', { name: /Next/ }).click();
  await expect(page.locator('.steps-stack')).toBeVisible();
  await expect(page.locator('.steps-frame.is-current')).toContainText('running');
  await expect(page.locator('.steps-frame:not(.is-current)').first()).toContainText('waiting');
});

test('beating Minesweeper earns the Orange belt', async ({ page }) => {
  expect(BOSS_5_JS.length).toBeGreaterThan(0);
  await pickLanguage(page, 'JavaScript');
  await seedCompleted(page, 'javascript', BEFORE_BOSS_5);
  await page.reload();
  await expect(page.locator('.shell-belt')).toHaveAttribute('title', /Yellow belt/);

  await page.goto('/play/boss-5');
  await typeCode(page, BOSS_5_JS);
  await page.getByRole('button', { name: /Check/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(600);

  await page.goto('/');
  await expect(page.locator('.shell-belt')).toHaveAttribute('title', /Orange belt/);
});
