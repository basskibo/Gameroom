# Remi Vita — ledger

Najnovije gore. Format: [tracking.md](../../engineering/tracking.md).

## 2026-10-17 — Istorija sa rang listom, cela tabela prošlih igara, jasniji red Σ
- Korisnik (posle izvoza istorije sa 4 igre): hoće rang listu igrača i da se kasnije vidi cela istorija; posle prve partije tabla „izgleda kao da ima dva ista reda“ (BUG-002).
- **Tabla:** u redu partije krupno stoje poeni te partije (+35, −20, −40 ★), a zbir posle nje je sitan red ispod (`Σ 35`). Poslednja odigrana partija ima zlatnu podlogu. Red Σ ima zlatnu liniju, svoju podlogu i natpis „Ukupno“.
- **Istorija:** dve kartice. *Rang lista* svih igrača kroz sve igre (pobede, procenat, prosečno mesto, najbolji rezultat, koliko puta je ispao); dodir na igrača filtrira igre. *Igre*: svaka igra sa celim poretkom (1. Lela −163 · 2. Gobla 470 · 3. Bojan 619). Dodir otvara igru: poredak, grafik i cela tabela partiju po partiju, „Igraj ponovo“ i „Obriši ovu igru“.
- **Format istorije:** nove igre čuvaju `place`, `rebuys`, `limit` i `rows` (poeni i zbir po partiji). Stare igre i stari fajlovi rade kao pre, samo bez tabele. Izvoz/uvoz čuva tabelu, a pokvarena tabela se odbacuje, dok se konačan rezultat i dalje uvozi.
- Brisanje cele istorije i jedne igre sad traži potvrdu (pre se cela istorija brisala jednim dodirom). Poruka „Imported 1 games“ ima pravilnu množinu.
- Događaj `history_open` (jednom po učitavanju).
- Testovi: 25 → 29 (`history.spec.mjs`: rang lista, tabela prošle igre i izvoz/uvoz sa njom, potvrda brisanja, regresija za BUG-002).

## 2026-10-14 — Lakša početna (dodir odmah reaguje)
- Korisnik: na telefonu „kliknem start i ništa“. Na desktopu (Chrome, Firefox) dodir radi; uzrok na telefonu je GPU koji ne stiže (puna scena + CSS blur preko celog ekrana), pa kasni i obrada dodira.
- Početna: scena u 40% rezolucije u render target, jedan 9-tap blur prolaz u istoj maloj rezoluciji, pa razvlačenje (umesto CSS `filter: blur` preko celog ekrana); 30 fps kad kamera stigne; senka stola se ne preračunava; dodir preskače jedan frejm da se obradi odmah.
- Merenje (Pixel 7 emulacija, Iris Xe): početna 30 frejmova/s × 2 prolaza u 0,4 DPR; dodir „Nova igra“ → ekran igrača 120–150 ms.
- Test fixture za 3D varijante čeka da loader nestane. Testovi 25/25.

## 2026-10-14 — Loader i brže prvo učitavanje, izvoz/uvoz istorije, OG pregled
- **Loader:** logo + četiri karte koje se dele (2D, kompozitor, glatko i kad je glavna nit zauzeta), zlatna traka prati stvarni napredak; igra se pokazuje tek kad su kafić izgrađen, shaderi kompajlirani i prvi frejm nacrtan, pa kamera uleti.
- **Učitavanje:** `modulepreload` za three i module (posle importmap-a), gradnja scene u koracima sa `yieldToPaint`, `compileAsync` pre prvog frejma, jedno svetlo u kafiću umesto dva, početna u pola rezolucije ispod blura.
- **Merenja (390×844, CPU 4× usporen, Intel Iris Xe):** najduži blok glavne niti hladno 4,3 s → 2,4 s, toplo 0,9 s → 0,4 s; ono što ostane je iza loadera. 29 shader programa.
- **Istorija:** „Izvezi u fajl“ (`remi-vita-istorija-<datum>.json`) i „Uvezi iz fajla“ (spaja bez duplikata, odbija tuđe fajlove), istorija čuva do 200 igara.
- **OG:** `og.jpg` 1200×630 (logo + render kafića), `og:*`/`twitter:*` sa punim adresama na `gameroom.jageticbojan.com`; isto za landing (`/og.jpg`, kolaž 7 igara).
- Testovi 25/25.

## 2026-10-14 — Ispravke posle testiranja na produkciji
- **Krunica/„D“ na pogrešnoj koloni u Firefoxu:** zakrpa za BUG-001 je ćelijama zaglavlja dala `position: static`, pa su se oznake pozicionirale prema tabeli. Sad je `relative`; test proverava geometriju i samo pravilo.
- Zlatna linija posle svakog kruga deljenja (na svakih n partija za n igrača).
- Igrač koji je ispao: cela kolona se zatamni od te partije, crvena oznaka „Ispao“ umesto pečata preko broja; karta u zaglavlju postaje siva.
- Prozor za kupovinu ima i „Završi igru“.
- Poeni partije (+24, −20) krupniji (11 → 13 px).
- „D“ žeton je uz kartu onoga ko deli.
- 3D sto: najviše 6 razbacanih karata (bilo 46), deljenje baca 2.
- Podnaslov na početnoj je na karti od slonovače (♠/♥ u uglovima), da se čita preko kafića.
- Testovi 22/22.

## 2026-10-14 — Firefox pad (BUG-001), jednostavniji unos, kafić, novi izgled, bez zvuka
- **BUG-001 (S1):** Firefox se rušio posle čuvanja partije (WebRender panic). Pre: 4/4 pada u pravom Firefoxu. Posle: 3/3 prolaza. Regresioni test + `tests/tools/firefox-rounds.py`.
- **Unos partije u dva koraka:** 1) „Ko je zatvorio?“, gde je svaki igrač veliko dugme i svi se vide i na telefonu; 2) „Poeni u ruci“, sa pobednikom i izborom zatvorio/ruka gore, poljem u koje kucaš (karta boje slonovače) i tastaturom 3×4. Izbačeni +10/+20 i „Nije otvorio“ sa tastature (ostao u redu igrača).
- **Kafić:** `cafe3d.js` je stakleni paviljon u sumrak po korisnikovoj fotografiji: crep, lampice koje trepere, korpe sa cvećem koje se njišu, saksije, leja, drveće, cigle, TV, moljci. Početna je pogled sa trga, a „Nova igra“ ulazi kamerom kroz vrata do stola. Na telefonu je posebna kadriranja.
- **Novi izgled:** paneli od zelene čoje sa zlatnom intarzijom, igrači kao male karte, SVG ikonice umesto emodžija, bez natpisa VELIKIM SLOVIMA, bez stalnog sjaja na dugmetu.
- **Zvuk izbačen** (efekti, muzika, glasovna najava), na zahtev korisnika.
- **Merenja:** benchmark početne sa kafićem: 59 fps avg, p95 19.3 ms, heap 10.7 MB (Intel Iris Xe). Testovi 18/18.

## 2026-10-14 — Nova igra: Remi Vita v1
- **Urađeno:** tabla za remi sa n igrača, dealer označen i najavljen glasom (prvi igrač deli prvi, pa redom), automatsko bodovanje (zatvaranje −20, ruka −40 i ostalima duplo, nije otvorio 100, sve podesivo), granica 301/501/1001 sa kupovinom, undo i izmena partije, statistika sa grafikom, istorija, 3D sto (šolja kafe sa latte artom, para, karte, čipovi, dealer žeton koji skače), kiša karata na „ruku“, konfete, logo (karte + kafa), muzika `cafe`, EN/SR, SDK, landing.
- **Provereno:** `npx playwright test games/remi-vita` → 17/17; snimci 390×844 i 1280×800.
- **Napomena:** FPS nije meren na pravom uređaju (headless je swiftshader).
