// Alien behaviours for the ice giants, Uranus and Neptune.
import {
  aim,
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
  walk,
  windup,
} from "./enemyKit.js";
import { trail } from "./movesHot.js";
import { loop, serpentine } from "./movesSky.js";
import { addPatch } from "./patches.js";
import { fireShot } from "./shots.js";
import { afflict } from "./status.js";

// Frost crab: leaves slippery ice behind it and puffs frost that freezes
// you solid for a moment.
export function icer(enemy, dt, round) {
  const { level, player } = round;
  enemy.timer -= dt;
  if (enemy.state === "windup") {
    enemy.glow = "#bff6ff";
    if (!windup(enemy, dt, level, "patrol")) return;
    fireShot(round, "frost", centreX(enemy) + enemy.dir * 30, centreY(enemy), enemy.dir * 300);
    emit(round, "frost", enemy);
    enemy.timer = cooldown(round, 2.8);
    return;
  }
  walk(enemy, dt, level);
  trail(enemy, round, "ice", 45, dt);
  const close = Math.abs(gapX(enemy, player)) < 220;
  const sameFloor = Math.abs(feet(player) - feet(enemy)) < 90;
  if (enemy.timer > 0 || !close || !sameFloor) return;
  faceTowards(enemy, player);
  enemy.state = "windup";
  enemy.timer = 0.45;
}

// Shadow eel: fades out, reappears right behind you, then strikes.
export function blinker(enemy, dt, round) {
  const { player } = round;
  enemy.timer -= dt;
  const steps = {
    appear: () => {
      enemy.harmless = true;
      enemy.ghost = true;
      enemy.alpha = 1 - enemy.timer / 0.5;
      if (enemy.timer > 0) return;
      enemy.state = "strike";
      enemy.timer = 0.45;
      enemy.line = aim(enemy, player);
    },
    drift: () => {
      enemy.x = enemy.home.x + Math.sin(enemy.age * 1.1) * 40;
      enemy.y = enemy.home.y + Math.sin(enemy.age * 2.3) * 20;
      if (enemy.timer > 0 || distance(enemy, player) > 420) return;
      enemy.state = "fade";
      enemy.timer = 0.5;
    },
    fade: () => {
      enemy.ghost = true;
      enemy.harmless = true;
      enemy.alpha = enemy.timer / 0.5;
      if (enemy.timer > 0) return;
      // Behind the astronaut, at their height.
      const side = -player.facing;
      const edge = round.level.width - enemy.w;
      enemy.x = Math.min(Math.max(centreX(player) + side * 170 - enemy.w / 2, 0), edge);
      enemy.y = centreY(player) - enemy.h / 2 - 10;
      keepAboveFloor(enemy);
      faceTowards(enemy, player);
      enemy.state = "appear";
      enemy.timer = 0.5;
    },
    strike: () => {
      enemy.x += enemy.line.x * 420 * dt;
      enemy.y += enemy.line.y * 420 * dt;
      keepAboveFloor(enemy);
      if (enemy.timer > 0) return;
      enemy.home = { x: enemy.x, y: enemy.y };
      enemy.state = "drift";
      enemy.timer = cooldown(round, 2.6);
    },
  };
  if (!steps[enemy.state]) enemy.state = "drift";
  steps[enemy.state]();
}

// Ice wyvern: breathes a stream of frost at you. Frost freezes you solid,
// which leaves you open to everything else.
export function freezer(enemy, dt, round) {
  const { player } = round;
  enemy.timer -= dt;
  enemy.x = enemy.home.x + Math.sin(enemy.age * 0.8) * 60;
  enemy.y = enemy.home.y + Math.sin(enemy.age * 2) * 12;
  faceTowards(enemy, player);
  if (enemy.state === "inhale") {
    enemy.glow = "#bff6ff";
    if (enemy.timer > 0) return;
    enemy.state = "breathe";
    enemy.timer = 0.6;
    enemy.spit = 0;
    return;
  }
  if (enemy.state === "breathe") {
    enemy.spit -= dt;
    if (enemy.spit <= 0) {
      const line = aim(enemy, player);
      fireShot(round, "frost", centreX(enemy) + enemy.dir * 24, centreY(enemy), line.x * 330, line.y * 330);
      enemy.spit = 0.12;
    }
    if (enemy.timer > 0) return;
    enemy.state = "patrol";
    enemy.timer = cooldown(round, 3);
    return;
  }
  if (enemy.timer > 0 || distance(enemy, player) > 430) return;
  enemy.state = "inhale";
  enemy.timer = 0.6;
  emit(round, "frost", enemy);
}

// Frost jelly: floats high above you and drops icicles. Its icy bell takes
// two smashes.
export function icicleJelly(enemy, dt, round) {
  const { player } = round;
  enemy.spit -= dt;
  const homeX = enemy.home.x + enemy.w / 2;
  const x = Math.min(Math.max(centreX(player), homeX - 220), homeX + 220);
  hoverTo(enemy, x, enemy.home.y + enemy.h / 2 + Math.sin(enemy.age * 2) * 10, dt, 70);
  const lined = Math.abs(gapX(enemy, player)) < 26 && player.y > feet(enemy);
  if (enemy.spit > 0 || !lined) return;
  fireShot(round, "icicle", centreX(enemy), feet(enemy), 0, 0);
  emit(round, "frost", enemy);
  enemy.spit = cooldown(round, 1.6);
}

// Abyss crab: its eyes glow, then it fires a laser along the floor at shin
// height. Jump it.
export function eyeBeam(enemy, dt, round) {
  const { level, player } = round;
  enemy.timer -= dt;
  if (enemy.state === "glare") {
    enemy.glow = "#4ae0ff";
    enemy.sight = true;
    if (!windup(enemy, dt, level, "patrol")) return;
    fireShot(round, "laser", centreX(enemy) + enemy.dir * 40, feet(enemy) - 18, enemy.dir * 620);
    emit(round, "laser", enemy);
    enemy.timer = cooldown(round, 3);
    return;
  }
  walk(enemy, dt, level);
  const sameFloor = Math.abs(feet(player) - feet(enemy)) < 70;
  if (enemy.timer > 0 || !sameFloor || Math.abs(gapX(enemy, player)) > 520) return;
  faceTowards(enemy, player);
  enemy.state = "glare";
  enemy.timer = 0.8;
}

// Storm eel: an eel that leaves a crackling trail in the air as it darts.
export function liveWire(enemy, dt, round) {
  const darting = serpentine(enemy, dt, round);
  if (!darting) return;
  enemy.trail = (enemy.trail ?? 0) + 540 * dt;
  if (enemy.trail < 40) return;
  enemy.trail = 0;
  addPatch(round, "spark", centreX(enemy) - enemy.dir * 30, centreY(enemy));
}

// Crystal gargoyle: a harmless statue until you come close. Then it wakes,
// flies after you, and turns back to stone for a rest (safe, but it can't
// be hurt then either).
export function statue(enemy, dt, round) {
  const { player } = round;
  enemy.timer -= dt;
  if (enemy.state === "hunt") {
    hoverTo(enemy, centreX(player), centreY(player), dt, 150, 130);
    keepAboveFloor(enemy);
    if (enemy.timer > 0) return;
    enemy.state = "stone";
    enemy.timer = 2.2;
    emit(round, "clang", enemy);
    return;
  }
  if (enemy.state === "wake") {
    enemy.shake = true;
    if (enemy.timer > 0) return;
    enemy.state = "hunt";
    enemy.timer = 3;
    return;
  }
  enemy.state = "stone";
  enemy.tint = "stone";
  enemy.guarded = true;
  enemy.harmless = true;
  if (enemy.timer > 0 || distance(enemy, player) > 200) return;
  enemy.state = "wake";
  enemy.timer = 0.4;
  emit(round, "growl", enemy);
}

// Deep jelly: drifts after you and sends out a psychic ring. If the ring
// sweeps over you, left and right swap for a few seconds.
export function mindJelly(enemy, dt, round) {
  const { player } = round;
  enemy.timer -= dt;
  loop(enemy, round, [["idle", 3.4], ["glow", 0.6], ["pulse", 0.9]]);
  hoverTo(enemy, centreX(player), player.y - 110, dt, 45, 45);
  keepAboveFloor(enemy);
  enemy.ring = 0;
  if (enemy.state === "glow") enemy.glow = "#c878ff";
  if (enemy.state !== "pulse") return;
  enemy.ring = (1 - enemy.timer / 0.9) * 220;
  const edge = Math.abs(distance(enemy, player) - enemy.ring);
  if (edge < 26) afflict(player, "confused", 3);
}
