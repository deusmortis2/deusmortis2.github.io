// Draws the board, items, the serpent and Thor.
import { boardImage, drawFitted } from "./art.js";
import { drawBody } from "./body.js";
import { cell, centreX, centreY, realmIndex } from "./board.js";
import { drawHud } from "./hud.js";
import { thorLeaving, thorPosition } from "./thor.js";

// The head was cut from a picture where it's tilted snout-down, so its
// throat rises toward the back of the head. Turning it back by this much
// levels the throat with the belly and lines the neck up with the body.
const headTilt = (18 * Math.PI) / 180;

const glows = { bolt: "#5fd8ff", egg: "#ffd23a", rune: "#3fe0ff" };

function drawItems(ctx, art, items, clock) {
  items.list.forEach((item) => {
    // Blink for the last two seconds before it vanishes.
    const left = item.life - item.age;
    if (left < 2 && Math.floor(clock * 8) % 2 === 0) return;
    const bob = Math.sin(clock * 4 + item.x) * 2;
    const glow = glows[item.kind];
    if (glow) {
      ctx.shadowColor = glow;
      ctx.shadowBlur = 10 + Math.sin(clock * 5) * 4;
    }
    const size = item.kind === "boar" ? cell + 6 : cell - 4;
    drawFitted(ctx, art[item.kind], centreX(item.x), centreY(item.y) + bob, size);
    ctx.shadowBlur = 0;
  });
}

// The head sprite faces left with its jaw at the bottom. It's mirrored when
// the belly is on the right of travel (see bellySide in snake.js), then
// turned to face the way the serpent is heading.
function drawHead(ctx, art, snake, shielded, clock) {
  const head = snake.body[0];
  const { dir } = snake;
  const x = centreX(head.x) + dir.x * 4;
  const y = centreY(head.y) + dir.y * 4;
  const mirrored = head.belly < 0;
  const facing = mirrored ? 0 : Math.PI;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.atan2(dir.y, dir.x) - facing);
  if (mirrored) ctx.scale(-1, 1);
  ctx.rotate(headTilt);
  drawFitted(ctx, art.head, 0, 0, 39);
  ctx.restore();
  if (!shielded) return;
  ctx.strokeStyle = `rgba(57, 255, 20, ${0.55 + Math.sin(clock * 8) * 0.25})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 28, 0, Math.PI * 2);
  ctx.stroke();
}

export function drawSnake(ctx, art, snake, options) {
  const points = snake.body.map((c) => ({
    belly: c.belly,
    x: centreX(c.x),
    y: centreY(c.y),
  }));
  if (options.hidden) return;
  drawBody(ctx, points, snake.body);
  drawHead(ctx, art, snake, options.shielded, options.clock);
}

function drawStunStars(ctx, x, y, clock) {
  ctx.fillStyle = "#ffe14d";
  for (let i = 0; i < 3; i += 1) {
    const a = clock * 4 + (i * Math.PI * 2) / 3;
    ctx.fillRect(x + Math.cos(a) * 18 - 2, y - 34 + Math.sin(a) * 5 - 2, 5, 5);
  }
}

function drawThor(ctx, art, thor, clock) {
  if (thorLeaving(thor) && Math.floor(clock * 10) % 2 === 0) return;
  const pos = thorPosition(thor);
  const x = centreX(pos.x);
  const y = centreY(pos.y);
  const running = thor.stunned <= 0;
  const bob = running ? Math.abs(Math.sin(clock * 14)) * -4 : 0;
  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.beginPath();
  ctx.ellipse(x, y + 18, 18, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.translate(x, y - 6 + bob);
  ctx.scale(thor.facing, 1);
  if (!running) ctx.rotate(Math.sin(clock * 20) * 0.08);
  drawFitted(ctx, art.thor, 0, 0, 66);
  ctx.restore();
  if (!running) drawStunStars(ctx, x, y, clock);
}

function drawEffects(ctx, effects) {
  effects.forEach((e) => {
    const t = e.age / e.life;
    ctx.globalAlpha = 1 - t;
    if (e.type === "text") {
      ctx.font = '12px "Press Start 2P"';
      ctx.textAlign = "center";
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#000";
      ctx.strokeText(e.text, e.x, e.y - t * 26);
      ctx.fillStyle = e.colour;
      ctx.fillText(e.text, e.x, e.y - t * 26);
    }
    if (e.type === "zap") drawZap(ctx, e);
    if (e.type === "burst") {
      ctx.strokeStyle = e.colour;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(e.x, e.y, 8 + t * 30, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  });
}

// A jagged lightning bolt from the top of the board down onto Thor.
function drawZap(ctx, e) {
  ctx.strokeStyle = "#bff4ff";
  ctx.shadowColor = "#3fd0ff";
  ctx.shadowBlur = 16;
  ctx.lineWidth = 4;
  ctx.beginPath();
  let x = e.x + 30;
  ctx.moveTo(x, 50);
  for (let y = 50; y < e.y; y += 24) {
    x += (e.seed[Math.floor(y / 24) % e.seed.length] - 0.5) * 30;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(e.x, e.y);
  ctx.stroke();
  ctx.shadowBlur = 0;
}

export function draw(ctx, art, game) {
  ctx.fillStyle = "#03050b";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.drawImage(boardImage(art, realmIndex(game.level)), 0, 0);
  if (game.phase !== "title") drawItems(ctx, art, game.items, game.clock);
  const title = game.phase === "title";
  if (game.thor && !title) drawThor(ctx, art, game.thor, game.clock);
  const dying = game.phase === "dying";
  drawSnake(ctx, art, game.snake, {
    clock: game.clock,
    hidden: title || (dying && Math.floor(game.phaseTime * 10) % 2 === 0),
    shielded: game.shield > 0,
  });
  drawEffects(ctx, game.effects);
  drawHud(ctx, art, game);
}
