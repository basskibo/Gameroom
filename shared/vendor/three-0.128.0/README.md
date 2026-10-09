# three.js r128 (vendored, UMD)

Only Surprizi uses it (written against r128's global `THREE` before the other games moved to r170 modules).
Until 2026-10-10 the same 600 KB build sat inline in `games/surprizi/index.html`; as a separate file the browser
caches it and the page parses faster. Upgrading Surprizi to r170 is tracked in `docs/games/surprizi/TECH-DEBT.md`.
