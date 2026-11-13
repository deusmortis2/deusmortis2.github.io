// The mermaid or merman that swims around the world map. Normally this is
// the character's pixel-art model (merfolk-models.webp, cut by
// merfolk-cutter/cutmodels.py). Until that picture loads, or if it cannot,
// a small drawn side view in the character's colours stands in; its frames
// are drawn once and cached.
import { avatarColors, castMember, groupOf } from "./avatar.js";
import { modelAtlas } from "./modelAtlas.js";
import { swimAtlas } from "./swimAtlas.js";
import { alpha, makeCanvas, shade } from "./util.js";

export const spriteWidth = 72;
export const spriteHeight = 40;
export const spriteFrames = 6;

function drawFrame(ctx, avatar, frame) {
  const c = avatarColors(avatar);
  const phase = (frame / spriteFrames) * Math.PI * 2;
  const pattern = "scales";
  const member = castMember(avatar);
  const cy = spriteHeight / 2;
  const tailWave = (t) => {
    return Math.sin(phase - t * 2.6) * 5 * t;
  };

  ctx.translate(spriteWidth / 2 - 2, 0);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // Long hair streams behind the head.
  {
    const long = member.long;
    ctx.beginPath();
    ctx.moveTo(18, cy - 6);
    ctx.quadraticCurveTo(6, cy - 8 + Math.sin(phase) * 2, long ? -6 : 8, cy - 3 + Math.sin(phase + 1) * 3);
    ctx.quadraticCurveTo(8, cy - 1, 16, cy + 1);
    ctx.closePath();
    ctx.fillStyle = shade(c.hair, -0.1);
    ctx.fill();
  }

  // Tail: a tapering band from the hips (x = 2) to the fin (x = -26).
  const points = [];
  for (let i = 0; i <= 10; i += 1) {
    const t = i / 10;
    points.push({ w: 6.5 * (1 - t) + 1.6 * t, x: 2 - t * 28, y: cy + 2 + tailWave(t) });
  }
  const end = points.at(-1);
  ctx.save();
  ctx.translate(end.x, end.y);
  ctx.rotate(Math.PI / 2 + Math.cos(phase - 2.6) * 0.5);
  ctx.beginPath();
  const fin = "crescent";
  const wide = ["veil", "manta", "cloud"].includes(fin) ? 1.4 : 1;
  ctx.moveTo(0, -1);
  ctx.lineTo(-8 * wide, 9 * wide);
  ctx.quadraticCurveTo(0, ["forked", "lunate", "shark"].includes(fin) ? 3 : 7, 8 * wide, 9 * wide);
  ctx.closePath();
  ctx.fillStyle = c.fin;
  ctx.fill();
  ctx.strokeStyle = shade(c.fin, -0.45);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  ctx.beginPath();
  points.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y - p.w);
    else ctx.lineTo(p.x, p.y - p.w);
  });
  [...points].reverse().forEach((p) => {
    ctx.lineTo(p.x, p.y + p.w);
  });
  ctx.closePath();
  ctx.fillStyle = c.tail;
  ctx.fill();
  ctx.save();
  ctx.clip();
  if (pattern === "stripes") {
    ctx.fillStyle = alpha(c.fin, 0.75);
    [-6, -13, -20].forEach((x) => {
      ctx.fillRect(x, 0, 2.5, spriteHeight);
    });
  }
  if (pattern === "spots" || pattern === "shimmer") {
    ctx.fillStyle = pattern === "spots" ? c.fin : "#ffffff";
    [[-4, -1], [-10, 2], [-15, -1], [-20, 1]].forEach(([x, dy]) => {
      ctx.fillRect(x, cy + 2 + dy + tailWave((2 - x) / 28), 1.6, 1.6);
    });
  }
  if (pattern === "ombre") {
    const g = ctx.createLinearGradient(2, 0, -26, 0);
    g.addColorStop(0, alpha(c.fin, 0));
    g.addColorStop(1, alpha(c.fin, 0.9));
    ctx.fillStyle = g;
    ctx.fillRect(-30, 0, 34, spriteHeight);
  }
  if (pattern === "scales") {
    ctx.strokeStyle = alpha(shade(c.tail, -0.35), 0.6);
    ctx.lineWidth = 0.8;
    for (let x = -1; x > -24; x -= 4) {
      ctx.beginPath();
      ctx.arc(x, cy + 2 + tailWave((2 - x) / 28), 2.2, -1.2, 1.2);
      ctx.stroke();
    }
  }
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.fillRect(-30, cy + 3, 34, 10);
  ctx.restore();
  ctx.strokeStyle = shade(c.tail, -0.45);
  ctx.lineWidth = 1;
  ctx.stroke();

  // Torso.
  ctx.beginPath();
  ctx.ellipse(9, cy + 0.5, 9, 5.2, -0.05, 0, Math.PI * 2);
  ctx.fillStyle = c.skin;
  ctx.fill();
  ctx.strokeStyle = shade(c.skin, -0.42);
  ctx.stroke();
  if (c.top) {
    ctx.fillStyle = c.top;
    ctx.fillRect(9, cy - 4.5, 5, 9);
  }

  // Arm reaching forward.
  ctx.strokeStyle = shade(c.skin, -0.42);
  ctx.lineWidth = 3.6;
  ctx.beginPath();
  ctx.moveTo(12, cy + 2);
  ctx.lineTo(22, cy + 5 + Math.sin(phase) * 1.5);
  ctx.stroke();
  ctx.strokeStyle = shade(c.skin, -0.06);
  ctx.lineWidth = 2.2;
  ctx.stroke();

  // Head.
  ctx.beginPath();
  ctx.arc(22, cy - 3, 6.2, 0, Math.PI * 2);
  ctx.fillStyle = c.skin;
  ctx.fill();
  ctx.strokeStyle = shade(c.skin, -0.42);
  ctx.lineWidth = 1;
  ctx.stroke();
  {
    ctx.beginPath();
    ctx.arc(21, cy - 4, 6.6, Math.PI * 0.75, Math.PI * 1.95);
    ctx.quadraticCurveTo(22, cy - 7, 16, cy - 1);
    ctx.closePath();
    ctx.fillStyle = c.hair;
    ctx.fill();
  }
  ctx.fillStyle = "#1b1b24";
  ctx.fillRect(25, cy - 4, 1.8, 1.8);
}

const cache = new Map();

// One frame of the sprite (facing right), cached per avatar.
export function spriteFrame(avatar, frame) {
  const key = `${JSON.stringify(avatar)}:${frame}`;
  if (cache.has(key)) return cache.get(key);
  const canvas = makeCanvas(spriteWidth, spriteHeight);
  drawFrame(canvas.getContext("2d"), avatar, frame);
  cache.set(key, canvas);
  return canvas;
}

export function clearSpriteCache() {
  cache.clear();
}

// On-screen height of the front-facing model, in canvas pixels.
export const modelHeight = 112;

let models = null;
let swimmers = null;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
}

// Resolves true once the models picture has loaded, false if it could not.
// The side-profile swimmers load alongside; without them the front model
// is used for swimming too.
export async function loadModelArt(base = "img/tidesong/") {
  if (models) return true;
  try {
    [models, swimmers] = await Promise.all([
      loadImage(`${base}merfolk-models.webp`),
      loadImage(`${base}merfolk-swim.webp`).catch(() => {
        return null;
      }),
    ]);
    return true;
  } catch {
    models = null;
    return false;
  }
}

// Draws the avatar's model centred on (0, 0), facing the viewer, its tail
// curling to the right. Returns false when there is no model to draw.
export function drawModel(ctx, avatar) {
  if (!models) return false;
  const list = modelAtlas[groupOf(avatar)];
  const r = list[avatar.look] ?? list[0];
  const scale = modelHeight / r[3];
  const w = r[2] * scale;
  ctx.drawImage(models, r[0], r[1], r[2], r[3], -w / 2, -modelHeight / 2, w, modelHeight);
  return true;
}

// On-screen size of the longer side of a swimming picture.
const swimSize = 116;

// How far each group's side profile is tipped forward when swimming level,
// in radians. The merman pictures stand more upright than the mermaids.
const swimLean = { mermaids: 0.3, mermen: 0.6 };

// Merman tails hang straight down in their pictures, so the tail (with its
// fin) is swung back from the hips by this much, in radians, to trail
// behind like a mermaid's.
const tailBend = 1.05;

// Mermen sway their whole tail, fin included, by this share of `flap`
// (their fin is not swung on its own: its cut leaves a sliver on the tail).
const tailSway = 0.5;

// The moving part of the tail is drawn as this many rings around the point
// it bends about, each turned a little more than the one inside it.
const bendRings = 10;

// Draws `pieces` (atlas rectangles cut from the body's frame) bent about
// `pivot`. Rings near the pivot barely turn and those at `reach` turn the
// full `flap`, so the tail curves smoothly instead of hinging, and its
// base never pulls away from the body to leave a gap.
function drawBent(ctx, pieces, size, pivot, reach, rest, flap) {
  const [bw, bh] = size;
  const [px, py] = pivot;
  for (let k = 0; k <= bendRings; k += 1) {
    const inner = (reach * k) / bendRings;
    // The last ring takes in everything past `reach`.
    const outer = k === bendRings ? reach * 4 : (reach * (k + 1)) / bendRings;
    const t = Math.min(1, (inner + outer) / 2 / reach);
    ctx.save();
    // Rings overlap by a pixel so no seam shows between them.
    ctx.beginPath();
    ctx.arc(px, py, outer + 1, 0, Math.PI * 2);
    if (inner > 1) ctx.arc(px, py, inner - 1, 0, Math.PI * 2, true);
    ctx.clip();
    ctx.translate(px, py);
    ctx.rotate(rest + flap * t * t);
    ctx.translate(-px, -py);
    for (const [x, y] of pieces) {
      ctx.drawImage(swimmers, x, y, bw, bh, 0, 0, bw, bh);
    }
    ctx.restore();
  }
}

// Draws the avatar's side-profile swimmer centred on (0, 0), heading right
// and tipped by `heading` radians (up is negative). Only the tail moves: a
// mermaid's fin bends from its joint by up to `flap` radians, a merman's
// whole tail bends from the hips. Returns false when there is no side
// profile to draw.
export function drawSwimmer(ctx, avatar, heading, flap) {
  if (!swimmers) return false;
  const group = groupOf(avatar);
  const list = swimAtlas[group];
  const s = list[avatar.look] ?? list[0];
  const [bx, by, bw, bh] = s.body;
  const scale = swimSize / Math.max(bw, bh);
  ctx.save();
  ctx.rotate(heading + swimLean[group]);
  ctx.scale(scale, scale);
  ctx.translate(-bw / 2, -bh / 2);
  if (s.hip && s.tail) {
    drawBent(ctx, [s.fin, s.tail], [bw, bh], s.hip, s.reach, tailBend, flap * tailSway);
  } else {
    drawBent(ctx, [s.fin], [bw, bh], s.joint, s.reach, 0, flap);
  }
  ctx.drawImage(swimmers, bx, by, bw, bh, 0, 0, bw, bh);
  ctx.restore();
  return true;
}
