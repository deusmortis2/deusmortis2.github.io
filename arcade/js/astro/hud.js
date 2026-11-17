// Score, lives (as hearts), the oxygen meter, the math clock, messages,
// title cards and touch buttons.
import { touchButtons } from "./input.js";
import { maxOxygen } from "./oxygen.js";
import { maxLives } from "./player.js";

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

export function text(ctx, value, x, y, options = {}) {
  const { align = "left", colour = "#ffffff", size = 16 } = options;
  ctx.font = `${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = "top";
  ctx.fillStyle = "#000000";
  ctx.fillText(value, x + 3, y + 3);
  ctx.fillStyle = colour;
  ctx.fillText(value, x, y);
}

function drawHeart(ctx, x, y, full) {
  const colours = full
    ? { r: "#ff2e88", w: "#ffffff" }
    : { r: "#3a2a44", w: "#3a2a44" };
  heartArt.forEach((row, dy) => {
    [...row].forEach((ch, dx) => {
      if (!colours[ch]) return;
      ctx.fillStyle = colours[ch];
      ctx.fillRect(x + dx * 4, y + dy * 4, 4, 4);
    });
  });
}

function drawTouch(ctx) {
  ctx.globalAlpha = 0.35;
  touchButtons.forEach((b) => {
    ctx.fillStyle = "#0a0a1f";
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#00e5ff";
    ctx.lineWidth = 4;
    ctx.stroke();
  });
  ctx.globalAlpha = 0.8;
  touchButtons.forEach((b) => {
    text(ctx, b.label, b.x, b.y - 10, { align: "center", size: 22 });
  });
  ctx.globalAlpha = 1;
}

function cardLines(game) {
  const { round } = game;
  const stageNumber = game.stageIndex + 1;
  return {
    clear: [
      "PLANET CLEARED!",
      `SCORE ${game.score}`,
      "BLASTING OFF...",
    ],
    intro: [
      `STAGE ${stageNumber}: ${round.stage.name}`,
      round.stage.tagline,
      "GET READY!",
    ],
    over: [
      "OUT OF LIVES!",
      `SCORE ${game.score}`,
      "RESTARTING THE MISSION...",
    ],
    title: [
      "ASTRO STOMP",
      "JUMP, THEN PRESS DOWN TO SMASH",
      "SPACE OR TAP TO START",
    ],
    won: [
      "MISSION COMPLETE!",
      `FINAL SCORE ${game.score}`,
      "ENTER OR TAP: PLAY AGAIN",
    ],
  }[game.phase];
}

function drawCard(ctx, game) {
  const lines = cardLines(game);
  if (!lines) return;
  ctx.fillStyle = "rgba(10, 10, 31, 0.7)";
  ctx.fillRect(0, 0, width, height);
  const centre = { align: "center" };
  text(ctx, lines[0], width / 2, 170, { ...centre, colour: "#ff2e88", size: 36 });
  text(ctx, lines[1], width / 2, 245, { ...centre, colour: "#ffd400", size: 18 });
  const steady = ["clear", "intro", "over"].includes(game.phase);
  if (steady || Math.floor(game.clock * 2) % 2 === 0) {
    text(ctx, lines[2], width / 2, 320, { ...centre, size: 16 });
  }
  if (game.phase !== "title") return;
  text(ctx, "ARROWS OR A/D TO MOVE", width / 2, 400, { ...centre, colour: "#a8a8c8", size: 12 });
  text(ctx, "3 LIVES. OXYGEN RUNS OUT FAST: GRAB O2 TANKS", width / 2, 425, {
    ...centre,
    colour: "#a8a8c8",
    size: 12,
  });
  text(ctx, "A BOOST EVERY 30 SECONDS REFILLS YOUR OXYGEN", width / 2, 450, {
    ...centre,
    colour: "#a8a8c8",
    size: 12,
  });
}

// The O2 bar under the hearts. It turns red and flashes when it's low.
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
  ctx.fillStyle = low ? (flash ? "#ffffff" : "#ff2e88") : "#00e5ff";
  ctx.fillRect(x, y, Math.round(w * share), 14);
  if (share > 0) return;
  text(ctx, "EMPTY!", x + w + 14, y, { colour: "#ff2e88", size: 14 });
}

function drawStatus(ctx, game) {
  const { round } = game;
  for (let i = 0; i < maxLives; i += 1) {
    drawHeart(ctx, 16 + i * 36, 16, i < game.lives);
  }
  drawOxygen(ctx, round, game.clock);
  text(ctx, `SCORE ${game.score}`, 16, 80, { colour: "#ffd400" });
  const right = { align: "right" };
  text(ctx, `${game.stageIndex + 1}/3 ${round.stage.name}`, width - 16, 16, {
    ...right,
    colour: "#00e5ff",
  });
  const wait = Math.max(0, Math.ceil(game.nextQuestion - game.mathTime));
  text(ctx, `BOOST IN ${wait}`, width - 16, 40, { ...right, colour: "#ff2e88" });
}

export function drawHud(ctx, art, game) {
  if (game.phase !== "title") drawStatus(ctx, game);
  if (game.toast && game.toast.until > game.clock) {
    text(ctx, game.toast.text, width / 2, 110, {
      align: "center",
      colour: game.toast.colour,
      size: 16,
    });
  }
  if (game.input.state.touch && game.phase === "playing") drawTouch(ctx);
  drawCard(ctx, game);
}
