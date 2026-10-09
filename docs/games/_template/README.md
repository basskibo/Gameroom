# <Ime igre> — tehnička mapa

Kratak opis igre. Fajl: `games/<slug>/index.html`.

Povezano: [BUGS](BUGS.md) · [TECH-DEBT](TECH-DEBT.md) · [IMPROVEMENTS](IMPROVEMENTS.md) · [TRACKER](TRACKER.md) · [LEDGER](LEDGER.md) · testovi u `tests/games/<slug>/`.

## Kako se pokreće

- URL, query parametri (`?auto`, `?sim=`…), da li radi sa `file://`.

## Mapa koda

| Linija | Sekcija | Šta radi |
|---|---|---|

### Tok podataka

Gde je stanje, šta je logika (`update`), šta prikaz, kada se čuva.

### Debug kuke

| Kuka | Šta radi |
|---|---|

## Merenja (baseline <datum>)

| Metrika | Vrednost | Cilj |
|---|---|---|
| Vreme do igre, Fast 4G | | < 3 s |
| Preuzimanje | | < 5 MB |
| FPS rano / kasno (avg / 1% low) | | 60 / ≥ 45 |
| Draw call-ovi rano / kasno | | < 300 / < 500 |
| JS heap | | < 120 MB |
| Greške u konzoli | | 0 |

## Ocena kvaliteta (1–5)

| Oblast | Ocena | Zašto |
|---|---|---|
| Performanse | | |
| Učitavanje | | |
| Animacije | | |
| Izgled | | |
| Doslednost stila | | |
| UI | | |
| Prvih 30 s | | |
| Zvuk | | |
| Mobilni | | |
| Pouzdanost | | |
