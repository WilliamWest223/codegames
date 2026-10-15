import { expect, type Page } from '@playwright/test';

export async function pickLanguage(page: Page, name: 'Python' | 'JavaScript') {
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
 * Mark every level of the given concepts as completed (ids are `<concept>-<n>`; boss ids
 * equal the concept id). Unknown ids are harmless, so this doesn't need the curriculum.
 */
export async function seedCompleted(page: Page, language: 'python' | 'javascript', conceptIds: string[], at = 1) {
  await page.evaluate(
    ({ language, conceptIds, at }) => {
      const raw = JSON.parse(localStorage.getItem('codegames-progress')!);
      for (const id of conceptIds) {
        const ids = id.startsWith('boss-') ? [id] : Array.from({ length: 12 }, (_, n) => `${id}-${n + 1}`);
        for (const levelId of ids) raw.state.completed[language][levelId] = { at, attempts: 0, hintsUsed: 0, stars: 3 };
      }
      localStorage.setItem('codegames-progress', JSON.stringify(raw));
    },
    { language, conceptIds, at },
  );
}

export const REGION_0 = ['sequencing', 'output', 'comments', 'custom-commands', 'repeat', 'first-errors', 'boss-0'];
export const REGION_1 = ['variables', 'types', 'operators', 'strings-basics', 'string-formatting', 'type-conversion', 'input', 'booleans', 'boss-1'];
export const REGION_2 = ['conditionals', 'else-if-chains', 'while-loops', 'loops', 'loop-control', 'nested-loops', 'boss-2'];
export const REGION_3 = ['functions', 'return-values', 'scope', 'collections', 'iterating-collections', 'strings', 'error-handling', 'boss-3'];
export const REGION_4 = ['maps', 'map-patterns', 'sets', 'nested-data', 'classes', 'methods', 'encapsulation', 'boss-4'];
export const REGION_5 = ['higher-order-functions', 'map-filter-reduce', 'closures', 'recursion', 'recursive-data', 'inheritance', 'polymorphism', 'value-vs-reference', 'boss-5'];
