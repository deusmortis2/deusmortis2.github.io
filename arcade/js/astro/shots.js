// Things the aliens and bosses throw. Most hurt on touch; frost freezes the
// player instead, and a mind wave swaps left and right. Some leave a patch on the ground where they land (fire,
// acid, a poison cloud) and bombs burst into shards.
import { tile, tileAt } from "./levels.js";
import { addPatch } from "./patches.js";

// Gravity shots fall; "runs" shots slide along the floor and stop at a
// ledge; "ghost" shots pass through walls; "pierce" shots keep going after
// they hit you (a boss's ring has to fly back to it).
const kinds = {
  acid: { gravity: 900, h: 16, life: 4, w: 14 },
  bomb: { burst: true, gravity: 900, h: 24, life: 5, w: 24 },
  boulder: { gravity: 1100, h: 34, life: 5, w: 34 },
  canister: { gravity: 900, h: 22, land: "poison", life: 4, w: 18 },
  fireball: { gravity: 900, h: 22, land: "fire", life: 4, w: 22 },
  frost: { effect: "freeze", h: 26, life: 0.7, w: 26 },
  glob: { gravity: 900, h: 24, land: "acid", life: 4, w: 24 },
  icicle: { gravity: 1400, h: 30, life: 3, w: 14 },
  laser: { h: 8, life: 2, w: 54 },
  lavarock: { gravity: 900, h: 30, land: "fire", life: 5, w: 30 },
  mindwave: { effect: "confuse", h: 56, life: 2.2, runs: true, w: 28 },
  orb: { ghost: true, h: 20, life: 5, w: 20 },
  ring: { ghost: true, h: 34, life: 8, pierce: true, w: 120 },
  seed: { gravity: 900, h: 16, life: 4, w: 16 },
  shard: { gravity: 700, h: 14, life: 4, w: 14 },
  spark: { h: 18, life: 0.9, runs: true, w: 22 },
  stinger: { h: 12, life: 3, w: 12 },
  wave: { h: 26, life: 1.25, runs: true, w: 30 },
};

const at = (level, x, y) => {
  return tileAt(level, Math.floor(x / tile), Math.floor(y / tile));
};

// X and y are the centre of the shot, except floor runners, which sit on
// the floor with y as the ground under them.
export function fireShot(round, kind, x, y, vx, vy = 0) {
  const def = kinds[kind];
  const top = def.runs ? y - def.h : y - def.h / 2;
  const shot = {
    age: 0,
    def,
    h: def.h,
    kind,
    vx,
    vy,
    w: def.w,
    x: x - def.w / 2,
    y: top,
  };
  round.shots.push(shot);
  return shot;
}

// Throws a falling shot so it lands at a target point after a set time.
export function lob(round, kind, from, target, seconds) {
  const g = kinds[kind].gravity;
  const vx = (target.x - from.x) / seconds;
  const vy = (target.y - from.y) / seconds - 0.5 * g * seconds;
  return fireShot(round, kind, from.x, from.y, vx, vy);
}

// Where a falling shot came to rest, or null if it's still flying.
function landing(shot, level) {
  const cx = shot.x + shot.w / 2;
  const below = at(level, cx, shot.y + shot.h);
  const floor = below === "#" || below === "=" || below === "L";
  if (!floor || shot.vy <= 0) return null;
  return Math.floor((shot.y + shot.h) / tile) * tile;
}

function blocked(shot, level) {
  const { def } = shot;
  const cx = shot.x + shot.w / 2;
  const cy = shot.y + shot.h / 2;
  if (!def.ghost && at(level, cx, cy) === "#") return true;
  if (def.gravity) return landing(shot, level) !== null;
  if (!def.runs) return false;
  // A floor runner dies when the floor under its leading edge runs out.
  const front = shot.vx > 0 ? shot.x + shot.w : shot.x;
  const ground = at(level, front, shot.y + shot.h + 2);
  return ground !== "#" && ground !== "=";
}

function splash(round, shot) {
  const { def } = shot;
  const cx = shot.x + shot.w / 2;
  const floorY = landing(shot, round.level);
  if (def.land && floorY !== null) addPatch(round, def.land, cx, floorY);
  if (!def.burst) return;
  const y = shot.y;
  [-1, 0, 1].forEach((dir) => {
    fireShot(round, "shard", cx, y, dir * 190, -420 + Math.abs(dir) * 80);
  });
}

// Moves every shot. Returns the ones that hit a wall or the floor, so the
// game can show a little splash where they landed.
export function updateShots(round, dt) {
  const { level } = round;
  const splashes = [];
  round.shots = round.shots.filter((shot) => {
    const { def } = shot;
    shot.age += dt;
    if (shot.steer) shot.steer(shot, dt);
    shot.vy += (def.gravity ?? 0) * dt;
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;
    const outside = shot.y > level.height || shot.x < -60;
    if (outside || shot.age > def.life) return false;
    if (!blocked(shot, level)) return true;
    splash(round, shot);
    splashes.push(shot);
    return false;
  });
  return splashes;
}
