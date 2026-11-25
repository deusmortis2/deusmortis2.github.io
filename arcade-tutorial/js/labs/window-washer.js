// Lab: a window-cleaning cradle on a skyscraper, practising delta time,
// a set of held keys, opposite keys cancelling out and clamping.
import { fn } from "./checks.js";

function held(...names) {
  return new Set(names);
}

function near(a, b) {
  return Math.abs(a - b) < 1e-9;
}

export default {
  firstTab: "js",
  intro: `
    <p>A window cleaner rides a cradle up and down the glass front of a
    skyscraper. The player steers it with the arrow keys or WASD, and it
    must never leave the building's face.</p>
    <p>Write the movement logic the way Deus Draconis does: time in
    seconds since the last frame, a <code>Set</code> of the keys held right
    now, and a clamp to keep the cradle in bounds. Write each function as a
    top-level <strong>function declaration</strong> so the tests can find
    it. The preview at the bottom of <code>script.js</code> already uses
    your functions: once they work, click the preview and fly the
    cradle about. The tests only check the functions.</p>`,
  starter: {
    css: `body {
  margin: 0;
  background: #1b1b2f;
  color: #f2f2f2;
  font-family: sans-serif;
}

canvas {
  display: block;
  max-width: 100%;
  border: 2px solid #4a4a6a;
}
`,
    html: `<h1>Window Washer</h1>
<p>Click the building, then use the arrow keys or WASD.</p>
<canvas id="tower" width="320" height="240"></canvas>
`,
    js: `// The cradle moves 120 pixels per second and must stay inside bounds.
const speed = 120;
const bounds = { maxX: 300, maxY: 220, minX: 20, minY: 30 };

function frameSeconds(now, last) {
}

function clamp(value, min, max) {
}

function isHeld(keys, names) {
}

function direction(keys) {
}

function moveCradle(cradle, keys, dt) {
}

// ---- Preview: uses your functions. You don't need to change it. ----
const ctx = document.getElementById("tower").getContext("2d");
const keys = new Set();
let cradle = { x: 160, y: 120 };
let last = performance.now();
addEventListener("keydown", (e) => keys.add(e.key.toLowerCase()));
addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
function frame(now) {
  const dt = frameSeconds(now, last) ?? 0;
  last = now;
  cradle = moveCradle(cradle, keys, dt) ?? cradle;
  ctx.fillStyle = "#2b3a55";
  ctx.fillRect(0, 0, 320, 240);
  ctx.fillStyle = "#7fb7e6";
  for (let x = 10; x < 320; x += 40) {
    for (let y = 10; y < 240; y += 40) ctx.fillRect(x, y, 30, 30);
  }
  ctx.fillStyle = "#ffd400";
  ctx.fillRect(cradle.x - 16, cradle.y - 6, 32, 12);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
`,
  },
  stories: [
    "<code>frameSeconds(now, last)</code> takes two timestamps in milliseconds and returns the time between them in <strong>seconds</strong>, never less than <code>0</code> and never more than <code>0.05</code>.",
    "<code>clamp(value, min, max)</code> returns <code>value</code>, raised to <code>min</code> if it's below it, or lowered to <code>max</code> if it's above it.",
    "<code>isHeld(keys, names)</code> takes a <code>Set</code> of held keys and an array of key names, and returns <code>true</code> if <em>any</em> of the names is in the set, otherwise <code>false</code>.",
    "<code>direction(keys)</code> returns <code>{ x, y }</code> where each is <code>-1</code>, <code>0</code> or <code>1</code>. Right is <code>\"arrowright\"</code> or <code>\"d\"</code>, left is <code>\"arrowleft\"</code> or <code>\"a\"</code>, down is <code>\"arrowdown\"</code> or <code>\"s\"</code>, and up is <code>\"arrowup\"</code> or <code>\"w\"</code>. Holding opposite directions cancels out to <code>0</code>. (Remember: on a canvas, down is <em>positive</em> y.)",
    "<code>moveCradle(cradle, keys, dt)</code> returns a <strong>new</strong> object <code>{ x, y }</code>: the cradle moved <code>speed * dt</code> pixels in its direction on each axis, then clamped to <code>bounds</code>. It must not change the <code>cradle</code> object it was given.",
  ],
  tests: [
    {
      run: (t) => {
        const frameSeconds = fn(t, "frameSeconds");
        return (
          near(frameSeconds(1016, 1000), 0.016) &&
          near(frameSeconds(2040, 2000), 0.04) &&
          frameSeconds(5000, 5000) === 0
        );
      },
      text: "<code>frameSeconds</code> turns milliseconds into seconds: <code>frameSeconds(1016, 1000)</code> is <code>0.016</code>.",
    },
    {
      run: (t) => {
        const frameSeconds = fn(t, "frameSeconds");
        return frameSeconds(13000, 1000) === 0.05 && frameSeconds(999, 1000) === 0;
      },
      text: "<code>frameSeconds</code> caps a long gap at <code>0.05</code> and never goes below <code>0</code>.",
    },
    {
      run: (t) => {
        const clamp = fn(t, "clamp");
        return (
          clamp(50, 0, 100) === 50 &&
          clamp(-7, 0, 100) === 0 &&
          clamp(130, 0, 100) === 100 &&
          clamp(100, 0, 100) === 100
        );
      },
      text: "<code>clamp</code> keeps values inside <code>min</code> to <code>max</code> and leaves values already inside alone.",
    },
    {
      run: (t) => {
        const isHeld = fn(t, "isHeld");
        return (
          isHeld(held("w"), ["arrowup", "w"]) === true &&
          isHeld(held("arrowup", "d"), ["arrowup", "w"]) === true &&
          isHeld(held("s"), ["arrowup", "w"]) === false &&
          isHeld(held(), ["arrowup", "w"]) === false
        );
      },
      text: "<code>isHeld</code> returns <code>true</code> when any of the names is held, and <code>false</code> otherwise.",
    },
    {
      run: (t) => {
        const direction = fn(t, "direction");
        const a = direction(held("arrowright"));
        const b = direction(held("a", "w"));
        const c = direction(held("s"));
        const d = direction(held());
        return (
          a.x === 1 && a.y === 0 &&
          b.x === -1 && b.y === -1 &&
          c.x === 0 && c.y === 1 &&
          d.x === 0 && d.y === 0
        );
      },
      text: "<code>direction</code> reads arrows and WASD: right is <code>x: 1</code>, up is <code>y: -1</code>, down is <code>y: 1</code>.",
    },
    {
      run: (t) => {
        const direction = fn(t, "direction");
        const a = direction(held("arrowleft", "arrowright"));
        const b = direction(held("w", "arrowdown", "d"));
        return a.x === 0 && a.y === 0 && b.x === 1 && b.y === 0;
      },
      text: "Opposite directions cancel out: left and right together give <code>x: 0</code>.",
    },
    {
      run: (t) => {
        const moveCradle = fn(t, "moveCradle");
        const a = moveCradle({ x: 100, y: 100 }, held("arrowright"), 0.5);
        const b = moveCradle({ x: 100, y: 100 }, held("w", "a"), 0.25);
        const c = moveCradle({ x: 100, y: 100 }, held(), 0.05);
        return (
          a.x === 160 && a.y === 100 &&
          b.x === 70 && b.y === 70 &&
          c.x === 100 && c.y === 100
        );
      },
      text: "<code>moveCradle</code> moves <code>speed * dt</code> pixels per held direction: right for 0.5 seconds goes from x 100 to 160.",
    },
    {
      run: (t) => {
        const moveCradle = fn(t, "moveCradle");
        const a = moveCradle({ x: 295, y: 225 }, held("d", "s"), 0.05);
        const b = moveCradle({ x: 22, y: 31 }, held("a", "w"), 0.05);
        return a.x === 300 && a.y === 220 && b.x === 20 && b.y === 30;
      },
      text: "<code>moveCradle</code> clamps the result to <code>bounds</code>, on both axes.",
    },
    {
      run: (t) => {
        const moveCradle = fn(t, "moveCradle");
        const start = { x: 100, y: 100 };
        const moved = moveCradle(start, held("d"), 0.5);
        return (
          moved?.x === 160 && moved !== start &&
          start.x === 100 && start.y === 100
        );
      },
      text: "<code>moveCradle</code> returns a new object and leaves the one it was given unchanged.",
    },
  ],
  title: "Window Washer",
};
