# shared/ — zajednički kod za sve igre

Običan JS (ES moduli), bez build koraka. Igre ih uvoze relativno (`../../shared/...`); Three.js preko importmap-a.

| Fajl | Šta je |
|---|---|
| `gameroom-sdk.js` | jedini put do reklama i analitike (vidi `MONETIZATION.md`) |
| `gameroom-three.js` | `bakeStatic`, `bakeViz`, `dropGroup` (spajanje statične geometrije po materijalu), `createQuality` (Auto/High/Low, adaptivni DPR) |
| `gameroom-fx.js` | `createParticles` — sve čestice u jednom draw call-u |
| `gameroom-audio.js` | `createAudioBus` (kompresor, sfx/muzika/ambijent, mute u localStorage), `haptic()` |
| `vendor/three-0.170.0/` | Three.js r170 + korišćeni dodaci (GLTFLoader, meshopt, BufferGeometryUtils, SkeletonUtils, RoomEnvironment) |

Kad dodaješ funkciju koju bi koristila bar još jedna igra, stavi je ovde, ne u igru.
