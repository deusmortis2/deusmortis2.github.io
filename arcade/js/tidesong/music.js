// Plays the songs and dances from tunes.js as retro chiptunes with the Web
// Audio API: a pulse-wave melody, a triangle bass, a quiet backing and
// soft noise drums, after a one-bar count-in. The rhythm game reads the
// audio clock through `clock`, so the falling notes stay in time with
// what you hear.
import { audioContext } from "../sound.js";

const steps = { A: 9, B: 11, C: 0, D: 2, E: 4, F: 5, G: 7 };
const qualities = { "": [0, 4, 7], 7: [0, 4, 7, 10], dim: [0, 3, 6], m: [0, 3, 7], m7: [0, 3, 7, 10] };

export function midiOf(name) {
  const [, letter, accidental, octave] = /^([A-G])([#b]?)(-?\d)$/.exec(name);
  const shift = { "": 0, "#": 1, b: -1 }[accidental];
  return 12 * (Number(octave) + 1) + steps[letter] + shift;
}

function frequency(midi) {
  return 440 * 2 ** ((midi - 69) / 12);
}

function tokens(text) {
  return text.split(/\s+/).filter((t) => {
    return t && t !== "|";
  });
}

// Root in octave 3 plus the chord's notes, as MIDI numbers.
function chordOf(name) {
  const [, root, quality] = /^([A-G][#b]?)(.*)$/.exec(name);
  const base = midiOf(`${root}3`);
  return { root: base, tones: qualities[quality].map((s) => base + s) };
}

// Turns a tune into notes and chords timed in beats.
export function compose(tune) {
  const unit = tune.unit ?? 1;
  const lead = [];
  let beat = 0;
  tokens(tune.lead).forEach((token) => {
    const [, name, length, mark] = /^([^:]+):([\d.]+)([~!]?)$/.exec(token);
    const beats = Number(length) * unit;
    if (name !== "r") {
      const tap = mark === "!" || (mark !== "~" && Number(length) >= (tune.tapMin ?? 0));
      lead.push({ beat, beats, midi: midiOf(name), tap });
    }
    beat += beats;
  });
  const chords = [];
  let at = 0;
  tokens(tune.chords).forEach((token) => {
    const [name, length] = token.split(":");
    const beats = length ? Number(length) : tune.meter;
    chords.push({ beat: at, beats, ...chordOf(name) });
    at += beats;
  });
  return { beats: Math.max(beat, at), chords, lead };
}

// A pulse wave, the classic thin, buzzy 8-bit tone. `duty` is how much of
// each cycle is high (0.5 is a plain square).
const pulseWaves = new Map();
function pulse(ctx, duty) {
  if (!pulseWaves.has(duty)) {
    const size = 32;
    const real = new Float32Array(size);
    const imag = new Float32Array(size);
    for (let n = 1; n < size; n += 1) real[n] = Math.sin(n * Math.PI * duty) / n;
    pulseWaves.set(duty, ctx.createPeriodicWave(real, imag));
  }
  return pulseWaves.get(duty);
}

let noiseBuffer = null;
function noise(ctx) {
  if (!noiseBuffer) {
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

// One note. `wave` is "triangle" or a pulse duty. Long lead notes get a
// gentle vibrato, like a singer holding a note.
function tone(out, { at, duty, length, midi, vibrato = false, volume, wave = "pulse" }) {
  const ctx = out.context;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  if (wave === "triangle") osc.type = "triangle";
  else osc.setPeriodicWave(pulse(ctx, duty));
  osc.frequency.value = frequency(midi);
  const release = Math.min(0.12, length * 0.4);
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(volume, at + 0.012);
  gain.gain.linearRampToValueAtTime(volume * 0.65, at + 0.012 + Math.min(0.15, length * 0.3));
  gain.gain.setValueAtTime(volume * 0.65, at + length - release);
  gain.gain.linearRampToValueAtTime(0, at + length);
  if (vibrato && length > 0.6) {
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.frequency.value = 5.5;
    depth.gain.setValueAtTime(0, at);
    depth.gain.linearRampToValueAtTime(12, at + length);
    lfo.connect(depth).connect(osc.detune);
    lfo.start(at + 0.25);
    lfo.stop(at + length);
  }
  osc.connect(gain).connect(out);
  osc.start(at);
  osc.stop(at + length + 0.02);
}

// A soft drum: filtered noise. High for ticks and hats, low for thumps.
function drum(out, { at, high = true, volume }) {
  const ctx = out.context;
  const src = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  src.buffer = noise(ctx);
  filter.type = high ? "highpass" : "lowpass";
  filter.frequency.value = high ? 6000 : 400;
  const length = high ? 0.05 : 0.22;
  gain.gain.setValueAtTime(volume, at);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
  src.connect(filter).connect(gain).connect(out);
  src.start(at, Math.random() * 0.5);
  src.stop(at + length + 0.02);
}

const bassVolume = 0.16;
const backVolume = 0.035;
const drumVolume = 0.05;

// Each style fills one chord with backing, beat by beat. `play(beat,
// beats, midi, volume)` adds a backing note and `hit(beat, high, volume)`
// a drum, both in beats from the start of the song.
const styles = {
  chant(chord, { hit, meter, play }) {
    eachBeat(chord, 1, (b) => {
      const strong = b % meter === 0 || b % meter === 2;
      play(b, 0.9, chord.root - 12, bassVolume, "triangle");
      play(b + 0.5, 0.3, chord.tones[1] + 12, backVolume);
      hit(b, !strong, strong ? drumVolume * 1.6 : drumVolume);
    });
  },
  dirge(chord, { hit, play }) {
    play(chord.beat, chord.beats, chord.root - 12, bassVolume, "triangle");
    chord.tones.forEach((m) => play(chord.beat, chord.beats, m + 12, backVolume * 0.6, "triangle"));
    hit(chord.beat, false, drumVolume * 1.5);
  },
  echo(chord, { play }) {
    play(chord.beat, chord.beats, chord.root - 12, bassVolume, "triangle");
    chord.tones.forEach((m) => play(chord.beat, chord.beats, m + 12, backVolume * 0.7, "triangle"));
  },
  hum(chord, { play }) {
    play(chord.beat, chord.beats, chord.root - 12, bassVolume * 0.8, "triangle");
    eachBeat(chord, 1, (b, i) => play(b, 0.9, chord.tones[i % 3] + 12, backVolume));
  },
  jig(chord, { hit, play }) {
    eachBeat(chord, 1, (b, i) => {
      play(b, 0.6, i % 2 ? chord.root - 5 : chord.root - 12, bassVolume, "triangle");
      play(b + 1 / 3, 0.2, chord.tones[1] + 12, backVolume);
      play(b + 2 / 3, 0.2, chord.tones[2] + 12, backVolume);
      hit(b, true, drumVolume);
    });
  },
  lullaby(chord, { play }) {
    play(chord.beat, chord.beats, chord.root - 12, bassVolume * 0.8, "triangle");
    eachBeat(chord, 1, (b, i) => play(b, 0.8, chord.tones[i % 3] + 12, backVolume));
  },
  reel(chord, { hit, meter, play }) {
    eachBeat(chord, 0.5, (b, i) => {
      play(b, 0.4, i % 2 ? chord.root : chord.root - 12, bassVolume * 0.8, "triangle");
      if (i % 2) play(b, 0.25, chord.tones[1] + 12, backVolume);
      if (b % meter === 1 || b % meter === 3) hit(b, true, drumVolume * 1.3);
    });
  },
  waltz(chord, { play }) {
    eachBeat(chord, 1, (b, i) => {
      if (i === 0) {
        play(b, 0.9, chord.root - 12, bassVolume, "triangle");
        return;
      }
      chord.tones.slice(0, 3).forEach((m) => play(b, 0.35, m + 12, backVolume * 0.7));
    });
  },
};

function eachBeat(chord, step, fn) {
  for (let i = 0; i * step < chord.beats - 1e-6; i += 1) fn(chord.beat + i * step, i);
}

// Starts a tune so that its first beat lands `leadIn` seconds from now,
// after a count-in. Returns { clock, stop }, or null when sound is off.
// `clock(ms)` turns a performance.now() time into seconds since the call,
// as heard through the speakers.
export function playTune(tune, piece, secondsPerBeat, leadIn) {
  const ctx = audioContext();
  if (!ctx) return null;
  try {
    const zero = ctx.currentTime;
    const first = zero + leadIn;
    const out = ctx.createGain();
    out.gain.value = 0.9;
    out.connect(ctx.destination);
    const at = (beat) => first + beat * secondsPerBeat;
    // The count-in: a tick on every beat before the song starts.
    for (let b = -tune.meter; b < 0; b += 1) {
      if (at(b) >= zero) drum(out, { at: at(b), high: true, volume: b === -tune.meter ? drumVolume * 1.8 : drumVolume });
    }
    piece.lead.forEach((n) => {
      const length = n.beats * secondsPerBeat * 0.92;
      tone(out, { at: at(n.beat), duty: 0.25, length, midi: n.midi, vibrato: true, volume: 0.1 });
      // The Whalesong's answer rings out like an echo.
      if (tune.style === "echo") {
        tone(out, { at: at(n.beat + 0.75), duty: 0.125, length, midi: n.midi, volume: 0.03 });
      }
    });
    const backing = {
      hit: (beat, high, volume) => drum(out, { at: at(beat), high, volume }),
      meter: tune.meter,
      play: (beat, beats, midi, volume, wave = "pulse") => {
        tone(out, { at: at(beat), duty: 0.125, length: beats * secondsPerBeat, midi, volume, wave });
      },
    };
    piece.chords.forEach((chord) => styles[tune.style](chord, backing));
    const startMs = performance.now();
    return {
      // While the browser holds the audio back, nothing is heard, so the
      // notes fall by the wall clock instead of waiting forever.
      clock: (ms) => {
        if (ctx.state !== "running") return (ms - startMs) / 1000;
        return heard(ctx, ms) - zero;
      },
      stop: () => {
        out.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
        setTimeout(() => out.disconnect(), 400);
      },
    };
  } catch {
    return null;
  }
}

// The audio-clock time being heard at performance.now() time `ms`, allowing
// for the speakers' delay.
function heard(ctx, ms) {
  const stamp = ctx.getOutputTimestamp?.();
  if (stamp?.performanceTime) {
    return stamp.contextTime + (ms - stamp.performanceTime) / 1000;
  }
  const delay = ctx.outputLatency || ctx.baseLatency || 0;
  return ctx.currentTime - delay + (ms - performance.now()) / 1000;
}
