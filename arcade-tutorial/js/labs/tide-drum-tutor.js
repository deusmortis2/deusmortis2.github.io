// Lab: a drum practice tutor, practising Tidesong's rhythm timing: notes
// due at set times, judging taps inside timing windows, and a score.
import { fn } from "./checks.js";

const pattern = [0, 1, 0, 2];

function close(a, b) {
  return Math.abs(a - b) < 1e-9;
}

export default {
  firstTab: "js",
  intro: `
    <p>A drum tutor plays a pattern on three pads (0 kick, 1 snare, 2
    cymbal) and you tap along. Like Tidesong's song game, each beat is due
    at a set time, each tap is judged by how close it was, and the
    performance gets a score from 0 to 1.</p>
    <p>Times are in seconds from the start. Write each function as a
    top-level function declaration. The windows are in the starter.</p>`,
  starter: {
    css: "",
    html: `<h1>Drum Tutor</h1>
<p>Bonus: three pad buttons and a falling-beat display.</p>
`,
    js: `const perfectWindow = 0.05;
const goodWindow = 0.12;

function makeBeats(pattern, tempo, leadIn) {
}

function judgeTap(beats, pad, at) {
}

function markMisses(beats, now) {
}

function score(beats) {
}

function grade(value) {
}
`,
  },
  stories: [
    "<code>makeBeats(pattern, tempo, leadIn)</code> returns one <code>{ hit: null, pad, time }</code> per entry in <code>pattern</code>. Beat <code>i</code> is due at <code>leadIn + i / tempo</code> (<code>tempo</code> is beats per second).",
    "<code>judgeTap(beats, pad, at)</code> finds the first beat with <code>hit</code> still <code>null</code>, on that pad, due within <code>goodWindow</code> seconds of <code>at</code> (either side). It sets that beat's <code>hit</code> to <code>\"perfect\"</code> if it was within <code>perfectWindow</code>, otherwise <code>\"good\"</code>, and returns the same word. With no such beat it changes nothing and returns <code>null</code>.",
    "<code>markMisses(beats, now)</code> sets <code>hit</code> to <code>\"miss\"</code> on every unjudged beat that's more than <code>goodWindow</code> overdue at time <code>now</code>, and returns how many it marked.",
    "<code>score(beats)</code> counts 1 per perfect and 0.6 per good, divided by the number of beats.",
    "<code>grade(value)</code> returns <code>\"Flawless\"</code> for a score of 0.9 or more, <code>\"Nice\"</code> for 0.6 or more, otherwise <code>\"Keep practising\"</code>.",
  ],
  tests: [
    {
      run: (t) => {
        const beats = fn(t, "makeBeats")(pattern, 2, 1);
        return (
          Array.isArray(beats) && beats.length === 4 &&
          beats.every((b, i) => b.hit === null && b.pad === pattern[i]) &&
          [1, 1.5, 2, 2.5].every((time, i) => close(beats[i].time, time))
        );
      },
      text: "<code>makeBeats([0, 1, 0, 2], 2, 1)</code> gives beats due at 1, 1.5, 2 and 2.5 seconds, all unjudged.",
    },
    {
      run: (t) => {
        const beats = fn(t, "makeBeats")(pattern, 2, 1);
        const judgeTap = fn(t, "judgeTap");
        return (
          judgeTap(beats, 0, 1.02) === "perfect" && beats[0].hit === "perfect" &&
          judgeTap(beats, 1, 1.4) === "good" && beats[1].hit === "good"
        );
      },
      text: "A tap 0.02s off is perfect; one 0.1s early is good. Each marks its beat.",
    },
    {
      run: (t) => {
        const beats = fn(t, "makeBeats")(pattern, 2, 1);
        const judgeTap = fn(t, "judgeTap");
        return (
          judgeTap(beats, 1, 1) === null &&
          judgeTap(beats, 0, 1.3) === null &&
          beats.every((b) => b.hit === null)
        );
      },
      text: "A tap on the wrong pad, or too far from any beat, returns <code>null</code> and changes nothing.",
    },
    {
      run: (t) => {
        const beats = fn(t, "makeBeats")(pattern, 2, 1);
        const judgeTap = fn(t, "judgeTap");
        judgeTap(beats, 0, 1);
        return judgeTap(beats, 0, 1.01) === null && judgeTap(beats, 0, 1.98) === "perfect" &&
          beats[2].hit === "perfect";
      },
      text: "A beat can only be hit once; the next tap on that pad needs the next beat.",
    },
    {
      run: (t) => {
        const beats = fn(t, "makeBeats")(pattern, 2, 1);
        const markMisses = fn(t, "markMisses");
        beats[0].hit = "good";
        const first = markMisses(beats, 1.7);
        const second = markMisses(beats, 1.7);
        return first === 1 && second === 0 && beats[1].hit === "miss" &&
          beats[0].hit === "good" && beats[2].hit === null;
      },
      text: "<code>markMisses</code> marks only unjudged beats more than 0.12s overdue, and returns how many.",
    },
    {
      run: (t) => {
        const score = fn(t, "score");
        const beats = ["perfect", "perfect", "good", "miss"].map((hit) => ({ hit }));
        return close(score(beats), 0.65) &&
          score([{ hit: "miss" }, { hit: null }]) === 0;
      },
      text: "<code>score</code> of perfect, perfect, good, miss is 0.65.",
    },
    {
      run: (t) => {
        const grade = fn(t, "grade");
        return grade(1) === "Flawless" && grade(0.9) === "Flawless" &&
          grade(0.65) === "Nice" && grade(0.6) === "Nice" &&
          grade(0.59) === "Keep practising";
      },
      text: "<code>grade</code> gives Flawless from 0.9, Nice from 0.6, otherwise Keep practising.",
    },
  ],
  title: "Drum Tutor",
};
