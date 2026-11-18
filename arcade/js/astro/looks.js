// Small drawing helpers: glows, sand mounds, tinted copies of sprites, and
// the bubbles and labels drawn over the astronaut.
import { statusLabel } from "./status.js";

// Turns "#rrggbb" into "r, g, b" for gradients.
export function hexRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return `${Math.floor(n / 65536) % 256}, ${Math.floor(n / 256) % 256}, ${n % 256}`;
}

export function glowAt(ctx, cx, cy, r, rgb, strength = 0.9) {
  const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
  glow.addColorStop(0, `rgba(${rgb}, ${strength})`);
  glow.addColorStop(1, `rgba(${rgb}, 0)`);
  ctx.fillStyle = glow;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
}

// A heap of sand with something moving under it.
export function mound(ctx, cx, floor, clock, shaking, width = 60) {
  const jiggle = shaking ? Math.sin(clock * 60) * 4 : 0;
  ctx.fillStyle = "#8a5a34";
  ctx.beginPath();
  ctx.ellipse(cx + jiggle, floor, width / 2, 14, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = "#c8915a";
  for (let i = 0; i < 4; i += 1) {
    const hop = Math.abs(Math.sin(clock * 9 + i * 1.3)) * 14;
    ctx.fillRect(cx - width / 3 + i * (width / 4.5) + jiggle, floor - 12 - hop, 5, 5);
  }
}

const tints = {
  cool: ["#7a7a88", 0.55],
  red: ["#ff2020", 1],
  shell: ["#2a4a1a", 0.35],
  stone: ["#8a8a96", 0.8],
};
const tinted = new Map();

// A copy of a sprite washed with a colour (a cooled beetle, a stone
// gargoyle), made once and reused.
export function tintedCopy(image, tint) {
  const key = `${tint}|${image.src}`;
  if (tinted.has(key)) return tinted.get(key);
  const [colour, strength] = tints[tint];
  const copy = document.createElement("canvas");
  copy.width = image.width;
  copy.height = image.height;
  const c = copy.getContext("2d");
  c.drawImage(image, 0, 0);
  c.globalCompositeOperation = "source-atop";
  c.globalAlpha = strength;
  c.fillStyle = colour;
  c.fillRect(0, 0, copy.width, copy.height);
  tinted.set(key, copy);
  return copy;
}

function label(ctx, value, x, y, colour) {
  ctx.font = '10px "Press Start 2P", monospace';
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillStyle = "#000000";
  ctx.fillText(value, x + 2, y + 2);
  ctx.fillStyle = colour;
  ctx.fillText(value, x, y);
}

// Shield bubble, star glow, ice block and a status label. X is the middle
// of the astronaut's picture and top its top edge.
export function drawPlayerEffects(ctx, player, x, top, clock) {
  const { powers, status } = player;
  const middle = top + 42;
  if (powers.star > 0) {
    const hue = Math.floor(clock * 360) % 360;
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = `hsl(${hue}, 100%, 70%)`;
    ctx.beginPath();
    ctx.arc(x, middle, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  if (powers.shield > 0) {
    ctx.strokeStyle = "#00e5ff";
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.6 + Math.sin(clock * 6) * 0.2;
    ctx.beginPath();
    ctx.arc(x, middle, 48, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  if (status.frozen > 0) {
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = "#bff6ff";
    ctx.fillRect(x - 28, top - 4, 56, 90);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x - 22, top + 4, 6, 40);
  }
  if (status.confused > 0) {
    for (let i = 0; i < 3; i += 1) {
      const angle = clock * 4 + (i * Math.PI * 2) / 3;
      label(ctx, "?", x + Math.cos(angle) * 26, top - 4 + Math.sin(angle) * 6, "#c878ff");
    }
  }
  const words = statusLabel(player);
  if (words) label(ctx, words, x, top - 18, "#ffffff");
}
