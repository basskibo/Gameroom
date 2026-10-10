// Tiny procedural background music for Gameroom games (plain ES module, no assets).
// Plays on the "music" bus of shared/gameroom-audio.js, so the master mute and the compressor apply to it.
//
//   import { createMusic, SONGS } from '../../shared/gameroom-music.js';
//   const music = createMusic(audioBus, SONGS.shanty, { storageKey: 'my-game:music' });
//   music.play() after audioBus.ensure() (inside a user gesture), music.stop() on pause, music.toggle() from settings.
//
// A song is { bpm, chords: [[root midi, 'm'|''], ...] (one chord per bar), bass, arp, drums, lead? }.
// Everything is scheduled a little ahead with the audio clock, so timing does not depend on the frame rate.

const NOTE = m => 440 * Math.pow(2, (m - 69) / 12);

export const SONGS = {
  // A minor sea shanty: Am F C G, bouncy bass, plucked arpeggio, kick + hat
  shanty: { bpm: 126, chords: [[57, 'm'], [53, ''], [48, ''], [55, '']], bass: [0, 7, 0, 7], arp: [0, 3, 7, 12, 7, 3, 7, 12], drums: 'kick-hat', lead: [12, 0, 15, 14, 12, 0, 10, 7] },
  // calm camp tune: C G Am F, soft
  camp: { bpm: 96, chords: [[48, ''], [55, ''], [57, 'm'], [53, '']], bass: [0, 0, 7, 0], arp: [0, 4, 7, 4, 12, 7, 4, 7], drums: 'soft' },
  // march for the castle siege: D minor, steady
  march: { bpm: 112, chords: [[50, 'm'], [46, ''], [48, ''], [45, '']], bass: [0, 0, 7, 0], arp: [0, 7, 12, 7, 3, 7, 12, 15], drums: 'march' },
};

export function createMusic(bus, song, { storageKey = '', volume = 0.55 } = {}) {
  let on = true, playing = false, timer = 0, step = 0, nextT = 0;
  try { if (storageKey && localStorage.getItem(storageKey) === 'off') on = false; } catch (e) {}
  const spb = 60 / song.bpm / 2; // seconds per eighth note
  const third = c => (c[1] === 'm' ? 3 : 4);

  function schedule() {
    const ctx = bus.ctx;
    if (!ctx || !playing) return;
    while (nextT < ctx.currentTime + 0.25) {
      const delay = Math.max(0, nextT - ctx.currentTime);
      const bar = Math.floor(step / 8) % song.chords.length, e = step % 8;
      const chord = song.chords[bar], root = chord[0];
      const v = volume;
      // bass on quarter notes
      if (e % 2 === 0) bus.tone({ f: NOTE(root - 12 + song.bass[(e / 2) | 0]), d: spb * 1.7, type: 'triangle', v: 0.09 * v, delay, bus: 'music' });
      // arpeggio: chord tones mapped from the pattern (3 = third of this chord)
      const a = song.arp[e], semi = a === 3 || a === 15 ? a - 3 + third(chord) : a === 4 ? third(chord) : a;
      bus.tone({ f: NOTE(root + 12 + semi), d: spb * 0.9, type: 'square', v: 0.018 * v, delay, bus: 'music' });
      // a simple lead every other bar
      if (song.lead && bar % 2 === 1 && e % 2 === 0) {
        const l = song.lead[e], s2 = l === 15 ? 12 + third(chord) : l;
        bus.tone({ f: NOTE(root + 12 + s2), d: spb * 1.6, type: 'triangle', v: 0.035 * v, delay, bus: 'music' });
      }
      // drums
      if (song.drums === 'kick-hat') {
        if (e === 0 || e === 4) bus.tone({ f: 130, f2: 42, d: 0.16, type: 'sine', v: 0.16 * v, delay, bus: 'music' });
        if (e % 2 === 1) bus.noise({ d: 0.04, v: 0.025 * v, f: 9000, f2: 7000, delay, bus: 'music' });
      } else if (song.drums === 'march') {
        if (e % 2 === 0) bus.tone({ f: 110, f2: 40, d: 0.14, type: 'sine', v: 0.13 * v, delay, bus: 'music' });
        if (e === 6 || e === 7) bus.noise({ d: 0.07, v: 0.04 * v, f: 3000, f2: 1200, delay, bus: 'music' });
      } else if (e === 0) {
        bus.tone({ f: 90, f2: 40, d: 0.2, type: 'sine', v: 0.08 * v, delay, bus: 'music' });
      }
      nextT += spb;
      step++;
    }
  }

  const music = {
    get on() { return on; },
    get playing() { return playing; },
    play() {
      if (!on || playing || !bus.ctx) return;
      playing = true;
      nextT = bus.ctx.currentTime + 0.1;
      clearInterval(timer);
      timer = setInterval(schedule, 90);
      schedule();
    },
    stop() { playing = false; clearInterval(timer); },
    toggle() {
      on = !on;
      try { if (storageKey) localStorage.setItem(storageKey, on ? 'on' : 'off'); } catch (e) {}
      if (!on) music.stop();
      return on;
    },
  };
  document.addEventListener('visibilitychange', () => { if (document.hidden) music.stop(); });
  return music;
}
