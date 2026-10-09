# Playbook za AI agente (Claude Code, Cursor)

Kratka pravila kako se u ovom repou radi zadatak. Važe za oba alata. Repo-specifična pravila su u `AGENTS.md`, konvencije za igre u `.claude/skills/browser-games/SKILL.md`.

## 1. Pre nego što menjaš kod

- Pročitaj **Status** u `MONETIZATION.md` i `docs/games/<slug>/TRACKER.md`. Ako zahtev ide protiv plana, uradi ga, ali kratko upozori korisnika.
- Igre su jedan veliki HTML fajl (Pilana ima ~8 000 linija). Ne učitavaj ceo fajl ako ti ne treba. Pogledaj mapu koda u `docs/games/<slug>/README.md`, pa čitaj samo tu sekciju (`grep -n "// ===" games/<slug>/index.html` daje zaglavlja sekcija).
- Pre izmene pokreni igru i vidi trenutno ponašanje. Ne nagađaj kako izgleda.

## 2. Dok radiš

- **Mali, proverljivi koraci.** Jedna izmena → provera → sledeća.
- **Prati stil fajla:** gusti `const`/arrow helperi, `part(geo, mat, parent, x, y, z…)`, keš materijala i geometrije (`mat()`, `rbox()`, `cylG()`, `boxG()`). Ne uvodi nove biblioteke ni build korak.
- **Logika i prikaz odvojeno.** `update(dt)` je logika (radi i u `?sim` režimu bez crtanja), `updateVisuals(dt, time)` je samo prikaz. Ne menjaj stanje igre (`S.*`) iz prikaza.
- **Bez alokacija u petlji frejma.** Ne pravi `new Vector3()`, `.clone()`, `filter()`/`map()` nizova u kodu koji se zove svaki frejm. Koristi privremene objekte na nivou modula (`tv1`, `tmpQ`…).
- **DOM se ne gradi iznova svakog frejma.** Gradi jednom, posle menjaj `textContent`/`classList` (vidi PT-BUG-002: ponovno pravljenje dugmeta guta klik).
- **Korisnički tekst nikad kroz `innerHTML`.** Imena, unos, sve što igrač kuca: `textContent`.
- **Igra radi i bez reklama, SDK-a i modela.** Svaki asset ima rezervu (proceduralni model), svaki SDK poziv ide preko `shared/gameroom-sdk.js`.
- **Ne briši i ne prepisuj bez gledanja.** Proveri šta je u fajlu pre nego što ga zameniš.

## 3. Provera (obavezno pre „gotovo“)

1. `cd tests && npx playwright test games/<slug>` — svi testovi prolaze (testovi sa `test.fail` su očekivani padovi).
2. Za izmenu performansi: `node .cursor/skills/benchmark/scripts/benchmark.mjs <slug>` pre i posle, uporedi `fps.avg`, `onePercentLow`, `frameMs.p95`.
3. Za izmenu izgleda ili UI-ja: screenshot desktop (1280×800) i telefon (390×844 portret, 844×390 landscape), pa ih pogledaj. Alat: `.claude/skills/game-audit/scripts/audit.mjs`.
4. Za izmenu ekonomije: `?auto&sim=1800&smart` 3–4 puta, gledaj raspon, ne jedan broj.
5. Konzola bez grešaka.

## 4. Definition of done

- [ ] Testovi prolaze, novi bag ima regresioni test.
- [ ] Nema novih grešaka u konzoli; FPS i draw call-ovi nisu gori od baseline-a u `docs/games/<slug>/README.md`.
- [ ] Mobilni prikaz proveren (portret + landscape).
- [ ] `BUGS.md` / `TECH-DEBT.md` / `IMPROVEMENTS.md` ažurirani (status, datum).
- [ ] `TRACKER.md` štikliran, `LEDGER.md` ima novi zapis sa brojevima pre/posle.
- [ ] Ako je završena stavka iz roadmapa: štiklirana u `MONETIZATION.md`, ažuriran **Status**.

## 5. Šta se ne radi

- Ne commituj i ne pushuj bez traženja korisnika.
- Ne dodaj `package.json` u root niti build korak za igre. Izuzetak je `tests/` (samo za razvoj, ne ide na Vercel).
- Ne commituj binarne fajlove > 5 MB bez pitanja.
- Ne uklanjaj debug kuke sa `window` (`__debug`, `__run`, `__cheat`…) — testovi i benchmark ih koriste.
- Ne „popravljaj usput“ stvari van zadatka. Zapiši ih u `BUGS.md`/`TECH-DEBT.md`.
- Reklame nikad usred igranja, reklama za nagradu je uvek izbor igrača (`MONETIZATION.md`, Tvrda pravila).

## 6. Izveštaj korisniku

Na srpskom, kratko: šta je urađeno, kako je provereno (brojevi), šta je ostalo otvoreno, šta traži njegovu odluku. Linkuj fajlove koje je promenio.
