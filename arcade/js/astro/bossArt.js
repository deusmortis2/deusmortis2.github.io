// Draws the boss: its picture, how it's feeling (angry, worn out, hit) and
// the extras some bosses carry (a silk thread, a gust, a gravity aura).
import { floorY } from "./bossKit.js";
import { glowAt, hexRgb, mound, tintedCopy } from "./looks.js";

function arrow(ctx, x, y, clock) {
  if (Math.floor(clock * 6) % 2 === 0) return;
  ctx.fillStyle = "#ffd400";
  ctx.beginPath();
  ctx.moveTo(x - 14, y - 22);
  ctx.lineTo(x + 14, y - 22);
  ctx.lineTo(x, y - 4);
  ctx.fill();
  ctx.font = '12px "Press Start 2P", monospace';
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillStyle = "#000000";
  ctx.fillText("SMASH!", x + 2, y - 24);
  ctx.fillStyle = "#ffd400";
  ctx.fillText("SMASH!", x, y - 26);
}

function extras(ctx, boss, cx, clock) {
  if (boss.kind === "broodqueen") {
    ctx.strokeStyle = "rgba(230, 255, 230, 0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, boss.y + 20);
    ctx.stroke();
  }
  const cy = boss.y + boss.h / 2;
  if (boss.aura) {
    ctx.globalAlpha = 0.4 + Math.sin(clock * 20) * 0.15;
    glowAt(ctx, cx, cy, boss.aura + 40, "200, 120, 255", 0.8);
    ctx.globalAlpha = 1;
  }
  if (boss.gust) {
    ctx.fillStyle = "rgba(220, 245, 255, 0.55)";
    for (let i = 0; i < 9; i += 1) {
      const run = ((clock * 700 + i * 113) % 900) * boss.gust;
      ctx.fillRect(cx + run, 120 + i * 36, 60, 3);
    }
  }
}

export function drawBoss(ctx, art, round, clock) {
  const { boss } = round;
  const { def } = boss;
  const image = art.images[def.art];
  const cx = Math.round(boss.x + boss.w / 2 - round.camera);
  if (!image) return;
  if (boss.hidden || boss.sink >= boss.h) {
    mound(ctx, cx, floorY, clock, boss.shake, boss.w + 40);
    return;
  }
  extras(ctx, boss, cx, clock);
  ctx.save();
  if (boss.sink > 0) {
    ctx.beginPath();
    ctx.rect(cx - 400, -100, 800, floorY + 100);
    ctx.clip();
  }
  const anchorY = def.flies ? boss.y + boss.h / 2 : boss.y + boss.h + boss.sink;
  ctx.translate(cx, anchorY);
  if (boss.shake) ctx.translate(Math.sin(clock * 60) * 5, 0);
  if (boss.dying !== undefined) {
    ctx.globalAlpha = Math.max(0, 1 - boss.dying / 1.6);
    ctx.translate(Math.sin(clock * 50) * 8, boss.dying * 40);
  }
  const h = image.height;
  if (boss.glow) glowAt(ctx, 0, def.flies ? 0 : -h / 2, h * 0.6, hexRgb(boss.glow), 0.45);
  const flip = def.faces !== 0 && boss.dir !== def.faces;
  ctx.scale(flip ? -1 : 1, 1 - boss.crouch * 0.35);
  ctx.globalAlpha *= boss.alpha;
  const top = def.flies ? -h / 2 : -h;
  ctx.drawImage(image, -image.width / 2, top);
  if (boss.flash > 0 || boss.dying !== undefined) {
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.6;
    ctx.drawImage(image, -image.width / 2, top);
    ctx.globalCompositeOperation = "source-over";
  }
  if (boss.angry && boss.dying === undefined) {
    ctx.globalAlpha = 0.12 + Math.abs(Math.sin(clock * 5)) * 0.18;
    ctx.drawImage(tintedCopy(image, "red"), -image.width / 2, top);
  }
  ctx.restore();
  if (boss.open && boss.dying === undefined) {
    arrow(ctx, cx, boss.y + boss.h * boss.crouch + boss.sink - 10, clock);
  }
}
