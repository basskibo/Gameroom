---
name: browser-games
description: Konvencije za Gameroom projekat — kolekciju browser igrica (single-file HTML, često Three.js) sa landing stranicom i hostingom na Vercelu. Koristi kad god se pravi nova igra, dodaje/menja/briše igra sa landinga, menja postojeća igra, landing (index.html) ili Vercel config u ovom repou. Triggers: "nova igra", "dodaj igru", "napravi igricu", "new game", "add a game", "landing", "deploy na vercel".
---

# Gameroom — browser igrice

Statički sajt, bez build koraka i bez bundlera. Svaka igra je samostalna stranica, landing je lista igara.

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
2. Na kraju `<body>` ubaci blok **gameroom:back** (kopiraj tačno iz postojeće igre, npr. `games/surprizi/index.html` — traži komentar `gameroom:back`). To je okrugli ⌂ link dole desno ka `../../`. Ako igra već ima UI dole desno, pomeri link u taj ugao koji je slobodan, ali ga ne izbacuj.
3. Napravi screenshotove (vidi „Cover slike“ dole) → `cover.jpg` i `hero.jpg`.
4. Dodaj objekat **na početak** `GAMES` niza u `index.html` (prva igra je istaknuta u hero-u):
   ```js
   { slug: 'moja-igra', title: 'Moja Igra', description: '1–2 rečenice na srpskom.',
     cover: 'cover.jpg', hero: 'hero.jpg', accent: ['#hex1', '#hex2'],
     emoji: '🚀', tags: ['3D', 'Akcija'], isNew: true }
   ```
   `accent` boje uzmi iz palete igre (koriste se za glow). `emoji` je samo fallback kad nema slike. Skini `isNew` sa prethodne igre.
5. Proveri lokalno (vidi dole) — landing kartica vodi na igru, ⌂ vraća nazad.

## Landing dizajn

Tamna tema (`#08080d`), fontovi **Unbounded** (naslovi, uppercase) + **Manrope** (tekst), lime akcenat `#c6ff3d`. Hero = split (tekst levo, slika desno sa mask fade-om), ispod grid velikih 4:3 kartica sa naslovom preko slike i glass čipovima. Ne vraćati se na male kartice sa emoji-jem — korisnik je to eksplicitno odbio kao „basic“. Posle izmene landinga napravi screenshot desktop (1440) i mobilni (390) i pogledaj ih.

## Cover slike

Skripta `.claude/skills/browser-games/scripts/cover.mjs` otvara igru u headless Chrome-u (swiftshader WebGL), izvede akcije, sakrije UI i sačuva JPEG u `games/<slug>/`.

```bash
python3 -m http.server 8765 &     # iz root-a repoa
# playwright-core instaliraj u scratchpad (ne u repo), pa pokreni kopiju skripte odatle
SHOT=cover node cover.mjs <slug> '<css selektori UI-ja, zarezom>' 'click:#startBtn;key:d:1500;wait:5000'
SHOT=hero  node cover.mjs <slug> '...' '...'
```

Akcije: `click:<sel>`, `key:<taster>:<ms>`, `wait:<ms>`. Uvek otvori dobijenu sliku i proveri da nema zaostalog UI-ja i da scena izgleda zanimljivo (u igri, ne start ekran; za kolekcije popuni scenu pa slikaj). Primeri koji rade:
- monster-lane: hide `#ui`, akcije `click:#startBtn;key:d:3000;wait:16000` (igrač stoji desno pa se na pristaništu skupi gomila)
- surprizi: hide `#topbar,#tabs,#open-panel,#progress-pill,#reveal-modal,#toast,#info-panel,#showroom-hint`, 5× `click:#open-btn;wait:3500;click:#reveal-close;wait:800`, pa `click:.tab-btn[data-mode=showroom];wait:3000`

## Balans i testiranje igre

- Igre imaju debug parametre u URL-u: monster-lane `?auto&q=0&sim=600` odmah startuje, bot odigra N sekundi (gađa kapije, kovčeg, pa gomilu), a rezultat piše u `document.title` i `window.simLog` (DPS po talasu, trajanje bossa). Za nove igre napravi isto — balans se meri simulacijom, ne pogađanjem.
- Bot je bimodalan ako ne gađa upgrade-e; pusti 4–5 simulacija i gledaj raspon, ne jedan rezultat.
- Monster Lane referentna kriva (posle rebalansa): bot stiže do talasa 5–6 za ~6 min, bossovi traju 17–50 s, broj mobova ≤ ~1000. Ne vraćati na lakše — korisnik je tražio težu igru.
- Pazi na performanse: kolizija je metci × mete, pa težinu diži HP-om, a ne beskonačnim brojem mobova.
- Bloom + NaN: bilo koji `pow()` sa bazom koja može biti < 0 daje NaN, a bloom ga razmaže u crni pravougaonik (bug „pola ekrana crno“ na MQ/HQ). Uvek `pow(max(x, 0.0), y)`; monster-lane ima i sanitize pass pre blooma.

## Konvencije za samu igru

- **Jedan HTML fajl** sa inline `<style>` i `<script>` je default. Veći asseti (slike, zvuk, modeli) idu pored u isti folder, sa relativnim putanjama — nikad apsolutnim `/...`.
- **Jezik UI-ja: srpski latinica** (`<html lang="sr">`), osim ako korisnik kaže drugačije.
- **Three.js** preko importmap-a sa jsDelivr, verzija fiksirana:
  ```html
  <script type="importmap">
  { "imports": {
      "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
      "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/" } }
  </script>
  <script type="module"> import * as THREE from 'three'; ... </script>
  ```
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
