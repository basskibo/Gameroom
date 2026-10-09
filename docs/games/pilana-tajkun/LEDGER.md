# Pilana Tajkun — ledger

Hronološki dnevnik promena (najnovije gore). Format: [tracking.md](../../engineering/tracking.md).

## 2026-10-09 — „Wow“ plan: atmosfera, teren, herojski trenuci, UI, likovi

- **Urađeno:**
  - Likovi (PT-BUG-023): mat materijali umesto metalnih, svetlija i toplija paleta, veće glave.
  - `shared/gameroom-post.js` (HDR + MSAA, bloom, ACES, grading, vinjeta; isključeno na Low), `shared/gameroom-sky.js` (nebo, uzorkovanje ciklusa).
  - Ciklus dana (7 min): jutro, dan, zlatni sat, zalazak, noć, zora; noću lampe, farovi, prozori, svetlo ispod mašina, svici. ⚙ → Day cycle.
  - Teren: fleke trave, ~6 400 busena i ~1 100 cvetova koji se njišu, kamenje, brda na ivici, galebovi, reka sa penom.
  - Herojski trenuci: gradnja (kamera, skela, kran, prašina, konfete), varnice na testeri, obilazak kamere posle 30 s bez unosa.
  - UI: naslovna kartica preko žive scene (zlatni sat), pravila iza „How to play“, vođeni prvi minut (3 koraka), kartice nadogradnji sa trakom nivoa i dugmetom-novčićem, panel desno na desktopu, stakleni HUD.
- **ID:** PT-BUG-010, PT-BUG-023; PT-IMP-V02, V04, V05, V10, A08, U01, U02.
- **Provereno:**
  - Testovi: 50 (novi `onboarding.spec.mjs` ×3, PT-BUG-010 više nije `test.fail`).
  - Benchmark (iGPU, mašina sa drugim aplikacijama, merenja šumna): rano ~58–59 FPS, kasno dan 59,9 / 1% low 47,9, kasno noć 56,6 / p95 19 ms. A/B sa prethodnim commitom: razlika < 1 FPS za teren i herojske trenutke; post-obrada košta ~1–2 ms.
- **Napomena:** V1 (modeli mašina iz CC0 paketa) traži preuzimanje — čeka odobrenje korisnika. Faza 0 monetizacije i dalje čeka (upozoreno).

## 2026-10-09 — Faze B–D: performanse, učitavanje, izgled, animacije

- **Urađeno:**
  - Three.js r170 i dodaci premešteni u `shared/vendor/` (importmap, keš između igara); `file://` napušten (odluka D1); `models-bundle.js` i stari asseti obrisani.
  - 23 GLB modela kroz `tools/optimize-glb.mjs` (meshopt + WebP, spojeni skinovani delovi, samo korišćene animacije): 17 MB → 2,6 MB; originali u `art/`.
  - `shared/gameroom-three.js`: `bakeStatic`/`bakeViz` (spajanje statične geometrije po materijalu), `createQuality` (Auto/High/Low, adaptivni DPR).
  - `shared/gameroom-fx.js` (čestice u jednom draw call-u), `shared/gameroom-audio.js` (bus + kompresor + ambijent, `haptic`).
  - Pauza ne crta, culling likova, točak = 1 mesh, tap prstenovi instancirani, kontakt senke, senke oblaka, PMREM svetlo, gradnja zgrada (izraste + prašina), traka učitavanja, „pop“ modela, count-up novca, novčići do HUD-a, kočiona svetla i ugib kamiona, pad drveta, prelet kamere na prvom startu, credits ekran, kvalitet u ⚙.
  - Bagovi rešeni: PT-BUG-004–008, 011–017, 020. Dug plaćen: PT-TD-001–004, 012, 018.
- **Provereno:**
  - Fast 4G: do igre **24,3 → 2,9 s**, preuzimanje **25,7 → 3,1 MB**, modeli **25,6 → 5,7 s**.
  - Kasna igra (iGPU): **40,1 → 58,8 FPS**, p95 40,8 → 16,8 ms, frejmovi > 20 ms 144 → ~10; draw call-ovi 2 096 → 835; heap 133 → 59 MB.
  - `cd tests && npx playwright test`: 47 prošlo.
- **Napomena:** ostaju trzaji pri prvom crtanju nove zgrade (PT-TD-020). Korisnik: „bolje radi i lepši je feel, ali nema wow“ → plan V1–V5 u TRACKER-u. Prijavljeni tamni likovi → PT-BUG-023.

## 2026-10-09 — Audit, S1 popravke, testovi, dokumentacija

- **Urađeno:**
  - Pročitan ceo kod igre (~7 900 linija bez Three.js), izmereno učitavanje, FPS, draw call-ovi, heap, balans (bot), napravljeni screenshotovi desktop / telefon / landscape.
  - PT-BUG-001 (S1): `models-bundle.js` se učitava samo za `file://`; uklonjen nekorišćen `factoryA` (1,2 MB) iz liste modela; natpisi na canvas teksturama se ponovo iscrtaju kad stigne Baloo 2 (`fontsReady`).
  - PT-BUG-002 (S1): panel nadogradnji se gradi jednom po stanici i posle samo ažurira (`buildShopRows` + `drawShop`), dugmad imaju `data-up`.
  - PT-BUG-003 (S4): `flex: none` na ✕ dugmadima panela.
  - Zavedeno: 22 baga (19 otvorenih), 19 stavki tehničkog duga, ~45 unapređenja, plan u 7 faza.
  - Testovi: `tests/` (Playwright 1.63, sistemski Chrome), 47 testova u 9 fajlova.
  - Dokumentacija: `docs/` (playbook za agente, standard kvaliteta, performanse, testiranje, praćenje), `AGENTS.md`, Cursor pravilo, skill `game-audit`.
- **ID:** PT-BUG-001, PT-BUG-002, PT-BUG-003.
- **Provereno:**
  - Fast 4G (9 Mbit/s, 150 ms), http: do igre **24,3 s → 1,8 s**; preuzimanje 25,7 MB (blokira) → 17,4 MB (pozadina); heap 133 → 78 MB.
  - Klikovi na „kupi“ dok novac raste: **5/12 → 12/12**.
  - `file://` (benchmark skill, SwiftShader): učitava se bez grešaka, modeli `true`.
  - `cd tests && npx playwright test`: 46 prošlo, 1 `fixme` (cilj 300 draw call-ova). Regresioni testovi PT-BUG-001, PT-BUG-002 i Fast-4G **padaju na starom kodu** (`git show HEAD:…`), prolaze na novom.
  - Benchmark (headed, Intel ARL iGPU): rano 59,8 FPS / 1% low 42,7; kasno daleko 40,1 / 18,5 (nepromenjeno — to je Faza B).
- **Napomena:**
  - Posle PT-BUG-001 modeli stižu posle starta i vidi se zamena proceduralnih modela GLB-ovima (PT-BUG-008). To je svesna razmena: igra kreće 13× brže.
  - Za ponavljanje merenja: `.claude/skills/game-audit/scripts/audit.mjs pilana-tajkun` i `node .cursor/skills/benchmark/scripts/benchmark.mjs pilana-tajkun`.
