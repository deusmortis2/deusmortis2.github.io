// Lab: a robot that bounces on hover drones, practising Astro Stomp's
// contact rules: box overlap, "did I land on top?" and a decision table for
// what a touch means.
import { fn } from "./checks.js";

function bot(extra) {
  return { diving: false, grace: 0, h: 60, vy: 0, w: 30, x: 100, y: 100, ...extra };
}

function drone(extra) {
  return {
    guarded: false,
    h: 40,
    harmless: false,
    spiky: false,
    stunned: false,
    w: 50,
    x: 90,
    y: 150,
    ...extra,
  };
}

export default {
  firstTab: "js",
  intro: `
    <p>In <em>Drone Stomper</em> a jumping robot bounces on hover drones in
    a space station's cargo bay. Bodies are boxes like
    <code>{ x, y, w, h }</code> with <code>x, y</code> the top-left corner
    and <code>y</code> growing downwards. The robot also has <code>vy</code>
    (positive means falling), <code>diving</code> (true during a dive
    attack, like Astro Stomp's smash) and <code>grace</code> (seconds left
    of a short safe time after a bounce).</p>
    <p>Write the three functions that decide what happens when the robot
    touches a drone. As before, each must be a top-level <strong>function
    declaration</strong>; the tests only check the functions.</p>`,
  starter: {
    css: "",
    html: `<h1>Drone Stomper</h1>
<p>Bonus: draw a robot and some drones and try your rules out.</p>
`,
    js: `// Boxes: { x, y, w, h }, top-left corner, y grows downwards.

function overlaps(a, b) {
}

function landedOnTop(robot, drone) {
}

function contact(robot, drone) {
}
`,
  },
  stories: [
    "<code>overlaps(a, b)</code> returns <code>true</code> when two boxes overlap, and <code>false</code> when they only touch edges or are apart.",
    "<code>landedOnTop(robot, drone)</code> returns <code>true</code> when the robot is falling (<code>vy &gt; 0</code>) and its feet (<code>y + h</code>) are less than <code>Math.min(20, drone.h / 2)</code> pixels below the drone's top.",
    "<code>contact(robot, drone)</code> returns <code>\"miss\"</code> if the boxes don't overlap.",
    "From above (landed on top, or <code>robot.diving</code>), check in this order: a <code>spiky</code> drone gives <code>\"ouch\"</code>; a <code>guarded</code> one gives <code>\"clang\"</code>; if the robot is diving or the drone is <code>stunned</code> the result is <code>\"smash\"</code>; otherwise <code>\"bounce\"</code>.",
    "From the side, a drone that is <code>harmless</code> or <code>stunned</code> gives <code>\"safe\"</code>, as does any touch while <code>robot.grace</code> is above 0. Anything else is <code>\"ouch\"</code>.",
  ],
  tests: [
    {
      run: (t) => {
        const overlaps = fn(t, "overlaps");
        const a = { h: 10, w: 10, x: 0, y: 0 };
        return (
          overlaps(a, { h: 10, w: 10, x: 5, y: 5 }) === true &&
          overlaps(a, { h: 2, w: 2, x: 4, y: 4 }) === true &&
          overlaps(a, { h: 10, w: 10, x: 20, y: 0 }) === false &&
          overlaps(a, { h: 10, w: 10, x: 0, y: -30 }) === false
        );
      },
      text: "<code>overlaps</code> is true for overlapping or nested boxes and false for boxes that are apart.",
    },
    {
      run: (t) => {
        const overlaps = fn(t, "overlaps");
        const a = { h: 10, w: 10, x: 0, y: 0 };
        return (
          overlaps(a, { h: 10, w: 10, x: 10, y: 0 }) === false &&
          overlaps(a, { h: 10, w: 10, x: 0, y: 10 }) === false
        );
      },
      text: "Boxes that only share an edge don't overlap.",
    },
    {
      run: (t) => {
        const landedOnTop = fn(t, "landedOnTop");
        return (
          landedOnTop(bot({ vy: 200, y: 100 }), drone({ y: 150 })) === true &&
          landedOnTop(bot({ vy: 200, y: 108 }), drone({ y: 150 })) === true
        );
      },
      text: "A falling robot whose feet are 10 or 18 pixels into a 40-pixel drone has landed on top.",
    },
    {
      run: (t) => {
        const landedOnTop = fn(t, "landedOnTop");
        return (
          landedOnTop(bot({ vy: 200, y: 115 }), drone({ y: 150 })) === false &&
          landedOnTop(bot({ vy: -200, y: 100 }), drone({ y: 150 })) === false &&
          landedOnTop(bot({ vy: 0, y: 100 }), drone({ y: 150 })) === false
        );
      },
      text: "Feet 25 pixels in is too deep, and a robot that is rising or still hasn't landed on top.",
    },
    {
      run: (t) => {
        const landedOnTop = fn(t, "landedOnTop");
        const tiny = drone({ h: 16, y: 150 });
        return (
          landedOnTop(bot({ vy: 100, y: 96 }), tiny) === true &&
          landedOnTop(bot({ vy: 100, y: 99 }), tiny) === false
        );
      },
      text: "For a small drone the limit is half its height: 6 pixels in counts, 9 doesn't for a 16-pixel drone.",
    },
    {
      run: (t) => {
        const contact = fn(t, "contact");
        return contact(bot({ x: 0, y: 0 }), drone({ x: 300, y: 300 })) === "miss";
      },
      text: "<code>contact</code> returns <code>\"miss\"</code> when the boxes don't overlap.",
    },
    {
      run: (t) => {
        const contact = fn(t, "contact");
        const top = { vy: 200, y: 100 };
        return (
          contact(bot(top), drone()) === "bounce" &&
          contact(bot({ ...top, diving: true }), drone()) === "smash" &&
          contact(bot(top), drone({ stunned: true })) === "smash"
        );
      },
      text: "Landing on a plain drone bounces; a dive, or landing on a stunned drone, smashes it.",
    },
    {
      run: (t) => {
        const contact = fn(t, "contact");
        const top = { diving: true, vy: 200, y: 100 };
        return (
          contact(bot(top), drone({ spiky: true })) === "ouch" &&
          contact(bot(top), drone({ guarded: true })) === "clang" &&
          contact(bot(top), drone({ guarded: true, spiky: true })) === "ouch"
        );
      },
      text: "Spiky drones hurt even a diving robot, and guarded ones clang; spiky is checked first.",
    },
    {
      run: (t) => {
        const contact = fn(t, "contact");
        const side = { vy: 0, y: 140 };
        return (
          contact(bot({ ...side, diving: true }), drone()) === "smash" &&
          contact(bot(side), drone()) === "ouch"
        );
      },
      text: "A dive counts as from above even when the robot hits the drone's side; a plain side touch is <code>\"ouch\"</code>.",
    },
    {
      run: (t) => {
        const contact = fn(t, "contact");
        const side = { vy: 0, y: 140 };
        return (
          contact(bot(side), drone({ harmless: true })) === "safe" &&
          contact(bot(side), drone({ stunned: true })) === "safe" &&
          contact(bot({ ...side, grace: 0.2 }), drone()) === "safe" &&
          contact(bot({ ...side, grace: 0 }), drone({ spiky: true })) === "ouch"
        );
      },
      text: "Side touches are <code>\"safe\"</code> for harmless or stunned drones and during grace time.",
    },
  ],
  title: "Drone Stomper",
};
