// Power-ups that aliens sometimes drop when you beat them (bosses always
// drop a heart and one more):
//   shield   a bubble that soaks up the next hit
//   blaster  fire bolts with X or J (the * button on touch screens)
//   boots    jet boots: jump again in mid-air
//   speed    run half as fast again
//   star     can't be hurt; touching aliens beats them
//   quake    smashing the ground sends shock waves along the floor
//   o2       a bubble of oxygen
//   heart    one more life
import { tile, tileAt } from "./levels.js";
import { maxOxygen } from "./oxygen.js";
import { moveBody, overlaps } from "./physics.js";
import { maxLives } from "./player.js";

export const powerInfo = {
  blaster: { colour: "#ff2e88", label: "BLASTER! PRESS X TO FIRE", seconds: 15 },
  boots: { colour: "#ffd400", label: "JET BOOTS! JUMP IN MID-AIR", seconds: 20 },
  heart: { colour: "#ff2e88", label: "EXTRA LIFE!" },
  o2: { colour: "#9cf0ff", label: "OXYGEN BUBBLE!" },
  quake: { colour: "#ff8a3a", label: "QUAKE SMASH! SMASH THE FLOOR", seconds: 15 },
  shield: { colour: "#00e5ff", label: "SHIELD! BLOCKS ONE HIT" },
  speed: { colour: "#39ff14", label: "SPEED BOOTS!", seconds: 12 },
  star: { colour: "#ffffff", label: "STAR POWER! YOU CAN'T BE HURT", seconds: 8 },
};

const dropTable = [
  ["o2", 24], ["shield", 15], ["blaster", 15], ["boots", 12], ["speed", 12],
  ["quake", 10], ["star", 6], ["heart", 4],
];
const dropChance = 0.35;
const boltSpeed = 720;

function pickKind(table) {
  const total = table.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * total;
  const found = table.find(([, weight]) => {
    roll -= weight;
    return roll < 0;
  });
  return found ? found[0] : table[0][0];
}

// Pops a power-up out of a beaten alien.
export function dropPower(round, x, y, kind = pickKind(dropTable)) {
  round.drops.push({
    age: 0,
    h: 30,
    kind,
    life: 12,
    vx: (Math.random() - 0.5) * 160,
    vy: -420,
    w: 30,
    x: x - 15,
    y: y - 15,
  });
}

export function maybeDrop(round, x, y) {
  if (Math.random() < dropChance) dropPower(round, x, y);
}

// A boss always leaves a heart and one other power-up.
export function bossDrops(round, x, y) {
  dropPower(round, x - 30, y, "heart");
  const others = dropTable.filter(([kind]) => kind !== "heart");
  dropPower(round, x + 30, y, pickKind(others));
}

export function updateDrops(round, dt) {
  round.drops = round.drops.filter((drop) => {
    drop.age += dt;
    drop.life -= dt;
    moveBody(drop, dt, round.level, 1200);
    if (drop.onGround) drop.vx *= 0.8;
    return drop.life > 0 && drop.y < round.level.height;
  });
}

function apply(game, kind) {
  const { player } = game.round;
  const { powers } = player;
  const info = powerInfo[kind];
  if (info.seconds) powers[kind] = info.seconds;
  if (kind === "shield") powers.shield = 1;
  if (kind === "heart") game.lives = Math.min(maxLives, game.lives + 1);
  if (kind === "o2") game.round.oxygen = Math.min(maxOxygen, game.round.oxygen + 12);
  game.showToast(info.label, info.colour);
}

// Returns true if something was picked up this frame.
export function collectDrops(game) {
  const { round } = game;
  let got = false;
  round.drops = round.drops.filter((drop) => {
    if (!overlaps(round.player, drop)) return true;
    apply(game, drop.kind);
    got = true;
    return false;
  });
  return got;
}

export function tickPowers(powers, dt) {
  Object.keys(powerInfo).forEach((kind) => {
    if (powerInfo[kind].seconds && powers[kind] > 0) {
      powers[kind] = Math.max(0, powers[kind] - dt);
    }
  });
}

// Fires a blaster bolt if the blaster is on and has reloaded.
export function tryFire(round, input) {
  const { player } = round;
  if (player.powers.blaster <= 0 || player.reload > 0) return false;
  if (!input.pressed("fire") && !input.held("fire")) return false;
  player.reload = 0.22;
  const x = player.x + player.w / 2 + player.facing * 22;
  round.bolts.push({
    age: 0, h: 10, kind: "bolt", life: 0.9, vx: player.facing * boltSpeed, w: 22, x: x - 11, y: player.y + 30,
  });
  return true;
}

// A quake smash sends a shock wave along the floor each way.
export function quakeWaves(round) {
  const { player } = round;
  const floor = player.y + player.h;
  [-1, 1].forEach((dir) => {
    round.bolts.push({
      age: 0, h: 34, kind: "quake", life: 1, vx: dir * 520, w: 34, x: player.x + player.w / 2 - 17, y: floor - 34,
    });
  });
}

function boltBlocked(bolt, level) {
  const at = (x, y) => tileAt(level, Math.floor(x / tile), Math.floor(y / tile));
  const cx = bolt.x + bolt.w / 2;
  if (at(cx, bolt.y + bolt.h / 2) === "#") return true;
  if (bolt.kind !== "quake") return false;
  const front = bolt.vx > 0 ? bolt.x + bolt.w : bolt.x;
  const ground = at(front, bolt.y + bolt.h + 2);
  return ground !== "#" && ground !== "=";
}

export function updateBolts(round, dt) {
  round.bolts = round.bolts.filter((bolt) => {
    bolt.age += dt;
    bolt.x += bolt.vx * dt;
    return bolt.age < bolt.life && !bolt.spent && !boltBlocked(bolt, round.level);
  });
}
