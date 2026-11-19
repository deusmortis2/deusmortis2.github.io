// Alien behaviours for the gas giants, Jupiter and Saturn.
import {
  centreX,
  centreY,
  cooldown,
  distance,
  emit,
  faceTowards,
  feet,
  gapX,
  hoverTo,
  keepAboveFloor,
  nearby,
  safeLanding,
  walk,
  windup,
} from "./enemyKit.js";
import { floorAhead, moveBody } from "./physics.js";
import { fireShot } from "./shots.js";
import { shove } from "./status.js";

// Runs a fixed loop of timed states, e.g. [["calm", 2], ["charge", 0.7]].
// Returns true on the frame the state changes.
export function loop(enemy, round, steps) {
  const index = steps.findIndex(([name]) => name === enemy.state);
  if (index === -1) {
    [[enemy.state, enemy.timer]] = steps;
    return true;
  }
  if (enemy.timer > 0) return false;
  const [next, seconds] = steps[(index + 1) % steps.length];
  enemy.state = next;
  enemy.timer = index === steps.length - 1 ? cooldown(round, seconds) : seconds;
  return true;
}

// Storm jelly: drifts after you, crackles, then zaps the air around it.
// Touching (or stomping) it mid-zap hurts.
export function zapper(enemy, dt, round) {
  const { player } = round;
  enemy.timer -= dt;
  const changed = loop(enemy, round, [["calm", 2.4], ["charge", 0.7], ["zap", 1.2]]);
  if (changed && enemy.state === "zap") emit(round, "zap", enemy);
  const homeX = enemy.home.x + enemy.w / 2;
  const x = Math.min(Math.max(centreX(player), homeX - 350), homeX + 350);
  hoverTo(enemy, x, player.y - 60 + Math.sin(enemy.age * 2) * 16, dt, 55, 60);
  keepAboveFloor(enemy);
  if (enemy.state === "charge") enemy.glow = "#9cf0ff";
  if (enemy.state !== "zap") return;
  enemy.aura = 90;
  enemy.spiky = true;
}

// Band beetle: curls into a ball and rolls at you, bouncing off walls. A
// rolling ball can't be stomped; it's dizzy for a moment after.
export function roller(enemy, dt, round) {
  const { level, player } = round;
  enemy.timer -= dt;
  if (enemy.state === "stunned") {
    if (enemy.timer <= 0) enemy.state = "patrol";
    return;
  }
  if (enemy.state === "curl") {
    enemy.spin = enemy.dir * 0.3;
    if (windup(enemy, dt, level, "roll")) enemy.timer = 2.6;
    return;
  }
  if (enemy.state === "roll") {
    enemy.guarded = true;
    enemy.spin = enemy.dir;
    enemy.vx = enemy.dir * 430;
    moveBody(enemy, dt, level);
    const ledge = enemy.onGround && !floorAhead(enemy, enemy.dir, level);
    if (enemy.hitWall || ledge) {
      enemy.dir = -enemy.dir;
      emit(round, "clang", enemy);
    }
    if (enemy.timer > 0) return;
    enemy.state = "stunned";
    enemy.timer = 1.4;
    return;
  }
  walk(enemy, dt, level);
  if (enemy.timer > 0 || !nearby(enemy, player, 380)) return;
  faceTowards(enemy, player);
  enemy.state = "curl";
  enemy.timer = 0.5;
}

// Gale wyvern: flaps hard, then blows a gust that shoves you away, maybe
// right off a ledge.
export function gale(enemy, dt, round) {
  const { player } = round;
  enemy.timer -= dt;
  loop(enemy, round, [["idle", 2.8], ["flap", 0.5], ["blow", 1.8]]);
  enemy.x = enemy.home.x + Math.sin(enemy.age * 0.7) * 80;
  enemy.y = enemy.home.y + Math.sin(enemy.age * 2.2) * 14;
  faceTowards(enemy, player);
  enemy.gust = 0;
  if (enemy.state === "flap") enemy.glow = "#c8f0ff";
  if (enemy.state !== "blow") return;
  const dx = gapX(enemy, player);
  const inGust = Math.abs(dx) < 560 && Math.abs(centreY(player) - centreY(enemy)) < 280;
  enemy.gust = enemy.dir;
  if (inGust) shove(player, Math.sign(dx) * 250);
}

// Spark blob: bounds towards you; every landing sends sparks skittering
// along the floor both ways.
export function hopper(enemy, dt, round) {
  const { level, player } = round;
  enemy.timer -= dt;
  enemy.squash = Math.max(0, (enemy.squash ?? 0) - dt);
  if (enemy.state !== "hop") enemy.vx = 0;
  moveBody(enemy, dt, level);
  if (enemy.state === "hop") {
    if (!enemy.onGround) return;
    enemy.state = "patrol";
    enemy.squash = 0.25;
    fireShot(round, "spark", centreX(enemy) - 20, feet(enemy), -300);
    fireShot(round, "spark", centreX(enemy) + 20, feet(enemy), 300);
    emit(round, "zap", enemy);
    enemy.timer = cooldown(round, 1.2);
    return;
  }
  const close = Math.abs(gapX(enemy, player)) < 600;
  if (!enemy.onGround || enemy.timer > 0 || !close) return;
  faceTowards(enemy, player);
  enemy.state = "hop";
  // Hop on the spot rather than bound into a pit.
  const safe = safeLanding(enemy, enemy.dir * 170, -600, level);
  enemy.vx = safe ? enemy.dir * 170 : 0;
  enemy.vy = -600;
}

// Ring crab: hurls a fan of three crystal shards up and over at you.
export function shardCrab(enemy, dt, round) {
  const { level, player } = round;
  enemy.timer -= dt;
  if (enemy.state === "windup") {
    enemy.glow = "#bfefff";
    if (!windup(enemy, dt, level, "patrol")) return;
    [120, 200, 280].forEach((speed) => {
      fireShot(round, "shard", centreX(enemy), enemy.y + 10, enemy.dir * speed, -520);
    });
    emit(round, "throw", enemy);
    enemy.timer = cooldown(round, 2.8);
    return;
  }
  walk(enemy, dt, level);
  if (enemy.timer > 0 || Math.abs(gapX(enemy, player)) > 450) return;
  faceTowards(enemy, player);
  enemy.state = "windup";
  enemy.timer = 0.5;
}

// Swims along a wide wavy path; used by eels.
function eelPath(enemy) {
  return {
    x: enemy.home.x + Math.sin(enemy.age * 0.9) * 200,
    y: enemy.home.y + Math.sin(enemy.age * 2.7) * 50,
  };
}

// Ring eel: weaves through the air, coils, then darts sideways at you.
// Returns true while it's darting (the storm eel uses that for its trail).
export function serpentine(enemy, dt, round) {
  const { player } = round;
  enemy.timer -= dt;
  const spot = eelPath(enemy);
  if (enemy.state === "coil") {
    enemy.glow = "#9cf0ff";
    if (enemy.timer > 0) return false;
    enemy.state = "dash";
    enemy.timer = 0.75;
    return false;
  }
  if (enemy.state === "dash") {
    enemy.x += enemy.dir * 540 * dt;
    if (enemy.timer <= 0) enemy.state = "return";
    return true;
  }
  if (enemy.state === "return") {
    hoverTo(enemy, spot.x + enemy.w / 2, spot.y + enemy.h / 2, dt, 220);
    if (Math.hypot(enemy.x - spot.x, enemy.y - spot.y) > 8) return false;
    enemy.state = "patrol";
    enemy.timer = cooldown(round, 2.4);
    return false;
  }
  const dx = spot.x - enemy.x;
  if (Math.abs(dx) > 0.5) enemy.dir = Math.sign(dx);
  enemy.x = spot.x;
  enemy.y = spot.y;
  const level = Math.abs(centreY(player) - centreY(enemy)) < 70;
  if (enemy.timer > 0 || !level || Math.abs(gapX(enemy, player)) > 320) return false;
  faceTowards(enemy, player);
  enemy.state = "coil";
  enemy.timer = 0.5;
  return false;
}

// Dust wyvern: flies to and fro high up and drops crystal bombs that burst
// into shards when they land.
export function bomber(enemy, dt, round) {
  const { player } = round;
  enemy.spit -= dt;
  const x = enemy.home.x + Math.sin(enemy.age * 0.7) * 220;
  enemy.dir = Math.sign(x - enemy.x) || enemy.dir;
  enemy.x = x;
  enemy.y = enemy.home.y + Math.sin(enemy.age * 2.4) * 10;
  const lined = Math.abs(gapX(enemy, player)) < 36 && player.y > feet(enemy);
  if (enemy.spit > 0 || !lined) return;
  fireShot(round, "bomb", centreX(enemy), feet(enemy) - 6, 0, 40);
  emit(round, "throw", enemy);
  enemy.spit = cooldown(round, 1.8);
}

// Orb jelly: every few seconds it switches on a gravity well that drags you
// towards it.
export function gravityWell(enemy, dt, round) {
  const { player } = round;
  enemy.timer -= dt;
  loop(enemy, round, [["idle", 3], ["pull", 2.4]]);
  enemy.x = enemy.home.x + Math.sin(enemy.age * 0.6) * 30;
  enemy.y = enemy.home.y + Math.sin(enemy.age * 1.8) * 12;
  enemy.well = enemy.state === "pull" ? 320 : 0;
  if (!enemy.well || distance(enemy, player) > enemy.well) return;
  shove(player, Math.sign(gapX(player, enemy)) * 150);
}
