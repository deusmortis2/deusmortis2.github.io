// Things the aliens throw: spinning discs, psychic orbs, acid drops and the
// shock waves that roll out from a brute's stomp.
import { tile, tileAt } from "./levels.js";

const kinds = {
  acid: { gravity: 900, h: 16, life: 4, w: 14 },
  disc: { h: 22, life: 3, w: 22 },
  orb: { h: 20, life: 4.5, w: 20 },
  wave: { h: 26, life: 1.25, w: 30 },
};

const at = (level, x, y) => {
  return tileAt(level, Math.floor(x / tile), Math.floor(y / tile));
};

// X and y are the centre of the shot, except a wave, which sits on the floor
// with y as the ground under it.
export function fireShot(round, kind, x, y, vx, vy = 0) {
  const def = kinds[kind];
  const top = kind === "wave" ? y - def.h : y - def.h / 2;
  round.shots.push({
    age: 0,
    h: def.h,
    kind,
    vx,
    vy,
    w: def.w,
    x: x - def.w / 2,
    y: top,
  });
}

function blocked(shot, level) {
  const cx = shot.x + shot.w / 2;
  const cy = shot.y + shot.h / 2;
  if (at(level, cx, cy) === "#") return true;
  if (shot.kind === "acid") {
    const below = at(level, cx, shot.y + shot.h);
    return below === "=" || below === "L" || below === "v";
  }
  if (shot.kind !== "wave") return false;
  // A wave dies when the floor under its leading edge runs out.
  const front = shot.vx > 0 ? shot.x + shot.w : shot.x;
  const ground = at(level, front, shot.y + shot.h + 2);
  return ground !== "#" && ground !== "=";
}

// Moves every shot. Returns the ones that hit a wall or the floor, so the
// game can show a little splash where they landed.
export function updateShots(round, dt) {
  const { level } = round;
  const splashes = [];
  round.shots = round.shots.filter((shot) => {
    const def = kinds[shot.kind];
    shot.age += dt;
    shot.vy += (def.gravity ?? 0) * dt;
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;
    const outside = shot.y > level.height || shot.x < -60;
    if (outside || shot.age > def.life) return false;
    if (!blocked(shot, level)) return true;
    splashes.push(shot);
    return false;
  });
  return splashes;
}
