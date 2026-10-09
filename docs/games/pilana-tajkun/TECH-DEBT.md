# Pilana Tajkun — tehnički dug

Stvari koje rade, ali koče performanse, razvoj ili plan. Procena: **S** < pola dana, **M** 1–2 dana, **L** 3+ dana. Uticaj: koliko vraća (performanse, brzina razvoja, rizik).

| ID | Uticaj | Procena | Status | Naslov |
|---|---|---|---|---|
| PT-TD-001 | visok | L | plaćen 2026-10-09 | 650–2 100 draw call-ova: svaki `part()` je poseban mesh |
| PT-TD-002 | visok | M | plaćen 2026-10-09 | 17 MB GLB bez kompresije + 11 MB nekorišćenih asseta |
| PT-TD-003 | srednji | S | plaćen 2026-10-09 | `models-bundle.js` (25 MB) je generisan fajl u gitu i ide na Vercel |
| PT-TD-004 | srednji | M | plaćen 2026-10-09 | Three.js ugrađen kao tekst (690 KB), bez keša između igara |
| PT-TD-005 | srednji | L | otvoren | Jedan fajl od 8 300 linija, globalno stanje, magični brojevi |
| PT-TD-006 | srednji | M | otvoren | Logika u prikazu, `?sim` ide drugim putem od prave igre |
| PT-TD-007 | nizak | S | otvoren | Mrtav kod i mrtva nadogradnja (`buyers`, `plantForest`, `dressCamp`…) |
| PT-TD-008 | srednji | M | delimično | Alokacije u petlji frejma (GC pauze) |
| PT-TD-009 | srednji | S | otvoren | Cepanice: sve matrice se prepisuju svaki frejm; O(n·k) uklanjanje |
| PT-TD-010 | srednji | S | delimično | Senka se crta svaki drugi frejm; puna brzina i na pauzi |
| PT-TD-011 | nizak | S | otvoren | DOM: leteći brojevi, toast i knjige preko `innerHTML`/`setTimeout` |
| PT-TD-012 | srednji | M | plaćen 2026-10-09 | Zvuk: sirovi oscilatori bez master busa, bez ambijenta |
| PT-TD-013 | visok (plan) | M | otvoren | Nema i18n sloja: stotine stringova na engleskom u kodu |
| PT-TD-014 | visok (plan) | S | otvoren | Nije povezan `shared/gameroom-sdk.js`, nema analitike |
| PT-TD-015 | nizak | S | otvoren | Save bez validacije tipova i šeme |
| PT-TD-016 | nizak | S | otvoren | `Math.random` svuda: scena i testovi nisu ponovljivi |
| PT-TD-017 | srednji | — | otvoren | Kolizije i raspored kao stotine ručnih koordinata |
| PT-TD-018 | nizak | S | plaćen 2026-10-09 | Asset fajlovi sa razmacima i dijakriticima u imenu |
| PT-TD-019 | nizak | S | otvoren | Git repo raste od binarnih fajlova (26 MB pack + garbage) |
| PT-TD-020 | srednji | S | otvoren | Trzaji kad se nova zgrada prvi put pojavi u kadru (kompajliranje shader-a) |

## Detalji

### PT-TD-001 — Draw call-ovi
- **Stanje:** `part(geo, mat, parent, …)` pravi novi `THREE.Mesh` za svaku kocku, cilindar, gredu. Zgrada od 30–60 delova = 30–60 draw call-ova, i još toliko u senci. Izmereno: 644 rano, 1 303 kasno (srednja kamera), 2 096 kasno (daleko). 513k trouglova.
- **Plan:** (1) posle gradnje statične grupe pozovi `mergeStatic(group)`: pokupi mesh-eve koji se ne animiraju, `applyMatrix4(matrixWorld)`, grupiši po materijalu, `mergeGeometries`. (2) Ponavljane stvari (ograda, lampe, parking linije, bay kapije, stubovi trake) → `InstancedMesh`. (3) Sakrij sitne detalje po udaljenosti kamere. `BufferGeometryUtils` je već u `assets/three/`.
- **Cilj:** < 300 rano, < 500 kasno. Test: `perf.spec.mjs` (`fixme` dok se ne postigne).

### PT-TD-002 — Asseti
- **Korišćeno:** 23 GLB-a, 16,9 MB. Od toga 8 likova (Quaternius) ~11,6 MB: svaki ima sopstveni skelet i iste animacije. Najveći: Range Rover 2,2 MB, Bakery 2,1 MB.
- **Nekorišćeno a deployuje se:** 33 fajla, 10,9 MB (`Trees by Quaternius` 3,4 MB, `Factory … 3mmIBtmmkkW` 1,2 MB, ceo `assets/v1/` 4,3 MB, Cargo Truck, SUV, Campfire, Forklift, House, Pine Trees, Road Bits, Tree ×2, Wagon 9J0…, duplikati sa „(1)“).
- **Plan:** `gltf-transform optimize --compress meshopt --texture-compress webp --texture-size 512–1024` za svaki korišćeni model; jedan zajednički rig + animacije za likove; nekorišćene fajlove obrisati ili staviti u `.vercelignore`. Meshopt dekoder ide kao običan JS u `assets/three/`.
- **Cilj:** < 4 MB ukupno.

### PT-TD-003 — `models-bundle.js` u gitu
- Generisan iz `assets/` (base64 + kod GLTFLoader-a), nema skripte koja ga pravi, pa se lako raziđe sa `assets/`. Ima i ključeve koje igra ne koristi (`house`, `plankMill`, `factoryA`).
- Posle PT-BUG-001 http ga više ne traži, ali i dalje ide na Vercel (25 MB po deployu).
- **Plan:** skripta `games/pilana-tajkun/tools/build-bundle.mjs` (iz liste `files` u igri), dodati fajl u `.vercelignore`. Odluka korisnika: da li je `file://` i dalje potreban (vidi TRACKER „Odluke“).

### PT-TD-004 — Three.js kao tekst u HTML-u
- `<script type="text/plain" id="three-src">` (690 KB minifikovano) + `import(blobURL)`. Isto i GLTFLoader/SkeletonUtils/BufferGeometryUtils preko `fetch` + regex zamene importa.
- Cena: HTML 1,1 MB, nema deljenog keša sa drugim igrama, parsiranje svaki put.
- **Plan (ako `file://` nije uslov):** importmap na jsDelivr kao u `browser-games` skillu, ili `shared/vendor/three.module.min.js`. Ako jeste uslov: zadržati, ali izdvojiti u `shared/vendor/three.text.js` koji se učitava klasičnim `<script>` (radi i sa diska).

### PT-TD-005 — Struktura koda
- Sve u jednom modulu, ~150 top-level funkcija, zajedničko globalno stanje (`S`, nizovi agenata), stotine koordinata napisanih rukom. Lako se slomi raspored kad se nešto pomeri.
- **Plan:** bez build koraka je moguće podeliti u više `<script type="module">` fajlova preko http-a, ali `file://` to ne dozvoljava (CORS). Do te odluke: održavati mapu sekcija u `README.md`, dodavati sekcije sa `// ===` zaglavljem, držati konstante rasporeda na vrhu sekcije.

### PT-TD-006 — Logika u prikazu, sim drugačiji od igre
- `fillLogs` (troši `S.timber`) se zove iz `updateVisuals`. U `?sim` (`instant`) režimu testera seče fiksno 6 komada po trupcu, a u igri 5–8 (`LP * randInt(5,8)`); drvoseče u sim-u ne hodaju; `removePieces` se preskače.
- Posledica: balans iz simulacije odstupa od prave igre; ekonomija zavisi od toga da li se crta.
- **Plan:** trupac na traci kao logičko stanje u `update`, prikaz samo čita; sim i igra isti kod, razlika samo u preskakanju mesh-eva.

### PT-TD-007 — Mrtav kod
- `buyers` u `UP` (skriven u `rowShown`, ali kupljiv preko `buy` i sim bota), `plantForest` i `dressCamp` (definisani, nikad pozvani), `placeTubPad() {}`, `planerMill` grupa (uvek `visible = false`), `pieceIM` rezerva posle učitavanja modela, ključevi u bundle-u.
- **Plan:** obrisati uz migraciju save-a za `buyers` (nivo se ignoriše).

### PT-TD-008 — Alokacije u petlji frejma
- `Truck.update`: `const prevPos = this.pos.clone()` svaki korak; `Forklift.update`: `prev = this.pos.clone()`; `sfx.near` pravi `V()` po zvuku; `updateCamera` pravi 3 vektora kad je taster pritisnut; `syncTapRings` pravi niz objekata svaki frejm; `customers.filter(...)` više puta po frejmu; `addMoney(..., V(...))` po prodaji; `new THREE.Color()` u `removePieces`/`evictSettled`.
- **Plan:** modul-nivo privremeni objekti, keš nizova, brojači umesto `filter().length`.

### PT-TD-009 — Cepanice u kadici
- `updatePieces`: dok bilo koja cepanica leti, `compose` + `setMatrixAt` za svih do 1 400 instanci, svaki frejm.
- `removePieces(n)` i `evictSettled(n)`: za svaki komad prolaz kroz ceo niz (O(n·k)).
- **Plan:** ažuriraj samo leteće + dirty opseg (`instanceMatrix.updateRanges`), visine držati u heap-u po ćeliji.

### PT-TD-010 — Senka i render na pauzi
- `renderer.shadowMap.needsUpdate = true` svaki drugi frejm bez obzira na promenu; senka 1024² se razvlači do ±60 jedinica (mutna na velikom zoomu); svi statični mesh-evi u shadow pass-u.
- Na pauzi i iza start ekrana scena se crta punom brzinom.
- **Plan:** senku osvežavati na pomeraj kamere ili gradnju; statične senke „ispeći“ u teksturu tla; na pauzi `setAnimationLoop(null)` ili 5 FPS.

### PT-TD-011 — DOM
- `floatText`: novi `div` + 2 `setTimeout` po događaju; `toast` preko `innerHTML`; `drawBooks` prepisuje ceo `innerHTML` na 0,35 s dok su knjige otvorene.
- **Plan:** bazen elemenata, `textContent`, patch kao u `drawShop`.

### PT-TD-012 — Zvuk
- Svaki zvuk = novi oscilator spojen direktno na `destination`; nema master gain-a ni kompresora, nema muzike ni ambijenta, „mute“ je samo zastavica.
- **Plan:** audio bus (master → kompresor → destination; grane sfx/music/ambience), uzorkovani zvuci (mali OGG/MP3), jačine u podešavanjima (PT-IMP-S01…S03).

### PT-TD-013 — i18n
- Svi tekstovi su na engleskom, razbacani po HTML-u, `STATIONS`, `UP_INFO`, `upEffect`, toast pozivima, knjigama. Plan (Faza 0) traži srpski + engleski i izbor jezika.
- **Plan:** `const T = { en: {...}, sr: {...} }` + `t(key, vars)`; HTML sa `data-i18n`; jezik iz `navigator.language` i iz menija. Zajednički helper u `shared/i18n.js`.

### PT-TD-014 — SDK i analitika
- `shared/gameroom-sdk.js` postoji (prazan adapter), Pilana ga ne učitava. Plan kaže da je Pilana prva igra za povezivanje.
- **Plan:** `<script src="../../shared/gameroom-sdk.js">`, `Gameroom.init()`, `gameplayStart/Stop` na start/pauzu, `track('game_start' | 'first_minute' | 'session_end' …)`, mesta za reklamu za nagradu (×2 zarada 3 min, odmah gotova nadogradnja, ×2 offline).

### PT-TD-015 — Save
- Verzija postoji (`v: 2` + `LEGACY_VALS` migracija), ali polja se ne validiraju po tipu (PT-BUG-019), nema šeme ni testa migracije sa stvarnim starim save-om.
- **Plan:** `validateSave(d)` sa podrazumevanim vrednostima; test sa fiksturom v1 save-a.

### PT-TD-016 — Nasumičnost
- Raspored drveća, boje cepanica, kore i talasa zavise od `Math.random` → svaki start drugačiji, screenshot testovi nisu mogući, cover slike se razlikuju.
- **Plan:** `mulberry32(seed)` RNG za generisanje scene; `?seed=` parametar.

### PT-TD-017 — Ručne koordinate
- `cleared()` ima ~35 pravougaonika, putanje agenata su liste tačaka, kolizija viljuškara je posebna logika po zoni.
- **Plan:** dugoročno: jedan opis rasporeda (zone + putanje) iz kog se izvode i šuma i putanje. Kratkoročno: test koji proverava da agenti ne stoje (`economy.spec.mjs`).

### PT-TD-018 — Imena fajlova
- `Fence by Tomáš Bayer - aKD_ayzKYHw.glb` itd. Razmaci i dijakritici traže URL enkodiranje i lome neke alate.
- **Plan:** preimenovati u kebab-case (`fence-bayer.glb`) zajedno sa PT-TD-002.

### PT-TD-019 — Veličina gita
- `.git` pack 26 MB, plus 42 „garbage“ privremena objekta. Svaka nova verzija GLB-a ili bundle-a dodaje megabajte.
- **Plan:** `git gc`; za ubuduće Git LFS za `*.glb` (odluka korisnika).

### PT-TD-020 — Kompajliranje shader-a pri prvom pojavljivanju

Kasna igra ima 1% low ~20 FPS zbog nekoliko frejmova od 50–150 ms kad se kupljena zgrada prvi put nacrta (novi materijal/kombinacija → kompajliranje programa). Rešenje: `renderer.compileAsync(scene, camera)` posle učitavanja modela i pre otkrivanja zgrade, ili deljenje materijala tako da nove zgrade ne prave nove programe.
