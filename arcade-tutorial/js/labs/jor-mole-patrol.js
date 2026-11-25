// Lab: the timers behind a whack-a-mole game, practising Jörmungandr's
// step clock, timers with a random spread, items that age and expire, and
// finding a free cell by guessing first and scanning after.
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

function near(a, b) {
  return typeof a === "number" && Math.abs(a - b) < 0.0001;
}

export default {
  firstTab: "js",
  intro: `
    <p>In <em>Mole Patrol</em>, moles pop out of holes in a lawn (a grid
    of holes) and duck back down after a while. A drum beats in the
    background, and every beat is a chance to whack.</p>
    <p>Write the timing code the way Jörmungandr's <code>play.js</code>,
    <code>items.js</code> and <code>board.js</code> do it. Times are in
    seconds. Functions that use chance take a <code>random</code> function
    (normally <code>Math.random</code>) so the tests can hand in their own
    numbers. Write each one as a top-level <strong>function
    declaration</strong>. A playable lawn is a bonus; the tests only check
    the functions.</p>`,
  starter: {
    css: "",
    html: `<h1>Mole Patrol</h1>
<p>Bonus: build a lawn of holes and pop some moles.</p>
`,
    js: `function beats(clock, dt, step, maxBeats) {
}

function rollTimer(every, spread, random = Math.random) {
}

function ageMoles(moles, dt) {
}

function freeHole(isFree, cols, rows, random = Math.random) {
}
`,
  },
  stories: [
    "<code>beats(clock, dt, step, maxBeats)</code> is a step clock. Add <code>dt</code> to <code>clock</code>. While the clock holds at least one <code>step</code> and fewer than <code>maxBeats</code> beats have been counted, count a beat and <em>subtract</em> <code>step</code>. Finally, cap the clock at <code>step</code>. Return <code>{ clock, count }</code>: the new clock and the number of beats.",
    "<code>rollTimer(every, spread, random)</code> returns <code>every</code> give or take up to <code>spread</code>: <code>every + (random() * 2 - 1) * spread</code>. Call <code>random()</code> exactly once.",
    "<code>ageMoles(moles, dt)</code> adds <code>dt</code> to every mole's <code>age</code>, then returns a new array of only the moles whose <code>age</code> is still less than their <code>life</code>.",
    "<code>freeHole(isFree, cols, rows, random)</code> finds a hole where <code>isFree(x, y)</code> is true. First make up to 50 random guesses: each guess calls <code>random()</code> for <code>x = Math.floor(random() * cols)</code> and then again for <code>y = Math.floor(random() * rows)</code>. If none is free, scan every hole row by row (<code>y</code> from 0, and <code>x</code> from 0 within each row) and return the first free one. Return <code>{ x, y }</code>, or <code>null</code> if no hole is free.",
  ],
  tests: [
    {
      run: (t) => {
        const beats = fn(t, "beats");
        const none = beats(0.1, 0.05, 0.25, 2);
        const one = beats(0.2, 0.1, 0.25, 2);
        return near(none.clock, 0.15) && none.count === 0 &&
          near(one.clock, 0.05) && one.count === 1;
      },
      text: "<code>beats</code> keeps the spare time: 0.2 + 0.1 with a 0.25 step is one beat and a clock of 0.05.",
    },
    {
      run: (t) => {
        const beats = fn(t, "beats");
        const two = beats(0, 0.5, 0.2, 2);
        const three = beats(0, 0.5, 0.2, 5);
        return two.count === 2 && near(two.clock, 0.1) &&
          three.count === 2 && near(three.clock, 0.1);
      },
      text: "It counts as many beats as fit, up to <code>maxBeats</code>.",
    },
    {
      run: (t) => {
        const result = fn(t, "beats")(0, 1, 0.2, 2);
        return result.count === 2 && near(result.clock, 0.2);
      },
      text: "After a long frame, the leftover clock is capped at one <code>step</code>.",
    },
    {
      run: (t) => {
        const rollTimer = fn(t, "rollTimer");
        return (
          near(rollTimer(10, 4, sequence(0)), 6) &&
          near(rollTimer(10, 4, sequence(0.5)), 10) &&
          near(rollTimer(10, 4, sequence(0.75)), 12)
        );
      },
      text: "<code>rollTimer(10, 4, ...)</code> gives 6 for a roll of 0, 10 for 0.5 and 12 for 0.75.",
    },
    {
      run: (t) => {
        const ageMoles = fn(t, "ageMoles");
        const moles = [
          { age: 0, life: 3, name: "a" },
          { age: 2.5, life: 3, name: "b" },
          { age: 1, life: Infinity, name: "c" },
        ];
        const left = ageMoles(moles, 0.5);
        return (
          Array.isArray(left) &&
          sameList(left.map((m) => m.name), ["a", "c"]) &&
          near(moles[0].age, 0.5) &&
          near(moles[2].age, 1.5)
        );
      },
      text: "<code>ageMoles</code> ages every mole and drops the ones that have reached their <code>life</code>. A life of <code>Infinity</code> never runs out.",
    },
    {
      run: (t) => {
        const ageMoles = fn(t, "ageMoles");
        const moles = [{ age: 0, life: 1 }];
        const left = ageMoles(moles, 0.2);
        return left !== moles && moles.length === 1 && left.length === 1;
      },
      text: "<code>ageMoles</code> returns a new array rather than the one it was given.",
    },
    {
      run: (t) => {
        const freeHole = fn(t, "freeHole");
        const spot = freeHole(() => true, 5, 4, sequence(0.5, 0.3));
        return spot?.x === 2 && spot?.y === 1;
      },
      text: "On an empty lawn, the first guess is used: rolls of 0.5 and 0.3 on a 5 by 4 lawn give <code>{ x: 2, y: 1 }</code>.",
    },
    {
      run: (t) => {
        const freeHole = fn(t, "freeHole");
        const free = (x, y) => x === 1 && y === 0;
        const rolls = sequence(0.9, 0.9, 0.5, 0.5, 0.2, 0.1);
        const spot = freeHole(free, 5, 4, rolls);
        return spot?.x === 1 && spot?.y === 0;
      },
      text: "It keeps guessing until a guess is free.",
    },
    {
      run: (t) => {
        const freeHole = fn(t, "freeHole");
        let calls = 0;
        const random = () => {
          calls += 1;
          return 0;
        };
        const spot = freeHole((x, y) => x === 3 && y === 2, 5, 4, random);
        return calls === 100 && spot?.x === 3 && spot?.y === 2;
      },
      text: "After 50 missed guesses (100 calls to <code>random()</code>) it scans and still finds the one free hole.",
    },
    {
      run: (t) => {
        const freeHole = fn(t, "freeHole");
        const free = (x, y) => (x === 4 && y === 0) || (x === 0 && y === 1);
        const spot = freeHole(free, 5, 4, () => 0.99);
        const none = freeHole(() => false, 5, 4, () => 0.5);
        return spot?.x === 4 && spot?.y === 0 && none === null;
      },
      text: "The scan goes row by row, so (4, 0) is found before (0, 1). A full lawn gives <code>null</code>.",
    },
  ],
  title: "Mole Patrol",
};
