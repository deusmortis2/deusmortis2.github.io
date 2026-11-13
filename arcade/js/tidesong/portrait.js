// The player's portrait: their mermaid or merman exactly as drawn in the
// character grids (cast.js), full length in the creator and battles and as
// a head-and-shoulders crop in the HUD. Drawn in a 300 x 440 unit box.
import { groupOf } from "./avatar.js";
import { castFace, drawCast } from "./cast.js";
import { makeCanvas } from "./util.js";

export const portraitWidth = 300;
export const portraitHeight = 440;

// Draws the whole figure with the portrait's top-left at (x, y).
export function drawPortrait(ctx, avatar, x = 0, y = 0, scale = 1) {
  drawCast(ctx, groupOf(avatar), avatar.look, x, y, portraitWidth * scale, portraitHeight * scale);
}

// The face centre in portrait units.
export function portraitFace(avatar) {
  return castFace(groupOf(avatar), avatar.look, portraitWidth, portraitHeight);
}

const cache = new Map();

function cacheKey(avatar, kind, size) {
  return `${kind}:${size}:${avatar.body}:${avatar.look}`;
}

// A head-and-shoulders crop on a square canvas, for the HUD.
export function bustCanvas(avatar, size) {
  const key = cacheKey(avatar, "bust", size);
  if (cache.has(key)) return cache.get(key);
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext("2d");
  // Zoom in so the head and shoulders fill the square.
  const scale = size / 120;
  const [fx, fy] = portraitFace(avatar);
  drawPortrait(ctx, avatar, -(fx - 60) * scale, -(fy - 52) * scale, scale);
  cache.set(key, canvas);
  return canvas;
}

// The full-length figure at a given height, for battles.
export function fullCanvas(avatar, height) {
  const key = cacheKey(avatar, "full", height);
  if (cache.has(key)) return cache.get(key);
  const scale = height / portraitHeight;
  const canvas = makeCanvas(portraitWidth * scale, height);
  drawPortrait(canvas.getContext("2d"), avatar, 0, 0, scale);
  cache.set(key, canvas);
  return canvas;
}

export function clearPortraitCache() {
  cache.clear();
}
