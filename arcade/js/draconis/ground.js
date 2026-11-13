// The countryside under the dragon in the low flight stage: grass, fields,
// a winding river, cottages, trees and rocks. Painted once into a tile that
// repeats seamlessly top to bottom, so it can scroll forever.
import { seeded } from "./entities.js";
import { blocky, canvasOf, dither, hexToRgb, paintPuffs } from "./painter.js";

// Painted pixels; the tile is drawn at twice this size (480 x 720).
const tileW = 240;
const tileH = 360;
export const groundScale = 2;

const grass = ["#3d7432", "#48843a", "#559641", "#64a64a"].map(hexToRgb);
const water = ["#28578a", "#3570a4", "#4b8cc2", "#8cc4e8"].map(hexToRgb);
const sand = ["#b39c63", "#c9b47b"].map(hexToRgb);
const crops = [
  ["#c9a646", "#ad8c34"],
  ["#78a83f", "#628f32"],
  ["#8a6a43", "#72573a"],
].map((pair) => pair.map(hexToRgb));
const hedge = hexToRgb("#2c5626");
const treeStyle = {
  light: { x: 0.55, y: -0.6, z: 0.6 },
  rim: "#173619",
  tones: ["#24552a", "#2f6c2f", "#3e8636", "#57a144", "#80c05a"],
};
const rockStyle = {
  light: { x: 0.55, y: -0.6, z: 0.6 },
  rim: "#34333b",
  tones: ["#5d5c66", "#7a7983", "#9a99a1", "#bdbcc1"],
};

const wave = (y, cycles, phase = 0) => Math.sin((y / tileH) * Math.PI * 2 * cycles + phase);

function river(y) {
  return {
    centre: 120 + 52 * wave(y, 1) + 18 * wave(y, 2, 1.3),
    half: 9 + 2 * wave(y, 3),
  };
}

function nearRiver(x, y, gap) {
  const { centre, half } = river(y);
  return Math.abs(x - centre) < half + gap;
}

function hash(x, y) {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

// Picks up to five crop fields that stay clear of the river and each other.
function chooseFields(rand) {
  const fields = [];
  for (let tries = 0; tries < 60 && fields.length < 5; tries += 1) {
    const w = 26 + Math.floor(rand() * 26);
    const h = 22 + Math.floor(rand() * 24);
    const f = { crop: crops[fields.length % crops.length], h, upright: rand() < 0.5, w };
    f.x = Math.floor(rand() * (tileW - w));
    f.y = 4 + Math.floor(rand() * (tileH - h - 8));
    const wet = Array.from({ length: h }, (_, i) => f.y + i).some(
      (y) => nearRiver(f.x, y, 6) || nearRiver(f.x + w, y, 6) || nearRiver(f.x + w / 2, y, 6),
    );
    const clash = fields.some(
      (o) => f.x < o.x + o.w + 6 && o.x < f.x + w + 6 && f.y < o.y + o.h + 6 && o.y < f.y + h + 6,
    );
    if (!wet && !clash) fields.push(f);
  }
  return fields;
}

function fieldPixel(f, x, y) {
  if (x < f.x || y < f.y || x >= f.x + f.w || y >= f.y + f.h) return null;
  const edge = x === f.x || y === f.y || x === f.x + f.w - 1 || y === f.y + f.h - 1;
  if (edge) return hedge;
  const row = f.upright ? x - f.x : y - f.y;
  return f.crop[Math.floor(row / 2) % 2];
}

function groundPixel(x, y, fields) {
  const { centre, half } = river(y);
  const d = Math.abs(x - centre);
  if (d < half) {
    const depth = 1 - d / half;
    const sparkle = (x * 3 + y * 7 + Math.floor(y / 3)) % 29 === 0;
    if (sparkle) return water[3];
    return water[Math.max(0, Math.min(2, Math.floor(depth * 2.6 + dither(x, y))))];
  }
  if (d < half + 2.2) return sand[(x + y) % 2];
  for (const f of fields) {
    const colour = fieldPixel(f, x, y);
    if (colour) return colour;
  }
  const patches = 0.5 + 0.22 * Math.sin(x * 0.06 + 2 * wave(y, 3)) * wave(y, 2, x * 0.03);
  const v = patches + 0.18 * (hash(x, y) - 0.5) + dither(x, y) * 0.25;
  return grass[Math.max(0, Math.min(3, Math.floor(v * 4)))];
}

function paintBase(ctx, fields) {
  const image = ctx.createImageData(tileW, tileH);
  for (let y = 0; y < tileH; y += 1) {
    for (let x = 0; x < tileW; x += 1) {
      image.data.set([...groundPixel(x, y, fields), 255], (y * tileW + x) * 4);
    }
  }
  ctx.putImageData(image, 0, 0);
}

// Draws something three times so it wraps across the top and bottom seam.
function wrapped(draw, y) {
  [y - tileH, y, y + tileH].forEach(draw);
}

function paintCottage(ctx, x, y) {
  wrapped((wy) => {
    ctx.fillStyle = "rgba(10, 25, 10, 0.4)";
    ctx.fillRect(x - 3, wy + 3, 12, 9);
    ctx.fillStyle = "#9b3c2b";
    ctx.fillRect(x, wy, 6, 9);
    ctx.fillStyle = "#c95a3c";
    ctx.fillRect(x + 6, wy, 6, 9);
    ctx.fillStyle = "#6e271d";
    ctx.fillRect(x + 5, wy, 2, 9);
    ctx.fillStyle = "#57534f";
    ctx.fillRect(x + 8, wy + 1, 2, 2);
  }, y);
}

function treeSprites(rand) {
  return Array.from({ length: 6 }, () => {
    const size = 3.5 + rand() * 3;
    const puffs = [{ lift: size * 0.4, r: size, x: 0, y: 0 }];
    const extra = Math.floor(rand() * 3);
    for (let i = 0; i < extra; i += 1) {
      puffs.push({ lift: 0, r: size * 0.7, x: (rand() - 0.5) * size * 1.6, y: (rand() - 0.5) * size * 1.6 });
    }
    return paintPuffs(puffs, treeStyle);
  });
}

function rockSprites(rand) {
  return Array.from({ length: 3 }, () => {
    const size = 1.8 + rand() * 1.6;
    return paintPuffs(
      [
        { lift: 0, r: size, x: 0, y: 0 },
        { lift: 0, r: size * 0.7, x: size * 0.9, y: size * 0.3 },
      ],
      rockStyle,
    );
  });
}

function blocked(x, y, fields, gap) {
  const inField = fields.some(
    (f) => x > f.x - gap && x < f.x + f.w + gap && y > f.y - gap && y < f.y + f.h + gap,
  );
  return inField || nearRiver(x, y, gap + 3);
}

// Scatters sprites around a few grove centres, skipping water and fields.
function scatter(ctx, rand, sprites, fields, { count, groves, shadow, spread }) {
  const centres = Array.from({ length: groves }, () => ({ x: rand() * tileW, y: rand() * tileH }));
  for (let i = 0; i < count; i += 1) {
    const c = centres[i % groves];
    const x = Math.round(c.x + (rand() - 0.5) * spread);
    const y = Math.round(c.y + (rand() - 0.5) * spread);
    const sprite = sprites[Math.floor(rand() * sprites.length)];
    if (x < 0 || x > tileW || blocked(x, (y + tileH) % tileH, fields, sprite.width / 2)) continue;
    wrapped((wy) => {
      ctx.fillStyle = shadow;
      ctx.beginPath();
      ctx.ellipse(x - 2, wy + 3, sprite.width / 2, sprite.height / 2.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.drawImage(sprite, Math.round(x - sprite.width / 2), Math.round(wy - sprite.height / 2));
    }, y);
  }
}

export function paintGround() {
  const rand = seeded(2024);
  const tile = canvasOf(tileW, tileH);
  const ctx = tile.getContext("2d");
  const fields = chooseFields(rand);
  paintBase(ctx, fields);
  fields.slice(0, 3).forEach((f) => {
    const x = f.x + f.w + 4 < tileW - 12 ? f.x + f.w + 4 : f.x - 16;
    if (!nearRiver(x + 6, f.y + 4, 4)) paintCottage(ctx, x, f.y + 4);
  });
  scatter(ctx, rand, rockSprites(rand), fields, {
    count: 26,
    groves: 9,
    shadow: "rgba(10, 25, 10, 0.3)",
    spread: 70,
  });
  scatter(ctx, rand, treeSprites(rand), fields, {
    count: 150,
    groves: 8,
    shadow: "rgba(10, 30, 10, 0.4)",
    spread: 46,
  });
  return blocky(tile, groundScale);
}
