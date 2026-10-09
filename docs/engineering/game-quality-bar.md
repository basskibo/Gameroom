# Standard kvaliteta: „AAA osećaj“ u browser igri

Igre su male i lake, ali treba da deluju skupo: glatko, živo, dosledno. Ovo je lista po kojoj se igra ocenjuje i unapređuje. Svaka stavka je proverljiva.

## 1. Performanse (merljivo)

| Metrika | Desktop (iGPU, npr. Intel) | Telefon srednje klase | Kako se meri |
|---|---|---|---|
| Vreme do igrive scene, Fast 4G | < 3 s | < 4 s | `tests/.../perf.spec.mjs` |
| Ukupno preuzimanje do igre | < 5 MB | < 5 MB | isti test, `download-mb` |
| Prosečan FPS | 60 | ≥ 50 | `.cursor/skills/benchmark` |
| 1% low FPS | ≥ 45 | ≥ 30 | benchmark `onePercentLow` |
| Frejmovi > 50 ms u 8 s | 0 | ≤ 2 | benchmark `hitch.over50ms` |
| Draw call-ovi po frejmu | < 500 | < 300 | perf test `draw-calls` |
| Trouglovi po frejmu | < 500k | < 250k | `audit.mjs` |
| JS heap | < 150 MB | < 120 MB | perf test `heap-mb` |

Pravila: kvalitet se spušta automatski (DPR, senke, efekti) kad frejm traje dugo, nikad obrnuto. Pauza i skriven tab ne crtaju 60 FPS.

## 2. Kretanje i animacije

- Ništa se ne pojavljuje i ne nestaje „na tvrdo“. Nova zgrada izraste (scale pop sa blagim prebacivanjem, prašina), kupljeno vozilo uđe na scenu.
- Sve kretnje imaju ubrzanje i kočenje (easing), nema linearnog starta i stopa. Okreti su glatki (ograničena ugaona brzina), ne skokovi.
- Kamera: inercija, prigušenje, glatko približavanje do kliknute zgrade, granice mape bez naglog udara.
- Likovi: skeletne animacije sa prelazom (crossfade ≥ 0,15 s), stopala ne klize (brzina hoda prati animaciju).
- Svaka akcija igrača ima odgovor za < 100 ms: zvuk, vizuelni puls, broj koji leti.
- Novac u HUD-u broji (count-up), ne skače. Zarada iz sveta „leti“ do HUD-a.

## 3. Izgled i doslednost

- Jedan stil modela (low-poly, ista paleta, ista gustina detalja). Ne mešati realističan auto sa low-poly kamionom.
- Paleta: ograničen skup boja po igri, zapisan u `docs/games/<slug>/README.md`.
- Svetlo: toplo ključno svetlo + hladan fill + okruženje (PMREM) da PBR materijali imaju odsjaj. Senke mekane, i dinamički objekti imaju bar kontakt senku.
- Post-obrada samo kad je jeftina: antialias, blagi bloom na emisivnim delovima, vinjeta, color grading. Na niskom kvalitetu isključeno.
- Tekst u svetu (natpisi) istim fontom kao UI, oštar na DPR 2.

## 4. UI / UX

- **Prvih 30 sekundi:** igrač je u igri posle jednog tapa. Pravila su u Pomoći, ne pre igre. Prvi cilj je jasan i vizuelno označen.
- HUD gore i tanak; donja trećina ekrana na telefonu je za igru. Toast-ovi se ne preklapaju sa karticama.
- Dugmad ≥ 44 px na telefonu, stanja hover/pressed/disabled, brz odgovor (vidi PT-BUG-002).
- Paneli ulaze animirano (slide/spring 150–250 ms), ne pokrivaju objekat koji se nadograđuje.
- Brojevi: skraćeni (12.4k, 1.2M), uvek ista notacija.
- Podešavanja: zvuk/muzika (klizači), kvalitet grafike, jezik, pauza, nazad u Gameroom.
- Landscape i portret na telefonu rade bez preklapanja.

## 5. Zvuk

- Master bus sa kompresorom (bez pucanja kad svira mnogo zvukova).
- Ambijent (šuma, voda, saobraćaj) + zvuci akcija. Opciona tiha muzika.
- Prostorni zvuk po poziciji kamere (već postoji osnova u Pilani: `near()`).
- Odvojene jačine za muziku i efekte; pamte se u `localStorage` sa prefiksom igre.

## 6. Pouzdanost

- Nula grešaka u konzoli u normalnoj igri.
- Save ima verziju i migraciju; oštećen save ne ruši igru.
- Ništa ne zavisi od FPS-a (logika u fiksnim koracima, `dt` ograničen).
- Igra radi bez SDK-a, bez reklama i dok modeli još nisu učitani.

## 7. Kako oceniti igru (checklist za audit)

Za svaku oblast oceni 1–5 i zapiši u `docs/games/<slug>/README.md` → „Ocena kvaliteta“:
performanse · učitavanje · animacije · izgled · doslednost stila · UI · prvih 30 s · zvuk · mobilni · pouzdanost.
