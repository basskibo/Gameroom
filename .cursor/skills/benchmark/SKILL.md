---
name: benchmark
description: >-
  Measure a Gameroom browser game: load time, FPS, 1% low, frame-time
  percentiles, hitches, and JS heap. Use when the user types /benchmark,
  says "benchmark", "benčmark", "izmeri fps", "performanse igre", or names
  a game plus a duration, mobile, or how to start it. Works for every game
  under games/, not only the one open in the chat.
disable-model-invocation: true
---

# Benchmark igara

Meri kako igra stvarno radi u Chrome-u na ovoj mašini. Rezultat važi za ovaj računar. Ne poredi brojeve sa drugim računarom.

## Poziv

`/benchmark <igra> [opcije]`

- `<igra>` je slug foldera u `games/` (`pilana-tajkun`, `monster-lane`, `surprizi`, `kamp-tajkun`, `razori-kule`, `osvoji-svet`). Deo imena je dovoljan ako pogodi tačno jednu igru.
- Više igara u jednom pozivu: izmeri svaku i uporedi.
- Trajanje: `15s` ili `15` (podrazumevano 8 sekundi uzorkovanja posle starta).
- `mobile` — 390×844, touch.
- `query:?auto` — query string na fajl.
- `actions:click:#startBtn;wait:1000;key:d:2000` — isti koraci kao cover skripta (`click`, `wait`, `key`, `eval`).
- `no-start` — ne diraj `#startBtn` ni `window.__start`.
- `swiftshader` — softverski WebGL. Podrazumevano je pravi GPU.

## Pokretanje

Iz korena repoa:

```bash
node .cursor/skills/benchmark/scripts/benchmark.mjs <slug> [--seconds 8] [--mobile] [--query '?auto'] [--actions 'click:#startBtn;wait:500'] [--no-start] [--swiftshader]
```

Playwright je u `.cache/tools`. Ako import ne nađe `playwright-core`, pokreni sa:

```bash
NODE_PATH=.cache/tools/node_modules node .cursor/skills/benchmark/scripts/benchmark.mjs <slug>
```

Skripta sama podiže `serve.mjs` i otvara igru preko http-a (igre učitavaju Three.js iz `shared/` preko importmap-a, što ne radi sa `file://`). Ne koristi CDP `Page.captureScreenshot`.

Kad postoji `DISPLAY`, Chrome ide **headed** na pravom GPU. Headless meri softverski WebGL i daje lažno nizak FPS. Ako je `mode` `headless`, reci to u izveštaju i ne tretiraj FPS kao broj sa igračevog ekrana. U JSON-u je i `gpu`.

Start, ako nije `no-start`: klik na vidljiv `#startBtn`, inače `window.__start()` ako postoji. Zatim `actions`.

## Izveštaj

Odgovori na jeziku korisnika. Jedna igra: kratak pasus pa tabela. Više igara: jedna tabela, red po igri.

Obavezna polja iz JSON-a:

| Polje | Značenje |
|---|---|
| `load.wallMs` | vreme do `load` |
| `fps.avg` | prosek tokom uzorka |
| `fps.onePercentLow` | 1% najsporijih frejmova, kao FPS |
| `frameMs.p95` / `p99` / `max` | milisekunde po frejmu |
| `hitch.over50ms` | frejmovi duži od 50 ms |
| `memory.jsHeapMB` | JS heap na kraju |
| `errors` | pageerror, ako ih ima |

Ne lepiti sirovi JSON. Ako `errors` nije prazan, navedi ih. Ako je 1% low daleko ispod proseka, reci da igra ima trzaje, ne samo nizak prosek.

Podrazumevani uzorak je mirna scena posle starta. Ako korisnik traži igru pod opterećenjem, dodaj `actions` (kretanje, otvaranje, `eval:window.__run(8,0.1)` gde igra to ima) i reci šta je bilo uključeno.
