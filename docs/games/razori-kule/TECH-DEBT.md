# Razori Kule — tehnički dug

| ID | Uticaj | Procena | Status | Naslov |
|---|---|---|---|---|
| RK-TD-001 | srednji | M | otvoren | Ceo kod u jednom IIFE-u, globalno stanje kroz `let` promenljive |
| RK-TD-002 | srednji | M | otvoren | `carve` čita `getImageData` + `detachLoose` prolazi celu mrežu (14 400 ćelija) na svaki udar — povremeni hitch ~50 ms |
| RK-TD-003 | nizak | S | otvoren | `draw()` pravi gradijente neba/sunca svaki frejm; mogu u keš na resize |
| RK-TD-004 | nizak | S | otvoren | `drawRocket` koristi `ctx.filter` (Safari < 18 ga ignoriše — rakete bez nijanse) |
| RK-TD-005 | nizak | S | otvoren | `blocks.slice().filter().sort()` svaki frejm |
