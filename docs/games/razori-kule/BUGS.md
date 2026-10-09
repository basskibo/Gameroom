# Razori Kule — bagovi

Format i ozbiljnost: [docs/engineering/tracking.md](../../engineering/tracking.md).

| ID | S | Status | Naslov |
|---|---|---|---|
| RK-BUG-001 | S3 | rešen | 2,6 MB neiskorišćenih GLB modela i sprite-ova kula ide na Vercel |
| RK-BUG-002 | S2 | rešen | Poraz vraća na nivo 1 i briše poene (napredak se gubi) |
| RK-BUG-003 | S2 | rešen | Posle skrivanja taba, „Zatvori“ u podešavanjima više ne nastavlja igru (`hiddenPause` ostaje `true`) |
| RK-BUG-004 | S2 | rešen | Telefon u portretu vidi samo sopstveni zamak (zum na visinu sveta) |
| RK-BUG-005 | S3 | rešen | Dugme „Još 5 raketa“ se nudi i kad reklama ne postoji, pa samo kaže „nema reklame“ |
| RK-BUG-006 | S3 | rešen | Igra šalje svoj `session_end` (dupla metrika sa SDK-om) |
| RK-BUG-007 | S3 | rešen | Pauza i reklama ne zovu `gameplayStop`, zvuk ne utihne tokom reklame |
| RK-BUG-008 | S4 | rešen | Zvuk ide direktno na izlaz, bez kompresora |

## Detalji

- **RK-BUG-002:** `nextRound` je na porazu radio `score = 0; level = 1`. Sada: isti nivo, poeni nazad na stanje s početka nivoa; najdalji nivo se pamti (`razori-kule:progress`), start kartica nudi „Nastavi · nivo N“ i „Nova igra“. Test: `smoke.spec.mjs` „RK-BUG-002“.
- **RK-BUG-003:** test „RK-BUG-003“ simulira skriven tab.
- **RK-BUG-004:** portret zum `min(viewW / 700, …)`, more iznad dugmadi, pregled neprijateljskog zamka 1,5 s na početku nivoa. Test: `mobile.spec.mjs` „RK-BUG-004“.
