import { expect, test } from './fixtures';
import type { Page } from '@playwright/test';
import { REGION_0, pickLanguage, seedCompleted, typeCode } from './helpers';

type Saved = { completed: Record<string, Record<string, { stars?: number }>>; hints: Record<string, number>; drafts: Record<string, string> };

async function saved(page: Page): Promise<Saved> {
  return page.evaluate(() => JSON.parse(localStorage.getItem('codegames-progress')!).state);
}

test('after a pass with the answer hint, "Try it again from scratch" resets help and a clean solve earns 3 stars', async ({ page }) => {
  await pickLanguage(page, 'Python');
  await seedCompleted(page, 'python', ['sequencing']);
  await page.goto('/play/output-1');
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: /hint/i }).click();
  await typeCode(page, 'print("Hello, World!")');
  await page.getByRole('button', { name: /Check/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('2 of 3 stars')).toBeVisible();

  await dialog.getByRole('button', { name: /Try it again from scratch/ }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('.hint')).toHaveCount(0);
  await expect(page.locator('.cm-content')).toContainText('# Print Hello, World!');
  const reset = await saved(page);
  expect(reset.completed.python['output-1']?.stars).toBe(2);
  expect(reset.hints['python:output-1']).toBeUndefined();

  await typeCode(page, 'print("Hello, World!")');
  await page.getByRole('button', { name: /Check/ }).click();
  await expect(page.getByRole('dialog').getByLabel('3 of 3 stars')).toBeVisible();
  // Three stars: nothing left to retry.
  await expect(page.getByRole('button', { name: /Try it again from scratch/ })).toHaveCount(0);
  await page.waitForTimeout(400);
  expect((await saved(page)).completed.python['output-1']?.stars).toBe(3);
});

test('when the puzzle version fails twice too, a similar worked example appears', async ({ page }) => {
  await pickLanguage(page, 'Python');
  await seedCompleted(page, 'python', [...REGION_0, 'variables', 'types', 'operators']);
  await page.goto('/play/strings-basics-2');
  for (let i = 0; i < 2; i++) {
    await typeCode(page, `print("A.L.")${'#'.repeat(i)}\n`);
    await page.getByRole('button', { name: /Check/ }).click();
    await expect(page.locator('.out-blocked, .out-tests').first()).toBeVisible();
  }
  await page.getByRole('button', { name: /Try it as a puzzle/ }).click();

  const example = page.locator('.parallel-example');
  await page.locator('.parsons-line', { hasText: 'print(' }).click();
  await page.getByRole('button', { name: /Check/ }).click();
  await expect(page.locator('.out-tests')).toBeVisible();
  await expect(example).toHaveCount(0);
  await page.getByRole('button', { name: /Check/ }).click();
  await expect(example).toBeVisible();
  await example.getByText('See a similar problem, worked out').click();
  await expect(example.locator('.cm-content')).toContainText('city[0]');
});

test('a repeated-error refresher links to a bug hunt that practices the fix once it is unlocked', async ({ page }) => {
  await pickLanguage(page, 'Python');
  await seedCompleted(page, 'python', ['sequencing', 'output', 'custom-commands']);
  await page.goto('/play/output-1');
  for (let i = 0; i < 3; i++) {
    await typeCode(page, `prnt("Hello, World!")\n${'#'.repeat(i)}\n`);
    await page.getByRole('button', { name: /Check/ }).click();
    await expect(page.locator('.out-tests')).toBeVisible();
  }
  const link = page.locator('.out-refresher-practice');
  await expect(link).toContainText('Spelling Counts');
  await link.click();
  await expect(page).toHaveURL(/\/play\/first-errors-2$/);
});

test('a correct prediction leads to Investigate questions, then Modify', async ({ page }) => {
  await pickLanguage(page, 'Python');
  await seedCompleted(page, 'python', [...REGION_0, 'variables', 'types']);
  await page.goto('/play/operators-4');
  await page.getByLabel(/What will it print/).fill('14\n20\n3\n6');
  await page.getByRole('button', { name: /Check prediction/ }).click();

  const investigate = page.getByRole('region', { name: 'Investigate the code' });
  await expect(investigate.getByText('Step 2 · Investigate (1 of 2)')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Modify the code' })).toHaveCount(0);
  await investigate.locator('.investigate-choice', { hasText: 'right to left' }).click();
  await expect(investigate.locator('.investigate-choice.is-out')).toHaveCount(1);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await investigate.locator('.investigate-choice', { hasText: 'brackets go first of all' }).click();

  await expect(investigate.getByText('Step 2 · Investigate (2 of 2)')).toBeVisible();
  await expect(investigate.locator('.investigate-choice.is-out')).toHaveCount(0);
  await investigate.locator('.investigate-choice', { hasText: 'left to right' }).click();
  await expect(investigate.getByText('You worked out why')).toBeVisible();
  await expect(page.getByText('Step 3 · Modify')).toBeVisible();
});
