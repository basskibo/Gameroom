import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('pageerror', e => console.log('[pageerror]', e.message));
await page.goto(`${process.env.GAME_URL || 'http://localhost:8766/games/pilana-tajkun/index.html'}`, { waitUntil: 'load' });
await page.waitForFunction(() => !!window.__debug, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#startBtn');
await page.evaluate(() => window.__cam(-24, -15, 30));
await page.waitForTimeout(1500);
// find screen pos of saw pad
const pos = await page.evaluate(() => {
  const r = document.querySelector('canvas').getBoundingClientRect();
  return window.__padScreen ? window.__padScreen('saw') : null;
});
console.log('padScreen', pos);
const before = await page.evaluate(() => window.__debug());
console.log('money', before.money, 'saw lv', before.lv.saw);
if (pos) { await page.mouse.click(pos[0], pos[1]); await page.waitForTimeout(800); }
const after = await page.evaluate(() => window.__debug());
console.log('after money', after.money, 'saw lv', after.lv.saw);
// drag test
const c0 = await page.evaluate(() => window.__camInfo());
await page.mouse.move(700, 400); await page.mouse.down(); await page.mouse.move(600, 380, { steps: 5 }); await page.mouse.move(400, 350, { steps: 5 }); await page.mouse.up();
await page.waitForTimeout(500);
const c1 = await page.evaluate(() => window.__camInfo());
console.log('cam before', c0, 'after drag', c1);
await page.mouse.wheel(0, 400); await page.waitForTimeout(500);
console.log('after wheel', await page.evaluate(() => window.__camInfo()));
await page.click('#nav button[data-go="bridge"]'); await page.waitForTimeout(1500);
console.log('after nav', await page.evaluate(() => window.__camInfo()));
await browser.close();
