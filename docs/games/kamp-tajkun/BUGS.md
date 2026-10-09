# Kamp Tajkun — bagovi

| ID | S | Status | Naslov |
|---|---|---|---|
| KT-BUG-001 | S3 | rešen | „Nova igra (briše napredak)“ vidljivo i bez sačuvane igre (`.hidden` nije imao CSS za `button.link`) |
| KT-BUG-002 | S3 | rešen | Samo otvaranje i zatvaranje strane pravi save, pa sledeći put piše „Nastavi“ |
| KT-BUG-003 | S3 | rešen | Three.js sa CDN-a (ne radi offline / u Android aplikaciji) |
| KT-BUG-004 | S4 | rešen | Zvuk bez kompresora, mute se ne pamti |
| KT-BUG-005 | S4 | rešen | Pauza ne javlja SDK-u (`gameplayStop`) |

Testovi: `smoke.spec.mjs` „KT-BUG-001“, „KT-BUG-002“, „three.js from shared/vendor“.
