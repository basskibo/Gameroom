# Testovi (Playwright)

End-to-end testovi pokreću pravu igru u Chrome-u i upravljaju njom preko debug kuka na `window`. Sve je u `tests/`, koji ne ide na Vercel.

## Zašto Playwright, a ne Cypress

- Već je u projektu (`.cache/tools`, benchmark i cover skripte).
- Radi sa WebGL-om u headless Chrome-u (SwiftShader), ima mobilnu emulaciju (touch, DPR, viewport) i CDP (throttling mreže, merenje).
- Paralelno i brzo, bez posebnog Electron runnera. Isti alat za testove, benchmark i screenshotove.

## Pokretanje

Iz roota repoa (ne treba `cd tests`):

```bash
npm run setup                         # jednom
npm test                              # sve igre
npm test -- games/pilana-tajkun       # jedna igra (argumenti idu posle --)
npm run test:mobile                   # samo telefon
npm run bench -- pilana-tajkun        # FPS benchmark
npm run audit -- pilana-tajkun        # audit igre
npm start                             # lokalni server, http://127.0.0.1:4173/
```

Isto, ručno iz `tests/`:

```bash
cd tests
npm install            # jednom; koristi sistemski Google Chrome, ne skida browser
npx playwright test    # sve igre, desktop + mobile projekti
npx playwright test games/pilana-tajkun          # jedna igra
npx playwright test --project=mobile             # samo telefon
npx playwright test -g "PT-BUG-002"              # jedan test po imenu
npx playwright show-report reports/html          # HTML izveštaj
```

- Server za testove je `serve.mjs` (u rootu; `npm start`) (bez zavisnosti, servira root repoa kao Vercel). Playwright ga pokreće sam na portu 4173.
- Promenljive: `PW_WORKERS` (podrazumevano 2, jer svaki radnik vrti softverski WebGL), `PW_CHANNEL` (podrazumevano `chrome`; u CI-ju `npx playwright install chrome`), `PORT`.
- Trajanje: Pilana ~3 min sa 2 radnika.
- Igre sa uvodnim preletom kamere primaju `?nointro` (fixture `open()` ga dodaje sam), da merenja i screenshotovi ne hvataju let.

## Struktura

```
tests/
  package.json, playwright.config.mjs
  games/<slug>/
    fixtures.mjs        # `game` fixture: open, play, debug, run, cheat, tapStation, expectNoErrors
    smoke.spec.mjs      # učitavanje, start, bez grešaka
    shop.spec.mjs       # glavna petlja (kupovina)
    save.spec.mjs       # čuvanje, slotovi, oštećen save
    pause-camera.spec.mjs
    economy.spec.mjs    # sim, invarijante (nema NaN/negativnih), zaglavljivanje
    mobile.spec.mjs     # tag @mobile, ide samo u mobile projektu
    perf.spec.mjs       # budžeti: vreme do igre na 4G, draw call-ovi, heap, preuzimanje
    known-bugs.spec.mjs # otvoreni bagovi kao test.fail
```

## Pravila za pisanje

- Testiraj kroz igru kao igrač (klik, tap, tastatura), a stanje čitaj iz `window.__debug()`.
- Za brzo napredovanje: `__run(n, dt)` (logika + prikaz), `__step(n, dt)` (samo logika), `__cheat(id, n)`, `__addMoney(v)`.
- Bez fiksnih `waitForTimeout` za proveru vremena igre — koristi `expect.poll` (SwiftShader ume da bude spor).
- Svaki rešen S1/S2 bag dobija regresioni test sa ID-jem u imenu (`PT-BUG-002: …`). Proveri da test **pada** na starom kodu (`git show HEAD:games/<slug>/index.html > …`).
- Otvoren bag → `test.fail(true, 'razlog')` u `known-bugs.spec.mjs`. Kad bag nestane, test javi „passed unexpectedly“.
- Cilj koji još nije dostignut (npr. draw call-ovi < 300) → `test.fixme` sa ID-jem duga.
- Perf testovi proveravaju budžete koji ne zavise od GPU-a. FPS meri benchmark skill.

## Nova igra

1. Iskopiraj `tests/games/pilana-tajkun/fixtures.mjs` i prilagodi `URL`, `SPOTS` i nazive kuka.
2. Igra mora imati bar `window.__debug()` i `window.__start()`. Preporuka: i `__run`, `__cheat`, `__cam`.
3. Napiši bar smoke, glavnu petlju, save i mobile.
