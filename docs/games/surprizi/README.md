# Surprizi (Surprise Toys) — tehnička mapa

Kolekcionarska igra za decu (Three.js r128, globalni `THREE`): kesica se trese i cepa, iskoči figura (obična / retka / legendarna), figure stoje u izložbi. Tokeni (5, novi na 22 s) otvaraju kesice. Fajl: `games/surprizi/index.html` (~5 200 linija, 257 KB). Dodavanje serija i figura: skill `surprizi-content`.

Povezano: [BUGS](BUGS.md) · [TECH-DEBT](TECH-DEBT.md) · [IMPROVEMENTS](IMPROVEMENTS.md) · [LEDGER](LEDGER.md) · testovi `tests/games/surprizi/`.

## Plan

Igra za decu: `Gameroom.init({ kids: true })`, bez reklama preko celog ekrana, samo reklama za nagradu koju dete samo bira. **Nikad nasumične kesice za pravi novac.**

| Mesto | Tip | Kada |
|---|---|---|
| `daily_bag` | nagrada | kad nema tokena, jednom dnevno (`surprizi:dailyBag`): +1 kesica |

Događaji: `game_start` (prvo otvaranje u sesiji), `bag_opened` (retkost, nova/duplikat), `collection_complete`, `rewarded_*`.

## Mapa koda

`grep -n "^/\* =====" games/surprizi/index.html`: JEZIK, PODACI (serije, figure, retkosti), UTILS, TEKSTURE, THREE.JS SETUP, CARTOON MATERIJALI, FIGURE (po frakcijama), KESICA, EFEKTI, ZVUK (sopstveni sintisajzer kroz kompresor), STANJE + ČUVANJE (save `v:3`), REKLAME + ANALITIKA, OTVARANJE, KAMERE, SHOWROOM, KONTROLE, PROMENA EKRANA, UI, INIT / PETLJA.

## Debug kuke

`window.__debug` (phase, tokens, mode), `window.__surprizi` (`setTokens(n)`, `tokens`, `syncDaily()`), `window.__timeScale`, `?debug=all`, `?open=legendary|rare|common`, `?mode=showroom`, `?ads=test`.

## Merenja (2026-10-10)

| Metrika | pre | posle |
|---|---|---|
| HTML | 860 KB (Three.js r128 inline) | 257 KB + `three.min.js` 603 KB koji se kešira |
