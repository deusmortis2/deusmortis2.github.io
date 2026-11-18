// Stage grids for Astro Stomp. Each stage is described in tile columns (45px
// each) on a 12-row grid: row 0 is the top, rows 10 and 11 are the floor.
// Gaps between floor ranges are pits (or lava, where a stage has it). Every
// stage ends in a boss arena: a walled, flat room 21 columns wide whose left
// gate shuts behind the player.
import { innerStages } from "./stagesInner.js";
import { outerStages } from "./stagesOuter.js";

export const tile = 45;
export const rows = 12;
export const arenaCols = 21;

export const stages = [...innerStages, ...outerStages];

// Builds the tile grid: "#" solid, "=" one-way platform, "L" lava, "v" spikes
// hanging from a roof, "^" thorns growing up from the floor, "." air.
export function buildLevel(stage) {
  const length = stage.arena.from + arenaCols + 1;
  const grid = Array.from({ length: rows }, () => {
    return Array(length).fill(".");
  });
  const fill = (col, row, ch) => {
    if (grid[row] && col >= 0 && col < length) grid[row][col] = ch;
  };
  const floor = [...stage.floor, [stage.arena.from - 6, length - 1]];
  floor.forEach(([from, to]) => {
    for (let col = from; col <= to; col += 1) {
      fill(col, 10, "#");
      fill(col, 11, "#");
    }
  });
  if (stage.lava) {
    for (let col = 0; col < length; col += 1) {
      if (grid[11][col] === ".") fill(col, 11, "L");
    }
  }
  // The arena's far wall.
  for (let row = 0; row < 10; row += 1) fill(length - 1, row, "#");
  stage.blocks.forEach(([col, row, w, h]) => {
    for (let dx = 0; dx < w; dx += 1) {
      for (let dy = 0; dy < h; dy += 1) fill(col + dx, row + dy, "#");
    }
  });
  const strip = (ch, offset = 0) => {
    return ([row, from, to]) => {
      for (let col = from; col <= to; col += 1) fill(col + offset, row, ch);
    };
  };
  stage.platforms.forEach(strip("="));
  stage.arena.platforms.forEach(strip("=", stage.arena.from));
  (stage.spikes ?? []).forEach(strip("v"));
  (stage.thorns ?? []).forEach(strip("^"));
  const icy = new Set();
  (stage.ice ?? []).forEach(([from, to]) => {
    for (let col = from; col <= to; col += 1) icy.add(col);
  });
  return {
    arena: stage.arena.from,
    cols: length,
    grid,
    height: rows * tile,
    icy,
    width: length * tile,
  };
}

// Shuts (or opens) the arena gate: the column just left of the arena.
export function setGate(level, shut) {
  const col = level.arena - 1;
  for (let row = 0; row < 10; row += 1) level.grid[row][col] = shut ? "#" : ".";
}

export function tileAt(level, col, row) {
  if (col < 0 || col >= level.cols) return "#";
  if (row < 0 || row >= rows) return ".";
  return level.grid[row][col];
}
