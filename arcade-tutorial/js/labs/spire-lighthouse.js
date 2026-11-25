// Lab: a lighthouse beam that sweeps round to find boats, practising
// Spireclash's angle maths: atan2, sin and cos, the shortest turn and
// turning towards a target a limited amount at a time.
import { fn } from "./checks.js";

const near = (a, b, within = 1e-6) => Math.abs(a - b) <= within;
const turn = Math.PI * 2;
// True when two angles point the same way, whole turns aside.
function sameAngle(a, b) {
  const d = (((a - b) % turn) + turn) % turn;
  return d < 1e-6 || turn - d < 1e-6;
}

export default {
  firstTab: "js",
  intro: `
    <p>A lighthouse stands at <code>(0, 0)</code> on a map. Its beam points
    at an angle in <strong>radians</strong>: <code>0</code> points east
    (along +x) and angles grow anticlockwise, so <code>Math.PI / 2</code>
    points north (along +y). The keeper wants the beam to swing round,
    the short way, to light up boats.</p>
    <p>Write the angle helpers Spireclash uses for aiming, in this map's
    simpler maths layout. Each must be a top-level <strong>function
    declaration</strong>. Drawing the beam on the canvas is a bonus; the
    tests only check the functions.</p>`,
  starter: {
    css: `canvas {
  background: #0b1630;
}
`,
    html: `<h1>Lighthouse Keeper</h1>
<canvas id="sea" width="300" height="300"></canvas>
<p>Bonus: draw the beam with beamPoint() and sweep it towards a boat.</p>
`,
    js: `// Angles are in radians. 0 points east (+x), Math.PI / 2 points north (+y).

function angleDiff(from, to) {
}

function turnTowards(current, target, maxStep) {
}

function beamPoint(angle, length) {
}

function angleTo(x, y) {
}

function isLit(beamAngle, boatX, boatY, halfWidth) {
}
`,
  },
  stories: [
    "<code>angleDiff(from, to)</code> returns the shortest turn from <code>from</code> to <code>to</code>: a number between <code>-Math.PI</code> and <code>Math.PI</code>, positive for anticlockwise. It must work for any angles, including ones many turns round or negative.",
    "<code>turnTowards(current, target, maxStep)</code> turns the short way by at most <code>maxStep</code>: if the shortest turn is no bigger than <code>maxStep</code> it returns <code>target</code>, otherwise <code>current</code> plus or minus <code>maxStep</code>.",
    "<code>beamPoint(angle, length)</code> returns <code>{ x, y }</code>, the point <code>length</code> along the beam: <code>x</code> is <code>Math.cos(angle) * length</code> and <code>y</code> is <code>Math.sin(angle) * length</code>.",
    "<code>angleTo(x, y)</code> returns the angle from the lighthouse to the point <code>(x, y)</code>. Use <code>Math.atan2</code>.",
    "<code>isLit(beamAngle, boatX, boatY, halfWidth)</code> returns <code>true</code> when the boat's angle is within <code>halfWidth</code> of the beam either side (taking the short way round), and <code>false</code> otherwise.",
  ],
  tests: [
    {
      run: (t) => {
        const angleDiff = fn(t, "angleDiff");
        return near(angleDiff(0, 1), 1) && near(angleDiff(1, 0), -1) &&
          near(angleDiff(0.5, 0.5), 0);
      },
      text: "<code>angleDiff</code> gives plain differences for nearby angles: <code>angleDiff(0, 1)</code> is <code>1</code>, <code>angleDiff(1, 0)</code> is <code>-1</code>.",
    },
    {
      run: (t) => {
        const angleDiff = fn(t, "angleDiff");
        return (
          near(angleDiff(0.2, turn - 0.2), -0.4) &&
          near(angleDiff(3, -3), turn - 6) &&
          near(angleDiff(-3, 3), 6 - turn)
        );
      },
      text: "<code>angleDiff</code> crosses the seam the short way: <code>angleDiff(0.2, 2π - 0.2)</code> is <code>-0.4</code> and <code>angleDiff(3, -3)</code> is about <code>0.283</code>.",
    },
    {
      run: (t) => {
        const angleDiff = fn(t, "angleDiff");
        return (
          near(angleDiff(0, 10 * Math.PI + 0.5), 0.5) &&
          near(angleDiff(-7 * turn, 0.25), 0.25) &&
          near(angleDiff(1, 1 - 4 * turn - 0.3), -0.3)
        );
      },
      text: "<code>angleDiff</code> ignores whole turns, positive or negative.",
    },
    {
      run: (t) => {
        const turnTowards = fn(t, "turnTowards");
        return (
          near(turnTowards(0, 0.1, 0.5), 0.1) &&
          near(turnTowards(0, 3, 0.5), 0.5) &&
          near(turnTowards(2, 1, 0.25), 1.75)
        );
      },
      text: "<code>turnTowards</code> lands on a close target and otherwise steps by <code>maxStep</code>.",
    },
    {
      run: (t) => {
        const turnTowards = fn(t, "turnTowards");
        return (
          sameAngle(turnTowards(0.1, turn - 0.1, 0.05), 0.05) &&
          sameAngle(turnTowards(0.1, turn - 0.1, 0.5), turn - 0.1) &&
          sameAngle(turnTowards(3, -3, 0.1), 3.1)
        );
      },
      text: "<code>turnTowards</code> always turns the short way, even across the seam at 0 and 2π.",
    },
    {
      run: (t) => {
        const beamPoint = fn(t, "beamPoint");
        const a = beamPoint(0, 10);
        const b = beamPoint(Math.PI / 2, 4);
        const c = beamPoint(Math.PI, 2);
        return near(a.x, 10) && near(a.y, 0) && near(b.x, 0) && near(b.y, 4) &&
          near(c.x, -2) && near(c.y, 0);
      },
      text: "<code>beamPoint</code> points east at 0, north at π/2 and west at π.",
    },
    {
      run: (t) => {
        const angleTo = fn(t, "angleTo");
        return (
          near(angleTo(5, 0), 0) &&
          near(angleTo(0, 5), Math.PI / 2) &&
          near(Math.abs(angleTo(-1, 0)), Math.PI) &&
          near(angleTo(3, -3), -Math.PI / 4)
        );
      },
      text: "<code>angleTo</code> finds the angle to any point, including behind and below the lighthouse.",
    },
    {
      run: (t) => {
        const isLit = fn(t, "isLit");
        return (
          isLit(0, 10, 1, 0.2) &&
          !isLit(0, 10, 5, 0.2) &&
          isLit(Math.PI / 2, 0.5, 8, 0.1) &&
          !isLit(Math.PI / 2, 0, -8, 0.1)
        );
      },
      text: "<code>isLit</code> lights boats inside the beam and not ones outside it or behind the lighthouse.",
    },
    {
      run: (t) => {
        const isLit = fn(t, "isLit");
        return isLit(3.1, -10, -0.5, 0.1) && isLit(turn - 0.05, 10, 0.3, 0.1);
      },
      text: "<code>isLit</code> works across the seam: a beam at 3.1 lights a boat at about -3.09.",
    },
  ],
  title: "Lighthouse Keeper",
};
