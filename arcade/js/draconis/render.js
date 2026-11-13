// Drawing for Deus Draconis. Pure output: reads game state, never changes it.
import { width } from "./entities.js";
import { rank } from "./powers.js";
import {
  drawBoss,
  drawEffects,
  drawMonster,
  drawMonsterShadows,
  drawShots,
  glow,
} from "./render-foes.js";
import { drawHud, drawOverlay, text } from "./render-hud.js";
import { drawScenery, shadowStyles } from "./scenery.js";
import { flapOrder } from "./sprites.js";

const flapFps = 5;

function drawCentred(ctx, sprite, x, y) {
  ctx.drawImage(sprite, Math.round(x - sprite.width / 2), Math.round(y - sprite.height / 2));
}

export function flapFrame(clock) {
  return flapOrder[Math.floor(clock * flapFps) % flapOrder.length];
}

function drawShield(ctx, game, x, y) {
  const pulse = 0.5 + 0.5 * Math.sin(game.clock * 12);
  ctx.globalCompositeOperation = "lighter";
  glow(ctx, x, y, 44, "rgba(0, 229, 255, 0.28)", "rgba(0, 229, 255, 0)");
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = `rgba(0, 229, 255, ${0.5 + pulse * 0.4})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 40 + pulse * 3, 0, Math.PI * 2);
  ctx.stroke();
}

function drawDragon(ctx, sprites, game) {
  const { dragon, invincibleFor } = game.round;
  const frame = flapFrame(game.clock);
  if (game.phase === "dying") {
    ctx.globalAlpha = Math.max(0, 1 - game.phaseTime / 1.2);
    drawCentred(ctx, sprites.dragonHitFrames[frame], dragon.x, dragon.y);
    ctx.globalAlpha = 1;
    return;
  }
  // A soft shadow on the sky (or the ground) below sells the height.
  const shadow = shadowStyles[game.scenery.theme];
  ctx.globalAlpha = shadow.alpha;
  drawCentred(ctx, sprites.dragonShadows[frame], dragon.x + shadow.dx, dragon.y + shadow.dy);
  ctx.globalAlpha = 1;
  if (invincibleFor > 0) drawShield(ctx, game, dragon.x, dragon.y);
  // Blink while the shield is up.
  if (invincibleFor > 0 && Math.floor(invincibleFor * 10) % 2 === 0) return;
  drawCentred(ctx, sprites.dragonFrames[frame], dragon.x, dragon.y);
}

// Big fire makes fireballs larger; lightning gives them a blue spark.
function drawFireballs(ctx, sprites, game) {
  const { fireballs } = game.round;
  const charged = rank(game.progress, "lightning") > 0;
  ctx.globalCompositeOperation = "lighter";
  fireballs.forEach((f) => {
    const s = f.scale;
    glow(ctx, f.x, f.y + 10 * s, 10 * s, "rgba(255, 120, 30, 0.35)", "rgba(255, 60, 0, 0)");
    glow(ctx, f.x, f.y, 16 * s, "rgba(255, 210, 80, 0.55)", "rgba(255, 90, 0, 0)");
    if (charged) glow(ctx, f.x, f.y, 12 * s, "rgba(120, 230, 255, 0.6)", "rgba(0, 180, 255, 0)");
  });
  ctx.globalCompositeOperation = "source-over";
  fireballs.forEach((f) => {
    const w = sprites.fireball.width * f.scale;
    const h = sprites.fireball.height * f.scale;
    ctx.drawImage(sprites.fireball, Math.round(f.x - w / 2), Math.round(f.y - h / 2), w, h);
  });
}

export function draw(ctx, sprites, game) {
  const { boss, effects, monsters, shots } = game.round;
  const t = game.clock;
  const theme = game.scenery.theme;
  drawScenery(ctx, game.scenery, game.sceneryArt);
  if (theme === "ground") {
    drawMonsterShadows(ctx, sprites, monsters, shadowStyles.ground);
  }
  drawShots(ctx, sprites, shots, t, true);
  if (boss) drawBoss(ctx, sprites, boss, flapFrame(t * 0.8), t, theme);
  drawFireballs(ctx, sprites, game);
  monsters.forEach((m, i) => drawMonster(ctx, sprites, m, t + i));
  drawShots(ctx, sprites, shots, t, false);
  drawEffects(ctx, effects);
  drawDragon(ctx, sprites, game);
  drawHud(ctx, sprites, game);
  if (game.toast && game.toast.until > game.clock) {
    text(ctx, game.toast.text, width / 2, boss ? 80 : 60, {
      align: "center",
      colour: game.toast.colour,
      size: 10,
    });
  }
  drawOverlay(ctx, game);
}
