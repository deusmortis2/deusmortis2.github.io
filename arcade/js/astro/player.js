// The astronaut: running, jumping and the ground smash, plus the effects
// aliens put on them (status.js) and the power-ups that help.
import { tile } from "./levels.js";
import { moveBody, slide, standingSafely } from "./physics.js";
import { newStatus, tickStatus } from "./status.js";

export const startLives = 3;
export const maxLives = 5;
const runSpeed = 300;
const runAccel = 2600;
// Low gravity: a slow, floaty arc with a gentle top speed when falling.
const playerGravity = 1150;
const maxFallSpeed = 620;
const jumpSpeed = 760;
const coyoteSeconds = 0.1;
const bufferSeconds = 0.12;
const smashHang = 0.08;
const smashSpeed = 1900;
const hurtSeconds = 1.4;
const knockSeconds = 0.3;

// Power-up timers in seconds (shield is a count of hits it will soak up).
export function newPowers() {
  return { blaster: 0, boots: 0, quake: 0, shield: 0, speed: 0, star: 0 };
}

export function createPlayer(startCol, powers) {
  const player = {
    airJumps: 0,
    bounceGrace: 0,
    buffer: 0,
    coyote: 0,
    facing: 1,
    h: 76,
    hurtFor: 0,
    knockFor: 0,
    // Animation timers: standing still, just landed, just turned round.
    idleFor: 0,
    landFor: 0,
    onGround: false,
    powers,
    reload: 0,
    safe: null,
    smash: null,
    status: newStatus(),
    stride: 0,
    turnFor: 0,
    vx: 0,
    vy: 0,
    w: 28,
    x: 0,
    y: 0,
  };
  placePlayer(player, { x: startCol * tile + tile / 2, y: 10 * tile });
  return player;
}

// Puts the player's feet at a point and remembers it as safe ground.
export function placePlayer(player, feet) {
  player.x = feet.x - player.w / 2;
  player.y = feet.y - player.h;
  player.vx = 0;
  player.vy = 0;
  player.smash = null;
  player.safe = { ...feet };
}

// Knocks the player away from whatever hit them. Spikes overhead push them
// down instead of up.
export function hurtPlayer(player, fromX, fromAbove = false) {
  const away = player.x + player.w / 2 < fromX ? -1 : 1;
  player.hurtFor = hurtSeconds;
  player.knockFor = knockSeconds;
  player.smash = null;
  player.status.frozen = 0;
  player.vx = away * 320;
  player.vy = fromAbove ? 260 : -330;
}

// Bounce off an enemy's head. A smash that lands a hit bounces higher.
// A short grace period stops the alien you just bounced off from hurting you
// while you're still overlapping it on the way up.
export function bouncePlayer(player, high) {
  player.bounceGrace = 0.3;
  player.smash = null;
  player.vy = high ? -540 : -400;
}

function approach(value, target, step) {
  if (value < target) return Math.min(value + step, target);
  return Math.max(value - step, target);
}

function onIce(player, level) {
  const col = Math.floor((player.x + player.w / 2) / tile);
  return player.status.slippery > 0 || (player.onGround && level.icy.has(col));
}

function steer(player, input, dt, level) {
  if (player.knockFor > 0) return;
  const { powers, status } = player;
  let dir = (input.held("right") ? 1 : 0) - (input.held("left") ? 1 : 0);
  if (status.confused > 0) dir = -dir;
  if (status.frozen > 0) dir = 0;
  if (dir !== 0 && dir !== player.facing) player.turnFor = 0.14;
  if (dir !== 0) player.facing = dir;
  let top = runSpeed * (powers.speed > 0 ? 1.45 : 1);
  if (status.slow > 0) top *= 0.45;
  let accel = player.onGround ? runAccel : runAccel * 0.6;
  if (onIce(player, level)) accel *= 0.18;
  player.vx = approach(player.vx, dir * top, accel * dt);
}

function tryJump(player, input) {
  const { powers, status } = player;
  if (input.pressed("jump")) player.buffer = bufferSeconds;
  if (status.frozen > 0) return false;
  const power = jumpSpeed * (status.slow > 0 ? 0.75 : 1);
  if (player.buffer > 0 && player.coyote > 0) {
    player.vy = -power;
    player.buffer = 0;
    player.coyote = 0;
    player.airJumps = powers.boots > 0 ? 1 : 0;
    return true;
  }
  // Jet boots give one extra jump in mid-air.
  if (input.pressed("jump") && player.airJumps > 0 && powers.boots > 0) {
    player.vy = -power * 0.9;
    player.buffer = 0;
    player.airJumps -= 1;
    return "boost";
  }
  // Letting go early makes a shorter hop.
  if (!input.held("jump") && player.vy < -260) player.vy = -260;
  return false;
}

function tickTimers(player, dt) {
  player.hurtFor = Math.max(0, player.hurtFor - dt);
  player.knockFor = Math.max(0, player.knockFor - dt);
  player.buffer = Math.max(0, player.buffer - dt);
  player.bounceGrace = Math.max(0, player.bounceGrace - dt);
  player.reload = Math.max(0, player.reload - dt);
  player.turnFor = Math.max(0, player.turnFor - dt);
  player.landFor = Math.max(0, player.landFor - dt);
  player.coyote = player.onGround ? coyoteSeconds : player.coyote - dt;
  tickStatus(player, dt);
}

function smashing(player, dt, level, events) {
  player.smash.hang -= dt;
  player.vx = 0;
  const falling = player.smash.hang <= 0;
  player.vy = falling ? smashSpeed : 0;
  moveBody(player, dt, level, 0);
  if (!player.onGround) return;
  player.smash = null;
  player.landFor = 0.16;
  events.push("slam");
}

// Returns a list of events ("jump", "boost", "smash", "slam") for sound
// and effects.
export function updatePlayer(player, input, dt, level) {
  const events = [];
  tickTimers(player, dt);
  const { status } = player;
  if (status.push !== 0) slide(player, status.push * dt, level);
  status.push = 0;
  if (player.smash) {
    smashing(player, dt, level, events);
    return events;
  }
  steer(player, input, dt, level);
  const jumped = tryJump(player, input);
  if (jumped) events.push(jumped === "boost" ? "boost" : "jump");
  const canSmash = player.knockFor <= 0 && status.frozen <= 0;
  if (input.pressed("down") && !player.onGround && canSmash) {
    player.smash = { hang: smashHang };
    events.push("smash");
    return events;
  }
  const wasAir = !player.onGround;
  moveBody(player, dt, level, playerGravity);
  player.vy = Math.min(player.vy, maxFallSpeed);
  if (wasAir && player.onGround) player.landFor = 0.12;
  const still = player.onGround && Math.abs(player.vx) < 20;
  player.idleFor = still ? player.idleFor + dt : 0;
  player.stride = player.onGround
    ? player.stride + Math.abs(player.vx) * dt
    : player.stride;
  if (standingSafely(player, level)) {
    player.safe = { x: player.x + player.w / 2, y: player.y + player.h };
  }
  return events;
}

// Picks the frame from the astronaut sheet (see astronautCell in art.js).
export function playerFrame(player) {
  if (player.smash) return 5;
  if (player.status.frozen > 0) return 2;
  if (!player.onGround) {
    if (player.vy < -250) return 6;
    return player.vy > 250 ? 8 : 7;
  }
  if (player.landFor > 0) return 9;
  if (player.turnFor > 0) return 0;
  if (Math.abs(player.vx) < 20) return player.idleFor > 1.5 ? 0 : 2;
  return 1 + (Math.floor(player.stride / 26) % 4);
}
