// Shared Web Audio bus for Gameroom games (plain ES module, no dependencies).
// master → compressor → speakers, with three buses: sfx, music, ambience. Nothing plays until
// ensure() runs inside a user gesture (mobile browsers keep audio locked until then).
//
//   import { createAudioBus } from '../../shared/gameroom-audio.js';
//   const bus = createAudioBus({ storageKey: 'my-game:audio' });
//   button.onclick = () => bus.ensure();
//   bus.tone({ f: 440, d: 0.1 })  — a short synth blip on the sfx bus
//   bus.noise({ d: 0.5, f: 900, v: 0.2 })  — a filtered noise burst (explosions, splashes, impacts)
//   bus.ambience({ wind: 0.5, birds: 0.6 })  /  bus.ambienceOn(false) on pause  /  bus.toggleMute()
export function createAudioBus({ storageKey = '' } = {}) {
  let ctx = null, master, comp, buses = {}, windSrc = null, windGain = null, birdTimer = 0;
  const state = { muted: false, ambienceOn: true, amb: null };
  try { state.muted = storageKey && localStorage.getItem(storageKey) === 'muted'; } catch (e) {}

  function ensure() {
    try {
      if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
        master = ctx.createGain();
        master.gain.value = state.muted ? 0 : 0.9;
        master.connect(comp).connect(ctx.destination);
        for (const [name, v] of [['sfx', 1], ['music', 0.5], ['ambience', 0.6]]) {
          const g = ctx.createGain(); g.gain.value = v; g.connect(master); buses[name] = g;
        }
        if (state.amb) startAmbience();
      }
      if (ctx.state === 'suspended') ctx.resume();
    } catch (e) {}
    return ctx;
  }

  /** Short synth note on a bus. f2 = glide target, pan -1..1. */
  function tone({ f, d = 0.1, type = 'square', v = 0.05, f2 = null, delay = 0, pan = 0, bus = 'sfx' }) {
    if (!ctx || state.muted || v <= 0.001) return;
    const t = ctx.currentTime + delay, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + Math.min(0.01, d / 4));
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    let out = g;
    if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); g.connect(p); out = p; }
    o.connect(g); out.connect(buses[bus] || buses.sfx);
    o.start(t); o.stop(t + d + 0.03);
  }

  /** Filtered white-noise burst: f = low-pass start, f2 = where it sweeps to (booms fall, whooshes rise). */
  let noiseBuf = null;
  function noise({ d = 0.4, v = 0.15, f = 1200, f2 = 120, q = 0.7, delay = 0, pan = 0, bus = 'sfx' }) {
    if (!ctx || state.muted || v <= 0.001) return;
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    const t = ctx.currentTime + delay, src = ctx.createBufferSource(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noiseBuf;
    lp.type = 'lowpass'; lp.Q.value = q;
    lp.frequency.setValueAtTime(f, t); lp.frequency.exponentialRampToValueAtTime(Math.max(30, f2), t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    let out = g;
    if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); g.connect(p); out = p; }
    src.connect(lp).connect(g); out.connect(buses[bus] || buses.sfx);
    src.start(t, Math.random() * 1.5); src.stop(t + d + 0.05);
  }

  /** Soft looping wind plus occasional bird chirps. Levels 0..1. */
  function ambience(opts) { state.amb = { wind: 0.5, birds: 0.5, ...opts }; if (ctx) startAmbience(); }
  function startAmbience() {
    if (!ctx || windSrc || !state.amb) return;
    const len = ctx.sampleRate * 4, buf = ctx.createBuffer(1, len, ctx.sampleRate), data = buf.getChannelData(0);
    let b = 0;
    for (let i = 0; i < len; i++) { b = 0.985 * b + 0.015 * (Math.random() * 2 - 1); data[i] = b * 6; } // brown-ish noise
    windSrc = ctx.createBufferSource(); windSrc.buffer = buf; windSrc.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520;
    windGain = ctx.createGain(); windGain.gain.value = 0.05 * state.amb.wind;
    const lfo = ctx.createOscillator(), lfoGain = ctx.createGain();
    lfo.frequency.value = 0.07; lfoGain.gain.value = 0.025 * state.amb.wind;
    lfo.connect(lfoGain).connect(windGain.gain);
    windSrc.connect(lp).connect(windGain).connect(buses.ambience);
    windSrc.start(); lfo.start();
    scheduleBird();
  }
  function scheduleBird() {
    clearTimeout(birdTimer);
    birdTimer = setTimeout(() => {
      if (ctx && state.ambienceOn && !state.muted && !document.hidden && state.amb.birds > 0) {
        const base = 2200 + Math.random() * 1600, n = 2 + (Math.random() * 3 | 0), pan = Math.random() * 1.6 - 0.8;
        for (let i = 0; i < n; i++) tone({ f: base, f2: base * (1.15 + Math.random() * 0.3), d: 0.07, type: 'sine', v: 0.018 * state.amb.birds, delay: i * 0.11, pan, bus: 'ambience' });
      }
      scheduleBird();
    }, 2500 + Math.random() * 6000);
  }
  function ambienceOn(on) {
    state.ambienceOn = on;
    if (windGain && ctx) windGain.gain.setTargetAtTime(on ? 0.05 * state.amb.wind : 0, ctx.currentTime, 0.4);
  }
  function setMuted(m) {
    state.muted = m;
    if (master && ctx) master.gain.setTargetAtTime(m ? 0 : 0.9, ctx.currentTime, 0.05);
    try { if (storageKey) localStorage.setItem(storageKey, m ? 'muted' : 'on'); } catch (e) {}
    return m;
  }
  return {
    ensure, tone, noise, ambience, ambienceOn, setMuted,
    toggleMute: () => setMuted(!state.muted),
    get muted() { return state.muted; },
    get ctx() { return ctx; },
  };
}

/** Short haptic tick on phones that support it; silent elsewhere. */
export function haptic(ms = 12) {
  try { if (navigator.vibrate && matchMedia('(pointer: coarse)').matches) navigator.vibrate(ms); } catch (e) {}
}
