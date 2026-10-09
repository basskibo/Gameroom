// Jezik za landing i sve igre. Klasičan skript (ne modul), pa ga čitaju i moduli i obične skripte preko window.GameroomI18n.
// Učitava se rano u <head>: <script src="../../shared/gameroom-i18n.js"></script>
//
// Jezik: ?lang=en|sr u URL-u > izbor sačuvan u localStorage ('gameroom:lang', zajednički za sajt) > jezik browsera
// (sr/hr/bs/cnr/sh -> sr, sve ostalo -> en). Podrazumevano engleski.
//
//   const I = GameroomI18n;
//   I.add({ en: { play: 'Play', coins: ({ n }) => `${n} coins` }, sr: { play: 'Igraj', coins: ({ n }) => `${n} ${I.plural(n, 'novčić', 'novčića', 'novčića')}` } });
//   I.t('play'); I.t('coins', { n: 3 }); I.t('hello', { name: 'Ana' })  // 'Hi, {name}!' -> 'Hi, Ana!'
//   <span data-i18n="play"></span>, <b data-i18n-html="rich"></b>, <input data-i18n-attr="placeholder:search;aria-label:search">
//   I.apply()                 // popuni data-i18n* elemente (posle add-a, ili posle dinamičkog HTML-a: I.apply(el))
//   el.appendChild(I.picker()) // EN / SR dugmad za meni podešavanja; izbor se pamti i stranica se ponovo učita
(function () {
  const KEY = 'gameroom:lang';
  const SUPPORTED = ['en', 'sr'];
  const NAMES = { en: 'English', sr: 'Srpski' };

  function detect() {
    try {
      const q = new URLSearchParams(location.search).get('lang');
      if (SUPPORTED.includes(q)) return q;
    } catch (e) {}
    try {
      const s = localStorage.getItem(KEY);
      if (SUPPORTED.includes(s)) return s;
    } catch (e) {}
    const list = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''])
      .map(x => String(x).toLowerCase());
    for (const l of list) {
      if (/^(sr|hr|bs|sh|cnr)(-|$)/.test(l)) return 'sr';
      if (/^en(-|$)/.test(l)) return 'en';
    }
    return 'en';
  }

  const dicts = { en: {}, sr: {} };
  const listeners = [];
  let lang = detect();
  document.documentElement.lang = lang;

  function fill(s, vars) {
    if (typeof s === 'function') return s(vars || {});
    if (vars && typeof s === 'string') return s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
    return s;
  }

  const I = {
    get lang() { return lang; },
    languages: SUPPORTED.slice(),
    names: NAMES,
    add(d) { for (const l of Object.keys(d)) Object.assign(dicts[l] || (dicts[l] = {}), d[l]); return I; },
    has(key) { return key in dicts[lang] || key in dicts.en; },
    t(key, vars) {
      const s = key in dicts[lang] ? dicts[lang][key] : key in dicts.en ? dicts.en[key] : key;
      return fill(s, vars);
    },
    // srpska množina: 1 igra, 2–4 igre, 5+ igara (11–14 uvek "many")
    plural(n, one, few, many) {
      const a = Math.abs(n) % 100, b = a % 10;
      if (b === 1 && a !== 11) return one;
      if (b >= 2 && b <= 4 && (a < 12 || a > 14)) return few;
      return many;
    },
    apply(root) {
      const r = root || document;
      r.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = I.t(el.getAttribute('data-i18n')); });
      r.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = I.t(el.getAttribute('data-i18n-html')); });
      r.querySelectorAll('[data-i18n-attr]').forEach(el => {
        for (const pair of el.getAttribute('data-i18n-attr').split(';')) {
          const [attr, key] = pair.split(':').map(x => x && x.trim());
          if (attr && key) el.setAttribute(attr, I.t(key));
        }
      });
      return I;
    },
    onChange(fn) { listeners.push(fn); },
    // reload: true (podrazumevano) ponovo učitava stranicu, najsigurnije za igre sa mnogo dinamičkog UI-ja
    set(l, opts) {
      if (!SUPPORTED.includes(l) || l === lang) return;
      try { localStorage.setItem(KEY, l); } catch (e) {}
      if (!opts || opts.reload !== false) {
        const u = new URL(location.href);
        if (u.searchParams.has('lang')) { u.searchParams.set('lang', l); location.replace(u.href); } else location.reload();
        return;
      }
      lang = l;
      document.documentElement.lang = l;
      I.apply();
      listeners.forEach(fn => { try { fn(l); } catch (e) {} });
    },
    // segmentirani izbor jezika; className i stil prepušteni igri (osnovni stil je ugrađen da radi i bez CSS-a)
    picker(opts) {
      const wrap = document.createElement('div');
      wrap.className = (opts && opts.className) || 'gr-lang';
      wrap.setAttribute('role', 'group');
      wrap.setAttribute('aria-label', 'Language / Jezik');
      wrap.style.cssText = 'display:inline-flex;gap:4px;padding:4px;border-radius:999px;background:rgba(127,127,127,.18);';
      for (const l of SUPPORTED) {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = l.toUpperCase();
        b.title = NAMES[l];
        b.setAttribute('aria-pressed', String(l === lang));
        b.style.cssText = 'font:inherit;font-weight:800;font-size:13px;letter-spacing:.5px;border:0;cursor:pointer;padding:6px 12px;border-radius:999px;'
          + (l === lang ? 'background:#fff;color:#111;' : 'background:transparent;color:inherit;');
        b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); I.set(l, opts); });
        wrap.appendChild(b);
      }
      return wrap;
    },
  };
  window.GameroomI18n = I;
})();
