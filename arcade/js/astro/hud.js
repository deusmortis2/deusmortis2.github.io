// Score, lives (as hearts), the oxygen meter, power-ups, the boss's health,
// the math clock, messages, title cards and touch buttons.
import { bossName } from "./bosses.js";
import { powerLetters } from "./hazardArt.js";
import { touchButtons } from "./input.js";
import { drawPlanetBar } from "./machineArt.js";
import { stages } from "./levels.js";
import { maxOxygen } from "./oxygen.js";
import { startLives } from "./player.js";
import { powerInfo } from "./powerups.js";

const font = '"Press Start 2P", monospace';
const width = 960;
const height = 540;

const heartArt = [
  ".rr.rr.",
  "rwrrrrr",
  "rrrrrrr",
  ".rrrrr.",
  "..rrr..",
  "...r...",
];

// Where the title screen's continue button sits (canvas pixels).
export const continueButton = { h: 44, w: 520, x: 220, y: 466 };

// Drawing text is one of the slowest things a canvas does, and the HUD
// redraws the same words every frame. Each line (with its drop shadow) is
// drawn once into a little canvas and reused until it changes.
const textPad = 2;
const shadow = 3;
const textCache = new Map();
const keptTexts = 300;

function textImage(value, size, colour) {
  const key = `${size}|${colour}|${value}`;
  if (textCache.has(key)) return textCache.get(key);
  const canvas = document.createElement("canvas");
  const c = canvas.getContext("2d");
  c.font = `${size}px ${font}`;
  const textWidth = Math.ceil(c.measureText(value).width);
  canvas.width = textWidth + shadow + textPad * 2;
  canvas.height = Math.ceil(size * 1.25) + shadow + textPad * 2;
  // Resizing a canvas resets its settings.
  c.font = `${size}px ${font}`;
  c.textBaseline = "top";
  c.fillStyle = "#000000";
  c.fillText(value, textPad + shadow, textPad + shadow);
  c.fillStyle = colour;
  c.fillText(value, textPad, textPad);
  const image = { canvas, textWidth };
  // Until the pixel font arrives, don't keep a copy in the fallback font.
  if (!document.fonts.check(`${size}px ${font}`)) return image;
  if (textCache.size >= keptTexts) textCache.clear();
  textCache.set(key, image);
  return image;
}

export function text(ctx, value, x, y, options = {}) {
  const { align = "left", colour = "#ffffff", size = 16 } = options;
  const { canvas, textWidth } = textImage(String(value), size, colour);
  let left = x;
  if (align === "center") left = x - textWidth / 2;
  if (align === "right") left = x - textWidth;
  ctx.drawImage(canvas, Math.round(left) - textPad, Math.round(y) - textPad);
}

const heartImages = new Map();

function heartImage(full) {
  if (heartImages.has(full)) return heartImages.get(full);
  const colours = full
    ? { r: "#ff2e88", w: "#ffffff" }
    : { r: "#3a2a44", w: "#3a2a44" };
  const canvas = document.createElement("canvas");
  canvas.width = heartArt[0].length * 4;
  canvas.height = heartArt.length * 4;
  const c = canvas.getContext("2d");
  heartArt.forEach((row, dy) => {
    [...row].forEach((ch, dx) => {
      if (!colours[ch]) return;
      c.fillStyle = colours[ch];
      c.fillRect(dx * 4, dy * 4, 4, 4);
    });
  });
  heartImages.set(full, canvas);
  return canvas;
}

function drawHeart(ctx, x, y, full) {
  ctx.drawImage(heartImage(full), x, y);
}

function drawTouch(ctx, game) {
  const armed = game.round.player.powers.blaster > 0;
  const buttons = touchButtons.filter((b) => b.action !== "fire" || armed);
  ctx.globalAlpha = 0.35;
  buttons.forEach((b) => {
    ctx.fillStyle = "#0a0a1f";
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = b.action === "fire" ? "#ff2e88" : "#00e5ff";
    ctx.lineWidth = 4;
    ctx.stroke();
  });
  ctx.globalAlpha = 0.8;
  buttons.forEach((b) => {
    text(ctx, b.label, b.x, b.y - 10, { align: "center", size: 22 });
  });
  ctx.globalAlpha = 1;
}

function cardLines(game) {
  const { round } = game;
  const stageNumber = game.stageIndex + 1;
  return {
    clear: [
      `PLANET CLEARED IN ${game.clearTime}!`,
      `SCORE ${game.score}`,
      "BLASTING OFF...",
    ],
    intro: [
      `PLANET ${stageNumber}: ${round.stage.name}`,
      round.stage.tagline,
      "GET READY!",
    ],
    over: [
      "OUT OF LIVES!",
      "SCORE RESET TO 0",
      "BACK TO THE LAST CHECKPOINT...",
    ],
    title: [
      "ASTRO STOMP",
      "JUMP, THEN PRESS DOWN TO SMASH",
      "SPACE OR TAP: NEW MISSION",
    ],
    won: [
      "SOLAR SYSTEM SAVED!",
      `FINAL SCORE ${game.score}`,
      "ENTER OR TAP: PLAY AGAIN",
    ],
  }[game.phase];
}

function drawTitleExtras(ctx, game) {
  const small = { align: "center", colour: "#a8a8c8", size: 12 };
  text(ctx, "ARROWS OR A/D TO MOVE. X FIRES A BLASTER POWER-UP", width / 2, 370, small);
  text(ctx, "8 PLANETS, A BOSS ON EACH. OXYGEN RUNS OUT FAST: GRAB O2", width / 2, 395, small);
  text(ctx, "A BOOST EVERY 30 SECONDS. CLEAR PLANETS FAST FOR BONUS POINTS", width / 2, 420, small);
  if (game.saved <= 0) return;
  const b = continueButton;
  ctx.fillStyle = "rgba(0, 229, 255, 0.15)";
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.strokeStyle = "#00e5ff";
  ctx.lineWidth = 3;
  ctx.strokeRect(b.x, b.y, b.w, b.h);
  const name = stages[game.saved].name;
  text(ctx, `C OR TAP HERE: CONTINUE ON ${name}`, width / 2, b.y + 14, {
    align: "center",
    colour: "#00e5ff",
    size: 14,
  });
}

function drawCard(ctx, art, game) {
  const lines = cardLines(game);
  if (!lines) return;
  ctx.fillStyle = "rgba(10, 10, 31, 0.7)";
  ctx.fillRect(0, 0, width, height);
  const centre = { align: "center" };
  text(ctx, lines[0], width / 2, 150, { ...centre, colour: "#ff2e88", size: 36 });
  text(ctx, lines[1], width / 2, 225, { ...centre, colour: "#ffd400", size: 18 });
  const steady = ["clear", "intro", "over"].includes(game.phase);
  if (steady || Math.floor(game.clock * 2) % 2 === 0) {
    text(ctx, lines[2], width / 2, 295, { ...centre, size: 16 });
  }
  if (game.phase === "intro") {
    drawPlanetBar(ctx, art.images.planets, game.stageIndex, width / 2, 385);
  }
  if (game.phase === "title") drawTitleExtras(ctx, game);
}

// The O2 bar under the hearts. It turns red and flashes when it's low, and
// turns green while you're in poison gas.
function drawOxygen(ctx, round, clock) {
  const share = round.oxygen / maxOxygen;
  const low = share < 0.25;
  const x = 60;
  const y = 50;
  const w = 220;
  text(ctx, "O2", 16, y, { colour: low ? "#ff2e88" : "#9cf0ff", size: 14 });
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(x - 3, y - 3, w + 6, 20);
  ctx.fillStyle = "#3a2a44";
  ctx.fillRect(x, y, w, 14);
  const flash = low && Math.floor(clock * 4) % 2 === 0;
  let colour = low ? (flash ? "#ffffff" : "#ff2e88") : "#00e5ff";
  if (round.poisoned) colour = "#9cd020";
  ctx.fillStyle = colour;
  ctx.fillRect(x, y, Math.round(w * share), 14);
  if (round.poisoned) text(ctx, "POISON!", x + w + 14, y, { colour: "#9cd020", size: 14 });
  if (share > 0 || round.poisoned) return;
  text(ctx, "EMPTY!", x + w + 14, y, { colour: "#ff2e88", size: 14 });
}

// A row of the power-ups you have, each with its seconds left.
function drawPowers(ctx, player) {
  const { powers } = player;
  let x = 16;
  Object.keys(powerInfo).forEach((kind) => {
    const left = powers[kind];
    if (!left || left <= 0) return;
    const { colour, seconds } = powerInfo[kind];
    ctx.fillStyle = "#0a0a1f";
    ctx.fillRect(x, 108, 30, 30);
    ctx.strokeStyle = colour;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, 108, 30, 30);
    text(ctx, powerLetters[kind], x + 15, 116, { align: "center", colour, size: 12 });
    if (seconds) text(ctx, String(Math.ceil(left)), x + 15, 142, { align: "center", size: 10 });
    x += 38;
  });
}

function drawBossBar(ctx, boss) {
  const w = 360;
  const x = width / 2 - w / 2;
  const y = height - 34;
  text(ctx, bossName(boss), width / 2, y - 22, { align: "center", colour: "#ff8a3a", size: 12 });
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(x - 3, y - 3, w + 6, 18);
  ctx.fillStyle = "#3a2a44";
  ctx.fillRect(x, y, w, 12);
  ctx.fillStyle = boss.angry ? "#ff2e88" : "#ff8a3a";
  ctx.fillRect(x, y, Math.round((w * boss.hp) / boss.max), 12);
}

function drawStatus(ctx, game) {
  const { round } = game;
  const hearts = Math.max(startLives, game.lives);
  for (let i = 0; i < hearts; i += 1) {
    drawHeart(ctx, 16 + i * 36, 16, i < game.lives);
  }
  drawOxygen(ctx, round, game.clock);
  text(ctx, `SCORE ${game.score}`, 16, 80, { colour: "#ffd400" });
  drawPowers(ctx, round.player);
  const right = { align: "right" };
  text(ctx, `${game.stageIndex + 1}/${stages.length} ${round.stage.name}`, width - 16, 16, {
    ...right,
    colour: "#00e5ff",
  });
  const wait = Math.max(0, Math.ceil(game.nextQuestion - game.mathTime));
  text(ctx, `BOOST IN ${wait}`, width - 16, 40, { ...right, colour: "#ff2e88" });
  const { boss } = round;
  if (boss && boss.dying === undefined) drawBossBar(ctx, boss);
}

export function drawHud(ctx, art, game) {
  if (game.phase !== "title") drawStatus(ctx, game);
  if (game.toast && game.toast.until > game.clock) {
    text(ctx, game.toast.text, width / 2, 160, {
      align: "center",
      colour: game.toast.colour,
      size: 16,
    });
  }
  if (game.input.state.touch && game.phase === "playing") drawTouch(ctx, game);
  drawCard(ctx, art, game);
}
