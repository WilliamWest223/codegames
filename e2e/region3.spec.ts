import { expect, test } from '@playwright/test';
import { REGION_0, REGION_1, REGION_2, REGION_3, pickLanguage, seedCompleted, typeCode } from './helpers';

test('hidden harness tests grade what a function returns, not what it prints', async ({ page }) => {
  await pickLanguage(page, 'Python');
  await seedCompleted(page, 'python', [...REGION_0, ...REGION_1, ...REGION_2, 'functions']);
  await page.goto('/play/return-values-4');
  const program = 'a = float(input())\nb = float(input())\ntotal = price_with_tax(a, 0.2) + price_with_tax(b, 0.2)\nprint(f"Total: ${total:.2f}")\n';
  // Printing instead of returning: the visible test can't even add the results up.
  await typeCode(page, `def price_with_tax(price, rate):\n    print(price * (1 + rate))\n\n${program}`);
  await page.getByRole('button', { name: /Check/ }).click();
  await expect(page.locator('.out-error, .out-tests').first()).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await typeCode(page, `def price_with_tax(price, rate):\n    return price * (1 + rate)\n\n${program}`);
  await page.getByRole('button', { name: /Check/ }).click();
  await expect(page.getByRole('dialog')).toContainText('Nice work');
});

test('Hangman Play it picks a secret word and gives 6 lives', async ({ page }) => {
  await pickLanguage(page, 'JavaScript');
  await seedCompleted(page, 'javascript', [...REGION_0, ...REGION_1, ...REGION_2, ...REGION_3.filter((c) => c !== 'boss-3')]);
  await page.goto('/play/boss-3');
  await expect(page.locator('.boss-bar')).toContainText('Make the mask');
  const solution = [
    'function mask(word, guessed) {',
    '  let result = "";',
    '  for (const ch of word) result += guessed.includes(ch) ? ch + " " : "_ ";',
    '  return result.slice(0, -1);',
    '}',
    'const word = prompt().toLowerCase();',
    'let lives = Number(prompt());',
    'console.log(mask(word, []));',
    'console.log(`Lives: ${lives}`);',
    'prompt();',
  ].join('\n');
  await typeCode(page, solution);
  await page.getByRole('button', { name: /Play it/ }).click();
  await expect(page.locator('.play-screen')).toContainText('Lives: 6');
  await expect(page.locator('.play-screen')).toContainText('_ _');
  // The Hangman screen is drawn from the program's own output.
  await expect(page.locator('.hangman-tile').first()).toBeVisible();
  await expect(page.locator('.hangman-lives .is-full')).toHaveCount(6);
});

test('exit() does not break input() for later runs (round-4 P0)', async ({ page }) => {
  await pickLanguage(page, 'Python');
  await seedCompleted(page, 'python', [...REGION_0, ...REGION_1, ...REGION_2, 'functions', 'return-values', 'scope', 'collections', 'iterating-collections']);
  await page.goto('/play/error-handling-2');
  await typeCode(page, 'while True:\n    text = input()\n    try:\n        age = int(text)\n        exit()\n    except ValueError:\n        print("Please type a whole number")\nprint(f"Next year you\'ll be {age + 1}")\n');
  await page.getByRole('button', { name: /Check/ }).click();
  await expect(page.locator('.out-tests')).toBeVisible();
  await typeCode(page, 'while True:\n    text = input()\n    try:\n        age = int(text)\n        break\n    except ValueError:\n        print("Please type a whole number")\nprint(f"Next year you\'ll be {age + 1}")\n');
  await page.getByRole('button', { name: /Check/ }).click();
  await expect(page.getByRole('dialog')).toContainText('Nice work');
});

test('the boss victory dialog opens on screen after a long level (round-4 student P1)', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await pickLanguage(page, 'Python');
  await seedCompleted(page, 'python', [...REGION_0, ...REGION_1, ...REGION_2, ...REGION_3.filter((c) => c !== 'boss-3')]);
  await page.goto('/play/boss-3');
  const solution = [
    'def mask(word, guessed):',
    '    result = ""',
    '    for ch in word:',
    '        if ch in guessed:',
    '            result += ch + " "',
    '        else:',
    '            result += "_ "',
    '    return result[:-1]',
    '',
    'def is_valid(guess, guessed):',
    '    return len(guess) == 1 and guess not in guessed',
    '',
    'word = input().lower()',
    'try:',
    '    lives = int(input())',
    'except ValueError:',
    '    lives = 6',
    'guessed = []',
    'while lives > 0 and "_" in mask(word, guessed):',
    '    print(mask(word, guessed))',
    '    print(f"Lives: {lives}")',
    '    guess = input().lower()',
    '    if not is_valid(guess, guessed):',
    '        print("Invalid guess")',
    '        continue',
    '    guessed.append(guess)',
    '    if guess not in word:',
    '        lives -= 1',
    'if "_" in mask(word, guessed):',
    '    print(f"You lose! The word was {word}")',
    'else:',
    '    print(f"You win! The word was {word}")',
  ].join('\n');
  await typeCode(page, solution);
  await page.getByRole('button', { name: /Check/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 20_000 });
  const box = await dialog.boundingBox();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(720);
  await expect(page.locator('.boss-bar')).toContainText('Boss defeated');
});

test('two open tabs do not wipe each other\'s progress (round-5 P1)', async ({ context }) => {
  const a = await context.newPage();
  await pickLanguage(a, 'JavaScript');
  const b = await context.newPage();
  await b.goto('/play/sequencing-2');
  await b.locator('.cm-content').first().waitFor();
  await a.goto('/play/sequencing-1');
  await typeCode(a, 'move();\nmove();\nmove();\ncollect();\n');
  await a.getByRole('button', { name: /Run robot/ }).click();
  await expect(a.getByRole('dialog')).toBeVisible({ timeout: 15_000 });
  // Tab B keeps working (typing saves progress) after tab A's completion.
  await b.locator('.cm-content').first().click();
  await b.keyboard.insertText('// hi\n');
  await b.waitForTimeout(800);
  const saved = await b.evaluate(() => JSON.parse(localStorage.getItem('codegames-progress')!).state.completed.javascript);
  expect(Object.keys(saved)).toContain('sequencing-1');
});
