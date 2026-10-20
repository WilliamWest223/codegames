import { expect, test } from './fixtures';
import { REGION_0, pickLanguage, seedCompleted, typeCode } from './helpers';

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('pages never scroll sideways', async ({ page }) => {
    await pickLanguage(page, 'Python');
    for (const path of ['/', '/play/sequencing-1', '/play/sequencing-2', '/play/sequencing-3']) {
      await page.goto(path);
      if (path !== '/') await page.locator('.cm-content, .parsons').first().waitFor();
      await page.waitForTimeout(500);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });

  test('tapping command chips puts each command on its own line', async ({ page }) => {
    await pickLanguage(page, 'Python');
    await page.goto('/play/sequencing-1');
    for (let i = 0; i < 2; i++) await page.getByRole('button', { name: 'move()' }).tap();
    await page.getByRole('button', { name: 'collect()' }).tap();
    const text = await page.locator('.cm-content').first().innerText();
    expect(text).toMatch(/move\(\)\s*\n\s*move\(\)\s*\n\s*collect\(\)/);
  });
});

test('Play it asks for input instead of feeding an empty line', async ({ page }) => {
  await pickLanguage(page, 'Python');
  await seedCompleted(page, 'python', [...REGION_0, 'variables', 'types', 'operators', 'strings-basics', 'string-formatting', 'type-conversion']);
  await page.goto('/play/input-1');
  await typeCode(page, 'name = input("Name? ")\nprint(f"Hello, {name}!")\n');
  await page.getByRole('button', { name: /Play it/ }).click();
  const input = page.getByLabel('Your program is waiting for input:');
  await expect(input).toBeVisible();
  await expect(page.locator('.play-screen')).toContainText('Name?');
  await input.fill('Ada');
  await input.press('Enter');
  await expect(page.locator('.play-screen')).toContainText('Hello, Ada!');
});

test('boss levels show phases and a health bar', async ({ page }) => {
  await pickLanguage(page, 'JavaScript');
  await seedCompleted(page, 'javascript', [...REGION_0, 'variables', 'types', 'operators', 'strings-basics', 'string-formatting', 'type-conversion', 'input', 'booleans']);
  await page.goto('/play/boss-1');
  await expect(page.locator('.boss-bar')).toContainText('First customer');
  await expect(page.locator('.boss-bar-hp')).toHaveText('100%');
});

test('par and the workshop give rewards meaning', async ({ page }) => {
  await pickLanguage(page, 'JavaScript');
  await page.goto('/play/sequencing-1');
  await expect(page.locator('.game-par')).toContainText('Par');
  await page.getByRole('button', { name: /Menu/ }).click();
  await page.getByRole('button', { name: /Robot workshop/ }).click();
  await expect(page.getByRole('dialog', { name: 'Robot workshop' })).toContainText('Mint');
});
