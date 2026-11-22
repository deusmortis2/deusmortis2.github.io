// Draws hazards, roof spikes, floor spikes, oxygen tanks, checkpoint flags
// and power-ups lying on the ground. Pure output: reads game state, never
// changes it.
import { gushCell } from "./art.js";
import { tile } from "./levels.js";
import { glowBetween } from "./looks.js";
import { drawSmasher } from "./machineArt.js";
import { powerInfo } from "./powerups.js";

// spikes.png: the floor spikes on top (90 x 39), the roof spikes under
// them (90 x 34). Each row is two tiles wide; neighbouring columns take
// alternate halves so a long strip joins up.
const spikeSheet = { floor: 39, roof: 34 };

// Spikes growing up from the floor, points upwards.
export function drawThorns(ctx, x, y, sheet, col) {
  const h = spikeSheet.floor;
  ctx.drawImage(sheet, (col % 2) * tile, 0, tile, h, x, y + tile - h, tile, h);
}

// Spikes hanging from a roof, points downwards.
export function drawSpikes(ctx, x, y, sheet, col) {
  const h = spikeSheet.roof;
  ctx.drawImage(sheet, (col % 2) * tile, spikeSheet.floor, tile, h, x, y, tile, h);
}

// The falling spike picture is wider and taller than the part that hurts.
// Its top tucks a little into whatever it hangs from, and its tip sinks
// into the floor when it lands.
const fallArt = { h: 97, tuck: 6, w: 76 };

// It regrows from the top down after it breaks.
function drawRock(ctx, h, x, clock, art, zone) {
  const image = art.fallspike[zone];
  if (h.state === "broken" || !image) return;
  const wobble = h.state === "wobble" ? Math.sin(clock * 60) * 3 : 0;
  const w = fallArt.w * h.grow;
  const left = x + h.w / 2 + wobble - w / 2;
  ctx.drawImage(image, left, h.y - fallArt.tuck, w, fallArt.h * h.grow);
}

// Rows of a roaring gush frame (4 or 5), measured from the top of the
// cell: the crown of spray, then the stem, then the splash at its base.
const crown = { from: 15, to: 85 };
const base = 115;

function gushFrame(h, clock) {
  if (h.state === "bubble") return Math.floor(clock * 8) % 2 === 0 ? 1 : 2;
  if (h.h < 4) return 0;
  if (h.h < 100) return 3;
  return 4 + (Math.floor(clock * 10) % 2);
}

// A geyser from the user's gush drawing: the pool always, the jet while it
// bubbles and erupts. Its column is h.h tall above the pool's surface; when
// that's taller than the drawing, the stem stretches between crown and base.
function drawGeyser(ctx, h, x, clock, art, zone) {
  const gush = art.gush[zone];
  if (!gush) return;
  const { h: cellH, surface, w } = gushCell;
  const frame = gushFrame(h, clock);
  const sx = frame * w;
  const left = Math.round(x + h.w / 2 - w / 2);
  const top = h.bottom - 4;
  ctx.drawImage(gush, sx, surface, w, cellH - surface, left, top, w, cellH - surface);
  if (frame === 0) return;
  if (frame < 4) {
    ctx.drawImage(gush, sx, 0, w, surface, left, top - surface, w, surface);
    return;
  }
  const tall = Math.max(h.h, surface - crown.from);
  const peak = top - tall;
  const crownH = crown.to - crown.from;
  const baseH = surface - base;
  const stemH = Math.max(1, tall - crownH - baseH);
  ctx.drawImage(gush, sx, crown.from, w, crownH, left, peak, w, crownH);
  // Only the jet's core is stretched, so side spray doesn't smear into
  // long streaks.
  const core = 52;
  const coreX = (w - core) / 2;
  ctx.drawImage(gush, sx + coreX, crown.to, core, base - crown.to, left + coreX, peak + crownH, core, stemH);
  ctx.drawImage(gush, sx, base, w, baseH, left, top - baseH, w, baseH);
}

function drawBeam(ctx, h, x, clock) {
  const upright = h.kind === "laser";
  const on = h.state === "on";
  const warn = h.state === "warn" && Math.floor(clock * 16) % 2 === 0;
  ctx.fillStyle = "#3a3a4c";
  if (upright) {
    ctx.fillRect(x - 9, h.y, h.w + 18, 16);
    ctx.fillRect(x - 9, h.y + h.h - 10, h.w + 18, 10);
  } else {
    ctx.fillRect(x - 14, h.y - 8, 16, h.h + 16);
    ctx.fillRect(x + h.w - 2, h.y - 8, 16, h.h + 16);
  }
  if (!on && !warn) return;
  const glow = on ? 1 : 0.35;
  ctx.globalAlpha = glow * (0.85 + Math.sin(clock * 40) * 0.15);
  ctx.fillStyle = "#ff2e88";
  if (upright) ctx.fillRect(x, h.y + 16, h.w, h.h - 26);
  else ctx.fillRect(x + 2, h.y, h.w - 4, h.h);
  ctx.fillStyle = "#ffd0ea";
  if (upright) ctx.fillRect(x + 3, h.y + 16, h.w - 6, h.h - 26);
  else ctx.fillRect(x + 2, h.y + 3, h.w - 4, h.h - 6);
  ctx.globalAlpha = 1;
}

const painters = {
  beam: drawBeam,
  crusher: (ctx, h, x, clock, art) => {
    drawSmasher(ctx, h, x, clock, art.images);
  },
  geyser: drawGeyser,
  laser: drawBeam,
  rock: drawRock,
};

export function drawHazards(ctx, round, clock, art) {
  round.hazards.forEach((h) => {
    const x = Math.round(h.x - round.camera);
    if (x < -200 || x > 1160) return;
    painters[h.kind](ctx, h, x, clock, art, round.stage.id);
  });
}

// The tank picture (34 x 46) is a little bigger than the 24 x 36 you
// touch to grab it, and bobs gently.
function drawTank(ctx, item, x, clock, image) {
  const y = item.y + Math.sin(clock * 3) * 4;
  ctx.drawImage(image, x - 5, y - 10);
}

// flags.png: closed, then open, each 101 x 124, with the middle of the
// rock base (and the pole) 24 px from the left of the frame. The flag
// stays furled until the player reaches it.
const flagCell = { base: 24, h: 124, w: 101 };

function drawFlag(ctx, item, x, image) {
  const { base, h, w } = flagCell;
  const sx = item.taken ? w : 0;
  ctx.drawImage(image, sx, 0, w, h, x + 3 - base, item.y + item.h - h, w, h);
}

// A power-up: a glowing bubble with a letter. It blinks before it vanishes.
function drawDrop(ctx, drop, x, clock) {
  if (drop.life < 3 && Math.floor(clock * 8) % 2 === 0) return;
  const { colour } = powerInfo[drop.kind];
  const cx = x + drop.w / 2;
  const cy = drop.y + drop.h / 2 + Math.sin(clock * 4 + drop.x) * 3;
  ctx.globalAlpha = 0.55;
  glowBetween(ctx, cx, cy, 26, colour, "rgba(0, 0, 0, 0)", 4 / 26);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#0a0a1f";
  ctx.beginPath();
  ctx.arc(cx, cy, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = colour;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = colour;
  ctx.font = '12px "Press Start 2P", monospace';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(powerLetters[drop.kind], cx + 1, cy + 1);
}

export const powerLetters = {
  blaster: "B", boots: "J", heart: "+", o2: "O", quake: "Q", shield: "S", speed: "F", star: "*",
};

export function drawItems(ctx, round, clock, images) {
  round.items.forEach((item) => {
    const x = Math.round(item.x - round.camera);
    if (x < -100 || x > 1060) return;
    if (item.kind === "flag") drawFlag(ctx, item, x, images.flags);
    if (item.kind === "tank" && !item.taken) {
      drawTank(ctx, item, x, clock, images.tank);
    }
  });
  round.drops.forEach((drop) => {
    drawDrop(ctx, drop, Math.round(drop.x - round.camera), clock);
  });
}

// Little pips over an alien that takes more than one smash.
export function drawHealth(ctx, enemy) {
  const total = enemy.def.hp;
  for (let i = 0; i < total; i += 1) {
    ctx.fillStyle = i < enemy.hp ? "#ff2e88" : "#3a2a44";
    ctx.fillRect(i * 14 - (total * 14) / 2 + 2, -enemy.h - 18, 10, 8);
  }
}
