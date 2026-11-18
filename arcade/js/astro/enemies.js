// Making and updating aliens. What each alien does lives in the moves*.js
// files; this sets up their bodies and clears the per-frame flags those
// behaviours set:
//   spiky     stomping it hurts you        guarded   stomps clang off
//   harmless  touching it is safe          ghost     can't be touched at all
//   hidden    underground (a sand mound)   aura      radius that hurts (px)
//   reach     how far a bite sticks out in front (px)
// and the looks the renderer reads: alpha, glow, tint, spin, flipY, shake.
import { tile } from "./levels.js";
import { kinds } from "./minions.js";
import { spriteSizes } from "./spriteSizes.js";

const defaultBox = [0.72, 0.88];

function body(kind, small) {
  const def = kinds[kind];
  const [sw, sh] = spriteSizes[def.art];
  const scale = (def.scale ?? 1) * (small ? 0.6 : 1);
  const [bx, by] = def.box ?? defaultBox;
  return {
    def,
    h: Math.round(sh * scale * by),
    scale,
    w: Math.round(sw * scale * bx),
  };
}

function fresh(kind, x, y, made) {
  return {
    age: Math.random() * 10,
    dir: -1,
    flash: 0,
    hp: made.def.hp ?? 1,
    kind,
    // A second cooldown for abilities that run alongside the main one.
    spit: 1 + Math.random(),
    state: "patrol",
    timer: 0.5 + Math.random(),
    vx: 0,
    vy: 0,
    ...made,
    home: { x, y },
    x,
    y,
  };
}

// From a stage list entry: [kind, col, row]. Row is the tile the alien's
// feet rest on top of, less one (9 means standing on the floor). Fliers
// hover with their middle at that row instead.
export function createEnemy([kind, col, row = 9]) {
  const made = body(kind, false);
  const x = col * tile + tile / 2 - made.w / 2;
  const y = made.def.flies
    ? row * tile + tile / 2 - made.h / 2
    : (row + 1) * tile - made.h;
  const enemy = fresh(kind, x, y, made);
  made.def.setup?.(enemy, row);
  return enemy;
}

// For aliens born mid-fight (split slugs, spiderlings). X is the middle and
// y the ground under them.
export function spawnEnemy({ dir = 1, kind, small = false, x, y }) {
  const made = body(kind, small);
  const enemy = fresh(kind, x - made.w / 2, y - made.h, made);
  enemy.dir = dir;
  enemy.small = small;
  enemy.timer = 0.4;
  return enemy;
}

function clearFlags(enemy) {
  enemy.alpha = 1;
  enemy.aura = 0;
  enemy.ghost = false;
  enemy.glow = null;
  enemy.guarded = false;
  enemy.harmless = false;
  enemy.hidden = false;
  enemy.reach = 0;
  enemy.shake = false;
  enemy.sight = false;
  enemy.spiky = false;
  enemy.spin = 0;
  enemy.tint = null;
}

export function updateEnemy(enemy, dt, round) {
  enemy.age += dt;
  enemy.flash = Math.max(0, enemy.flash - dt);
  if (enemy.dying !== undefined) {
    enemy.dying += dt;
    return;
  }
  clearFlags(enemy);
  // Hanging crawlers keep their upside-down look until they drop.
  enemy.flipY = enemy.state === "hang";
  enemy.def.move(enemy, dt, round);
  if (enemy.y > round.level.height + 200) enemy.gone = true;
}

// A stunned or dazed alien can't hurt anyone and can be stomped without a
// smash.
export const isStunned = (enemy) => enemy.state === "stunned";

// The alien's body for collisions, stretched forward while it bites.
export function enemyBox(enemy) {
  if (!enemy.reach) return enemy;
  const forward = enemy.dir > 0;
  return {
    h: enemy.h,
    w: enemy.w + enemy.reach,
    x: forward ? enemy.x : enemy.x - enemy.reach,
    y: enemy.y,
  };
}
