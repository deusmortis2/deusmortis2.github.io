// One frame of play on a planet: the astronaut, aliens, boss, hazards,
// power-ups and effects, then the camera. Also starts the boss fight when
// the astronaut walks into the arena, and lands the rocket once it's won.
import { play } from "../sound.js";
import { arenaOf, bossPoints, createBoss, updateBoss } from "./bosses.js";
import { killEnemy, playEvents, puff, resolveContacts } from "./contacts.js";
import { updateEnemy } from "./enemies.js";
import { updateHazards } from "./hazards.js";
import { arenaCols, setGate, tile } from "./levels.js";
import { tips } from "./minions.js";
import { updatePatches } from "./patches.js";
import { updatePlayer } from "./player.js";
import {
  bossDrops,
  quakeWaves,
  tickPowers,
  tryFire,
  updateBolts,
  updateDrops,
} from "./powerups.js";
import { viewWidth } from "./render.js";
import { updateShots } from "./shots.js";
import { updateStrikes } from "./strikes.js";

function playerEvents(game, events) {
  const { round } = game;
  const { player } = round;
  if (events.includes("jump")) play("jump");
  if (events.includes("boost")) {
    play("whoosh");
    puff(round, player.x + player.w / 2, player.y + player.h, "#ffd400", 8);
  }
  if (!events.includes("slam")) return;
  round.shake = 0.25;
  puff(round, player.x + player.w / 2, player.y + player.h, "#d8c8b0", 12);
  play("slam");
  if (player.powers.quake > 0) quakeWaves(round);
}

// Walking into the arena shuts the gate behind you and wakes the boss.
function checkArena(game) {
  const { round } = game;
  const { level, player, stage } = round;
  if (round.fight !== "before") return;
  if (player.x < (level.arena + 1) * tile) return;
  setGate(level, true);
  round.fight = "on";
  round.boss = createBoss(stage.arena.boss, level);
  round.checkpoint = "arena";
  const { left } = arenaOf(level);
  round.enemies = round.enemies.filter((e) => e.x > left);
  game.showToast(`BOSS: ${round.boss.def.name}!`, "#ff8a3a");
  play("fire");
}

function bossBeaten(game) {
  const { round } = game;
  const { boss, rocket } = round;
  round.fight = "won";
  game.score += bossPoints;
  game.showToast(`BOSS DEFEATED! +${bossPoints}`, "#39ff14");
  play("kill");
  round.shake = 0.6;
  bossDrops(round, boss.x + boss.w / 2, boss.y + boss.h / 2);
  round.enemies.forEach((enemy) => {
    if (enemy.dying === undefined) killEnemy(game, enemy);
  });
  round.shots = [];
  round.strikes = [];
  rocket.drop = 620;
}

function updateRocket(round, dt) {
  const { rocket } = round;
  if (rocket.drop === undefined || rocket.landed) return;
  rocket.drop = Math.max(0, rocket.drop - 380 * dt);
  if (rocket.drop > 0) return;
  rocket.landed = true;
  round.shake = 0.3;
  puff(round, rocket.x, rocket.y, "#d8c8b0", 16);
  play("slam");
}

// The first time an alien with a trick comes on screen, say what it does.
function showTips(game) {
  const { round } = game;
  if (game.toast && game.toast.until > game.clock) return;
  const seen = round.enemies.find((e) => {
    const onScreen = e.x > round.camera && e.x < round.camera + viewWidth - 60;
    return onScreen && tips[e.kind] && !game.tipped.has(e.kind);
  });
  if (!seen) return;
  game.tipped.add(seen.kind);
  game.showToast(tips[seen.kind], "#ffd400");
}

function moveCamera(round, dt) {
  const { level, player } = round;
  let ideal = player.x + player.w / 2 - viewWidth * 0.4;
  if (round.fight !== "before") {
    const { left } = arenaOf(level);
    ideal = left - (viewWidth - arenaCols * tile) / 2;
  }
  const camera = Math.min(Math.max(ideal, 0), level.width - viewWidth);
  round.camera += (camera - round.camera) * Math.min(1, dt * 8);
}

function updateDust(round, dt) {
  round.dust = round.dust.filter((d) => {
    d.life -= dt;
    d.vy += 900 * dt;
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    return d.life > 0;
  });
  round.shake = Math.max(0, round.shake - dt);
}

export function updateWorld(game, dt, hurt) {
  const { input, round } = game;
  const { level, player } = round;
  playerEvents(game, updatePlayer(player, input, dt, level));
  if (tryFire(round, input)) play("fire");
  tickPowers(player.powers, dt);
  updateHazards(round, dt);
  round.enemies.forEach((enemy) => updateEnemy(enemy, dt, round));
  round.enemies = round.enemies.filter((e) => {
    return !e.gone && !(e.dying > 0.45);
  });
  if (round.boss) updateBoss(round.boss, dt, round);
  updateStrikes(round, dt);
  updateShots(round, dt).forEach((shot) => {
    puff(round, shot.x + shot.w / 2, shot.y + shot.h / 2, "#c8ff7a", 5);
  });
  updateBolts(round, dt);
  updatePatches(round, dt);
  updateDrops(round, dt);
  playEvents(round);
  resolveContacts(game, hurt);
  const { boss } = round;
  if (boss && boss.dying !== undefined && round.fight === "on") bossBeaten(game);
  if (boss && boss.dying > 1.6) round.boss = null;
  checkArena(game);
  updateRocket(round, dt);
  showTips(game);
  updateDust(round, dt);
  moveCamera(round, dt);
}
