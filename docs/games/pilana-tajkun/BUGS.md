# Pilana Tajkun — bagovi

Format i ozbiljnost: [docs/engineering/tracking.md](../../engineering/tracking.md). Linije se odnose na `games/pilana-tajkun/index.html` posle popravki od 2026-10-09.

## Pregled

| ID | S | Status | Naslov |
|---|---|---|---|
| PT-BUG-001 | S1 | rešen 2026-10-09 | Blokirajući `models-bundle.js` od 25 MB: 24 s do igre na 4G |
| PT-BUG-002 | S1 | rešen 2026-10-09 | Klik na „kupi“ se gubi dok novac raste |
| PT-BUG-003 | S4 | rešen 2026-10-09 | Dugme ✕ u panelima spljošteno u usku kapsulu |
| PT-BUG-004 | S3 | rešen 2026-10-09 | Kamera sama klizi posle alt-tab dok je taster držan |
| PT-BUG-005 | S3 | rešen 2026-10-09 | Ime sačuvane igre i toast idu kroz `innerHTML` |
| PT-BUG-006 | S4 | rešen 2026-10-09 | Mašine, voda i svetla se animiraju dok je igra pauzirana |
| PT-BUG-007 | S2 | rešen 2026-10-09 | Kasna igra trza: 40 FPS, 1% low 18 FPS (iGPU) |
| PT-BUG-008 | S3 | rešen 2026-10-09 | Modeli „iskaču“ posle starta, bez indikatora učitavanja |
| PT-BUG-009 | S3 | otvoren | `buy()` ne proverava preduslove: bot kupuje nadogradnje za nesagrađene zgrade |
| PT-BUG-010 | S2 | rešen 2026-10-09 | Na telefonu je PLAY ispod ~20 pasusa pravila |
| PT-BUG-011 | S3 | rešen 2026-10-09 | Toast se preklapa sa ponudom kupca i HUD karticama |
| PT-BUG-012 | S3 | rešen 2026-10-09 | ⚙ preklapa start ekran i meni radi pre početka igre |
| PT-BUG-013 | S3 | rešen 2026-10-09 | Prvi kadar je prazan parking, testera je odsečena |
| PT-BUG-014 | S3 | rešen 2026-10-09 | Kamioni, viljuškari, ljudi i kola nemaju senku — „lebde“ |
| PT-BUG-015 | S2 | rešen 2026-10-09 | Nema atribucija za modele koji su možda CC-BY |
| PT-BUG-016 | S4 | rešen 2026-10-09 | „Bump“ animacija novca se ne ponavlja pri brzoj zaradi |
| PT-BUG-017 | S4 | rešen 2026-10-09 | Curenje GPU memorije pri proširenju kadice i kapija |
| PT-BUG-018 | S4 | otvoren | Leteći brojevi ne prate svet kad se kamera pomera |
| PT-BUG-019 | S4 | otvoren | Oštećen save sa pogrešnim tipom (npr. `money: "x"`) prolazi u igru |
| PT-BUG-020 | S4 | rešen 2026-10-09 | Meni podešavanja se ne zatvara klikom van njega |
| PT-BUG-021 | S4 | rešen 2026-10-09 | Ime igre: `<title>` „Sawmill Tycoon“, landing „Pilana Tajkun“ |
| PT-BUG-022 | S4 | otvoren | Na telefonu hint „drag · zoom…“ ide u dva reda preko igre |
| PT-BUG-023 | S3 | rešen 2026-10-09 | Likovi (radnici, kupci) previše tamni, ne uklapaju se u svetlu scenu |
| PT-BUG-024 | S2 | rešen 2026-10-09 | Telefon (iPhone): mesta za mašine trepere, šarene „šljokice“ u svetlima noću |

## Otvoreno

### PT-BUG-009 · S3 · otvoren — `buy()` ne proverava preduslove
- **Gde:** `buy(id)` (~6412) proverava samo cenu; preduslove proverava samo UI (`rowShown`, ~6095).
- **Dobijeno:** `?sim` bot kupuje `fireSpd` i `joinSpd` pre nego što postoje drva za ogrev i stolarija, i kupuje skriveni `buyers` (nadogradnja koja ništa ne radi). Balans iz simulacije je zato pogrešan. Igrač to ne može kroz UI, ali može preko konzole i kod budućih ulaza (prečice, „kupi max“).
- **Predlog:** jedna funkcija `canBuy(id)` = `rowShown(id) && cost !== null`; koristi je i `buy`, i bot. Ukloni `buyers` iz `UP` (sa migracijom save-a).

### PT-BUG-010 · S2 · otvoren — Na telefonu je PLAY ispod ~20 pasusa pravila
- **Gde:** `#startScreen .steps` (HTML ~354–373).
- **Dobijeno:** 390×844: naslov + ~20 pasusa, PLAY tek posle dugog skrolovanja. Krši „Prvih 30 sekundi“ iz plana.
- **Predlog:** start ekran = naslov, 1 rečenica, 3 ikonice, PLAY. Pravila u Pomoć sa sekcijama po zgradama i kontekstualni saveti kad se zgrada prvi put kupi (PT-IMP-U01).
- **Test:** `mobile.spec.mjs` › „PLAY is on screen without scrolling“ (`test.fail`).

### PT-BUG-018 · S4 · otvoren — Leteći brojevi ne prate svet
- **Gde:** `floatText` (~3091) računa ekransku poziciju jednom.
- **Dobijeno:** kad se kamera pomera, „+45 💰“ ostaje na ekranu dok scena klizi ispod.
- **Predlog:** pozicija se računa svaki frejm iz 3D tačke (bazen elemenata, PT-TD-011), ili sprite u sceni.

### PT-BUG-019 · S4 · otvoren — Save bez provere tipova
- **Gde:** `load()` (~3032): `S.money = d.money || 0`.
- **Dobijeno:** `money: "abc"` ostaje string, pa sabiranje postaje spajanje stringova. Samo kod ručno pokvarenog save-a.
- **Predlog:** `Number.isFinite(+d.money) ? +d.money : START_MONEY` za sva brojčana polja (PT-TD-015).

### PT-BUG-021 · S4 · otvoren — Ime igre
- `<title>Sawmill Tycoon</title>`, landing „Pilana Tajkun“, `apple-mobile-web-app-title` „Pilana“. Već u planu (`MONETIZATION.md`, Faza 0, „Sređivanje imena“).
- **Test:** `smoke.spec.mjs` › „page title and landing name agree“ (`test.fail`).

### PT-BUG-022 · S4 · otvoren — Hint na telefonu u dva reda
- `#hint` na 390 px prelama „drag · zoom · tap a machine to upgrade“ u dva reda iznad nav dugmadi i stoji 2,5 s posle prvog dodira.
- **Predlog:** kraći tekst na telefonu ili ikonice.

### PT-BUG-023 · S3 · rešen 2026-10-09 — Tamni likovi
- Prijava korisnika 2026-10-09: modeli ljudi deluju mračno i „ne idu uz igru“. Quaternius likovi imaju tamne, zasićene materijale (teget/crna odeća, tamna koža u senci) i metalness/roughness koji pod PMREM-om daju malo odsjaja.
- **Uzrok:** svi materijali likova imaju `metalness 0.4` i `roughness 0.27` — pod slabim okruženjem metal odražava tamu.
- **Rešenje:** `toyLook()` u `mountYardModels`: mat materijal, paleta podignuta i toplija (koža ostaje, samo toplija), 12 % sopstvene boje u senci, glava 1,3×.

### PT-BUG-024 · S2 · rešen 2026-10-09 — Treperenje na telefonu
- Prijava korisnika (snimak sa iPhone-a): šrafirane ploče za nekupljene mašine trepere; noću u krugovima svetla ispod mašina šarene tačkice.
- **Uzrok:** šrafirana ploča je na istoj visini kao vrh betonske ploče (y 0,16) — z-fighting, vidljiv uz manju preciznost dubine na telefonu. Tačkice: aditivni „svetlosni“ dekali preko HDR cilja na Apple GPU-u.
- **Rešenje:** `polygonOffset` za svu podnu farbu (`DECAL`: šrafure, brojevi, svetla), svetla ispod mašina uklonjena, svetla lampi i farova sa normalnim mešanjem umesto aditivnog.

## Rešeno

### PT-BUG-004 · S3 · rešen 2026-10-09 — Kamera sama klizi posle alt-tab dok je taster držan
- **Gde:** `const keys = new Set()` (linija ~6575), `updateCamera`.
- **Koraci:** 1. Drži `D`. 2. Alt-tab u drugi prozor (prozor ostaje vidljiv, `visibilitychange` se ne okida). 3. Pusti `D` u drugom prozoru. 4. Vrati se.
- **Dobijeno:** kamera nastavlja da ide udesno dok ponovo ne pritisneš i pustiš `D`.
- **Uzrok:** `keyup` stiže drugom prozoru; `keys` se nikad ne prazni na `blur`.
- **Predlog:** `addEventListener('blur', () => keys.clear())`.
- **Test:** `known-bugs.spec.mjs` › PT-BUG-004.
- **Rešeno 2026-10-09:** `addEventListener('blur', () => keys.clear())`. Test: `pause-camera.spec.mjs` › PT-BUG-004.

### PT-BUG-005 · S3 · rešen 2026-10-09 — Ime sačuvane igre i toast idu kroz `innerHTML`
- **Gde:** `drawSlots` (linija ~7646: `` btn.innerHTML = `${slot.name}<small>…` ``), `toast` (~3105) koji dobija ime u `confirmSaveScreen`.
- **Koraci:** sačuvaj igru pod imenom `<i>Mill</i>` ili `<img src=x onerror=alert(1)>`.
- **Dobijeno:** ime se renderuje kao HTML (kurziv, ili se izvrši kod). Self-XSS: napad bi tražio da neko podmetne save u `localStorage` istog origina, ali svih 6 igara deli origin.
- **Predlog:** `textContent` za ime, `<small>` kao poseban element; `toast(main, sub)` da koristi `textContent`.
- **Test:** `known-bugs.spec.mjs` › PT-BUG-005.
- **Rešeno 2026-10-09:** ime u listi i u toast-u ide kroz `textContent` (toast pravi `<small>` element). Test: `save.spec.mjs` › PT-BUG-005.

### PT-BUG-006 · S4 · rešen 2026-10-09 — Animacije rade dok je igra pauzirana
- **Gde:** `render()` zove `updateVisuals` uvek; npr. `lane.spin.rotation.z -= dt * 22` (~7527), `waterTex.offset` (~7546), svetla na viljuškarima, `AnimationMixer`.
- **Dobijeno:** iza „PAUSED“ testere se vrte, voda teče, svetla trepću. Uz to scena se crta 60 FPS i na pauzi (baterija, vidi PT-TD-010).
- **Predlog:** kad je `S.paused`, preskoči `updateVisuals` (ili `dt = 0`) i crtaj retko.
- **Test:** `known-bugs.spec.mjs` › PT-BUG-006.
- **Rešeno 2026-10-09:** na pauzi `render()` ne zove `updateVisuals`, kamera stoji, scena se crta ponovo samo kad se kamera pomeri. Test: `pause-camera.spec.mjs` › PT-BUG-006.

### PT-BUG-007 · S2 · rešen 2026-10-09 — Kasna igra trza
- **Merenje:** sve kupljeno, kamera daleko (`__cam(-20,-15,95)`): 40,1 FPS prosek, 1% low 18,5 FPS, p95 40,8 ms, 144 frejma > 20 ms za 8 s (Intel ARL iGPU, 1280×800). Rana igra: 59,8 / 42,7.
- **Uzrok:** ~2 100 draw call-ova i 513k trouglova po frejmu (svaki `part()` je poseban mesh), skeletni likovi bez frustum cullinga, senka se crta svaki drugi frejm, alokacije u petlji (GC). Vidi PT-TD-001, PT-TD-008, PT-TD-009, PT-TD-010.
- **Predlog:** PT-IMP-P01…P06.
- **Test:** `perf.spec.mjs` (plafon draw call-ova, cilj 300 kao `fixme`).
- **Rešeno 2026-10-09:** faza B (spajanje geometrije, točak = 1 mesh, kompresija i spajanje likova, culling likova van kadra, instancirani prstenovi, adaptivni kvalitet). Kasno daleko: 40,1 → 58,8 FPS, p95 40,8 → 16,8 ms, frejmova > 20 ms 144 → ~10. Draw call-ovi 2 096 → 835. Preostali retki trzaji: PT-TD-020.

### PT-BUG-008 · S3 · rešen 2026-10-09 — Modeli „iskaču“ posle starta
- **Gde:** `mountYardModels` (~7780).
- **Dobijeno:** igra kreće odmah sa proceduralnim likovima, kolima i zgradama, pa ih posle 2–18 s (zavisi od mreže) zameni GLB verzijama. Nema progresa. Posle PT-BUG-001 ovo se vidi više nego ranije (ranije se čekalo 24 s pre bilo čega).
- **Predlog:** učitavanje dok je start ekran otvoren sa progresom (bajtovi), kompresija modela (PT-TD-002), zamena sa kratkim fade/scale prelazom umesto naglog.
- **Rešeno 2026-10-09:** modeli 17,4 → 2,6 MB (spremni za ~2,5 s lokalno, 5,7 s na 4G), tanka traka učitavanja na vrhu (`#loadBar`), zamenjeni modeli „iskaču“ sa easeOutBack (`popIn`).

### PT-BUG-011 · S3 · rešen 2026-10-09 — Toast se preklapa sa karticama
- **Gde:** `#toast { top: 18% }` (CSS ~82), `#deal`, `#orderWrap`, `#jobBar` u `#top`.
- **Dobijeno:** na telefonu i u landscape-u toast „Rush order…“ prekriva tekst ponude kupca; dugmad ostaju pritisnuta ispod.
- **Predlog:** red toast-ova sa pozicijom ispod HUD-a (meri visinu `#top`), kraće trajanje, kompaktna varijanta na telefonu (PT-IMP-U03).
- **Test:** `mobile.spec.mjs` › „a toast never covers the buyer offer“ (`test.fail`).
- **Rešeno 2026-10-09:** toast se postavlja 10 px ispod donje ivice `#top` (HUD sa karticama). Test `mobile.spec.mjs` više nema `test.fail`.

### PT-BUG-012 · S3 · rešen 2026-10-09 — ⚙ preklapa start ekran, meni radi pre početka
- **Gde:** `.btns { z-index: 60 }` iznad `.overlay { z-index: 30 }`.
- **Dobijeno:** na telefonu ⚙ leži preko ugla start kartice; pre PLAY se može otvoriti meni i kliknuti „Save“, „New game“, „Pause“.
- **Predlog:** sakrij `.btns` dok je start ekran otvoren pri prvom pokretanju, ili ga stavi ispod overlay-a.
- **Rešeno 2026-10-09:** `body.intro` sakriva ⚙ do prvog PLAY.

### PT-BUG-013 · S3 · rešen 2026-10-09 — Prvi kadar je prazan parking
- **Gde:** `cam = { target: V(-20, 0, -1), dist: 46 }` (~564), mobilni `cam.target.set(-17, 0, -3)` (~7758).
- **Dobijeno:** 7 praznih šrafiranih parking mesta zauzima pola ekrana; testera (glavna atrakcija) je odsečena gore. Loš prvi utisak.
- **Predlog:** početni kadar na testeru i kadicu (npr. `(-33, -16)`, dist ~34), uvodni „fly-in“ posle PLAY; prazna mesta prikazati diskretnije (PT-IMP-V08).
- **Rešeno 2026-10-09:** početna kamera na testeri i kadici `(-31, -14)`, dist 40 (telefon 54), i uvodni prelet od 2,4 s pri prvom pokretanju.

### PT-BUG-014 · S3 · rešen 2026-10-09 — Dinamički objekti nemaju senku
- **Gde:** `buildTruck`/`buildForklift`: `g.traverse(o => { if (o.isMesh) o.castShadow = false; })` (~2304, ~2341); likovi u `dressActor` `castShadow = false`.
- **Dobijeno:** kamioni, viljuškari, ljudi i kola izgledaju kao da lebde iznad betona; zgrade imaju senke pa razlika upada u oči.
- **Predlog:** jeftina kontakt senka (instancirani tamni disk/blob ispod svakog vozila i lika) umesto pravih senki (PT-IMP-V03).
- **Rešeno 2026-10-09:** instancirane mekane kontakt senke (`syncBlobs`) ispod kamiona, viljuškara, kombija, kola i likova — jedan draw call.

### PT-BUG-015 · S2 · rešen 2026-10-09 — Atribucije za modele (licenca)
- **Gde:** `games/pilana-tajkun/assets/` — imena su „<Model> by <Autor>“ (Poly by Google, J-Toastie, David Sirera, IvOfficial, Kay Lousberg, Tomáš Bayer, Davemane42, ParfaitUwU, Marc Solà, KolosStudios, Quaternius).
- **Problem:** Quaternius je CC0, ali modeli „Poly by Google“ su CC-BY, a i deo ostalih sa poly.pizza je CC-BY. CC-BY traži vidljivu atribuciju. U igri nema ekrana sa zaslugama. Rizik pri izlasku na portale (Faza 1) i kod B2B ponuda.
- **Predlog:** proveri licencu svakog korišćenog modela, napravi `games/pilana-tajkun/CREDITS.md` + „Credits“ u meniju podešavanja. Za B2B: zameni CC-BY modele CC0 modelima ili sopstvenim.
- **Rešeno 2026-10-09:** licence proverene na poly.pizza; `CREDITS.md` + ⚙ → Credits u igri; realistični Range Rover i Dodge Charger zamenjeni Quaternius (CC0) kolima.

### PT-BUG-016 · S4 · rešen 2026-10-09 — „Bump“ novca se ne ponavlja
- **Gde:** `addMoney` (~3114): `classList.add('bump')` + `setTimeout(remove, 250)` za svaku zaradu.
- **Dobijeno:** pri češćoj zaradi klasa ostaje, animacija se ne pokreće ponovo; tajmeri se gomilaju.
- **Predlog:** restart animacije preko Web Animations API (`el.animate(...)`), ograniči na jednom po ~150 ms.
- **Rešeno 2026-10-09:** `bumpMoney()` preko Web Animations API, najviše jednom na 140 ms; zarada u svetu šalje novčić do HUD-a.

### PT-BUG-017 · S4 · rešen 2026-10-09 — Curenje GPU memorije pri ponovnoj gradnji
- **Gde:** `buildTubWalls` (~2036) i `updatePitMarks` (~1994) uklanjaju staru grupu bez `dispose()`; `hazardMat` (~695) svaki put klonira teksturu i pravi materijal; `bayNumber` pravi novu `CanvasTexture`.
- **Uticaj:** mali (desetak tekstura po proširenju kadice/kapije), ali raste sa svakom kupovinom tih nadogradnji.
- **Predlog:** keš `hazardMat` po dužini, `dispose` materijala/tekstura pri uklanjanju grupe.
- **Rešeno 2026-10-09:** `hazardMat` i brojevi mesta su keširani, ponovo građene grupe idu kroz `dropGroup` (oslobađa spojenu geometriju).

### PT-BUG-020 · S4 · rešen 2026-10-09 — Meni podešavanja se ne zatvara klikom van njega
- **Predlog:** `pointerdown` na `document` van `#settingsMenu`/`#settingsBtn` → `closeSettings()`.
- **Rešeno 2026-10-09:** `pointerdown` van menija ga zatvara.


### PT-BUG-001 · S1 · rešen 2026-10-09 — Blokirajući `models-bundle.js`
- **Bilo je:** `<script src="models-bundle.js">` (25 MB: svi GLB-ovi kao base64 u JSON-u) u `<body>`, pre modula igre. Parser čeka preuzimanje i izvršavanje, pa modul (i PLAY dugme) ne radi dok se sve ne skine. Fast 4G: 24,3 s do igre, 25,7 MB, heap 133 MB.
- **Popravka:** bundle se ubacuje samo kad je `location.protocol === 'file:'`. Preko http(s) GLTFLoader već ume da skine `assets/*.glb` u pozadini. Uklonjen i nekorišćen `factoryA` (1,2 MB) iz liste za učitavanje.
- **Posle:** 1,8 s do igre na Fast 4G, 17,4 MB u pozadini, heap 78 MB. `file://` i dalje radi (benchmark skill).
- **Prateća popravka:** natpisi na canvas teksturama se iscrtaju ponovo kad stigne font Baloo 2 (`fontsReady` u `canvasTex`, putni znak, tabla porudžbina). Ranije je font stizao pre modula jer je modul čekao 24 s; sad bi natpisi ostali u rezervnom fontu.
- **Test:** `smoke.spec.mjs` › PT-BUG-001, `perf.spec.mjs` › Fast-4G. Oba padaju na starom kodu.

### PT-BUG-002 · S1 · rešen 2026-10-09 — Klik na „kupi“ se gubi
- **Bilo je:** `drawShop()` se zove svakih 200 ms i, čim se promeni ceo broj novca, briše sve redove (`innerHTML = ''`) i pravi nova dugmad. Ako se to desi između `pointerdown` i `pointerup`, pritisak počinje na jednom elementu a završava na drugom, pa browser ne pošalje `click`. Izmereno: 5/12 i 4/8 klikova prošlo dok novac raste — u igri gde novac stalno raste.
- **Popravka:** redovi se grade jednom po stanici (`buildShopRows`), posle se samo menjaju `textContent` i klase (`drawShop`). Dugmad imaju `data-up` atribut.
- **Posle:** 12/12 i 8/8.
- **Test:** `shop.spec.mjs` › PT-BUG-002 (pada na starom kodu: 4/8).

### PT-BUG-003 · S4 · rešen 2026-10-09 — Spljošteno ✕
- `#shopClose, #booksClose` u flex zaglavlju bez `flex: none` — dugi opis ga sabija na ~16 px širine. Dodato `flex: none`.
