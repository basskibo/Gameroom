# Pilana Tajkun — unapređenja

Cilj: igra deluje kao „AAA“ — glatka, živa, dosledna, sa jakim prvim utiskom ([standard](../../engineering/game-quality-bar.md)).
Prioritet: **P1** najveći efekat za uloženo, **P2** važno, **P3** lepo imati. Procena: **S** < pola dana, **M** 1–2 dana, **L** 3+ dana.

## Performanse (P)

| ID | Prio | Proc. | Ideja |
|---|---|---|---|
| PT-IMP-P01 | P1 | L | Spajanje statične geometrije po materijalu + instanciranje ponovljenih delova (PT-TD-001). Cilj < 300 draw call-ova rano |
| PT-IMP-P02 | P1 | M | Kompresija GLB (meshopt + webp teksture), jedan rig za sve likove, brisanje nekorišćenih asseta (PT-TD-002). Cilj < 4 MB |
| PT-IMP-P03 | P1 | M | Adaptivni kvalitet: DPR se spušta/diže po vremenu frejma; preset-i Nisko/Srednje/Visoko u podešavanjima (senke, post-obrada, gustina šume) |
| PT-IMP-P04 | P1 | S | Na pauzi, iza start ekrana i u skrivenom tabu ne crtati punom brzinom (PT-TD-010, PT-BUG-006) |
| PT-IMP-P05 | P2 | M | Nula alokacija u petlji frejma, bazeni objekata (PT-TD-008, PT-TD-011) |
| PT-IMP-P06 | P2 | S | `AnimationMixer.update` i animacije samo za likove u kadru i bliže od X; likovi daleko na nižoj frekvenciji |
| PT-IMP-P07 | P1 | M | Ekran učitavanja sa pravim progresom; modeli se skidaju dok je start ekran otvoren; zamena modela sa fade-om (PT-BUG-008) |
| PT-IMP-P08 | P2 | S | Senka osvežena samo na promenu; statične senke ispečene u teksturu tla |
| PT-IMP-P09 | P3 | M | Three.js iz deljenog keša (CDN/`shared/vendor`) ako `file://` nije uslov (PT-TD-004) |

## Vizuelno (V)

| ID | Prio | Proc. | Ideja |
|---|---|---|---|
| PT-IMP-V01 | P1 | S | Svetlo: toplije sunce, hladniji fill, `RoomEnvironment` + PMREM za odsjaj na metalu i staklu; malo jača kontrast senki |
| PT-IMP-V02 | P2 | M | Post-obrada na Srednje/Visoko: SMAA, blagi bloom samo na emisivnim (svetla, rampa, žar u peći), vinjeta, color grading. Isključeno na Nisko |
| PT-IMP-V03 | P1 | S | Kontakt senke (blob) ispod kamiona, viljuškara, kola i ljudi — instancirani disk sa mekim gradijentom (PT-BUG-014) |
| PT-IMP-V04 | P3 | M | „Zlatni sat“ paleta ili spor ciklus dan/noć; lampe i farovi se pale u sumrak |
| PT-IMP-V05 | P2 | M | Tlo: noise tekstura trave, tragovi guma i piljevina kao dekali kod testere i rampe; voda sa fresnel-om i penom uz obalu |
| PT-IMP-V06 | P1 | M | Čestice: mekani sprite-ovi piljevine (umesto tačaka), dim iz peći za ćumur, prašina iza kamiona na zemljanom putu, iverje iz sečke, lišće kad drvo padne |
| PT-IMP-V07 | P2 | L | Jedan stil modela: zameni realističan Dodge Charger/Range Rover i Poly modele low-poly modelima iz istog paketa; ujednačena paleta (PT-BUG-015) |
| PT-IMP-V08 | P1 | M | Gradnja zgrade: skela/temelj izraste, prašina, „pop“ sa prebacivanjem, zvuk; nekupljena mesta kao diskretni „ghost“ obris umesto šrafiranih ploča (PT-BUG-013) |
| PT-IMP-V09 | P2 | S | Natpisi u svetu na DPR 2 (veći canvas), isti font i ivice kao HUD |
| PT-IMP-V10 | P3 | M | Okolina: brda na horizontu, oblaci (sprite), ptice; ivica mape u magli umesto ravnog kraja |

## Animacije i „juice“ (A)

| ID | Prio | Proc. | Ideja |
|---|---|---|---|
| PT-IMP-A01 | P1 | S | Kamera: tap na mašinu = glatko približavanje i blago naginjanje; elastična ivica mape; inercija i na zoomu |
| PT-IMP-A02 | P1 | S | Novac u HUD-u broji (count-up); zarada iz sveta leti kao novčić do HUD-a; „+/s“ sa trend strelicom |
| PT-IMP-A03 | P2 | M | Kamioni: oslanjanje kad se tovari, kočiona svetla, okretanje prednjih točkova, dim iz auspuha pri polasku; viljuškar: viljuške sa easing-om |
| PT-IMP-A04 | P1 | S | Kupovina: squash & stretch zgrade, konfete sa gravitacijom i nestajanjem, slojevit zvuk, vibracija na telefonu (`navigator.vibrate(15)`) |
| PT-IMP-A05 | P1 | S | UI prelazi: paneli ulaze sa spring animacijom, dugmad imaju pressed stanje, brojevi u panelu se menjaju sa „tick“ efektom |
| PT-IMP-A06 | P2 | S | Drvo pada sa ubrzanjem i odskokom, trupac se kotrlja na rampu, cepanica pada u kadicu sa malim odskokom (postoji osnova) |
| PT-IMP-A07 | P3 | M | Animacija nošenja za radnike (sad nose „u rukama“ bez animacije), mahanje kupaca kad kupe |
| PT-IMP-A08 | P2 | S | Testera: varnice/piljevina u ritmu reza, blago podrhtavanje kamere kod velike testere (opciono, isključeno u „smanji pokrete“) |

## UX / UI (U)

| ID | Prio | Proc. | Ideja |
|---|---|---|---|
| PT-IMP-U01 | P1 | M | Prvih 30 s: start = naslov + PLAY; vođeni prvi koraci (strelica na testeru → kupi „Faster saw“ → strelica na kamion); pravila u Pomoć po sekcijama; saveti kad se zgrada prvi put kupi (PT-BUG-010) |
| PT-IMP-U02 | P1 | M | Panel nadogradnji: bočni panel na desktopu (ne pokriva mašinu), traka napretka umesto 19 ikonica, „koliko još“ do sledeće kupovine, efekat na prihod (+X/s) |
| PT-IMP-U03 | P1 | S | Toast sistem: red, prioritet, pozicija ispod HUD-a, kompaktan na telefonu (PT-BUG-011) |
| PT-IMP-U04 | P2 | M | Obaveštenja o zastoju sa tapom do mesta: „Kamioni čekaju na rampi“, „Kadica puna“, „Nema trupaca“ |
| PT-IMP-U05 | P1 | S | Podešavanja: kvalitet grafike, jačina muzike i efekata, jezik, „smanji pokrete“, zasluge (PT-BUG-015) |
| PT-IMP-U06 | P2 | M | Zarada dok igrač nije tu (offline) sa ekranom dobrodošlice; ×2 uz reklamu za nagradu (plan) |
| PT-IMP-U07 | P2 | S | Landscape na telefonu: HUD u jednom redu ikonica, nav vertikalno levo |
| PT-IMP-U08 | P3 | S | Pristupačnost: tap mete ≥ 44 px, oznake za čitač ekrana na ikonama, stanja ne samo bojom |
| PT-IMP-U09 | P2 | S | Kupovina više nivoa odjednom (×1 / ×10 / max) za kasnu igru |

## Zvuk (S)

| ID | Prio | Proc. | Ideja |
|---|---|---|---|
| PT-IMP-S01 | P1 | S | Audio bus: master + kompresor, grane sfx/muzika/ambijent, jačine u podešavanjima (PT-TD-012) |
| PT-IMP-S02 | P2 | M | Ambijent: šuma i ptice, reka kod mosta, daleki saobraćaj; stereo po poziciji na ekranu |
| PT-IMP-S03 | P2 | M | Uzorkovani zvuci (testera, motor kamiona, pištanje viljuškara, novčić) umesto čistih oscilatora; tiha muzička petlja |

## Gameplay i ekonomija (G)

| ID | Prio | Proc. | Ideja |
|---|---|---|---|
| PT-IMP-G01 | P1 | M | Rebalans srednje i kasne igre uz referentnu krivu (kao Kamp Tajkun): rendisaljka ~10 min umesto 25, cene u milionima dostižne; meriti sa 4–5 `?sim` pokretanja posle PT-BUG-009 |
| PT-IMP-G02 | P2 | M | Lanac ciljeva posle 5 početnih poslova (dostignuća), sa nagradom; jasan „sledeći cilj“ uvek u HUD-u |
| PT-IMP-G03 | P1 | M | Mesta za reklamu za nagradu prema planu: ×2 zarada 3 min, odmah gotova nadogradnja, ×2 offline — uvek izbor igrača, preko SDK-a (PT-TD-014) |
| PT-IMP-G04 | P3 | M | Događaji: kiša usporava kamione, sajam traži nameštaj, cena trupaca skače |
| PT-IMP-G05 | P3 | L | Prestiž: prodaj pilanu, kreni ispočetka sa trajnim množiocem |

## Tehnika i plan (T)

| ID | Prio | Proc. | Ideja |
|---|---|---|---|
| PT-IMP-T01 | P1 | M | Srpski + engleski (PT-TD-013) |
| PT-IMP-T02 | P1 | S | SDK + analitički događaji (PT-TD-014) |
| PT-IMP-T03 | P2 | S | Seed RNG (PT-TD-016) → vizuelni regresioni testovi (screenshot poređenje) |
| PT-IMP-T04 | P2 | S | CI: GitHub Actions pokreće `tests/` na svaki PR |
| PT-IMP-T05 | P3 | S | Debug kuke iza `?debug` u produkciji (sada svako može `__cheat` iz konzole); testovi uključuju `?debug` |
