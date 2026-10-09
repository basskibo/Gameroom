# Monster Lane — ledger

Najnovije gore. Format: [tracking.md](../../engineering/tracking.md).

## 2026-10-10 — AAA prolaz 1: učitavanje, izgled, juice, monetizacija
- **Urađeno:** Kenney modeli kao 23 GLB fajla (meshopt + WebP, 0,28 MB) umesto 2 MB `kit-bundle.js`; Three.js iz `shared/vendor`; HDR post-obrada (bloom 0,8, ACES, grading); svetleće varnice i dim; muzzle flash radi; hit-stop i punch kamere; audio bus; statistika sa verzijom; uvodni saveti; SDK: `revive`, `start_weapon`, midgame između partija; analitika.
- **ID:** ML-BUG-001…004, ML-IMP-P01, P02, V01, V02, A01, U01, U02, G01, G02, S01.
- **Provereno:** preuzimanje 2,3 → 1,3 MB; igrivo na Fast 4G 3,5 → 2,8 s; trouglovi 1,64 M → 1,09 M; draw call-ovi 428 → 366; FPS 59,8 → 59,8 (1 % low 44,8 → 44,7) sa bloom-om; `npx playwright test games/monster-lane` 17/17.
- **Napomena:** `art/monster-lane/kenney_pirate-kit` (9,9 MB) više ne ide na Vercel (`.vercelignore` ima `art`).
