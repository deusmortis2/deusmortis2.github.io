// Lab: a spacewalker's air supply and mission timer, practising Astro
// Stomp's oxygen meter (a drain that pauses, then a penalty every few
// seconds once it's empty), the m:ss clock and the time bonus formula.
import { fn } from "./checks.js";

function near(a, b) {
  return typeof a === "number" && Math.abs(a - b) < 0.001;
}

function suit(extra) {
  return { air: 30, docked: false, gasp: 2, leaking: false, ...extra };
}

export default {
  firstTab: "js",
  intro: `
    <p>An astronaut is out on a spacewalk fixing a satellite. Their suit is
    an object like <code>{ air, gasp, leaking, docked }</code>:
    <code>air</code> is how much air is left (30 is full), <code>gasp</code>
    counts down the seconds until running out of air does damage,
    <code>leaking</code> is true while the suit has a hole in it and
    <code>docked</code> is true once they're back inside the airlock.</p>
    <p>Write the air meter and the mission timer as top-level
    <strong>function declarations</strong>. The constants you need are in
    the starter code. Showing the meter on the page is a bonus.</p>`,
  starter: {
    css: "",
    html: `<h1>Spacewalk</h1>
<p>Bonus: show the air meter and the mission clock here.</p>
`,
    js: `const drainRate = 1.5;   // Air used per second.
const leakFactor = 5;    // A leaking suit drains this many times faster.
const gaspSeconds = 2;   // How often an empty suit does damage.

function breathe(suit, dt) {
}

function clockText(seconds) {
}

function returnBonus(seconds) {
}
`,
  },
  stories: [
    "<code>breathe(suit, dt)</code> does nothing and returns <code>false</code> while <code>suit.docked</code> is true.",
    "Otherwise it takes <code>dt * drainRate</code> off <code>suit.air</code> (times <code>leakFactor</code> if the suit is leaking), never going below 0. While there is air left, it sets <code>suit.gasp</code> back to <code>gaspSeconds</code> and returns <code>false</code>.",
    "Once <code>air</code> is 0, it takes <code>dt</code> off <code>suit.gasp</code>. When <code>gasp</code> reaches 0 or below, it resets <code>gasp</code> to <code>gaspSeconds</code> and returns <code>true</code> (this is when the astronaut takes damage). Otherwise it returns <code>false</code>.",
    "<code>clockText(seconds)</code> turns a time into minutes and seconds like <code>\"1:05\"</code>: whole seconds only (round down), and the seconds always have two digits.",
    "<code>returnBonus(seconds)</code> is <code>3000 - 12 * seconds</code>, rounded to the nearest 10, but never less than 150.",
  ],
  tests: [
    {
      run: (t) => {
        const breathe = fn(t, "breathe");
        const s = suit({ air: 10, docked: true, gasp: 0.5 });
        return breathe(s, 1) === false && s.air === 10 && s.gasp === 0.5;
      },
      text: "Docked, <code>breathe</code> returns <code>false</code> and leaves the suit alone.",
    },
    {
      run: (t) => {
        const breathe = fn(t, "breathe");
        const s = suit({ air: 30, gasp: 1 });
        const result = breathe(s, 2);
        return result === false && near(s.air, 27) && s.gasp === 2;
      },
      text: "Two seconds outside drains 3 air (30 to 27), resets <code>gasp</code> to 2 and returns <code>false</code>.",
    },
    {
      run: (t) => {
        const breathe = fn(t, "breathe");
        const s = suit({ air: 30, leaking: true });
        breathe(s, 2);
        return near(s.air, 15);
      },
      text: "A leaking suit drains five times faster: two seconds takes 15 air.",
    },
    {
      run: (t) => {
        const breathe = fn(t, "breathe");
        const s = suit({ air: 1 });
        const result = breathe(s, 1);
        return result === false && s.air === 0 && near(s.gasp, 1);
      },
      text: "Air never goes below 0, and the gasp countdown starts in the same step the air runs out.",
    },
    {
      run: (t) => {
        const breathe = fn(t, "breathe");
        const s = suit({ air: 0, gasp: 2 });
        const first = breathe(s, 0.5);
        const second = breathe(s, 0.5);
        return first === false && second === false && near(s.gasp, 1);
      },
      text: "With no air, <code>gasp</code> counts down and <code>breathe</code> returns <code>false</code> until it runs out.",
    },
    {
      run: (t) => {
        const breathe = fn(t, "breathe");
        const s = suit({ air: 0, gasp: 0.3 });
        const hit = breathe(s, 0.5);
        const after = breathe(s, 0.5);
        return hit === true && after === false && near(s.gasp, 1.5);
      },
      text: "When <code>gasp</code> runs out, <code>breathe</code> returns <code>true</code> once and starts a fresh 2-second countdown.",
    },
    {
      run: (t) => {
        const breathe = fn(t, "breathe");
        const s = suit({ air: 0 });
        let hits = 0;
        for (let i = 0; i < 40; i += 1) {
          if (breathe(s, 0.25)) hits += 1;
        }
        return hits === 5;
      },
      text: "Ten seconds with an empty suit, in steps of 0.25, does damage exactly 5 times.",
    },
    {
      run: (t) => {
        const clockText = fn(t, "clockText");
        return (
          clockText(0) === "0:00" &&
          clockText(5) === "0:05" &&
          clockText(65.9) === "1:05" &&
          clockText(600) === "10:00" &&
          clockText(119.99) === "1:59"
        );
      },
      text: "<code>clockText</code> gives <code>0:00</code>, <code>0:05</code>, <code>1:05</code> (for 65.9), <code>10:00</code> and <code>1:59</code>.",
    },
    {
      run: (t) => {
        const returnBonus = fn(t, "returnBonus");
        return (
          returnBonus(0) === 3000 &&
          returnBonus(100) === 1800 &&
          returnBonus(61) === 2270 &&
          returnBonus(61.5) === 2260
        );
      },
      text: "<code>returnBonus</code> takes 12 per second and rounds to tens: 0s is 3000, 100s is 1800, 61s is 2270.",
    },
    {
      run: (t) => {
        const returnBonus = fn(t, "returnBonus");
        return (
          returnBonus(237) === 160 &&
          returnBonus(238) === 150 &&
          returnBonus(300) === 150 &&
          returnBonus(10000) === 150
        );
      },
      text: "However slow the mission, the bonus never drops below 150.",
    },
  ],
  title: "Spacewalk Air Supply",
};
