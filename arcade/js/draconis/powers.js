// Levelling and power-ups. The dragon earns XP from kills (and slowly just
// by surviving). Every level makes fireballs recharge faster. From level 5,
// and every 3 levels after, the player picks one of three power-ups.
import { onScreen } from "./entities.js";

const baseFireballSpeed = 99;
const firstChoiceLevel = 5;
const choiceEvery = 3;

// Each power has a short card label, a one-line description, an icon
// letter and colour, and how many times it can be taken.
export const powerList = [
  { colour: "#ff9a3c", id: "spread", letter: "S", max: 2, name: "SPREAD FIRE", text: "MORE FIREBALLS IN A FAN" },
  { colour: "#7fe7ff", id: "lightning", letter: "L", max: 2, name: "LIGHTNING", text: "HITS ARC TO A NEARBY FOE" },
  { colour: "#ff4d4d", id: "power", letter: "P", max: 3, name: "BIG FIRE", text: "FIREBALLS HIT HARDER" },
  { colour: "#ffe14d", id: "speed", letter: "Q", max: 2, name: "QUICK FIRE", text: "FASTER FIREBALLS" },
  { colour: "#c78bff", id: "pierce", letter: "X", max: 2, name: "PIERCING", text: "FIRE PASSES THROUGH FOES" },
  { colour: "#7dff7a", id: "homing", letter: "H", max: 1, name: "SEEKER FIRE", text: "FIREBALLS CURVE TO FOES" },
  { colour: "#ffb3d9", id: "ammo", letter: "+", max: 3, name: "BIGGER BELLY", text: "+1 FIREBALL STORED" },
  { colour: "#9ad0ff", id: "wings", letter: "W", max: 2, name: "SWIFT WINGS", text: "FLY FASTER" },
  { colour: "#00e5ff", id: "ward", letter: "O", max: 1, name: "EMBER WARD", text: "BLOCKS A HIT EVERY 20S" },
];

const byId = Object.fromEntries(powerList.map((p) => [p.id, p]));

export function powerInfo(id) {
  return byId[id];
}

export function createProgress() {
  return { choices: 0, level: 1, powers: {}, ward: 0, xp: 0 };
}

export const rank = (progress, id) => progress.powers[id] ?? 0;

export function xpNeeded(level) {
  return 15 + level * 8;
}

// Seconds for one fireball to recharge: 10% quicker each level.
export function refillSeconds(progress) {
  return Math.max(0.5, 2 * 0.9 ** (progress.level - 1));
}

export function maxAmmo(progress) {
  return 3 + rank(progress, "ammo");
}

export function speedBoost(progress) {
  return 1 + 0.2 * rank(progress, "wings");
}

// Adds XP and returns how many levels were gained.
export function addXp(progress, amount) {
  progress.xp += amount;
  let gained = 0;
  while (progress.xp >= xpNeeded(progress.level)) {
    progress.xp -= xpNeeded(progress.level);
    progress.level += 1;
    gained += 1;
    const sinceFirst = progress.level - firstChoiceLevel;
    if (sinceFirst >= 0 && sinceFirst % choiceEvery === 0) progress.choices += 1;
  }
  return gained;
}

// Three different powers that can still be upgraded, picked at random.
export function rollChoices(progress) {
  const open = powerList.filter((p) => rank(progress, p.id) < p.max).map((p) => p.id);
  for (let i = open.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [open[i], open[j]] = [open[j], open[i]];
  }
  return open.slice(0, 3);
}

export function takePower(progress, id) {
  progress.powers[id] = rank(progress, id) + 1;
  if (id === "ward") progress.ward = 0;
}

// The ward is ready when its recharge timer has run down to zero.
export function wardReady(progress) {
  return rank(progress, "ward") > 0 && progress.ward <= 0;
}

// One trigger pull: a single fireball, or a fan of 3 or 5 with spread fire.
export function createFireballs(dragon, progress) {
  const count = 1 + 2 * rank(progress, "spread");
  const speed = baseFireballSpeed * (1 + 0.45 * rank(progress, "speed"));
  const power = rank(progress, "power");
  return Array.from({ length: count }, (_, i) => {
    const angle = (i - (count - 1) / 2) * 0.16;
    return {
      damage: 1 + power,
      hits: new Set(),
      homing: rank(progress, "homing") > 0,
      pierce: rank(progress, "pierce"),
      scale: 1 + 0.25 * power,
      vx: Math.sin(angle) * speed,
      vy: -Math.cos(angle) * speed,
      x: dragon.x,
      y: dragon.y - 20,
    };
  });
}

function nearest(from, targets, skip) {
  let best = null;
  let bestDist = Infinity;
  targets.forEach((t) => {
    if (skip?.has(t)) return;
    const d = Math.hypot(t.x - from.x, t.y - from.y);
    if (d < bestDist) {
      best = t;
      bestDist = d;
    }
  });
  return { dist: bestDist, target: best };
}

export { nearest };

// Moves a fireball; seeker fire turns gently towards the closest foe ahead.
export function updateFireball(f, dt, targets) {
  if (f.homing) {
    const ahead = targets.filter((t) => t.y < f.y);
    const { target } = nearest(f, ahead, f.hits);
    if (target) {
      const speed = Math.hypot(f.vx, f.vy);
      const heading = Math.atan2(f.vy, f.vx);
      let diff = Math.atan2(target.y - f.y, target.x - f.x) - heading;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      const turn = heading + Math.max(-3 * dt, Math.min(3 * dt, diff));
      f.vx = Math.cos(turn) * speed;
      f.vy = Math.sin(turn) * speed;
    }
  }
  f.x += f.vx * dt;
  f.y += f.vy * dt;
  return onScreen(f, 10);
}
