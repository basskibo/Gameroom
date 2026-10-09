# Android (Google Play)

Igre idu na Google Play kao Capacitor aplikacije: ista igra kao na webu, upakovana u Android aplikaciju. Igra se ne menja i nema build koraka — `pack.mjs` kopira fajlove iz `games/<slug>/` i `shared/` u `www/`. Plan: `MONETIZATION.md`, Faza 1A.

Prva aplikacija: **Sawmill Tycoon** (Pilana Tajkun), `mobile/pilana-tajkun/`, `appId` `rs.codemeup.sawmilltycoon`.

> `appId` se **ne može promeniti posle prve objave** na Play-u. Ako treba drugi domen ili ime, promeniti pre prvog upload-a (`capacitor.config.json`, `android/app/build.gradle`, paket u `MainActivity.java`).

## Struktura

| Putanja | Šta je |
|---|---|
| `mobile/pilana-tajkun/capacitor.config.json` | ime, `appId`, `webDir: www` |
| `mobile/pilana-tajkun/pack.mjs` | kopira igru + `shared/` u `www/` i zamenjuje `shared/gameroom-config.js` |
| `mobile/pilana-tajkun/config/gameroom-config.js` | AdMob ID-jevi reklama (sada Google TEST ID-jevi), analitika |
| `mobile/pilana-tajkun/android/` | Android Studio / Gradle projekat (u gitu) |
| `mobile/pilana-tajkun/android/app/src/main/AndroidManifest.xml` | AdMob **App ID** (sada test) |
| `mobile/pilana-tajkun/android/app/src/main/java/.../MainActivity.java` | ceo ekran (bez status trake) |
| `mobile/pilana-tajkun/store/` | ikonica 512 px za Play listing |
| `mobile/pilana-tajkun/keystore.properties` | **van gita** — podaci za potpisivanje |

Reklame idu kroz `shared/gameroom-sdk.js`: u aplikaciji se sam bira AdMob adapter (`@capacitor-community/admob`). Igra ne zna ništa o AdMob-u.

## Komande

```bash
cd mobile/pilana-tajkun
npm install            # prvi put
npm run apk            # debug APK: android/app/build/outputs/apk/debug/app-debug.apk
npm run bundle         # release .aab za Play: android/app/build/outputs/bundle/release/app-release.aab
```

Potrebno: Java 21, Android SDK (`~/Android/Sdk`, platforma 36), `android/local.properties` sa `sdk.dir=...` (van gita). Prvi build skida Gradle i biblioteke (jednom).

Provera na emulatoru (Pixel_8 AVD postoji):

```bash
~/Android/Sdk/emulator/emulator -avd Pixel_8 &
~/Android/Sdk/platform-tools/adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Debug build dozvoljava `chrome://inspect` (WebView) — tako je provereno da AdMob test reklama za nagradu radi i da igra dobije ×2.

## Do objave — koraci

1. **Google Play Console** nalog (25 $ jednom, provera identiteta). Novi lični nalozi: zatvoreno testiranje sa ~12 testera tokom 14 dana pre produkcije (proveriti aktuelno pravilo u konzoli).
2. **AdMob** nalog (besplatno): dodati aplikaciju „Sawmill Tycoon“ (Android), napraviti jednu jedinicu **Rewarded** i jednu **Interstitial**.
   - App ID (`ca-app-pub-…~…`) → `AndroidManifest.xml`.
   - ID-jevi jedinica (`ca-app-pub-…/…`) → `config/gameroom-config.js`, `testing: false`.
   - Dok aplikacija nije objavljena i povezana u AdMob-u, prave reklame mogu da ne dolaze — to je normalno.
   - `app-ads.txt` na domenu sajta (AdMob daje sadržaj).
3. **Ključ za potpisivanje** (čuvati van repoa, i rezervnu kopiju — bez njega nema ažuriranja):
   ```bash
   keytool -genkeypair -v -keystore ~/keys/sawmill-upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
   ```
   pa `mobile/pilana-tajkun/keystore.properties`:
   ```
   storeFile=/home/<korisnik>/keys/sawmill-upload.jks
   storePassword=...
   keyAlias=upload
   keyPassword=...
   ```
   Uključiti „Play App Signing“ u konzoli (Google čuva ključ aplikacije, ovo je samo ključ za upload).
4. `versionCode` / `versionName` u `android/app/build.gradle` povećati za svaki upload.
5. **Politika privatnosti** na javnom URL-u (nacrt: `docs/legal/privacy-policy-draft.md`) — obavezna za Play i AdMob.
6. Play Console formulari: Data safety (reklame → AdMob prikuplja advertising ID i podatke o uređaju), ocena sadržaja (IARC), ciljna publika (13+ za Pilanu; ne „deca“), reklame: „da“.
7. Listing: ime, kratak i dug opis (engleski, kasnije srpski), ikonica 512 px (`store/icon-512.png`), feature grafika 1024×500, bar 2 screenshota telefona.
8. Interno testiranje → zatvoreno testiranje → produkcija.

## Pravila

- Igre za decu (Surprizi, Osvoji svet) na Play-u: program „Families“, `kids: true` u `Gameroom.init` (bez personalizacije, `tagForChildDirectedTreatment`), bez reklama preko celog ekrana na početku.
- Reklama preko celog ekrana samo na prirodnoj pauzi; SDK ograničava učestalost (`midgameGap`, `midgameGrace` u konfiguraciji).
- Nikad ne klikati na sopstvene prave reklame (AdMob blokira nalog). Za testiranje: test ID-jevi ili test uređaj.
