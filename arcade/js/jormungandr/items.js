// Foods and power-ups on the board. An apple is always waiting; the other
// foods and the power-ups turn up now and then and vanish if left too long.
import { freeCell } from "./board.js";

export const foods = {
  apple: { grow: 1, label: "FOOD", points: 10 },
  boar: { grow: 1, label: "BOAR", points: 100 },
  egg: { grow: 2, label: "GOLDEN EGG", points: 20 },
  rune: { grow: 1, label: "RUNE", points: 50 },
};

export const powers = {
  bolt: { colour: "#7fe7ff", name: "ZAP THOR" },
  potion: { colour: "#39ff14", name: "SHIELD" },
  star: { colour: "#ff9a3c", name: "SPEED BOOST" },
};

// How often each kind appears (seconds, with up to `spread` either way)
// and how long it stays.
const schedule = {
  boar: { every: 24, life: 8, spread: 6 },
  egg: { every: 17, life: 10, spread: 5 },
  power: { every: 14, life: 9, spread: 4 },
  rune: { every: 11, life: 10, spread: 4 },
};

const powerKinds = Object.keys(powers);

function rollTimer(kind) {
  const { every, spread } = schedule[kind];
  return every + (Math.random() * 2 - 1) * spread;
}

export function createItems() {
  const timers = {};
  Object.keys(schedule).forEach((kind) => {
    timers[kind] = rollTimer(kind);
  });
  return { list: [], timers };
}

export function itemAt(items, x, y) {
  return items.list.find((item) => item.x === x && item.y === y) ?? null;
}

export function isPower(item) {
  return item.kind in powers;
}

function place(items, kind, isFree, head) {
  // Not right under the serpent's nose, so it has to go and get it.
  const spot = freeCell((x, y) => isFree(x, y) && !itemAt(items, x, y), head, 3);
  if (!spot) return;
  const life = kind === "apple" ? Infinity : schedule[kind === "power" ? "power" : kind].life;
  const real = kind === "power" ? powerKinds[Math.floor(Math.random() * powerKinds.length)] : kind;
  items.list.push({ age: 0, kind: real, life, ...spot });
}

// `isFree(x, y)` says whether a cell is on the board and clear of the snake and
// Thor. `head` is the snake's head cell.
export function updateItems(items, dt, isFree, head) {
  items.list.forEach((item) => {
    item.age += dt;
  });
  items.list = items.list.filter((item) => item.age < item.life);
  if (!items.list.some((item) => item.kind === "apple")) place(items, "apple", isFree, head);
  Object.keys(schedule).forEach((kind) => {
    items.timers[kind] -= dt;
    if (items.timers[kind] > 0) return;
    items.timers[kind] = rollTimer(kind);
    const already = kind === "power" ? items.list.some(isPower) : items.list.some((item) => item.kind === kind);
    if (!already) place(items, kind, isFree, head);
  });
}

export function removeItem(items, item) {
  items.list = items.list.filter((other) => other !== item);
}
