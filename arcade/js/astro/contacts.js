// What happens when the astronaut touches things: aliens, hazards, thrown
// shots, oxygen tanks and checkpoint flags. Also turns the events that aliens
// and hazards report into sounds, dust and screen shake.
import { play } from "../sound.js";
import { isStunned } from "./enemies.js";
import { dangerBox, pushOut } from "./hazards.js";
import { fillOxygen, maxOxygen } from "./oxygen.js";
import { overlaps, touchesSpikes } from "./physics.js";
import { bouncePlayer, maxHearts } from "./player.js";

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
  crash: { colour: "#d8c8b0", shake: 0.3, sound: "slam" },
  crusher: { colour: "#b0b0c0", shake: 0.35, sound: "slam" },
  geyser: { colour: "#ff9a2a", shake: 0.1, sound: "whoosh" },
  orb: { sound: "slime" },
  quake: { colour: "#d8c8b0", shake: 0.35, sound: "slam" },
  rock: { colour: "#a08070", shake: 0.15, sound: "kill" },
  throw: { sound: "fire" },
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

function killEnemy(game, enemy) {
  enemy.dying = 0;
  game.score += enemy.def.points;
  puff(game.round, enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, "#b6ff7a", 16);
  play("kill");
}

function hitEnemy(game, enemy) {
  const { player } = game.round;
  enemy.hp -= 1;
  bouncePlayer(player, true);
  game.round.shake = 0.2;
  if (enemy.hp <= 0) {
    killEnemy(game, enemy);
    return;
  }
  enemy.flash = 0.35;
  play("slam");
  const left = enemy.hp === 1 ? "ONE MORE SMASH!" : `${enemy.hp} MORE SMASHES!`;
  const angry = enemy.kind === "brute" ? " IT'S ANGRY!" : "";
  game.showToast(left + angry, angry ? "#ff8a3a" : "#ffd400");
}

function touchEnemy(game, enemy, hurt) {
  const { player } = game.round;
  const feet = player.y + player.h;
  const onTop = player.vy > 0 && feet - enemy.y < Math.min(40, enemy.h / 2);
  if (player.smash || (isStunned(enemy) && onTop)) {
    hitEnemy(game, enemy);
    return;
  }
  if (onTop) {
    bouncePlayer(player, false);
    play("bounce");
    if (!game.hinted) game.showToast("PRESS DOWN IN THE AIR TO SMASH!", "#ffd400");
    game.hinted = true;
    return;
  }
  const harmless = isStunned(enemy) || enemy.flash > 0 || player.bounceGrace > 0;
  if (!harmless) hurt(enemy.x + enemy.w / 2, "hit");
}

// Crushers flatten aliens too, which is worth luring them into.
function squashEnemies(game) {
  const { round } = game;
  round.hazards.forEach((hazard) => {
    if (hazard.kind !== "crusher" || !dangerBox(hazard)) return;
    round.enemies.forEach((enemy) => {
      if (enemy.dying !== undefined || !overlaps(enemy, hazard)) return;
      killEnemy(game, enemy);
      game.showToast(`SQUASHED! +${enemy.def.points}`, "#39ff14");
    });
  });
}

function collectItems(game) {
  const { round } = game;
  const { player } = round;
  round.items.forEach((item) => {
    if (item.taken || !overlaps(player, item)) return;
    if (item.kind === "flag") {
      item.taken = true;
      round.checkpoint = item.x + item.w / 2;
      game.stageScore = game.score;
      game.showToast("CHECKPOINT!", "#00e5ff");
      play("pickup");
      return;
    }
    item.taken = true;
    play("pickup");
    puff(round, item.x + item.w / 2, item.y, "#9cf0ff", 10);
    // A tank fills the oxygen meter and patches up one heart.
    const low = round.oxygen < maxOxygen - 1 || round.hearts < maxHearts;
    fillOxygen(round);
    if (low) {
      round.hearts = Math.min(maxHearts, round.hearts + 1);
      game.showToast("OXYGEN REFILLED!", "#39ff14");
      return;
    }
    game.score += 100;
    game.showToast("OXYGEN FULL! +100", "#39ff14");
  });
}

// Checks everything that can hurt the player this frame. The hurt callback
// takes where the hit came from and what kind it was ("hit" or "spike").
export function resolveContacts(game, hurt) {
  const { round } = game;
  const { level, player } = round;
  pushOut(player, round);
  squashEnemies(game);
  collectItems(game);
  const target = round.enemies.find((e) => {
    return e.dying === undefined && overlaps(player, e);
  });
  if (target) touchEnemy(game, target, hurt);
  if (player.hurtFor > 0) return;
  const shot = round.shots.find((s) => overlaps(player, s));
  if (shot) {
    round.shots = round.shots.filter((s) => s !== shot);
    hurt(shot.x + shot.w / 2, "hit");
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
  if (touchesSpikes(player, level)) hurt(player.x + player.w / 2, "spike");
}
