# Gameroom

Kolekcija browser igrica. `index.html` je landing sa izborom igre, svaka igra živi u `games/<slug>/index.html`.

## Igre

| Igra | Putanja |
|------|---------|
| Surprizi | `games/surprizi/` |
| Monster Lane | `games/monster-lane/` |

## Lokalno

```bash
npx serve .
```

## Nova igra

1. `games/<slug>/index.html` (sa `gameroom:back` linkom na kraju `<body>`)
2. `cover.jpg` (1200x900) i `hero.jpg` (1600x700) screenshot u isti folder
3. Dodaj unos na početak `GAMES` niza u `index.html`

Detaljne konvencije: `.claude/skills/browser-games/SKILL.md`.

## Benchmark

U chatu, za bilo koju igru iz `games/`:

```
/benchmark pilana-tajkun 15s
```

`<igra>` je slug foldera (`pilana-tajkun`, `monster-lane`, `surprizi`, `kamp-tajkun`, `razori-kule`, `osvoji-svet`). Trajanje je u sekundama (`15s` ili `15`, podrazumevano 8). Više imena u jednom pozivu daje uporednu tabelu.

Izveštaj: vreme učitavanja, prosečan FPS, 1% low, p95/p99 frejma, trzaji preko 50 ms i JS heap. Chrome ide na pravom GPU-u. Brojevi važe za ovu mašinu.

Još opcija: `mobile` (390×844), `query:?auto`, `actions:click:#startBtn;wait:1000`, `no-start`, `swiftshader`. Skill: `.cursor/skills/benchmark/SKILL.md`.

## Plan monetizacije

`MONETIZATION.md`: roadmap, pravila za reklame i metrike. Agenti ga prate preko `AGENTS.md` / `CLAUDE.md`.

## Deploy

Vercel, preset **Other**, bez build komande. Config je u `vercel.json`.
