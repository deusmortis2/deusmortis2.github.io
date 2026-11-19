// Small helpers shared by every alien behaviour: where things are, walking,
// winding up, hovering and reporting events for sounds and dust.
import { rows, tile, tileAt } from "./levels.js";
import { floorAhead, gravity, moveBody } from "./physics.js";

export const centreX = (body) => body.x + body.w / 2;
export const centreY = (body) => body.y + body.h / 2;
export const feet = (body) => body.y + body.h;

export function emit(round, type, body) {
  round.events.push({ type, x: centreX(body), y: feet(body) });
}

// Later planets recharge alien abilities faster.
export const cooldown = (round, seconds) => seconds / round.stage.pace;

export function gapX(a, b) {
  return centreX(b) - centreX(a);
}

export function distance(a, b) {
  return Math.hypot(centreX(b) - centreX(a), centreY(b) - centreY(a));
}

// True when the player stands on roughly the same floor and is close.
export function nearby(enemy, player, reach) {
  const sameFloor = Math.abs(feet(player) - feet(enemy)) < 70;
  return sameFloor && Math.abs(gapX(enemy, player)) < reach;
}

export function faceTowards(enemy, target) {
  enemy.dir = Math.sign(gapX(enemy, target)) || enemy.dir;
}

// True when a grounded walker is standing right at the lip of a drop.
export function atLedge(enemy, level) {
  return enemy.onGround && !floorAhead(enemy, enemy.dir, level);
}

// Stands still (still feeling gravity) for one frame.
function stand(enemy, dt, level) {
  enemy.vx = 0;
  moveBody(enemy, dt, level);
}

// Back and forth, turning at walls and ledges. The ledge is checked before
// stepping, so turning to face the player every frame can't walk it off.
export function walk(enemy, dt, level, speed = enemy.def.speed) {
  if (atLedge(enemy, level)) {
    enemy.dir = -enemy.dir;
    stand(enemy, dt, level);
    return;
  }
  enemy.vx = enemy.dir * speed;
  moveBody(enemy, dt, level);
  if (enemy.hitWall || atLedge(enemy, level)) enemy.dir = -enemy.dir;
}

// Walks towards a target, but waits at the edge rather than following it
// over a drop.
export function chase(enemy, dt, level, target, speed) {
  faceTowards(enemy, target);
  if (atLedge(enemy, level)) {
    stand(enemy, dt, level);
    return;
  }
  walk(enemy, dt, level, speed);
}

// Traces a jump with the given launch speed and says whether it comes down
// on solid ground (or a platform) instead of into a pit or lava.
export function safeLanding(enemy, vx, vy, level) {
  const step = 1 / 60;
  const fall = { ...enemy, vx, vy };
  for (let t = 0; t < 3; t += step) {
    fall.vy += gravity * step;
    const ahead = vx > 0 ? fall.x + fall.w + vx * step : fall.x + vx * step;
    if (!wallAt(level, ahead, fall.y + fall.h / 2)) fall.x += vx * step;
    fall.y += fall.vy * step;
    if (fall.vy > 0 && landsOn(level, fall)) return true;
    if (fall.y > rows * tile) return false;
  }
  return false;
}

function wallAt(level, x, y) {
  return tileAt(level, Math.floor(x / tile), Math.floor(y / tile)) === "#";
}

function landsOn(level, body) {
  const row = Math.floor(feet(body) / tile);
  const left = Math.floor(body.x / tile);
  const right = Math.floor((body.x + body.w - 0.01) / tile);
  for (let col = left; col <= right; col += 1) {
    const ch = tileAt(level, col, row);
    if (ch === "#" || ch === "=") return true;
  }
  return false;
}

// Stands still while the timer runs, then switches state. Returns true on
// the frame it switches.
export function windup(enemy, dt, level, next) {
  enemy.vx = 0;
  if (!enemy.def.flies) moveBody(enemy, dt, level);
  if (enemy.timer > 0) return false;
  enemy.state = next;
  return true;
}

// Moves a flier towards a point, no faster than the given speeds.
export function hoverTo(enemy, x, y, dt, speedX, speedY = speedX) {
  const dx = x - centreX(enemy);
  const dy = y - centreY(enemy);
  enemy.x += Math.sign(dx) * Math.min(Math.abs(dx), speedX * dt);
  enemy.y += Math.sign(dy) * Math.min(Math.abs(dy), speedY * dt);
  if (Math.abs(dx) > 4) enemy.dir = Math.sign(dx);
}

// Never let a flier sink into the floor.
export function keepAboveFloor(enemy) {
  const lowest = 10 * tile - enemy.h - 10;
  enemy.y = Math.min(enemy.y, lowest);
}

// A unit vector from one body's centre to another's.
export function aim(from, to) {
  const x = centreX(to) - centreX(from);
  const y = centreY(to) - centreY(from);
  const length = Math.hypot(x, y) || 1;
  return { x: x / length, y: y / length };
}

// True when the floor tile under a point is solid ground.
export function groundAt(level, x, y) {
  const ch = tileAt(level, Math.floor(x / tile), Math.floor(y / tile));
  return ch === "#" || ch === "=";
}

// Patrol state shared by many walkers: walk, and once the cooldown is over
// and the player is in reach, wind up for an attack.
export function patrolThen(enemy, dt, round, reach, next, windupSeconds) {
  walk(enemy, dt, round.level);
  if (enemy.timer > 0 || !nearby(enemy, round.player, reach)) return false;
  faceTowards(enemy, round.player);
  enemy.state = next;
  enemy.timer = windupSeconds;
  return true;
}
