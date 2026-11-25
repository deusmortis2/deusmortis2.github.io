// Lab: catching fireflies in a jar, practising distance, circle overlap,
// point-in-box and box-overlap checks, and splitting a list by a test.
import { fn, sameList } from "./checks.js";

const buttons = [
  { h: 20, w: 60, x: 10, y: 10 },
  { h: 20, w: 60, x: 10, y: 40 },
  { h: 20, w: 60, x: 10, y: 70 },
];

export default {
  firstTab: "js",
  intro: `
    <p>On a summer night, the player sweeps a jar through a meadow full of
    fireflies. Every firefly the jar touches is caught. There are also three
    buttons on the screen (Release, Shake and Lid), and a meadow gate that
    the jar must not bump into.</p>
    <p>Write the collision checks, the same kinds Deus Draconis uses:
    circles for round things, boxes for rectangles. Things are objects with
    a centre <code>x</code>, <code>y</code> and a radius <code>r</code>;
    boxes are objects with a <strong>top-left</strong> <code>x</code>,
    <code>y</code> and a size <code>w</code>, <code>h</code>. Write each
    function as a top-level <strong>function declaration</strong>. The
    preview uses <code>catchFireflies</code>: move the mouse over it to
    sweep the jar about.</p>`,
  starter: {
    css: `body {
  margin: 0;
  background: #0b1020;
  color: #f2f2f2;
  font-family: sans-serif;
}

canvas {
  display: block;
  max-width: 100%;
  border: 2px solid #2c3a2c;
}
`,
    html: `<h1>Firefly Jar</h1>
<p>Caught: <span id="count">0</span></p>
<canvas id="meadow" width="320" height="200"></canvas>
`,
    js: `function distance(a, b) {
}

function circlesTouch(a, b) {
}

function pointInBox(point, box) {
}

function boxesOverlap(a, b) {
}

function buttonAt(buttons, point) {
}

function catchFireflies(jar, flies) {
}

// ---- Preview: uses catchFireflies. You don't need to change it. ----
const canvas = document.getElementById("meadow");
const ctx = canvas.getContext("2d");
const jar = { r: 18, x: 160, y: 100 };
let caught = 0;
let flies = Array.from({ length: 12 }, (_, i) => ({
  r: 4,
  x: 20 + ((i * 97) % 280),
  y: 20 + ((i * 53) % 160),
}));
canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  jar.x = ((e.clientX - rect.left) * canvas.width) / rect.width;
  jar.y = ((e.clientY - rect.top) * canvas.height) / rect.height;
});
function frame(now) {
  const result = catchFireflies(jar, flies);
  if (result) {
    caught += result.caught.length;
    flies = result.left;
    document.getElementById("count").textContent = caught;
  }
  ctx.fillStyle = "#13261a";
  ctx.fillRect(0, 0, 320, 200);
  flies.forEach((f, i) => {
    ctx.fillStyle = Math.sin(now / 200 + i) > 0 ? "#fff27a" : "#a89a2a";
    ctx.fillRect(f.x - 2, f.y - 2, 4, 4);
  });
  ctx.strokeStyle = "#cfe8ff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(jar.x, jar.y, jar.r, 0, Math.PI * 2);
  ctx.stroke();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
`,
  },
  stories: [
    "<code>distance(a, b)</code> returns the straight-line distance between the centres of <code>a</code> and <code>b</code>.",
    "<code>circlesTouch(a, b)</code> returns <code>true</code> when the two circles overlap: the distance between centres is <strong>less than</strong> <code>a.r + b.r</code>. Circles that only just touch (distance exactly equal) don't count.",
    "<code>pointInBox(point, box)</code> returns <code>true</code> when the point is inside the box. Points exactly on an edge count as inside, like the power-up cards in Draconis.",
    "<code>boxesOverlap(a, b)</code> returns <code>true</code> when the boxes overlap in both directions. Boxes that only share an edge don't count, so use strict <code>&lt;</code>.",
    "<code>buttonAt(buttons, point)</code> returns the index of the first box in the <code>buttons</code> array that contains the point, or <code>-1</code> if none does.",
    "<code>catchFireflies(jar, flies)</code> returns <code>{ caught, left }</code>: two new arrays holding the flies that touch the jar and the flies that don't, each in their original order. It must not change the <code>flies</code> array.",
  ],
  tests: [
    {
      run: (t) => {
        const distance = fn(t, "distance");
        return (
          distance({ x: 0, y: 0 }, { x: 3, y: 4 }) === 5 &&
          distance({ x: 10, y: 10 }, { x: 10, y: 10 }) === 0 &&
          distance({ x: 1, y: 2 }, { x: -5, y: -6 }) === 10
        );
      },
      text: "<code>distance</code> gives 5 between <code>(0, 0)</code> and <code>(3, 4)</code>, and works with negative coordinates.",
    },
    {
      run: (t) => {
        const circlesTouch = fn(t, "circlesTouch");
        const jar = { r: 20, x: 0, y: 0 };
        return (
          circlesTouch(jar, { r: 6, x: 25, y: 0 }) === true &&
          circlesTouch(jar, { r: 6, x: 30, y: 0 }) === false &&
          circlesTouch({ r: 3, x: 10, y: 10 }, { r: 3, x: 13, y: 14 }) === true
        );
      },
      text: "<code>circlesTouch</code> is <code>true</code> when the centres are closer than the two radii added together.",
    },
    {
      run: (t) => {
        const circlesTouch = fn(t, "circlesTouch");
        return circlesTouch({ r: 2, x: 0, y: 0 }, { r: 3, x: 0, y: 5 }) === false;
      },
      text: "Circles that only just touch (distance exactly equal to the radii added together) don't count.",
    },
    {
      run: (t) => {
        const pointInBox = fn(t, "pointInBox");
        const box = { h: 20, w: 60, x: 10, y: 40 };
        return (
          pointInBox({ x: 40, y: 50 }, box) === true &&
          pointInBox({ x: 10, y: 40 }, box) === true &&
          pointInBox({ x: 70, y: 60 }, box) === true &&
          pointInBox({ x: 71, y: 50 }, box) === false &&
          pointInBox({ x: 40, y: 39 }, box) === false
        );
      },
      text: "<code>pointInBox</code> counts points inside and on the edges, and nothing outside.",
    },
    {
      run: (t) => {
        const boxesOverlap = fn(t, "boxesOverlap");
        const a = { h: 10, w: 10, x: 0, y: 0 };
        return (
          boxesOverlap(a, { h: 10, w: 10, x: 5, y: 5 }) === true &&
          boxesOverlap(a, { h: 2, w: 2, x: 4, y: 4 }) === true &&
          boxesOverlap({ h: 2, w: 2, x: 4, y: 4 }, a) === true &&
          boxesOverlap(a, { h: 10, w: 10, x: 20, y: 0 }) === false
        );
      },
      text: "<code>boxesOverlap</code> finds overlapping boxes, including one box entirely inside another.",
    },
    {
      run: (t) => {
        const boxesOverlap = fn(t, "boxesOverlap");
        const a = { h: 10, w: 10, x: 0, y: 0 };
        return (
          boxesOverlap(a, { h: 10, w: 10, x: 10, y: 0 }) === false &&
          boxesOverlap(a, { h: 10, w: 10, x: 0, y: 10 }) === false &&
          boxesOverlap(a, { h: 10, w: 10, x: 5, y: 30 }) === false
        );
      },
      text: "Boxes that share only an edge, or overlap sideways but not up and down, don't overlap.",
    },
    {
      run: (t) => {
        const buttonAt = fn(t, "buttonAt");
        return (
          buttonAt(buttons, { x: 30, y: 15 }) === 0 &&
          buttonAt(buttons, { x: 30, y: 75 }) === 2 &&
          buttonAt(buttons, { x: 30, y: 35 }) === -1 &&
          buttonAt(buttons, { x: 200, y: 15 }) === -1
        );
      },
      text: "<code>buttonAt</code> returns the index of the button under the point, or <code>-1</code>.",
    },
    {
      run: (t) => {
        const catchFireflies = fn(t, "catchFireflies");
        const flies = [
          { r: 4, x: 10, y: 0 },
          { r: 4, x: 100, y: 0 },
          { r: 4, x: 0, y: -20 },
          { r: 4, x: 0, y: 40 },
        ];
        const result = catchFireflies({ r: 18, x: 0, y: 0 }, flies);
        return (
          sameList(result.caught, [flies[0], flies[2]]) &&
          sameList(result.left, [flies[1], flies[3]]) &&
          result.caught[0] === flies[0]
        );
      },
      text: "<code>catchFireflies</code> splits the flies into <code>caught</code> and <code>left</code>, keeping their order.",
    },
    {
      run: (t) => {
        const catchFireflies = fn(t, "catchFireflies");
        const flies = [{ r: 4, x: 5, y: 5 }, { r: 4, x: 90, y: 90 }];
        const result = catchFireflies({ r: 18, x: 0, y: 0 }, flies);
        const none = catchFireflies({ r: 18, x: 0, y: 0 }, []);
        return (
          flies.length === 2 &&
          result.caught !== flies &&
          result.left !== flies &&
          none.caught.length === 0 &&
          none.left.length === 0
        );
      },
      text: "<code>catchFireflies</code> returns new arrays, leaves <code>flies</code> unchanged, and copes with an empty meadow.",
    },
  ],
  title: "Firefly Jar",
};
