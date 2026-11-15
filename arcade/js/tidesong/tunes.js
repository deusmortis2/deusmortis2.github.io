// The music for each song and dance: original little chiptunes, all slow
// enough to tap along to. music.js plays them and rhythm.js turns the
// tapped notes into the falling notes.
//
// `bpm` is beats per minute and `meter` is beats per bar. `lead` is the
// melody as note:length tokens, where the length is in `unit`s of a beat
// (an `r` is a rest, and `|` only marks bars for reading). A note is
// tapped when it lasts at least `tapMin` units. `~` after a note means
// never tap it, and `!` means always tap it. `chords` are one per bar, or
// chord:beats to split a bar. `style` picks the backing (see music.js).
export const tunes = {
  // Soft, rocking and sleepy, in F major.
  lullaby: {
    bpm: 72, meter: 3, style: "lullaby",
    chords: "F C Dm Bb F C Bb:2 C:1 F",
    lead: `A4:2 C5:1 | G4:2 E4:1 | F4:1 A4:1 D5:1 | D5:2 C5:1 |
      A4:2 F4:1 | G4:1 E4:1 C4:1 | Bb4:1 A4:1 G4:1 | F4:3`,
  },
  // A lilting jig, counted in two big beats a bar. Only the long notes
  // are tapped, so the taps swing long-short like a dance step.
  jig: {
    bpm: 46, meter: 2, style: "jig", tapMin: 2, unit: 1 / 3,
    chords: "G C G D G C D G",
    lead: `B4:2 G4:1 B4:2 D5:1 | E5:2 C5:1 G4:3 | B4:2 G4:1 D5:2 B4:1 |
      A4:2 F#4:1 D4:3 | B4:2 G4:1 B4:2 D5:1 | E5:2 G5:1 E5:2 C5:1 |
      D5:2 B4:1 A4:2 F#4:1 | G4:6`,
  },
  // Oom-pah-pah, turning round and round, in D major.
  waltz: {
    bpm: 80, meter: 3, style: "waltz",
    chords: "D Bm G A7 D Bm Em:2 A7:1 D",
    lead: `F#4:1 A4:1 D5:1 | D5:2 B4:1 | G4:1 B4:1 D5:1 | C#5:2 A4:1 |
      A4:1 D5:1 F#5:1 | F#5:2 D5:1 | E5:1 G5:1 C#5:1 | D5:3`,
  },
  // Quick little runs in A minor, but only the notes on the beat are
  // tapped.
  reel: {
    bpm: 84, meter: 4, style: "reel", tapMin: 2, unit: 1 / 2,
    chords: "Am G F E Am E:2 Am:2",
    lead: `A4:2 C5:1 E5:1 A5:2 E5:2 | G5:2 D5:1 B4:1 G4:2 B4:2 |
      F4:2 A4:1 C5:1 F5:2 E5:1 D5:1 | E5:2 B4:2 G#4:2 B4:2 |
      A4:2 C5:1 E5:1 A5:2 G5:1 F5:1 | E5:2 G#4:2 A4:4`,
  },
  // A slow climb up towards the light, in E flat major.
  hum: {
    bpm: 60, meter: 4, style: "hum",
    chords: "Eb Cm Ab:2 Bb:2 Eb",
    lead: "Eb4:1 G4:1 Bb4:2 | C5:1 Bb4:1 G4:2 | Ab4:1 C5:1 D5:1 F5:1 | G5:4",
  },
  // A call up high, then its answer from the deep, in D minor.
  echo: {
    bpm: 66, meter: 4, style: "echo",
    chords: "Dm Bb C Dm",
    lead: "D5:1 F5:1 A5:2 | D4:1 F4:1 A4:2 | G5:1 E5:1 C5:2 | G4:1 E4:1 D4:2",
  },
  // A steady, driving chant with a drum on every beat, in E minor.
  chant: {
    bpm: 80, meter: 4, style: "chant",
    chords: "Em C D B7 Em",
    lead: `E5:1 E5:1 G5:1 E5:1 | E5:1 E5:1 C5:2 | D5:1 D5:1 F#5:1 A5:1 |
      F#5:2 D#5:1 B4:1 | E5:4`,
  },
  // Low, heavy and very slow, in C minor.
  dirge: {
    bpm: 56, meter: 4, style: "dirge",
    chords: "Cm Ab Fm G Cm",
    lead: "C4:2 Eb4:1 G4:1 | Ab4:2 G4:1 Eb4:1 | C5:2 Ab4:1 F4:1 | G4:1 F4:1 D4:1 B3:1 | C4:4",
  },
};
