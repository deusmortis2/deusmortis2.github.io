// Lab: a space station's supply pod, practising Astro Stomp's power-up
// code: a weighted drop table, picking from it with a random roll, and a
// table of countdown timers that tick down each frame.
import { fn, sameList } from "./checks.js";

const cargo = [["fuel", 50], ["shield", 30], ["laser", 15], ["medkit", 5]];

export default {
  firstTab: "js",
  intro: `
    <p>Every few minutes a <em>supply pod</em> docks with the space station
    and drops one random item. Some items are common and some are rare, so
    the pod uses a <strong>drop table</strong>, just like the power-ups
    beaten aliens drop in Astro Stomp:</p>
    <pre><code>const cargo = [["fuel", 50], ["shield", 30], ["laser", 15], ["medkit", 5]];</code></pre>
    <p>Each entry is <code>[name, weight]</code>. Fuel has weight 50 out of
    a total of 100, so it turns up half the time. Items with a timer then
    count down in an object like <code>{ laser: 12, shield: 0 }</code>
    (seconds left).</p>
    <p>Write the functions as top-level <strong>function
    declarations</strong>. Instead of calling <code>Math.random()</code>
    itself, <code>pickItem</code> is handed the roll, so the tests can choose
    it.</p>`,
  starter: {
    css: "",
    html: `<h1>Supply Pod</h1>
<p>Bonus: add a button that opens a pod and shows what came out.</p>
`,
    js: `const cargo = [["fuel", 50], ["shield", 30], ["laser", 15], ["medkit", 5]];

function totalWeight(table) {
}

function pickItem(table, roll) {
}

function tickTimers(timers, dt) {
}

function activeItems(timers) {
}
`,
  },
  stories: [
    "<code>totalWeight(table)</code> returns the sum of all the weights (100 for <code>cargo</code>).",
    "<code>pickItem(table, roll)</code> takes a roll from 0 up to (not including) 1, like <code>Math.random()</code> gives. Multiply it by the total weight, then walk down the table subtracting each weight; the first item that takes the running number below 0 is the one picked. So with <code>cargo</code>, rolls below 0.5 give <code>\"fuel\"</code>, 0.5 up to 0.8 give <code>\"shield\"</code>, and so on.",
    "If the walk somehow finds nothing (a roll of exactly 1, say), <code>pickItem</code> returns the first item's name rather than <code>undefined</code>.",
    "<code>tickTimers(timers, dt)</code> takes <code>dt</code> seconds off every timer that is above 0, never going below 0, changes the object it was given and returns it.",
    "<code>activeItems(timers)</code> returns the names of the timers still above 0, in the object's own key order.",
  ],
  tests: [
    {
      run: (t) => {
        const totalWeight = fn(t, "totalWeight");
        return (
          totalWeight(cargo) === 100 &&
          totalWeight([["a", 3], ["b", 4]]) === 7 &&
          totalWeight([]) === 0
        );
      },
      text: "<code>totalWeight</code> adds up the weights, and an empty table weighs 0.",
    },
    {
      run: (t) => {
        const pickItem = fn(t, "pickItem");
        return (
          pickItem(cargo, 0) === "fuel" &&
          pickItem(cargo, 0.49) === "fuel" &&
          pickItem(cargo, 0.5) === "shield" &&
          pickItem(cargo, 0.79) === "shield"
        );
      },
      text: "Rolls 0 and 0.49 give fuel; 0.5 and 0.79 give shield.",
    },
    {
      run: (t) => {
        const pickItem = fn(t, "pickItem");
        return (
          pickItem(cargo, 0.8) === "laser" &&
          pickItem(cargo, 0.94) === "laser" &&
          pickItem(cargo, 0.95) === "medkit" &&
          pickItem(cargo, 0.999) === "medkit"
        );
      },
      text: "0.8 up to 0.95 gives laser, and the last 5% gives medkit.",
    },
    {
      run: (t) => {
        const pickItem = fn(t, "pickItem");
        const odd = [["rock", 1], ["gem", 3]];
        return (
          pickItem(odd, 0.2) === "rock" &&
          pickItem(odd, 0.25) === "gem" &&
          pickItem(odd, 0.9) === "gem"
        );
      },
      text: "<code>pickItem</code> works with weights that don't add up to 100: with rock 1 and gem 3, a quarter of rolls give rock.",
    },
    {
      run: (t) => fn(t, "pickItem")(cargo, 1) === "fuel",
      text: "A roll of exactly 1 falls back to the first item.",
    },
    {
      run: (t) => {
        const pickItem = fn(t, "pickItem");
        const counts = { fuel: 0, laser: 0, medkit: 0, shield: 0 };
        for (let i = 0; i < 1000; i += 1) counts[pickItem(cargo, i / 1000)] += 1;
        return counts.fuel === 500 && counts.shield === 300 &&
          counts.laser === 150 && counts.medkit === 50;
      },
      text: "Over 1,000 evenly spread rolls, the items come out exactly 500, 300, 150 and 50 times.",
    },
    {
      run: (t) => {
        const tickTimers = fn(t, "tickTimers");
        const timers = { laser: 12, shield: 3 };
        const back = tickTimers(timers, 0.5);
        return back === timers && timers.laser === 11.5 && timers.shield === 2.5;
      },
      text: "<code>tickTimers</code> takes <code>dt</code> off each timer and returns the same object.",
    },
    {
      run: (t) => {
        const tickTimers = fn(t, "tickTimers");
        const timers = { fuel: 0, laser: 0.2, shield: 3 };
        tickTimers(timers, 0.5);
        return timers.laser === 0 && timers.fuel === 0 && timers.shield === 2.5;
      },
      text: "Timers stop at 0 instead of going negative, and timers already at 0 stay there.",
    },
    {
      run: (t) => {
        const activeItems = fn(t, "activeItems");
        return (
          sameList(activeItems({ fuel: 0, laser: 4, medkit: 0, shield: 1 }), ["laser", "shield"]) &&
          sameList(activeItems({ laser: 0 }), [])
        );
      },
      text: "<code>activeItems</code> lists only the timers still running, in key order.",
    },
  ],
  title: "Supply Pod",
};
