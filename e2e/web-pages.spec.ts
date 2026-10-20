import { expect, test } from './fixtures';
import { levels } from '@codegames/curriculum';
import { REGION_0, REGION_1, REGION_2, REGION_3, REGION_4, pickLanguage, seedCompleted, typeCode } from './helpers';

const THROUGH_BOSS_4 = [...REGION_0, ...REGION_1, ...REGION_2, ...REGION_3, ...REGION_4];

const counter = levels.find((l) => l.id === 'dom-events-1');
const COUNTER_JS = counter?.game === 'build-it' ? counter.solution.javascript! : '';

test('Web Pages: the click counter passes, and Play it draws a page that reacts to clicks', async ({ page }) => {
  expect(COUNTER_JS.length).toBeGreaterThan(0);
  await pickLanguage(page, 'JavaScript');
  await seedCompleted(page, 'javascript', [...THROUGH_BOSS_4, 'dom-elements']);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Side Quest: Web Pages' })).toBeVisible();
  await expect(page.getByText('On the horizon')).toHaveCount(0);

  await page.goto('/play/dom-events-1');
  await typeCode(page, COUNTER_JS);
  await page.getByRole('button', { name: /Check/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Nice work', { timeout: 20_000 });
  await dialog.getByRole('button', { name: 'Stay here' }).click();

  await page.getByRole('button', { name: /Play it/ }).click();
  const preview = page.locator('.page-preview');
  await expect(preview).toContainText('Clicks: 0');
  await preview.getByRole('button', { name: '+1' }).click();
  await preview.getByRole('button', { name: '+1' }).click();
  await expect(preview).toContainText('Clicks: 2');
  await preview.getByRole('button', { name: 'Reset' }).click();
  await expect(preview).toContainText('Clicks: 0');
});

test('Web Pages is JavaScript only: Python never shows it', async ({ page }) => {
  await pickLanguage(page, 'Python');
  await seedCompleted(page, 'python', THROUGH_BOSS_4);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Side Quest: Web Pages' })).toHaveCount(0);
  await page.goto('/play/dom-events-1');
  await expect(page.getByRole('heading', { name: /locked/ })).toHaveCount(0);
});
