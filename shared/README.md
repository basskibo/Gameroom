# shared/ — zajednički kod za sve igre

Običan JS (ES moduli; `gameroom-i18n.js` je klasičan skript), bez build koraka. Igre ih uvoze relativno (`../../shared/...`); Three.js preko importmap-a.

| Fajl | Šta je |
|---|---|
| `gameroom-sdk.js` | jedini put do reklama i analitike (vidi `MONETIZATION.md`) |
| `gameroom-i18n.js` | jezik za landing i sve igre: EN podrazumevano, SR za srpske browsere ili po izboru (`gameroom:lang`), `t()`, `data-i18n*`, `picker()`. Klasičan skript (`window.GameroomI18n`), učitava se u `<head>` |
| `gameroom-three.js` | `bakeStatic`, `bakeViz`, `dropGroup` (spajanje statične geometrije po materijalu), `createQuality` (Auto/High/Low, adaptivni DPR) |
| `gameroom-fx.js` | `createParticles` — sve čestice u jednom draw call-u |
| `gameroom-audio.js` | `createAudioBus` (kompresor, sfx/muzika/ambijent, mute u localStorage), `haptic()` |
| `gameroom-post.js` | `createPost` — HDR render, bloom, ACES, color grading, vinjeta; `post.render()` umesto `renderer.render()` |
| `gameroom-sky.js` | `createSky` (nebo sa sjajem sunca), `sampleCycle` (ključni kadrovi dana/noći) |
| `vendor/three-0.170.0/` | Three.js r170 + korišćeni dodaci (GLTFLoader, meshopt, BufferGeometryUtils, SkeletonUtils, RoomEnvironment) |

Kad dodaješ funkciju koju bi koristila bar još jedna igra, stavi je ovde, ne u igru.
