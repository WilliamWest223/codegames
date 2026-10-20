import { test as base, expect, type BrowserContext, type Page } from '@playwright/test';

const PATCHED = Symbol('gate-patched');

/** Click through the mandatory launch gate if it is showing (it renders on every full page load). */
export async function passGate(page: Page) {
  const start = page.getByRole('button', { name: /Start playing/ });
  try {
    await start.waitFor({ state: 'visible', timeout: 5_000 });
  } catch {
    return; // no gate (already past it, or not a full load)
  }
  await start.click();
  await start.waitFor({ state: 'detached' });
}

/** Make goto/reload on this page pass the gate automatically. Idempotent. */
export function autoPassGate<P extends Page>(page: P): P {
  const p = page as P & { [PATCHED]?: boolean };
  if (p[PATCHED]) return page;
  p[PATCHED] = true;
  for (const method of ['goto', 'reload'] as const) {
    const original = page[method].bind(page) as (...a: unknown[]) => Promise<unknown>;
    (page as unknown as Record<string, unknown>)[method] = async (...args: unknown[]) => {
      const res = await original(...args);
      await passGate(page);
      return res;
    };
  }
  return page;
}

export const test = base.extend({
  context: async ({ context }, use) => {
    context.on('page', (p) => autoPassGate(p));
    await use(context);
  },
  page: async ({ page }, use) => {
    await use(autoPassGate(page));
  },
});

/** For pages created outside the fixtures (e.g. `browser.newPage()` / `browser.newContext()`). */
export function guardContext(context: BrowserContext) {
  context.on('page', (p) => autoPassGate(p));
  for (const p of context.pages()) autoPassGate(p);
  return context;
}

export { expect };
