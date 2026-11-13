// Monster projectiles. Every monster has its own shot with its own movement,
// so each one asks the player to dodge in a different way.
import { aimAt, onScreen, overlaps, radius } from "./entities.js";

const axeGravity = 170;
const beamHalfWidth = 9;
const wispTurn = 1.9;

// Goblin axe: lobbed in an arc so it lands where the dragon was standing.
export function axe(from, target, flightSecs = 1.5) {
  const vx = (target.x - from.x) / flightSecs;
  const vy = (target.y - from.y - 0.5 * axeGravity * flightSecs ** 2) / flightSecs;
  return { age: 0, r: 6, type: "axe", vx, vy, x: from.x, y: from.y + 10 };
}

// Griffin feathers: a fan aimed at the dragon that flutters side to side.
export function featherFan(from, target, count = 5) {
  return Array.from({ length: count }, (_, i) => {
    const turn = (i - (count - 1) / 2) * 0.22;
    return {
      age: 0,
      r: 4,
      type: "feather",
      ...aimAt(from, target, 125, turn),
      x: from.x,
      y: from.y,
    };
  });
}

// Eye beam: a warning line first, then a column of light straight down.
export function beam(owner, warnSecs = 1) {
  return {
    age: 0,
    fireSecs: 0.6,
    owner,
    r: beamHalfWidth,
    type: "beam",
    warnSecs,
    x: owner.x,
    y: owner.y + 14,
  };
}

// Orc boulder: falls toward the dragon, then bursts into shards mid-air.
export function boulder(from, target) {
  return {
    age: 0,
    burstY: Math.max(from.y + 70, target.y - 70),
    r: 9,
    type: "boulder",
    ...aimAt(from, target, 95),
    x: from.x,
    y: from.y + 12,
  };
}

function shards(from, count) {
  const offset = Math.random() * Math.PI;
  return Array.from({ length: count }, (_, i) => {
    const angle = offset + (i / count) * Math.PI * 2;
    return {
      age: 0,
      r: 3,
      spin: angle,
      type: "shard",
      vx: Math.cos(angle) * 115,
      vy: Math.sin(angle) * 115,
      x: from.x,
      y: from.y,
    };
  });
}

// Skeleton arrows: fast and straight, fired in a tight volley.
export function arrowVolley(from, angle, count = 3) {
  return Array.from({ length: count }, (_, i) => {
    const turn = angle + (i - (count - 1) / 2) * 0.2;
    return {
      age: 0,
      r: 3,
      type: "arrow",
      vx: Math.cos(turn) * 230,
      vy: Math.sin(turn) * 230,
      x: from.x,
      y: from.y,
    };
  });
}

// Gargoyle wisp: slow, but it turns to follow the dragon until it fizzles.
export function wisp(from, target, turn) {
  return {
    age: 0,
    life: 4,
    r: 5,
    trail: [],
    type: "wisp",
    ...aimAt(from, target, 80, turn),
    x: from.x,
    y: from.y,
  };
}

// Wyrm ember: a plain glowing fireball flying in a straight line.
export function ember(from, angle, speed) {
  return {
    age: 0,
    r: 5,
    type: "ember",
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    x: from.x,
    y: from.y,
  };
}

function steer(shot, target, dt) {
  const heading = Math.atan2(shot.vy, shot.vx);
  const wanted = Math.atan2(target.y - shot.y, target.x - shot.x);
  let diff = wanted - heading;
  diff = Math.atan2(Math.sin(diff), Math.cos(diff));
  const limit = wispTurn * dt;
  const angle = heading + Math.max(-limit, Math.min(limit, diff));
  const speed = Math.hypot(shot.vx, shot.vy);
  shot.vx = Math.cos(angle) * speed;
  shot.vy = Math.sin(angle) * speed;
}

const movers = {
  axe(shot, dt) {
    shot.vy += axeGravity * dt;
  },
  beam() {},
  boulder(shot, _dt, world) {
    if (shot.y < shot.burstY) return;
    shot.dead = true;
    world.spawnShots(shards(shot, 7));
    world.effects.push({ age: 0, type: "dust", x: shot.x, y: shot.y });
  },
  feather(shot, dt) {
    // Flutter sideways across the direction of travel.
    const wobble = Math.cos(shot.age * 9) * 0.6 * dt;
    shot.x -= shot.vy * wobble;
    shot.y += shot.vx * wobble;
  },
  wisp(shot, dt, world) {
    if (shot.age < 3) steer(shot, world.dragon, dt);
    shot.trail.unshift({ x: shot.x, y: shot.y });
    shot.trail.length = Math.min(shot.trail.length, 8);
    if (shot.age > shot.life) shot.dead = true;
  },
};

// Returns false once the shot should be removed.
export function updateShot(shot, dt, world) {
  shot.age += dt;
  if (shot.type === "beam") {
    const warning = shot.age < shot.warnSecs;
    if (warning && !shot.owner.alive) return false;
    return shot.age < shot.warnSecs + shot.fireSecs;
  }
  shot.x += (shot.vx ?? 0) * dt;
  shot.y += (shot.vy ?? 0) * dt;
  movers[shot.type]?.(shot, dt, world);
  if (shot.dead) return false;
  return onScreen(shot, 20);
}

export function beamFiring(shot) {
  return shot.age >= shot.warnSecs;
}

export function shotHits(shot, dragon) {
  if (shot.type !== "beam") return overlaps(shot, shot.r, dragon, radius.dragon * 0.8);
  if (!beamFiring(shot)) return false;
  const inColumn = Math.abs(dragon.x - shot.x) < shot.r + radius.dragon * 0.6;
  return inColumn && dragon.y > shot.y;
}
