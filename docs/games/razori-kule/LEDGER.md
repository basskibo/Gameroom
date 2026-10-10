# Razori Kule — ledger

## 2026-10-10 — AAA prolaz 2: svetovi, boss tvrđave, muzika
- **Urađeno:** `THEMES` (livade / pustinja / sneg / noć) menjaju nebo, planine, tlo, travu, drveće (kaktus, zavejan bor), oblake, more; noć sa zvezdama i mesecom, scena kroz `multiply`, a vatra posle toga pa svetli; boss tvrđava na svakih 5; muzika (marš).
- **Provereno:** `npx playwright test games/razori-kule` 16/16 (novi test „worlds“).

## 2026-10-10 — AAA prolaz 1
- **Urađeno:** eksplozije sa sjajem i dimom, plamen/trzaj topa, trag rakete, usporenje na poslednjem udarcu; nebo, 3 sloja planina, more, teren sa slojevima, vinjeta; uvodni gest; napredak (`razori-kule:progress`), zvezdice, nastavak; kamera na telefonu; audio bus + `noise()` u `shared/gameroom-audio.js`; SDK: `extra_rockets`, `double_score`, `refill`, midgame između zamkova; pauza zove `gameplayStop`; neiskorišćeni modeli u `art/razori-kule/`.
- **ID:** RK-BUG-001…008, RK-IMP-V01–V03, A01, A02, U01, U02, G01, S01.
- **Provereno:** `npx playwright test games/razori-kule` 15/15; FPS 59,8 tokom pucnjave (1 % low 53,1 → 42,6, jedan hitch od `carve`, RK-TD-002); portret: vidljivo ~700 jedinica sveta umesto ~380.
