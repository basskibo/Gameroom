# Praćenje rada: bagovi, dug, unapređenja, tracker, ledger

Svaka igra ima isti set fajlova u `docs/games/<slug>/`. Šablon je u `docs/games/_template/`.

| Fajl | Šta je u njemu | Ko ga menja |
|---|---|---|
| `README.md` | Mapa koda igre (sistemi, gde su u fajlu), debug kuke, merenja (baseline) | Kad se struktura igre promeni |
| `BUGS.md` | Bagovi: šta, kako se reprodukuje, ozbiljnost, status | Kad se nađe ili reši bag |
| `TECH-DEBT.md` | Stvari koje rade, ali koče razvoj ili performanse | Kad se nađe ili otplati dug |
| `IMPROVEMENTS.md` | Ideje za bolje (izgled, animacije, UX, zvuk, gameplay) sa prioritetom i procenom | Kad se doda ideja ili uradi |
| `TRACKER.md` | Plan po fazama: šta je sledeće, šta je u toku, šta je gotovo. Vodi na ID-jeve iz fajlova iznad | Na početku i kraju svakog zadatka |
| `LEDGER.md` | Hronološki dnevnik promena: datum, šta je urađeno, ID-jevi, kako je provereno | Posle svakog završenog zadatka |

## ID-jevi

`<IGRA>-<VRSTA>-<broj>`, broj se nikad ne koristi ponovo.

- Prefiks igre: `PT` Pilana Tajkun, `KT` Kamp Tajkun, `ML` Monster Lane, `RK` Razori Kule, `SU` Surprizi, `OS` Osvoji svet, `GR` zajedničko (landing, `shared/`).
- Vrsta: `BUG`, `TD` (tehnički dug), `IMP` (unapređenje). Primer: `PT-BUG-002`, `PT-TD-001`, `PT-IMP-V03`.
- Kod unapređenja slovo posle `IMP-` je oblast: `P` performanse, `V` vizuelno, `A` animacije i „juice“, `U` UX/UI, `S` zvuk, `G` gameplay i ekonomija, `T` tehnika i plan.

## Ozbiljnost bagova

| Nivo | Značenje | Primer | Rok |
|---|---|---|---|
| **S1 kritično** | Igra se ne učitava, pada, gubi napredak, ili osnovna radnja ne radi pouzdano | 24 s do igre na 4G; klik na „kupi“ se gubi | Odmah, u istom zadatku |
| **S2 visoko** | Ozbiljno kvari iskustvo ili performanse, ali postoji zaobilaznica | Trzanje na 18 FPS; PLAY ispod 20 pasusa na telefonu | Sledeća faza |
| **S3 srednje** | Primetno, ograničen uticaj | Kamera klizi posle alt-tab | Kad se radi taj deo |
| **S4 nisko** | Kozmetika, sitnice | Spljošteno ✕ dugme | Usput |

Kozmetičke popravke (S4) i sve S1 smeju da se rade odmah, i tokom audita.

## Statusi

`otvoren` → `u toku` → `rešen` (sa datumom i ID-jem u LEDGER-u) ili `odbačen` (sa razlogom). Rešeni ostaju u fajlu, u sekciji „Rešeno“, zbog istorije.

## Bagovi kao testovi

Otvoren bag koji se može automatski proveriti dobija test sa `test.fail(...)` u `tests/games/<slug>/known-bugs.spec.mjs` (ili u spec-u gde mu je mesto). Kad neko reši bag, Playwright javi „expected to fail, but passed“. Tada skini `test.fail`, prebaci bag u „Rešeno“ i upiši LEDGER. Rešen S1/S2 bag uvek dobija regresioni test.

## Format zapisa

Bag:

```md
### PT-BUG-004 · S3 · otvoren — Kratak naslov
- **Gde:** `games/pilana-tajkun/index.html` funkcija/sekcija (linija ~N)
- **Koraci:** 1. … 2. …
- **Očekivano / dobijeno:** …
- **Uzrok:** …
- **Predlog:** …
- **Test:** `tests/games/pilana-tajkun/known-bugs.spec.mjs` › naziv
```

LEDGER:

```md
## 2026-10-09 — Naslov
- **Urađeno:** …
- **ID:** PT-BUG-001, PT-BUG-002
- **Provereno:** komanda/test + rezultat (brojevi pre/posle)
- **Napomena:** odluke, rizici
```
