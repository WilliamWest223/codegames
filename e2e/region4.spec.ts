import { expect, test } from './fixtures';
import { REGION_0, REGION_1, REGION_2, REGION_3, REGION_4, pickLanguage, seedCompleted, typeCode } from './helpers';

test('Region 4 unlocks after Hangman and accepts object predictions typed any way', async ({ page }) => {
  await pickLanguage(page, 'JavaScript');
  await seedCompleted(page, 'javascript', [...REGION_0, ...REGION_1, ...REGION_2, ...REGION_3]);
  await page.goto('/');
  await expect(page.getByText('Modeling')).toBeVisible();
  await page.goto('/play/maps-1');
  // JavaScript prints `{ apple: 4, bread: 5, milk: 2 }`; a learner's spacing and quotes may differ.
  await page.getByLabel(/What will it print/).fill('3\n4\n3\ntrue\n{apple:4, "bread": 5,milk: 2}\nundefined');
  await page.getByRole('button', { name: /Check/ }).click();
  await expect(page.getByRole('dialog')).toContainText('Nice work');
});

test('the Text Adventure boss shows its phases', async ({ page }) => {
  await pickLanguage(page, 'Python');
  await seedCompleted(page, 'python', [...REGION_0, ...REGION_1, ...REGION_2, ...REGION_3, ...REGION_4.filter((c) => c !== 'boss-4')]);
  await page.goto('/play/boss-4');
  await expect(page.locator('.boss-bar')).toContainText('Build the player');
  // Play it draws the adventure screen from the program's own output.
  await typeCode(page, 'print("You are in the hall. Exits: north, east. Items: lamp")\ninput()\n');
  await page.getByRole('button', { name: /Play it/ }).click();
  await expect(page.locator('.adventure h3')).toHaveText('hall');
  await expect(page.locator('.adventure-dir.is-open')).toHaveCount(2);
});

test('opened hints survive a reload, so they still count against stars (round-6 student P1)', async ({ page }) => {
  await pickLanguage(page, 'JavaScript');
  await page.goto('/play/sequencing-1');
  await page.getByRole('button', { name: /Get a hint/ }).click();
  await expect(page.getByRole('button', { name: /Another hint/ })).toBeVisible();
  await page.waitForTimeout(300);
  await page.reload();
  await expect(page.getByRole('button', { name: /Another hint/ })).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('codegames-progress')!).state.hints);
  expect(saved['javascript:sequencing-1']).toBe(1);
});
