---
name: game-audit
description: Audit jedne Gameroom igre do „AAA“ standarda — pročitaj kod, izmeri (učitavanje, draw call-ovi, FPS, heap, balans), zavedi bagove/tehnički dug/unapređenja u docs/games/<slug>/, reši S1 i kozmetiku, napiši Playwright testove. Koristi kad korisnik traži „audit“, „analiziraj igru“, „zavedi bagove“, „nabudži igru“, „AAA“, „testovi za igru“, ili kreće na sledeću igru posle Pilane.
---

# Audit igre

Referentni primer je Pilana Tajkun (2026-10-09): `docs/games/pilana-tajkun/` i `tests/games/pilana-tajkun/`. Prati isti oblik.

## 0. Pripremi

- Pročitaj `AGENTS.md`, **Status** u `MONETIZATION.md`, `docs/engineering/agent-playbook.md`, `docs/engineering/game-quality-bar.md`, `docs/engineering/tracking.md`.
- Kopiraj `docs/games/_template/` u `docs/games/<slug>/`. Izaberi prefiks ID-ja (tabela u `tracking.md`).
- `cd tests && npm install` ako `tests/node_modules` ne postoji.

## 1. Pročitaj ceo kod

- Igre su jedan HTML. Preskoči minifikovane biblioteke (`awk '{ if (length($0) > 2000) print NR }'` pokazuje gde su). Ostalo čitaj u delovima od ~700 linija.
- Usput beleži: bagove (sa linijom), alokacije u petlji, DOM koji se gradi iznova, `innerHTML` sa korisničkim tekstom, logiku u prikazu, mrtav kod, asset-e koji se učitavaju a ne koriste, blokirajuće skripte.
- Napravi mapu sekcija za `README.md` (`grep -n "^// [A-Z]" games/<slug>/index.html`) i spisak debug kuka na `window`.

## 2. Izmeri

```bash
# učitavanje (normalno + Fast 4G), MB, draw call-ovi rano/kasno, heap, greške, screenshotovi desktop/telefon/landscape
node .claude/skills/game-audit/scripts/audit.mjs <slug> --late "<js koji napravi kasnu igru preko debug kuka>"
# pravi FPS na GPU-u (otvara Chrome prozor)
node .cursor/skills/benchmark/scripts/benchmark.mjs <slug> --seconds 8
node .cursor/skills/benchmark/scripts/benchmark.mjs <slug> --seconds 8 --actions 'eval:<kasna igra>;wait:3000'
```

- Pogledaj **sve** screenshotove (`.cache/audit/<slug>/`). Traži: preklapanja na telefonu, prvi kadar, čitljivost, šta odvlači pažnju.
- Za tajkun igre: `?sim` bot 3–4 puta (vidi `browser-games` skill), zapiši tempo prvih kupovina.
- Proveri sumnjive bagove skriptom pre nego što ih zavedeš (Pilana: klik na „kupi“ dok novac raste je izgubio 7/12 — bez merenja to bi bila samo sumnja).

## 3. Zavedi

- `BUGS.md`: svaki bag sa ozbiljnošću S1–S4, gde, koraci, uzrok, predlog, test.
- `TECH-DEBT.md`: uticaj + procena (S/M/L).
- `IMPROVEMENTS.md`: po oblastima P/V/A/U/S/G/T, prioritet P1–P3. Misli kao igrač i kao art direktor: prvi utisak, „juice“ na svaku akciju, doslednost stila, zvuk.
- `README.md`: mapa koda, debug kuke, tabela merenja (baseline), ocena kvaliteta 1–5 po oblastima, paleta.
- `TRACKER.md`: faze A–G kao kod Pilane + „Odluke potrebne od korisnika“.

## 4. Popravi samo S1 i kozmetiku

- S1 = igra se ne učitava/pada/gubi napredak ili osnovna radnja ne radi pouzdano. Popravi odmah, minimalno, u stilu fajla.
- Kozmetika (S4) sme usput. Sve ostalo ide u fazu 2 — zapiši, ne popravljaj.
- Posle popravke ponovi isto merenje i upiši pre/posle.

## 5. Testovi

- `tests/games/<slug>/`: kopiraj `fixtures.mjs` iz Pilane i prilagodi. Minimum: smoke, glavna petlja, save, pauza/kamera, mobile (`@mobile`), perf budžeti, `known-bugs.spec.mjs` (`test.fail` za otvorene bagove).
- Svaki rešen S1 ima regresioni test. **Dokaži da test pada na starom kodu:** `git show HEAD:games/<slug>/index.html > games/<slug>/index.html`, pokreni test, vrati novu verziju.
- `npx playwright test games/<slug>` mora proći (sa očekivanim `test.fail`/`fixme`).

## 6. Završi

- `LEDGER.md` zapis sa brojevima pre/posle i komandama.
- `docs/README.md` tabela igara: stanje.
- Ako se menja plan: `MONETIZATION.md` → Dnevnik odluka.
- Izveštaj korisniku: šta je S1 i rešeno (brojevi), koliko je zavedeno, top 5 unapređenja, odluke koje traže njega. Ne commituj bez traženja.
