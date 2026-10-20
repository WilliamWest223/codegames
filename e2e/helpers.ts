import { expect, type Page } from '@playwright/test';
import { levels } from '@codegames/curriculum';
import { autoPassGate } from './fixtures';

export async function pickLanguage(page: Page, name: 'Python' | 'JavaScript' | 'Cybersecurity') {
  autoPassGate(page); // goto('/') lands on the launch gate; the wrapper clicks through it
  await page.goto('/');
  await page.getByRole('button', { name: new RegExp(`Start with ${name}`) }).click();
  await expect(page.getByRole('heading', { name: 'World Map' })).toBeVisible();
}

/** Replace the editor contents (first CodeMirror on the page) with `code`. */
export async function typeCode(page: Page, code: string, editorIndex = 0) {
  const editor = page.locator('.cm-content').nth(editorIndex);
  await editor.click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.press('Delete');
  // insertText avoids auto-indent and bracket auto-closing while "typing".
  await page.keyboard.insertText(code);
}

/**
 * Mark every level of the given concepts as completed. Only real level ids: the app's
 * sanitize drops unknown ones on its next save, which would read as "progress changed".
 */
export async function seedCompleted(page: Page, language: 'python' | 'javascript' | 'cybersecurity', conceptIds: string[], at = 1_600_000_000_000) {
  const ids = levels.filter((l) => conceptIds.includes(l.conceptId)).map((l) => l.id);
  await page.evaluate(
    ({ language, ids, at }) => {
      const raw = JSON.parse(localStorage.getItem('codegames-progress')!);
      for (const levelId of ids) raw.state.completed[language][levelId] = { at, attempts: 0, hintsUsed: 0, stars: 3 };
      localStorage.setItem('codegames-progress', JSON.stringify(raw));
    },
    { language, ids, at },
  );
}

export const REGION_0 = ['sequencing', 'output', 'comments', 'custom-commands', 'repeat', 'first-errors', 'boss-0'];
export const REGION_1 = ['variables', 'types', 'operators', 'strings-basics', 'string-formatting', 'type-conversion', 'input', 'booleans', 'boss-1'];
export const REGION_2 = ['conditionals', 'else-if-chains', 'while-loops', 'loops', 'loop-control', 'nested-loops', 'boss-2'];
export const REGION_3 = ['functions', 'return-values', 'scope', 'collections', 'iterating-collections', 'strings', 'error-handling', 'boss-3'];
export const REGION_4 = ['maps', 'map-patterns', 'sets', 'nested-data', 'classes', 'methods', 'encapsulation', 'boss-4'];
export const REGION_5 = ['higher-order-functions', 'map-filter-reduce', 'closures', 'recursion', 'recursive-data', 'inheritance', 'polymorphism', 'value-vs-reference', 'boss-5'];
