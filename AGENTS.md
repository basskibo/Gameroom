# Gameroom — uputstvo za agente

Kolekcija browser igrica (statični single-file HTML, Three.js) sa landing stranicom (`index.html`) i hostingom na Vercelu. Konvencije za igre, landing i deploy: `.claude/skills/browser-games/SKILL.md`.

## Plan monetizacije je obavezujući

`MONETIZATION.md` je važeći plan i roadmap projekta. Pre svakog zadatka:

1. Pročitaj sekciju **Status** u `MONETIZATION.md` i proveri u kojoj smo fazi.
2. Rad usklađuj sa trenutnom fazom. Ako zahtev korisnika ide protiv plana (npr. nove funkcije za igru koja je u „samo održavanje“, nametnuta reklama usred igranja, nasumične kesice za pravi novac u Surprizima), uradi šta korisnik traži, ali ga kratko upozori na odstupanje.
3. Poštuj **Tvrda pravila** i **Principe za razvoj** iz plana. Ukratko:
   - Igre pozivaju reklame i analitiku samo preko `shared/gameroom-sdk.js`, nikad direktno preko SDK-a portala.
   - Igra mora da radi i bez reklama i SDK-a (prazan adapter, bez grešaka, bez zaključavanja napretka).
   - Reklame za nagradu igrač uvek sam bira. Reklame preko celog ekrana idu samo na prirodnim pauzama.
   - Igre za decu (Surprizi, Osvoji svet): reklame bez personalizacije, bez ličnih podataka, bez nasumičnog sadržaja za pravi novac.
   - Svaka nova igra od starta ima engleski, SDK sloj, analitičke događaje i bar jedno mesto za reklamu za nagradu.
   - Bez build koraka, zajednički kod ide u `shared/` kao običan JS.
4. Kad završiš stavku iz roadmapa, štikliraj je u `MONETIZATION.md` i ažuriraj **Status**. Kad korisnik donese odluku koja menja plan, upiši je u **Dnevnik odluka** (sa datumom).
