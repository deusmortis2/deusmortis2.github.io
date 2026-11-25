// Lab: a hiking map of areas joined edge to edge, practising Tidesong's
// region exits and its clamped camera.
import { fn } from "./checks.js";

const trails = {
  cave: { exits: { north: [[0, 1, "meadow"]] }, height: 300, width: 600 },
  forest: { exits: { west: [[0, 1, "meadow"]] }, height: 600, width: 1600 },
  lake: { exits: { north: [[0, 1, "meadow"]] }, height: 400, width: 500 },
  meadow: {
    exits: {
      east: [[0, 1, "forest"]],
      south: [[0, 0.5, "lake"], [0.5, 1, "cave"]],
    },
    height: 1000,
    width: 2000,
  },
};

// Compares plain objects, ignoring the order of their keys.
function same(a, b) {
  const sorted = (o) => {
    if (!o || typeof o !== "object") return JSON.stringify(o);
    return JSON.stringify(Object.keys(o).sort().map((k) => [k, o[k]]));
  };
  return sorted(a) === sorted(b);
}

export default {
  firstTab: "js",
  intro: `
    <p>A national park wants an online trail map. The park is split into
    <em>areas</em>, each a big rectangle, joined edge to edge like
    Tidesong's ocean regions. Walk off an edge and you arrive in the
    neighbouring area, if there is one.</p>
    <p>Write the three functions the map needs, as top-level
    <strong>function declarations</strong> so the tests can find them. The
    <code>areas</code> data in the starter shows the shape: each exit is
    <code>[from, to, areaId]</code>, with <code>from</code> and
    <code>to</code> as fractions along that edge.</p>`,
  starter: {
    css: "",
    html: `<h1>Trail Map</h1>
<p>Bonus: draw the map here with a canvas and a moving walker.</p>
`,
    js: `// Positions are in pixels from the area's top-left corner.
const areas = {
  meadow: {
    width: 2000,
    height: 1000,
    exits: {
      east: [[0, 1, "forest"]],
      south: [[0, 0.5, "lake"], [0.5, 1, "cave"]],
    },
  },
  forest: { width: 1600, height: 600, exits: { west: [[0, 1, "meadow"]] } },
  lake: { width: 500, height: 400, exits: { north: [[0, 1, "meadow"]] } },
  cave: { width: 600, height: 300, exits: { north: [[0, 1, "meadow"]] } },
};

function fit(pos, size, len) {
}

function cameraFor(area, x, y, view) {
}

function exitAt(area, x, y) {
}
`,
  },
  stories: [
    "<code>fit(pos, size, len)</code> works out one camera coordinate: <code>pos</code> is the walker's position, <code>size</code> the screen's width (or height), <code>len</code> the area's. It centres the walker (<code>pos - size / 2</code>) but never goes below 0 or above <code>len - size</code>. If the area is no bigger than the screen, it returns <code>(len - size) / 2</code> instead, which centres the whole area.",
    "<code>cameraFor(area, x, y, view)</code> returns <code>{ camX, camY }</code> using <code>fit</code> with <code>view.width</code> and <code>area.width</code>, then <code>view.height</code> and <code>area.height</code>.",
    "<code>exitAt(area, x, y)</code> returns <code>null</code> while the point is inside the area (0 to width, 0 to height, edges included).",
    "Past an edge, <code>exitAt</code> returns <code>{ side, to }</code>: <code>side</code> is <code>\"north\"</code> (y below 0), <code>\"south\"</code> (y above height), <code>\"west\"</code> (x below 0) or <code>\"east\"</code> (x above width), checked in that order. <code>to</code> is the id of the area whose exit covers how far along that edge the point is (x / width for north and south, y / height for east and west), or <code>null</code> if no exit covers it.",
  ],
  tests: [
    {
      run: (t) => {
        const fit = fn(t, "fit");
        return fit(1000, 800, 2000) === 600 && fit(400, 800, 1000) === 0;
      },
      text: "<code>fit</code> centres the walker: <code>fit(1000, 800, 2000)</code> is 600, and <code>fit(400, 800, 1000)</code> is 0.",
    },
    {
      run: (t) => {
        const fit = fn(t, "fit");
        return fit(100, 800, 2000) === 0 && fit(1950, 800, 2000) === 1200;
      },
      text: "<code>fit</code> clamps at both ends: near the start it's 0, near the end it's <code>len - size</code>.",
    },
    {
      run: (t) => {
        const fit = fn(t, "fit");
        return fit(250, 800, 500) === -150 && fit(10, 600, 600) === 0;
      },
      text: "An area no bigger than the screen is centred: <code>fit(250, 800, 500)</code> is -150.",
    },
    {
      run: (t) => {
        const cameraFor = fn(t, "cameraFor");
        const view = { height: 450, width: 800 };
        return (
          same(cameraFor(trails.meadow, 1000, 500, view), { camX: 600, camY: 275 }) &&
          same(cameraFor(trails.lake, 100, 390, view), { camX: -150, camY: -25 })
        );
      },
      text: "<code>cameraFor</code> returns <code>{ camX, camY }</code> for both directions.",
    },
    {
      run: (t) => {
        const exitAt = fn(t, "exitAt");
        return (
          exitAt(trails.meadow, 500, 500) === null &&
          exitAt(trails.meadow, 0, 0) === null &&
          exitAt(trails.meadow, 2000, 1000) === null
        );
      },
      text: "<code>exitAt</code> returns <code>null</code> inside the area, edges included.",
    },
    {
      run: (t) => {
        const exitAt = fn(t, "exitAt");
        return (
          same(exitAt(trails.meadow, 2001, 300), { side: "east", to: "forest" }) &&
          same(exitAt(trails.forest, -1, 300), { side: "west", to: "meadow" })
        );
      },
      text: "Walking off the east edge of the meadow leads to the forest, and back west again.",
    },
    {
      run: (t) => {
        const exitAt = fn(t, "exitAt");
        return (
          same(exitAt(trails.meadow, 400, 1001), { side: "south", to: "lake" }) &&
          same(exitAt(trails.meadow, 1600, 1001), { side: "south", to: "cave" })
        );
      },
      text: "The meadow's south edge is split: the left half leads to the lake, the right half to the cave.",
    },
    {
      run: (t) => {
        const exitAt = fn(t, "exitAt");
        return (
          same(exitAt(trails.meadow, 500, -1), { side: "north", to: null }) &&
          same(exitAt(trails.meadow, -1, 500), { side: "west", to: null }) &&
          same(exitAt(trails.lake, 100, 401), { side: "south", to: null })
        );
      },
      text: "An edge with no exit there gives <code>{ side, to: null }</code>.",
    },
  ],
  title: "Trail Map",
};
