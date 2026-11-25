// Lab: a perfect (and imperfect) opponent for a pebble game, practising
// recursion, max/min search and the tic-tac-toe CPU's deliberate mistakes.
import { fn, sameList } from "./checks.js";

// A fake Math.random that hands out the given numbers in order.
function sequence(...values) {
  let i = 0;
  return () => {
    const value = values[i];
    i += 1;
    if (value === undefined) {
      throw new Error("random() was called more times than expected.");
    }
    return value;
  };
}

export default {
  firstTab: "js",
  intro: `
    <p><em>Pebbles</em> is a two-player game. There's one pile of pebbles.
    On your turn you take 1, 2 or 3 of them (never more than are left).
    Whoever takes the <strong>last</strong> pebble wins.</p>
    <p>Write a CPU for it the way the arcade's tic-tac-toe CPU works: search
    every possible future with recursion, play the best move, but blunder
    on purpose some of the time. As in the Bingo lab, write each function as
    a top-level <strong>function declaration</strong> so the tests can find
    it. Building a playable page is a bonus; the tests only check the
    functions.</p>`,
  starter: {
    css: "",
    html: `<h1>Pebbles</h1>
<p>Bonus: build a page here to play against cpuTake().</p>
`,
    js: `// Take 1, 2 or 3 pebbles each turn. Whoever takes the last pebble wins.

function legalTakes(pebbles) {
}

function outcome(pebbles, cpuToMove) {
}

function bestTakes(pebbles) {
}

function cpuTake(pebbles, mistakeChance, random = Math.random) {
}
`,
  },
  stories: [
    "<code>legalTakes(pebbles)</code> returns the takes allowed from a pile: <code>[1, 2, 3]</code>, without any that are bigger than the pile.",
    "<code>outcome(pebbles, cpuToMove)</code> returns <code>1</code> if the CPU wins with perfect play from here, and <code>-1</code> if it loses. <code>cpuToMove</code> says whose turn it is. A pile of 0 means the game is over and whoever moved <em>last</em> won it. Use recursion: the CPU picks the best result for itself, and the other player picks the worst one for the CPU.",
    "<code>bestTakes(pebbles)</code> returns every take for the CPU (to move now) that has the best outcome, smallest first.",
    "<code>cpuTake(pebbles, mistakeChance, random)</code> picks the CPU's move like <code>chooseCpuMove</code>: call <code>random()</code> once; if it's below <code>mistakeChance</code> and there are legal takes that aren't best, the options are those worse takes, otherwise the best ones. Then call <code>random()</code> once more to pick from the options with <code>Math.floor(random() * options.length)</code>.",
  ],
  tests: [
    {
      run: (t) => {
        const legalTakes = fn(t, "legalTakes");
        return (
          sameList(legalTakes(10), [1, 2, 3]) &&
          sameList(legalTakes(3), [1, 2, 3]) &&
          sameList(legalTakes(2), [1, 2]) &&
          sameList(legalTakes(1), [1])
        );
      },
      text: "<code>legalTakes</code> gives <code>[1, 2, 3]</code> for big piles, <code>[1, 2]</code> for 2 and <code>[1]</code> for 1.",
    },
    {
      run: (t) => {
        const outcome = fn(t, "outcome");
        return outcome(0, true) === -1 && outcome(0, false) === 1;
      },
      text: "An empty pile is a finished game: <code>outcome(0, true)</code> is <code>-1</code> (the other player took the last pebble) and <code>outcome(0, false)</code> is <code>1</code>.",
    },
    {
      run: (t) => {
        const outcome = fn(t, "outcome");
        return (
          outcome(1, true) === 1 &&
          outcome(3, true) === 1 &&
          outcome(4, true) === -1 &&
          outcome(4, false) === 1 &&
          outcome(5, false) === -1
        );
      },
      text: "<code>outcome</code> scores small piles correctly for both players.",
    },
    {
      run: (t) => {
        const outcome = fn(t, "outcome");
        return Array.from({ length: 16 }, (_, i) => i + 1).every((n) => {
          return outcome(n, true) === (n % 4 === 0 ? -1 : 1);
        });
      },
      text: "From 1 to 16 pebbles, the CPU to move loses exactly when the pile is a multiple of 4.",
    },
    {
      run: (t) => {
        const bestTakes = fn(t, "bestTakes");
        return (
          sameList(bestTakes(5), [1]) &&
          sameList(bestTakes(6), [2]) &&
          sameList(bestTakes(7), [3]) &&
          sameList(bestTakes(13), [1])
        );
      },
      text: "<code>bestTakes</code> finds the one winning take: 5 → <code>[1]</code>, 6 → <code>[2]</code>, 7 → <code>[3]</code>, 13 → <code>[1]</code>.",
    },
    {
      run: (t) => sameList(fn(t, "bestTakes")(8), [1, 2, 3]),
      text: "When every take loses, they're all equally best: <code>bestTakes(8)</code> is <code>[1, 2, 3]</code>.",
    },
    {
      run: (t) => {
        const cpuTake = fn(t, "cpuTake");
        return (
          cpuTake(5, 0.2, sequence(0.5, 0.9)) === 1 &&
          cpuTake(6, 0, sequence(0, 0.99)) === 2
        );
      },
      text: "Without a blunder, <code>cpuTake</code> plays a best take.",
    },
    {
      run: (t) => {
        const cpuTake = fn(t, "cpuTake");
        return (
          cpuTake(5, 0.2, sequence(0.1, 0.99)) === 3 &&
          cpuTake(5, 0.2, sequence(0.1, 0)) === 2
        );
      },
      text: "On a blunder (first <code>random()</code> below <code>mistakeChance</code>), it picks from the worse takes using the second <code>random()</code>.",
    },
    {
      run: (t) => fn(t, "cpuTake")(8, 1, sequence(0, 0.5)) === 2,
      text: "If there are no worse takes, a blunder falls back to the best ones: <code>cpuTake(8, 1, ...)</code> with a second roll of 0.5 is 2.",
    },
    {
      run: (t) => {
        const startedAt = performance.now();
        const best = fn(t, "bestTakes")(21);
        return sameList(best, [1]) && performance.now() - startedAt < 2000;
      },
      text: "<code>bestTakes(21)</code> is <code>[1]</code> and takes under two seconds.",
    },
  ],
  title: "Pebble Nim",
};
