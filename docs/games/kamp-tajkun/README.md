# Kamp Tajkun (Camp Tycoon) — tehnička mapa

3D tajkun u stilu „hyper-casual“ reklama (Three.js r170, toon): igrač hoda, seče drva, kolje svinje, bere jabuke, peca, nosi robu na leđima do stanica i tezgi, staje na krugove sa cenom da gradi. Fajl: `games/kamp-tajkun/index.html` (~2 250 linija).

Povezano: [BUGS](BUGS.md) · [TECH-DEBT](TECH-DEBT.md) · [IMPROVEMENTS](IMPROVEMENTS.md) · [TRACKER](TRACKER.md) · [LEDGER](LEDGER.md) · testovi u `tests/games/kamp-tajkun/`.

## Pokretanje i parametri

`node serve.mjs` → `/games/kamp-tajkun/`. `?auto` (nova igra bez save-a, bot), `&sim=<s>` (bot igra N sekundi, `window.simLog`), `&bot`, `&at=x,z`, `?ads=test`.

## Mapa koda

| Sekcija | Šta radi |
|---|---|
| I18N, CONFIG | tekstovi EN/SR; `PLOTS` (jednokratne zgrade), `JOBS` (radnici), `UPGRADES`, cene |
| RENDERER / SCENE | renderer, `post` (bloom, grading, bez ACES — boje ostaju kao u toon stilu), kamera prati igrača |
| WORLD | trava sa šarom (`gtex`), staze, busenje i krošnje sa vetrom (`sway`, `windU`) |
| ITEMS + PILES | `Pile` (gomile na leđima/policama), letovi robe, `CashPile` |
| PARTICLES | kockice (`burst`) + meke svetleće čestice `fx` (`sparkle`, `dust`) |
| CHARACTERS | proceduralni likovi, hod, sečenje, kolizije |
| AUDIO | `createAudioBus` (kompresor, šuma: vetar i ptice) |
| TREES … CUSTOMERS … WORKERS | izvori, stanice, tezge, mušterije, radnici, nosači, kasir, kamion porudžbina |
| BASE, BUY PADS, UNLOCKS | šator → koliba → kuća → vila → dvorac; krugovi za plaćanje |
| PLAYER, BOT | kretanje, skupljanje, zone; bot za `?sim` i strelica-savet |
| ADS + ANALYTICS | SDK: `helper`, `order_x2`, midgame na nastavku; događaji |
| SAVE / LOAD / FLOW | `kamp-tajkun:save` `{v:1,…}`, start/pauza, grafika (`createQuality`) |
| LOOP | `update` (logika), `updateVisuals` (kamera, vetar, čestice, ponude), `post.render` |

## Debug kuke

`__start()`, `__state()`, `__run(n, dt)`, `__money(v)`, `__unlock(id)`, `__helper()`, `__order()`, `__forceOrder()`, `simLog`.

## Monetizacija

| Mesto | Tip | Kada |
|---|---|---|
| `helper` | nagrada | posle 1. minuta i tezge za daske: besplatan drvoseča (žuta košulja) na 2 minuta |
| `order_x2` | nagrada | dok kamion čeka: duplo veća nagrada za porudžbinu, +15 s vremena |
| `resume` | preko celog ekrana | nastavak posle pauze (SDK ograničava) |

Događaji: `game_start`, `first_minute`, `unlock`, `upgrade`, `order_done`, `order_missed`, `rewarded_offer`, `rewarded_watched`.

## Merenja (2026-10-10)

| Metrika | pre | posle |
|---|---|---|
| Igrivo, Fast 4G (lokalni server bez kompresije) | 1,1 s (Three.js sa CDN-a, kompresovan) | 2,0 s (Three.js iz `shared/vendor`; Vercel ga kompresuje) |
| Draw call-ovi (start) | 140 | 151 (post-obrada +11) |
| FPS (iGPU) | 59,8 / 1 % low 42,7 | 59,4 / 1 % low 45,2 |
| JS heap | 10 MB | 8 MB |

## Ocena kvaliteta (1–5)

| Oblast | Pre | Posle |
|---|---|---|
| Izgled | 3 | 4 |
| Juice | 3 | 4 |
| Prvih 30 s | 3 | 4 |
| Zvuk | 2 | 3 |
| Pouzdanost | 3 | 4 |
| Performanse / mobilni / UI | 4 | 4 |

## Paleta

Trava `#8fd16a`→`#78be50`, zemlja `#dcc08c`, put `#c9a676`, krošnje `#3f8f3a`, šator `#e67e22`, UI `#2a1b3d`, zlato `#ffd84a`.
