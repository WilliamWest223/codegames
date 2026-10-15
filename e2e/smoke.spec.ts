import { expect, test } from '@playwright/test';
import { pickLanguage, typeCode } from './helpers';

test('first run: welcome → map → first robot level (JavaScript)', async ({ page }) => {
  await pickLanguage(page, 'JavaScript');
  await page.getByRole('link', { name: /Start here/ }).click();
  await expect(page.getByRole('heading', { name: 'First Steps' })).toBeVisible();
  await typeCode(page, 'move();\nmove();\nmove();\ncollect();\n');
  await page.getByRole('button', { name: /Run robot/ }).click();
  await expect(page.getByRole('dialog')).toContainText('+10 XP');
  await expect(page.locator('.shell-belt')).toHaveAttribute('title', /10 XP/);
});

test('Python runs in the browser and grades build-it tests', async ({ page }) => {
  await pickLanguage(page, 'Python');
  // Seed progress so Region 0's output concept is open.
  await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('codegames-progress')!);
    raw.state.completed.python = { 'sequencing-1': { at: 1, attempts: 0, hintsUsed: 0 }, 'sequencing-2': { at: 1, attempts: 0, hintsUsed: 0 }, 'sequencing-3': { at: 1, attempts: 0, hintsUsed: 0 } };
    localStorage.setItem('codegames-progress', JSON.stringify(raw));
  });
  await page.goto('/play/output-1');
  await expect(page.getByRole('heading', { name: 'Hello, World!' })).toBeVisible();
  await typeCode(page, 'print("Hello, world")\n');
  await page.getByRole('button', { name: /Check/ }).click();
  await expect(page.locator('.out-tests')).toContainText('0/1 passed');
  await typeCode(page, 'print("Hello, World!")\n');
  await page.getByRole('button', { name: /Check/ }).click();
  await expect(page.getByRole('dialog')).toContainText('Nice work');
});

test('errors are explained with a line number (Python)', async ({ page }) => {
  await pickLanguage(page, 'Python');
  await page.goto('/play/sequencing-1');
  await typeCode(page, 'move()\nmuve()\n');
  await page.getByRole('button', { name: /Run robot/ }).click();
  await expect(page.locator('.out-error')).toContainText('NameError');
  await expect(page.locator('.out-error')).toContainText('line 2');
});

test('infinite loops time out and the engine recovers (JavaScript)', async ({ page }) => {
  await pickLanguage(page, 'JavaScript');
  await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('codegames-progress')!);
    raw.state.completed.javascript = { 'sequencing-1': { at: 1, attempts: 0, hintsUsed: 0 }, 'sequencing-2': { at: 1, attempts: 0, hintsUsed: 0 }, 'sequencing-3': { at: 1, attempts: 0, hintsUsed: 0 } };
    localStorage.setItem('codegames-progress', JSON.stringify(raw));
  });
  await page.goto('/play/output-1');
  await typeCode(page, 'while (true) {}\n');
  await page.getByRole('button', { name: /Check/ }).click();
  await expect(page.locator('.out-tests')).toContainText('Took too long');
  await typeCode(page, 'console.log("Hello, World!");\n');
  await page.getByRole('button', { name: /Check/ }).click();
  await expect(page.getByRole('dialog')).toContainText('Nice work');
});

test('locked levels explain what is needed', async ({ page }) => {
  await pickLanguage(page, 'Python');
  await page.goto('/play/boss-2');
  await expect(page.getByRole('heading', { name: /locked/ })).toBeVisible();
});

test('a Python infinite loop is interrupted in place, without reloading Python', async ({ page }) => {
  await pickLanguage(page, 'Python');
  expect(await page.evaluate(() => crossOriginIsolated)).toBe(true);
  await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('codegames-progress')!);
    raw.state.completed.python = { 'sequencing-1': { at: 1, attempts: 0, hintsUsed: 0 }, 'sequencing-2': { at: 1, attempts: 0, hintsUsed: 0 }, 'sequencing-3': { at: 1, attempts: 0, hintsUsed: 0 } };
    localStorage.setItem('codegames-progress', JSON.stringify(raw));
  });
  await page.goto('/play/output-1');
  await typeCode(page, 'while True:\n    pass\n');
  await page.getByRole('button', { name: /Check/ }).click();
  await expect(page.locator('.out-tests')).toContainText('Took too long', { timeout: 20_000 });
  // The worker survived: no "Loading Python" and the next run answers quickly.
  await typeCode(page, 'print("Hello, World!")\n');
  const start = Date.now();
  await page.getByRole('button', { name: /Check/ }).click();
  await expect(page.getByRole('dialog')).toContainText('Nice work');
  expect(Date.now() - start).toBeLessThan(2500);
});
