# Remi Vita — tracker

**Trenutno:** v1.1 (2026-10-14): BUG-001 (Firefox pad) rešen, unos partije u dva koraka, kafić kao 3D scena, novi izgled (čoja + zlato, igrači kao karte, SVG ikonice), bez zvuka. 18 testova.

## Odluke potrebne od korisnika

| # | Pitanje | Zašto je važno | Predlog |
|---|---|---|---|
| 1 | Da li se „ostalima duplo“ primenjuje i na obično zatvaranje? | Kućna pravila se razlikuju | Podrazumevano samo na ruku; obično zatvaranje ima prekidač u pravilima |

## Faza A — Stabilnost i merenje

- [x] Testovi (bodovanje, dealer, undo, izmena, kupovina/kraj, reload, 3D, mobilni, reklame)
- [x] Regresija za Firefox pad (BUG-001): `firefox-safe.spec.mjs` + `tests/tools/firefox-rounds.py`
- [ ] FPS na pravom telefonu (benchmark skripta; desktop Iris Xe: 59 fps sa kafićem)

## Faza B — Dalje

- [ ] PWA (manifest + offline keš) — aplikacija se koristi za stolom, često bez dobrog signala
- [ ] Deljenje tabele kao slike
