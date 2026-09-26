import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 200, height: 200 } });
page.on('pageerror', e => console.log('[pageerror]', e.message));
await page.goto(`${process.env.GAME_URL || 'http://localhost:8766/games/pilana-tajkun/index.html'}?auto`, { waitUntil: 'load' });
const out = await page.evaluate((n) => {
  const lines = []; let prev = '';
  for (let i = 0; i < n; i++) {
    const d = window.__step(1, 0.1);
    const key = JSON.stringify([d.trucks.map(t=>t[0]), d.forks]);
    if (key !== prev) { lines.push(d.time.toFixed(1) + ' ' + key + ' stock ' + d.stock + ' money ' + Math.floor(d.money) + ' loaded ' + d.trucks.map(t=>t[1])); prev = key; }
  }
  return lines;
}, +(process.argv[2] || 1500));
console.log(out.join('\n'));
await browser.close();
