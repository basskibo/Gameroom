# Monster Lane — tracker

**Trenutno:** AAA prolaz 2 gotov (2026-10-10): + oružarnica, kombo, muzika, gusari lete. Sledeće: treća reklama iz plana (G04 „dodatni pirati“), dnevni izazov, Android paket.

## Odluke potrebne od korisnika

| # | Pitanje | Zašto je važno | Predlog |
|---|---|---|---|
| 1 | Da li Monster Lane ide na Google Play posle Pilane? | Isti Capacitor šablon, ~pola dana | Da, kad Pilana prođe zatvoreno testiranje |

## Faza A — Stabilnost i merenje
- [x] Audit + merenja → README
- [x] S1/S2 bagovi (ML-BUG-001)
- [x] Testovi (smoke, glavna petlja, save, pauza, mobile, perf, monetizacija)

## Faza B — Performanse
- [x] GLB modeli umesto inline paketa, lokalni Three.js
- [x] Manje trouglova na gusarima
- [ ] ML-TD-001 (proceduralni modeli samo kao rezerva)

## Faza C — Izgled
- [x] Bloom, ACES, grading, vinjeta
- [x] Svetleće čestice, dim
- [ ] Zalazak u kasnim talasima (V04)

## Faza D — Animacije i „juice“
- [x] Muzzle flash, hit-stop, punch kamere, vibracija
- [x] Gusari lete u more (V03), kombo brojač

## Faza E — UX, onboarding, zvuk
- [x] Uvodni saveti, rekord na startu
- [x] Audio bus, ambijent
- [x] Muzika

## Faza F — Plan monetizacije
- [x] SDK sloj, analitički događaji
- [x] Oživljavanje, start sa jačim oružjem (nagrada), reklama preko celog ekrana samo između partija / na nastavku
- [ ] „Dodatni pirati“ (G04)
- [ ] Android paket (T01)
