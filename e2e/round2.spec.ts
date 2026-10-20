import { expect, test } from './fixtures';
import { REGION_0, REGION_1, pickLanguage, seedCompleted, typeCode } from './helpers';

const REGION_2_BEFORE_BOSS = ['conditionals', 'else-if-chains', 'while-loops', 'loops', 'loop-control', 'nested-loops'];

test('pressing Ctrl+Enter twice on a first clear still celebrates with XP', async ({ page }) => {
  await pickLanguage(page, 'Python');
  await seedCompleted(page, 'python', ['sequencing']);
  await page.goto('/play/output-1');
  await typeCode(page, 'print("Hello, World!")\n');
  await page.keyboard.press('ControlOrMeta+Enter');
  await page.keyboard.press('ControlOrMeta+Enter');
  await expect(page.getByRole('dialog')).toContainText('+10 XP');
});

test('the robot celebration waits until the replay ends', async ({ page }) => {
  await pickLanguage(page, 'JavaScript');
  await page.goto('/play/sequencing-1');
  await typeCode(page, 'move();\nmove();\nmove();\ncollect();\n');
  await page.getByRole('button', { name: /Run robot/ }).click();
  await page.getByRole('button', { name: /Pause/ }).click();
  await page.waitForTimeout(1500);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: /Play/ }).click();
  await expect(page.getByRole('dialog')).toContainText('Nice work');
});

test('test results point at the first differing character', async ({ page }) => {
  await pickLanguage(page, 'Python');
  await seedCompleted(page, 'python', ['sequencing']);
  await page.goto('/play/output-1');
  await typeCode(page, 'print("Hello,World!")\n');
  await page.getByRole('button', { name: /Check/ }).click();
  await expect(page.locator('.out-diff')).toContainText('character 7');
  await expect(page.locator('.out-diff')).toContainText('a space');
});

test('a missing } points at the opening brace', async ({ page }) => {
  await pickLanguage(page, 'JavaScript');
  await seedCompleted(page, 'javascript', ['sequencing']);
  await page.goto('/play/custom-commands-2');
  await typeCode(page, 'function turnRight() {\n  turnLeft();\n  turnLeft();\n  turnLeft();\n\nmove();\nturnRight();\n');
  await page.getByRole('button', { name: /Run robot/ }).click();
  await expect(page.locator('.out-error')).toContainText('line 1');
  await expect(page.locator('.out-error')).toContainText('never closed');
});

test('the guessing game boss can be played interactively', async ({ page }) => {
  await pickLanguage(page, 'Python');
  await seedCompleted(page, 'python', [...REGION_0, ...REGION_1, ...REGION_2_BEFORE_BOSS]);
  await page.goto('/play/boss-2');
  await typeCode(
    page,
    'secret = int(input())\ntries = 0\nwhile tries < 5:\n    guess = int(input())\n    tries += 1\n    if guess < secret:\n        print("Too low")\n    elif guess > secret:\n        print("Too high")\n    else:\n        print("Correct!")\n        break\n',
  );
  await page.getByRole('button', { name: /Play it/ }).click();
  const input = page.getByLabel('Your program is waiting for input:');
  await input.fill('0');
  await input.press('Enter');
  await expect(page.locator('.play-screen')).toContainText('Too low');
});

test('glossary opens from the header and lists every term (unlocked glossary, de88b04)', async ({ page }) => {
  await pickLanguage(page, 'Python');
  await page.getByRole('button', { name: /Glossary/ }).click();
  await expect(page.getByRole('dialog', { name: 'Glossary' })).toContainText('Command');
  await expect(page.getByRole('dialog', { name: 'Glossary' })).toContainText('Off-by-one');
});

test('switching language keeps the map unlocked for concepts practiced elsewhere', async ({ page }) => {
  await pickLanguage(page, 'Python');
  await seedCompleted(page, 'python', REGION_0);
  await page.goto('/play/variables-1');
  await expect(page.getByRole('heading', { name: 'Name Tags' })).toBeVisible();
  await page.getByRole('radio', { name: 'JavaScript' }).click();
  await expect(page.getByRole('heading', { name: 'Name Tags' })).toBeVisible();
});
