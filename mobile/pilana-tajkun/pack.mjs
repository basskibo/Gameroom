// Copies the game and the shared code it uses into www/ for Capacitor — the same files the web serves,
// with the same relative paths, so nothing in the game changes. Run: npm run pack (or npm run apk).
import { cpSync, rmSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '../..');
const slug = 'pilana-tajkun';
const www = resolve(here, 'www');
rmSync(www, { recursive: true, force: true });
mkdirSync(www, { recursive: true });
const copy = (from, to = from, filter) => cpSync(resolve(repo, from), resolve(www, to), { recursive: true, filter });
copy(`games/${slug}`, `games/${slug}`, src => !src.endsWith('.md'));
for (const f of ['gameroom-sdk.js', 'gameroom-three.js', 'gameroom-fx.js', 'gameroom-audio.js', 'gameroom-post.js', 'gameroom-sky.js']) copy(`shared/${f}`);
copy('shared/vendor');
cpSync(resolve(here, 'config/gameroom-config.js'), resolve(www, 'shared/gameroom-config.js'));
// the app opens www/index.html: go straight to the game
// (replace, not a refresh: Android's back button must not land on this page again)
writeFileSync(resolve(www, 'index.html'), `<!doctype html><meta charset="utf-8"><body style="background:#5fa843"><script>location.replace('games/${slug}/index.html')</script>`);
if (!existsSync(resolve(www, `games/${slug}/index.html`))) throw new Error('game not copied');
console.log('www/ ready for', slug);
