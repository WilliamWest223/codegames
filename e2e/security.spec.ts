import { expect, test, type Page } from '@playwright/test';
import { levels } from '@codegames/curriculum';
import { REGION_0, REGION_1, REGION_2, REGION_3, pickLanguage, seedCompleted, typeCode } from './helpers';

const THROUGH_BOSS_3 = [...REGION_0, ...REGION_1, ...REGION_2, ...REGION_3];
const BEFORE_BOSS_3 = THROUGH_BOSS_3.filter((c) => c !== 'boss-3');
const BEFORE_VAULT = [...THROUGH_BOSS_3, 'encoding', 'ciphers', 'passwords', 'input-validation'];

const vault = levels.find((l) => l.id === 'boss-security');
const VAULT_JS = vault?.game === 'build-it' ? vault.solution.javascript! : '';

async function command(page: Page, text: string) {
  await page.getByLabel('Your program is waiting for input:').fill(text);
  await page.getByRole('button', { name: /Enter/ }).click();
}

test('the security side quest stays hidden until boss-3 is beaten', async ({ page }) => {
  await pickLanguage(page, 'Python');
  await seedCompleted(page, 'python', BEFORE_BOSS_3);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'World Map' })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Side quests' })).toHaveCount(0);
  await expect(page.getByText('Side Quest: Security')).toHaveCount(0);
});

test('after boss-3 the side quest appears as optional, next to the open Region 4', async ({ page }) => {
  await pickLanguage(page, 'Python');
  await seedCompleted(page, 'python', THROUGH_BOSS_3);
  await page.reload();
  const side = page.getByRole('group', { name: 'Side quests' });
  await expect(side).toBeVisible();
  await expect(side).toContainText('optional');
  await expect(side.getByRole('heading', { name: 'Side Quest: Security' })).toBeVisible();
  await expect(side.getByRole('complementary', { name: 'Rules of the range' })).toContainText('permission');
  // Region 4 is open too: the side quest never blocks the core path.
  await expect(page.locator('.map-region:not(.is-side-quest) .map-region-number', { hasText: '04' })).toBeVisible();
  await expect(page.locator('.map-region.is-side-quest')).toHaveCount(1);
});

test('encoding-1 is multiple choice: a wrong pick is ruled out, the right one passes', async ({ page }) => {
  await pickLanguage(page, 'Python');
  await seedCompleted(page, 'python', THROUGH_BOSS_3);
  await page.goto('/play/encoding-1');
  await page.locator('.predict-choice', { hasText: /^65\s*65\s*Hi/ }).click();
  await expect(page.locator('.predict-choice.is-out')).toHaveCount(1);
  await page.locator('.predict-choice:not(.is-out)', { hasText: /^65\s*97\s*Hi\s*1\s*d\s*$/ }).click();
  await expect(page.getByRole('dialog')).toContainText('Nice work');
});

test('beating the Vault adds the Security patch without changing the belt', async ({ page }) => {
  expect(VAULT_JS).toContain('checkLogin');
  await pickLanguage(page, 'JavaScript');
  await seedCompleted(page, 'javascript', BEFORE_VAULT);
  await page.reload();
  const beltBefore = await page.locator('.shell-rank').textContent();
  await expect(page.locator('.shell-belt')).not.toHaveAttribute('title', /Security patch/);

  await page.goto('/play/boss-security');
  await typeCode(page, VAULT_JS);
  await page.getByRole('button', { name: /Check/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.waitForTimeout(600);
  const completed = await page.evaluate(() => JSON.parse(localStorage.getItem('codegames-progress')!).state.completed.javascript);
  expect(completed['boss-security']).toBeTruthy();

  await page.goto('/');
  await expect(page.locator('.shell-rank')).toHaveText(beltBefore ?? '');
  await expect(page.locator('.shell-belt')).toHaveAttribute('title', /Security patch/);
  await page.goto('/journal');
  await expect(page.locator('.journal-patch')).toContainText('Security patch');
});

test('Play it on the Vault lets you log in to your own vault', async ({ page }) => {
  await pickLanguage(page, 'JavaScript');
  await seedCompleted(page, 'javascript', BEFORE_VAULT);
  await page.goto('/play/boss-security');
  await typeCode(page, VAULT_JS);
  await page.getByRole('button', { name: /Play it/ }).click();
  await expect(page.getByRole('region', { name: 'Play your program' })).toContainText('Try logging in');
  await command(page, 'ana wrong1');
  await expect(page.locator('.play-screen')).toContainText('Access denied (2 tries left).');
  await command(page, 'ana open4sesame');
  await expect(page.locator('.play-screen')).toContainText('Welcome, ana. The vault opens.');
  await expect(page.locator('.play-screen')).toContainText('the treasure is under the old oak');
});
