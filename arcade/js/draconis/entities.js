// Core constants and shared geometry helpers for Deus Draconis. Monsters
// live in monsters.js, their shots in shots.js, the dragon's fireballs and
// power-ups in powers.js and the backgrounds in scenery.js.
export const width = 480;
export const height = 360;

export const dragonBounds = { maxX: 464, maxY: 280, minX: 16, minY: 185 };
export const dragonSpeed = 165;
export const dragonStart = { x: 154, y: 234 };

export const radius = { dragon: 14, fireball: 6, monster: 20 };

export const randomBetween = (min, max) => min + Math.random() * (max - min);

export function overlaps(a, ra, b, rb) {
  return Math.hypot(a.x - b.x, a.y - b.y) < ra + rb;
}

export function onScreen(thing, margin) {
  const inX = thing.x > -margin && thing.x < width + margin;
  return inX && thing.y > -margin && thing.y < height + margin;
}

// Velocity of the given speed pointing from one thing to another, turned by
// an optional angle (radians) so callers can fan out spreads.
export function aimAt(from, to, speed, turn = 0) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x) + turn;
  return { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed };
}

// A small seeded random generator so the painted scenery is the same every
// time the page loads.
export function seeded(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
