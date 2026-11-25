// Lab: melting ice floes, practising Spireclash's collapse: string keys for
// grid slots, neighbours, and a flood fill from everything that's anchored.
import { fn, sameList } from "./checks.js";

// A Set of "x,y" keys for every cell of a w by h rectangle.
function block(w, h) {
  const floes = new Set();
  for (let x = 0; x < w; x += 1) {
    for (let y = 0; y < h; y += 1) floes.add(`${x},${y}`);
  }
  return floes;
}

const sorted = (list) => [...list].sort();

export default {
  firstTab: "js",
  intro: `
    <p>Ice floes sit on a grid of squares off a frozen shore. Each floe is
    a square <code>(x, y)</code>, and the shore runs along row
    <code>y = 0</code>: every floe in that row is frozen to it. Floes are
    joined to the floes directly beside them (left, right, up and down;
    not diagonally).</p>
    <p>When a floe melts, any floe no longer joined to the shore by a chain
    of floes drifts away, just as Spireclash's pieces fall when nothing
    connects them to the ground. Store the floes in a <code>Set</code> of
    string keys like <code>"3,2"</code>. Each function must be a top-level
    <strong>function declaration</strong>.</p>`,
  starter: {
    css: "",
    html: `<h1>Ice Floes</h1>
<p>Bonus: draw the floes as a grid and melt one when it's clicked.</p>
`,
    js: `// Floes are a Set of "x,y" strings. Row y = 0 is frozen to the shore.

function keyOf(x, y) {
}

function neighbours(key) {
}

function anchored(floes) {
}

function melt(floes, key) {
}
`,
  },
  stories: [
    "<code>keyOf(x, y)</code> returns the key for a square, like <code>\"3,2\"</code>.",
    "<code>neighbours(key)</code> returns the keys of the four squares beside a square (right, left, up and down, in any order), whether or not there's a floe there. <code>neighbours(\"3,2\")</code> includes <code>\"4,2\"</code>, <code>\"2,2\"</code>, <code>\"3,3\"</code> and <code>\"3,1\"</code>.",
    "<code>anchored(floes)</code> returns a <code>Set</code> of the keys of every floe joined to the shore. Flood fill: start from every floe in row 0, then keep adding neighbours that are floes and haven't been reached yet. It must not change <code>floes</code>.",
    "<code>melt(floes, key)</code> removes that floe from <code>floes</code>, then removes every floe that is no longer anchored. It returns the keys of the floes that drifted away (not the melted one), sorted with <code>.sort()</code>.",
    "It's quick: a 60 by 60 block of ice is handled in well under a second.",
  ],
  tests: [
    {
      run: (t) => {
        const keyOf = fn(t, "keyOf");
        return keyOf(3, 2) === "3,2" && keyOf(-1, 0) === "-1,0";
      },
      text: "<code>keyOf(3, 2)</code> is <code>\"3,2\"</code>.",
    },
    {
      run: (t) => {
        const neighbours = fn(t, "neighbours");
        return (
          sameList(sorted(neighbours("3,2")), ["2,2", "3,1", "3,3", "4,2"]) &&
          sameList(sorted(neighbours("0,0")), ["-1,0", "0,-1", "0,1", "1,0"])
        );
      },
      text: "<code>neighbours</code> gives the four squares beside a square, and no diagonals.",
    },
    {
      run: (t) => {
        const anchored = fn(t, "anchored");
        const floes = new Set(["0,0", "0,1", "0,2", "1,2", "5,5", "5,6"]);
        const reached = anchored(floes);
        // The lab's Set comes from its own frame, so instanceof won't do.
        const isSet = Object.prototype.toString.call(reached) === "[object Set]";
        return isSet &&
          sameList(sorted(reached), ["0,0", "0,1", "0,2", "1,2"]) &&
          floes.size === 6;
      },
      text: "<code>anchored</code> returns a Set of the floes joined to the shore, leaving the input alone.",
    },
    {
      run: (t) => {
        const anchored = fn(t, "anchored");
        const floes = new Set(["0,1", "1,1", "1,2", "2,2", "2,1", "3,1"]);
        const diagonal = new Set(["0,0", "1,1", "2,2"]);
        return anchored(floes).size === 0 &&
          sameList(sorted(anchored(diagonal)), ["0,0"]);
      },
      text: "Floes with no path to row 0, or touching only at corners, aren't anchored.",
    },
    {
      run: (t) => {
        const anchored = fn(t, "anchored");
        // A ring of ice around a hole, joined to the shore at one point.
        const ring = new Set([
          "2,0", "2,1", "1,1", "3,1", "1,2", "3,2", "1,3", "2,3", "3,3",
        ]);
        return anchored(ring).size === 9;
      },
      text: "A loop of floes is anchored without the flood going round forever.",
    },
    {
      run: (t) => {
        const melt = fn(t, "melt");
        const floes = new Set(["0,0", "0,1", "0,2", "1,2", "1,0"]);
        const drifted = melt(floes, "0,1");
        return Array.isArray(drifted) &&
          sameList(drifted, ["0,2", "1,2"]) &&
          sameList(sorted(floes), ["0,0", "1,0"]);
      },
      text: "<code>melt</code> removes the floe and everything cut off by it, and returns the drifted keys sorted.",
    },
    {
      run: (t) => {
        const melt = fn(t, "melt");
        // Two columns joined at the top: melting one base leaves it held.
        const floes = new Set(["0,0", "0,1", "0,2", "1,2", "2,2", "2,1", "2,0"]);
        const drifted = melt(floes, "0,0");
        return sameList(drifted, []) && floes.size === 6;
      },
      text: "A floe held up another way doesn't drift: <code>melt</code> returns <code>[]</code>.",
    },
    {
      run: (t) => {
        const melt = fn(t, "melt");
        const floes = new Set(["0,0", "0,1", "1,1", "5,5"]);
        const drifted = melt(floes, "1,1");
        return sameList(drifted, ["5,5"]) && sameList(sorted(floes), ["0,0", "0,1"]);
      },
      text: "Floes that were never anchored drift away too.",
    },
    {
      run: (t) => {
        const melt = fn(t, "melt");
        const floes = block(60, 60);
        // Melt the whole of row 1 except one floe, then that one.
        for (let x = 1; x < 60; x += 1) floes.delete(`${x},1`);
        const startedAt = performance.now();
        const drifted = melt(floes, "0,1");
        const quick = performance.now() - startedAt < 1000;
        return quick && drifted.length === 58 * 60 && floes.size === 60;
      },
      text: "A 60 by 60 sheet breaking away (3,480 floes) is handled in under a second.",
    },
  ],
  title: "Ice Floes",
};
