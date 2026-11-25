// Lab: a pirate's treasure map, practising the grid maths from
// Jörmungandr's board.js: cells to pixels and back, staying on the board,
// Manhattan distance and cycling through a list with a counter.
import { fn } from "./checks.js";

function at(value, x, y) {
  return Boolean(value) && value.x === x && value.y === y;
}

function cellIs(value, col, row) {
  return Boolean(value) && value.col === col && value.row === row;
}

export default {
  firstTab: "js",
  intro: `
    <p>A pirate's treasure map is a grid of square tiles, 12 columns by 8
    rows. Each tile is 32 pixels, and the grid is drawn 16 pixels in from
    the left of the canvas and 48 pixels down from the top (to leave room
    for a title). Columns and rows are numbered from 0.</p>
    <p>Write the grid helpers the map needs, the way Jörmungandr's
    <code>board.js</code> does. Use the constants in the starter code
    rather than typing the numbers again. Write each function as a
    top-level <strong>function declaration</strong> so the tests can find
    it. Drawing the map on a canvas is a bonus; the tests only check the
    functions.</p>`,
  starter: {
    css: "",
    html: `<h1>Treasure Map</h1>
<p>Bonus: draw the map on a canvas with the helpers.</p>
`,
    js: `const tile = 32;
const mapX = 16;
const mapY = 48;
const cols = 12;
const rows = 8;
const islands = ["Skull Rock", "Parrot Cove", "Mermaid Lagoon", "Smugglers' Den"];

function tileCentre(col, row) {
}

function onMap(col, row) {
}

function tileAt(px, py) {
}

function stepsBetween(a, b) {
}

function islandFor(day) {
}

function nearestTreasure(from, treasures) {
}
`,
  },
  stories: [
    "<code>tileCentre(col, row)</code> returns <code>{ x, y }</code>: the centre of that tile in canvas pixels.",
    "<code>onMap(col, row)</code> returns <code>true</code> if the tile is on the map and <code>false</code> if it's off any edge.",
    "<code>tileAt(px, py)</code> goes the other way: it returns <code>{ col, row }</code> for the tile under the canvas pixel (<code>px</code>, <code>py</code>), or <code>null</code> if that pixel isn't on the map. Use <code>Math.floor</code>.",
    "<code>stepsBetween(a, b)</code> returns the number of steps between two tiles like <code>{ x: 2, y: 3 }</code> when you can only walk across and up or down, never diagonally (the Manhattan distance).",
    "<code>islandFor(day)</code> returns the island visited on that day. Day 1 is the first island in <code>islands</code>, day 2 the second, and after the last one the voyage starts again from the first.",
    "<code>nearestTreasure(from, treasures)</code> returns the treasure in the array that is the fewest steps from <code>from</code>. On a tie, the one that comes first in the array wins. An empty array gives <code>null</code>.",
  ],
  tests: [
    {
      run: (t) => {
        const tileCentre = fn(t, "tileCentre");
        return (
          at(tileCentre(0, 0), 32, 64) &&
          at(tileCentre(3, 2), 128, 128) &&
          at(tileCentre(11, 7), 384, 288)
        );
      },
      text: "<code>tileCentre(0, 0)</code> is <code>{ x: 32, y: 64 }</code> and <code>tileCentre(3, 2)</code> is <code>{ x: 128, y: 128 }</code>.",
    },
    {
      run: (t) => {
        const onMap = fn(t, "onMap");
        return (
          onMap(0, 0) === true &&
          onMap(11, 7) === true &&
          onMap(5, 3) === true &&
          onMap(12, 0) === false &&
          onMap(0, 8) === false &&
          onMap(-1, 3) === false &&
          onMap(4, -1) === false
        );
      },
      text: "<code>onMap</code> is <code>true</code> from (0, 0) to (11, 7) and <code>false</code> past every edge.",
    },
    {
      run: (t) => {
        const tileAt = fn(t, "tileAt");
        return (
          cellIs(tileAt(16, 48), 0, 0) &&
          cellIs(tileAt(47, 79), 0, 0) &&
          cellIs(tileAt(48, 80), 1, 1) &&
          cellIs(tileAt(130, 130), 3, 2) &&
          cellIs(tileAt(399, 303), 11, 7)
        );
      },
      text: "<code>tileAt</code> finds the tile under a pixel, including pixels on a tile's top-left edge.",
    },
    {
      run: (t) => {
        const tileAt = fn(t, "tileAt");
        return (
          tileAt(15, 60) === null &&
          tileAt(30, 47) === null &&
          tileAt(400, 100) === null &&
          tileAt(100, 304) === null
        );
      },
      text: "<code>tileAt</code> returns <code>null</code> for pixels in the margin or past the map.",
    },
    {
      run: (t) => {
        const stepsBetween = fn(t, "stepsBetween");
        return (
          stepsBetween({ x: 2, y: 5 }, { x: 6, y: 2 }) === 7 &&
          stepsBetween({ x: 6, y: 2 }, { x: 2, y: 5 }) === 7 &&
          stepsBetween({ x: 4, y: 4 }, { x: 4, y: 4 }) === 0
        );
      },
      text: "<code>stepsBetween</code> counts steps across plus steps up or down, whichever way round the tiles are.",
    },
    {
      run: (t) => {
        const islandFor = fn(t, "islandFor");
        return (
          islandFor(1) === "Skull Rock" &&
          islandFor(4) === "Smugglers' Den" &&
          islandFor(5) === "Skull Rock" &&
          islandFor(10) === "Parrot Cove"
        );
      },
      text: "<code>islandFor</code> starts at Skull Rock on day 1 and wraps round after day 4.",
    },
    {
      run: (t) => {
        const islandFor = fn(t, "islandFor");
        return /islands\.length/.test(t.code.js) && islandFor(403) === "Mermaid Lagoon";
      },
      text: "<code>islandFor</code> uses <code>islands.length</code>, so adding an island just works.",
    },
    {
      run: (t) => {
        const nearestTreasure = fn(t, "nearestTreasure");
        const a = { name: "gold", x: 9, y: 1 };
        const b = { name: "gems", x: 2, y: 6 };
        const c = { name: "map", x: 5, y: 5 };
        return (
          nearestTreasure({ x: 3, y: 4 }, [a, b, c]) === b &&
          nearestTreasure({ x: 9, y: 0 }, [a, b, c]) === a
        );
      },
      text: "<code>nearestTreasure</code> returns the treasure object the fewest steps away.",
    },
    {
      run: (t) => {
        const nearestTreasure = fn(t, "nearestTreasure");
        const a = { x: 1, y: 3 };
        const b = { x: 3, y: 1 };
        return (
          nearestTreasure({ x: 2, y: 2 }, [a, b]) === a &&
          nearestTreasure({ x: 2, y: 2 }, [b, a]) === b &&
          nearestTreasure({ x: 0, y: 0 }, []) === null
        );
      },
      text: "On a tie the first treasure wins, and an empty list gives <code>null</code>.",
    },
  ],
  title: "Treasure Map",
};
