// Planet hazards in Astro Stomp, plus the oxygen tanks and checkpoint flags.
//   crusher  a heavy block that shakes, slams to the floor, then winds back up
//   rock     a stalactite that drops when you walk underneath, then regrows
//   geyser   a lava pit that bubbles, then erupts in a tall column of fire
//   laser    an upright beam that blocks the way while it's on
//   beam     a flat beam overhead that stops you jumping while it's on
import { rows, tile, tileAt } from "./levels.js";
import { overlaps } from "./physics.js";

const isFloor = (ch) => ch === "#" || ch === "=";

// The y of the first floor under a span of columns, starting from a row.
function floorBelow(level, x, w, fromY) {
  const left = Math.floor(x / tile);
  const right = Math.floor((x + w - 1) / tile);
  for (let row = Math.floor(fromY / tile); row < rows; row += 1) {
    for (let col = left; col <= right; col += 1) {
      if (isFloor(tileAt(level, col, row))) return row * tile;
    }
  }
  return rows * tile;
}

// Good flag ground: floor under it and either side, and open air above it so
// the flag (and a player sent back to it) stands in the clear.
function openGround(level, col) {
  const floor = [col - 1, col, col + 1].every((c) => tileAt(level, c, 10) === "#");
  const clear = [6, 7, 8, 9].every((row) => tileAt(level, col, row) === ".");
  return floor && clear;
}

// The nearest column to the one asked for that is good flag ground.
function groundColumn(level, col) {
  for (let step = 0; step < level.cols; step += 1) {
    if (openGround(level, col - step)) return col - step;
    if (openGround(level, col + step)) return col + step;
  }
  return col;
}

const builders = {
  beam: ([, from, to, y, phase = 0]) => {
    return { h: 10, phase, w: (to - from + 1) * tile, x: from * tile, y };
  },
  crusher: ([, col, phase = 0], level) => {
    const x = col * tile + tile / 2 - 40;
    return { floor: floorBelow(level, x, 80, 3 * tile), h: 64, phase, rest: 20, w: 80, x, y: 20 };
  },
  flag: ([, wanted], level) => {
    const x = groundColumn(level, wanted) * tile + tile / 2 - 6;
    return { floor: 10 * tile, h: 120, w: 40, x, y: 0 };
  },
  geyser: ([, col, phase = 0]) => {
    return { bottom: 11 * tile + 6, h: 0, phase, w: 40, x: col * tile + tile / 2 - 20, y: 11 * tile };
  },
  laser: ([, col, from, to, phase = 0]) => {
    return { h: (to - from) * tile, phase, w: 10, x: col * tile + tile / 2 - 5, y: from * tile };
  },
  rock: ([, col, row], level) => {
    const x = col * tile + tile / 2 - 15;
    return { floor: floorBelow(level, x, 30, (row + 1) * tile), h: 44, home: row * tile, w: 30, x, y: row * tile };
  },
  tank: ([, col, row]) => {
    return { h: 36, w: 24, x: col * tile + tile / 2 - 12, y: (row + 1) * tile - 36 };
  },
};

export function createHazard(spec, level) {
  const kind = spec[0];
  const made = builders[kind](spec, level);
  if (kind === "flag") made.y = made.floor - made.h;
  return { age: 0, grow: 1, kind, state: "idle", timer: made.phase ?? 0, ...made };
}

const emit = (round, type, hazard) => {
  round.events.push({ type, x: hazard.x + hazard.w / 2, y: hazard.y + hazard.h });
};

// Moves to the next step of a timed cycle when the timer runs out.
function cycle(hazard, steps) {
  if (hazard.timer > 0) return false;
  const index = steps.findIndex(([name]) => name === hazard.state);
  const [next, seconds] = steps[(index + 1) % steps.length];
  hazard.state = next;
  hazard.timer = seconds;
  return true;
}

// Switches a hazard to a new state for a number of seconds.
function goTo(hazard, state, seconds = 0) {
  hazard.state = state;
  hazard.timer = seconds;
}

// Falls until it reaches its floor. Returns true on the frame it lands.
function drop(hazard, dt, pull) {
  hazard.vy += pull * dt;
  hazard.y += hazard.vy * dt;
  if (hazard.y + hazard.h < hazard.floor) return false;
  hazard.y = hazard.floor - hazard.h;
  return true;
}

const crusherSteps = {
  idle: (hazard) => {
    if (hazard.timer <= 0) goTo(hazard, "shake", 0.6);
  },
  rise: (hazard, dt) => {
    hazard.y = Math.max(hazard.rest, hazard.y - 150 * dt);
    if (hazard.y === hazard.rest) goTo(hazard, "idle", 1.6);
  },
  shake: (hazard) => {
    if (hazard.timer > 0) return;
    goTo(hazard, "slam");
    hazard.vy = 0;
  },
  sit: (hazard) => {
    if (hazard.timer <= 0) goTo(hazard, "rise");
  },
  slam: (hazard, dt, round) => {
    if (!drop(hazard, dt, 2600)) return;
    goTo(hazard, "sit", 0.7);
    emit(round, "crusher", hazard);
  },
};

const rockSteps = {
  broken: (hazard) => {
    if (hazard.timer > 0) return;
    goTo(hazard, "regrow", 1);
    hazard.y = hazard.home;
    hazard.grow = 0;
  },
  fall: (hazard, dt, round) => {
    if (!drop(hazard, dt, 1800)) return;
    goTo(hazard, "broken", 3.5);
    emit(round, "rock", hazard);
  },
  idle: (hazard, dt, round) => {
    const { player } = round;
    const gap = Math.abs(player.x + player.w / 2 - (hazard.x + hazard.w / 2));
    if (gap < 70 && player.y > hazard.y) goTo(hazard, "wobble", 0.45);
  },
  regrow: (hazard) => {
    hazard.grow = Math.min(1, 1 - hazard.timer);
    if (hazard.timer <= 0) goTo(hazard, "idle");
  },
  wobble: (hazard) => {
    if (hazard.timer > 0) return;
    goTo(hazard, "fall");
    hazard.vy = 0;
  },
};

const updaters = {
  beam: (hazard) => {
    cycle(hazard, [["idle", 1.6], ["warn", 0.6], ["on", 1.6]]);
  },
  crusher: (hazard, dt, round) => {
    crusherSteps[hazard.state](hazard, dt, round);
  },
  geyser: (hazard, dt, round) => {
    const steps = [["idle", 2.2], ["bubble", 0.8], ["erupt", 1.3]];
    if (cycle(hazard, steps) && hazard.state === "erupt") {
      emit(round, "geyser", hazard);
    }
    const full = hazard.bottom - 2 * tile;
    const target = hazard.state === "erupt" ? full : 0;
    hazard.h += (target - hazard.h) * Math.min(1, dt * 10);
    hazard.y = hazard.bottom - hazard.h;
  },
  laser: (hazard) => {
    cycle(hazard, [["idle", 1.5], ["warn", 0.5], ["on", 1.5]]);
  },
  rock: (hazard, dt, round) => {
    rockSteps[hazard.state](hazard, dt, round);
  },
};

export function updateHazards(round, dt) {
  round.hazards.forEach((hazard) => {
    hazard.age += dt;
    hazard.timer -= dt;
    updaters[hazard.kind]?.(hazard, dt, round);
  });
}

// The part of a hazard that hurts right now, or null if it's harmless.
export function dangerBox(hazard) {
  const live = {
    beam: hazard.state === "on",
    crusher: hazard.state === "slam",
    geyser: hazard.state === "erupt" && hazard.h > 30,
    laser: hazard.state === "on",
    rock: hazard.state === "fall",
  }[hazard.kind];
  return live ? hazard : null;
}

// A crusher that has landed or is winding up is a solid block: shove the
// player out of the side they're nearest.
export function pushOut(player, round) {
  round.hazards.forEach((hazard) => {
    if (hazard.kind !== "crusher" || hazard.state === "slam") return;
    if (!overlaps(player, hazard)) return;
    const middle = hazard.x + hazard.w / 2;
    player.x = player.x + player.w / 2 < middle ? hazard.x - player.w : hazard.x + hazard.w;
    player.vx = 0;
  });
}
