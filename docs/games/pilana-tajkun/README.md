# Pilana Tajkun — tehnička mapa

3D idle/tajkun igra pilane (Three.js r170). Igrač kupuje nadogradnje na mašinama, a radnici, viljuškari, kamioni i kupci rade sami. Fajl: `games/pilana-tajkun/index.html` (~8 700 linija, ~420 KB).

Povezano: [BUGS](BUGS.md) · [TECH-DEBT](TECH-DEBT.md) · [IMPROVEMENTS](IMPROVEMENTS.md) · [TRACKER](TRACKER.md) · [LEDGER](LEDGER.md) · [izveštaj 2026-10-09](REPORT-2026-10-09.md) · testovi u `tests/games/pilana-tajkun/`.

## Kako se pokreće

Igra se otvara **samo preko http-a** (`file://` više nije podržan od 2026-10-09: Three.js i zajednički moduli se učitavaju iz `shared/` preko importmap-a).

```bash
node tests/server.mjs          # pa http://127.0.0.1:4173/games/pilana-tajkun/
python3 -m http.server 8000    # ili http://localhost:8000/games/pilana-tajkun/
```

URL parametri: `?auto` (ne učitava save), `?sim=<s>` (bot igra bez crtanja, rezultat u `window.simLog`/`window.simInfo`), `&smart` (pametniji bot), `?nointro` (bez uvodnog preleta kamere — koriste ga testovi).

## Fajlovi

| Putanja | Šta je |
|---|---|
| `games/pilana-tajkun/index.html` | igra |
| `games/pilana-tajkun/assets/models/*.glb` | 23 modela, meshopt + WebP, ukupno ~2,6 MB |
| `games/pilana-tajkun/CREDITS.md` | autori i licence modela (isto i u igri: ⚙ → Credits) |
| `art/pilana-tajkun/` | originalni modeli + `manifest.json` (ne ide na Vercel) |
| `tools/optimize-glb.mjs` | `node tools/optimize-glb.mjs pilana-tajkun` pravi `assets/models/` iz `art/` |
| `shared/vendor/three-0.170.0/` | Three.js i dodaci (zajedničko za sve igre) |
| `shared/gameroom-three.js` | `bakeStatic`/`bakeViz` (spajanje geometrije), `createQuality` (Auto/High/Low) |
| `shared/gameroom-fx.js` | sistem čestica (jedan draw call) |
| `shared/gameroom-audio.js` | audio bus (kompresor, sfx/muzika/ambijent), `haptic()` |

## Mapa koda (sekcije u `index.html`)

Brojevi linija su približni (2026-10-09). Zaglavlja: `grep -n "^// [A-Z]" games/pilana-tajkun/index.html`.

| Linija | Sekcija | Šta radi |
|---|---|---|
| 1–300 | `<style>` | HUD, paneli, animacije panela/dugmadi, start/pauza/save/credits ekrani |
| ~300–460 | HTML | `#ui`, `#top` (HUD), `#shop`, `#books`, `#nav`, `#loadBar`, overlay ekrani |
| ~462 | importmap + moduli | `three`, `three/addons/`, `shared/gameroom-*.js` |
| 472 | CONFIG / ECONOMY | `UP` (nadogradnje), cene, `SAVE_KEY` |
| 597 | RENDERER / SCENE / LIGHTS | renderer, PMREM okruženje, sunce (senka prati kameru), `fx`, kvalitet (`gfx`) |
| 667 | MATERIALS / GEOMETRY | keš `mat()`, `rbox()`, `cylG()`, `boxG()`, `part()`, `canvasTex()` (ponovo crta natpise kad stigne font) |
| 773–1570 | LAYOUT, TERRAIN, ROADS, YARD, BRIDGE, TOLL, MARKET, FOREST | statična scena (spojena sa `bakeStatic`) |
| 1571 | SAWMILL | 3 trake, testera, trupci, piljevina (`fx`) |
| 1750 | LOGGING CAMP | drvoseče, šuma, pad drveta (lišće), taksa |
| ~2100–2350 | bin + cepanice | kadica, instancirane cepanice |
| 2352 / 2429 | TRUCK / FORKLIFT MODEL | proceduralni modeli, točak = 1 mesh (boje u temenima), kočiona svetla |
| 2468 | TRUCK LOGIC | ruta, rampa, istovar, ugib, dim/prašina |
| 2666 | FORKLIFT LOGIC | red na kapiji, utovar |
| 3039 | STATE / SAVE | `S`, knjige, poslovi, `save()/load()`, slotovi |
| 3194 | AUDIO | `sfx` preko zajedničkog audio busa, ambijent |
| 3233 | UI HELPERS | `floatText`, `toast` (tekst, ispod HUD-a), `addMoney`, novčići do HUD-a |
| 3305 | PLANER | rendisaljke + radnici |
| 3707 | CHIPPER | sečka (iverje) |
| 3764 | YARD SHOP | tezga, kupci, kola |
| 4047 | VENEER LATHE | ljuštilice |
| 5046 | JOINERY + FIREWOOD + KITS | stolarija, drva, kitovi |
| 6026 | UPGRADES | `STATIONS`, `drawShop` (patch u mestu), `buy`, knjige, tap prstenovi, kontakt senke, senke oblaka |
| ~6740 | pops / gradnja | `popIn`, `growIn` (zgrada izraste uz prašinu), traka učitavanja |
| 6800 | CAMERA INPUT | drag/pinch/wheel, WASD, tap → panel + kamera klizi do mašine |
| 6954 | RUSH ORDERS | hitne porudžbine |
| 7621 | SIMULATION TICK | `update(dt)` — logika, fiksni korak 0,05 s |
| 7802 | VISUALS | `updateVisuals` — animacije, culling likova van kadra |
| 7890 | MAIN LOOP | `render()` — pauza ne crta ponovo, brojač novca, HUD na 200 ms |
| 7948 | START / PAUSE / RESET | start (uvodni prelet), pomoć, pauza, save/load, podešavanja |
| 8102 | INIT + debug kuke | spajanje „rasutih“ delova scene, `trackBuilds`, `window.__*` |
| ~8170 | `mountYardModels` | učitava GLB (meshopt), zamenjuje proceduralne modele uz „pop“ |
| ~8680 | `?sim` bot | headless balans |

### Pravila koja kod sad prati

- Statične grupe se posle gradnje spajaju (`bakeStatic(g, keep)` / `bakeViz(viz, ...roots)`). Sve što kod kasnije pomera ili pali/gasi mora biti u `keep` (ili vraćeno iz buildera u viz zapisu). Kad se grupa gradi ponovo: `dropGroup(staro)` pa `bakeStatic(novo)`.
- Logika u `update(dt)`, prikaz u `updateVisuals`. Na pauzi se `updateVisuals` ne zove i scena se ne crta ponovo dok se kamera ne pomeri.
- Novi efekat = `fx.emit/burst` (ne nov `THREE.Points`). Nova senka ispod pokretnog objekta = poziv `blob()` u `syncBlobs`.
- Nova zgrada koja se pojavljuje kupovinom → dodaj njen root u `trackBuilds(...)` i dobija animaciju gradnje.

### Debug kuke (koriste ih testovi i benchmark — ne brisati)

| Kuka | Šta radi |
|---|---|
| `__debug()` | snimak stanja |
| `__start()` | kao klik na PLAY |
| `__run(n, dt)` / `__step(n, dt)` | n koraka logike sa prikazom / bez |
| `__cheat(id, n)`, `__addMoney(v)` | kupovina / novac |
| `__cam(x, z, dist)`, `__camInfo()` | kamera |
| `__padScreen(upgradeId)` | ekranske koordinate tap tačke |
| `__deal(kind)`, `__rush(kind)` | ponuda kupca, hitna porudžbina |
| `__scene()` | `{ scene, renderer, camera, fx }` za alate |
| `window.__yardModels` | `true` kad su modeli učitani |

## Merenja

Intel Arrow Lake iGPU (Mesa), Chrome, 1280×800. Detalji i grafici: [REPORT-2026-10-09.md](REPORT-2026-10-09.md).

| Metrika | Audit (pre) | Posle faza A–D | Cilj |
|---|---|---|---|
| Do igre, Fast 4G | 24,3 s | 2,9 s | < 3 s |
| Preuzimanje | 25,7 MB (blokira) | 3,1 MB | < 5 MB |
| Modeli spremni, Fast 4G | 25,6 s | 5,7 s | < 6 s |
| FPS rano (avg / 1% low / p95) | 59,8 / 42,7 / 16,8 ms | 60,0 / 49,8 / 16,7 ms | 60 / ≥ 45 |
| FPS kasno, kamera daleko | 40,1 / 18,5 / 40,8 ms | 58,8 / 20,4 / 16,8 ms | 60 / ≥ 45 |
| Frejmovi > 20 ms za 8 s (kasno) | 144 | ~10 | ≤ 5 |
| Draw call-ovi rano (isti kadar) / kasno | 644 / 2 096 | ~240 / 835 | < 300 / < 500 |
| JS heap | 126–133 MB | 59 MB | < 120 MB |
| Klikovi na „kupi“ dok novac raste | 5/12 | 12/12 | 100 % |
| Greške u konzoli | 0 | 0 | 0 |

Kasni 1% low (~20 FPS) dolazi od nekoliko trzaja kad se nove zgrade prvi put pojave u kadru (kompajliranje shader-a) — PT-TD-020.

## Ocena kvaliteta (1–5)

| Oblast | Pre | Sada | Zašto |
|---|---|---|---|
| Performanse | 2 | 4 | 60 FPS i u kasnoj igri; ostaju retki trzaji |
| Učitavanje | 1 | 4 | 2,9 s na 4G, 3 MB, traka učitavanja, modeli „iskoče“ animirano |
| Animacije | 3 | 4 | gradnja, novčići, brojač, paneli, ugib kamiona, pad drveta |
| Izgled | 3 | 3 | bolje svetlo, kontakt senke, čestice — ali iste proceduralne mašine |
| Doslednost stila | 2 | 3 | realistična kola zamenjena low-poly; mašine i dalje kocke |
| UI | 3 | 4 | animirani paneli, toast ispod HUD-a, ⚙ meni čistiji |
| Prvih 30 s | 1 | 2 | dobar prvi kadar i prelet, ali 20 pasusa pravila ostaje |
| Zvuk | 2 | 3 | bus sa kompresorom, ambijent, slojevit zvuk kupovine; i dalje sintetizovano |
| Mobilni | 3 | 3 | radi; pravila i dalje dugačka |
| Pouzdanost | 4 | 5 | 47 testova, 0 grešaka, bez gubljenja klikova |

## Paleta

Narandžasta kamiona `#f2782a`, viljuškar `#f5a524`, HUD tamna `#1e2a33`, zlatna `#ffd84a`, trava `#6cbf47`/`#58ad3c`, voda `#3aa3dc`, pesak `#e7d49c`, crvena `#d8473b`, plava `#2f6fb5`.
