// The aliens of Astro Stomp: how each one moves and the trick it pulls.
//   stalker  patrols, then pounces at you when you get close
//   blade    patrols and throws spinning discs along the ground
//   brute    takes three smashes, stomps out shock waves, gets angry when hit
//   ravager  charges when you're on its floor; dazed if it rams a wall
//   brain    floats after you and fires slow psychic orbs
//   fly      dives at you and drips acid while it circles
import { tile, tileAt } from "./levels.js";
import { floorAhead, moveBody } from "./physics.js";
import { fireShot } from "./shots.js";

// Faces is the way the artwork looks (1 right, -1 left, 0 straight on).
export const kinds = {
  blade: { faces: -1, h: 90, hp: 1, move: thrower, points: 200, speed: 105, w: 44 },
  brain: { faces: 0, flies: true, h: 54, hp: 1, move: psychic, points: 250, w: 52 },
  brute: { faces: 1, h: 96, hp: 3, move: pounder, points: 400, speed: 45, w: 70 },
  fly: { faces: 0, flies: true, h: 58, hp: 1, move: dive, points: 200, w: 58 },
  ravager: { faces: -1, h: 82, hp: 1, move: charge, points: 250, speed: 60, w: 70 },
  stalker: { faces: 1, h: 90, hp: 1, move: pouncer, points: 150, speed: 70, w: 48 },
};

const hoverLeash = 450;
const hoverSpeed = { x: 85, y: 120 };
const stunSeconds = 3.2;

export function createEnemy([kind, col, row = 9]) {
  const def = kinds[kind];
  const x = col * tile + tile / 2 - def.w / 2;
  const y = (row + 1) * tile - def.h;
  return {
    age: Math.random() * 10,
    def,
    dir: -1,
    flash: 0,
    h: def.h,
    home: { x, y },
    hp: def.hp,
    kind,
    // A second cooldown for abilities that run alongside the main one.
    spit: 1 + Math.random(),
    state: "patrol",
    timer: 0.5 + Math.random(),
    vx: 0,
    vy: 0,
    w: def.w,
    x,
    y,
  };
}

const centreX = (body) => body.x + body.w / 2;
const centreY = (body) => body.y + body.h / 2;
const feet = (body) => body.y + body.h;
const emit = (round, type, enemy) => {
  round.events.push({ type, x: centreX(enemy), y: feet(enemy) });
};

// Later planets recharge alien abilities faster.
const cooldown = (round, seconds) => seconds / round.stage.pace;

function nearby(enemy, player, reach) {
  const dx = centreX(player) - centreX(enemy);
  const sameFloor = Math.abs(feet(player) - feet(enemy)) < 70;
  return sameFloor && Math.abs(dx) < reach;
}

const faceTowards = (enemy, player) => {
  enemy.dir = Math.sign(centreX(player) - centreX(enemy)) || enemy.dir;
};

// Back and forth, turning at walls and ledges.
function walk(enemy, dt, level, speed = enemy.def.speed) {
  enemy.vx = enemy.dir * speed;
  moveBody(enemy, dt, level);
  const ledge = enemy.onGround && !floorAhead(enemy, enemy.dir, level);
  if (enemy.hitWall || ledge) enemy.dir = -enemy.dir;
}

// Stands still and shakes for a moment, then hands over to the next state.
function windup(enemy, dt, level, next) {
  enemy.vx = 0;
  moveBody(enemy, dt, level);
  if (enemy.timer > 0) return false;
  enemy.state = next;
  return true;
}

// Walks, then leaps at the player, as long as it would land on solid floor.
function pouncer(enemy, dt, round) {
  const { level, player } = round;
  enemy.timer -= dt;
  if (enemy.state === "leap") {
    moveBody(enemy, dt, level);
    if (!enemy.onGround) return;
    enemy.state = "patrol";
    enemy.timer = cooldown(round, 1.8);
    return;
  }
  walk(enemy, dt, level);
  if (enemy.timer > 0 || !enemy.onGround || !nearby(enemy, player, 250)) return;
  faceTowards(enemy, player);
  const landing = centreX(enemy) + enemy.dir * 140;
  const ground = tileAt(level, Math.floor(landing / tile), Math.floor((feet(enemy) + 2) / tile));
  if (ground !== "#" && ground !== "=") return;
  enemy.state = "leap";
  enemy.vx = enemy.dir * 240;
  enemy.vy = -640;
}

// Walks, then winds up and throws a disc along the ground at shin height.
function thrower(enemy, dt, round) {
  const { level, player } = round;
  enemy.timer -= dt;
  if (enemy.state === "windup") {
    if (!windup(enemy, dt, level, "patrol")) return;
    fireShot(round, "disc", centreX(enemy) + enemy.dir * 26, feet(enemy) - 32, enemy.dir * 330);
    emit(round, "throw", enemy);
    enemy.timer = cooldown(round, 2.8);
    return;
  }
  walk(enemy, dt, level);
  if (enemy.timer > 0 || !nearby(enemy, player, 460)) return;
  faceTowards(enemy, player);
  enemy.state = "windup";
  enemy.timer = 0.55;
}

// Plods along, then hops and slams the ground, sending a shock wave each way.
// Once it's been hit it gets angry and walks a lot faster.
function pounder(enemy, dt, round) {
  const { level, player } = round;
  enemy.timer -= dt;
  const angry = enemy.hp < enemy.def.hp;
  if (enemy.state === "windup") {
    if (!windup(enemy, dt, level, "hop")) return;
    enemy.vy = -620;
    return;
  }
  if (enemy.state === "hop") {
    enemy.vx = 0;
    moveBody(enemy, dt, level);
    if (!enemy.onGround) return;
    fireShot(round, "wave", centreX(enemy) - 40, feet(enemy), -330);
    fireShot(round, "wave", centreX(enemy) + 40, feet(enemy), 330);
    emit(round, "quake", enemy);
    enemy.state = "patrol";
    enemy.timer = cooldown(round, angry ? 2.6 : 3.6);
    return;
  }
  walk(enemy, dt, level, angry ? enemy.def.speed * 2.4 : enemy.def.speed);
  if (enemy.timer > 0 || !nearby(enemy, player, 400)) return;
  enemy.state = "windup";
  enemy.timer = 0.6;
}

// Walks, but rushes at the player after a short wind-up when they're close.
// Ramming a wall leaves it dazed, which makes it safe to stomp.
function charge(enemy, dt, round) {
  const { level, player } = round;
  enemy.timer -= dt;
  if (enemy.state === "stunned") {
    if (enemy.timer <= 0) enemy.state = "patrol";
    return;
  }
  if (enemy.state === "patrol") {
    walk(enemy, dt, level);
    if (enemy.timer > 0 || !nearby(enemy, player, 340)) return;
    faceTowards(enemy, player);
    enemy.state = "windup";
    enemy.timer = 0.45;
    return;
  }
  if (enemy.state === "windup") {
    if (windup(enemy, dt, level, "rush")) enemy.timer = 1.1;
    return;
  }
  enemy.vx = enemy.dir * 360;
  moveBody(enemy, dt, level);
  if (enemy.hitWall) {
    enemy.state = "stunned";
    enemy.timer = 2;
    emit(round, "crash", enemy);
    return;
  }
  if (!floorAhead(enemy, enemy.dir, level) || enemy.timer <= 0) {
    enemy.state = "patrol";
    enemy.timer = cooldown(round, 1.6);
  }
}

// Drifts towards the player at helmet height, slow enough to jump over, and
// every few seconds glows brightly and fires an orb straight at them.
function psychic(enemy, dt, round) {
  const { player } = round;
  enemy.timer -= dt;
  const homeX = enemy.home.x + enemy.w / 2;
  const awake = Math.abs(centreX(player) - homeX) < hoverLeash + 300;
  const target = awake
    ? {
        x: Math.min(Math.max(centreX(player), homeX - hoverLeash), homeX + hoverLeash),
        y: player.y + 4 + Math.sin(enemy.age * 2.4) * 14,
      }
    : { x: homeX, y: enemy.home.y };
  // Never sink to the floor, even if the player drops into a pit.
  const lowest = 10 * tile - enemy.h - 14;
  const dx = target.x - centreX(enemy);
  const dy = Math.min(target.y, lowest) - enemy.y;
  enemy.x += Math.sign(dx) * Math.min(Math.abs(dx), hoverSpeed.x * dt);
  enemy.y += Math.sign(dy) * Math.min(Math.abs(dy), hoverSpeed.y * dt);
  if (Math.abs(dx) > 4) enemy.dir = Math.sign(dx);
  if (enemy.state === "charging" && enemy.timer <= 0) {
    const aimX = centreX(player) - centreX(enemy);
    const aimY = centreY(player) - centreY(enemy);
    const length = Math.hypot(aimX, aimY) || 1;
    fireShot(round, "orb", centreX(enemy), centreY(enemy), (aimX / length) * 210, (aimY / length) * 210);
    emit(round, "orb", enemy);
    enemy.state = "patrol";
    enemy.timer = cooldown(round, 3.6);
    return;
  }
  const inRange = Math.hypot(centreX(player) - centreX(enemy), centreY(player) - centreY(enemy)) < 520;
  if (enemy.state === "patrol" && enemy.timer <= 0 && awake && inRange) {
    enemy.state = "charging";
    enemy.timer = 0.7;
  }
}

// Drops a blob of acid when the player is close below, but not right under it
// (that's when it dives instead).
function drip(enemy, dt, round) {
  const { player } = round;
  enemy.spit -= dt;
  const dx = Math.abs(centreX(player) - centreX(enemy));
  const below = player.y > feet(enemy);
  if (enemy.spit > 0 || !below || dx < 50 || dx > 230) return;
  fireShot(round, "acid", centreX(enemy), feet(enemy) - 6, 0, 80);
  enemy.spit = cooldown(round, 2.4);
}

// Cruises high up, then dives when the player passes underneath. It crashes
// into the ground and lies stunned for a few seconds before flying back up.
function dive(enemy, dt, round) {
  const { level, player } = round;
  enemy.timer -= dt;
  const below = player.y > enemy.y;
  const lined = Math.abs(centreX(player) - centreX(enemy)) < 40;
  if (enemy.state === "patrol") {
    enemy.x = enemy.home.x + Math.sin(enemy.age * 0.9) * 110;
    enemy.y = enemy.home.y + Math.sin(enemy.age * 3) * 8;
    drip(enemy, dt, round);
    if (!lined || !below || enemy.timer > 0) return;
    enemy.state = "windup";
    enemy.timer = 0.5 / round.stage.pace;
    return;
  }
  if (enemy.state === "windup") {
    if (enemy.timer > 0) return;
    enemy.state = "diving";
    enemy.vx = 0;
    enemy.vy = 300;
    return;
  }
  if (enemy.state === "diving") {
    moveBody(enemy, dt, level, 3200);
    if (enemy.y > level.height) enemy.gone = true;
    if (!enemy.onGround) return;
    enemy.state = "stunned";
    enemy.timer = stunSeconds;
    emit(round, "crash", enemy);
    return;
  }
  if (enemy.state === "stunned") {
    if (enemy.timer <= 0) enemy.state = "rising";
    return;
  }
  enemy.y -= 170 * dt;
  if (enemy.y > enemy.home.y) return;
  enemy.y = enemy.home.y;
  enemy.home.x = enemy.x - Math.sin(enemy.age * 0.9) * 110;
  enemy.state = "patrol";
  enemy.timer = cooldown(round, 1.2);
}

// Behaviours report what happened through round.events and fire into
// round.shots.
export function updateEnemy(enemy, dt, round) {
  enemy.age += dt;
  enemy.flash = Math.max(0, enemy.flash - dt);
  if (enemy.dying !== undefined) {
    enemy.dying += dt;
    return;
  }
  enemy.def.move(enemy, dt, round);
  if (enemy.y > round.level.height + 200) enemy.gone = true;
}

// A stunned or dazed alien can't hurt anyone and can be stomped without a
// smash.
export const isStunned = (enemy) => enemy.state === "stunned";
