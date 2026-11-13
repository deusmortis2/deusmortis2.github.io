// Stage layouts for Astro Stomp. Each stage is described in tile columns
// (45px each) on a 12-row grid: row 0 is the top, rows 10 and 11 are the
// floor. Gaps between floor ranges are pits (or lava, on Venus).
export const tile = 45;
export const rows = 12;

// Blocks are [col, row, width, height]. Platforms and spikes are
// [row, fromCol, toCol]. Hazards and items are listed in hazards.js. Pace
// speeds up how often the aliens use their abilities.
export const stages = [
  {
    background: "bg-mars",
    blocks: [
      // A climbing step, then a cliff too tall to jump from the floor.
      [14, 9, 2, 1], [18, 8, 1, 2], [20, 4, 1, 6],
      // A rock gate you have to walk under.
      [40, 0, 2, 8], [44, 8, 2, 2],
      // A low cave roof that stops big jumps.
      [57, 5, 12, 1], [70, 9, 3, 1], [100, 8, 2, 2], [103, 5, 8, 1],
    ],
    enemies: [
      ["stalker", 11], ["brain", 34, 6], ["stalker", 36], ["brute", 48],
      ["stalker", 66], ["brain", 78, 6], ["brute", 95], ["stalker", 108],
    ],
    floor: [[0, 24], [28, 52], [56, 80], [85, 119]],
    hazards: [
      ["rock", 59, 6], ["rock", 67, 6], ["rock", 105, 6], ["rock", 109, 6],
    ],
    items: [["flag", 76], ["tank", 91, 6]],
    length: 120,
    name: "MARS",
    pace: 1,
    palette: "mars",
    platforms: [[7, 30, 35], [7, 88, 93]],
    rocket: 115,
    spikes: [[6, 61, 64]],
    start: 2,
    tagline: "THE RED DESERT",
  },
  {
    background: "bg-venus",
    blocks: [
      [33, 9, 2, 1], [52, 8, 3, 2], [56, 4, 1, 6], [88, 9, 2, 1],
      [93, 0, 2, 8], [107, 9, 2, 1],
    ],
    enemies: [
      ["ravager", 15], ["fly", 36, 2], ["blade", 37], ["ravager", 50],
      ["fly", 72, 2], ["blade", 73], ["fly", 86, 2], ["blade", 90],
      ["ravager", 110], ["fly", 120, 2],
    ],
    floor: [
      [0, 20], [24, 40], [45, 58], [63, 75], [80, 96], [101, 112], [116, 129],
    ],
    hazards: [
      ["geyser", 22, 0], ["crusher", 30, 0.5], ["geyser", 43, 1.2],
      ["crusher", 68, 1.4], ["geyser", 78, 1.8], ["geyser", 99, 0.4],
      ["crusher", 105, 0.2], ["geyser", 114, 1],
    ],
    items: [["tank", 60, 6], ["flag", 65]],
    lava: true,
    length: 130,
    name: "VENUS",
    pace: 1.15,
    palette: "venus",
    platforms: [[7, 41, 45], [7, 58, 63], [6, 82, 86], [7, 96, 101]],
    rocket: 125,
    spikes: [],
    start: 2,
    tagline: "THE TOXIC VOLCANOES",
  },
  {
    background: "bg-saturn",
    blocks: [
      [27, 9, 2, 1], [30, 0, 2, 8], [62, 8, 2, 2], [86, 8, 2, 2],
      [89, 4, 1, 6], [117, 5, 11, 1], [122, 9, 2, 1],
    ],
    enemies: [
      ["stalker", 10], ["brain", 24, 5], ["fly", 36, 2], ["blade", 45],
      ["brute", 60], ["ravager", 66], ["fly", 80, 2], ["brain", 88, 5],
      ["stalker", 103], ["ravager", 107], ["blade", 120], ["brute", 125],
      ["fly", 138, 2], ["brain", 140, 5],
    ],
    floor: [
      [0, 16], [21, 34], [39, 50], [56, 70], [76, 92], [98, 110], [116, 128],
      [134, 149],
    ],
    hazards: [
      ["laser", 12, 0, 10, 0], ["beam", 40, 49, 285, 0.8],
      ["crusher", 59, 0], ["crusher", 67, 1.2], ["laser", 80, 0, 10, 0.5],
      ["beam", 102, 108, 285, 1.2], ["rock", 124, 6], ["rock", 126, 6],
      ["crusher", 137, 0.6], ["laser", 141, 0, 10, 1.5],
    ],
    items: [["tank", 57, 9], ["flag", 82], ["tank", 102, 3]],
    length: 150,
    name: "SATURN",
    pace: 1.3,
    palette: "saturn",
    platforms: [
      [7, 17, 20], [6, 35, 38], [7, 51, 55], [7, 71, 75], [7, 93, 97],
      [4, 100, 104], [7, 111, 115], [7, 129, 133],
    ],
    rocket: 145,
    spikes: [[6, 118, 120]],
    start: 2,
    tagline: "THE RINGED GIANT",
  },
];

// Builds the tile grid: "#" solid, "=" one-way platform, "L" lava, "v" spikes
// hanging from a roof, "." air.
export function buildLevel(stage) {
  const grid = Array.from({ length: rows }, () => {
    return Array(stage.length).fill(".");
  });
  const fill = (col, row, ch) => {
    if (grid[row] && col >= 0 && col < stage.length) grid[row][col] = ch;
  };
  stage.floor.forEach(([from, to]) => {
    for (let col = from; col <= to; col += 1) {
      fill(col, 10, "#");
      fill(col, 11, "#");
    }
  });
  if (stage.lava) {
    for (let col = 0; col < stage.length; col += 1) {
      if (grid[11][col] === ".") fill(col, 11, "L");
    }
  }
  stage.blocks.forEach(([col, row, w, h]) => {
    for (let dx = 0; dx < w; dx += 1) {
      for (let dy = 0; dy < h; dy += 1) fill(col + dx, row + dy, "#");
    }
  });
  const strip = (ch) => {
    return ([row, from, to]) => {
      for (let col = from; col <= to; col += 1) fill(col, row, ch);
    };
  };
  stage.platforms.forEach(strip("="));
  stage.spikes.forEach(strip("v"));
  return {
    cols: stage.length,
    grid,
    height: rows * tile,
    width: stage.length * tile,
  };
}

export function tileAt(level, col, row) {
  if (col < 0 || col >= level.cols) return "#";
  if (row < 0 || row >= rows) return ".";
  return level.grid[row][col];
}
