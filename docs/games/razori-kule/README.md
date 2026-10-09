# Razori Kule (Smash the Towers) — tehnička mapa

2D artiljerija na potezima (canvas 2D, bez Three.js): igrač povlači unazad i pušta raketu na zamak iza planine, neprijatelj uzvraća. Teren se ruši (ćelije 10 px, otkinuti delovi padaju), zamak raste sa nivoom. Kutije daju magije (zemljotres, led, meteor, obnova, plotun), bure eksplodira. Fajl: `games/razori-kule/index.html` (~2 900 linija, jedan IIFE u `<script type="module">`).

Povezano: [BUGS](BUGS.md) · [TECH-DEBT](TECH-DEBT.md) · [IMPROVEMENTS](IMPROVEMENTS.md) · [TRACKER](TRACKER.md) · [LEDGER](LEDGER.md) · testovi u `tests/games/razori-kule/`.

## Kako se pokreće

`node serve.mjs` → `http://127.0.0.1:4173/games/razori-kule/`. Parametri: `?auto` (odmah igra + plotun), `&sim=<s>` (bot, rezultat u `window.simLog`), `&shot=boom`, `?ads=test`.

## Mapa koda (redom u fajlu)

| Deo | Šta radi |
|---|---|
| konstante, `I18N` | svet 1600×900, ćelija 10, voda, gravitacija; srpski/engleski |
| zvuk, napredak, SDK | `createAudioBus` (+ `noise()` za eksplozije), `razori-kule:progress` `{v:1, level, stars}`, `Gameroom` (reklame/analitika) |
| teren | `paintTerrain` (slojevi tla, kamen, sneg), `carve`/`stampCircles`, `detachLoose` → `makeChunk` (otkinuti delovi padaju) |
| bure, zamak, kutije | `placeBarrels`, `buildEnemyCastle` (raste sa nivoom), `placeCrates` |
| glow FX | `SPR` (meki sprite-ovi), `fireAt`/`smokeAt`/`ringAt`, `bigBoom`, `muzzleFx`, `drawGlow` (aditivno), `drawSmoke` |
| rakete, blokovi | `fireVelocity`, `explode`, `damageBlocks`, `updateRockets` (3 podkoraka), `updateBlocks` (oslonac, pad) |
| AI | `enemyShoot` (pretraga ugla i snage), magije neprijatelja |
| tok | `finish` (zvezdice, napredak), `showEnd`, `nextRound` (midgame), `endReward`, `refillRockets`, `startGame` (nastavak) |
| crtanje | nebo + sunce, `drawFar` (3 sloja paralakse), oblaci, teren, blokovi/vitez/kostur, `drawWater`, `drawTutorial`, `drawVignette`, blesak |
| kamera | `frameCamera`: pejzaž = ceo svet; portret = ~700 jedinica, prati raketu, na početku nivoa pogled na neprijateljski zamak (`revealT`) |

## Debug kuke

`window.__start()`, `window.__razori`: `fireVelocity(vx, vy)`, `state`, `progress`, `winNow()`, `loseNow()`, `setLevel(n)`, `setAmmo(n)`, `view()`, `give(kind)`, `detonate`, `solidCount()`, liste `rockets/blocks/orbs/barrels`.

## Monetizacija

| Mesto | Tip | Kada |
|---|---|---|
| `extra_rockets` | nagrada | kartica poraza: +5 raketa i nastavak borbe (jednom po kartici) |
| `double_score` | nagrada | kartica pobede: ×2 poena osvojenih na tom zamku |
| `refill` | nagrada | dugme u igri kad ostane ≤ 1 raketa (jednom po nivou) |
| `level_end` | preko celog ekrana | klik na „Sledeći zamak“ (SDK ograničava učestalost) |
| `resume` | preko celog ekrana | nastavak posle ručne pauze |

Ponude se prikazuju samo kad `rewardedAvailable` vrati `true`. Događaji: `game_start`, `first_minute`, `level_end` (`result`, `level`, `score`, `shots`, `stars`), `rewarded_offer`, `rewarded_watched`.

## Merenja

| Metrika | pre (2026-10-10) | posle |
|---|---|---|
| Igrivo (Fast 4G) | 0,64 s | ~0,7 s |
| Preuzimanje | 0,1 MB (ali 2,6 MB neiskorišćenih modela na Vercelu) | 0,1 MB, modeli u `art/` |
| FPS tokom pucnja (iGPU) | 59,9 / 1 % low 53,1 | 59,8 / 1 % low 42,6 |
| Telefon portret, vidljiva širina sveta | ~380 jedinica (samo sopstveni zamak) | ~700 + pregled neprijatelja na startu |

## Ocena kvaliteta (1–5)

| Oblast | Pre | Posle |
|---|---|---|
| Performanse | 5 | 4 |
| Izgled | 3 | 4 |
| Juice | 2 | 4 |
| UI | 3 | 4 |
| Prvih 30 s | 2 | 4 |
| Zvuk | 2 | 3 |
| Mobilni | 2 | 4 |
| Pouzdanost | 3 | 4 |

## Paleta

Nebo `#4f9be0`→`#fbe9cf`, tlo `#c07a4c`, trava `#36944a`, sneg `#eef7fc`, more `#40bed6`→`#125c84`, igrač `#2f74e0`, neprijatelj `#d43842`, tekst `#243044`, zlato `#f5b800`.
