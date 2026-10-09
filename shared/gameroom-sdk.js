/* Gameroom SDK — the only layer games talk to for ads and analytics (see MONETIZATION.md).
   Plain script (no modules, no build). Games call window.Gameroom and never a portal SDK directly.

     <script src="../../shared/gameroom-sdk.js"></script>
     Gameroom.init({ game: 'pilana-tajkun', version: '1.0', kids: false })
     Gameroom.gameplayStart() / gameplayStop()          — real play starts / stops (pause, menus, ads)
     Gameroom.rewardedAvailable(placement) → boolean    — show the "watch an ad for …" button only when true
     Gameroom.showRewarded(placement) → Promise<bool>   — true = the player watched it, give the reward
     Gameroom.showMidgame(placement) → Promise<bool>    — full-screen ad, only at a natural pause; capped here
     Gameroom.track(event, props)                       — analytics
     Gameroom.on('adStart' | 'adEnd', fn)               — mute audio and hold the game while an ad runs

   Adapter: ?ads=<name> wins; then the Android/iOS app (Capacitor) → admob; crazygames / poki by host;
   otherwise "none" (no ads, nothing breaks). ?ads=test shows a fake ad, for checking the flow in a browser.
   A game must work the same with every adapter, including when an ad fails or is blocked. */
(function () {
  if (window.Gameroom && window.Gameroom.__ready) return;

  var qs = new URLSearchParams(location.search);
  var CFG = Object.assign({
    // analytics sink: { posthog: { host: 'https://eu.i.posthog.com', key: 'phc_…' } }; empty = nothing is sent
    analytics: {},
    // AdMob ad unit ids. These are Google's public TEST ids — real ones go in mobile/gameroom-config.js
    admob: {
      rewarded: 'ca-app-pub-3940256099942544/5224354917',
      interstitial: 'ca-app-pub-3940256099942544/1033173712',
      testing: true,
    },
    midgameGap: 240,   // seconds between two full-screen ads
    midgameGrace: 180, // no full-screen ad in the first minutes of a session
  }, window.GAMEROOM_CONFIG || {});

  var state = { game: 'unknown', version: '', kids: false, playing: false, t0: Date.now(), lastMidgame: 0, inAd: false };
  var listeners = { adStart: [], adEnd: [] };
  var events = [];
  function emit(name) { (listeners[name] || []).forEach(function (fn) { try { fn(); } catch (e) {} }); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function loadScript(src) {
    return new Promise(function (ok, fail) {
      var s = document.createElement('script'); s.src = src; s.async = true;
      s.onload = ok; s.onerror = fail; document.head.appendChild(s);
    });
  }
  function timeout(p, ms, fallback) {
    return Promise.race([p, new Promise(function (r) { setTimeout(function () { r(fallback); }, ms); })]);
  }

  // ---------------------------------------------------------------- adapters
  var none = {
    name: 'none',
    init: function () { return Promise.resolve(); },
    start: function () {}, stop: function () {},
    rewardedReady: function () { return false; },
    rewarded: function () { return Promise.resolve(false); },
    midgame: function () { return Promise.resolve(false); },
  };

  // a fake ad overlay: rewarded pays out after 3 s, closing early pays nothing
  var test = {
    name: 'test',
    init: function () { return Promise.resolve(); },
    start: function () {}, stop: function () {},
    rewardedReady: function () { return true; },
    rewarded: function () { return fakeAd('Rewarded ad (test)', 3); },
    midgame: function () { return fakeAd('Ad break (test)', 2).then(function () { return true; }); },
  };
  function fakeAd(title, secs) {
    return new Promise(function (resolve) {
      var o = document.createElement('div');
      o.id = 'gameroomFakeAd';
      o.setAttribute('style', 'position:fixed;inset:0;z-index:99999;background:#000d;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;font:700 22px system-ui;gap:14px');
      var t = document.createElement('div'), c = document.createElement('button');
      c.textContent = '✕ Close'; c.setAttribute('style', 'font:700 16px system-ui;padding:8px 16px;border-radius:10px;border:0;cursor:pointer');
      o.appendChild(t); o.appendChild(c); document.body.appendChild(o);
      var left = secs, done = false;
      function tick() { t.textContent = title + (left > 0 ? ' · ' + left : ' · done'); }
      tick();
      var iv = setInterval(function () { left--; tick(); if (left <= 0) clearInterval(iv); }, 1000);
      c.onclick = function () { if (done) return; done = true; clearInterval(iv); o.remove(); resolve(left <= 0); };
    });
  }

  // Android / iOS app: @capacitor-community/admob through the Capacitor bridge
  var admob = {
    name: 'admob',
    ready: false, loading: null,
    plugin: function () { return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob; },
    init: function () {
      var A = this.plugin(), self = this;
      if (!A) return Promise.resolve();
      return A.initialize({ initializeForTesting: !!CFG.admob.testing, tagForChildDirectedTreatment: state.kids, tagForUnderAgeOfConsent: state.kids })
        .then(function () { // EU consent form (Google UMP) when it is required; never for kids' games (no personalised ads)
          if (state.kids || !A.requestConsentInfo) return;
          return A.requestConsentInfo().then(function (info) {
            if (info && info.isConsentFormAvailable && info.status === 'REQUIRED') return A.showConsentForm();
          });
        })
        .catch(function () {})
        .then(function () { self.preload(); });
    },
    preload: function () {
      var A = this.plugin(), self = this;
      if (!A || this.ready || this.loading) return;
      this.loading = A.prepareRewardVideoAd({ adId: CFG.admob.rewarded, isTesting: !!CFG.admob.testing, npa: state.kids })
        .then(function () { self.ready = true; })
        .catch(function () { self.ready = false; setTimeout(function () { self.preload(); }, 30000); })
        .then(function () { self.loading = null; });
    },
    start: function () {}, stop: function () {},
    rewardedReady: function () { return this.ready; },
    rewarded: function () {
      var A = this.plugin(), self = this;
      if (!A || !this.ready) return Promise.resolve(false);
      this.ready = false;
      return new Promise(function (resolve) {
        var paid = false, subs = [], over = false;
        function done() { if (over) return; over = true; subs.forEach(function (h) { h.then ? h.then(function (x) { x.remove(); }) : h.remove && h.remove(); }); resolve(paid); self.preload(); }
        subs.push(A.addListener('onRewardedVideoAdReward', function () { paid = true; }));
        subs.push(A.addListener('onRewardedVideoAdDismissed', done));
        subs.push(A.addListener('onRewardedVideoAdFailedToShow', done));
        A.showRewardVideoAd().then(function (item) { if (item) paid = true; }).catch(done);
      });
    },
    midgame: function () {
      var A = this.plugin();
      if (!A) return Promise.resolve(false);
      return A.prepareInterstitial({ adId: CFG.admob.interstitial, isTesting: !!CFG.admob.testing, npa: state.kids })
        .then(function () { return A.showInterstitial(); })
        .then(function () { return true; }, function () { return false; });
    },
  };

  // CrazyGames SDK v3 (loaded only on their site or with ?ads=crazygames)
  var crazygames = {
    name: 'crazygames',
    sdk: null,
    init: function () {
      var self = this;
      return loadScript('https://sdk.crazygames.com/crazygames-sdk-v3.js')
        .then(function () { self.sdk = window.CrazyGames && window.CrazyGames.SDK; return self.sdk && self.sdk.init(); })
        .catch(function () { self.sdk = null; });
    },
    start: function () { try { this.sdk && this.sdk.game.gameplayStart(); } catch (e) {} },
    stop: function () { try { this.sdk && this.sdk.game.gameplayStop(); } catch (e) {} },
    rewardedReady: function () { return !!this.sdk; },
    ad: function (kind) {
      var sdk = this.sdk;
      if (!sdk) return Promise.resolve(false);
      return new Promise(function (resolve) {
        try {
          sdk.ad.requestAd(kind, {
            adFinished: function () { resolve(true); },
            adError: function () { resolve(false); },
          });
        } catch (e) { resolve(false); }
      });
    },
    rewarded: function () { return this.ad('rewarded'); },
    midgame: function () { return this.ad('midgame'); },
  };

  // Poki SDK v2 (loaded only on their site or with ?ads=poki)
  var poki = {
    name: 'poki',
    sdk: null,
    init: function () {
      var self = this;
      return loadScript('https://game-cdn.poki.com/scripts/v2/poki-sdk.js')
        .then(function () { self.sdk = window.PokiSDK; return self.sdk && self.sdk.init(); })
        .then(function () { self.sdk && self.sdk.gameLoadingFinished(); })
        .catch(function () { self.sdk = null; });
    },
    start: function () { try { this.sdk && this.sdk.gameplayStart(); } catch (e) {} },
    stop: function () { try { this.sdk && this.sdk.gameplayStop(); } catch (e) {} },
    rewardedReady: function () { return !!this.sdk; },
    rewarded: function () { return this.sdk ? this.sdk.rewardedBreak().then(function (ok) { return !!ok; }, function () { return false; }) : Promise.resolve(false); },
    midgame: function () { return this.sdk ? this.sdk.commercialBreak().then(function () { return true; }, function () { return false; }) : Promise.resolve(false); },
  };

  var ADAPTERS = { none: none, test: test, admob: admob, crazygames: crazygames, poki: poki };
  function pickAdapter() {
    var forced = qs.get('ads');
    if (forced && ADAPTERS[forced]) return ADAPTERS[forced];
    if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) return admob;
    var h = location.hostname;
    if (/crazygames\./.test(h)) return crazygames;
    if (/poki\.(com|io)|poki-gdn\./.test(h)) return poki;
    return none;
  }
  var ad = pickAdapter();

  // ---------------------------------------------------------------- analytics
  function platform() {
    if (window.Capacitor && window.Capacitor.getPlatform) { var p = window.Capacitor.getPlatform(); if (p !== 'web') return p; }
    return ad.name === 'none' || ad.name === 'test' ? 'web' : ad.name;
  }
  function anonId() { // random, no personal data; kids' games keep it for the session only
    var k = 'gameroom:anon', id = state.kids ? null : store(k);
    if (!id) { id = (Date.now().toString(36) + Math.random().toString(36).slice(2, 10)); if (!state.kids) store(k, id); }
    return id;
  }
  var queue = [], flushTimer = 0, distinct = null, session = Math.random().toString(36).slice(2, 10);
  function send(beacon) {
    var ph = CFG.analytics && CFG.analytics.posthog;
    if (!ph || !ph.key || !queue.length) { queue.length = 0; return; }
    var body = JSON.stringify({ api_key: ph.key, batch: queue.splice(0) });
    var url = (ph.host || 'https://eu.i.posthog.com') + '/batch/';
    try {
      if (beacon && navigator.sendBeacon) navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
      else fetch(url, { method: 'POST', body: body, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(function () {});
    } catch (e) {}
  }
  function track(event, props) {
    var p = Object.assign({ game: state.game, version: state.version, platform: platform(), ads: ad.name, session: session }, props || {});
    events.push({ event: event, props: p, t: Date.now() });
    if (events.length > 100) events.shift();
    if (qs.has('debug')) try { console.debug('[gameroom]', event, p); } catch (e) {}
    try { if (window.plausible) window.plausible(event, { props: p }); } catch (e) {}
    if (CFG.analytics && CFG.analytics.posthog && CFG.analytics.posthog.key) {
      queue.push({ event: event, distinct_id: distinct || (distinct = anonId()), properties: p, timestamp: new Date().toISOString() });
      clearTimeout(flushTimer); flushTimer = setTimeout(function () { send(false); }, 4000);
    }
  }

  // ---------------------------------------------------------------- public API
  var inited = null;
  window.Gameroom = {
    __ready: true,
    get adapter() { return ad.name; },
    get events() { return events.slice(); },
    init: function (opts) {
      if (inited) return inited;
      opts = opts || {};
      state.game = opts.game || state.game; state.version = opts.version || ''; state.kids = !!opts.kids;
      // D1 return: the last visit was yesterday (local calendar day)
      var dayKey = 'gameroom:lastDay:' + state.game, today = new Date(), last = store(dayKey);
      var ymd = function (d) { return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
      var y = new Date(today.getTime() - 864e5);
      if (last && last === ymd(y)) track('return_d1');
      store(dayKey, ymd(today));
      addEventListener('pagehide', function () {
        track('session_end', { seconds: Math.round((Date.now() - state.t0) / 1000) });
        send(true);
      });
      inited = timeout(ad.init().catch(function () {}), 8000).then(function () { track('sdk_ready'); });
      return inited;
    },
    gameplayStart: function () { if (state.playing || state.inAd) return; state.playing = true; try { ad.start(); } catch (e) {} },
    gameplayStop: function () { if (!state.playing) return; state.playing = false; try { ad.stop(); } catch (e) {} },
    rewardedAvailable: function () { try { return !!ad.rewardedReady(); } catch (e) { return false; } },
    showRewarded: function (placement) {
      if (state.inAd) return Promise.resolve(false);
      var was = state.playing;
      state.inAd = true; this.gameplayStop(); emit('adStart');
      return timeout(Promise.resolve().then(function () { return ad.rewarded(placement); }).catch(function () { return false; }), 120000, false)
        .then(function (ok) {
          state.inAd = false; emit('adEnd');
          if (was) window.Gameroom.gameplayStart();
          return !!ok;
        });
    },
    showMidgame: function (placement) {
      var now = Date.now();
      if (state.inAd || state.kids && ad.name === 'admob' && CFG.noKidsMidgame) return Promise.resolve(false);
      if ((now - state.t0) / 1000 < CFG.midgameGrace || (now - state.lastMidgame) / 1000 < CFG.midgameGap) return Promise.resolve(false);
      state.lastMidgame = now;
      var was = state.playing;
      state.inAd = true; this.gameplayStop(); emit('adStart');
      return timeout(Promise.resolve().then(function () { return ad.midgame(placement); }).catch(function () { return false; }), 60000, false)
        .then(function (ok) {
          state.inAd = false; emit('adEnd');
          if (ok) track('midgame_shown', { placement: placement || '' });
          if (was) window.Gameroom.gameplayStart();
          return !!ok;
        });
    },
    track: track,
    on: function (name, fn) { (listeners[name] = listeners[name] || []).push(fn); },
  };
})();
