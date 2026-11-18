// Draws the world: background, tiles, rocket, aliens, boss, astronaut and
// effects. Pure output: reads game state, never changes it.
import { astronautCell } from "./art.js";
import { drawBoss } from "./bossArt.js";
import { isStunned } from "./enemies.js";
import { drawBolts, drawPatches, drawShots, drawStrikes } from "./effectsArt.js";
import {
  drawHazards,
  drawHealth,
  drawItems,
  drawSpikes,
  drawThorns,
} from "./hazardArt.js";
import { drawHud } from "./hud.js";
import { rows, tile } from "./levels.js";
import { playerFrame } from "./player.js";
import {
  drawPlayerEffects,
  glowAt,
  hexRgb,
  mound,
  tintedCopy,
} from "./looks.js";

export const viewWidth = 960;
export const viewHeight = 540;
const parallax = 0.3;

function drawBackground(ctx, strip, round) {
  const offset = (round.camera * parallax) % strip.width;
  ctx.drawImage(strip, -Math.round(offset), 0);
  ctx.drawImage(strip, Math.round(strip.width - offset), 0);
  // Darken the bottom so the real ground stands out from the painted one.
  const shade = ctx.createLinearGradient(0, viewHeight * 0.45, 0, viewHeight);
  shade.addColorStop(0, "rgba(0, 0, 0, 0)");
  shade.addColorStop(1, "rgba(0, 0, 0, 0.45)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, viewWidth, viewHeight);
}

const lavaColours = {
  default: ["#b3200c", "#ff6a00", "#ffd23f"],
  venus: ["#3a6a00", "#8ad000", "#e8ff80"],
};

function drawLava(ctx, x, y, clock, palette) {
  const [deep, surface, fleck] = lavaColours[palette] ?? lavaColours.default;
  const wave = Math.sin(clock * 3 + x / 40) * 3;
  ctx.fillStyle = deep;
  ctx.fillRect(x, y + 6 + wave, tile, tile);
  ctx.fillStyle = surface;
  ctx.fillRect(x, y + 6 + wave, tile, 8);
  ctx.fillStyle = fleck;
  ctx.fillRect(x + ((clock * 30 + x) % tile), y + 8 + wave, 6, 3);
}

function drawTiles(ctx, art, round, clock) {
  const { grid, icy } = round.level;
  const palette = round.stage.id;
  const tiles = art.tiles[palette];
  const first = Math.max(0, Math.floor(round.camera / tile));
  const last = Math.min(round.level.cols - 1, first + Math.ceil(viewWidth / tile) + 1);
  for (let row = 0; row < rows; row += 1) {
    for (let col = first; col <= last; col += 1) {
      const ch = grid[row][col];
      const x = Math.round(col * tile - round.camera);
      const y = row * tile;
      if (ch === "#") {
        const open = row === 0 || grid[row - 1][col] !== "#";
        const top = icy.has(col) ? tiles.ice : tiles.surface;
        ctx.drawImage(open ? top : tiles.solid, x, y);
      }
      if (ch === "=") ctx.drawImage(tiles.ledge, x, y);
      if (ch === "L") drawLava(ctx, x, y, clock, palette);
      if (ch === "v") drawSpikes(ctx, x, y, palette);
      if (ch === "^") drawThorns(ctx, x, y, palette);
    }
  }
}

function drawRocket(ctx, round, clock) {
  const { rocket } = round;
  if (!rocket.landed && rocket.drop === undefined) return;
  const x = rocket.x - round.camera;
  const y = rocket.y - rocket.lift - (rocket.drop ?? 0);
  if (rocket.lift > 0 || rocket.drop > 0) {
    const flicker = 30 + Math.sin(clock * 40) * 10;
    ctx.fillStyle = "#ffd23f";
    ctx.fillRect(x - 10, y, 20, flicker + 20);
    ctx.fillStyle = "#ff6a00";
    ctx.fillRect(x - 6, y, 12, flicker + 34);
  }
  ctx.fillStyle = "#c0322b";
  ctx.fillRect(x - 34, y - 30, 16, 30);
  ctx.fillRect(x + 18, y - 30, 16, 30);
  ctx.fillStyle = "#e8e8f0";
  ctx.fillRect(x - 20, y - 110, 40, 104);
  ctx.fillStyle = "#c0322b";
  ctx.fillRect(x - 14, y - 128, 28, 18);
  ctx.fillRect(x - 6, y - 140, 12, 12);
  ctx.fillStyle = "#2a5db0";
  ctx.fillRect(x - 10, y - 90, 20, 20);
  ctx.fillStyle = "#9cd2ff";
  ctx.fillRect(x - 6, y - 86, 8, 8);
  ctx.fillStyle = "#8a8aa0";
  ctx.fillRect(x - 20, y - 10, 40, 6);
}

export function drawStars(ctx, clock, height) {
  ctx.fillStyle = "#ffd23f";
  for (let i = 0; i < 3; i += 1) {
    const angle = clock * 5 + (i * Math.PI * 2) / 3;
    ctx.fillRect(Math.cos(angle) * 30 - 4, -height - 14 + Math.sin(angle) * 8, 8, 8);
  }
}

// Effects drawn around an alien before the alien itself: auras, gravity
// wells, mind rings, gusts and laser sights.
function drawAround(ctx, enemy, cx, cy, clock) {
  if (enemy.aura) {
    ctx.globalAlpha = 0.35 + Math.sin(clock * 30) * 0.15;
    glowAt(ctx, cx, cy, enemy.aura, "156, 240, 255", 0.8);
    ctx.globalAlpha = 1;
  }
  ctx.strokeStyle = "#c878ff";
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.6;
  // A gravity well's rings shrink inwards; a mind ring spreads outwards.
  const radii = [];
  if (enemy.well) radii.push(enemy.well * (1 - ((clock * 0.8) % 1)));
  if (enemy.ring) radii.push(enemy.ring);
  radii.forEach((r) => {
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(4, r), 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
  if (enemy.gust) {
    ctx.fillStyle = "rgba(220, 245, 255, 0.6)";
    for (let i = 0; i < 6; i += 1) {
      const run = ((clock * 600 + i * 97) % 520) * enemy.gust;
      ctx.fillRect(cx + run, cy - 90 + i * 34, 46, 3);
    }
  }
  if (enemy.sight) {
    ctx.fillStyle = "rgba(74, 224, 255, 0.5)";
    const y = enemy.y + enemy.h - 20;
    const from = enemy.dir > 0 ? cx : cx - 520;
    ctx.fillRect(from, y, 520, 2);
  }
}

function drawEnemy(ctx, art, enemy, round, clock) {
  const image = art.images[enemy.def.art];
  const { def } = enemy;
  const cx = Math.round(enemy.x + enemy.w / 2 - round.camera);
  if (!image || cx < -260 || cx > viewWidth + 260) return;
  if (enemy.hidden) {
    mound(ctx, cx, enemy.y + enemy.h, clock, enemy.shake);
    return;
  }
  const cy = enemy.y + enemy.h / 2;
  drawAround(ctx, enemy, cx, cy, clock);
  ctx.save();
  const anchorY = def.flies ? cy : enemy.y + enemy.h;
  ctx.translate(cx, anchorY);
  if (enemy.dying !== undefined) {
    ctx.globalAlpha = Math.max(0, 1 - enemy.dying / 0.45);
    ctx.scale(1 + enemy.dying, Math.max(0.1, 1 - enemy.dying * 2));
  }
  if (enemy.state === "windup" || enemy.shake) ctx.translate(Math.sin(clock * 60) * 4, 0);
  if (!def.flies && !enemy.spin) ctx.translate(0, -Math.abs(Math.sin(enemy.age * 7)) * 3);
  const w = image.width * enemy.scale;
  const h = image.height * enemy.scale;
  if (enemy.glow) glowAt(ctx, 0, def.flies ? 0 : -h / 2, Math.max(w, h) * 0.75, hexRgb(enemy.glow), 0.5);
  if ((def.hp ?? 1) > 1 && enemy.dying === undefined) drawHealth(ctx, enemy);
  if (isStunned(enemy)) drawStars(ctx, clock, def.flies ? h / 2 : h);
  ctx.globalAlpha *= enemy.alpha;
  if (enemy.reach) ctx.translate(enemy.dir * enemy.reach * 0.6, 0);
  const top = def.flies ? -h / 2 : -h;
  if (enemy.spin) {
    ctx.translate(0, top + h / 2);
    ctx.rotate(enemy.age * enemy.spin * 12);
    ctx.translate(0, -(top + h / 2));
  }
  const flip = def.faces !== 0 && enemy.dir !== def.faces;
  let squashY = 1 - (enemy.squash ?? 0) * 1.2;
  if (enemy.tint === "shell") squashY = 0.7;
  ctx.scale(flip ? -1 : 1, (enemy.flipY ? -1 : 1) * squashY);
  // Upside down, the picture still covers the body above the anchor.
  const drawTop = enemy.flipY ? 0 : top;
  const sprite = enemy.tint ? tintedCopy(image, enemy.tint) : image;
  ctx.drawImage(sprite, -w / 2, drawTop, w, h);
  if (enemy.flash > 0) {
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.7;
    ctx.drawImage(image, -w / 2, drawTop, w, h);
  }
  ctx.restore();
}

function drawPlayer(ctx, art, round, clock) {
  const { player } = round;
  if (player.hidden) return;
  const blink = player.hurtFor > 0 && Math.floor(clock * 12) % 2 === 0;
  const { h, w } = astronautCell;
  const x = Math.round(player.x + player.w / 2 - w / 2 - round.camera);
  const y = Math.round(player.y + player.h - h);
  if (!blink) {
    const sheet = player.facing > 0 ? art.images.astronaut : art.mirrored;
    if (player.smash && player.smash.hang <= 0) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.fillRect(x + 8, y - 40, 4, 34);
      ctx.fillRect(x + w - 12, y - 30, 4, 26);
    }
    ctx.drawImage(sheet, playerFrame(player) * w, 0, w, h, x, y, w, h);
  }
  drawPlayerEffects(ctx, player, x + w / 2, y, clock);
}

function drawDust(ctx, round) {
  round.dust.forEach((d) => {
    ctx.globalAlpha = Math.max(0, d.life / d.max);
    ctx.fillStyle = d.colour;
    ctx.fillRect(Math.round(d.x - round.camera), Math.round(d.y), d.size, d.size);
  });
  ctx.globalAlpha = 1;
}

export function draw(ctx, art, game) {
  const { round } = game;
  const zone = round.stage.id;
  if (!art.ready[zone]) {
    ctx.fillStyle = "#0a0a1f";
    ctx.fillRect(0, 0, viewWidth, viewHeight);
    drawHud(ctx, art, game);
    return;
  }
  ctx.save();
  if (round.shake > 0) {
    const s = round.shake * 30;
    ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
  }
  drawBackground(ctx, art.strips[zone], round);
  drawTiles(ctx, art, round, game.clock);
  drawPatches(ctx, round, game.clock);
  drawItems(ctx, round, game.clock);
  drawRocket(ctx, round, game.clock);
  round.enemies.forEach((e) => drawEnemy(ctx, art, e, round, game.clock));
  if (round.boss) drawBoss(ctx, art, round, game.clock);
  drawPlayer(ctx, art, round, game.clock);
  drawHazards(ctx, round, game.clock);
  drawStrikes(ctx, round, game.clock);
  drawShots(ctx, round);
  drawBolts(ctx, round, game.clock);
  drawDust(ctx, round);
  ctx.restore();
  drawHud(ctx, art, game);
}
