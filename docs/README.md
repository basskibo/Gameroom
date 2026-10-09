# Gameroom — dokumentacija

Mapa svih dokumenata. Važi i za ljude i za AI agente (Claude Code, Cursor). Ulazna tačka za agente je `AGENTS.md` u root-u. `CLAUDE.md` ga uvozi, a Cursor ga čita preko `.cursor/rules/gameroom.mdc`.

Folder `docs/` ne ide na Vercel (`.vercelignore`).

## Redosled čitanja za novi zadatak

1. `AGENTS.md` (pravila repoa) i sekcija **Status** u `MONETIZATION.md` (u kojoj smo fazi).
2. `docs/engineering/agent-playbook.md` (kako se radi zadatak od početka do kraja).
3. Za igru: `docs/games/<slug>/TRACKER.md` (šta je sledeće), pa po potrebi `BUGS.md`, `TECH-DEBT.md`, `IMPROVEMENTS.md`.
4. Posle rada: upis u `docs/games/<slug>/LEDGER.md` i ažuriran `TRACKER.md`.

## Inženjerski standardi (važe za sve igre)

| Dokument | Sadržaj |
|---|---|
| [engineering/agent-playbook.md](engineering/agent-playbook.md) | Tok rada za agente, „definition of done“, šta se ne radi |
| [engineering/game-quality-bar.md](engineering/game-quality-bar.md) | Šta znači „AAA osećaj“ kod nas: performanse, animacije, UI, zvuk, konzistentnost |
| [engineering/threejs-performance.md](engineering/threejs-performance.md) | Tehnike za performanse u Three.js bez build koraka |
| [engineering/testing.md](engineering/testing.md) | Playwright testovi: pokretanje, pisanje, testovi za poznate bagove |
| [engineering/tracking.md](engineering/tracking.md) | Kako se vode bagovi, tehnički dug, unapređenja, tracker i ledger. Ozbiljnost S1–S4, ID-jevi, statusi |

## Igre

| Igra | Dokumentacija | Stanje |
|---|---|---|
| Pilana Tajkun | [games/pilana-tajkun/](games/pilana-tajkun/README.md) | Audit 2026-10-09, S1 rešeni, testovi postoje |
| Kamp Tajkun | — | čeka audit |
| Monster Lane | [games/monster-lane/](games/monster-lane/README.md) | AAA prolaz 1 (2026-10-10): GLB modeli, bloom, juice, uvod, reklame za nagradu, 17 testova |
| Razori Kule | [games/razori-kule/](games/razori-kule/README.md) | AAA prolaz 1 (2026-10-10): eksplozije, nebo, napredak, uvod, reklame za nagradu, 15 testova |
| Surprizi | — | čeka audit |
| Osvoji svet | — | čeka audit |

Za novu igru kopiraj [games/_template/](games/_template/) u `docs/games/<slug>/` i prati skill `game-audit` (`.claude/skills/game-audit/SKILL.md`).

## Android i pravno

- [engineering/android.md](engineering/android.md) — Capacitor + AdMob, build, koraci do Google Play objave
- [legal/privacy-policy-draft.md](legal/privacy-policy-draft.md) — nacrt politike privatnosti (obavezna za Play/AdMob)
