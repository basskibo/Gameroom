---
name: "3d-tycoon-browser-game"
description: "Build a polished 3D idle/tycoon browser game (Three.js) that matches a mobile-ad reference: free camera, big map, real vehicle paths, physics piles, in-world upgrade pads."
---

# 3D tycoon browser game ("Top Tycoon" ad style)

Use this when the user wants a 3D idle/tycoon game (sawmill, factory, mine, farm, logistics...) that should look and play like the mobile-ad screenshots they send. Proven on `gameroom/games/pilana-tajkun` (v2, commit e84e4cb). In the gameroom repo, also follow the repo's `browser-games` skill for integration (GAMES array, cover/hero, gameroom:back link, Serbian UI, localStorage slug prefix).

## What the user rejected (never do this again)

- A cramped "everything on one square meter" layout with a fixed camera. It reads as a toy.
- Flat boxy models built from plain `BoxGeometry`, `MeshToonMaterial`, and blocky wheels.
- Vehicles that teleport or lerp in straight lines, and trucks that just slide along X.
- A card strip of upgrades at the bottom of the screen.
- A "pile" made of neatly stacked planks, or a static mound that just changes count.
- Cosmetic patching of a bad base (recoloring, tweaking the camera) and calling it a redesign. When the user says it looks nothing like the reference, rebuild from scratch.
- Reporting "done" before comparing screenshots of every area against the reference images.

## Process

1. **Study the reference images first.** List concretely what you see: camera angle, map scale, road shapes, the bridge or tunnel, the pile look, the vehicle silhouettes, where the upgrade buttons sit, and the queue/angry-emoji mechanic. The design goals come from this list.
2. **Write the code in parts and assemble it with a build script.** The game is one HTML file, but it's authored as `shell.html` plus `g1_core.js`, `g2_world.js`, `g3_<machine>.js`, `g4_vehicles.js`, `g5_game.js` and `g6_loop.js`. A `build.py` concatenates them, asserts there is no `</script` inside, writes a `game_check.mjs` for `node --check`, and injects everything into the shell. Edit with small Python `str.replace` scripts that `assert a in s` first.
3. **Verify with headless screenshots of each area** (Playwright + `--use-gl=swiftshader`), at both 1280x800 and 390x844. Fix what looks wrong, then shoot again. Compare side by side with the reference.
4. **Balance by simulation.** Run a greedy bot and a "smart" bot for ~60-70 minutes of game time and log when each upgrade is bought.
5. **Deploy safely:** check `git status` and the sha256 of the files on the device first, commit the new files, then verify the hashes again.

## Engine setup (g1_core)

- Use a `PerspectiveCamera` (fov 32 landscape, 40 portrait), `ACESFilmicToneMapping` with exposure ~1.08, `MeshStandardMaterial` (roughness ~0.78), a hemisphere light plus a directional sun with PCFSoft shadows. The shadow frustum follows the camera target and is sized from the zoom distance.
- Set up the camera state as `cam = {target, dist, vel, tween}`, with `camera.position = target + CAM_DIR * dist` (`CAM_DIR ≈ (0.42, 1.2, 1).normalize()`). Clamp the target to map bounds and the distance to 14-95.
- **Rounded boxes everywhere.** Write an `rbox(w,h,d,r,seg)` helper (the RoundedBoxGeometry technique: a subdivided box whose vertices are pushed out along normals). Cache geometries and materials. A `part(geo, colorOrMat, parent, x,y,z, rx,ry,rz)` helper keeps model code short. A `beam(a,b,t,mat)` helper stretches a box between two points, which you need for trusses.
- `canvasTex()` makes textures for bark, tree rings, the belt, the saw blade, hazard stripes, signs, and water ripples.
- If the sandbox blocks the jsDelivr CDN, embed three.module.min.js in a `<script type="text/plain" id="three-src">` block and load it with `await import(URL.createObjectURL(new Blob([...])))`. When doing a string replace with that code, always use a function replacer, never a plain string (because of `$&`).

## Free camera input (g5)

- **Grab-the-ground pan.** On pointerdown, store `anchor = groundAt(x,y)` (raycast onto the y=0 plane). On move, do `target += anchor - groundAt(newX,newY)` so the point under the finger stays under the finger. Track velocity for inertia (`vel *= exp(-5dt)`).
- **Pinch:** with 2 pointers, set `dist = startDist * startSpread / spread`, and pan using the midpoint of the two fingers.
- **Wheel zoom toward the cursor:** raycast before and after changing `dist`, then shift the target by the difference.
- **Tap vs drag:** it's a tap only if the pointer moved under 8px in under 500ms. Taps raycast against the upgrade pad meshes.
- Add WASD/arrows, Q/E for zoom, and navigation buttons (Pilana/Parking/Most/Otkup) that tween the target and distance over 0.8s. Tween with `min(raw, 0.1)` dt, not the 0.05 visual clamp.
- Show a hint pill that fades out after the first interaction. Set the default portrait framing separately.

## Big world (g2)

- **The map is large and the stations are far apart.** Sawmill + tub + yard at one end, then a winding road through the forest, a river and bridge, a toll gate, and the buyer/market at the far end. One truck round trip should take about a minute of real driving.
- **Terrain:** a subdivided plane with vertex colors (two grass tones mixed by noise, sand near the river) and a river channel carved from `riverDist(x,z)` to spaced points on a CatmullRom curve. The water is a separate plane with a scrolling ripple texture.
- **Roads:** a CatmullRom curve, `getSpacedPoints(len/0.5)`, and right-vectors from the tangents. A `ribbon(pts, rights, halfW, offset, y, mat)` helper builds road strips, edge lines and dashed center lines. Keep road meshes a little above the terrain (y≈0.07) and lines at ≈0.085 to avoid z-fighting. Road upgrades change the road material (dirt → asphalt → highway) and show the painted lines.
- **Bridge:** a deck, piers, and a red through-truss (posts, diagonal `beam`s, top chords, overhead bracing). **Toll gate:** booth, boom arm with a red/white texture, traffic light with emissive bulbs.
- **Forest:** jittered grid candidates everywhere except in a `cleared(x,z)` test (yard, machines, market, river + banks, within ~5m of the road points). Build it from 3 InstancedMeshes (trunk + 2 cones, flat shading) with per-instance green variation. Several thousand trees is fine.
- **Yard:** a concrete pad, painted parking spots, and forklift boxes.

## Machine + physics pile (g3)

- Real logs are cylinders with a bark texture on the side and a growth-ring texture on the caps, riding a conveyor from the forest. The belt texture offset scrolls by exactly how far the logs moved.
- The cut cycle is driven by the cut timer phase `p = sawT/interval`: the blade rises (0-0.15), the log feeds forward one piece length (0.15-0.55), then the blade descends and cuts (0.55-1). The front log gets shorter by one piece per cut, and sawdust Points are emitted during the cut.
- **Pieces fall into a walled tub with hazard-stripe caps.** They're one InstancedMesh (cap ~600) with per-instance color (mostly wood, ~10% red, ~5% grey, like the ad).
- **Physics-lite:** use gravity, tumbling via a quaternion times angular velocity, wall bounces, and 1-2 floor bounces. The floor height comes from a heightfield grid (cell ~0.42). When a piece settles, it slides to a lower neighbor cell while `h[n] < h[c] - 0.16` (up to 30 steps), lies at a random yaw, and adds ~0.1 to its cell. That gives a natural spreading heap.
- Removal (a forklift scoop) takes the highest settled pieces and decrements their cells; swap-remove the instances and keep their colors aligned.
- Logic and visuals stay separate: `S.stockpile` is the economic truth and the instanced pieces are only a visual (skip them when `instant`). On load, fill the tub instantly.

## Vehicles (g4)

- **Models** use `rbox` parts. The truck has a white cab with windows, mirrors, headlights and a roof beacon, a dark chassis, and 6 wheels (a tire plus hub on a pivot group so the child spins on its own axis). Its orange dump bed is a group hinged at the rear, holding an InstancedMesh cargo with slots that fill in proportion to the load. The forklift has a body, counterweight, seat, a driver with a hard hat, a roll cage, a flashing beacon, a mast, and a carriage with forks and a load that rises.
- **One shared route** runs out lane → turnaround loop at the market → return lane, built from the road points offset by ±lane width (~1.2). Precompute the cumulative arc length. `routeAt(s)` uses a binary search plus a lerp, and `nearestS(x,z,i0,i1)` finds named stop points (merge per spot, reverse point per spot, gate, dock).
- **Truck driving:** find the stop distance as the minimum of (the next truck ahead's `s` minus the GAP) and (gate/dock/reverse points not yet passed). Then use `v = min(zoneLimit, sqrt(2*decel*distance))`, with smooth acceleration and a yaw that eases toward the tangent. Speed limits come from zones: slow in the yard and the loop, and the road upgrade sets the highway speed.
- **States:** parked → waitExit (exit only when the merge window and crossing are clear) → exiting (cubic Bezier from the spot to the out lane) → route → gate hold → dumping (bed tilts, cargo slides out, payout) → route → reversing (cubic Bezier from the return lane back into the spot; it reverses only when the out lane near the spot is clear, and trucks on the out lane stop while someone is reversing) → parked.
- **The angry emoji (😡) sprite** appears when a truck on the route has been stopped for more than 2.4s. That's the bottleneck feedback from the ad, and the toll-gate speed upgrade fixes it.
- **Forklifts** drive waypoints with steering: turn-rate-limited yaw, slowing in turns, and reverse segments. The cycle is: scoop at the tub (lift the forks) → drive to the target truck and approach from behind → raise the load, add it to the truck's `loaded` → back out → park in the home box. Use a `sees(o,r)` forward-cone check to avoid each other; for a head-on meeting, the lower index has priority, with a 5s deadlock breaker. Reserve the amount at scoop time with `truck.incoming`.
- Wheel rotation comes from the distance actually moved. Add a small body bob with speed, and a pop-in scale animation when a vehicle is bought.

## Upgrades as physical pads (g5)

- Each upgrade is a dark rounded slab on the ground **next to what it upgrades** (saw pads by the saw, forklift pads by the forklift boxes, "new truck" on the next empty parking spot, road/gate/market pads by those). It's rotated to face the camera.
- The top face is a CanvasTexture (640x380): title, big emoji icon, level pips, cost in large gold text, or MAX. Only redraw it when the `level|cost|affordable` key changes. A green glow plane pulses when you can afford it.
- A tap raycasts the pad meshes. If you can't afford it, show a red toast "Nemaš dovoljno para" and shake the pad. On a buy, bounce the pad, burst confetti, and show a toast with the new stat.
- Upgrade data lives in one table: `UP = { id: { vals:[...per level], costs:[...] } }`. Every level is finite so the game reaches MAX.

## Loop, economy, test hooks (g6)

- Logic runs in fixed substeps of ≤0.05s inside each frame (the raw dt is capped at 1.5s), so vehicles never tunnel through stop points. Visuals use a separate dt capped at 0.05s.
- The income pill shows a rolling 60s average of actual payouts.
- Save to localStorage every 5s, on pause and on beforeunload, under a versioned key (`<slug>:v2`).
- Debug hooks: `__debug()`, `__cheat(id,n)`, `__addMoney`, `__cam(x,z,dist)`, `__start()`, `__step(n,dt)` (runs logic headless), and `__padScreen(id)` for input tests. `?auto&sim=SECONDS[&smart]` runs the bot and writes `window.simInfo` and `window.simLog`.
- **Target pacing:** the first buy happens within a few seconds, the first truck payout in about 1 minute, and everything is maxed in roughly 50-65 minutes. Starting stockpile ~14 and start money ~80.

## Screenshot / test scripts (in `scripts/` next to this SKILL.md)

Serve the repo root (`python3 -m http.server 8766`) and set `GAME_URL` if the game is not `games/pilana-tajkun`. The URL gets `?auto` / `?auto&sim=...` appended, so pass it without a query string, as in `GAME_URL=http://localhost:8766/games/x/index.html node scripts/sim2.mjs 3600 '&smart'`.


- `shots2.mjs prefix W H "<setup js>" '[[name,[x,z,dist]],...]' waitMs` starts the game, runs the setup (cheats plus `__step`), moves the camera, and screenshots each view.
- `trace2.mjs N` steps the logic headless and prints every change in truck/forklift state. Use it to catch deadlocks.
- `sim2.mjs SECONDS [&smart]` runs the balance sim.
- `input_test.mjs` checks that a tapped pad buys the upgrade, that dragging moves the target, that the wheel zooms, and that the nav buttons tween.
- `cover2.mjs cover|hero` renders a busy mid-game scene (cheats plus steps), hides the HUD, and saves a 1200x900 cover and a 1600x700 hero.

## Final checklist before telling the user it's done

- [ ] Screenshots of every area (machine, tub, yard, road, bridge/gate, market) at desktop and phone size look like the reference.
- [ ] Vehicles visibly drive, queue, and park without overlapping (checked with trace + screenshots).
- [ ] Pads tap-buy correctly and none is hidden inside trees or under objects.
- [ ] The sim shows no deadlock and the pacing is within target.
- [ ] Deployed with hash verification and committed (no push unless asked).
- [ ] The report to the user is short and honest, and says what couldn't be verified (e.g. real-GPU fps).