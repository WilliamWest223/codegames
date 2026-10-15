import { chromium } from '@playwright/test';
// Captures screenshots of key screens for design review and audits.
// Usage: npm run screenshots -- <output-dir>   (expects `vite preview` on :4173)
const out = process.argv[2] ?? "screenshots";
import { mkdirSync } from "node:fs";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1360, height: 900 } });
const base = 'http://localhost:4173';
await page.goto(base);
await page.waitForTimeout(1200);
await page.screenshot({ path: `${out}/01-welcome.png` });
await page.getByRole('button', { name: /Start with Python/ }).click();
// seed some progress for a richer map
await page.evaluate(() => {
  const raw = JSON.parse(localStorage.getItem('codegames-progress'));
  const done = ['sequencing-1','sequencing-2','sequencing-3','output-1','output-2','output-3','custom-commands-1','comments-1'];
  raw.state.completed.python = Object.fromEntries(done.map((id) => [id, { at: 1, attempts: 0, hintsUsed: 0 }]));
  raw.state.xp = 95;
  localStorage.setItem('codegames-progress', JSON.stringify(raw));
});
await page.goto(base + '/?concept=custom-commands');
await page.waitForTimeout(800);
await page.screenshot({ path: `${out}/02-map.png`, fullPage: true });
await page.goto(base + '/play/custom-commands-2');
await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/03-grid.png`, fullPage: true });
await page.goto(base + '/play/sequencing-3');
await page.waitForTimeout(800);
for (let i = 0; i < 4; i++) await page.locator('.parsons-line').first().click();
await page.screenshot({ path: `${out}/04-parsons.png`, fullPage: true });
await page.goto(base + '/play/comments-1');
await page.waitForTimeout(2500);
await page.locator('textarea').fill('You can see me\nBut not me');
await page.getByRole('button', { name: /Check prediction/ }).click();
await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/05-predict.png`, fullPage: true });
await page.goto(base + '/play/output-3');
await page.waitForTimeout(2000);
await page.getByRole('button', { name: /Check/ }).click();
await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/06-buildit.png`, fullPage: true });
// Warm-up card + legend (seed a whole region as practiced)
await page.evaluate(() => {
  const raw = JSON.parse(localStorage.getItem('codegames-progress'));
  for (const c of ['sequencing','output','comments','custom-commands','repeat','first-errors']) for (const n of [1,2,3]) raw.state.completed.python[`${c}-${n}`] = { at: 1, attempts: 0, hintsUsed: 0, stars: 3 };
  raw.state.completed.python['boss-0'] = { at: 1, attempts: 0, hintsUsed: 0, stars: 2 };
  localStorage.setItem('codegames-progress', JSON.stringify(raw));
});
await page.goto(base + '/');
await page.waitForTimeout(600);
await page.getByText('How the map works').click();
await page.screenshot({ path: `${out}/08-map-warmup-legend.png` });
// Robot run paused mid-way, with the running line highlighted
await page.goto(base + '/play/repeat-3');
await page.waitForTimeout(1500);
await page.locator('.cm-content').first().click();
await page.keyboard.press('ControlOrMeta+A');
await page.keyboard.press('Delete');
await page.keyboard.insertText('def turn_right():\n    turn_left()\n    turn_left()\n    turn_left()\n\nfor i in range(4):\n    move()\n    turn_left()\n    move()\n    turn_right()\n    collect()\n');
await page.getByRole('button', { name: /Run robot/ }).click();
await page.waitForTimeout(2200);
await page.getByRole('button', { name: /Pause/ }).click();
await page.screenshot({ path: `${out}/09-robot-paused.png` });
await page.getByRole('button', { name: /Play/ }).click();
await page.waitForTimeout(6000);
await page.screenshot({ path: `${out}/10-complete-stars.png` });
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(base + '/');
await page.waitForTimeout(800);
await page.screenshot({ path: `${out}/07-mobile-map.png`, fullPage: true });
await browser.close();
