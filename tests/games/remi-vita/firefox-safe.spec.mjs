// BUG-001 regression: Firefox (WebRender) crashed the whole browser right after "Save round".
// The panic is in SpatialTree::get_relative_transform_with_face ("unexpected case"): WebRender asserts
// when a surface and its content end up in mismatched coordinate systems. Those come from CSS rotations,
// 3D transforms, perspective, degenerate scale(0), and filter / backdrop-filter surfaces, mixed with the
// sticky score table. The game keeps its motion to plain 2D translate / non-zero scale / opacity.
// Playwright here runs Chrome, so this test guards the CSS itself; the real-Firefox check is
// tests/tools/firefox-rounds.py (see docs/games/remi-vita/README.md).
import { test, expect } from './fixtures.mjs';

const RISKY = /rotate|skew|perspective|matrix3d|translate3d|translateZ|scale3d|scaleZ|scale[XY]?\(\s*0\s*[,)]|scale\(\s*[^,)]+,\s*0\s*\)/i;

test.describe('Remi Vita · Firefox-safe rendering (BUG-001)', () => {
  test('no CSS that makes WebRender panic: no rotation/3D/perspective/scale(0), no filter surfaces', async ({ game, page }) => {
    await game.open('?lang=en');
    await game.start(['Ana', 'Marko', 'Jovana', 'Nikola']);
    // the real flow that crashed: enter a round through the sheet and save it; then one more round
    await page.locator('#enterBtn').click();
    await page.locator('.wbtn[data-pid=p0]').click();
    await page.evaluate(() => { for (let k = 0; k < 3; k++) { document.querySelector('#keypad [data-k="7"]').click(); document.querySelector('#keypad [data-k="next"]').click(); } });
    await page.locator('#saveRound').click();
    await page.waitForTimeout(1600);
    await game.round('p1', 'hand', { p0: 5, p2: 5, p3: 5 });
    await page.waitForTimeout(400);
    const found = await page.evaluate((src) => {
      const risky = new RegExp(src, 'i'), out = [];
      const walk = (rules, where) => {
        for (const r of rules) {
          if (r.cssRules && !(r instanceof CSSKeyframesRule)) walk(r.cssRules, where);
          if (r instanceof CSSKeyframesRule) {
            for (const k of r.cssRules) {
              if (risky.test(k.style.transform)) out.push(`@keyframes ${r.name} ${k.keyText}: transform ${k.style.transform}`);
              if (k.style.filter && k.style.filter !== 'none') out.push(`@keyframes ${r.name} ${k.keyText}: filter ${k.style.filter}`);
            }
          } else if (r.style) {
            if (risky.test(r.style.transform)) out.push(`${r.selectorText}: transform ${r.style.transform}`);
            if (r.style.perspective && r.style.perspective !== 'none') out.push(`${r.selectorText}: perspective`);
            const bf = r.style.backdropFilter || r.style.webkitBackdropFilter;
            if (bf && bf !== 'none') out.push(`${r.selectorText}: backdrop-filter ${bf}`);
          }
        }
      };
      for (const sh of document.styleSheets) { try { walk(sh.cssRules, sh.href); } catch (e) {} }
      // nothing on the board (score table, dealer banner) may animate transform: that is what tipped WebRender over
      for (const a of document.getAnimations()) {
        const el = a.effect && a.effect.target; if (!el || !el.closest || !el.closest('#board')) continue;
        if (a.effect.getKeyframes().some(k => k.transform && k.transform !== 'none')) out.push(`animation ${a.animationName} on ${el.tagName}.${el.className}: transform`);
      }
      // and what is on screen right now: every computed transform must be an invertible 2D scale/translate
      for (const el of document.querySelectorAll('body *')) {
        const t = getComputedStyle(el).transform;
        if (!t || t === 'none') continue;
        const m = new DOMMatrix(t);
        if (!m.is2D || Math.abs(m.b) > 1e-6 || Math.abs(m.c) > 1e-6 || Math.abs(m.a) < 1e-6 || Math.abs(m.d) < 1e-6) out.push(`${el.tagName}.${el.className && el.className.baseVal === undefined ? el.className : ''}: ${t}`);
      }
      return out;
    }, RISKY.source);
    expect(found).toEqual([]);
    expect((await game.state()).roundNo).toBe(2);
    game.expectNoErrors();
  });
});
