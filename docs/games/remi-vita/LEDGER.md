# Remi Vita — ledger

Najnovije gore. Format: [tracking.md](../../engineering/tracking.md).

## 2026-10-14 — Nova igra: Remi Vita v1
- **Urađeno:** tabla za remi sa n igrača, dealer označen i najavljen glasom (prvi igrač deli prvi, pa redom), automatsko bodovanje (zatvaranje −20, ruka −40 i ostalima duplo, nije otvorio 100, sve podesivo), granica 301/501/1001 sa kupovinom, undo i izmena partije, statistika sa grafikom, istorija, 3D sto (šolja kafe sa latte artom, para, karte, čipovi, dealer žeton koji skače), kiša karata na „ruku“, konfete, logo (karte + kafa), muzika `cafe`, EN/SR, SDK, landing.
- **Provereno:** `npx playwright test games/remi-vita` → 17/17; snimci 390×844 i 1280×800.
- **Napomena:** FPS nije meren na pravom uređaju (headless je swiftshader).
