// Lab: a keyboard remote for a robot vacuum, practising Jörmungandr's
// steering: a key lookup table, a short queue of turns that ignores
// repeats and reversals, and keydown/keyup/blur handling.
import { fn, text } from "./checks.js";

const vectors = {
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: -1 },
};

function robot(dir, ...queued) {
  return { dir: vectors[dir], queue: queued.map((name) => vectors[name]) };
}

function names(list) {
  return list
    .map((v) => Object.keys(vectors).find((k) => {
      return vectors[k].x === v?.x && vectors[k].y === v?.y;
    }))
    .join(" ");
}

// Sends a key event to the lab page. Returns true if it was cancelled.
function key(t, type, name, repeat = false) {
  const event = new t.win.KeyboardEvent(type, {
    bubbles: true,
    cancelable: true,
    key: name,
    repeat,
  });
  return !t.win.dispatchEvent(event);
}

export default {
  firstTab: "js",
  intro: `
    <p>A robot vacuum cleaner trundles round a kitchen grid. Build the
    keyboard remote for it, the way Jörmungandr's <code>input.js</code> and
    <code>turn()</code> work. A heading is a little vector like
    <code>{ x: 0, y: -1 }</code> (up), and the robot is an object
    <code>{ dir, queue }</code>: the way it's heading now, and the turns
    waiting to be used, oldest first.</p>
    <p>Write the functions as top-level <strong>function
    declarations</strong> so the tests can find them, and add the keyboard
    listeners so the page reacts to real key presses.</p>`,
  starter: {
    css: "",
    html: `<h1>Robot Vacuum Remote</h1>
<p>Heading: <span id="heading">right</span></p>
<p>Turns queued: <span id="queued">0</span></p>
<p>Turbo: <span id="turbo">off</span></p>
`,
    js: `const headings = {
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: -1 },
};

const vacuum = { dir: headings.right, queue: [] };

function headingForKey(key) {
}

function queueTurn(robot, dir) {
}

function nextHeading(robot) {
}
`,
  },
  stories: [
    "<code>headingForKey(key)</code> returns the heading <em>name</em> for a key: the arrow keys (<code>\"ArrowUp\"</code> and so on) and W, A, S, D give <code>\"up\"</code>, <code>\"left\"</code>, <code>\"down\"</code> or <code>\"right\"</code>, upper or lower case. Any other key gives <code>null</code>. Use a lookup object.",
    "<code>queueTurn(robot, dir)</code> adds the heading vector <code>dir</code> to the end of <code>robot.queue</code>, unless it's the same as the last queued heading (or the current <code>robot.dir</code> if the queue is empty), or the exact reverse of it. At most <strong>3</strong> turns can wait; more are ignored.",
    "<code>nextHeading(robot)</code> takes the oldest turn off the front of the queue (if there is one) and makes it <code>robot.dir</code>. It returns <code>robot.dir</code>.",
    "A <code>keydown</code> listener on <code>window</code> handles steering keys: it calls <code>preventDefault()</code>, and unless <code>event.repeat</code> is true, queues the turn for <code>vacuum</code> and shows the queue length in <code>#queued</code>.",
    "Holding the space bar is turbo: <code>keydown</code> of <code>\" \"</code> calls <code>preventDefault()</code> and sets <code>#turbo</code> to <code>on</code>; its <code>keyup</code>, or the window losing focus (<code>blur</code>), sets it back to <code>off</code>.",
    "Other keys are left alone: no <code>preventDefault()</code>.",
  ],
  tests: [
    {
      run: (t) => {
        const headingForKey = fn(t, "headingForKey");
        return (
          headingForKey("ArrowUp") === "up" &&
          headingForKey("ArrowDown") === "down" &&
          headingForKey("ArrowLeft") === "left" &&
          headingForKey("ArrowRight") === "right" &&
          headingForKey("w") === "up" &&
          headingForKey("A") === "left" &&
          headingForKey("s") === "down" &&
          headingForKey("D") === "right"
        );
      },
      text: "<code>headingForKey</code> maps the arrow keys and WASD (either case) to heading names.",
    },
    {
      run: (t) => {
        const headingForKey = fn(t, "headingForKey");
        return headingForKey("x") === null && headingForKey("Enter") === null &&
          headingForKey(" ") === null;
      },
      text: "Any other key gives <code>null</code>.",
    },
    {
      run: (t) => {
        const queueTurn = fn(t, "queueTurn");
        const r = robot("right");
        queueTurn(r, vectors.right);
        queueTurn(r, vectors.left);
        const before = r.queue.length;
        queueTurn(r, vectors.up);
        return before === 0 && names(r.queue) === "up" && names([r.dir]) === "right";
      },
      text: "Heading right with an empty queue: right and left are ignored, up is queued, and <code>dir</code> doesn't change yet.",
    },
    {
      run: (t) => {
        const queueTurn = fn(t, "queueTurn");
        const r = robot("right", "up");
        queueTurn(r, vectors.down);
        queueTurn(r, vectors.up);
        queueTurn(r, vectors.right);
        return names(r.queue) === "up right";
      },
      text: "Turns are compared with the <em>last queued</em> heading: after up, down and up are ignored but right is queued.",
    },
    {
      run: (t) => {
        const queueTurn = fn(t, "queueTurn");
        const r = robot("right");
        queueTurn(r, vectors.up);
        queueTurn(r, vectors.left);
        queueTurn(r, vectors.down);
        queueTurn(r, vectors.right);
        return names(r.queue) === "up left down";
      },
      text: "No more than 3 turns can wait in the queue.",
    },
    {
      run: (t) => {
        const nextHeading = fn(t, "nextHeading");
        const r = robot("right", "up", "left");
        const first = nextHeading(r);
        const second = nextHeading(r);
        const third = nextHeading(r);
        return (
          names([first]) === "up" &&
          names([second]) === "left" &&
          names([third]) === "left" &&
          r.queue.length === 0 &&
          r.dir === third
        );
      },
      text: "<code>nextHeading</code> uses the queue oldest first, then keeps the current heading once it's empty.",
    },
    {
      run: (t) => {
        const cancelled = key(t, "keydown", "ArrowUp");
        const first = text(t.$("#queued"));
        key(t, "keydown", "ArrowUp", true);
        key(t, "keydown", "ArrowLeft", true);
        const afterRepeats = text(t.$("#queued"));
        key(t, "keydown", "a");
        return cancelled && first === "1" && afterRepeats === "1" &&
          text(t.$("#queued")) === "2";
      },
      text: "Pressing ArrowUp is prevented and queues a turn (<code>#queued</code> shows 1); repeats are ignored; then A queues left (2).",
    },
    {
      run: (t) => {
        const cancelled = key(t, "keydown", " ");
        const held = text(t.$("#turbo"));
        key(t, "keyup", " ");
        const released = text(t.$("#turbo"));
        key(t, "keydown", " ");
        t.win.dispatchEvent(new t.win.Event("blur"));
        return cancelled && held === "on" && released === "off" &&
          text(t.$("#turbo")) === "off";
      },
      text: "Space shows turbo <code>on</code> while held and <code>off</code> on keyup or when the window loses focus.",
    },
    {
      run: (t) => {
        return !key(t, "keydown", "x") && !key(t, "keydown", "Tab") &&
          text(t.$("#queued")) === "0";
      },
      text: "Other keys aren't prevented and don't queue anything.",
    },
  ],
  title: "Robot Vacuum Remote",
};
