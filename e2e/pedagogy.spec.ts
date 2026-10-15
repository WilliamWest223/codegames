import { expect, test } from '@playwright/test';
import { pickLanguage, typeCode } from './helpers';

test('step through shows each line, the variables and the output so far', async ({ page }) => {
  await pickLanguage(page, 'JavaScript');
  await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('codegames-progress')!);
    for (const id of ['sequencing-1', 'sequencing-2', 'sequencing-3']) raw.state.completed.javascript[id] = { at: 1, attempts: 0, hintsUsed: 0, stars: 3 };
    localStorage.setItem('codegames-progress', JSON.stringify(raw));
  });
  await page.goto('/play/output-1');
  await typeCode(page, 'let total = 0;\nfor (let i = 1; i <= 2; i++) {\n  total += i;\n}\nconsole.log(total);\n');
  await page.getByRole('button', { name: /Step through/ }).click();
  const steps = page.locator('.steps');
  await expect(steps).toContainText('line 1 runs next');
  await page.getByRole('button', { name: /Next/ }).click();
  await expect(steps.locator('.steps-vars')).toContainText('total');
  await page.getByRole('button', { name: 'Last step' }).click();
  await expect(steps).toContainText('finished');
  await expect(steps.locator('.steps-out')).toContainText('3');
});

test('early predictions are multiple choice: a wrong pick is ruled out, the right one passes', async ({ page }) => {
  await pickLanguage(page, 'Python');
  await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('codegames-progress')!);
    const ids = ['sequencing-1', 'sequencing-2', 'sequencing-3', 'output-1', 'output-2', 'output-3', 'output-4'];
    for (const id of ids) raw.state.completed.python[id] = { at: 1, attempts: 0, hintsUsed: 0, stars: 3 };
    localStorage.setItem('codegames-progress', JSON.stringify(raw));
  });
  await page.goto('/play/comments-1');
  await page.locator('.predict-choice', { hasText: 'But not me' }).click();
  await expect(page.locator('.predict-choice.is-out')).toHaveCount(1);
  await page.locator('.predict-choice:not(.is-out)', { hasText: /^You can see me\s*Comments are for humans\s*$/ }).click();
  await expect(page.getByRole('dialog')).toContainText('Nice work');
});

test('after two failed checks a write-code level offers the puzzle version; repeated errors get a refresher', async ({ page }) => {
  await pickLanguage(page, 'Python');
  await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('codegames-progress')!);
    for (const id of ['sequencing-1', 'sequencing-2', 'sequencing-3']) raw.state.completed.python[id] = { at: 1, attempts: 0, hintsUsed: 0, stars: 3 };
    localStorage.setItem('codegames-progress', JSON.stringify(raw));
  });
  await page.goto('/play/output-1');
  await expect(page.getByRole('button', { name: /Try it as a puzzle/ })).toHaveCount(0);
  for (let i = 0; i < 3; i++) {
    await typeCode(page, `prnt("Hello, World!")\n${'#'.repeat(i)}\n`);
    await page.getByRole('button', { name: /Check/ }).click();
    await expect(page.locator('.out-tests')).toBeVisible();
  }
  // Third NameError in a row: a short refresher appears.
  await expect(page.locator('.out-refresher')).toContainText('NameError #3');
  // Its practice bug hunt (Reading Errors) is still locked, so no link yet.
  await expect(page.locator('.out-refresher-practice')).toHaveCount(0);
  await page.getByRole('button', { name: /Try it as a puzzle/ }).click();
  await expect(page.locator('.puzzle-banner')).toBeVisible();
  await page.locator('.parsons-line').first().click();
  await page.getByRole('button', { name: /Check/ }).click();
  await expect(page.getByRole('dialog')).toContainText('Nice work');
});

test('a one-sentence reflection after a level shows up in the journal', async ({ page }) => {
  await pickLanguage(page, 'JavaScript');
  await page.getByRole('link', { name: /Start here/ }).click();
  await typeCode(page, 'move();\nmove();\nmove();\ncollect();\n');
  await page.getByRole('button', { name: /Run robot/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Nice work');
  await dialog.getByRole('textbox').fill('The robot walks three steps and grabs the gem.');
  await dialog.getByRole('button', { name: 'Stay here' }).click();
  await page.locator('.shell-belt').click();
  await expect(page.getByRole('heading', { name: 'What you can do' })).toBeVisible();
  await expect(page.locator('.journal-notes')).toContainText('three steps');
});
