// Lab: a pedestrian crossing light, practising Spireclash's game loop: dt
// in capped seconds, timers that count down and a state machine.
import { fn, text } from "./checks.js";

// Steps a crossing forward by `seconds`, in small frames like a game loop.
function run(step, crossing, seconds, dt = 0.05) {
  const frames = Math.round(seconds / dt);
  for (let i = 0; i < frames; i += 1) step(crossing, dt);
}

const near = (a, b, within = 1e-9) => Math.abs(a - b) <= within;

export default {
  firstTab: "js",
  intro: `
    <p>A <em>pelican crossing</em> lets people cross a busy road. Normally
    the cars have right of way. Press the button and, after a short wait,
    the green walking figure lights up; then it flashes to say "hurry";
    then the cars get the road back.</p>
    <p>Build its brain the way Spireclash runs a duel: a
    <strong>state</strong> string, a <strong>timer</strong> in seconds
    that counts down by <code>dt</code> each frame, and a
    <code>step(crossing, dt)</code> function that moves from one state to
    the next when the timer runs out. As before, write each function as a
    top-level <strong>function declaration</strong>.</p>`,
  starter: {
    css: `#light {
  display: inline-block;
  padding: 12px 20px;
  border: 3px solid #333;
  font: bold 24px sans-serif;
}
`,
    html: `<h1>Pelican Crossing</h1>
<p><span id="light">Wait</span></p>
<button id="push" type="button">Press to cross</button>
`,
    js: `// States: "cars", "waiting", "walk", "flashing".
const durations = { flashing: 3, waiting: 2, walk: 5 };

function clampDt(ms) {
}

function newCrossing() {
}

function press(crossing) {
}

function step(crossing, dt) {
}

function render(crossing) {
}
`,
  },
  stories: [
    "<code>clampDt(ms)</code> turns the milliseconds between two frames into seconds, never more than <code>0.05</code> and never below <code>0</code>.",
    "<code>newCrossing()</code> returns a brand-new object <code>{ state: \"cars\", timer: 0 }</code> each time it's called.",
    "<code>press(crossing)</code> only does something in the <code>\"cars\"</code> state: it changes the state to <code>\"waiting\"</code> and sets the timer to <code>durations.waiting</code>. Pressing at any other time changes nothing.",
    "<code>step(crossing, dt)</code> does nothing in <code>\"cars\"</code>. In any other state it takes <code>dt</code> off the timer, and once the timer reaches 0 or below it moves on: <code>\"waiting\"</code> → <code>\"walk\"</code> (timer <code>durations.walk</code>), <code>\"walk\"</code> → <code>\"flashing\"</code> (timer <code>durations.flashing</code>), <code>\"flashing\"</code> → <code>\"cars\"</code> (timer 0).",
    "<code>render(crossing)</code> sets <code>#light</code>'s <code>data-state</code> attribute to the state, and its text to <code>Wait</code> (in <code>\"cars\"</code> and <code>\"waiting\"</code>), <code>Walk</code> or <code>Hurry</code> (in <code>\"flashing\"</code>). <code>#push</code> is disabled in every state but <code>\"cars\"</code>.",
    "When the page loads, it makes one crossing with <code>newCrossing()</code> and renders it. Clicking <code>#push</code> presses that crossing and renders it again.",
    "Bonus (not tested): run a <code>requestAnimationFrame</code> loop that works out <code>dt</code> with <code>clampDt</code>, then calls <code>step</code> and <code>render</code>, so the light changes by itself.",
  ],
  tests: [
    {
      run: (t) => {
        const clampDt = fn(t, "clampDt");
        return (
          near(clampDt(16), 0.016) &&
          near(clampDt(50), 0.05) &&
          clampDt(2000) === 0.05 &&
          clampDt(-10) === 0
        );
      },
      text: "<code>clampDt(16)</code> is <code>0.016</code>, <code>clampDt(2000)</code> is capped at <code>0.05</code> and <code>clampDt(-10)</code> is <code>0</code>.",
    },
    {
      run: (t) => {
        const newCrossing = fn(t, "newCrossing");
        const a = newCrossing();
        const b = newCrossing();
        return a.state === "cars" && a.timer === 0 && a !== b;
      },
      text: "<code>newCrossing()</code> returns a fresh <code>{ state: \"cars\", timer: 0 }</code> each call.",
    },
    {
      run: (t) => {
        const press = fn(t, "press");
        const a = { state: "cars", timer: 0 };
        press(a);
        const b = { state: "walk", timer: 3.5 };
        press(b);
        return a.state === "waiting" && a.timer === 2 &&
          b.state === "walk" && b.timer === 3.5;
      },
      text: "<code>press</code> starts the wait from <code>\"cars\"</code> and does nothing in other states.",
    },
    {
      run: (t) => {
        const step = fn(t, "step");
        const c = { state: "cars", timer: 0 };
        run(step, c, 5);
        return c.state === "cars";
      },
      text: "In <code>\"cars\"</code>, <code>step</code> changes nothing however long it runs.",
    },
    {
      run: (t) => {
        const step = fn(t, "step");
        const c = { state: "waiting", timer: 2 };
        run(step, c, 1.9);
        if (c.state !== "waiting" || !near(c.timer, 0.1, 1e-6)) return false;
        run(step, c, 0.15);
        return c.state === "walk" && c.timer > 4.8 && c.timer <= 5;
      },
      text: "<code>\"waiting\"</code> lasts 2 seconds of steps, then becomes <code>\"walk\"</code> with a timer of 5.",
    },
    {
      run: (t) => {
        const step = fn(t, "step");
        const c = { state: "walk", timer: 5 };
        run(step, c, 4.9);
        if (c.state !== "walk") return false;
        run(step, c, 0.15);
        if (c.state !== "flashing" || c.timer <= 2.8) return false;
        run(step, c, 3.1);
        return c.state === "cars";
      },
      text: "<code>\"walk\"</code> gives way to <code>\"flashing\"</code> after 5 seconds, and <code>\"flashing\"</code> to <code>\"cars\"</code> after 3 more.",
    },
    {
      run: (t) => {
        const step = fn(t, "step");
        const c = { state: "waiting", timer: 0.01 };
        step(c, 0.05);
        return c.state === "walk";
      },
      text: "One step only ever moves on one state: a waiting timer of 0.01 stepped by 0.05 lands on <code>\"walk\"</code>.",
    },
    {
      run: (t) => {
        const render = fn(t, "render");
        const light = t.$("#light");
        const push = t.$("#push");
        const want = { cars: "Wait", flashing: "Hurry", waiting: "Wait", walk: "Walk" };
        return Object.entries(want).every(([state, words]) => {
          render({ state, timer: 1 });
          return (
            light.dataset.state === state &&
            text(light) === words &&
            push.disabled === (state !== "cars")
          );
        });
      },
      text: "<code>render</code> shows each state on <code>#light</code> and disables <code>#push</code> except in <code>\"cars\"</code>.",
    },
    {
      run: (t) => {
        const light = t.$("#light");
        return light?.dataset.state === "cars" && text(light) === "Wait" &&
          !t.$("#push").disabled;
      },
      text: "When the page loads, <code>#light</code> shows the new crossing: <code>data-state=\"cars\"</code> and <code>Wait</code>.",
    },
    {
      run: async (t) => {
        t.$("#push").click();
        await t.wait(30);
        return t.$("#light").dataset.state === "waiting" && t.$("#push").disabled;
      },
      text: "Clicking <code>#push</code> moves the light to <code>\"waiting\"</code> and disables the button.",
    },
  ],
  title: "Pelican Crossing",
};
