# Pilana Tajkun — tracker

Plan unapređenja po fazama. Stavke vode na ID-jeve iz [BUGS](BUGS.md), [TECH-DEBT](TECH-DEBT.md) i [IMPROVEMENTS](IMPROVEMENTS.md). Agent na početku zadatka čita ovaj fajl, a na kraju štiklira i upisuje [LEDGER](LEDGER.md).

**Trenutno:** Faze A–D i „wow“ V2–V5 gotove (2026-10-09). V1 (modeli mašina) čeka odobrenje za preuzimanje CC0 paketa. Sledi Faza F (monetizacija, Faza 0: SDK, analitika, engleski).

## Odluke

| # | Pitanje | Odluka |
|---|---|---|
| D1 | `file://` | Ne mora (2026-10-09). Igra radi samo preko http-a |
| D2 | Jedan stil modela | Low-poly CC0 (Kenney / Quaternius / Kay Lousberg) |
| D3 | Git LFS | Nije potrebno: svi modeli zajedno ~2,6 MB |
| D4 | Ulaganje pre podataka | Korisnik bira vizuelni „wow“ plan pre monetizacije; agent upozorava na odstupanje (Faza 0 čeka) |

## „Wow“ plan (V1–V5)

- [x] **V0 probni kadar** — zlatni sat (bez novih modela mašina; videti V1)
- [ ] **V1 modeli** — glavne mašine i vozila kao low-poly modeli jednog stila (čeka odobrenje za preuzimanje)
  - [x] svetliji, topliji likovi (PT-BUG-023)
- [x] **V2 atmosfera** — dan → zlatni sat → noć, lampe/farovi/prozori noću, bloom + color grading na Srednje/Visoko (PT-IMP-V02, V04)
- [x] **V3 živ teren** — brda, kamenje, busenje trave, cveće, reka sa odsjajem i penom, ptice (PT-IMP-V05, V10)
- [x] **V4 herojski trenuci** — prelet kamere do nove zgrade (skela, kran), krupni kadar reza trupca (varnice), kadar mosta (PT-IMP-A08)
- [x] **V5 UI + prvih 30 s** — moderan HUD, kartice nadogradnji, kratko vođenje umesto 20 pasusa (PT-IMP-U01, U02; PT-BUG-010)

## Faza A — Stabilnost i merenje ✅ (2026-10-09)

- [x] Audit celog koda, merenja (učitavanje, FPS, draw call-ovi, heap, balans) → `README.md`
- [x] PT-BUG-001 (S1) blokirajući bundle → 1,8 s do igre na 4G
- [x] PT-BUG-002 (S1) gubljenje klikova u panelu
- [x] PT-BUG-003 (S4) spljošteno ✕
- [x] Playwright testovi (47: smoke, kupovina, save, pauza, kamera, ekonomija, mobilni, performanse, poznati bagovi)
- [x] Dokumentacija: bugovi, dug, unapređenja, tracker, ledger, playbook za agente

## Faza B — Performanse i učitavanje ✅ (2026-10-09)

Cilj: kasna igra ≥ 55 FPS / 1% low ≥ 40 na iGPU, < 300 draw call-ova rano, < 5 MB preuzimanja.

- [x] PT-IMP-P04 / PT-BUG-006 — ne crtaj punom brzinom na pauzi (S)
- [x] PT-IMP-P01 / PT-TD-001 — spajanje statične geometrije + instanciranje (L)
- [x] PT-IMP-P02 / PT-TD-002 — kompresija GLB, jedan rig, brisanje nekorišćenih asseta (M)
- [x] PT-IMP-P07 / PT-BUG-008 — ekran učitavanja sa progresom, fade zamena modela (M)
- [x] PT-IMP-P03 — adaptivni DPR + preset-i kvaliteta (M)
- [x] PT-IMP-P05 / PT-TD-008, PT-TD-009 — nula alokacija, cepanice (M)
- [x] PT-IMP-P08 / PT-TD-010 — senka samo na promenu (S)
- [x] PT-TD-003 — skripta za bundle + `.vercelignore` (S, posle D1)
- [x] Ponovno merenje, ažuriran baseline u `README.md`, `perf.spec.mjs` cilj 300 sa `fixme` na pravi test

## Faza C — Izgled ✅ delimično (2026-10-09; V02, V04, V05, V07-mašine, V10 prešli u „wow“ plan)

- [x] PT-IMP-V01 svetlo + okruženje (S)
- [x] PT-IMP-V03 / PT-BUG-014 kontakt senke (S)
- [x] PT-IMP-V06 čestice (M)
- [x] PT-IMP-V08 / PT-BUG-013 gradnja zgrada + ghost mesta + bolji prvi kadar (M)
- [x] PT-IMP-V02 post-obrada (M)
- [x] PT-IMP-V07 / PT-BUG-015 jedan stil modela + zasluge (L, posle D2)
- [x] PT-IMP-V05, V09, V10, V04

## Faza D — Animacije i „juice“ ✅ (2026-10-09; A07 otvoreno)

- [x] PT-IMP-A02 novac count-up + novčići do HUD-a (S)
- [x] PT-IMP-A04 kupovina: squash & stretch, konfete, zvuk, vibracija (S)
- [x] PT-IMP-A05 UI prelazi (S)
- [x] PT-IMP-A01 kamera (S)
- [x] PT-IMP-A03, A06, A08, A07

## Faza E — UX, onboarding, zvuk

- [ ] PT-IMP-U01 / PT-BUG-010 prvih 30 sekundi (M)
- [ ] PT-IMP-U03 / PT-BUG-011 toast sistem (S)
- [ ] PT-IMP-U02 panel nadogradnji (M)
- [ ] PT-IMP-U05 podešavanja (S)
- [ ] PT-IMP-S01 audio bus, PT-IMP-S02 ambijent, PT-IMP-S03 uzorci
- [ ] PT-BUG-004, 005, 012, 016, 018, 020, 022 (sitni bagovi)
- [ ] PT-IMP-U04, U07, U09, U08

## Faza F — Plan monetizacije (Faza 0 iz `MONETIZATION.md`)

- [ ] PT-IMP-T02 / PT-TD-014 SDK + analitika
- [ ] PT-IMP-T01 / PT-TD-013 srpski + engleski
- [ ] PT-BUG-021 jedno ime igre
- [ ] PT-TD-015 / PT-BUG-019 validacija save-a
- [ ] PT-IMP-G03 mesta za reklamu za nagradu (posle SDK-a)
- [ ] PT-IMP-U06 offline zarada

## Faza G — Ekonomija i sadržaj

- [ ] PT-BUG-009 `canBuy` + PT-TD-007 mrtav kod
- [ ] PT-TD-006 sim = igra
- [ ] PT-IMP-G01 rebalans sa referentnom krivom
- [ ] PT-IMP-G02, G04, G05
