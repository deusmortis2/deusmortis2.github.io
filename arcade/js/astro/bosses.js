// The boss at the end of every planet. Each boss's attacks live in
// bossesInner.js and bossesOuter.js; this file makes the boss, runs the
// shared bookkeeping and hands out damage.
//
// Bosses are only hurt while they're "open" (tired, stuck, dazed: the
// moment after a big attack). A smash or stomp then takes one point off.
// Blaster bolts chip a little off any time they're not guarded. Flags the
// attacks set each frame: open, guarded (stomps clang off), harmless,
// spiky (stomping hurts), hidden (underground), ghost (can't be touched),
// aura (a radius that hurts). Looks: alpha, glow, crouch, sink, shake.
import { innerBosses } from "./bossesInner.js";
import { outerBosses } from "./bossesOuter.js";
import { arenaCols, tile } from "./levels.js";

const bossKinds = { ...innerBosses, ...outerBosses };
export const bossPoints = 2000;

export function arenaOf(level) {
  return { left: level.arena * tile, right: (level.arena + arenaCols) * tile };
}

export function createBoss(kind, level) {
  const def = bossKinds[kind];
  const { left, right } = arenaOf(level);
  const x = left + (right - left) * 0.72 - def.w / 2;
  const boss = {
    age: 0,
    angry: false,
    def,
    dir: -1,
    flash: 0,
    grace: 0,
    h: def.h,
    hp: def.hp,
    kind,
    max: def.hp,
    sink: 0,
    state: "intro",
    timer: 1.2,
    turn: 0,
    w: def.w,
    x,
    y: 10 * tile - def.h,
  };
  clearFlags(boss);
  def.start?.(boss, level);
  return boss;
}

function clearFlags(boss) {
  boss.alpha = 1;
  boss.aura = 0;
  boss.crouch = 0;
  boss.ghost = false;
  boss.glow = null;
  boss.guarded = false;
  boss.harmless = false;
  boss.hidden = false;
  boss.open = false;
  boss.shake = false;
  boss.spiky = false;
}

export function updateBoss(boss, dt, round) {
  boss.age += dt;
  boss.timer -= dt;
  boss.flash = Math.max(0, boss.flash - dt);
  boss.grace = Math.max(0, boss.grace - dt);
  if (boss.dying !== undefined) {
    boss.dying += dt;
    return;
  }
  clearFlags(boss);
  if (boss.state === "intro") {
    boss.harmless = true;
    if (boss.timer <= 0) boss.def.begin(boss, round);
    return;
  }
  boss.def.update(boss, dt, round);
  const { left, right } = arenaOf(round.level);
  boss.x = Math.min(Math.max(boss.x, left), right - boss.w);
}

// The part of the boss that can be touched: lower while it crouches, and
// shorter while it's half sunk into the ground.
export function bossBox(boss) {
  const top = boss.y + boss.h * boss.crouch + boss.sink;
  return { h: boss.y + boss.h - top, w: boss.w, x: boss.x, y: top };
}

// Takes health off. Returns true if that beat the boss.
export function hurtBoss(boss, amount) {
  if (boss.grace > 0 || boss.dying !== undefined) return false;
  boss.hp = Math.max(0, boss.hp - amount);
  boss.flash = 0.3;
  boss.grace = amount >= 1 ? 0.7 : 0.05;
  if (!boss.angry && boss.hp <= boss.max / 2) boss.angry = true;
  if (boss.hp > 0) return false;
  boss.dying = 0;
  return true;
}

export const bossName = (boss) => boss.def.name;
