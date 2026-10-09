# Monster Lane — tehnički dug

Procena: **S** < pola dana, **M** 1–2 dana, **L** 3+ dana.

| ID | Uticaj | Procena | Status | Naslov |
|---|---|---|---|---|
| ML-TD-001 | srednji | M | otvoren | Proceduralni stari modeli (palme, stene, brod, stubovi) se grade pa sakriju kad stigne Kenney kit |
| ML-TD-002 | nizak | S | otvoren | `removeObj` pravi `Set` svih keširanih materijala pri svakom uklanjanju |
| ML-TD-003 | srednji | M | otvoren | Natpisi na kapijama/kovčezima/bosu su canvas teksture koje se prepisuju (draw ~12 Hz) |
| ML-TD-004 | nizak | S | otvoren | `floatText` pravi DOM element po broju (ograničeno na 12) |
| ML-TD-005 | srednji | M | otvoren | Kvalitet je sopstveni (LQ/MQ/HQ), ne `createQuality` iz `shared/` |

## Detalji

- **ML-TD-001:** ~15 draw call-ova i nekoliko MB geometrije postoje samo dok ne stignu modeli. Kad modeli postanu obavezni (Android paket ih ima lokalno), proceduralne verzije mogu da se obrišu ili da ostanu samo kao rezerva.
- **ML-TD-003:** dok je boss pod paljbom, tekstura 512×128 se šalje na GPU 20 puta u sekundi. Alternativa: HP traka kao instancirani quad + broj u DOM-u.
