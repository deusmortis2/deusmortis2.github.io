// Lab: a telescope that helps you track a comet, practising Spireclash's
// aim assist and rival maths: a cone from atan, a weight that fades at the
// edge, frame-rate-safe easing and a reaction-time history.
import { fn } from "./checks.js";

const near = (a, b, within = 1e-6) => Math.abs(a - b) <= within;

export default {
  firstTab: "js",
  intro: `
    <p>An observatory's telescope has a <em>comet assist</em>, like
    Spireclash's aim assist. When the eyepiece is pointed close to a comet,
    the motor gently pulls it on target. Its display also runs a little
    behind the real sky, like the rival's reaction time.</p>
    <p>Angles here are plain numbers in radians along one axis. Write the
    maths as top-level <strong>function declarations</strong>; the tests
    only check the functions.</p>`,
  starter: {
    css: "",
    html: `<h1>Star Tracker</h1>
<p>Bonus: animate a comet and let assist() steer a crosshair onto it.</p>
`,
    js: `// Angles are in radians. Times in the history are in milliseconds.

function catchCone(radius, distance) {
}

function pullWeight(off, cone) {
}

function ease(current, target, rate, dt) {
}

function assist(aim, target, cone, rate, dt) {
}

function remember(history, t, value, delay) {
}

function seen(history) {
}
`,
  },
  stories: [
    "<code>catchCone(radius, distance)</code> returns <code>Math.atan(radius / distance)</code>, using a distance of at least <code>0.1</code> (so it never divides by zero), and clamped between <code>0.02</code> and <code>0.3</code>.",
    "<code>pullWeight(off, cone)</code> returns <code>Math.sqrt(1 - off / cone)</code> when <code>off</code> is less than <code>cone</code>, and <code>0</code> otherwise. <code>off</code> may be negative: use its size (<code>Math.abs</code>).",
    "<code>ease(current, target, rate, dt)</code> moves <code>current</code> a share <code>1 - Math.exp(-rate * dt)</code> of the way to <code>target</code>, so many small steps add up to the same as one big one.",
    "<code>assist(aim, target, cone, rate, dt)</code> works out the weight for the gap between <code>aim</code> and <code>target</code>, then returns <code>ease(aim, target, rate * weight, dt)</code>. Outside the cone the aim is returned unchanged.",
    "<code>remember(history, t, value, delay)</code> pushes <code>{ t, value }</code> onto the end of the <code>history</code> array, then drops items from the front while there is a second item whose <code>t</code> is at most <code>t - delay</code>. It returns <code>history</code>.",
    "<code>seen(history)</code> returns the <code>value</code> of the first item in the history, or <code>null</code> if it's empty.",
  ],
  tests: [
    {
      run: (t) => {
        const catchCone = fn(t, "catchCone");
        return (
          near(catchCone(2, 10), Math.atan(0.2)) &&
          catchCone(2, 1000) === 0.02 &&
          catchCone(3, 1) === 0.3 &&
          catchCone(1, 0) === 0.3
        );
      },
      text: "<code>catchCone</code> is <code>atan(radius / distance)</code>, clamped from 0.02 to 0.3, and survives a distance of 0.",
    },
    {
      run: (t) => {
        const pullWeight = fn(t, "pullWeight");
        return (
          near(pullWeight(0, 0.2), 1) &&
          near(pullWeight(0.1, 0.2), Math.sqrt(0.5)) &&
          near(pullWeight(-0.15, 0.2), 0.5) &&
          pullWeight(0.2, 0.2) === 0 &&
          pullWeight(0.5, 0.2) === 0
        );
      },
      text: "<code>pullWeight</code> is 1 dead on, fades with a square root and is 0 at or past the cone's edge, either side.",
    },
    {
      run: (t) => {
        const ease = fn(t, "ease");
        return (
          near(ease(0, 10, 2, 0.5), 10 * (1 - Math.exp(-1))) &&
          ease(4, 9, 0, 1) === 4 &&
          ease(0, 1, 5, 100) <= 1
        );
      },
      text: "<code>ease</code> closes <code>1 - exp(-rate * dt)</code> of the gap, never moves at rate 0 and never overshoots.",
    },
    {
      run: (t) => {
        const ease = fn(t, "ease");
        let small = 0;
        for (let i = 0; i < 10; i += 1) small = ease(small, 1, 5, 0.01);
        const big = ease(0, 1, 5, 0.1);
        return near(small, big, 1e-9) && big > 0.3 && big < 0.5;
      },
      text: "Ten <code>ease</code> steps of 0.01 seconds land exactly where one step of 0.1 does.",
    },
    {
      run: (t) => {
        const assist = fn(t, "assist");
        return assist(1, 1.5, 0.2, 10, 0.1) === 1 && assist(1, 0.5, 0.2, 10, 0.1) === 1;
      },
      text: "Outside the cone, <code>assist</code> returns the aim unchanged.",
    },
    {
      run: (t) => {
        const assist = fn(t, "assist");
        const close = assist(1, 1.02, 0.2, 10, 0.1);
        const edge = assist(1, 1.18, 0.2, 10, 0.1);
        const left = assist(1, 0.9, 0.2, 10, 0.1);
        const w = Math.sqrt(1 - 0.02 / 0.2);
        return (
          near(close, 1 + 0.02 * (1 - Math.exp(-10 * w * 0.1))) &&
          edge > 1 && edge < 1.18 &&
          (close - 1) / 0.02 > (edge - 1) / 0.18 &&
          left < 1 && left > 0.9
        );
      },
      text: "Inside the cone, <code>assist</code> pulls towards the target, harder (as a share of the gap) the closer it already is.",
    },
    {
      run: (t) => {
        const remember = fn(t, "remember");
        const h = [];
        const back = remember(h, 0, 5, 300);
        return back === h && h.length === 1 && h[0].t === 0 && h[0].value === 5;
      },
      text: "<code>remember</code> pushes <code>{ t, value }</code> and returns the same array.",
    },
    {
      run: (t) => {
        const remember = fn(t, "remember");
        const seen = fn(t, "seen");
        if (seen([]) !== null) return false;
        const h = [];
        for (let ms = 0; ms <= 1000; ms += 100) remember(h, ms, ms / 100, 300);
        return seen(h) === 7 && h.length === 4 && h[0].t === 700;
      },
      text: "After samples every 100 ms up to 1000 with a 300 ms delay, <code>seen</code> gives the value from 700 ms. An empty history gives <code>null</code>.",
    },
    {
      run: (t) => {
        const remember = fn(t, "remember");
        const seen = fn(t, "seen");
        const h = [];
        remember(h, 0, "a", 300);
        remember(h, 1000, "b", 300);
        remember(h, 1050, "c", 300);
        if (seen(h) !== "a" || h.length !== 3) return false;
        remember(h, 1400, "d", 300);
        return seen(h) === "c" && h.length === 2;
      },
      text: "The history always keeps the newest item that is at least <code>delay</code> old: after a long gap it holds on to the old one until a newer one is old enough.",
    },
  ],
  title: "Star Tracker",
};
