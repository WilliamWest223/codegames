import { expect, test } from './fixtures';
import type { Page } from '@playwright/test';
import { levels } from '@codegames/curriculum';
import { REGION_0, REGION_1, REGION_2, REGION_3, pickLanguage, seedCompleted, typeCode } from './helpers';

// Security moved from a Python/JavaScript side quest to its own Cybersecurity track (de88b04).
// That track runs learner code as Python.
const THROUGH_BOSS_3 = [...REGION_0, ...REGION_1, ...REGION_2, ...REGION_3];
const BEFORE_VAULT = ['encoding', 'ciphers', 'passwords', 'input-validation'];

const vault = levels.find((l) => l.id === 'boss-security');
const VAULT_PY = vault?.game === 'build-it' ? vault.solution.python! : '';

async function command(page: Page, text: string) {
  await page.getByLabel('Your program is waiting for input:').fill(text);
  await page.getByRole('button', { name: /Enter/ }).click();
}

test('Python never shows security concepts, even after boss-3, and Region 4 opens', async ({ page }) => {
  await pickLanguage(page, 'Python');
  await seedCompleted(page, 'python', THROUGH_BOSS_3);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'World Map' })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Side quests' })).toHaveCount(0);
  await expect(page.getByText('Letters Are Numbers')).toHaveCount(0);
  await expect(page.locator('.map-region:not(.is-side-quest) .map-region-number', { hasText: '04' })).toBeVisible();
});

test('the Cybersecurity track opens on encoding, with the rules of the range', async ({ page }) => {
  await pickLanguage(page, 'Cybersecurity');
  await expect(page.getByRole('complementary', { name: 'Rules of the range' })).toContainText('Cyber Range');
  await expect(page.locator('.map-continue')).toContainText('Letters Are Numbers');
  await page.goto('/play/ciphers-1');
  await expect(page.getByRole('heading', { name: /locked/ })).toBeVisible();
});

test('encoding-1 is multiple choice: a wrong pick is ruled out, the right one passes', async ({ page }) => {
  await pickLanguage(page, 'Cybersecurity');
  await page.goto('/play/encoding-1');
  await page.locator('.predict-choice', { hasText: /^65\s*65\s*Hi/ }).click();
  await expect(page.locator('.predict-choice.is-out')).toHaveCount(1);
  await page.locator('.predict-choice:not(.is-out)', { hasText: /^65\s*97\s*Hi\s*1\s*d\s*$/ }).click();
  await expect(page.getByRole('dialog')).toContainText('Nice work');
});

test('beating the Vault adds the Security patch without changing the belt', async ({ page }) => {
  expect(VAULT_PY).toContain('check_login');
  await pickLanguage(page, 'Cybersecurity');
  await seedCompleted(page, 'cybersecurity', BEFORE_VAULT);
  await page.reload();
  const beltBefore = await page.locator('.shell-rank').textContent();
  await expect(page.locator('.shell-belt')).not.toHaveAttribute('title', /Security patch/);

  await page.goto('/play/boss-security');
  await typeCode(page, VAULT_PY);
  await page.getByRole('button', { name: /Check/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('codegames-progress')!).state.completed.cybersecurity['boss-security']))
    .toBeTruthy();

  await page.goto('/');
  await expect(page.locator('.shell-rank')).toHaveText(beltBefore ?? '');
  await expect(page.locator('.shell-belt')).toHaveAttribute('title', /Security patch/);
  await page.goto('/journal');
  await expect(page.locator('.journal-patch')).toContainText('Security patch');
});

test('Play it on the Vault lets you log in to your own vault', async ({ page }) => {
  await pickLanguage(page, 'Cybersecurity');
  await seedCompleted(page, 'cybersecurity', BEFORE_VAULT);
  await page.goto('/play/boss-security');
  await typeCode(page, VAULT_PY);
  await page.getByRole('button', { name: /Play it/ }).click();
  await expect(page.getByRole('region', { name: 'Play your program' })).toContainText('Try logging in');
  await command(page, 'ana wrong1');
  await expect(page.locator('.play-screen')).toContainText('Access denied (2 tries left).');
  await command(page, 'ana open4sesame');
  await expect(page.locator('.play-screen')).toContainText('Welcome, ana. The vault opens.');
  await expect(page.locator('.play-screen')).toContainText('the treasure is under the old oak');
});
