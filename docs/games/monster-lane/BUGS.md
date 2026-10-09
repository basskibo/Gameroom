# Monster Lane — bagovi

Format i ozbiljnost: [docs/engineering/tracking.md](../../engineering/tracking.md).

## Pregled

| ID | S | Status | Naslov |
|---|---|---|---|
| ML-BUG-001 | S2 | rešen | 2 MB `kit-bundle.js` (base64 modeli) blokira učitavanje; Three.js sa CDN-a |
| ML-BUG-002 | S3 | rešen | Plamen iz cevi (muzzle flash) se nikad ne vidi |
| ML-BUG-003 | S3 | rešen | Zvuci idu direktno na izlaz, pucaju kad ih je mnogo |
| ML-BUG-004 | S4 | rešen | Rekord se čuva bez verzije (`monsterLaneBest`) |
| ML-BUG-005 | S4 | otvoren | `ship-large` se učitavao a nije korišćen |

## Rešeno

### ML-BUG-001 · S2 · rešen 2026-10-10 — Model paket blokira učitavanje
- **Gde:** `<script src="kit-bundle.js">` u `<head>`, `mountPirateKit()`.
- **Uzrok:** svih 24 GLB-a kao base64 u jednom JS fajlu (2 MB), sinhrono pre igre; uz to `kenney_pirate-kit/` (9,9 MB) u folderu igre išao na Vercel; Three.js sa jsdelivr CDN-a (ne radi offline u Android aplikaciji).
- **Popravka:** 23 korišćena modela kroz `tools/optimize-glb.mjs` (meshopt + WebP) u `assets/models/` (0,28 MB), asinhrono posle starta; paket premešten u `art/monster-lane/`; Three.js iz `shared/vendor`.
- **Test:** `smoke.spec.mjs` „ML-BUG-001“, `perf.spec.mjs` (< 2 MB, < 4 s na Fast 4G).

### ML-BUG-002 · S3 · rešen 2026-10-10 — Muzzle flash nevidljiv
- **Uzrok:** `updatePlayer` je svaki frejm postavljao `muzzle.visible = false`.
- **Popravka:** vidljiv dok traje `state.muzzle`, boja oružja, HDR sjaj (bloom).

### ML-BUG-003 · S3 · rešen 2026-10-10 — Zvuk bez kompresora
- **Popravka:** `sfx` ide kroz `createAudioBus` (kompresor, mute pamti `monster-lane:audio`, ambijent mora).

### ML-BUG-004 · S4 · rešen 2026-10-10 — Save bez verzije
- **Popravka:** `monster-lane:stats` `{ v: 1, best, bestWave, games, kills }`, stari `monsterLaneBest` se preuzima. Test: „an old best score carries over“.

## Otvoreno

### ML-BUG-005 · S4 · otvoren — Neiskorišćen model
- `ship-large` je bio u listi za učitavanje bez upotrebe. Sada se ne učitava (`null` u listi); ostaje da se lista počisti kad se brodovi preurede.
