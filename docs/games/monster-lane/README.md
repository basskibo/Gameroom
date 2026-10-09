# Monster Lane — tehnička mapa

Arkadna odbrana na molu (Three.js r170, toon izgled): igrač pomera pirata levo-desno, oružje puca samo, gusari silaze sa broda. Leva traka nosi kapije sa nadogradnjama, desna kovčege sa jačim oružjem, na kraju talasa dolazi kapetan (boss). Fajl: `games/monster-lane/index.html` (~3 000 linija).

Povezano: [BUGS](BUGS.md) · [TECH-DEBT](TECH-DEBT.md) · [IMPROVEMENTS](IMPROVEMENTS.md) · [TRACKER](TRACKER.md) · [LEDGER](LEDGER.md) · testovi u `tests/games/monster-lane/`.

## Kako se pokreće

```bash
node serve.mjs   # pa http://127.0.0.1:4173/games/monster-lane/
```

URL parametri: `?auto` (odmah počinje), `&sim=<s>` (bot igra N sekundi bez crtanja, log u `window.simLog`, rezime u `document.title`), `&nogates=<s>`, `&q=0|1|2` (kvalitet), `&closeup`, `?guide` (uvodni saveti i kad su već viđeni), `?ads=test` (lažna reklama za proveru toka).

## Fajlovi

| Putanja | Šta je |
|---|---|
| `games/monster-lane/index.html` | igra |
| `games/monster-lane/assets/models/*.glb` | 23 Kenney Pirate Kit modela, meshopt + WebP, ukupno ~0,28 MB |
| `art/monster-lane/` | originalni Kenney paket + `manifest.json` (ne ide na Vercel); `node tools/optimize-glb.mjs monster-lane` |
| `shared/gameroom-post.js`, `-fx.js`, `-audio.js`, `-sdk.js`, `-three.js` (`floatGeo`) | zajednički moduli |

## Mapa koda

Zaglavlja: `grep -n "^// [A-Z]" games/monster-lane/index.html`.

| Sekcija | Šta radi |
|---|---|
| I18N | engleski/srpski tekstovi (`shared/gameroom-i18n.js`) |
| CONFIG | mol, brod, trake, oružja (`WEAPONS`), kapije, bosovi |
| RENDERER / SCENE / CAMERA | renderer, `post` (bloom/ACES/grading), kamera prati širinu ekrana, sunce, nebo |
| ENVIRONMENT | ostrvo (SDF obala), okean šejder, trake kao pokretne trake, ograde, brodovi, oblaci, `mountPirateKit()` (GLB modeli) |
| MODELS | gusari/grmalj/kapetan kao spojena geometrija sa „walk“ šejderom, oružja, igrač |
| shared instanced meshes | mobovi (instancirani + kontura), meci, kocke-krhotine, `fx` (svetleće čestice), kontakt senke |
| GAME STATE / AUDIO | `state`, `sfx` preko `createAudioBus` (kompresor, ambijent mora) |
| SPAWNING / COMBAT / UPDATE | redovi gusara, kapije, kovčezi, boss, meci (z-binovi), eksplozije, hit-stop i „punch“ kamere |
| FLOW | `resetGame`, statistika (`monster-lane:stats`), SDK (oživljavanje, start sa minigunom), uvodni saveti, pauza |
| LOOP | kvalitet LQ/MQ/HQ (auto spuštanje), `post.render` |

## Debug kuke (`window`)

`__state()`, `__run(n, dt)` (n fiksnih koraka), `__start()`, `__kill()` (baza na 0), `__revive()`, `__give(tier, barrels)`, `__targetX()`, `__guide()`, `__models` (true kad stignu GLB modeli), `simLog`.

## Monetizacija (MONETIZATION.md)

| Mesto | Tip | Kada |
|---|---|---|
| `revive` | nagrada | kartica „Baza je pala“, jednom po partiji: baza 60 %, prvi redovi oduvani, boss vraćen nazad |
| `start_weapon` | nagrada | start kartica i kartica poraza: sledeća partija kreće sa Minigunom + 1 cev |
| `game_over` | preko celog ekrana | klik na „Ponovo“ (prirodna pauza; SDK ograničava učestalost) |
| `resume` | preko celog ekrana | nastavak posle ručne pauze (isto ograničenje) |

Događaji: `game_start`, `first_minute`, `wave_cleared`, `game_over`, `revive`, `guide_done`, `rewarded_offer`, `rewarded_watched` (+ `return_d1`, `session_end` iz SDK-a).

## Merenja

| Metrika | 2026-10-10 pre | 2026-10-10 posle |
|---|---|---|
| Preuzimanje do igre | 2,3 MB | 1,3 MB |
| Igrivo, Fast 4G | 3,5 s | 2,8 s |
| Modeli (Fast 4G) | u bloku sa stranom | 4,1 s, posle starta igre |
| Draw call-ovi (rani talas, sa post-obradom) | 428 | 366 |
| Trouglovi po kadru | 1,64 M | 1,09 M |
| FPS (iGPU, 10 s) | 59,8 / 1 % low 44,8 | 59,8 / 1 % low 44,7 (sa bloom-om) |
| JS heap | 19 MB | 16 MB |

Komande: `node .claude/skills/game-audit/scripts/audit.mjs monster-lane`, `node .cursor/skills/benchmark/scripts/benchmark.mjs monster-lane --seconds 10 --actions 'wait:8000'`.

## Ocena kvaliteta (1–5)

| Oblast | Pre | Posle |
|---|---|---|
| Performanse | 4 | 4 |
| Učitavanje | 3 | 4 |
| Animacije / juice | 3 | 4 |
| Izgled | 3 | 4 |
| Doslednost stila | 3 | 3 |
| UI | 4 | 4 |
| Prvih 30 s | 3 | 4 |
| Zvuk | 2 | 3 |
| Mobilni | 4 | 4 |
| Pouzdanost | 4 | 4 |

## Paleta

Pesak `#f7e2b2`, more `#0b5fb8`→`#3fe0d0`, mol `#c8915a`, leva traka `#7cc4ff`, desna `#ffd35c`, crvena gusara `#d62828`, zlato `#ffd23f`, kontura `#1a1022`, UI tamna `#1b1b2f`, akcent `#e63946`.
