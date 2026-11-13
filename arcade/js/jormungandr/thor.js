// Thor turns up now and then and runs from the serpent. He never attacks.
// Catching him is worth a lot of points; a lightning power-up stuns him
// so he stands still for a few seconds.
import { distance, freeCell } from "./board.js";

export const thorPoints = 300;
const stayFor = 15;
const stepTime = 0.35;
// Further away than this, Thor isn't worried and just wanders.
const panicRange = 7;
export const stunSeconds = 6;

// Seconds until Thor turns up. Each realm makes him wait 2 seconds longer
// than the last, up to Asgard; the loop back to Midgard keeps Asgard's wait.
const thorDelayPerLevel = 2;
const lastRealm = 9;

export function nextThorIn(level) {
  const extra = (Math.min(level, lastRealm) - 1) * thorDelayPerLevel;
  return 16 + extra + Math.random() * 14;
}

// Appears well away from the head. Null if the board is too full.
export function spawnThor(isFree, head) {
  const spot = freeCell(isFree, head, 9);
  if (!spot) return null;
  return {
    age: 0,
    facing: 1,
    fromX: spot.x,
    fromY: spot.y,
    moveClock: 0,
    stunned: 0,
    x: spot.x,
    y: spot.y,
  };
}

const steps = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

function openNeighbours(isFree, x, y) {
  return steps.filter((s) => isFree(x + s.x, y + s.y)).length;
}

// Scores each cell he could step to: far from the head is good, and so is
// room to keep running. A dash of chance stops him being perfect, so he
// can be cornered.
function chooseStep(thor, isFree, head) {
  const panicking = distance(thor, head) <= panicRange;
  let best = null;
  let bestScore = -Infinity;
  steps.forEach((s) => {
    const x = thor.x + s.x;
    const y = thor.y + s.y;
    if (!isFree(x, y)) return;
    const away = distance({ x, y }, head);
    const room = openNeighbours(isFree, x, y);
    const score = panicking
      ? away * 3 + room * 1.5 + Math.random() * 2.5
      : room + Math.random() * 6;
    if (score > bestScore) {
      bestScore = score;
      best = { x, y };
    }
  });
  return best;
}

// Returns false once Thor has had enough and leaves the board.
export function updateThor(thor, dt, isFree, head) {
  thor.age += dt;
  if (thor.stunned > 0) {
    thor.stunned = Math.max(0, thor.stunned - dt);
    thor.moveClock = 1;
    return true;
  }
  if (thor.age >= stayFor) return false;
  thor.moveClock += dt / stepTime;
  if (thor.moveClock < 1) return true;
  thor.moveClock = 0;
  thor.fromX = thor.x;
  thor.fromY = thor.y;
  const next = chooseStep(thor, isFree, head);
  if (!next) return true;
  if (next.x !== thor.x) thor.facing = next.x > thor.x ? 1 : -1;
  thor.x = next.x;
  thor.y = next.y;
  return true;
}

// Where to draw him: part way between his last cell and this one.
export function thorPosition(thor) {
  const t = Math.min(thor.moveClock, 1);
  return {
    x: thor.fromX + (thor.x - thor.fromX) * t,
    y: thor.fromY + (thor.y - thor.fromY) * t,
  };
}

export function thorLeaving(thor) {
  return thor.stunned <= 0 && thor.age > stayFor - 2;
}
