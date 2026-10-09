---
name: browser-games
description: Konvencije za Gameroom projekat — kolekciju browser igrica (single-file HTML, često Three.js) sa landing stranicom i hostingom na Vercelu. Koristi kad god se pravi nova igra, dodaje/menja/briše igra sa landinga, menja postojeća igra, landing (index.html) ili Vercel config u ovom repou. Triggers: "nova igra", "dodaj igru", "napravi igricu", "new game", "add a game", "landing", "deploy na vercel".
---

# Gameroom — browser igrice

Statički sajt, bez build koraka i bez bundlera. Svaka igra je samostalna stranica, landing je lista igara.

> **Plan monetizacije:** pre rada pročitaj `MONETIZATION.md` u root-u (Status, Tvrda pravila, Principi za razvoj) i uskladi zadatak sa trenutnom fazom. Reklame i analitika idu samo preko `shared/gameroom-sdk.js`.
>
> **Dokumentacija i testovi:** `docs/README.md` (tracker, bagovi, dug, standard kvaliteta po igri), testovi u `tests/` (Playwright, `docs/engineering/testing.md`). Audit igre: skill `game-audit`.

## Struktura

```
index.html                  # landing — registar igara (GAMES niz) + grid kartica
vercel.json                 # cleanUrls + trailingSlash, bez build komande
.vercelignore               # .claude/ i README ne idu na Vercel
games/<slug>/index.html     # jedna igra = jedan folder
games/<slug>/cover.jpg      # screenshot 1200x900 bez UI-ja — kartica na landingu
games/<slug>/hero.jpg       # screenshot 1600x700 bez UI-ja — hero kad je igra istaknuta
games/<slug>/...            # opciono — dodatni asseti igre (relativne putanje!)
```

- `slug` je kebab-case, na engleskom ili srpskom latinicom, bez dijakritika (`monster-lane`, `surprizi`).
- URL igre na Vercelu: `/games/<slug>/` (zbog `trailingSlash: true` relativni asseti rade).

## Dodavanje nove igre — checklist

1. Napravi `games/<slug>/index.html`.
2. Link **gameroom:back** ka `../../` ide u meni podešavanja (jedno dugme ⚙), ne kao kružić po ekranu. Zvuk, pauza i ostala podešavanja su u istom meniju. Komentar `gameroom:back` ostaje oko linka. Kopiraj obrazac iz `games/surprizi/index.html` ili `games/pilana-tajkun/index.html`.
3. Napravi screenshotove (vidi „Cover slike“ dole) → `cover.jpg` i `hero.jpg`.
4. Dodaj objekat **na početak** `GAMES` niza u `index.html` (prva igra je istaknuta u hero-u). Glavna polja su na engleskom, srpska verzija ide u `sr`:
   ```js
   { slug: 'moja-igra', title: 'My Game', description: '1–2 sentences in English.',
     sr: { title: 'Moja Igra', description: '1–2 rečenice na srpskom.', tags: ['3D', 'Akcija'] },
     cover: 'cover.jpg', hero: 'hero.jpg', accent: ['#hex1', '#hex2'],
     emoji: '🚀', tags: ['3D', 'Action'], isNew: true }
   ```
   `accent` boje uzmi iz palete igre (koriste se za glow). `emoji` je samo fallback kad nema slike. Skini `isNew` sa prethodne igre.
5. Proveri lokalno (vidi dole) — landing kartica vodi na igru, a „Nazad u Gameroom“ u meniju vraća nazad.

## Landing dizajn

Tamna tema (`#08080d`), fontovi **Unbounded** (naslovi, uppercase) + **Manrope** (tekst), lime akcenat `#c6ff3d`. Redosled: plutajuća staklena nav pilula → hero preko celog ekrana sa videom u pozadini (`assets/hero/hero-1600.mp4`, telefon `hero-960.mp4`, poster `hero-poster.jpg`; petlja gameplay-a bez teksta, dugme za pauzu, bez autoplay-a uz reduced motion/save-data) → marquee naslova → bento grid igara (12 kolona, `grid-auto-flow: dense`, prva igra 7×2, raspored računa `spans()` u `index.html` pa grid ostaje bez rupa za bilo koji broj igara) → izjava sa slikama u tekstu + trejler (`trailer-720.mp4`) → veliki CTA. GSAP (cdnjs) je samo dodatak: bez njega stranica je kompletna. Ne vraćati se na male kartice sa emoji-jem — korisnik je to eksplicitno odbio kao „basic“. Posle izmene landinga napravi screenshot desktop (1440) i mobilni (390) i pogledaj ih.

## Cover slike

Skripta `.claude/skills/browser-games/scripts/cover.mjs` otvara igru u headless Chrome-u (swiftshader WebGL), izvede akcije, sakrije UI i sačuva JPEG u `games/<slug>/`.

```bash
python3 -m http.server 8765 &     # iz root-a repoa
# alati za testiranje idu u .cache/tools/ (gitignored + vercelignored): npm i playwright-core tamo, pa kopiraj skriptu
SHOT=cover node cover.mjs <slug> '<css selektori UI-ja, zarezom>' 'click:#startBtn;key:d:1500;wait:5000'
SHOT=hero  node cover.mjs <slug> '...' '...'
```

Akcije: `click:<sel>`, `key:<taster>:<ms>`, `wait:<ms>`. Uvek otvori dobijenu sliku i proveri da nema zaostalog UI-ja i da scena izgleda zanimljivo (u igri, ne start ekran; za kolekcije popuni scenu pa slikaj). Primeri koji rade:
- monster-lane: hide `#ui`, akcije `click:#startBtn;key:d:3000;wait:16000` (igrač stoji desno pa se na pristaništu skupi gomila)
- kamp-tajkun: `QUERY='?auto&sim=1500&bot'` (bot 25 min razvija kamp, pa se slika živ kamp), hide `#ui`, akcije `wait:2500`
- surprizi: hide `#topbar,#tabs,#open-panel,#progress-pill,#reveal-modal,#toast,#info-panel,#showroom-hint`, 5× `click:#open-btn;wait:3500;click:#reveal-close;wait:800`, pa `click:.tab-btn[data-mode=showroom];wait:3000`

## Balans i testiranje igre

- Igre imaju debug parametre u URL-u: monster-lane `?auto&q=0&sim=600` odmah startuje, bot odigra N sekundi (gađa kapije, kovčeg, pa gomilu), a rezultat piše u `document.title` i `window.simLog` (DPS po talasu, trajanje bossa). Za nove igre napravi isto — balans se meri simulacijom, ne pogađanjem.
- Bot je bimodalan ako ne gađa upgrade-e; pusti 4–5 simulacija i gledaj raspon, ne jedan rezultat.
- Kamp Tajkun: `?auto&sim=3000` (bot igra 50 min; `&bot` ostavlja bota da vozi i posle; `&at=x,z` posle simulacije stavi igrača na tačku — za screenshot određenog dela mape). `window.simLog` = vreme svake kupovine, `order+N`/`orderFAIL` za porudžbine i `STUCK@` ako bot 20 s stoji u mestu. Referentna kriva: pilana ~1 min, Koliba ~15 min, sok ~28 min, ribnjak ~33 min, Dvorac ~43–45 min; porudžbine ~50% uspešne (namerno izazov). Posle svake izmene mape pusti 3–4 simulacije i proveri da nema `STUCK`.
- Kolizije: zgrade/tezge su pravougaonici `{x,z,hx,hz}`, ne više krugova — dva kruga jedan do drugog prave „džep“ u kom se lik zaglavi. Agenti (radnici, nosači, bot) imaju obilazak kad su blokirani.
- Radnici: jasna stanja gather → deliver (skupljaj dok ranac nije pun, pa istovari SVE). Bez toga se vraćaju posle svakog komada.
- Automatizacija ne sme da ukine igru: igraču ostaju porudžbine kamiona (samo on može da utovari, rok, 2× cena), kupovina/širenje i kasnije skupe stvari.
- Tycoon igre: novi objekat mora odmah imati gde da proda svoju robu (pilana bez tezge za daske = rupa u progresiji).
- Monster Lane referentna kriva (posle rebalansa): bot stiže do talasa 5–6 za ~6 min, bossovi traju 17–50 s, broj mobova ≤ ~1000. Ne vraćati na lakše — korisnik je tražio težu igru.
- Cene upgrade-a (kapije, kovčezi) veži za trenutni DPS igrača (par sekundi njegove vatre), ne za talas — inače igrač koji propusti par boostova više nikad ne može da ih stigne. Test: `&nogates=25` (bot ignoriše upgrade-e N sekundi) pa proveri da `ups` posle raste.
- Ne dozvoli spawn-kill: neprijatelji su neranjivi dok ne izađu iz svog spawn prostora (monster-lane: paluba broda iza ograde), a upgrade objekti dok „iskaču“.
- Pazi na performanse: kolizija je metci × mete, pa težinu diži HP-om, a ne beskonačnim brojem mobova.
- Bloom + NaN: bilo koji `pow()` sa bazom koja može biti < 0 daje NaN, a bloom ga razmaže u crni pravougaonik (bug „pola ekrana crno“ na MQ/HQ). Uvek `pow(max(x, 0.0), y)`; monster-lane ima i sanitize pass pre blooma.

## Mobilni prikaz (obavezno proveriti)

- Screenshot na 390×844 (portret, DPR 2, touch) i 844×390 (landscape) posle svake izmene UI-ja ili kamere.
- HUD na telefonu ne sme da pokriva donju trećinu ekrana gde je igrač: statistike idu gore kao tanka traka, sve ostalo kompaktno.
- Kamera u portretu ne sme da se udaljava da bi sve stalo u širinu — prikaži uži isečak i pomeraj kameru za igračem.
- Touch kontrola relativna (prevlačenje bilo gde pomera lik za pređeni put), da prst ne pokriva lik.

## Konvencije za samu igru

- **Jedan HTML fajl** sa inline `<style>` i `<script>` je default. Veći asseti (slike, zvuk, modeli) idu pored u isti folder, sa relativnim putanjama — nikad apsolutnim `/...`.
- **Jezik: engleski podrazumevano, srpski (latinica) kao izbor.** Sav tekst ide kroz `shared/gameroom-i18n.js` (klasičan `<script>` u `<head>`, pre igre): `GameroomI18n.add({ en: {...}, sr: {...} })`, `t(key, vars)`, `data-i18n` / `data-i18n-html` / `data-i18n-attr` u HTML-u + `apply()`, a `picker()` (EN/SR) ide u meni podešavanja. Jezik je zajednički za sajt (`gameroom:lang`), srpski browseri dobijaju srpski, `?lang=en|sr` u URL-u ga forsira (za testove i snimke). `<html lang="en">`, a `<title>` po jeziku. U igri funkciju zovi `tr` (ne `t`, jer igre često imaju lokalne promenljive `t`). Obrazac: `games/monster-lane/index.html` (rečnik na vrhu modula), `games/osvoji-svet/index.html` (klasičan skript), `games/surprizi/index.html` (engleski nazivi figura u `CHAR_EN`). Nova igra mora od starta imati oba jezika.
- **Three.js** iz zajedničke kopije u `shared/vendor/` preko importmap-a (keš između igara, radi offline na portalima):
  ```html
  <script type="importmap">
  { "imports": {
      "three": "../../shared/vendor/three-0.170.0/build/three.module.min.js",
      "three/addons/": "../../shared/vendor/three-0.170.0/examples/jsm/" } }
  </script>
  <script type="module"> import * as THREE from 'three'; ... </script>
  ```
  Zajednički moduli: `shared/gameroom-three.js` (spajanje geometrije, kvalitet), `shared/gameroom-fx.js` (čestice), `shared/gameroom-audio.js` (zvuk). Mapa: `shared/README.md`.
  Za 2D igre dovoljan je `<canvas>` + 2D context, bez biblioteka.
- **Fontovi**: Google Fonts (`Baloo 2`, `Nunito`, `Lilita One` su već u upotrebi).
- **Mobilni prvo**: `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">`, `touch-action: none` na canvasu, kontrole i mišem/prstom i tastaturom, fullscreen layout (`html,body{height:100%;overflow:hidden}`), `resize` handler koji ažurira kameru/renderer, `devicePixelRatio` ograničen na ~2.
- **Start ekran** sa naslovom, kratkim pravilima i dugmetom „IGRAJ“ (takođe otključava audio na mobilnom). Pauza na `P`/`Esc` i automatski na `visibilitychange`.
- **localStorage** ključevi uvek sa prefiksom sluga, npr. `monster-lane:best`, da se igre ne sudaraju (svi dele isti origin). Postojeći `monsterLaneBest` ne dirati bez migracije. Čitanje/pisanje u `try/catch`.
- Game loop preko `requestAnimationFrame` sa delta vremenom (clamp na ~0.05s), ne fiksni koraci po frame-u.

## Lokalno pokretanje

Ne otvarati preko `file://` (importmap/module i fetch mogu da pucaju). Iz root-a repoa:

```bash
npx serve .          # ili: python3 -m http.server 8000
```

## Deploy (Vercel)

- Framework preset: **Other**, bez build komande, output dir = root. Sve je već u `vercel.json`.
- Push na `main` → produkcija; ostale grane → preview.
- Ne dodavati `package.json`/build osim ako igra zaista zahteva bundler — tada o tome prvo pitati korisnika.

## Šta ne raditi

- Ne linkovati igre direktno iz druge igre — sve ide preko landinga.
- Ne menjati strukturu `games/<slug>/` niti ime `GAMES` niza bez ažuriranja ovog skilla.
- Ne commitovati velike binarne fajlove (>5 MB) bez pitanja.
- Ne učitavati velike skripte blokirajuće (`<script src>` u body-ju pre igre). Pilana je tako čekala 24 s na 4G (PT-BUG-001); asseti se učitavaju u pozadini, igra kreće odmah.
