// Deus Draconis: fly through three stages of monsters, each ending with a
// wyrm boss. Kills level the dragon up for faster fireball recharge, and
// every few levels the player picks a power-up. Halfway through a stage,
// questions pop up until one is right, for a shield, points and full fire.
import { askQuestion, loadQuestions } from "../questions.js";
import { assignedSource } from "../question-sets.js";
import { play } from "../sound.js";
import { bindFullscreen } from "../fullscreen.js";
import { initPage } from "../ui.js";
import { createBoss, updateBoss } from "./boss.js";
import { burnFoes, dragonHit } from "./combat.js";
import { dragonBounds, dragonSpeed, dragonStart, height, width } from "./entities.js";
import { bindInput } from "./input.js";
import { createMonster, updateMonster } from "./monsters.js";
import {
  addXp,
  createFireballs,
  createProgress,
  maxAmmo,
  powerInfo,
  refillSeconds,
  rollChoices,
  speedBoost,
  takePower,
  wardReady,
} from "./powers.js";
import { draw } from "./render.js";
import { choiceAt } from "./render-hud.js";
import { buildScenery, createScenery, updateScenery } from "./scenery.js";
import { updateShot } from "./shots.js";
import { buildSpawns, stageSeconds, stages } from "./stages.js";
import { buildSprites, loadDragon, loadMonsters } from "./sprites.js";

// The bank the teacher has assigned this game (Teacher page).
const questionSource = await assignedSource("draconis");
const questionEvery = 30;
const shieldSeconds = 2.5;
const bonusPoints = 10;
const stageBonus = 25;
const wardSeconds = 20;
// While power-up cards are showing, the action slows to this speed.
const choosingPace = 0.35;
// At game over, this many right answers buys a full set of lives.
const continueQuestions = 2;

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const sprites = buildSprites();
let keys = new Set();

const game = {
  bossCheckpoint: false,
  // The boss's health when the dragon last died fighting it, so a respawn
  // (or a continue) picks the fight up where it was. Null means full health.
  bossHp: null,
  choice: null,
  clock: 0,
  deaths: 0,
  mathTime: 0,
  nextQuestion: questionEvery,
  phase: "title",
  phaseTime: 0,
  progress: createProgress(),
  round: null,
  score: 0,
  scenery: null,
  sceneryArt: null,
  stage: 0,
  stageBonus: 0,
  toast: null,
};

// A round is one attempt at the current stage. Losing a life restarts it,
// or restarts at the boss once the boss has been reached, with the boss
// keeping the damage it had already taken.
function newRound() {
  const atBoss = game.bossCheckpoint;
  const spawns = buildSpawns(stages[game.stage]);
  const round = {
    ammo: maxAmmo(game.progress),
    ammoClock: 0,
    boss: null,
    dragon: { ...dragonStart },
    effects: [],
    fireballs: [],
    incoming: [],
    invincibleFor: 0,
    monsters: [],
    shots: [],
    spawnIndex: atBoss ? spawns.length : 0,
    spawns,
    time: atBoss ? stageSeconds - 1 : 0,
    xpClock: 0,
  };
  // Monsters and shots call this to fire. New shots join after the update.
  round.spawnShots = (list, sound) => {
    round.incoming.push(...list);
    if (sound && game.phase === "playing") play(sound);
  };
  game.round = round;
}

function setPhase(phase) {
  game.phase = phase;
  game.phaseTime = 0;
}

function showToast(text, colour) {
  game.toast = { colour, text, until: game.clock + 2.5 };
}

function startStage(index) {
  game.stage = index;
  game.bossCheckpoint = false;
  game.bossHp = null;
  game.scenery = createScenery(stages[index].scenery);
  newRound();
  setPhase("intro");
}

function startGame() {
  game.score = 0;
  game.deaths = 0;
  game.progress = createProgress();
  game.choice = null;
  // The math clock runs across the whole game: dying, the boss and new
  // stages don't reset it.
  game.mathTime = 0;
  game.nextQuestion = questionEvery;
  startStage(0);
}

function fire() {
  const { round } = game;
  if (round.ammo <= 0) return;
  round.ammo -= 1;
  round.fireballs.push(...createFireballs(round.dragon, game.progress));
  play("fire");
}

// Input is "fire" (space), "enter" or "tap". Space never restarts from an
// end screen, so mashing fire can't skip past the final score.
function onAction(input) {
  if (game.phase === "playing" && input !== "enter") fire();
  if (game.phase === "title") startGame();
  const waited = input !== "fire" && game.phaseTime > 1.5;
  if (game.phase === "over" && waited) continueGame();
  if (game.phase === "won" && waited) startGame();
}

// Game over isn't a restart: answering continueQuestions right refills the
// lives and carries on from the same stage (or its boss), keeping the
// score, level and power-ups.
async function continueGame() {
  setPhase("question");
  keys.clear();
  for (let i = 1; i <= continueQuestions; i += 1) {
    // One at a time: each must be right before the next appears.
    await askQuestion({
      inputDelay: 300,
      label: `Continue! Question ${i} of ${continueQuestions}`,
      source: questionSource,
    });
  }
  game.deaths = 0;
  game.choice = null;
  play("correct");
  setPhase("revived");
}

function moveDragon(dx, dy) {
  const { dragon } = game.round;
  dragon.x = Math.min(Math.max(dragon.x + dx, dragonBounds.minX), dragonBounds.maxX);
  dragon.y = Math.min(Math.max(dragon.y + dy, dragonBounds.minY), dragonBounds.maxY);
}

function openChoice() {
  const { progress } = game;
  if (game.choice || progress.choices <= 0) return;
  progress.choices -= 1;
  const options = rollChoices(progress);
  if (options.length === 0) return;
  game.choice = options;
  play("jump");
}

function pickPower(index) {
  const id = game.choice?.[index];
  if (!id) return;
  takePower(game.progress, id);
  if (id === "ammo") game.round.ammo += 1;
  game.choice = null;
  showToast(`${powerInfo(id).name}!`, powerInfo(id).colour);
  play("correct");
  openChoice();
}

function gainXp(amount) {
  const gained = addXp(game.progress, amount);
  if (gained === 0) return;
  showToast(`LEVEL ${game.progress.level}! FASTER RECHARGE`, "#7fe7ff");
  play("correct");
  openChoice();
}

async function runQuestion() {
  setPhase("question");
  keys.clear();
  const correct = await askQuestion({
    inputDelay: 300,
    label: "Answer to power up!",
    source: questionSource,
  });
  const { round } = game;
  game.nextQuestion += questionEvery;
  round.invincibleFor = shieldSeconds;
  if (correct) {
    game.score += bonusPoints;
    round.ammo = maxAmmo(game.progress);
    showToast(`BOOST! +${bonusPoints} & FULL FIRE`, "#39ff14");
  } else {
    showToast("SHIELD UP! NO BONUS", "#00e5ff");
  }
  setPhase("playing");
}

function held(...names) {
  return names.some((name) => keys.has(name));
}

function steerDragon(dt) {
  const step = dragonSpeed * speedBoost(game.progress) * dt;
  const dx = (held("arrowright", "d") ? step : 0) - (held("arrowleft", "a") ? step : 0);
  const dy = (held("arrowdown", "s") ? step : 0) - (held("arrowup", "w") ? step : 0);
  moveDragon(dx, dy);
}

function refillAmmo(round, dt) {
  const full = maxAmmo(game.progress);
  round.ammoClock = round.ammo < full ? round.ammoClock + dt : 0;
  if (round.ammoClock < refillSeconds(game.progress)) return;
  round.ammo += 1;
  round.ammoClock = 0;
}

function spawnFoes(round) {
  const stage = stages[game.stage];
  while (round.spawns[round.spawnIndex]?.at <= round.time) {
    round.monsters.push(createMonster(round.spawns[round.spawnIndex].kind, stage.pace));
    round.spawnIndex += 1;
  }
  if (round.boss || round.bossDown || round.time < stageSeconds) return;
  round.boss = createBoss(stage.boss);
  if (game.bossHp !== null) round.boss.hp = game.bossHp;
  game.bossCheckpoint = true;
  showToast(`${stage.boss.name} APPROACHES!`, "#ff4d4d");
  play("launch");
}

// The boss falls: a chain of explosions, and its minions and shots go too.
function bossDown(boss) {
  const { round } = game;
  for (let i = 0; i < 10; i += 1) {
    round.effects.push({
      age: -i * 0.12,
      life: 0.5,
      size: 30 + Math.random() * 20,
      type: "boom",
      x: boss.x + (Math.random() - 0.5) * 90,
      y: boss.y + (Math.random() - 0.5) * 60,
    });
  }
  round.monsters.forEach((m) => {
    m.alive = false;
  });
  round.shots = [];
  round.incoming = [];
  round.bossDown = true;
  showToast(`${boss.spec.name} DEFEATED! +${boss.points}`, "#ffd400");
  play("win");
}

function reward(result, target) {
  const { round } = game;
  if (result === "blocked") {
    round.effects.push({ age: 0, type: "clink", x: target.x, y: target.y });
    play("bounce");
    return;
  }
  if (result === "hurt") {
    play("slam");
    return;
  }
  game.score += result;
  gainXp(result);
  play("kill");
  if (target.boss) bossDown(target);
}

function updateFoes(round, dt) {
  round.monsters = round.monsters.filter((m) => updateMonster(m, dt, round));
  if (round.boss && !updateBoss(round.boss, dt, round)) round.boss = null;
  round.shots = round.shots.filter((s) => updateShot(s, dt, round));
  round.shots.push(...round.incoming);
  round.incoming = [];
  round.effects.forEach((e) => {
    e.age += dt;
  });
  round.effects = round.effects.filter((e) => e.age < (e.life ?? 0.4));
}

// Ember ward soaks up one hit, then needs time to recharge.
function takeHit() {
  const { progress, round } = game;
  if (!wardReady(progress)) {
    if (round.boss?.alive) game.bossHp = round.boss.hp;
    play("hit");
    setPhase("dying");
    return;
  }
  progress.ward = wardSeconds;
  round.invincibleFor = 1.2;
  round.effects.push({ age: 0, life: 0.5, type: "ward", x: round.dragon.x, y: round.dragon.y });
  showToast("EMBER WARD BLOCKED IT!", "#00e5ff");
  play("bounce");
}

function clearStage() {
  game.stageBonus = stageBonus * (game.stage + 1);
  game.score += game.stageBonus;
  if (game.stage < stages.length - 1) {
    setPhase("clear");
    return;
  }
  setPhase("won");
}

function updatePlaying(dt) {
  const { round } = game;
  round.time += dt;
  game.mathTime += dt;
  round.invincibleFor = Math.max(0, round.invincibleFor - dt);
  game.progress.ward = Math.max(0, game.progress.ward - dt);
  // A trickle of XP for staying alive, so levels keep coming.
  round.xpClock += dt;
  if (round.xpClock >= 1) {
    round.xpClock -= 1;
    gainXp(1);
  }
  steerDragon(dt);
  refillAmmo(round, dt);
  spawnFoes(round);
  updateFoes(round, dt);
  burnFoes(round, game.progress, dt, reward);
  if (round.invincibleFor <= 0 && dragonHit(round)) {
    takeHit();
    if (game.phase === "dying") return;
  }
  if (round.bossDown && !round.boss) {
    clearStage();
    return;
  }
  if (game.mathTime >= game.nextQuestion) runQuestion();
}

function updateDying() {
  if (game.phaseTime <= 1.2) return;
  game.deaths += 1;
  if (game.deaths < 3) {
    setPhase("ready");
    return;
  }
  setPhase("over");
  play("lose");
}

function update(dt) {
  game.clock += dt;
  game.phaseTime += dt;
  const pace = game.choice && game.phase === "playing" ? choosingPace : 1;
  if (game.phase !== "question") updateScenery(game.scenery, dt * pace);
  if (game.phase === "playing") updatePlaying(dt * pace);
  if (game.phase === "clear") updateFoes(game.round, dt);
  if (game.phase === "dying") updateDying();
  if (game.phase === "clear" && game.phaseTime > 2.5) startStage(game.stage + 1);
  if (game.phase === "intro" && game.phaseTime > 2.2) setPhase("playing");
  const respawning = game.phase === "ready" || game.phase === "revived";
  if (respawning && game.phaseTime > 2) {
    newRound();
    setPhase("playing");
  }
}

let last = performance.now();
function frame(now) {
  // Cap the step so a background tab doesn't teleport everything.
  update(Math.min((now - last) / 1000, 0.05));
  last = now;
  draw(ctx, sprites, game);
  requestAnimationFrame(frame);
}

async function start() {
  if (!initPage()) return;
  canvas.width = width;
  canvas.height = height;
  ctx.imageSmoothingEnabled = false;
  bindFullscreen(
    document.getElementById("fullscreen"),
    document.getElementById("game-frame"),
  );
  game.sceneryArt = buildScenery();
  game.scenery = createScenery("day");
  newRound();
  try {
    await Promise.all([
      loadQuestions(questionSource),
      loadDragon(sprites),
      loadMonsters(sprites),
      document.fonts.load('10px "Press Start 2P"'),
    ]);
  } catch (error) {
    document.getElementById("load-error").textContent = `Error: ${error.message}`;
    return;
  }
  keys = bindInput(canvas, {
    onAction,
    onDrag: (dx, dy) => {
      if (game.phase === "playing") moveDragon(dx, dy);
    },
    onPick: pickPower,
    pickAt: (point) => (game.choice ? choiceAt(game.choice, point) : -1),
  });
  requestAnimationFrame(frame);
}

start();
