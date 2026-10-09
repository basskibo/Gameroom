# Osvoji svet (Conquer the World) — tehnička mapa

Strategija na mapi sveta (canvas 2D, piksel = polje): igrač bira državu, vojska raste sama, napadi pomeraju front polje po polje, more se prelazi brodom; AI države napadaju jedna drugu. Pobeda na 80 % kopna. Fajl: `games/osvoji-svet/index.html` (~2 500 linija) + `countries.js` (granice).

Povezano: [BUGS](BUGS.md) · [TECH-DEBT](TECH-DEBT.md) · [IMPROVEMENTS](IMPROVEMENTS.md) · [LEDGER](LEDGER.md) · testovi `tests/games/osvoji-svet/`.

## Plan i monetizacija

U `MONETIZATION.md` je vodi kao igru za decu / edukativnu: `Gameroom.init({ kids: true })` (reklame bez personalizacije, bez ličnih podataka).

| Mesto | Tip | Kada |
|---|---|---|
| `reinforce` | nagrada | posle 45 s igre, jednom po partiji: +50 % vojske |
| `game_end` | preko celog ekrana | klik na „Ponovo“ (SDK ograničava učestalost) |
| `resume` | preko celog ekrana | nastavak posle pauze |

Događaji: `game_start` (država), `first_minute`, `nation_conquered`, `game_end` (rezultat, %, trajanje, broj napada), `rewarded_*`.

## Mapa koda (redom)

jezik → statični podaci (planine, reke, jezera) → DOM → svet (raster, teren) → mreža suseda → napadi → brodovi → AI → tok igre (`update`, `step`, `checkEnd`, `finish`) → kamera → natpisi → crtanje (`draw`, talasi osvajanja `ripples`) → UI (`toast`, zvuk preko `shared/gameroom-audio.js`, SDK, `begin`) → ulaz → `loop`.

## Debug kuke

`window.__os`: `ready()`, `state()`, `begin(i)`, `finish(kind)`, `advance(sec)`, `troops()`. Parametri: `?auto`, `?sim=<s>`, `?bot`, `?ads=test`.
