// Astro Stomp: a three-planet platformer. Jump, then press down to smash
// aliens, and get past each planet's hazards. Oxygen drains all the time, and
// an empty meter costs lives. You get 3 lives for the whole mission, shown as
// hearts, and losing the last one starts the mission again. A math question
// pops up every 30 seconds: a right answer refills oxygen, and either way you
// get a short shield.
import { askQuestion, loadQuestions } from "../questions.js";
import { assignedSource } from "../question-sets.js";
import { play } from "../sound.js";
import { bindFullscreen } from "../fullscreen.js";
import { recordRun } from "../leaderboard.js";
import { initPage } from "../ui.js";
import { loadArt, mirrorSheet } from "./art.js";
import { playEvents, puff, resolveContacts } from "./contacts.js";
import { createEnemy, updateEnemy } from "./enemies.js";
import { createHazard, updateHazards } from "./hazards.js";
import { createInput } from "./input.js";
import { buildLevel, stages, tile } from "./levels.js";
import { breathe, fillOxygen } from "./oxygen.js";
import { touchesLava } from "./physics.js";
import {
  createPlayer,
  hurtPlayer,
  placePlayer,
  updatePlayer,
} from "./player.js";
import { draw, viewHeight, viewWidth } from "./render.js";
import { updateShots } from "./shots.js";

// The bank the teacher has assigned this game (Teacher page).
const questionSource = await assignedSource("astro");
const launchBonus = 500;
const questionEvery = 30;
const shieldSeconds = 2.5;
const answerBonus = 100;
const startLives = 3;

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const input = createInput(canvas, viewWidth);

const game = {
  clock: 0,
  hinted: false,
  input,
  lives: startLives,
  // The math clock runs across the whole mission: losing a life and new
  // planets don't reset it.
  mathTime: 0,
  nextQuestion: questionEvery,
  phase: "title",
  phaseTime: 0,
  round: null,
  score: 0,
  stageIndex: 0,
  stageScore: 0,
  toast: null,
};

// Starts a planet, or restarts it from a checkpoint (an x position).
function newRound(index, checkpoint = null) {
  const stage = stages[index];
  const level = buildLevel(stage);
  const make = (spec) => createHazard(spec, level);
  game.stageIndex = index;
  game.stageScore = game.score;
  game.toast = null;
  const player = createPlayer(stage.start);
  const items = stage.items.map(make);
  if (checkpoint !== null) {
    placePlayer(player, { x: checkpoint, y: 10 * tile });
    items.forEach((item) => {
      if (item.kind === "flag") item.taken = true;
    });
  }
  const camera = Math.max(0, player.x - viewWidth * 0.4);
  game.round = {
    camera,
    checkpoint,
    dust: [],
    enemies: stage.enemies.map(createEnemy),
    events: [],
    hazards: stage.hazards.map(make),
    items,
    level,
    player,
    rocket: { lift: 0, x: stage.rocket * tile + tile / 2, y: 10 * tile },
    shake: 0,
    shots: [],
    stage,
  };
  fillOxygen(game.round);
}

function setPhase(phase) {
  game.phase = phase;
  game.phaseTime = 0;
}

function showToast(text, colour = "#39ff14") {
  game.toast = { colour, text, until: game.clock + 2.5 };
}
game.showToast = showToast;

function startMission() {
  game.score = 0;
  game.lives = startLives;
  game.mathTime = 0;
  game.nextQuestion = questionEvery;
  newRound(0);
  setPhase("intro");
}

// Every 30 seconds of play. A right answer refills oxygen and scores a
// bonus; a wrong one still gets the shield, so nobody is hit mid-question.
async function runQuestion() {
  setPhase("question");
  input.clear();
  const correct = await askQuestion({
    inputDelay: 300,
    label: "Answer to refill your oxygen!",
    source: questionSource,
  });
  input.clear();
  const { round } = game;
  game.nextQuestion += questionEvery;
  round.player.hurtFor = shieldSeconds;
  round.shots = [];
  if (correct) {
    game.score += answerBonus;
    fillOxygen(round);
    showToast(`BOOST! +${answerBonus} & FULL OXYGEN`);
  } else {
    showToast("SHIELD UP! NO OXYGEN", "#00e5ff");
  }
  setPhase("playing");
}

function launch() {
  game.score += launchBonus;
  showToast(`PLANET CLEARED! +${launchBonus}`);
  game.round.player.hidden = true;
  // The leaderboard keeps the best score from one trip across the planets.
  recordRun("astro", game.score);
  play("launch");
  setPhase("clear");
}

// The last life is gone: the whole mission starts again.
function gameOver() {
  play("lose");
  recordRun("astro", game.score);
  setPhase("over");
}

// Fell in a pit or lava (respawn on safe ground), or got hit by an alien,
// a shot or a hazard. Kind is "fell", "hit" or "spike".
function hurt(fromX, kind) {
  const { round } = game;
  const { player } = round;
  if (game.phase !== "playing") return;
  if (kind !== "fell" && player.hurtFor > 0) return;
  game.lives -= 1;
  round.shake = 0.3;
  play("hit");
  if (kind === "fell") {
    placePlayer(player, player.safe);
    player.hurtFor = 1.4;
  } else {
    hurtPlayer(player, fromX, kind === "spike");
  }
  if (game.lives <= 0) gameOver();
}

// An empty oxygen meter takes a life every couple of seconds.
function choke() {
  const { round } = game;
  game.lives -= 1;
  round.shake = 0.2;
  round.player.hurtFor = 0.6;
  play("hit");
  showToast("NO OXYGEN! FIND A TANK!", "#ff2e88");
  if (game.lives <= 0) gameOver();
}

function updateWorld(dt) {
  const { round } = game;
  const { level, player } = round;
  const events = updatePlayer(player, input, dt, level);
  if (events.includes("jump")) play("jump");
  if (events.includes("slam")) {
    round.shake = 0.25;
    puff(round, player.x + player.w / 2, player.y + player.h, "#d8c8b0", 12);
    play("slam");
  }
  updateHazards(round, dt);
  round.enemies.forEach((enemy) => updateEnemy(enemy, dt, round));
  round.enemies = round.enemies.filter((e) => {
    return !e.gone && !(e.dying > 0.45);
  });
  updateShots(round, dt).forEach((shot) => {
    puff(round, shot.x + shot.w / 2, shot.y + shot.h / 2, "#c8ff7a", 5);
  });
  playEvents(round);
  resolveContacts(game, hurt);
  round.dust = round.dust.filter((d) => {
    d.life -= dt;
    d.vy += 900 * dt;
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    return d.life > 0;
  });
  round.shake = Math.max(0, round.shake - dt);
  const ideal = player.x + player.w / 2 - viewWidth * 0.4;
  const camera = Math.min(Math.max(ideal, 0), level.width - viewWidth);
  round.camera += (camera - round.camera) * Math.min(1, dt * 8);
}

function updatePlaying(dt) {
  updateWorld(dt);
  const { player, rocket, level } = game.round;
  if (game.phase !== "playing") return;
  game.mathTime += dt;
  if (breathe(game.round, dt)) {
    choke();
    if (game.phase !== "playing") return;
  }
  const fell = player.y > level.height + 40 || touchesLava(player, level);
  if (fell) {
    hurt(player.x, "fell");
    return;
  }
  const atRocket = Math.abs(player.x + player.w / 2 - rocket.x) < 36;
  if (atRocket && player.onGround) {
    launch();
    return;
  }
  if (game.mathTime >= game.nextQuestion) runQuestion();
}

function update(dt) {
  game.clock += dt;
  game.phaseTime += dt;
  const start = input.pressed("start");
  if (game.phase === "title" && start) startMission();
  if (game.phase === "intro" && game.phaseTime > 2) {
    setPhase("playing");
    if (game.stageIndex === 0 && !game.hinted) {
      showToast("JUMP, THEN PRESS DOWN TO SMASH!", "#ffd400");
    }
  }
  // Out of lives: the mission restarts on its own after a moment.
  const restart = game.phaseTime > 4 || (start && game.phaseTime > 1.5);
  if (game.phase === "over" && restart) startMission();
  if (game.phase === "playing") updatePlaying(dt);
  if (game.phase === "clear") {
    game.round.rocket.lift += (120 + game.phaseTime * 500) * dt;
    game.round.shake = 0.1;
  }
  if (game.phase === "clear" && game.phaseTime > 2.6) {
    const next = game.stageIndex + 1;
    if (next < stages.length) {
      newRound(next);
      setPhase("intro");
    } else {
      play("win");
      setPhase("won");
    }
  }
  if (game.phase === "won" && start && game.phaseTime > 1.5) startMission();
}

function startLoop(art) {
  let last = performance.now();
  const frame = (now) => {
    // Cap the step so a background tab doesn't teleport everything.
    update(Math.min((now - last) / 1000, 0.05));
    input.endFrame();
    last = now;
    draw(ctx, art, game);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

async function start() {
  if (!initPage()) return;
  canvas.width = viewWidth;
  canvas.height = viewHeight;
  ctx.imageSmoothingEnabled = false;
  bindFullscreen(
    document.getElementById("fullscreen"),
    document.getElementById("game-frame"),
  );
  newRound(0);
  try {
    const [art] = await Promise.all([
      loadArt(stages.map((s) => s.palette)),
      loadQuestions(questionSource),
      document.fonts.load('16px "Press Start 2P"'),
    ]);
    art.mirrored = mirrorSheet(art.images.astronaut);
    // Leaving mid-trip still counts the score so far.
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) recordRun("astro", game.score);
    });
    startLoop(art);
  } catch (error) {
    document.getElementById("load-error").textContent = `Error: ${error.message}`;
  }
}

start();
