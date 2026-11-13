// Jörmungandr: a snake game across the nine realms. Eat food to grow,
// grab power-ups, and chase Thor when he turns up: catching him is the only
// way to the next realm. A question comes every 30 seconds of play (deaths
// don't reset the clock) and at the end of every realm. Losing all three lives gives
// a choice: start again, or answer 2 questions to carry on.
import { getSession } from "../auth.js";
import { bindFullscreen } from "../fullscreen.js";
import { askQuestion, loadQuestions } from "../questions.js";
import { assignedSource } from "../question-sets.js";
import { play } from "../sound.js";
import { initPage } from "../ui.js";
import { loadArt } from "./art.js";
import { height, realmFor, width } from "./board.js";
import { buttonAt } from "./hud.js";
import { bindInput } from "./input.js";
import { questionEvery, resetSnake, setUpRealm, startMathClock, updatePlay, usePower } from "./play.js";
import { draw } from "./render.js";
import { directions, turn } from "./snake.js";

// The bank the teacher has assigned this game (Teacher page).
const questionSource = await assignedSource("jormungandr");
const questionBonus = 25;
const realmBonus = 100;
const continueQuestions = 2;

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
let art = null;
let input = { boosting: false };

const game = {
  boost: 1,
  clock: 0,
  effects: [],
  held: null,
  high: 0,
  level: 1,
  lives: 3,
  overChoice: 1,
  phase: "title",
  phaseTime: 0,
  score: 0,
  shield: 0,
  speedFor: 0,
  stepClock: 0,
  toast: null,
};

const highKey = () => `mathArcadeJormungandrHigh:${getSession()?.username ?? "guest"}`;

function loadHigh() {
  try {
    return Number(localStorage.getItem(highKey())) || 0;
  } catch {
    return 0;
  }
}

function saveHigh() {
  game.high = Math.max(game.high, game.score);
  try {
    localStorage.setItem(highKey(), String(game.high));
  } catch {
    // Storage blocked: the high score lasts until the page closes.
  }
}

function setPhase(phase) {
  game.phase = phase;
  game.phaseTime = 0;
}

function toast(text, colour) {
  game.toast = { colour, text, until: game.clock + 2.2 };
}

function enterRealm() {
  setUpRealm(game);
  resetSnake(game);
  setPhase("intro");
}

function startGame() {
  game.score = 0;
  game.lives = 3;
  game.level = 1;
  game.held = null;
  game.effects = [];
  startMathClock(game);
  enterRealm();
}

function die() {
  play("hit");
  setPhase("dying");
}

// The 30-second question. Play stops until it's answered right.
async function timedQuestion() {
  setPhase("question");
  await askQuestion({ inputDelay: 300, label: "Answer to keep slithering!", source: questionSource });
  game.nextQuestion += questionEvery;
  game.score += questionBonus;
  game.boost = 1;
  toast(`BOOST! +${questionBonus} & FULL SPEED`, "#39ff14");
  setPhase("playing");
}

// End of a realm: one question, then on to the next realm.
async function realmQuestion() {
  setPhase("question");
  play("win");
  const bonus = realmBonus * game.level;
  await askQuestion({
    inputDelay: 300,
    label: `${realmFor(game.level).name} cleared! Solve it to cross the Bifrost`,
    source: questionSource,
  });
  game.score += bonus;
  saveHigh();
  toast(`REALM BONUS +${bonus}`, "#ffd23a");
  game.level += 1;
  enterRealm();
}

// Answering continueQuestions right refills the lives and carries on in
// the same realm, keeping the score.
async function continueGame() {
  setPhase("question");
  for (let i = 1; i <= continueQuestions; i += 1) {
    // One at a time: each must be right before the next appears.
    await askQuestion({
      inputDelay: 300,
      label: `Continue! Question ${i} of ${continueQuestions}`,
      source: questionSource,
    });
  }
  game.lives = 3;
  resetSnake(game);
  setPhase("ready");
}

function chooseOver(action) {
  if (game.phaseTime < 1) return;
  if (action === "restart") startGame();
  if (action === "continue") continueGame();
}

const hooks = {
  cleared: realmQuestion,
  die,
  question: timedQuestion,
  sound: play,
  toast,
};

function onSteer(name) {
  if (game.phase === "over") {
    if (name === "left") game.overChoice = 0;
    if (name === "right") game.overChoice = 1;
    return;
  }
  if (["intro", "playing", "ready"].includes(game.phase)) turn(game.snake, directions[name]);
}

function onKey(key) {
  const confirm = key === " " || key === "enter";
  if (game.phase === "title" && confirm) startGame();
  if (game.phase === "playing" && key === "b") usePower(game, hooks);
  if (game.phase !== "over") return;
  if (key === "r") chooseOver("restart");
  if (key === "c") chooseOver("continue");
  if (key === "enter") chooseOver(game.overChoice === 0 ? "restart" : "continue");
}

function onTap(point) {
  if (game.phase === "title") startGame();
  if (game.phase !== "over") return;
  const button = buttonAt(point);
  if (button) chooseOver(button.action);
}

function updateDying() {
  if (game.phaseTime < 1.2) return;
  game.lives -= 1;
  if (game.lives > 0) {
    resetSnake(game);
    setPhase("ready");
    return;
  }
  saveHigh();
  game.overChoice = 1;
  setPhase("over");
  play("lose");
}

function update(dt) {
  game.clock += dt;
  game.phaseTime += dt;
  game.effects.forEach((e) => {
    e.age += dt;
  });
  game.effects = game.effects.filter((e) => e.age < e.life);
  if (game.phase === "playing") updatePlay(game, dt, input.boosting, hooks);
  if (game.score > game.high) game.high = game.score;
  if (game.phase === "dying") updateDying();
  const waited = game.phase === "intro" ? 2.2 : 1.2;
  if (["intro", "ready"].includes(game.phase) && game.phaseTime > waited) setPhase("playing");
}

let last = performance.now();
function frame(now) {
  // Cap the step so a background tab doesn't jump the snake into a wall.
  update(Math.min((now - last) / 1000, 0.05));
  last = now;
  draw(ctx, art, game);
  requestAnimationFrame(frame);
}

async function start() {
  if (!initPage()) return;
  canvas.width = width;
  canvas.height = height;
  bindFullscreen(document.getElementById("fullscreen"), document.getElementById("game-frame"));
  try {
    [art] = await Promise.all([
      loadArt(),
      loadQuestions(questionSource),
      document.fonts.load('10px "Press Start 2P"'),
    ]);
  } catch (error) {
    document.getElementById("load-error").textContent = `Error: ${error.message}`;
    return;
  }
  game.high = loadHigh();
  game.level = 1;
  startMathClock(game);
  setUpRealm(game);
  resetSnake(game);
  input = bindInput(canvas, { onKey, onSteer, onTap }, {
    boost: document.getElementById("boost-btn"),
    power: document.getElementById("power-btn"),
  });
  requestAnimationFrame(frame);
}

start();
