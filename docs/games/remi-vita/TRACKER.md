# Remi Vita — tracker

**Trenutno:** v1.2 (2026-10-17): istorija sa rang listom igrača i celom tabelom prošlih igara, jasniji red Σ (BUG-002). v1.1: BUG-001 (Firefox pad) rešen, unos partije u dva koraka, kafić kao 3D scena, novi izgled. 29 testova.

## Odluke potrebne od korisnika

| # | Pitanje | Zašto je važno | Predlog |
|---|---|---|---|
| 1 | Da li se „ostalima duplo“ primenjuje i na obično zatvaranje? | Kućna pravila se razlikuju | Podrazumevano samo na ruku; obično zatvaranje ima prekidač u pravilima |

## Faza A — Stabilnost i merenje

- [x] Testovi (bodovanje, dealer, undo, izmena, kupovina/kraj, reload, 3D, mobilni, reklame)
- [x] Regresija za Firefox pad (BUG-001): `firefox-safe.spec.mjs` + `tests/tools/firefox-rounds.py`
- [ ] FPS na pravom telefonu (benchmark skripta; desktop Iris Xe: 59 fps sa kafićem)

## Faza B — Dalje

- [x] Istorija: rang lista igrača, cela tabela svake igre, filter po igraču, brisanje jedne igre (2026-10-17)
- [ ] PWA (manifest + offline keš) — aplikacija se koristi za stolom, često bez dobrog signala
- [ ] Deljenje tabele kao slike
