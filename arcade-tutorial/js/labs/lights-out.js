// Lab: Lights Out, practising a board built by JavaScript, state in an
// array, row/column arithmetic and a render() that redraws from state.
import { sameList, text } from "./checks.js";

const startOn = [1, 4, 5, 6, 9];

function lit(t) {
  return t
    .$$("#panel .light")
    .flatMap((light, i) => (light.classList.contains("on") ? [i] : []));
}

async function press(t, index) {
  t.$$("#panel .light")[index].click();
  await t.wait(30);
}

export default {
  firstTab: "js",
  intro: `
    <p><em>Lights Out</em> is a puzzle on a 4 by 4 panel of lights.
    Pressing a light flips it <strong>and</strong> the lights directly
    above, below, left and right of it (not diagonally, and never wrapping
    round an edge). The goal is to turn every light off.</p>
    <p>Build it like the tic-tac-toe board: an array holds the truth,
    JavaScript creates the buttons, and one <code>render()</code> function
    paints the array onto them after every change.</p>`,
  starter: {
    css: `#panel {
  width: 280px;
}

.light {
  aspect-ratio: 1;
}
`,
    html: `<h1>Lights Out</h1>
<p id="status">Turn every light off.</p>
<p>Moves: <span id="moves">0</span></p>
<div id="panel"></div>
`,
    js: `// The puzzle starts with these lights on (squares numbered 0 to 15,
// left to right, top to bottom).
const start = [1, 4, 5, 6, 9];

const lights = Array(16).fill(false);
start.forEach((i) => {
  lights[i] = true;
});
`,
  },
  stories: [
    "<code>#panel</code> is a CSS grid with four equal columns.",
    "Your JavaScript creates sixteen <code>&lt;button type=\"button\" class=\"light\"&gt;</code> inside <code>#panel</code> with a loop. The HTML tab has no buttons in it.",
    "A <code>render()</code> function updates every button from the <code>lights</code> array: the class <code>on</code> when lit, <code>aria-pressed</code> of <code>\"true\"</code> or <code>\"false\"</code>, and an <code>aria-label</code> like <code>Row 2, column 3: on</code> (rows and columns counted from 1).",
    "Pressing a light flips it and its up, down, left and right neighbours. Lights on the edge don't wrap: pressing square 3 must not touch square 4.",
    "Every press adds one to <code>#moves</code>.",
    "When every light is off, <code>#status</code> says <code>Solved!</code> and all the lights are disabled.",
  ],
  tests: [
    {
      run: (t) => {
        const lights = t.$$("#panel > button.light");
        return (
          lights.length === 16 &&
          lights.every((b) => b.type === "button") &&
          !/<button/i.test(t.code.html)
        );
      },
      text: "<code>#panel</code> holds 16 <code>button.light</code> elements with <code>type=\"button\"</code>, all made by JavaScript.",
    },
    {
      run: (t) => {
        const panel = t.$("#panel");
        const s = t.style(panel);
        return s.display === "grid" &&
          s.gridTemplateColumns.trim().split(/\s+/).length === 4;
      },
      text: "<code>#panel</code> is a grid with four columns.",
    },
    {
      run: (t) => {
        const lights = t.$$("#panel .light");
        return (
          sameList(lit(t), startOn) &&
          lights.every((b, i) => {
            return b.getAttribute("aria-pressed") ===
              String(startOn.includes(i));
          })
        );
      },
      text: "At the start, exactly lights 1, 4, 5, 6 and 9 have the class <code>on</code>, and <code>aria-pressed</code> matches on every light.",
    },
    {
      run: (t) => {
        const lights = t.$$("#panel .light");
        return (
          lights[6]?.getAttribute("aria-label") === "Row 2, column 3: on" &&
          lights[0].getAttribute("aria-label") === "Row 1, column 1: off" &&
          lights[15].getAttribute("aria-label") === "Row 4, column 4: off"
        );
      },
      text: "Each light's <code>aria-label</code> names its row, column and state, like <code>Row 2, column 3: on</code>.",
    },
    {
      run: async (t) => {
        await press(t, 0);
        return sameList(lit(t), [0, 5, 6, 9]) && text(t.$("#moves")) === "1";
      },
      text: "Pressing corner square 0 flips 0, 1 and 4 only, and <code>#moves</code> shows 1.",
    },
    {
      run: async (t) => {
        await press(t, 3);
        return sameList(lit(t), [1, 2, 3, 4, 5, 6, 7, 9]);
      },
      text: "Pressing square 3 flips 2, 3 and 7, and doesn't wrap round to square 4.",
    },
    {
      run: async (t) => {
        await press(t, 12);
        return sameList(lit(t), [1, 4, 5, 6, 8, 9, 12, 13]);
      },
      text: "Pressing square 12 flips 8, 12 and 13, and doesn't wrap back to square 11.",
    },
    {
      run: async (t) => {
        await press(t, 0);
        await press(t, 0);
        return sameList(lit(t), startOn) && text(t.$("#moves")) === "2";
      },
      text: "Pressing the same light twice puts everything back, and counts two moves.",
    },
    {
      run: async (t) => {
        const before = text(t.$("#status"));
        await press(t, 5);
        return (
          before !== "Solved!" &&
          lit(t).length === 0 &&
          text(t.$("#status")) === "Solved!" &&
          t.$$("#panel .light").every((b) => b.disabled)
        );
      },
      text: "Pressing square 5 solves this puzzle: <code>#status</code> says <code>Solved!</code> and every light is disabled.",
    },
  ],
  title: "Lights Out",
};
