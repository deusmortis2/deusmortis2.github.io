// Lab: a sushi bar's conveyor belt, practising a timetable built from data
// with a shrinking gap (lerp), releasing what's due with a while loop, and
// a break clock that keeps running across rounds.
import { fn } from "./checks.js";

function close(a, b) {
  return Math.abs(a - b) < 1e-6;
}

function sameBelt(belt, expected) {
  return (
    Array.isArray(belt) &&
    belt.length === expected.length &&
    belt.every((plate, i) => {
      return plate.dish === expected[i][1] && close(plate.at, expected[i][0]);
    })
  );
}

// The belt from the story example: menu of three, gaps 10 to 5, 40 seconds.
const example = [
  [1, "salmon"],
  [10.875, "tuna"],
  [19.515625, "egg"],
  [27.076171875, "salmon"],
  [33.691650390625, "tuna"],
];

function plates(...ats) {
  return ats.map((at, i) => ({ at, dish: `dish${i}` }));
}

export default {
  firstTab: "js",
  intro: `
    <p>A sushi bar sends plates round on a conveyor belt. During each
    rush, plates come out further apart at first and closer together as it
    gets busier. Before the rush starts, the kitchen writes out the whole
    timetable, just like Deus Draconis plans its monster spawns.</p>
    <p>The chef also gets a tea break after every 30 seconds of
    <em>actual work</em>. That clock works like the Draconis maths clock:
    it isn't reset when a new rush starts, and it only runs while the
    chef is working. Write each function as a top-level <strong>function
    declaration</strong>. There's no preview this time: the tests check the
    functions.</p>`,
  starter: {
    css: "",
    html: `<h1>Sushi Conveyor</h1>
<p>Bonus: show the belt's timetable here.</p>
`,
    js: `function buildBelt(menu, startGap, endGap, rushSeconds) {
}

function releasePlates(belt, nextIndex, time) {
}

function createBreakClock(every) {
}

function tickBreakClock(clock, dt) {
}

function takeBreak(clock) {
}

function secondsUntilBreak(clock) {
}
`,
  },
  stories: [
    "<code>buildBelt(menu, startGap, endGap, rushSeconds)</code> returns the timetable: an array of <code>{ at, dish }</code>. The first plate is at <code>at = 1</code>. Dishes take turns through <code>menu</code> in order, going back to the start when they run out. After each plate, the next one is <code>startGap + (endGap - startGap) * (at / rushSeconds)</code> seconds later. Keep adding plates while <code>at</code> is less than <code>rushSeconds - 5</code>.",
    "For example, <code>buildBelt([\"salmon\", \"tuna\", \"egg\"], 10, 5, 40)</code> gives five plates: salmon at 1, tuna at 10.875, egg at 19.515625, salmon at 27.076171875 and tuna at 33.691650390625.",
    "<code>releasePlates(belt, nextIndex, time)</code> starts at <code>belt[nextIndex]</code> and releases every plate whose <code>at</code> is less than or equal to <code>time</code>, stopping at the first that isn't due yet or at the end of the belt. It returns <code>{ released, nextIndex }</code>: the released plates in order, and the index of the next plate still waiting.",
    "<code>createBreakClock(every)</code> returns <code>{ every, nextBreak, worked }</code> with <code>worked</code> at 0 and the first break due at <code>every</code> seconds.",
    "<code>tickBreakClock(clock, dt)</code> adds <code>dt</code> to <code>clock.worked</code> (changing the clock object) and returns <code>true</code> if a break is now due (<code>worked</code> has reached <code>nextBreak</code>), otherwise <code>false</code>.",
    "<code>takeBreak(clock)</code> moves <code>nextBreak</code> on by <code>every</code>. It doesn't touch <code>worked</code>.",
    "<code>secondsUntilBreak(clock)</code> returns the whole number of seconds to show on the counter: the time left rounded <strong>up</strong>, and never below 0.",
  ],
  tests: [
    {
      run: (t) => {
        const buildBelt = fn(t, "buildBelt");
        return sameBelt(buildBelt(["salmon", "tuna", "egg"], 10, 5, 40), example);
      },
      text: "<code>buildBelt([\"salmon\", \"tuna\", \"egg\"], 10, 5, 40)</code> gives the five plates from the example.",
    },
    {
      run: (t) => {
        const buildBelt = fn(t, "buildBelt");
        const belt = buildBelt(["maki"], 4, 4, 20);
        return sameBelt(belt, [
          [1, "maki"],
          [5, "maki"],
          [9, "maki"],
          [13, "maki"],
        ]);
      },
      text: "With equal gaps of 4 over a 20-second rush, plates come at 1, 5, 9 and 13, and stop before 15.",
    },
    {
      run: (t) => {
        const buildBelt = fn(t, "buildBelt");
        const belt = buildBelt(["a", "b"], 2, 2, 18);
        return belt.map((p) => p.dish).join("") === "ababab";
      },
      text: "Dishes take turns and go back to the start of the menu: <code>a, b, a, b, a, b</code>.",
    },
    {
      run: (t) => {
        const buildBelt = fn(t, "buildBelt");
        return buildBelt(["a"], 3, 3, 6).length === 0;
      },
      text: "A rush too short for any plates (6 seconds, so nothing from 1 onwards) gives an empty belt.",
    },
    {
      run: (t) => {
        const releasePlates = fn(t, "releasePlates");
        const belt = plates(1, 3, 3, 8);
        const a = releasePlates(belt, 0, 3);
        const b = releasePlates(belt, 0, 0.5);
        return (
          a.nextIndex === 3 &&
          a.released.length === 3 &&
          a.released[0] === belt[0] &&
          a.released[2] === belt[2] &&
          b.nextIndex === 0 &&
          b.released.length === 0
        );
      },
      text: "<code>releasePlates</code> releases every plate due by <code>time</code> (including two due at once) and returns the next index.",
    },
    {
      run: (t) => {
        const releasePlates = fn(t, "releasePlates");
        const belt = plates(1, 3, 3, 8);
        const a = releasePlates(belt, 3, 7.9);
        const b = releasePlates(belt, 3, 8);
        const c = releasePlates(belt, 4, 100);
        return (
          a.released.length === 0 && a.nextIndex === 3 &&
          b.released.length === 1 && b.released[0] === belt[3] &&
          b.nextIndex === 4 &&
          c.released.length === 0 && c.nextIndex === 4
        );
      },
      text: "It starts from <code>nextIndex</code>, releases a plate exactly on time, and stops cleanly at the end of the belt.",
    },
    {
      run: (t) => {
        const clock = fn(t, "createBreakClock")(30);
        return clock.every === 30 && clock.nextBreak === 30 && clock.worked === 0;
      },
      text: "<code>createBreakClock(30)</code> returns <code>{ every: 30, nextBreak: 30, worked: 0 }</code>.",
    },
    {
      run: (t) => {
        const createBreakClock = fn(t, "createBreakClock");
        const tickBreakClock = fn(t, "tickBreakClock");
        const clock = createBreakClock(30);
        const early = tickBreakClock(clock, 20);
        const almost = tickBreakClock(clock, 9.5);
        const due = tickBreakClock(clock, 0.5);
        return (
          early === false && almost === false && due === true &&
          clock.worked === 30
        );
      },
      text: "<code>tickBreakClock</code> adds up worked time and returns <code>true</code> once it reaches the next break.",
    },
    {
      run: (t) => {
        const createBreakClock = fn(t, "createBreakClock");
        const tickBreakClock = fn(t, "tickBreakClock");
        const takeBreak = fn(t, "takeBreak");
        const clock = createBreakClock(30);
        tickBreakClock(clock, 31);
        takeBreak(clock);
        const after = tickBreakClock(clock, 1);
        return clock.nextBreak === 60 && clock.worked === 32 && after === false;
      },
      text: "<code>takeBreak</code> moves the next break on by <code>every</code> without resetting <code>worked</code>, so overtime still counts.",
    },
    {
      run: (t) => {
        const secondsUntilBreak = fn(t, "secondsUntilBreak");
        return (
          secondsUntilBreak({ every: 30, nextBreak: 30, worked: 0 }) === 30 &&
          secondsUntilBreak({ every: 30, nextBreak: 30, worked: 20.2 }) === 10 &&
          secondsUntilBreak({ every: 30, nextBreak: 60, worked: 59.99 }) === 1 &&
          secondsUntilBreak({ every: 30, nextBreak: 30, worked: 31 }) === 0
        );
      },
      text: "<code>secondsUntilBreak</code> rounds up (9.8 seconds left shows 10) and never shows less than 0.",
    },
  ],
  title: "Sushi Conveyor",
};
