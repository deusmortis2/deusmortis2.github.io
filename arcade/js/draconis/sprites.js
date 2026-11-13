// Sprites for Deus Draconis. The dragon and monsters are cut from the
// artist's sheets; the small projectiles are pixel grids where each
// character is a palette colour and "." is transparent.
import { silhouette } from "./painter.js";

export const art = {
  // Goblin axe: wooden haft with an iron head.
  axe: [
    "...kkk..",
    "..kssk..",
    ".kswsk..",
    ".kssskb.",
    "..kkkbb.",
    ".....bb.",
    "......bb",
    ".......b",
  ],
  // Orc boulder.
  boulder: [
    "..kkkk..",
    ".kllmmk.",
    "klllmmdk",
    "kllmmmdk",
    "kmmmmddk",
    "kmmmdddk",
    ".kdddkk.",
    "..kkk...",
  ],
  // Griffin feather, pointing right (rotated to its heading when drawn).
  feather: [
    "..ggg.....",
    ".gyyygg...",
    "qqqqqqqqqw",
    ".gyyygg...",
    "..ggg.....",
  ],
  fireball: [
    "..rr..",
    ".royr.",
    "royyor",
    "ryyyyr",
    ".ryyr.",
    "..rr..",
  ],
  shard: [
    ".kk.",
    "klmk",
    "kmdk",
    ".kk.",
  ],
};

const palettes = {
  axe: { b: "#7a4a22", k: "#2b2b33", s: "#9aa3ad", w: "#e6edf3" },
  boulder: { d: "#5a4a3c", k: "#2a211b", l: "#a89480", m: "#7d6b5a" },
  feather: { g: "#a8742e", q: "#f2e4c4", w: "#ffffff", y: "#e0b24a" },
  fireball: { o: "#ff9a3c", r: "#e8381f", y: "#fff27a" },
  shard: { d: "#5a4a3c", k: "#2a211b", l: "#a89480", m: "#7d6b5a" },
};

function makeSprite(rows, palette, scale) {
  const canvas = document.createElement("canvas");
  canvas.width = rows[0].length * scale;
  canvas.height = rows.length * scale;
  const ctx = canvas.getContext("2d");
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (!palette[ch]) return;
      ctx.fillStyle = palette[ch];
      ctx.fillRect(x * scale, y * scale, scale, scale);
    });
  });
  return canvas;
}

export function buildSprites() {
  return {
    axe: makeSprite(art.axe, palettes.axe, 2),
    boulder: makeSprite(art.boulder, palettes.boulder, 3),
    feather: makeSprite(art.feather, palettes.feather, 2),
    fireball: makeSprite(art.fireball, palettes.fireball, 2),
    fireballIcon: makeSprite(art.fireball, palettes.fireball, 3),
    shard: makeSprite(art.shard, palettes.shard, 2),
  };
}

// The cosmic dragon: six wing frames side by side in one strip, cut from the
// artist's sheet with the head and spine lined up so only the wings move.
const dragonSheet = "img/draconis/dragon.png";
const dragonFrameCount = 6;

// Flap order through the strip: wings up, level, down, folded, then back up.
export const flapOrder = [4, 2, 0, 5, 3, 1, 3, 5, 0, 2];

function tinted(frame, colour) {
  const canvas = document.createElement("canvas");
  canvas.width = frame.width;
  canvas.height = frame.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(frame, 0, 0);
  ctx.globalCompositeOperation = "source-atop";
  ctx.fillStyle = colour;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
}

function sliceFrames(image, count) {
  const frameWidth = image.width / count;
  return Array.from({ length: count }, (_, i) => {
    const canvas = document.createElement("canvas");
    canvas.width = frameWidth;
    canvas.height = image.height;
    canvas.getContext("2d").drawImage(image, -i * frameWidth, 0);
    return canvas;
  });
}

function scaledCopy(frame, factor) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(frame.width * factor);
  canvas.height = Math.round(frame.height * factor);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
  return canvas;
}

// Loads the dragon strip and adds the flap frames, a white hit flash, a soft
// ground shadow and the small life icon to the sprite set.
export async function loadDragon(sprites) {
  const image = new Image();
  image.src = dragonSheet;
  await image.decode();
  const frames = sliceFrames(image, dragonFrameCount);
  sprites.dragonFrames = frames;
  sprites.dragonHitFrames = frames.map((f) => tinted(f, "rgba(255, 255, 255, 0.85)"));
  sprites.dragonShadows = frames.map((f) => silhouette(f, "#0b1a33"));
  sprites.life = scaledCopy(frames[0], 0.36);
  sprites.boss = Object.fromEntries(
    Object.entries(bossLooks).map(([look, recolour]) => {
      const bossFrames = frames.map((f) => bossFrame(f, recolour));
      const hit = bossFrames.map((f) => tinted(f, "rgba(255, 255, 255, 0.8)"));
      const shadows = bossFrames.map((f) => silhouette(f, "#0b1d0c"));
      return [look, { frames: bossFrames, hit, shadows }];
    }),
  );
}

// Colour swaps that turn the cosmic dragon into each stage's rival wyrm,
// keeping all of its shading. Each maps one pixel's [r, g, b] to new values.
const bossLooks = {
  crimson: ([r, g, b]) => [b * 1.25 + r * 0.3, g * 0.45, r * 0.5],
  phantom: ([r, g, b]) => {
    const lum = 0.3 * r + 0.59 * g + 0.11 * b;
    return [lum * 1.4 + 70, lum * 1.3 + 60, lum * 1.5 + 95];
  },
  storm: ([r, g, b]) => [r * 0.35, b * 0.95 + 20, b * 0.75 + g * 0.4],
};

// A rival wyrm frame: recoloured, flipped to face the player, and bigger.
function bossFrame(frame, recolour) {
  const source = document.createElement("canvas");
  source.width = frame.width;
  source.height = frame.height;
  const sctx = source.getContext("2d");
  sctx.drawImage(frame, 0, 0);
  const image = sctx.getImageData(0, 0, source.width, source.height);
  const px = image.data;
  for (let i = 0; i < px.length; i += 4) {
    const [r, g, b] = recolour([px[i], px[i + 1], px[i + 2]]);
    px[i] = Math.min(255, r);
    px[i + 1] = Math.min(255, g);
    px[i + 2] = Math.min(255, b);
  }
  sctx.putImageData(image, 0, 0);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(frame.width * 1.7);
  canvas.height = Math.round(frame.height * 1.7);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.translate(0, canvas.height);
  ctx.scale(1, -1);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

// The six monsters (goblin, orc, skeleton, gargoyle, floating eye, griffin),
// one 64px tile each, cut from the artist's sheet.
const monsterSheet = "img/draconis/monsters.png";
const monsterKinds = 6;

function greyed(frame) {
  const canvas = document.createElement("canvas");
  canvas.width = frame.width;
  canvas.height = frame.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(frame, 0, 0);
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = image.data;
  for (let i = 0; i < px.length; i += 4) {
    const grey = 0.3 * px[i] + 0.59 * px[i + 1] + 0.11 * px[i + 2];
    px[i] = grey;
    px[i + 1] = grey;
    px[i + 2] = grey;
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

export async function loadMonsters(sprites) {
  const image = new Image();
  image.src = monsterSheet;
  await image.decode();
  sprites.monsters = sliceFrames(image, monsterKinds);
  sprites.monstersDead = sprites.monsters.map(greyed);
  sprites.monstersHit = sprites.monsters.map((f) => tinted(f, "rgba(255, 255, 255, 0.8)"));
  sprites.monstersStone = sprites.monsters.map((f) => tinted(greyed(f), "rgba(40, 44, 60, 0.35)"));
  sprites.monsterShadows = sprites.monsters.map((f) => silhouette(f, "#0b1d0c"));
}
