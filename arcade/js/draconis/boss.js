// The wyrm boss at the end of each stage: a rival dragon with a big health
// bar. It cycles through its stage's attacks, and gets faster and angrier
// below half health.
import { height, width } from "./entities.js";
import { createMonster } from "./monsters.js";
import { ember } from "./shots.js";

export const bossRadius = 38;
const hoverY = 82;

export function createBoss(spec) {
  return {
    age: 0,
    alive: true,
    attack: 0,
    boss: true,
    fade: 0,
    flash: 0,
    hidden: true,
    hp: spec.hp,
    maxHp: spec.hp,
    points: spec.points,
    r: bossRadius,
    spec,
    state: "enter",
    timer: 0,
    x: width / 2,
    y: -90,
  };
}

const enraged = (b) => b.hp <= b.maxHp / 2;
const pace = (b) => (enraged(b) ? 0.7 : 1);
// The boss is drawn upside down, so its mouth is below its centre.
const mouth = (b) => ({ x: b.x, y: b.y + 30 });

function setState(b, state, timer) {
  b.state = state;
  b.timer = timer;
  b.shots = 0;
}

function drift(b, dt) {
  const goal = width / 2 + Math.sin(b.age * 0.6) * 150;
  b.x += Math.max(-90 * dt, Math.min(90 * dt, goal - b.x));
  b.y += (hoverY + Math.sin(b.age * 1.7) * 6 - b.y) * Math.min(1, dt * 3);
}

// Fire breath: a stream of embers that sweeps from one side to the other.
function sweep(b, dt, world) {
  b.timer += dt;
  const count = enraged(b) ? 22 : 16;
  const due = Math.floor(b.timer / 0.11);
  while (b.shots < Math.min(due, count)) {
    const k = b.shots / (count - 1);
    const from = b.flip ? 0.85 : 0.15;
    const angle = Math.PI * (from + (b.flip ? -0.7 : 0.7) * k);
    world.spawnShots([ember(mouth(b), angle, 150)], b.shots % 3 === 0 ? "fire" : null);
    b.shots += 1;
  }
  return b.shots >= count;
}

// Ring burst: a full circle of embers with one gap, twice when enraged.
function ring(b, dt, world) {
  b.timer += dt;
  const bursts = enraged(b) ? 2 : 1;
  const due = b.timer > 0.55 ? 1 + Math.floor((b.timer - 0.55) / 0.45) : 0;
  while (b.shots < Math.min(due, bursts)) {
    const offset = b.shots * 0.2 + Math.random() * 0.4;
    const list = [];
    for (let i = 0; i < 16; i += 1) {
      if (i % 8 === 4) continue;
      list.push(ember(mouth(b), offset + (i / 16) * Math.PI * 2, 105));
    }
    world.spawnShots(list, "slam");
    b.shots += 1;
  }
  return b.shots >= bursts;
}

// Calls in two of the stage's monsters, if there is room for them.
function summon(b, _dt, world) {
  if (world.monsters.filter((m) => m.alive).length < 5) {
    const { minions } = b.spec;
    for (let i = 0; i < 2; i += 1) {
      const kind = minions[Math.floor(Math.random() * minions.length)];
      world.monsters.push(createMonster(kind, 0.9));
    }
    world.spawnShots([], "launch");
  }
  return true;
}

// Dive: a warning band, then a charge straight down and back up.
function dive(b, dt) {
  b.timer += dt;
  if (b.timer < 0.9) {
    b.diveX ??= b.x;
    return false;
  }
  b.x += (b.diveX - b.x) * Math.min(1, dt * 8);
  const t = b.timer - 0.9;
  b.y = t < 0.7 ? hoverY + (height - 40 - hoverY) * (t / 0.7) : height - 40 - (t - 0.7) * 190;
  if (b.y > hoverY || t < 0.7) return false;
  b.diveX = null;
  return true;
}

const attacks = { dive, ring, summon, sweep };

// Returns false once the boss has finished fading out after its defeat.
export function updateBoss(b, dt, world) {
  if (!b.alive) {
    b.fade += dt;
    return b.fade < 1.8;
  }
  b.age += dt;
  b.flash = Math.max(0, b.flash - dt);
  b.hidden = b.state === "enter";
  b.charging = b.state === "dive" && b.timer < 0.9;
  if (b.state === "enter") {
    b.y += 70 * dt;
    if (b.y >= hoverY) setState(b, "idle", 1.4);
    return true;
  }
  if (b.state === "idle") {
    drift(b, dt);
    b.timer -= dt;
    if (b.timer > 0) return true;
    const list = b.spec.attacks;
    setState(b, list[b.attack % list.length], 0);
    b.flip = Math.random() < 0.5;
    b.attack += 1;
    return true;
  }
  const done = attacks[b.state](b, dt, world);
  if (b.state !== "dive") drift(b, dt * 0.3);
  if (done) setState(b, "idle", 1.5 * pace(b));
  return true;
}
