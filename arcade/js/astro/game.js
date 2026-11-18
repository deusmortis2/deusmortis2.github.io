// Astro Stomp: an eight-planet platformer from Mercury out to Neptune. Jump,
// then press down to smash aliens, get past each planet's hazards and beat
// the boss at the end to reach the rocket. Oxygen drains all the time, and
// an empty meter costs lives. Losing your last life sends you back to the
// last checkpoint on that planet (a flag, or the boss's door). A math
// question pops up every 30 seconds: a right answer refills oxygen, and
// either way you get a short shield.
import { askQuestion, loadQuestions } from "../questions.js";
import { assignedSource } from "../question-sets.js";
import { play } from "../sound.js";
import { bindFullscreen } from "../fullscreen.js";
import { recordRun } from "../leaderboard.js";
import { initPage } from "../ui.js";
import { loadArt, loadZone } from "./art.js";
import { createEnemy } from "./enemies.js";
import { createHazard } from "./hazards.js";
import { continueButton } from "./hud.js";
import { createInput } from "./input.js";
import { buildLevel, stages, tile } from "./levels.js";
import { breathe, fillOxygen } from "./oxygen.js";
import { touchesLava } from "./physics.js";
import {
  createPlayer,
  hurtPlayer,
  newPowers,
  placePlayer,
  startLives,
} from "./player.js";
import { draw, viewHeight, viewWidth } from "./render.js";
import { updateWorld } from "./world.js";

// The bank the teacher has assigned this game (Teacher page).
const questionSource = await assignedSource("astro");
const launchBonus = 500;
const questionEvery = 30;
const shieldSeconds = 2.5;
const answerBonus = 100;
const savedKey = "astroStompReached";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const input = createInput(canvas, viewWidth);
let art = null;

function readSaved() {
  try {
    return Number(localStorage.getItem(savedKey)) || 0;
  } catch {
    return 0;
  }
}

function writeSaved(index) {
  try {
    if (index > readSaved()) localStorage.setItem(savedKey, String(index));
  } catch {
    // Private windows can refuse storage; continuing just isn't offered.
  }
}

const game = {
  checkpointScore: 0,
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
  powers: newPowers(),
  round: null,
  saved: readSaved(),
  score: 0,
  stageIndex: 0,
  tipped: new Set(),
  toast: null,
};

// Starts a planet, or restarts it from a checkpoint: an x position, or
// "arena" for just outside the boss's door.
function newRound(index, checkpoint = null) {
  const stage = stages[index];
  const level = buildLevel(stage);
  const make = (spec) => createHazard(spec, level);
  game.stageIndex = index;
  game.checkpointScore = game.score;
  game.toast = null;
  const player = createPlayer(stage.start, game.powers);
  const items = stage.items.map(make);
  if (checkpoint !== null) {
    const x = checkpoint === "arena" ? (level.arena - 3) * tile : checkpoint;
    placePlayer(player, { x, y: 10 * tile });
    items.forEach((item) => {
      if (item.kind === "flag" && item.x < x + tile) item.taken = true;
    });
  }
  game.round = {
    bolts: [],
    boss: null,
    camera: Math.max(0, player.x - viewWidth * 0.4),
    checkpoint,
    drops: [],
    dust: [],
    enemies: stage.enemies.map(createEnemy),
    events: [],
    fight: "before",
    hazards: stage.hazards.map(make),
    items,
    level,
    patches: [],
    player,
    poisoned: false,
    rocket: { landed: false, lift: 0, x: (level.arena + 17) * tile, y: 10 * tile },
    shake: 0,
    shots: [],
    stage,
    strikes: [],
  };
  fillOxygen(game.round);
  if (!art) return;
  loadZone(art, stage.id);
  if (stages[index + 1]) loadZone(art, stages[index + 1].id);
}

function setPhase(phase) {
  game.phase = phase;
  game.phaseTime = 0;
}

function showToast(text, colour = "#39ff14") {
  game.toast = { colour, text, until: game.clock + 2.5 };
}
game.showToast = showToast;

function startMission(index = 0) {
  game.score = 0;
  game.lives = startLives;
  game.mathTime = 0;
  game.nextQuestion = questionEvery;
  game.powers = newPowers();
  game.tipped = new Set();
  newRound(index);
  writeSaved(index);
  setPhase("intro");
}

// Every 30 seconds. A right answer refills oxygen and scores a bonus; a
// wrong one still gets the shield, so nobody is hit mid-question.
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
  round.player.status.frozen = 0;
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

// The last life is gone: back to the last checkpoint on this planet.
function gameOver() {
  play("lose");
  recordRun("astro", game.score);
  setPhase("over");
}

function retryPlanet() {
  const { checkpoint } = game.round;
  game.lives = startLives;
  // Points scored since the checkpoint are lost with the lives.
  game.score = game.checkpointScore;
  game.powers = newPowers();
  newRound(game.stageIndex, checkpoint);
  setPhase("intro");
}

function loseLife() {
  game.lives -= 1;
  play("hit");
  if (game.lives <= 0) gameOver();
}

// Fell in a pit or lava (respawn on safe ground), or got hit by an alien,
// a shot or a hazard. Kind is "fell", "hit" or "spike". A star can't be
// hurt, and a shield soaks up one hit.
function hurt(fromX, kind) {
  const { round } = game;
  const { player } = round;
  const { powers } = player;
  if (game.phase !== "playing") return;
  if (kind !== "fell" && (player.hurtFor > 0 || powers.star > 0)) return;
  round.shake = 0.3;
  if (kind !== "fell" && powers.shield > 0) {
    powers.shield = 0;
    player.hurtFor = 1;
    player.status.frozen = 0;
    showToast("SHIELD BROKEN!", "#00e5ff");
    play("bounce");
    return;
  }
  if (kind === "fell") {
    placePlayer(player, player.safe);
    player.hurtFor = 1.4;
  } else {
    hurtPlayer(player, fromX, kind === "spike");
  }
  loseLife();
}

// An empty oxygen meter takes a life every couple of seconds.
function choke() {
  const { round } = game;
  round.shake = 0.2;
  round.player.hurtFor = 0.6;
  showToast("NO OXYGEN! FIND A TANK!", "#ff2e88");
  loseLife();
}

function updatePlaying(dt) {
  updateWorld(game, dt, hurt);
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
  if (rocket.landed && atRocket && player.onGround) {
    launch();
    return;
  }
  if (game.mathTime >= game.nextQuestion) runQuestion();
}

// On the title screen: a new mission, or carry on from the furthest planet
// reached before.
function updateTitle() {
  const { tap } = input.state;
  const b = continueButton;
  const onContinue = tap && tap.x > b.x && tap.x < b.x + b.w && tap.y > b.y && tap.y < b.y + b.h;
  const carryOn = game.saved > 0 && (input.pressed("cont") || (input.pressed("start") && onContinue));
  if (carryOn) {
    startMission(game.saved);
    return;
  }
  if (input.pressed("start")) startMission(0);
}

function nextPlanet() {
  const next = game.stageIndex + 1;
  if (next < stages.length) {
    newRound(next);
    writeSaved(next);
    game.saved = readSaved();
    setPhase("intro");
    return;
  }
  play("win");
  setPhase("won");
}

function update(dt) {
  game.clock += dt;
  game.phaseTime += dt;
  const start = input.pressed("start");
  if (game.phase === "title") updateTitle();
  const ready = art && art.ready[game.round.stage.id];
  if (game.phase === "intro" && game.phaseTime > 2 && ready) {
    setPhase("playing");
    if (game.stageIndex === 0 && !game.hinted) {
      showToast("JUMP, THEN PRESS DOWN TO SMASH!", "#ffd400");
    }
  }
  // Out of lives: back to the checkpoint after a moment.
  const restart = game.phaseTime > 3.5 || (start && game.phaseTime > 1.5);
  if (game.phase === "over" && restart) retryPlanet();
  if (game.phase === "playing") updatePlaying(dt);
  if (game.phase === "clear") {
    game.round.rocket.lift += (120 + game.phaseTime * 500) * dt;
    game.round.shake = 0.1;
  }
  if (game.phase === "clear" && game.phaseTime > 2.6) nextPlanet();
  if (game.phase === "won" && start && game.phaseTime > 1.5) {
    game.saved = 0;
    startMission(0);
  }
}

function startLoop() {
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
    const [loaded] = await Promise.all([
      loadArt(),
      loadQuestions(questionSource),
      document.fonts.load('16px "Press Start 2P", monospace'),
    ]);
    art = loaded;
    await loadZone(art, stages[0].id);
    loadZone(art, stages[game.saved]?.id ?? stages[0].id);
    // Leaving mid-trip still counts the score so far.
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) recordRun("astro", game.score);
    });
    startLoop();
  } catch (error) {
    document.getElementById("load-error").textContent = `Error: ${error.message}`;
  }
}

start();
