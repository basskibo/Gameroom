---
name: surprizi-content
description: Kako se u igrici "Surprizi" (games/surprizi/index.html) dodaje nova serija kesica ili nove igračke u postojeću seriju. Koristi kad korisnik traži "nova serija", "nove figure/igračke u Surprizima", "dodaj kesicu", "novi karakteri za surprizi".
---

# Surprizi — dodavanje serija i igračaka

Surprizi je jedan samostalan HTML fajl (`games/surprizi/index.html`, Three.js + Canvas2D,
bez build koraka). Sav sadržaj (serije, frakcije, igračke, izgled kesice) je definisan
u nekoliko JS objekata blizu vrha `<script>` bloka (posle THREE.js biblioteke), otprilike
u ovom redosledu: `FACTIONS` → `SERIES` → `RARITY` → `CHARACTERS`. Izgled same kesice
(`PACK_LOOK`, `PACK_CAST`) je niže, u sekciji "folijska kesica: prednja i zadnja grafika".
Sve se veže automatski preko `id`-jeva — nema posebne registracije na više mesta osim
onoga što je nabrojano ispod.

## Model podataka

- **`FACTIONS`** — mapa `id -> { id, name, emoji, color }`. Frakcija je "tim" unutar
  serije (npr. `ribice`, `rakovi` u seriji More). `color` je hex broj (`0xrrggbb`),
  koristi se za policu u showroom-u i za akcente na figuri.
- **`SERIES`** — mapa `id -> { id, name, badge, factions:[5 faction id-jeva], stops, back, band, ink, sticker }`.
  `factions` MORA imati tačno 5 id-jeva (showroom ima fiksno 5 polica, `SHELF_Y` niz).
  `stops/back/band/ink/sticker` su istorijska polja — trenutno se NE koriste za crtanje
  (proveri pre nego što im veruješ), ali ih popuni realnim, konzistentnim bojama serije
  jer opisuju paletu i mogu se koristiti kasnije. `badge` je tekst prikazan u podešavanjima
  ("SERIJA N · IME").
- **`RARITY`** — fiksno `common/rare/legendary`, ne dirati bez razloga (weights kontrolišu
  šansu izvlačenja).
- **`CHARACTERS`** — flat niz, pravi se pomoću helpera
  `C(id, name, faction, rarity, base, accent, trim, desc)`. `base/accent/trim` su hex boje
  za generičku 3D figuru (vidi ispod). `weightedRandomCharacter()` filtrira ovaj niz po
  `SERIES[pouchSeries].factions`, tako da čim je `faction` ispravan id, karakter je
  automatski uključen u izvlačenje — nema dodatnog spajanja.
- **`PACK_LOOK[seriesId]`** — `{ a, b, c, splash }`, hex-string boje. `a→b→c` je
  vertikalni gradijent kesice (vrh→dno), `splash` je boja okrugle "1 IGRAČKA" značke.
  Ovo je STVARNA boja kesice — `SERIES.stops/back` NIJE.
  Odaberi kombinaciju koja se jasno razlikuje od postojećih serija (Slatki svet je
  žuto-roze-ljubičasta, Garaža žuto-crvena, More cijan-plava) — proveri kontrast na oba
  kraja gradijenta jer `a` mora biti dovoljno svetla da tekst/ilustracije iznad nje ostanu
  čitljivi.
- **`PACK_CAST[seriesId]`** — niz od TAČNO 3 funkcije `(ctx) => void` koje crtaju po jednog
  lika na kesici (levo/sredina/desno; srednji je "hero" i crta se veći). Svaka funkcija
  crta oko tačke (0,0) u prostoru otprilike -50..50 na x, -90..90 na y (translacija i skala
  se rade spolja, u `drawPackCast`). Postojeći stil: `stickLimb()` za ruke/noge,
  `cartoonEye()`/`cartoonGrin()` za lice, `inkPath()` za crni obrub oko fill-a. Kopiraj
  jednu postojeću (npr. `sketchCarrot`, `sketchApple`) kao template za nove.
  `drawPackCast` sam dodaje sjaj/senku (`addToonShading()`), belu "sticker" konturu
  (`silhouette()`), senku na "podu" i pozadinske zvezdice oko cele ekipe — NE treba ih
  ponovo crtati unutar sketch funkcije, samo nacrtaj lik centriran oko (0,0).

## Generička 3D figura (nema potrebe za ručnim 3D modelom po liku)

`buildSuperToy(char)` gradi 3D "toy" figuru SAMO iz `char.base/accent/trim` boja i
`char.rarity` (rariji karakteri dobijaju masku/krunu). Ne treba pisati novi 3D model za
svaki lik — 120 postojećih likova (4 serije × 30) sve dele ovu funkciju.

Za malo vizuelnog identiteta po frakciji, `addToyExtra(g, char, base, accent, trim)` ima
`if(fac==='...')` grane koje lepe mali "topper" (npr. listić, rogovi, peraje, tocak...)
na generičku figuru. Kad dodaješ NOVU frakciju, dodaj i jednu granu ovde — nije obavezno
(figura radi i bez toga), ali izgleda mnogo bolje. Pogledaj granu za `fac==='citrusi'` ili
`fac==='korenasto'` kao primer (par jednostavnih `THREE.Mesh` objekata pozicioniranih
oko `y:0.66-0.73`, glava figure).

## Showroom (izlog) — soba po seriji

Showroom ima pozadinu/zid/pod koji zavisi od `showroomSeries`:
- `ROOM_BACKDROP[seriesId]` — niz od 3 hex-string boje za gradijent neba iza figura.
- `WALL_PAINT[seriesId]` / `FLOOR_PAINT[seriesId]` — mape id → funkcija `(ctx, s) => void`
  koje crtaju teksturu zida/poda (canvas 2D, kvadrat veličine `s`). Ako serija nije u ovim
  mapama, automatski pada nazad na "slatko" izgled (`paintSweetWall`/`paintSweetFloor`) —
  radi i bez toga, ali je bezveze da nova serija izgleda kao stara. Dodaj `paintXWall`/
  `paintXFloor` funkciju (kopiraj `paintFruitWall`/`paintFruitFloor` kao template) i upiši
  je u obe mape.
- `#series-bar` u HTML-u ima po jedno dugme `<button data-series="...">emoji Ime</button>`
  po seriji — dodaj novo dugme kad dodaješ seriju (koristi se za filter u showroom-u).
  Bar ima `overflow-x:auto`, pa i kad ima puno dugmadi neće pući layout, ali drži labelu
  kratku (emoji + 1-2 reči).

## Checklist — nova serija

1. **`FACTIONS`**: dodaj 5 novih frakcija (`id, name, emoji, color`) — različite boje
   međusobno, tematski vezane za seriju.
2. **`SERIES`**: dodaj novi `id` sa `name`, `badge` ("SERIJA N · IME"), `factions` (tih 5
   novih id-jeva), i popuni `stops/back/band/ink/sticker` bojama koje odgovaraju paleti.
3. **`PACK_LOOK[id]`**: `a/b/c/splash` — unikatan gradijent, vizuelno različit od svih
   postojećih serija.
4. **`PACK_CAST[id]`**: 3 nove `sketchXxx` funkcije (ili iskoristi postojeće ako tematski
   pašu), tematski vezane za seriju, u istom stilu kao ostale (stickLimb + cartoonEye +
   cartoonGrin + inkPath).
5. **`CHARACTERS`**: po frakciji tačno 6 likova — **3 common, 2 rare, 1 legendary**
   (ovo nije proizvoljno: `RARITY` weights i 6-kolonski prikaz na zadnjoj strani kesice
   računaju na ovaj raspored). Znači 5 frakcija × 6 = 30 likova po seriji. Svaki lik:
   unikatan `id` (kebab-case, BEZ dijakritika — proveri da se ne poklapa sa postojećim
   id-jevima u celom fajlu), `name` (sa dijakritikom, srpski), `faction`, `rarity`,
   `base/accent/trim` (hex brojevi, ne moraju biti "realistične" boje — igra je crtana
   stilizovano), i `desc` (1 rečenica, igriva, srpski).
6. *(Opciono ali preporučeno)* `addToyExtra`: nova `else if(fac===...)` grana za 5 novih
   frakcija — mali topper na 3D figuri.
7. *(Opciono ali preporučeno)* `ROOM_BACKDROP[id]`, `paintXWall`/`paintXFloor` +
   upis u `WALL_PAINT`/`FLOOR_PAINT`, za showroom sobu koja liči na temu serije.
8. **HTML**: novo dugme u `#series-bar`.
9. Nema drugih mesta za izmenu — `activeSeriesIds()`, `CHAR_BY_ID`,
   `weightedRandomCharacter()`, `renderSeriesSettings()`, `updateProgressUI()` (ukupan
   broj u "X / Y skupljeno") i `buildAllPouchTex()` sve rade automatski nad
   `Object.keys(SERIES)`/`CHARACTERS`.

## Checklist — nove igračke u POSTOJEĆOJ seriji

1. Dodaj `C(...)` red(ove) u `CHARACTERS`, sa `faction` iz te serije. Ako dodaješ manje
   od punog kompleta od 6 po frakciji, pazi da ne pokvariš postojeći raspored (npr. ne
   dodavati 3. legendary u istu frakciju — to menja šansu izvlačenja neproporcionalno).
2. Ako je karakter dovoljno poseban da zaslužuje sopstveni "topper" (a ne samo
   frakcijski), dodaj `if(id==='...')` granu NA VRH `addToyExtra` (pre frakcijskih grana —
   pogledaj kako su `krofnica`/`ananas`/`heliko` urađeni, id-based grane idu pre
   faction-based).
3. Nije potrebno dirati `PACK_CAST` — kesica prikazuje samo 3 "maskotska" lika po
   seriji, ne svaki lik.

## Testiranje

Fajl se ne otvara preko `file://`. Iz root-a repoa:
```bash
python3 -m http.server 8765
```
Debug query parametri (`games/surprizi/index.html?...`):
- `?debug=all` — otključa sve likove (za brz pregled showroom-a bez grinda).
- `?open=common|rare|legendary` — odmah otvori kesicu sa likom te retkosti (300ms posle
  učitavanja), korisno za testiranje reveal efekata bez čekanja RNG-a.
- `?mode=showroom` — otvori direktno na showroom tabu.

Za headless screenshot (playwright je dostupan globalno u ovom cloud okruženju,
`require('playwright')`): učitaj stranicu, sačekaj `window.__debug.phase` (globalna
promenljiva koju `animate()` ažurira svaki frejm — `phase`, `phaseTime`, `mode`, itd.) da
stigne u fazu koja te zanima (`'idle'`, `'burst'`, `'result'`) pre screenshot-a, umesto
fiksnog `waitForTimeout` — animacija ima više faza (shake→tear→burst→result) čije trajanje
zavisi od retkosti (`SHAKE_DUR`), pa fiksni wait lako promaši trenutak.

Za forsiranje određene serije u testu (nema URL parametra za ovo):
```js
await page.evaluate(() => { pouchSeries = 'voce'; spawnPouch(true); });          // otvaranje tab
await page.evaluate(() => { showroomSeries = 'voce'; rebuildShowroom(); });      // showroom tab
```

Uvek posle izmene: proveri da nema JS grešaka u konzoli (osim mrežnih grešaka za Google
Fonts ako je sandbox bez interneta — to nije pravi bug), i pogledaj bar jedan screenshot
kesice (Otvaranje tab) i jedan showroom-a za novu/izmenjenu seriju.

## Poznata ograničenja three.js verzije (r128, `shared/vendor/three-0.128.0/three.min.js`; do 2026-10-10 bila je inline u fajlu)

Ova verzija three.js-a NE podržava `InstancedMesh` per-instance boju kroz
`material.vertexColors + instanceColor` (šejderi za to su dodati u kasnijim verzijama) —
ako nešto treba više boja na instanced mesh-u, napravi po jedan `InstancedMesh` (materijal)
po boji, ne pokušavaj `setColorAt`/`vertexColors` (renderuje se crno, ne baca grešku).
Primer: `confettiPools` u sekciji EFEKTI. Takođe, ako praviš `InstancedMesh` pa odmah
gasiš `mesh.count = 0` PRE nego što pozoveš `setColorAt` u petlji za inicijalizaciju,
`instanceColor` bafer se alocira dužine 0 (koristi `mesh.count` u trenutku PRVOG
`setColorAt` poziva) — inicijalizuj boje dok je `count` još pun, tek onda spusti na 0.
