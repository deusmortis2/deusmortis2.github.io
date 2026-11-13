// What happens while the serpent is moving: steps, crashes, eating,
// catching Thor, power-ups and the timers that bring up questions.
import { centreX, centreY, inside } from "./board.js";
import { createItems, foods, isPower, itemAt, powers, removeItem, updateItems } from "./items.js";
import { advance, bodyAt, createSnake, sideTurns, takeTurn } from "./snake.js";
import { nextThorIn, spawnThor, stunSeconds, thorPoints, updateThor } from "./thor.js";

export const questionEvery = 30;
const boostSeconds = 2.5;
const boostRefill = 6;
const speedSeconds = 8;
const shieldSeconds = 15;
const thorReturnIn = 6;

// Seconds per step: faster each level, and faster again when boosting.
function stepSeconds(game, boosting) {
  const base = Math.max(0.14, 0.26 - (game.level - 1) * 0.01);
  const fast = game.speedFor > 0 || (boosting && game.boost > 0);
  return fast ? base * 0.55 : base;
}

function thorAt(game, x, y) {
  return Boolean(game.thor && game.thor.x === x && game.thor.y === y);
}

// On the board and clear of the snake and Thor.
export function isFree(game, x, y) {
  return inside(x, y) && !bodyAt(game.snake, x, y) && !thorAt(game, x, y);
}

function deadly(game, c) {
  return !inside(c.x, c.y) || bodyAt(game.snake, c.x, c.y, true);
}

export function addEffect(game, effect) {
  game.effects.push({ age: 0, life: 0.9, ...effect });
}

function floatText(game, c, text, colour) {
  addEffect(game, { colour, text, type: "text", x: centreX(c.x), y: centreY(c.y) - 14 });
}

// A fresh realm: new items, snake and timers.
export function setUpRealm(game) {
  game.snake = createSnake();
  game.items = createItems();
  game.thor = null;
  game.thorClock = nextThorIn(game.level);
  // Catching Thor is the only way out of a realm.
  game.thorCaught = false;
}

// The math clock counts seconds of play across the whole game. Losing a
// life or crossing to a new realm doesn't reset it.
export function startMathClock(game) {
  game.roundTime = 0;
  game.nextQuestion = questionEvery;
}

// After losing a life: the snake starts again, keeping the board.
export function resetSnake(game) {
  game.snake = createSnake();
  game.items.list = game.items.list.filter((item) => !bodyAt(game.snake, item.x, item.y));
  if (game.thor && Math.abs(game.thor.y - 5) <= 1 && game.thor.x <= 9) {
    game.thor = null;
    game.thorClock = Math.min(game.thorClock, 4);
  }
  game.shield = 0;
  game.speedFor = 0;
  game.boost = 1;
  game.stepClock = 0;
}

function eatFood(game, item, hooks) {
  const food = foods[item.kind];
  const points = food.points * (game.speedFor > 0 ? 2 : 1);
  game.score += points;
  game.snake.grow += food.grow;
  floatText(game, item, `+${points}`, item.kind === "egg" ? "#ffd23a" : "#ece6d2");
  hooks.sound(item.kind === "apple" ? "pickup" : "kill");
}

function eat(game, c, hooks) {
  const item = itemAt(game.items, c.x, c.y);
  if (item) {
    removeItem(game.items, item);
    if (isPower(item)) {
      game.held = item.kind;
      hooks.toast(`${powers[item.kind].name}! PRESS B TO USE`, powers[item.kind].colour);
      hooks.sound("jump");
    } else {
      eatFood(game, item, hooks);
    }
  }
  if (!thorAt(game, c.x, c.y)) return;
  const points = thorPoints * (game.speedFor > 0 ? 2 : 1);
  game.score += points;
  game.snake.grow += 1;
  addEffect(game, { colour: "#ffd23a", type: "burst", x: centreX(c.x), y: centreY(c.y) });
  floatText(game, c, `+${points}`, "#ffd23a");
  hooks.toast(`YOU CAUGHT THOR! +${points}`, "#ffd23a");
  hooks.sound("win");
  game.thor = null;
  game.thorCaught = true;
}

// A shield turns a crash into a swerve to the left or right, if either is
// open. Either way the shield is used up and the snake doesn't move.
function shieldSave(game, hooks) {
  game.shield = 0;
  const head = game.snake.body[0];
  const swerve = sideTurns(game.snake).find((d) => !deadly(game, { x: head.x + d.x, y: head.y + d.y }));
  addEffect(game, { colour: "#39ff14", type: "burst", x: centreX(head.x), y: centreY(head.y) });
  hooks.toast("THE SHIELD SAVED YOU!", "#39ff14");
  hooks.sound("bounce");
  if (!swerve) return;
  game.snake.dir = swerve;
  game.snake.queue = [];
}

function moveSnake(game, hooks) {
  const next = takeTurn(game.snake);
  if (deadly(game, next)) {
    if (game.shield > 0) {
      shieldSave(game, hooks);
      return;
    }
    hooks.die();
    return;
  }
  advance(game.snake, next);
  eat(game, next, hooks);
}

export function usePower(game, hooks) {
  const kind = game.held;
  if (!kind) return;
  game.held = null;
  hooks.toast(`${powers[kind].name}!`, powers[kind].colour);
  if (kind === "star") game.speedFor = speedSeconds;
  if (kind === "potion") game.shield = shieldSeconds;
  if (kind !== "bolt") {
    hooks.sound("correct");
    return;
  }
  // Lightning: Thor is stunned where he stands. If he isn't here, it
  // drags him onto the board, stunned.
  game.thor ??= spawnThor((x, y) => isFree(game, x, y), game.snake.body[0]);
  if (!game.thor) return;
  game.thor.stunned = stunSeconds;
  game.thor.moveClock = 1;
  const seed = Array.from({ length: 12 }, () => Math.random());
  addEffect(game, { life: 0.5, seed, type: "zap", x: centreX(game.thor.x), y: centreY(game.thor.y) });
  hooks.sound("zap");
}

function updateThorTimer(game, dt, hooks) {
  const free = (x, y) => isFree(game, x, y);
  const head = game.snake.body[0];
  if (game.thor) {
    if (updateThor(game.thor, dt, free, head)) return;
    game.thor = null;
    // He's the only way on, so he doesn't stay away long.
    game.thorClock = thorReturnIn;
    hooks.toast("THOR GOT AWAY!", "#7fe7ff");
    return;
  }
  game.thorClock -= dt;
  if (game.thorClock > 0) return;
  game.thor = spawnThor(free, head);
  game.thorClock = nextThorIn(game.level);
  if (!game.thor) return;
  hooks.toast("THOR IS HERE! CATCH HIM!", "#ff4d4d");
  hooks.sound("launch");
}

function updateTimers(game, dt, boosting) {
  game.roundTime += dt;
  game.shield = Math.max(0, game.shield - dt);
  game.speedFor = Math.max(0, game.speedFor - dt);
  const draining = boosting && game.speedFor <= 0 && game.boost > 0;
  const change = draining ? -dt / boostSeconds : dt / boostRefill;
  game.boost = Math.max(0, Math.min(1, game.boost + change));
}

// `hooks`: die(), cleared(), question(), toast(text, colour), sound(name).
export function updatePlay(game, dt, boosting, hooks) {
  updateTimers(game, dt, boosting);
  game.stepClock += dt;
  const step = stepSeconds(game, boosting);
  for (let i = 0; i < 2 && game.stepClock >= step; i += 1) {
    game.stepClock -= step;
    moveSnake(game, hooks);
    if (game.phase !== "playing") return;
    if (game.thorCaught) break;
  }
  game.stepClock = Math.min(game.stepClock, step);
  const head = game.snake.body[0];
  updateItems(game.items, dt, (x, y) => isFree(game, x, y), head);
  updateThorTimer(game, dt, hooks);
  if (game.thorCaught) {
    hooks.cleared();
    return;
  }
  if (game.roundTime >= game.nextQuestion) hooks.question();
}
