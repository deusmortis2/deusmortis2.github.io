// Lab: a moon rover's hop, practising the platformer movement from Astro
// Stomp: easing speed towards a target, gravity with a top falling speed,
// landing on a floor, coyote time and a shorter hop when jump is let go.
import { fn } from "./checks.js";

function near(a, b) {
  return typeof a === "number" && Math.abs(a - b) < 0.001;
}

function rover(extra) {
  return { h: 40, onGround: false, vx: 0, vy: 0, w: 30, x: 0, y: 0, ...extra };
}

export default {
  firstTab: "js",
  intro: `
    <p>A little moon rover bounces across a crater field. Write the maths
    that moves it, the same way the astronaut in Astro Stomp moves. The
    rover is a plain object like
    <code>{ x, y, w, h, vx, vy, onGround, coyote }</code>: <code>x</code> and
    <code>y</code> are its top-left corner in pixels, <code>vx</code> and
    <code>vy</code> its speed in pixels per second (positive <code>vy</code>
    is <em>down</em>), and <code>dt</code> is the time since the last frame
    in seconds.</p>
    <p>Write each function as a top-level <strong>function
    declaration</strong> so the tests can find it. Several of them change
    the rover object they're given. Drawing the rover on a canvas is a
    bonus; the tests only check the functions.</p>`,
  starter: {
    css: "",
    html: `<h1>Moon Rover</h1>
<p>Bonus: draw the rover on a canvas and make it hop.</p>
`,
    js: `// Positive vy is down the screen. dt is in seconds.

function approach(value, target, step) {
}

function fall(rover, dt, gravity, maxFall) {
}

function land(rover, floorY) {
}

function tryJump(rover, pressed, power) {
}

function cutJump(rover, held, cap) {
}
`,
  },
  stories: [
    "<code>approach(value, target, step)</code> moves <code>value</code> towards <code>target</code> by at most <code>step</code>, and never past it. It returns the new value.",
    "<code>fall(rover, dt, gravity, maxFall)</code> adds <code>gravity * dt</code> to <code>rover.vy</code>, caps <code>vy</code> at <code>maxFall</code>, then moves <code>rover.y</code> by <code>vy * dt</code> (using the capped speed). It returns the rover.",
    "<code>land(rover, floorY)</code>: if the rover's feet (<code>y + h</code>) have reached or passed <code>floorY</code> while it is moving down or still (<code>vy &gt;= 0</code>), put its feet exactly on the floor, set <code>vy</code> to 0 and <code>onGround</code> to <code>true</code>. Otherwise set <code>onGround</code> to <code>false</code>. It returns the rover.",
    "<code>tryJump(rover, pressed, power)</code>: if <code>pressed</code> is true and <code>rover.coyote</code> is above 0 (it left the ground only a moment ago, or is still on it), set <code>vy</code> to <code>-power</code>, set <code>coyote</code> to 0 and <code>onGround</code> to <code>false</code>, and return <code>true</code>. Otherwise change nothing and return <code>false</code>.",
    "<code>cutJump(rover, held, cap)</code>: if jump is <em>not</em> held and the rover is rising faster than <code>cap</code> (<code>vy &lt; -cap</code>), slow it to <code>-cap</code>. That's what makes a tap a short hop. It returns the rover.",
  ],
  tests: [
    {
      run: (t) => {
        const approach = fn(t, "approach");
        return (
          approach(0, 300, 50) === 50 &&
          approach(280, 300, 50) === 300 &&
          approach(100, -300, 40) === 60 &&
          approach(-290, -300, 40) === -300 &&
          approach(7, 7, 10) === 7
        );
      },
      text: "<code>approach</code> steps towards the target from either side and stops exactly on it.",
    },
    {
      run: (t) => {
        const r = rover({ vy: 0, y: 100 });
        const back = fn(t, "fall")(r, 0.1, 1000, 600);
        return back === r && near(r.vy, 100) && near(r.y, 110);
      },
      text: "<code>fall(rover, 0.1, 1000, 600)</code> from still gives <code>vy</code> 100 and moves <code>y</code> from 100 to 110, and returns the same rover.",
    },
    {
      run: (t) => {
        const r = rover({ vy: 580, y: 0 });
        fn(t, "fall")(r, 0.1, 1000, 600);
        return near(r.vy, 600) && near(r.y, 60);
      },
      text: "<code>fall</code> never lets <code>vy</code> go above <code>maxFall</code>, and moves with the capped speed.",
    },
    {
      run: (t) => {
        const r = rover({ vy: -300, y: 100 });
        fn(t, "fall")(r, 0.1, 1000, 600);
        return near(r.vy, -200) && near(r.y, 80);
      },
      text: "<code>fall</code> slows a rising rover: <code>vy</code> -300 becomes -200 and it still moves up by 20.",
    },
    {
      run: (t) => {
        const land = fn(t, "land");
        const r = rover({ vy: 250, y: 470 });
        const back = land(r, 500);
        return back === r && r.y === 460 && r.vy === 0 && r.onGround === true;
      },
      text: "A rover whose feet have sunk past the floor is put back on top of it, stopped and marked <code>onGround</code>.",
    },
    {
      run: (t) => {
        const land = fn(t, "land");
        const high = rover({ onGround: true, vy: 50, y: 300 });
        land(high, 500);
        const rising = rover({ onGround: true, vy: -400, y: 470 });
        land(rising, 500);
        return (
          high.onGround === false && high.y === 300 && high.vy === 50 &&
          rising.onGround === false && rising.vy === -400
        );
      },
      text: "<code>land</code> leaves a rover in the air alone (but sets <code>onGround</code> to <code>false</code>), and doesn't catch one that is moving up.",
    },
    {
      run: (t) => {
        const tryJump = fn(t, "tryJump");
        const r = rover({ coyote: 0.05, onGround: true, vy: 0 });
        const jumped = tryJump(r, true, 760);
        return jumped === true && r.vy === -760 && r.coyote === 0 &&
          r.onGround === false;
      },
      text: "With coyote time left, <code>tryJump(rover, true, 760)</code> returns <code>true</code>, sets <code>vy</code> to -760 and uses up the coyote time.",
    },
    {
      run: (t) => {
        const tryJump = fn(t, "tryJump");
        const late = rover({ coyote: 0, vy: 120 });
        const idle = rover({ coyote: 0.1, onGround: true, vy: 0 });
        return (
          tryJump(late, true, 760) === false && late.vy === 120 &&
          tryJump(idle, false, 760) === false && idle.vy === 0 &&
          idle.coyote === 0.1
        );
      },
      text: "No jump without coyote time, and no jump without a press: both return <code>false</code> and change nothing.",
    },
    {
      run: (t) => {
        const cutJump = fn(t, "cutJump");
        const r = rover({ vy: -700 });
        const back = cutJump(r, false, 260);
        return back === r && r.vy === -260;
      },
      text: "Letting go of jump while rising fast cuts <code>vy</code> to <code>-cap</code>.",
    },
    {
      run: (t) => {
        const cutJump = fn(t, "cutJump");
        const held = rover({ vy: -700 });
        const slow = rover({ vy: -100 });
        const falling = rover({ vy: 300 });
        return (
          cutJump(held, true, 260) === held && held.vy === -700 &&
          cutJump(slow, false, 260) === slow && slow.vy === -100 &&
          cutJump(falling, false, 260) === falling && falling.vy === 300
        );
      },
      text: "<code>cutJump</code> leaves the speed alone while jump is held, when rising slowly, or when falling.",
    },
  ],
  title: "Moon Rover Hop",
};
