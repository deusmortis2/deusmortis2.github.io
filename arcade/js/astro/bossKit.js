// Helpers shared by the boss attack patterns.
import { centreX, centreY } from "./enemyKit.js";
import { arenaCols, tile } from "./levels.js";

export const floorY = 10 * tile;

export function arena(round) {
  const left = round.level.arena * tile;
  const right = left + arenaCols * tile;
  return { left, mid: (left + right) / 2, right };
}

export function go(boss, state, seconds = 0) {
  boss.state = state;
  boss.timer = seconds;
}

// Picks the next attack from a list, in order, looping round.
export function nextAttack(boss, list) {
  const attack = list[boss.turn % list.length];
  boss.turn += 1;
  return attack;
}

export function face(boss, target) {
  boss.dir = Math.sign(centreX(target) - centreX(boss)) || boss.dir;
}

// Walks sideways towards an x (the boss's middle), facing that way.
export function stepTo(boss, x, speed, dt) {
  const dx = x - centreX(boss);
  if (Math.abs(dx) > 2) boss.dir = Math.sign(dx);
  boss.x += Math.sign(dx) * Math.min(Math.abs(dx), speed * dt);
  return Math.abs(dx) <= 2;
}

// Flies the boss's middle towards a point. Returns true once it's there.
export function flyTo(boss, x, y, speed, dt) {
  const dx = x - centreX(boss);
  const dy = y - centreY(boss);
  const length = Math.hypot(dx, dy);
  if (length < 3) return true;
  const step = Math.min(length, speed * dt);
  boss.x += (dx / length) * step;
  boss.y += (dy / length) * step;
  return false;
}

export function emitAt(round, type, x, y) {
  round.events.push({ type, x, y });
}

// A random x inside the arena, kept clear of the walls.
export function randomX(round, margin = 60) {
  const { left, right } = arena(round);
  return left + margin + Math.random() * (right - left - margin * 2);
}

export function clampX(round, x, margin = 30) {
  const { left, right } = arena(round);
  return Math.min(Math.max(x, left + margin), right - margin);
}
