import { expect, test } from '@playwright/test';
import { REGION_0, REGION_1, pickLanguage, seedCompleted, typeCode } from './helpers';

test('a failed robot run followed by Reset code does not crash the page', async ({ page }) => {
  await pickLanguage(page, 'Python');
  await page.goto('/play/sequencing-1');
  await typeCode(page, 'move()\nmove()\nmove()\nmove()\nmove()\n');
  await page.getByRole('button', { name: /Run robot/ }).click();
  await expect(page.locator('.board-bad')).toContainText('Bonk', { timeout: 15_000 });
  await page.getByRole('button', { name: /Reset code/ }).click();
  await expect(page.getByRole('heading', { name: 'First Steps' })).toBeVisible();
  await expect(page.locator('.board')).toBeVisible();
});

test('robot steps highlight the running line, and Step works', async ({ page }) => {
  await pickLanguage(page, 'JavaScript');
  await page.goto('/play/sequencing-1');
  await typeCode(page, 'move();\nmove();\nmove();\ncollect();\n');
  await page.getByRole('button', { name: /Run robot/ }).click();
  await page.getByRole('button', { name: /Pause/ }).click();
  await page.getByRole('button', { name: 'Step forward' }).click();
  await expect(page.locator('.cm-run-line')).toHaveCount(1);
});

test('Python input("question") passes the input levels', async ({ page }) => {
  await pickLanguage(page, 'Python');
  await seedCompleted(page, 'python', [...REGION_0, 'variables', 'types', 'operators', 'strings-basics', 'string-formatting', 'type-conversion']);
  await page.goto('/play/input-1');
  await typeCode(page, 'name = input("What is your name? ")\nprint(f"Hello, {name}!")\n');
  await page.getByRole('button', { name: /Check/ }).click();
  await expect(page.getByRole('dialog')).toContainText('Nice work');
});

test('JS errors are explained for JavaScript, with a line number', async ({ page }) => {
  await pickLanguage(page, 'JavaScript');
  await seedCompleted(page, 'javascript', ['sequencing']);
  await page.goto('/play/output-1');
  await typeCode(page, '// greeting\nconsole.Log("Hello, World!");\n');
  await page.getByRole('button', { name: '▶ Run' }).click();
  await expect(page.locator('.out-error')).toContainText('console.log');
  await expect(page.locator('.out-error')).not.toContainText('Python');
  await expect(page.locator('.out-error')).toContainText('line 2');
});

test('predict levels continue with a Modify step', async ({ page }) => {
  await pickLanguage(page, 'Python');
  await seedCompleted(page, 'python', ['sequencing']);
  await page.goto('/play/output-2');
  await page.getByRole('button', { name: /rather type it/ }).click();
  await page.locator('textarea').fill('3\n2\n1\n\nLiftoff!');
  await page.getByRole('button', { name: /Check prediction/ }).click();
  await expect(page.getByText('Step 2 · Modify')).toBeVisible();
  await typeCode(page, 'for n in ["5", "4", "3", "2", "1"]:\n    print(n)\nprint()\nprint("Liftoff!")\n', 1);
  await page.getByRole('button', { name: /Check my change/ }).click();
  await expect(page.getByRole('dialog')).toContainText('Nice work');
});

test('warm-ups appear after practicing concepts and record reviews', async ({ page }) => {
  await pickLanguage(page, 'Python');
  await seedCompleted(page, 'python', REGION_0);
  await page.reload();
  await page.getByRole('link', { name: /Warm-up/ }).click();
  await expect(page.getByText('Can you still do it?')).toBeVisible();
  await expect(page.locator('.review-progress span')).toHaveCount(3);
});

test('missing brackets on a robot command get a helpful warning', async ({ page }) => {
  await pickLanguage(page, 'Python');
  await page.goto('/play/sequencing-2');
  await typeCode(page, 'move()\nmove()\nturn_left\nmove()\n');
  await page.getByRole('button', { name: /Run robot/ }).click();
  await expect(page.locator('.out-warnings')).toContainText('turn_left()');
});

test('the map explains its labels', async ({ page }) => {
  await pickLanguage(page, 'Python');
  await page.getByText('How the map works').click();
  await expect(page.locator('.map-legend')).toContainText('Proficient');
});

test.describe('regions', () => {
  test('Region 1 unlocks after the Region 0 boss', async ({ page }) => {
    await pickLanguage(page, 'JavaScript');
    await seedCompleted(page, 'javascript', REGION_0);
    await page.goto('/play/variables-1');
    await expect(page.getByRole('heading', { name: 'Name Tags' })).toBeVisible();
    void REGION_1;
  });
});
