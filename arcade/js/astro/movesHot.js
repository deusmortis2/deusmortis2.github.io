// Alien behaviours for the hot inner planets, Mercury and Venus.
import {
  aim,
  centreX,
  cooldown,
  distance,
  emit,
  faceTowards,
  feet,
  gapX,
  hoverTo,
  keepAboveFloor,
  nearby,
  walk,
  windup,
} from "./enemyKit.js";
import { addPatch } from "./patches.js";
import { moveBody, floorAhead } from "./physics.js";
import { lob } from "./shots.js";

// Drops a patch every so many pixels walked.
export function trail(enemy, round, kind, every, dt) {
  enemy.trail = (enemy.trail ?? 0) + Math.abs(enemy.vx) * dt;
  if (enemy.trail < every || !enemy.onGround) return;
  enemy.trail = 0;
  addPatch(round, kind, centreX(enemy), feet(enemy));
}

// Cinder crab: wanders, then scuttles at you at triple speed.
export function scuttle(enemy, dt, round) {
  const { level, player } = round;
  enemy.timer -= dt;
  if (enemy.state === "rush") {
    walk(enemy, dt, level, enemy.def.speed * 3);
    if (enemy.timer > 0) return;
    enemy.state = "patrol";
    enemy.timer = cooldown(round, 1.2);
    return;
  }
  if (enemy.state === "windup") {
    if (windup(enemy, dt, level, "rush")) enemy.timer = 1.1;
    return;
  }
  walk(enemy, dt, level);
  if (enemy.timer > 0 || !nearby(enemy, player, 300)) return;
  faceTowards(enemy, player);
  enemy.state = "windup";
  enemy.timer = 0.35;
}

// Flame imp: lobs fireballs that leave burning ground where they land.
export function lobber(enemy, dt, round) {
  const { level, player } = round;
  enemy.timer -= dt;
  if (enemy.state === "windup") {
    enemy.glow = "#ff9a2a";
    if (!windup(enemy, dt, level, "patrol")) return;
    const from = { x: centreX(enemy), y: enemy.y + 16 };
    lob(round, "fireball", from, { x: centreX(player), y: feet(player) }, 0.95);
    emit(round, "throw", enemy);
    enemy.timer = cooldown(round, 2.6);
    return;
  }
  walk(enemy, dt, level);
  const inReach = Math.abs(gapX(enemy, player)) < 520;
  if (enemy.timer > 0 || !inReach) return;
  faceTowards(enemy, player);
  enemy.state = "windup";
  enemy.timer = 0.5;
}

// Magma beetle: its shell glows red hot (stomping it burns you), then it
// vents steam and cools down for a couple of seconds. Smash it then.
export function molten(enemy, dt, round) {
  enemy.timer -= dt;
  walk(enemy, dt, round.level);
  const steps = { cool: ["hot", 3], hot: ["vent", 0.5], vent: ["cool", 2.2] };
  if (!steps[enemy.state]) {
    enemy.state = "hot";
    enemy.timer = 3;
  }
  if (enemy.timer <= 0) {
    const [next, seconds] = steps[enemy.state];
    enemy.state = next;
    enemy.timer = next === "cool" ? seconds : seconds / round.stage.pace;
    if (next === "cool") emit(round, "steam", enemy);
  }
  enemy.spiky = enemy.state !== "cool";
  enemy.glow = enemy.spiky ? "#ff5a1a" : null;
  enemy.tint = enemy.state === "cool" ? "cool" : null;
}

// Ash hound: charges, leaving a trail of embers. Ramming a wall dazes it.
export function emberCharge(enemy, dt, round) {
  const { level, player } = round;
  enemy.timer -= dt;
  if (enemy.state === "stunned") {
    if (enemy.timer <= 0) enemy.state = "patrol";
    return;
  }
  if (enemy.state === "windup") {
    if (windup(enemy, dt, level, "rush")) enemy.timer = 1.1;
    return;
  }
  if (enemy.state === "rush") {
    enemy.vx = enemy.dir * 380;
    moveBody(enemy, dt, level);
    trail(enemy, round, "fire", 50, dt);
    if (enemy.hitWall) {
      enemy.state = "stunned";
      enemy.timer = 2;
      emit(round, "crash", enemy);
      return;
    }
    if (floorAhead(enemy, enemy.dir, level) && enemy.timer > 0) return;
    enemy.state = "patrol";
    enemy.timer = cooldown(round, 1.8);
    return;
  }
  walk(enemy, dt, level);
  if (enemy.timer > 0 || !nearby(enemy, player, 340)) return;
  faceTowards(enemy, player);
  enemy.state = "windup";
  enemy.timer = 0.45;
}

// Acid jelly: drifts in a loop and drips acid on anyone below.
export function drifter(enemy, dt, round) {
  const { player } = round;
  enemy.spit -= dt;
  enemy.x = enemy.home.x + Math.sin(enemy.age * 0.8) * 90;
  enemy.y = enemy.home.y + Math.sin(enemy.age * 1.6) * 30;
  const dx = Math.abs(gapX(enemy, player));
  if (enemy.spit > 0 || player.y < feet(enemy) || dx > 200) return;
  lob(round, "acid", { x: centreX(enemy), y: feet(enemy) - 8 }, {
    x: centreX(enemy) + Math.sign(gapX(enemy, player)) * 30,
    y: feet(player),
  }, 0.7);
  enemy.spit = cooldown(round, 2);
}

// Sludge slug: slow, leaves sticky slime, and splits in two when smashed.
export function splitter(enemy, dt, round) {
  walk(enemy, dt, round.level);
  trail(enemy, round, "slime", 52, dt);
}

export function splitInTwo(enemy) {
  if (enemy.small) return [];
  return [-1, 1].map((dir) => {
    return { dir, kind: enemy.kind, small: true, x: centreX(enemy) + dir * 20, y: feet(enemy) };
  });
}

// Gas miner: throws canisters that burst into a lingering poison cloud.
export function gasser(enemy, dt, round) {
  const { level, player } = round;
  enemy.timer -= dt;
  if (enemy.state === "windup") {
    if (!windup(enemy, dt, level, "patrol")) return;
    const from = { x: centreX(enemy), y: enemy.y + 20 };
    lob(round, "canister", from, { x: centreX(player), y: feet(player) }, 1);
    emit(round, "throw", enemy);
    enemy.timer = cooldown(round, 3.2);
    return;
  }
  walk(enemy, dt, level);
  if (enemy.timer > 0 || Math.abs(gapX(enemy, player)) > 480) return;
  faceTowards(enemy, player);
  enemy.state = "windup";
  enemy.timer = 0.6;
}

// Sulphur wasp: zigzags, takes aim, then darts straight at you.
export function lunger(enemy, dt, round) {
  const { player } = round;
  enemy.timer -= dt;
  if (enemy.state === "aim") {
    enemy.glow = "#ffd400";
    if (enemy.timer > 0) return;
    enemy.line = aim(enemy, player);
    enemy.state = "dash";
    enemy.timer = 0.6;
    return;
  }
  if (enemy.state === "dash") {
    enemy.x += enemy.line.x * 480 * dt;
    enemy.y += enemy.line.y * 480 * dt;
    keepAboveFloor(enemy);
    if (enemy.timer <= 0) enemy.state = "return";
    return;
  }
  // The zigzag point it would be at right now.
  const spot = {
    x: enemy.home.x + Math.sin(enemy.age * 1.3) * 70,
    y: enemy.home.y - Math.abs(Math.sin(enemy.age * 4)) * 18,
  };
  if (enemy.state === "return") {
    hoverTo(enemy, spot.x + enemy.w / 2, spot.y + enemy.h / 2, dt, 190);
    const back = Math.hypot(enemy.x - spot.x, enemy.y - spot.y) < 8;
    if (!back) return;
    enemy.state = "patrol";
    enemy.timer = cooldown(round, 2);
    return;
  }
  enemy.x = spot.x;
  enemy.y = spot.y;
  if (enemy.timer > 0 || distance(enemy, player) > 340) return;
  enemy.state = "aim";
  enemy.timer = 0.55;
}
