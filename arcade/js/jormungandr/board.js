// The playing field for Jörmungandr: a grid of cells inside the 960x540
// canvas, the nine realms, and helpers for finding free cells.
export const width = 960;
export const height = 540;
export const cell = 40;
export const cols = 22;
export const rows = 11;
export const boardX = 40;
export const boardY = 56;

// One realm per level. After Asgard the journey starts again at Midgard,
// a little faster each time round. `floor` tints the board cells.
export const realms = [
  { floor: "#1f1d40", name: "MIDGARD" },
  { floor: "#1a2a44", name: "JOTUNHEIM" },
  { floor: "#183236", name: "ALFHEIM" },
  { floor: "#1a3224", name: "VANAHEIM" },
  { floor: "#2e2420", name: "SVARTALFHEIM" },
  { floor: "#232c3e", name: "NIFLHEIM" },
  { floor: "#3a1a1a", name: "MUSPELHEIM" },
  { floor: "#281c36", name: "HELHEIM" },
  { floor: "#3a3018", name: "ASGARD" },
];

export function realmIndex(level) {
  return (level - 1) % realms.length;
}

export function realmFor(level) {
  return realms[realmIndex(level)];
}

// The snake starts in the middle row heading right, head first.
export const startCells = [
  { x: 7, y: 5 },
  { x: 6, y: 5 },
  { x: 5, y: 5 },
  { x: 4, y: 5 },
];

export function cellKey(x, y) {
  return y * cols + x;
}

export function inside(x, y) {
  return x >= 0 && y >= 0 && x < cols && y < rows;
}

// Centre of a cell in canvas pixels.
export function centreX(x) {
  return boardX + x * cell + cell / 2;
}

export function centreY(y) {
  return boardY + y * cell + cell / 2;
}

export function distance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

// A random cell for which isFree(x, y) is true and that is at least
// `away` steps from `from`. Tries at random first, then scans, so it
// still finds the last free cell on a crowded board. Null if none.
export function freeCell(isFree, from = null, away = 0) {
  const ok = (x, y) => isFree(x, y) && (!from || distance(from, { x, y }) >= away);
  for (let i = 0; i < 200; i += 1) {
    const x = Math.floor(Math.random() * cols);
    const y = Math.floor(Math.random() * rows);
    if (ok(x, y)) return { x, y };
  }
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      if (ok(x, y)) return { x, y };
    }
  }
  return null;
}
