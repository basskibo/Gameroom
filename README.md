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

## Plan monetizacije

`MONETIZATION.md`: roadmap, pravila za reklame i metrike. Agenti ga prate preko `AGENTS.md` / `CLAUDE.md`.

## Deploy

Vercel, preset **Other**, bez build komande. Config je u `vercel.json`.
