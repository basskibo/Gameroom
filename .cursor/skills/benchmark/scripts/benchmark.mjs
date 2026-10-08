// Benchmark jedne ili više Gameroom igara u Chrome-u.
//   node .cursor/skills/benchmark/scripts/benchmark.mjs <slug> [slug...] [--seconds 8] [--mobile] [--query '?auto'] [--actions 'click:#x;wait:500'] [--no-start] [--swiftshader]
// Ispisuje JSON niz rezultata na stdout. Log ide na stderr.
import { existsSync, readdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const gamesDir = resolve(root, 'games');

let chromium;
try {
  ({ chromium } = await import('playwright-core'));
} catch {
  ({ chromium } = await import(pathToFileURL(resolve(root, '.cache/tools/node_modules/playwright-core/index.mjs')).href));
}

function usage() {
  console.error('usage: benchmark.mjs <slug> [slug...] [--seconds 8] [--mobile] [--query ?auto] [--actions click:#startBtn;wait:500] [--no-start] [--swiftshader]');
  process.exit(1);
}

function parseArgs(argv) {
  const slugs = [];
  const opt = { seconds: 8, mobile: false, query: '', actions: '', start: true, swiftshader: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--seconds' || a === '--duration') opt.seconds = Number(argv[++i]);
    else if (a === '--mobile') opt.mobile = true;
    else if (a === '--query') opt.query = argv[++i] || '';
    else if (a === '--actions') opt.actions = argv[++i] || '';
    else if (a === '--no-start') opt.start = false;
    else if (a === '--swiftshader') opt.swiftshader = true;
    else if (a.startsWith('--')) usage();
    else slugs.push(a);
  }
  if (!slugs.length || !Number.isFinite(opt.seconds) || opt.seconds <= 0) usage();
  return { slugs, opt };
}

function resolveSlug(name) {
  const dirs = readdirSync(gamesDir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
  if (dirs.includes(name)) return name;
  const hit = dirs.filter(d => d.includes(name) || name.includes(d));
  if (hit.length === 1) return hit[0];
  throw new Error(hit.length
    ? `slug "${name}" nije jedinstven: ${hit.join(', ')}`
    : `nema igre "${name}". poznate: ${dirs.join(', ')}`);
}

async function runActions(page, actions) {
  for (const step of actions.split(';').filter(Boolean)) {
    const [cmd, arg, ms] = step.split(':');
    if (cmd === 'click') await page.click(arg, { timeout: 4000 });
    else if (cmd === 'wait') await page.waitForTimeout(Number(arg));
    else if (cmd === 'key') {
      await page.keyboard.down(arg);
      await page.waitForTimeout(Number(ms || 400));
      await page.keyboard.up(arg);
    } else if (cmd === 'eval') await page.evaluate(arg);
  }
}

async function benchOne(browser, slug, opt) {
  const errors = [];
  const viewport = opt.mobile
    ? { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }
    : { width: 1280, height: 800 };
  const page = await browser.newPage({ viewport });
  page.on('pageerror', e => errors.push(String(e.message || e).slice(0, 240)));
  const file = resolve(gamesDir, slug, 'index.html');
  if (!existsSync(file)) throw new Error(`nema ${file}`);
  const url = pathToFileURL(file).href + (opt.query ? (opt.query.startsWith('?') ? opt.query : '?' + opt.query) : '');
  const t0 = Date.now();
  await page.goto(url, { waitUntil: 'load', timeout: 120000 });
  const loadMs = Date.now() - t0;
  const nav = await page.evaluate(() => {
    const n = performance.getEntriesByType('navigation')[0];
    if (!n) return null;
    return {
      ttfbMs: Math.round(n.responseStart),
      domMs: Math.round(n.domContentLoadedEventEnd),
      loadMs: Math.round(n.loadEventEnd),
    };
  });

  let started = 'none';
  if (opt.start) {
    const clicked = await page.evaluate(() => {
      const b = document.querySelector('#startBtn');
      if (b && b.offsetParent !== null) { b.click(); return true; }
      return false;
    });
    if (clicked) started = 'click:#startBtn';
    else {
      const called = await page.evaluate(() => {
        if (typeof window.__start === 'function') { window.__start(); return true; }
        return false;
      });
      if (called) started = 'window.__start';
    }
    await page.waitForTimeout(400);
  }
  if (opt.actions) {
    await runActions(page, opt.actions);
    started = started === 'none' ? opt.actions : started + ' + ' + opt.actions;
  }

  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  const frames = await page.evaluate((ms) => new Promise((resolve) => {
    const dts = [];
    let last = performance.now();
    const begin = last;
    function loop(now) {
      dts.push(now - last);
      last = now;
      if (now - begin < ms) requestAnimationFrame(loop);
      else resolve(dts);
    }
    requestAnimationFrame(loop);
  }), opt.seconds * 1000);

  const session = await page.context().newCDPSession(page);
  await session.send('Performance.enable');
  const { metrics } = await session.send('Performance.getMetrics');
  const metric = (name) => {
    const row = metrics.find(m => m.name === name);
    return row ? row.value : null;
  };

  frames.sort((a, b) => a - b);
  const n = frames.length || 1;
  const sum = frames.reduce((s, x) => s + x, 0);
  const at = (p) => frames[Math.min(n - 1, Math.max(0, Math.ceil(p * n) - 1))];
  const worstN = Math.max(1, Math.ceil(n * 0.01));
  const worst = frames.slice(-worstN);
  const worstAvg = worst.reduce((s, x) => s + x, 0) / worst.length;
  const elapsed = sum / 1000;

  const gpu = await page.evaluate(() => {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return 'none';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  });

  const result = {
    slug,
    url,
    mode: headed ? 'headed' : 'headless',
    gpu,
    viewport: opt.mobile ? '390x844' : '1280x800',
    seconds: opt.seconds,
    started,
    load: { wallMs: loadMs, ...(nav || {}) },
    fps: {
      avg: +(n / elapsed).toFixed(1),
      onePercentLow: +(1000 / worstAvg).toFixed(1),
    },
    frameMs: {
      avg: +(sum / n).toFixed(2),
      p50: +at(0.5).toFixed(2),
      p95: +at(0.95).toFixed(2),
      p99: +at(0.99).toFixed(2),
      max: +frames[n - 1].toFixed(2),
    },
    hitch: {
      over20ms: frames.filter(d => d > 20).length,
      over50ms: frames.filter(d => d > 50).length,
    },
    memory: {
      jsHeapMB: metric('JSHeapUsedSize') != null ? +(metric('JSHeapUsedSize') / 1048576).toFixed(1) : null,
      nodes: metric('Nodes'),
      documents: metric('Documents'),
    },
    errors,
  };
  await page.close();
  return result;
}

const { slugs, opt } = parseArgs(process.argv.slice(2));
const resolved = slugs.map(resolveSlug);
const headed = !opt.swiftshader && !!process.env.DISPLAY;
const args = ['--allow-file-access-from-files'];
if (opt.swiftshader) args.push('--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist');
const browser = await chromium.launch({
  headless: !headed,
  executablePath: process.env.CHROME || '/usr/bin/google-chrome',
  args,
});
const out = [];
try {
  for (const slug of resolved) {
    console.error('benchmark', slug);
    out.push(await benchOne(browser, slug, opt));
  }
} finally {
  await browser.close();
}
process.stdout.write(JSON.stringify(out, null, 2) + '\n');
