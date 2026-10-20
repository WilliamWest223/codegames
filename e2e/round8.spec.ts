import { expect, test } from './fixtures';
import { REGION_0, REGION_1, REGION_2, REGION_3, REGION_4, REGION_5, pickLanguage, seedCompleted } from './helpers';

const EVERYTHING = [...REGION_0, ...REGION_1, ...REGION_2, ...REGION_3, ...REGION_4, ...REGION_5];

/** Round-8 P2: these puzzles' long code lines made the whole page scroll sideways. */
for (const id of ['map-filter-reduce-2', 'nested-data-3', 'ciphers-1', 'inheritance-2']) {
  test(`${id} never scrolls sideways at 375px or 1360px`, async ({ page }) => {
    // ciphers-1 lives in the Cybersecurity track since de88b04; it needs encoding done there.
    const cyber = id === 'ciphers-1';
    await pickLanguage(page, cyber ? 'Cybersecurity' : 'JavaScript');
    await seedCompleted(page, cyber ? 'cybersecurity' : 'javascript', cyber ? ['encoding'] : EVERYTHING);
    for (const width of [1360, 375]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(`/play/${id}`);
      await expect(page.locator('.parsons')).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${id} at ${width}px`).toBeLessThanOrEqual(1);
    }
  });
}
