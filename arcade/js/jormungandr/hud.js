// The score bar, the control strip and the full-screen overlays (title,
// realm intro, get ready, game over).
import { drawFitted } from "./art.js";
import { height, realmFor, width } from "./board.js";

const cream = "#ece6d2";
const font = (size) => `${size}px "Press Start 2P"`;

// Text with a black outline, like the labels in the picture.
export function label(ctx, text, x, y, size, colour = cream, align = "center") {
  ctx.font = font(size);
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(3, size / 3);
  ctx.strokeStyle = "#000";
  ctx.strokeText(text, x, y);
  ctx.fillStyle = colour;
  ctx.fillText(text, x, y);
}

const pad = (n) => String(Math.floor(n)).padStart(6, "0");

function drawTop(ctx, art, game) {
  label(ctx, `SCORE: ${pad(game.score)}`, 40, 26, 14, cream, "left");
  label(ctx, `HIGH SCORE: ${pad(game.high)}`, 260, 26, 14, cream, "left");
  label(ctx, "LIVES:", 560, 26, 14, cream, "left");
  for (let i = 0; i < 3; i += 1) {
    ctx.globalAlpha = i < game.lives ? 1 : 0.2;
    drawFitted(ctx, art.heart, 662 + i * 26, 25, 22);
  }
  ctx.globalAlpha = 1;
  label(ctx, `LEVEL: ${game.level}`, 920, 16, 12, cream, "right");
  label(ctx, realmFor(game.level).name, 920, 38, 12, cream, "right");
}

function drawMeter(ctx, x, y, w, fill, colour) {
  ctx.fillStyle = "#000";
  ctx.fillRect(x - 2, y - 2, w + 4, 12);
  ctx.fillStyle = "#1c2433";
  ctx.fillRect(x, y, w, 8);
  ctx.fillStyle = colour;
  ctx.fillRect(x, y, w * Math.max(0, Math.min(1, fill)), 8);
}

function drawBottom(ctx, art, game) {
  const y = 520;
  label(ctx, "BOOST", 40, y, 10, cream, "left");
  const fast = game.speedFor > 0;
  drawMeter(ctx, 100, y - 4, 70, fast ? 1 : game.boost, fast ? "#ff9a3c" : "#7fe7ff");
  label(ctx, "ARROWS: MOVE | SPACE: BOOST | B: POWERUP", 420, y, 10, cream);
  // Thor is the way out of every realm, so the strip keeps him in view.
  drawFitted(ctx, art.thor, 657, y - 2, 30);
  label(ctx, "CATCH HIM", 740, y, 10, "#ffd23a");
  label(ctx, "POWER", 852, y, 10, cream, "right");
  ctx.strokeStyle = "#2c6a80";
  ctx.lineWidth = 2;
  ctx.strokeRect(862, y - 15, 30, 30);
  if (game.held) drawFitted(ctx, art[game.held], 877, y, 26);
}

function dim(ctx, alpha) {
  ctx.fillStyle = `rgba(3, 5, 12, ${alpha})`;
  ctx.fillRect(0, 48, width, 456);
}

const legend = [
  ["apple", "FOOD", "10PTS"],
  ["rune", "RUNE", "50PTS"],
  ["boar", "BOAR", "100PTS"],
  ["egg", "GOLDEN EGG", "GROW +2"],
  ["thor", "THOR RUNS!", "300PTS"],
  ["star", "POWERUP:", "SPEED BOOST"],
  ["potion", "POWERUP:", "SHIELD"],
  ["bolt", "POWERUP:", "ZAP THOR"],
];

function drawTitle(ctx, art, game) {
  dim(ctx, 0.55);
  const w = 640;
  const h = (art.logo.height / art.logo.width) * w;
  ctx.drawImage(art.logo, (width - w) / 2, 66, w, h);
  legend.forEach(([sprite, top, bottom], i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = 195 + col * 190;
    const y = 250 + row * 112;
    drawFitted(ctx, art[sprite], x, y, sprite === "thor" ? 60 : 42);
    label(ctx, top, x, y + 38, 10);
    label(ctx, bottom, x, y + 54, 10);
  });
  if (Math.floor(game.clock * 2) % 2 === 0) {
    label(ctx, "PRESS SPACE OR TAP TO START", width / 2, 478, 14, "#ffd23a");
  }
}

function drawIntro(game, ctx) {
  dim(ctx, 0.45);
  label(ctx, `LEVEL ${game.level}`, width / 2, 220, 28, "#ffd23a");
  label(ctx, realmFor(game.level).name, width / 2, 268, 20);
  label(ctx, "CATCH THOR", width / 2, 318, 10);
  label(ctx, "TO CROSS THE BIFROST", width / 2, 340, 10);
}

// The two game-over choices, as canvas rectangles so they can be clicked.
export const overButtons = [
  { action: "restart", h: 56, text: "RESTART", w: 300, x: 170, y: 330 },
  { action: "continue", h: 56, text: "CONTINUE", w: 330, x: 490, y: 330 },
];

export function buttonAt(point) {
  return overButtons.find((b) => point.x >= b.x && point.x <= b.x + b.w
    && point.y >= b.y && point.y <= b.y + b.h) ?? null;
}

function drawOver(ctx, game) {
  dim(ctx, 0.7);
  label(ctx, "GAME OVER", width / 2, 190, 32, "#ff4d4d");
  label(ctx, `SCORE: ${pad(game.score)}`, width / 2, 250, 14);
  label(ctx, "Start again, or continue where you fell.", width / 2, 290, 10);
  overButtons.forEach((b, i) => {
    const on = i === game.overChoice;
    ctx.fillStyle = on ? "#2c6a80" : "#0e1a26";
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = on ? "#ffd23a" : "#2c6a80";
    ctx.lineWidth = 3;
    ctx.strokeRect(b.x, b.y, b.w, b.h);
    label(ctx, b.text, b.x + b.w / 2, b.y + b.h / 2, 12, on ? "#ffd23a" : cream);
  });
  label(ctx, "LEFT/RIGHT TO CHOOSE, ENTER TO PICK. OR CLICK.", width / 2, 420, 10);
}

function drawToast(ctx, game) {
  if (!game.toast || game.clock > game.toast.until) return;
  label(ctx, game.toast.text, width / 2, 80, 14, game.toast.colour);
}

export function drawHud(ctx, art, game) {
  ctx.fillStyle = "#03050b";
  ctx.fillRect(0, 0, width, 46);
  ctx.fillRect(0, 504, width, height - 504);
  drawTop(ctx, art, game);
  drawBottom(ctx, art, game);
  drawToast(ctx, game);
  if (game.phase === "title") drawTitle(ctx, art, game);
  if (game.phase === "intro") drawIntro(game, ctx);
  if (game.phase === "ready") label(ctx, "GET READY!", width / 2, 230, 24, "#ffd23a");
  if (game.phase === "over") drawOver(ctx, game);
  if (game.phase === "question") dim(ctx, 0.5);
}
