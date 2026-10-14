# Remi Vita — tehnička mapa

Tabla za remi (kartaška igra uživo, za stolom): igrači sa imenima, dealer se sam pomera, aplikacija računa svaku partiju (zatvaranje −20, ruka −40 i ostalima duplo, „nije otvorio“ 100), granica sa kupovinom, statistika, istorija. Iza table je dekorativni 3D sto (šolja kafe, karte, čipovi, dealer žeton) u kafiću u sumrak (stakleni paviljon sa crepom, lampicama i cvećem; početna ga gleda sa trga, a igra ulazi kamerom do stola). Igra nema zvuk. Fajlovi: `games/remi-vita/index.html` (UI i logika), `games/remi-vita/table3d.js` (3D sto, kamera, učitava se lenjo), `games/remi-vita/cafe3d.js` (kafić; gradi se u metrima, `S = 13` jedinica scene po metru), `logo.svg` (logo: karte + kafa).

Povezano: [BUGS](BUGS.md) · [TECH-DEBT](TECH-DEBT.md) · [IMPROVEMENTS](IMPROVEMENTS.md) · [TRACKER](TRACKER.md) · [LEDGER](LEDGER.md) · testovi u `tests/games/remi-vita/`.

## Kako se pokreće

- `/games/remi-vita/` preko servera (ne `file://` — importmap i moduli).
- `?demo` (ili `?demo=2`) — 4 igrača i 4 odigrane partije, za snimke i proveru izgleda.
- `?no3d` — bez WebGL stola (brzi testovi logike; aplikacija je ista).
- `?lang=en|sr`, `?ads=test` (lažna reklama za otključavanje stola).

## Mapa koda (`index.html`)

| Sekcija | Šta radi |
|---|---|
| `i18n` | EN + SR rečnik |
| `storage` | ključevi `remi-vita:current / history / names / rules / prefs`, `DEFAULT_RULES` |
| `wake lock` | ekran ostaje upaljen (zvuka nema od 2026-10-14) |
| `scoring (pure)` | `scoreRound(round, rules, active)` i `derive(match)` — sve se računa ponovnim prolazom kroz događaje |
| `setup` | igrači (redosled = redosled deljenja), pravila |
| `board` | tabela (`renderBoard`), banner dealera, `commitRound`, undo |
| `round sheet` | dva koraka: 1) ko je zatvorio (`.wbtn`, tastatura 1–9 bira), 2) poeni (`#changeWinner`, `#wtype`, `.entry` + „Nije otvorio“, `#keypad` 0–9/⌫/Dalje), živi pregled, izmena/brisanje partije |
| `rebuy / end` | kupovina posle granice, kraj igre (podijum, deljenje rezultata, istorija), `showMidgame` pri revanšu/povratku |
| `menus` | statistika (SVG grafik), istorija, podešavanja (ekran, sto, jezik, `gameroom:back`) |
| `3D table` | `import('./table3d.js')` posle prvog iscrtavanja; bez WebGL-a ostaje CSS pozadina. `setMode(screen, snap)`: otvaranje direktno na tabli ne leti sa trga |

### Tok podataka

`match = { v: 1, players, rules, events: [round | rebuy | out], ended }`. Partija čuva izračunate `scores` (promena pravila ne menja istoriju). `derive()` vraća zbirove, ko je ispao/čeka odluku o kupovini, ko deli sledeći (sledeće aktivno mesto posle prošlog dealera; prvu deli prvi igrač), rang i `over`. Undo/izmena = izmena niza događaja + ponovni `derive`. Čuva se posle svake promene.

### Debug kuke

| Kuka | Šta radi |
|---|---|
| `__remi.start(names, rules)` | nova igra (id-jevi `p0, p1, …`) |
| `__remi.round(winner, 'close'|'hand', hands, no)` | upis partije kao iz UI-ja |
| `__remi.rebuy(pid, yes)` | odluka o kupovini |
| `__remi.derive(__remi.match)`, `__remi.state` | trenutno stanje |
| `__remi.scene` | 3D sto (`rain`, `deal`, `shuffle`, `looseCount`) |

## Monetizacija

- SDK: `Gameroom.init({ game: 'remi-vita', kids: false })`; `gameplayStart` dok je tabla otvorena.
- Reklama za nagradu `theme`: premium stolovi (Bordo, Noar). Kad reklame nisu dostupne (običan web), svi stolovi su slobodni — ništa se ne zaključava bez ponude.
- Reklama preko celog ekrana samo posle kraja igre (revanš / početna), SDK ograničava učestalost.
- Događaji: `game_start`, `round_saved`, `first_minute`, `level_end` (kraj igre), `rewarded_offer`, `rewarded_watched`.

## Merenja (baseline 2026-10-14)

| Metrika | Vrednost | Cilj |
|---|---|---|
| Preuzimanje (igra bez deljenog Three.js) | ~95 KB HTML + 27 KB JS + ikone | < 5 MB |
| UI bez 3D | odmah (3D se učitava posle prvog iscrtavanja) | < 3 s |
| Draw call-ovi | ~60 (sto, šolja, čipovi) + do 46 karata × 2 | < 300 |
| Greške u konzoli | 0 (Playwright) | 0 |
| FPS | nije mereno na pravom uređaju; adaptivno: DPR 1 pa bez senki ako je spor, tabla u mirovanju ~30 fps | 60 |

### Firefox (BUG-001)

Firefoxov WebRender pada (ceo browser) kad se na tabli animira `transform` u tabeli koja skroluje i ima sticky ćelije. Pravila za ovaj fajl:
- na tabli samo opacity/boja animacije; nigde rotacije, 3D, `perspective`, `scale(0)`, `backdrop-filter` ni `filter` u animacijama (čuva `tests/games/remi-vita/firefox-safe.spec.mjs`);
- Firefox dobija tabelu bez sticky ćelija (`@supports (-moz-appearance: none)`);
- provera u pravom Firefoxu: `python3 -m http.server 4180` iz korena, pa `python3 tests/tools/firefox-rounds.py` (jedan Firefox u isto vreme, sam se gasi).
