# Remi Vita — bagovi

Format i ozbiljnost: [docs/engineering/tracking.md](../../engineering/tracking.md).

## Pregled

| ID | S | Status | Naslov |
|---|---|---|---|
| BUG-001 | S1 | rešeno 2026-10-14 | Firefox pada (ceo browser) posle „Sačuvaj partiju“ |

## Otvoreno

(nema)

## Rešeno

### BUG-001 · S1 · Firefox pada posle „Sačuvaj partiju“
- **Simptom:** u Firefoxu (157, Linux, deployovana verzija) ceo browser se sruši odmah posle čuvanja partije. Logova nema jer pada glavni proces.
- **Dokaz:** 3 izveštaja u `Crash Reports/pending`, glavni proces, `MozCrashReason = "bug: this is an unexpected case - please open a bug and talk to #gfx team!"`. Stek posle simbolizacije: `webrender::spatial_tree::SpatialTree::get_relative_transform_with_face` ← `SpaceMapper::set_target_spatial_node` ← `FrameBuilder::build`. WebRender proverava da sadržaj nije u „starijem“ koordinatnom sistemu od površine u koju se crta.
- **Reprodukcija:** pravi Firefox preko Marionette (`tests/tools/firefox-rounds.py`): stara verzija pala 4/4 na prvom čuvanju.
- **Uzrok:** `transform` animacije na tabli (ulazak novog reda `rowIn` sa `rotateX`, vrtenje dilerovog žetona `rotateY` u `perspective`, `crownIn` sa `rotate`) unutar tabele koja se skroluje i ima sticky ćelije. Merenja sa ubačenim CSS-om: bez animacija ćelija prolazi, bez sticky ćelija pada retko, a sa oba pada skoro uvek. Nije glasovna najava: `speechd` je bio u memoriji, ali stek je u WebRenderu.
- **Popravka:** na tabli samo opacity/boja animacije. Nigde nema rotacija, 3D, `perspective`, `scale(0)`, `backdrop-filter`, ni `filter` u animacijama. U Firefoxu je tabela bez sticky ćelija (`@supports (-moz-appearance: none)`).
- **Provera:** `firefox-rounds.py` 3/3 prolaza (4 partije svaki) na novoj verziji; regresioni test `tests/games/remi-vita/firefox-safe.spec.mjs` pada na staroj verziji (42 nalaza) i prolazi na novoj.
