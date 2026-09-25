// Pravi sliku igre za landing (bez UI-ja):
//   games/<slug>/cover.jpg  1200x900  — kartica (default)
//   games/<slug>/hero.jpg   1600x700  — široki hero, pokreni sa SHOT=hero
// Pokretanje (iz root-a repoa, dok radi `python3 -m http.server 8765`):
//   npx -y -p playwright-core node .claude/skills/browser-games/scripts/cover.mjs <slug> [hideSelectors] [actions]
// hideSelectors: CSS selektori UI elemenata koje treba sakriti, odvojeni zarezom
// actions: niz koraka odvojen sa ";" — click:<selektor> | key:<taster>:<ms> | wait:<ms>
import { chromium } from 'playwright-core';

const [slug, hide = '', actions = 'wait:3000'] = process.argv.slice(2);
if (!slug) { console.error('usage: cover.mjs <slug> [hideSelectors] [actions]'); process.exit(1); }

const browser = await chromium.launch({
  executablePath: process.env.CHROME || '/usr/bin/google-chrome',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const SIZES = { cover: [1200, 900], hero: [1600, 700] };
const shot = process.env.SHOT || 'cover';
const [width, height] = SIZES[shot];
const page = await browser.newPage({ viewport: { width, height } });
page.on('pageerror', e => console.log('pageerror:', e.message));
// QUERY: optional URL params, e.g. QUERY='?auto&sim=1500&bot' to shoot a developed game
await page.goto(`http://localhost:${process.env.PORT || 8765}/games/${slug}/index.html${process.env.QUERY || ''}`);
await page.waitForTimeout(2500);

for (const step of actions.split(';').filter(Boolean)) {
  const [cmd, arg, ms] = step.split(':');
  if (cmd === 'click') await page.click(arg);
  else if (cmd === 'wait') await page.waitForTimeout(Number(arg));
  else if (cmd === 'key') { await page.keyboard.down(arg); await page.waitForTimeout(Number(ms || 500)); await page.keyboard.up(arg); }
}

await page.addStyleTag({ content: `#gameroom-back${hide ? ',' + hide : ''}{opacity:0!important;pointer-events:none!important}` });
await page.waitForTimeout(200);
const path = `games/${slug}/${shot}.jpg`;
await page.screenshot({ path, type: 'jpeg', quality: 82 });
console.log('saved', path);
await browser.close();
