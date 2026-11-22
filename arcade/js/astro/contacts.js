// What happens when the astronaut touches things: aliens, the boss, shots,
// hazards, patches, power-ups, O2 tanks and checkpoint flags. Also turns
// the events aliens and hazards report into sounds, dust and screen shake.
import { play } from "../sound.js";
import { bossBox, hurtBoss } from "./bosses.js";
import { enemyBox, isStunned, spawnEnemy } from "./enemies.js";
import { distance } from "./enemyKit.js";
import { dangerBox, pushOut } from "./hazards.js";
import { kickShell } from "./movesWild.js";
import { fillOxygen, maxOxygen } from "./oxygen.js";
import { touchPatches } from "./patches.js";
import { overlaps, touchesSpikes } from "./physics.js";
import { bouncePlayer, startLives } from "./player.js";
import { collectDrops, maybeDrop } from "./powerups.js";
import { afflict } from "./status.js";
import { strikeHit } from "./strikes.js";

export function puff(round, x, y, colour, count = 10) {
  for (let i = 0; i < count; i += 1) {
    const max = 0.4 + Math.random() * 0.4;
    round.dust.push({
      colour,
      life: max,
      max,
      size: 4 + Math.floor(Math.random() * 3) * 2,
      vx: (Math.random() - 0.5) * 360,
      vy: -Math.random() * 260,
      x,
      y,
    });
  }
}

const eventEffects = {
  beam: { sound: "zap" },
  bolt: { colour: "#e8f8ff", shake: 0.2, sound: "zap" },
  burst: { colour: "#d8a070", shake: 0.3, sound: "slam" },
  clang: { sound: "bounce" },
  crash: { colour: "#d8c8b0", shake: 0.3, sound: "slam" },
  crusher: { colour: "#b0b0c0", shake: 0.35, sound: "slam" },
  frost: { colour: "#d8f8ff", sound: "whoosh" },
  geyser: { colour: "#ff9a2a", shake: 0.1, sound: "whoosh" },
  growl: { sound: "whoosh" },
  hiss: { sound: "whoosh" },
  laser: { sound: "zap" },
  orb: { sound: "slime" },
  quake: { colour: "#d8c8b0", shake: 0.35, sound: "slam" },
  rock: { colour: "#a08070", shake: 0.15, sound: "kill" },
  rumble: { colour: "#c89060", shake: 0.08 },
  screech: { sound: "whoosh" },
  spike: { colour: "#d8f8ff", shake: 0.15, sound: "slam" },
  spit: { sound: "slime" },
  steam: { colour: "#e8e8e8", sound: "whoosh" },
  throw: { sound: "fire" },
  vine: { colour: "#6ad04a", shake: 0.15, sound: "slam" },
  zap: { sound: "zap" },
};

export function playEvents(round) {
  round.events.forEach((event) => {
    const effect = eventEffects[event.type];
    if (!effect) return;
    if (effect.sound) play(effect.sound);
    if (effect.shake) round.shake = Math.max(round.shake, effect.shake);
    if (effect.colour) puff(round, event.x, event.y, effect.colour, 12);
  });
  round.events = [];
}

const centre = (body) => ({ x: body.x + body.w / 2, y: body.y + body.h / 2 });
const alive = (enemy) => enemy.dying === undefined;
const touchable = (e) => alive(e) && !e.hidden && !e.ghost;

export function killEnemy(game, enemy) {
  const { round } = game;
  const middle = centre(enemy);
  enemy.dying = 0;
  game.score += enemy.small ? Math.round(enemy.def.points / 2) : enemy.def.points;
  puff(round, middle.x, middle.y, "#b6ff7a", 16);
  play("kill");
  (enemy.def.onDeath?.(enemy) ?? []).forEach((spec) => {
    round.enemies.push(spawnEnemy(spec));
  });
  maybeDrop(round, middle.x, middle.y);
}

// One point of damage. A turtle's first hit only knocks it into its shell.
function damageEnemy(game, enemy) {
  if (enemy.def.shell && enemy.state !== "shell" && enemy.state !== "slide") {
    enemy.state = "shell";
    enemy.timer = 4;
    enemy.kickGrace = 0.3;
    game.score += 50;
    game.showToast("KICK THE SHELL!", "#ffd400");
    play("slam");
    return;
  }
  enemy.hp -= 1;
  if (enemy.hp <= 0) {
    killEnemy(game, enemy);
    return;
  }
  enemy.flash = 0.35;
  play("slam");
}

let lastHint = -10;
function hint(game, text, colour = "#ffd400") {
  if (game.clock - lastHint < 2.5) return;
  lastHint = game.clock;
  game.showToast(text, colour);
}

function stompEnemy(game, enemy, hurt) {
  const { player } = game.round;
  if (enemy.def.shell && enemy.state === "shell" && !player.smash) {
    bouncePlayer(player, false);
    kickShell(enemy, player);
    play("bounce");
    return;
  }
  if (enemy.spiky) {
    hurt(centre(enemy).x, "hit");
    hint(game, "OUCH! DON'T STOMP IT NOW!", "#ff8a3a");
    return;
  }
  if (enemy.guarded) {
    bouncePlayer(player, false);
    play("bounce");
    hint(game, "CLANG! WAIT FOR AN OPENING!");
    return;
  }
  if (player.smash || isStunned(enemy)) {
    bouncePlayer(player, true);
    game.round.shake = 0.2;
    damageEnemy(game, enemy);
    return;
  }
  bouncePlayer(player, false);
  play("bounce");
  if (!game.hinted) game.showToast("PRESS DOWN IN THE AIR TO SMASH!", "#ffd400");
  game.hinted = true;
}

function touchEnemy(game, enemy, hurt) {
  const { player } = game.round;
  if (player.powers.star > 0) {
    killEnemy(game, enemy);
    return;
  }
  const feet = player.y + player.h;
  const onTop = player.vy > 0 && feet - enemy.y < Math.min(40, enemy.h / 2);
  if (onTop || player.smash) {
    stompEnemy(game, enemy, hurt);
    return;
  }
  if (enemy.def.shell && enemy.state === "shell") {
    kickShell(enemy, player);
    play("bounce");
    return;
  }
  const harmless = enemy.harmless || isStunned(enemy) || enemy.flash > 0;
  if (!harmless && player.bounceGrace <= 0) hurt(centre(enemy).x, "hit");
}

// Crushers flatten aliens, and so does a kicked turtle shell.
function squashEnemies(game) {
  const { round } = game;
  const flatteners = [
    ...round.hazards.filter((h) => h.kind === "crusher" && dangerBox(h)),
    ...round.enemies.filter((e) => alive(e) && e.state === "slide"),
  ];
  flatteners.forEach((thing) => {
    round.enemies.forEach((enemy) => {
      if (enemy === thing || !touchable(enemy) || !overlaps(enemy, thing)) return;
      killEnemy(game, enemy);
      game.showToast(`SQUASHED! +${enemy.def.points}`, "#39ff14");
    });
  });
}

function collectItems(game) {
  const { round } = game;
  const { player } = round;
  if (collectDrops(game)) play("pickup");
  round.items.forEach((item) => {
    if (item.taken || !overlaps(player, item)) return;
    item.taken = true;
    play("pickup");
    if (item.kind === "flag") {
      round.checkpoint = item.x + item.w / 2;
      game.showToast("CHECKPOINT!", "#00e5ff");
      return;
    }
    puff(round, item.x + item.w / 2, item.y, "#9cf0ff", 10);
    // A tank fills the oxygen meter and gives back one lost life.
    const low = round.oxygen < maxOxygen - 1 || game.lives < startLives;
    fillOxygen(round);
    if (low) {
      game.lives = Math.max(game.lives, Math.min(startLives, game.lives + 1));
      game.showToast("OXYGEN REFILLED!", "#39ff14");
      return;
    }
    game.score += 100;
    game.showToast("OXYGEN FULL! +100", "#39ff14");
  });
}

// Blaster bolts and quake waves.
function friendlyFire(game) {
  const { round } = game;
  const { boss } = round;
  round.bolts.forEach((bolt) => {
    const quake = bolt.kind === "quake";
    round.enemies.forEach((enemy) => {
      if (bolt.spent || !touchable(enemy) || !overlaps(bolt, enemy)) return;
      if (quake && enemy.def.flies) return;
      if (!quake) bolt.spent = true;
      if (enemy.guarded && !quake) {
        play("bounce");
        return;
      }
      damageEnemy(game, enemy);
    });
    if (!boss || bolt.spent || boss.hidden || boss.ghost) return;
    if (!overlaps(bolt, bossBox(boss)) || (quake && bolt.hitBoss)) return;
    bolt.spent = !quake;
    bolt.hitBoss = true;
    if (boss.guarded) {
      play("bounce");
      return;
    }
    const base = quake ? 1 : 0.5;
    hurtBoss(boss, boss.open ? base : base / 2);
    play("hit");
  });
}

function touchBoss(game, hurt) {
  const { round } = game;
  const { boss, player } = round;
  if (!boss || boss.dying !== undefined || boss.hidden || boss.ghost) return;
  const box = bossBox(boss);
  if (boss.aura && distance(player, boss) < boss.aura && player.powers.star <= 0) {
    hurt(centre(boss).x, "hit");
    return;
  }
  if (!overlaps(player, box)) return;
  if (player.powers.star > 0) {
    hurtBoss(boss, 1);
    bouncePlayer(player, false);
    return;
  }
  const feet = player.y + player.h;
  const onTop = player.vy > 0 && feet - box.y < 50;
  if ((onTop || player.smash) && boss.spiky) {
    hurt(centre(boss).x, "hit");
    return;
  }
  if ((onTop || player.smash) && boss.open) {
    bouncePlayer(player, true);
    hurtBoss(boss, 1);
    round.shake = 0.35;
    play("slam");
    return;
  }
  if (onTop || player.smash) {
    bouncePlayer(player, false);
    play("bounce");
    hint(game, boss.guarded ? "CLANG! IT'S GUARDED!" : "WAIT TILL IT'S WORN OUT!");
    return;
  }
  if (boss.open || boss.harmless) return;
  if (player.bounceGrace <= 0) hurt(centre(boss).x, "hit");
}

function touchShots(round, hurt) {
  const { player } = round;
  const shot = round.shots.find((s) => overlaps(player, s));
  if (!shot) return false;
  if (!shot.def.pierce) round.shots = round.shots.filter((s) => s !== shot);
  if (shot.def.effect === "freeze") {
    afflict(player, "frozen", 1.1);
    return true;
  }
  if (shot.def.effect === "confuse") {
    afflict(player, "confused", 3);
    return true;
  }
  hurt(shot.x + shot.w / 2, "hit");
  return true;
}

// Checks everything that can hurt the player this frame. The hurt callback
// takes where the hit came from and what kind it was ("hit" or "spike").
export function resolveContacts(game, hurt) {
  const { round } = game;
  const { level, player } = round;
  pushOut(player, round);
  squashEnemies(game);
  collectItems(game);
  friendlyFire(game);
  const harmfulPatch = touchPatches(round);
  const target = round.enemies.find((e) => {
    return touchable(e) && overlaps(player, enemyBox(e));
  });
  if (target) touchEnemy(game, target, hurt);
  const aura = round.enemies.find((e) => {
    return touchable(e) && e.aura && distance(player, e) < e.aura;
  });
  if (aura && player.powers.star <= 0) hurt(centre(aura).x, "hit");
  touchBoss(game, hurt);
  if (player.hurtFor > 0) return;
  if (touchShots(round, hurt)) return;
  const strike = strikeHit(round);
  if (strike) {
    hurt(strike.x + strike.w / 2, strike.kind === "bolt" ? "spike" : "hit");
    return;
  }
  const hazard = round.hazards.find((h) => {
    const box = dangerBox(h);
    return box && overlaps(player, box);
  });
  if (hazard) {
    if (hazard.kind === "beam" || hazard.kind === "laser") play("zap");
    hurt(hazard.x + hazard.w / 2, hazard.kind === "beam" ? "spike" : "hit");
    return;
  }
  if (harmfulPatch) {
    hurt(harmfulPatch.x + harmfulPatch.w / 2, "hit");
    return;
  }
  const spikes = touchesSpikes(player, level);
  if (spikes) hurt(player.x + player.w / 2, spikes === "above" ? "spike" : "hit");
}
