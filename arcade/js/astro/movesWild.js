// Alien behaviours for Earth and Mars, plus the Brood Queen's spiderlings.
import {
  aim,
  centreX,
  centreY,
  chase,
  cooldown,
  emit,
  faceTowards,
  feet,
  gapX,
  hoverTo,
  nearby,
  safeLanding,
  walk,
  windup,
} from "./enemyKit.js";
import { tile } from "./levels.js";
import { floorAhead, moveBody } from "./physics.js";
import { fireShot, lob } from "./shots.js";

// Snapvine: rooted to the spot. Bites anyone who gets close and spits
// seeds at anyone further away.
export function snapper(enemy, dt, round) {
  const { level, player } = round;
  enemy.timer -= dt;
  enemy.spit -= dt;
  moveBody(enemy, dt, level);
  faceTowards(enemy, player);
  enemy.reach = enemy.state === "snap" ? 54 : 0;
  if (enemy.state === "windup") {
    if (windup(enemy, dt, level, "snap")) enemy.timer = 0.3;
    return;
  }
  if (enemy.state === "snap") {
    if (enemy.timer > 0) return;
    enemy.state = "patrol";
    enemy.timer = cooldown(round, 1.4);
    return;
  }
  const dx = Math.abs(gapX(enemy, player));
  const below = feet(player) > enemy.y;
  if (enemy.timer <= 0 && dx < 130 && below) {
    enemy.state = "windup";
    enemy.timer = 0.25;
    return;
  }
  if (enemy.spit > 0 || dx < 140 || dx > 480) return;
  lob(round, "seed", { x: centreX(enemy), y: enemy.y + 20 }, {
    x: centreX(player),
    y: feet(player),
  }, 0.9);
  emit(round, "spit", enemy);
  enemy.spit = cooldown(round, 3);
}

// Glow panther: prowls almost invisible, then shows itself and pounces.
export function prowler(enemy, dt, round) {
  const { level, player } = round;
  enemy.timer -= dt;
  if (enemy.state === "leap") {
    moveBody(enemy, dt, level);
    if (!enemy.onGround) return;
    enemy.state = "rest";
    enemy.timer = 1.4;
    return;
  }
  if (enemy.state === "reveal") {
    if (!windup(enemy, dt, level, "leap")) return;
    enemy.vx = enemy.dir * 300;
    enemy.vy = -560;
    emit(round, "growl", enemy);
    return;
  }
  if (enemy.state === "rest") {
    walk(enemy, dt, level, enemy.def.speed * 0.6);
    if (enemy.timer <= 0) enemy.state = "patrol";
    return;
  }
  // Cloaked: only its glowing spots give it away.
  enemy.alpha = 0.32 + Math.abs(Math.sin(enemy.age * 2)) * 0.12;
  const hunting = Math.abs(gapX(enemy, player)) < 600;
  if (hunting) chase(enemy, dt, level, player, enemy.def.speed * 1.3);
  else walk(enemy, dt, level);
  if (!nearby(enemy, player, 220)) return;
  faceTowards(enemy, player);
  // Only pounce if the leap lands on solid ground.
  if (!safeLanding(enemy, enemy.dir * 300, -560, level)) return;
  enemy.state = "reveal";
  enemy.timer = 0.45;
}

// War hornet: hovers above you and fires stingers down at an angle.
export function stingerHover(enemy, dt, round) {
  const { player } = round;
  enemy.timer -= dt;
  const homeX = enemy.home.x + enemy.w / 2;
  const x = Math.min(Math.max(centreX(player) - 140 * enemy.dir, homeX - 260), homeX + 260);
  const y = enemy.home.y + enemy.h / 2 + Math.sin(enemy.age * 5) * 8;
  if (enemy.state === "aim") {
    enemy.glow = "#ffd400";
    if (enemy.timer > 0) return;
    const line = aim(enemy, player);
    fireShot(round, "stinger", centreX(enemy), feet(enemy) - 10, line.x * 360, line.y * 360);
    emit(round, "throw", enemy);
    enemy.state = "patrol";
    enemy.timer = cooldown(round, 2.2);
    enemy.y -= 30;
    return;
  }
  hoverTo(enemy, x, y, dt, 120, 90);
  faceTowards(enemy, player);
  const dx = Math.abs(gapX(enemy, player));
  const below = centreY(player) > feet(enemy);
  if (enemy.timer > 0 || !below || dx < 50 || dx > 320) return;
  enemy.state = "aim";
  enemy.timer = 0.4;
}

// Moss turtle: the first hit knocks it into its shell. Touch the shell to
// kick it: a sliding shell flattens other aliens. It pops back out later.
export function shell(enemy, dt, round) {
  const { level } = round;
  enemy.timer -= dt;
  enemy.kickGrace = Math.max(0, (enemy.kickGrace ?? 0) - dt);
  if (enemy.state === "slide") {
    enemy.harmless = true;
    enemy.spin = enemy.dir;
    enemy.vx = enemy.dir * 520;
    moveBody(enemy, dt, level);
    if (enemy.hitWall) {
      enemy.dir = -enemy.dir;
      enemy.bounces += 1;
      emit(round, "clang", enemy);
    }
    if (enemy.bounces < 4 && enemy.timer > 0) return;
    enemy.state = "shell";
    enemy.timer = 2.5;
    return;
  }
  if (enemy.state === "shell") {
    enemy.harmless = true;
    enemy.tint = "shell";
    enemy.vx = 0;
    moveBody(enemy, dt, level);
    if (enemy.timer <= 0) enemy.state = "patrol";
    return;
  }
  walk(enemy, dt, level);
}

// Kicks a turtle shell away from the player.
export function kickShell(enemy, player) {
  if (enemy.kickGrace > 0) return;
  enemy.state = "slide";
  enemy.dir = centreX(player) < centreX(enemy) ? 1 : -1;
  enemy.timer = 4;
  enemy.bounces = 0;
  enemy.kickGrace = 0.3;
}

// Rust crab: raises its claws while you're in the air above it, so a stomp
// just clangs off. It snaps at you up close, then rests with its claws down.
export function clawGuard(enemy, dt, round) {
  const { level, player } = round;
  enemy.timer -= dt;
  enemy.reach = enemy.state === "snap" ? 34 : 0;
  if (enemy.state === "windup") {
    if (windup(enemy, dt, level, "snap")) enemy.timer = 0.3;
    return;
  }
  if (enemy.state === "snap") {
    if (enemy.timer > 0) return;
    enemy.state = "tired";
    enemy.timer = 1.5;
    return;
  }
  if (enemy.state === "tired") {
    enemy.vx = 0;
    moveBody(enemy, dt, level);
    enemy.tint = "cool";
    if (enemy.timer > 0) return;
    enemy.state = "patrol";
    enemy.timer = cooldown(round, 1.6);
    return;
  }
  walk(enemy, dt, level);
  const above = !player.onGround && Math.abs(gapX(enemy, player)) < 200;
  enemy.guarded = above;
  if (enemy.timer > 0 || !nearby(enemy, player, 120)) return;
  faceTowards(enemy, player);
  enemy.state = "windup";
  enemy.timer = 0.3;
}

// Pale crawler: clings under a rock roof and drops on you, then hunts you
// down and pounces.
export function ambusher(enemy, dt, round) {
  const { level, player } = round;
  enemy.timer -= dt;
  if (enemy.state === "hang") {
    enemy.flipY = true;
    const under = Math.abs(gapX(enemy, player)) < 60 && player.y > enemy.y;
    if (under) {
      enemy.state = "drop";
      enemy.vy = 0;
      emit(round, "hiss", enemy);
    }
    return;
  }
  if (enemy.state === "drop" || enemy.state === "leap") {
    moveBody(enemy, dt, level);
    if (!enemy.onGround) return;
    enemy.state = "hunt";
    enemy.timer = 5;
    return;
  }
  const hunting = enemy.state === "hunt" && enemy.timer > 0;
  if (hunting) chase(enemy, dt, level, player, 170);
  else walk(enemy, dt, level);
  enemy.spit -= dt;
  if (!hunting || enemy.spit > 0 || !nearby(enemy, player, 200)) return;
  if (!safeLanding(enemy, enemy.dir * 260, -520, level)) return;
  enemy.state = "leap";
  enemy.vx = enemy.dir * 260;
  enemy.vy = -520;
  enemy.spit = cooldown(round, 1.6);
}

// Starts a crawler hanging from the roof if it was placed above the floor.
export function hangFromRoof(enemy, row) {
  if (row >= 8) return;
  enemy.state = "hang";
  enemy.y = row * tile;
}

// Dust bat: hangs, then swoops down through you and up the other side.
export function swooper(enemy, dt, round) {
  const { player } = round;
  enemy.timer -= dt;
  if (enemy.state === "swoop") {
    const { from, to } = enemy.swoop;
    const t = Math.min(1, 1 - enemy.timer / 1.3);
    enemy.x = from.x + (to.x - from.x) * 2 * t;
    enemy.y = from.y + (to.y - from.y) * Math.sin(Math.PI * t);
    if (t < 1) return;
    enemy.home = { x: enemy.x, y: from.y };
    enemy.state = "patrol";
    enemy.timer = cooldown(round, 1.6);
    return;
  }
  enemy.x = enemy.home.x + Math.sin(enemy.age * 2) * 6;
  enemy.y = enemy.home.y + Math.sin(enemy.age * 3) * 6;
  const dx = Math.abs(gapX(enemy, player));
  if (enemy.timer > 0 || dx > 280 || player.y < enemy.y) return;
  enemy.state = "swoop";
  enemy.timer = 1.3;
  const middle = { x: player.x + player.w / 2 - enemy.w / 2, y: player.y + 10 };
  const edge = round.level.width - enemy.w;
  const end = Math.min(Math.max(enemy.x + (middle.x - enemy.x) * 2, 0), edge);
  enemy.swoop = { from: { x: enemy.x, y: enemy.y }, to: { x: (enemy.x + end) / 2, y: middle.y } };
  emit(round, "screech", enemy);
}

// Red scorpion: burrows under the sand (only a moving mound shows), erupts
// under you, stings, then digs back down. It can only be hit when it's up.
export function burrower(enemy, dt, round) {
  const { level, player } = round;
  enemy.timer -= dt;
  const steps = {
    dig: () => {
      if (enemy.timer > 0) return;
      enemy.state = "under";
      enemy.timer = 3.5;
    },
    pop: () => {
      moveBody(enemy, dt, level);
      if (!enemy.onGround || enemy.vy < 0) return;
      enemy.state = "up";
      enemy.timer = 2.4;
      enemy.spit = 0.6;
      enemy.stung = false;
    },
    rumble: () => {
      enemy.hidden = true;
      enemy.shake = true;
      if (enemy.timer > 0) return;
      enemy.state = "pop";
      enemy.vy = -380;
      emit(round, "burst", enemy);
    },
    under: () => {
      enemy.hidden = true;
      const close = Math.abs(gapX(enemy, player)) < 520;
      if (close) faceTowards(enemy, player);
      const ok = floorAhead(enemy, enemy.dir, level);
      enemy.vx = ok && close ? enemy.dir * 110 : 0;
      moveBody(enemy, dt, level);
      const below = Math.abs(gapX(enemy, player)) < 20;
      if (!below && enemy.timer > 0) return;
      enemy.state = "rumble";
      enemy.timer = 0.55;
    },
    up: () => {
      enemy.spit -= dt;
      moveBody(enemy, dt, level);
      if (!enemy.stung && enemy.spit <= 0) {
        enemy.stung = true;
        faceTowards(enemy, player);
        fireShot(round, "stinger", centreX(enemy) + enemy.dir * 30, enemy.y + 18, enemy.dir * 380);
        emit(round, "throw", enemy);
      }
      if (enemy.timer > 0) return;
      enemy.state = "dig";
      enemy.timer = 0.4;
    },
  };
  if (!steps[enemy.state]) {
    enemy.state = "under";
    enemy.timer = 1 + Math.random() * 2;
  }
  steps[enemy.state]();
}

// Spiderling: a baby from the Brood Queen that scurries straight at you.
export function skitter(enemy, dt, round) {
  const { level, player } = round;
  enemy.timer -= dt;
  if (enemy.timer <= 0) {
    faceTowards(enemy, player);
    enemy.timer = 0.6;
  }
  walk(enemy, dt, level);
}
