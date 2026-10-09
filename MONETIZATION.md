# Gameroom — plan monetizacije i roadmap

> Važeći plan za projekat (usvojen 2026-10-01). Svaka promena igara, landinga ili infrastrukture treba da ide u pravcu ovog plana. Kad se faza ili odluka promeni, ažuriraj ovaj fajl (sekcija „Status“ i „Dnevnik odluka“).

## Status

| Faza | Stanje |
|---|---|
| Faza 0 — Temelji | 🔨 u toku (Pilana: SDK sloj, analitika, mesto za reklamu za nagradu) |
| Faza 1 — Portali | ⏸ |
| Faza 1A — Google Play (Android), paralelno sa portalima | 🔨 u toku (Pilana: Capacitor + AdMob, test reklame) |
| Faza 2 — Ulaganje u najbolju igru | ⏸ |
| Faza 3 — Apple App Store i kupovina u aplikaciji | ⏸ |
| Faza 4 — B2B (paralelno) | ⏸ |

Polazno stanje: 4 gotove igre (Pilana Tajkun, Kamp Tajkun, Surprizi, Monster Lane) + Osvoji svet u nastajanju. Statični single-file HTML na Vercelu, napredak u `localStorage`, bez backenda, analitike i reklama, većinom samo na srpskom.

## Glavna ideja

Problem nije model naplate nego publika. Redosled je:

**merenje → engleski → distribucija preko portala i Google Play-a (paralelno) → reklame → Apple i ulaganje samo u igru koja se pokaže najbolje.**

Od 2026-10-09 Android (Google Play) ide paralelno sa web portalima, počevši od Pilane: jednokratno 25 $, a ista igra se pakuje preko Capacitor-a bez prepisivanja. Apple (99 $ godišnje) čeka podatke.

## Modeli zarade, po prioritetu

| # | Model | Igre | Kada |
|---|---|---|---|
| 1 | Web portali (CrazyGames, Poki, GameDistribution): oni donose igrače, mi dobijamo deo prihoda od reklama preko njihovog SDK-a | Sve | Posle Faze 0 |
| 2 | Reklame za nagradu (igrač sam bira da gleda reklamu i dobija bonus) | Sve | Uz portale |
| 3 | Reklame na sopstvenom sajtu (Google H5 Games Ads / AdinPlay) | Sve | Kad landing dobije saobraćaj |
| 4 | Google Play (Capacitor + AdMob), kasnije kupovina u aplikaciji („ukloni reklame“, startni paket) | Pilana prva, pa ostale | Od Q4 2026, paralelno sa portalima |
| 4b | Apple App Store | Igra sa najboljim brojkama na Androidu/portalima | Posle Faze 2 |
| 5 | Igre po narudžbini za brendove i licenciranje | Surprizi, Pilana, Kamp | Paralelno, od sada |
| 6 | Steam | Pilana Tajkun, ako dobije dovoljno sadržaja | Opciono |

Igre po narudžbini (tačka 5) su verovatno najbrži pravi prihod. Surprizi se može prepakovati za brend slatkiša ili igračaka, Pilana za proizvođača nameštaja ili drvnu industriju, a Kamp za turizam.

## Reklame za nagradu, po igri

- **Pilana Tajkun:** duplo veća zarada na 3 minuta, duplo veća zarada dok je igrač offline, odmah gotova nadogradnja.
- **Kamp Tajkun:** besplatan radnik na ograničeno vreme, duplo veća nagrada za porudžbinu.
- **Monster Lane:** oživljavanje posle poraza, start sa jačim oružjem, dodatni pirati.
- **Surprizi:** jedna besplatna kesica dnevno uz reklamu.
- **Osvoji svet:** pomoć kod pitanja, dodatni život. Igra ima edukativni ugao (škole, edu portali).

### Tvrda pravila

- Reklama se **nikad ne nameće usred igranja**. Reklame za nagradu igrač uvek sam bira. Reklame preko celog ekrana idu samo na prirodnim pauzama (posle nivoa, posle poraza), uz ograničenje koliko često.
- **Surprizi: nikad ne prodavati nasumične kesice za pravi novac** (loot box mehanika, regulisana u EU, igraju deca). Za novac se prodaje samo garantovan sadržaj.
- Za igre za decu (Surprizi, Osvoji svet): reklame bez personalizacije, bez prikupljanja ličnih podataka.
- Igra mora da radi i bez reklama: ako se reklama ne učita, ili ako je SDK blokiran ili ne postoji, nema greške i nema zaključavanja napretka.

## Roadmap

### Faza 0 — Temelji (oktobar 2026, 2–3 nedelje)

- [x] `shared/gameroom-sdk.js`: jedan sloj iznad svih reklamnih servisa i analitike. (2026-10-09: adapteri none/test/admob/crazygames/poki; GameDistribution i sopstveni sajt kasnije; Pilana povezana, ostale igre čekaju) Igre pozivaju samo njega, nikad SDK portala direktno.
  - API: `Gameroom.init()`, `gameplayStart()`, `gameplayStop()`, `showRewarded(placement) → Promise<boolean>`, `showMidgame()`, `track(event, props)`.
  - Adapteri: AdMob (Android aplikacija), CrazyGames, Poki, GameDistribution, sopstveni sajt, test adapter (`?ads=test`, lažna reklama za proveru toka) i prazan adapter (podrazumevani, ne radi ništa). Adapter se bira po okruženju, hostu ili query parametru.
- [ ] Analitika (Plausible ili PostHog). SDK šalje događaje u PostHog čim se upiše ključ (`shared/gameroom-config.js`); nalog još ne postoji — PostHog ima besplatan nivo. Događaji: `game_start`, `first_minute`, `session_end` (sa trajanjem), `return_d1`, `rewarded_offer`, `rewarded_watched`.
- [ ] Engleski prevod (i18n) za sve igre. Podrazumevani jezik po `navigator.language`, uz izbor u meniju podešavanja.
- [ ] Performanse: izdvojiti i kompresovati slike iz Pilane (~1 MB) i Surprizija (~845 KB), dodati ekran za učitavanje. Cilj: prvo iscrtavanje za manje od 3 s na prosečnom telefonu.
- [ ] Verzija na `localStorage` save (`version` polje i migracija), da nadogradnje ne brišu napredak.
- [ ] Politika privatnosti (`/privacy/`) i saglasnost za kolačiće na sopstvenom sajtu.
- [ ] Sređivanje imena: jedno englesko ime koje se može pretraživati i jedno lokalno ime po igri, ujednačeno u `<title>`, `GAMES` nizu i u igri. Danas Surprizi ima tri imena („Male igracke“, „SuperUkis“, „Surprizi“), a Pilana ima „Sawmill Tycoon“ u `<title>` i „Pilana Tajkun“ na landingu.

### Faza 1 — Izlazak na portale (novembar–decembar 2026)

- [ ] CrazyGames: sve 4 igre (prvo osnovno lansiranje, pa puno na osnovu metrika). Paralelno GameDistribution.
- [ ] Prijava za Poki sa 1–2 najjače igre.
- [ ] Uključivanje reklama za nagradu (mesta navedena gore).
- [ ] **Odluka na kraju faze:** igra sa najdužim igranjem i najboljim D1 dobija dalji razvoj, a ostale samo održavanje (popravke, bez novih funkcija).

### Faza 1A — Google Play, paralelno sa portalima (od oktobra 2026)

- [x] Capacitor Android projekat za Pilanu (`mobile/pilana-tajkun/`, 2026-10-09; debug APK radi na emulatoru), igra se kopira iz `games/` + `shared/` skriptom (pakovanje, ne build igre).
- [x] AdMob adapter u `shared/gameroom-sdk.js` (2026-10-09; test reklama za nagradu provereno na emulatoru) (reklama za nagradu + reklama preko celog ekrana na prirodnoj pauzi), prvo sa Google test ID-jevima.
- [ ] Nalog na Google Play Console (25 $, jednom) i AdMob nalog (besplatno); prava ID-jeva aplikacije i reklama u `mobile/`.
- [ ] Ključ za potpisivanje (čuva se van repoa), App Bundle (`.aab`). Gradle je spreman (`keystore.properties`), ključ pravi korisnik — vidi `docs/engineering/android.md`.
- [ ] Politika privatnosti na sajtu (obavezna za Play i AdMob; nacrt `docs/legal/privacy-policy-draft.md`), „Data safety“ formular, ocena sadržaja, `app-ads.txt` na domenu.
- [ ] Zatvoreno testiranje: novi lični nalozi moraju imati ~12 testera tokom 14 dana pre objave u produkciji (Google pravilo; proveriti aktuelno u Play Console).
- [ ] Objava Pilane, pa merenje (instalacije, D1, gledanje reklama) uporedo sa portalima.
- [ ] Igre za decu (Surprizi, Osvoji svet) na Play-u samo uz „Families“ pravila: sertifikovani reklamni SDK, bez personalizacije.

### Faza 2 — Ulaganje u najbolju igru (januar–mart 2027)

- [ ] Zadržavanje igrača: dnevne nagrade, zarada dok je igrač offline, dostignuća, sezonski događaji.
- [ ] Nove verzije na 4–6 nedelja.
- [ ] Marketing kratkim videom (TikTok/Shorts) iz snimaka igranja.
- [ ] SEO stranica za svaku igru, uz reklame na sopstvenom sajtu.
- [ ] Međusobna promocija: na kraju sesije ili posle poraza ponuda druge igre.
- [ ] Rang liste za Monster Lane i Osvoji svet.

### Faza 3 — Apple App Store i kupovina u aplikaciji (2027)

- [ ] iOS verzija najbolje igre (isti Capacitor projekat), Apple nalog 99 $ godišnje.
- [ ] Kupovina u aplikaciji na obe platforme („ukloni reklame“, startni paket, VIP duplo veća zarada).

### Faza 4 — B2B (paralelno sa svim fazama)

- [ ] Portfolio stranica „igre za brendove“.
- [ ] Šabloni za brendiranje (zamena modela, boja i logoa) za Surprizi, Pilanu i Kamp.
- [ ] Ponuda agencijama i brendovima u regionu.

## Principi za razvoj

1. **Fokus.** Posle Faze 1 nove funkcije dobija samo igra koju su izabrali podaci.
2. **Prvih 30 sekundi.** Akcija i nagrada odmah, bez tutorijala koji se mora čitati.
3. **Svaka nova igra** od starta ima engleski, `gameroom-sdk.js`, analitičke događaje i bar jedno mesto za reklamu za nagradu.
4. **Bez build koraka.** Sve ostaje statično (pravila iz `.claude/skills/browser-games/SKILL.md`). Zajednički kod ide u `shared/` kao običan JS fajl. Izuzetak je samo pakovanje za Android (`mobile/`): skripta kopira iste fajlove u Capacitor projekat, igra se ne menja.
5. **Merenje pre odluke.** Svaka odluka iz roadmapa se donosi na osnovu metrika: prosečno vreme igranja, D1, koliko igrača prihvati ponuđenu reklamu.

## Metrike i pragovi

| Metrika | Cilj za „nastavljamo“ |
|---|---|
| Prosečno vreme igranja | ≥ 10 min (tajkun), ≥ 5 min (akcija/kviz) |
| D1 povratak | ≥ 20 % |
| Gleda ponuđenu reklamu za nagradu | ≥ 15 % |
| Odustalo u prvom minutu | ≤ 40 % |

## Dnevnik odluka

- **2026-10-01:** usvojen plan. Prioritet: Faza 0 (SDK sloj, analitika, engleski), prva igra za povezivanje je Pilana Tajkun.
- **2026-10-09:** korisnik pokreće „polish“ svih igara ka „AAA osećaju“ (performanse, animacije, izgled, doslednost), igra po igra, počevši od Pilane Tajkun. Za svaku igru: audit, zavedeni bagovi/dug/unapređenja u `docs/games/<slug>/`, odmah se rešavaju samo S1 i kozmetika, Playwright testovi u `tests/`. Pilana: audit gotov, S1 rešeni (do igre na 4G 24 s → 1,8 s; gubljenje klikova u panelu). Napomena: polish svih igara pre Faze 1 odlaže merenje na portalima — predlog je da Pilana ide do kraja, a ostale igre samo audit + S1/S2 dok podaci ne izaberu najbolju (vidi `docs/games/pilana-tajkun/TRACKER.md`, odluka D4).
- **2026-10-09:** `file://` napušten (Three.js i zajednički moduli iz `shared/`). Pilana: faze performansi, izgleda i animacija završene (4G 24 s → 2,9 s, kasna igra 40 → 59 FPS). Korisnik bira vizuelni „wow“ plan V1–V5 (modeli, dan/noć, teren, herojski kadrovi, UI) pre Faze 0; agent upozorio da SDK, analitika i engleski čekaju — predlog da Faza 0 ide posle V1–V2.
- **2026-10-09:** korisnik menja plan: **Google Play (Android) ide paralelno sa portalima**, počevši od Pilane (Capacitor + AdMob); Apple kasnije, kad budu podaci. Nova Faza 1A, stara Faza 3 postaje Apple + kupovina u aplikaciji. Troškovi: Play nalog 25 $ jednom, AdMob, Capacitor i alati besplatni; vreme za zatvoreno testiranje (12 testera / 14 dana za nove lične naloge), politika privatnosti i formulari su obavezni. Pilana: Kenney CC0 modeli (V1) gotovi, kreće Faza 0 (SDK, analitika, mesto za reklamu za nagradu) i Android projekat.
