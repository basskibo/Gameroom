# Performanse u Three.js (bez build koraka)

Praktične tehnike za naše igre. Svaka ima „kad“ i „kako“. Brojevi iz Pilane (2026-10-09) su primer zašto.

## Merenje pre svega

- **FPS na pravom GPU-u:** `node .cursor/skills/benchmark/scripts/benchmark.mjs <slug>` (headed Chrome). Headless/SwiftShader FPS nije stvaran.
- **Draw call-ovi i trouglovi:** `.claude/skills/game-audit/scripts/audit.mjs` broji pozive `drawElements/drawArrays` po frejmu. Ne zavisi od GPU-a, pa radi i u testovima.
- **Mreža:** isti alat sa `--throttle` (Fast 4G: 9 Mbit/s, 150 ms).
- Uvek meri istu scenu pre i posle (isti `__cam`, isti `__cheat` set).

## 1. Draw call-ovi (najveći problem kod nas)

Svaki `new THREE.Mesh` je bar jedan draw call, plus još jedan u senci. Pilana ima ~650 na startu i ~2 100 u kasnoj igri (cilj < 300 na telefonu).

- **Spoji statičnu geometriju po materijalu.** Zgrada od 40 `part()`-ova postaje 3–5 mesh-eva: `BufferGeometryUtils.mergeGeometries(geos)` posle `geometry.applyMatrix4(mesh.matrixWorld)`. Grupiši po materijalu. Radi to kad se zgrada sagradi i kad se promeni (kupovina), ne svaki frejm.
- **Ponovljene stvari → `InstancedMesh`:** stubovi ograde, lampe, oznake parkinga, palete, cepanice. Jedan poziv za sve.
- **Boje preko `instanceColor` ili vertex boja** umesto posebnog materijala po boji.
- **Sitni detalji na daljinu:** sakrij objekte manje od ~2 px na ekranu (LOD ili `visible = false` po `cam.dist`).
- **Senke:** mali objekti ne bacaju senku (`trimShadowCasters` već postoji). Statične senke ne treba crtati svaki frejm: osveži senku samo kad se kamera pomeri ili nešto izgradi.

## 2. Asseti (GLB)

- Kompresija: `npx @gltf-transform/cli optimize in.glb out.glb --compress meshopt --texture-compress webp --texture-size 1024`. Meshopt dekoder se učitava kao običan JS (bez build-a).
- Likovi: jedan rig + deljene animacije. Danas svaki Quaternius lik ima ~1,4 MB sa istim animacijama.
- Ne učitavaj ono što ne koristiš (Pilana je učitavala nekorišćen `factoryA`, 1,2 MB).
- Fajlovi bez razmaka i dijakritika u imenu (`fence-bayer.glb`, ne `Fence by Tomáš Bayer - x.glb`).
- Učitavanje u pozadini dok je start ekran otvoren, sa pravim progresom (bajtovi), i proceduralna rezerva dok model ne stigne.

## 3. Petlja frejma

- Logika u fiksnim koracima (Pilana: 0,05 s), prikaz jednom po frejmu. `dt` ograničen.
- **Nula alokacija u vrućem putu.** Svaki `new Vector3()`/`clone()`/`filter()` u `update` ili `updateVisuals` je smeće za GC, a GC pauze ruše 1% low. Koristi modul-nivo privremene objekte.
- Ne računaj ono što nije vidljivo: `AnimationMixer.update` samo za likove u kadru; čestice van ekrana se ne ažuriraju.
- Instanced matrice ažuriraj samo za objekte koji su se pomerili (Pilana danas prepisuje svih ~1 400 cepanica dok bilo koja leti).
- Kad je igra pauzirana ili tab skriven: ne crtaj (ili crtaj retko).

## 4. Rezolucija i kvalitet

- `setPixelRatio(min(devicePixelRatio, 1.5))` je dobar start. Dodaj **adaptivni DPR**: ako prosečan frejm > 20 ms tokom 2 s, spusti DPR za 0,25 (do 0,75); ako je < 12 ms, vrati.
- Preset-i u podešavanjima: Nisko (bez senki, DPR 1, bez post-obrade), Srednje, Visoko. Podrazumevano po `navigator.hardwareConcurrency` i prvom merenju.

## 5. DOM i UI

- HUD menjaj preko `textContent`, i to retko (Pilana: svakih 200 ms, dobro).
- Ne pravi DOM elemente iznova dok je panel otvoren. Patch u mestu (PT-BUG-002).
- Leteći brojevi (`floatText`): bazen elemenata, `transform` animacije, bez `setTimeout` po elementu.

## 6. Učitavanje Three.js

Od 2026-10-09 Three.js r170 je u `shared/vendor/three-0.170.0/` i igre ga uvoze preko importmap-a (keš između igara). `file://` nije podržan — lokalno `node tests/server.mjs`. Geometrija: `bakeStatic`/`bakeViz` iz `shared/gameroom-three.js`; modeli: `node tools/optimize-glb.mjs <slug>` (meshopt + WebP) i `MeshoptDecoder` u `GLTFLoader`-u.
