// Loads the Astro Stomp images and draws the tiles for each planet. Each
// planet's art (background, four aliens and the boss) loads when it's
// needed, and the next planet's loads in the background while you play.
import { tile } from "./levels.js";

const folder = "img/astro/";
// The astronaut sheet: 0 facing you, 1 to 4 walking, 5 crouched (the
// smash), 6 taking off, 7 the top of a jump, 8 falling, 9 landing.
export const astronautCell = { count: 10, h: 84, w: 48 };
// Bump this whenever astronaut.png is redrawn. Pictures are cached for an
// hour, and new code reading an old sheet slices it in the wrong places.
const astronautVersion = "frames10";

const zoneArt = {
  earth: ["plant", "panther", "hornet", "turtle", "boss"],
  jupiter: ["jelly", "beetle", "wyvern", "blob", "boss"],
  mars: ["crab", "crawler", "bat", "scorpion", "boss"],
  mercury: ["crab", "imp", "beetle", "hound", "boss"],
  neptune: ["crab", "eel", "gargoyle", "jelly", "boss"],
  saturn: ["crab", "eel", "wyvern", "jelly", "boss"],
  uranus: ["crab", "eel", "wyvern", "jelly", "boss"],
  venus: ["jelly", "slug", "miner", "wasp", "boss"],
};

// Ground colours picked from each planet's background.
const palettes = {
  earth: { dark: "#2a2418", fill: "#5a4a32", speck: "#7a6a48", top: "#4caf50" },
  jupiter: { dark: "#1e2430", fill: "#3a4458", speck: "#6a7a90", top: "#9aa8bc" },
  mars: { dark: "#4f1d10", fill: "#86391f", speck: "#a8502c", top: "#d07040" },
  mercury: { dark: "#1e1816", fill: "#3e322c", speck: "#ff7a1a", top: "#a86a3a" },
  neptune: { dark: "#0c1030", fill: "#1c2650", speck: "#4a6ad0", top: "#7aa0ff" },
  saturn: { dark: "#3e3a56", fill: "#6f6a88", speck: "#9a94b0", top: "#e4dccb" },
  uranus: { dark: "#0e2a30", fill: "#1e4a50", speck: "#6ae0e0", top: "#bff6f0" },
  venus: { dark: "#241e0e", fill: "#4a4020", speck: "#c8d040", top: "#8a8a30" },
};
export const iceTop = "#dff8ff";

function loadImage(path) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Couldn't load ${path}`));
    image.src = folder + path;
  });
}

// The astronaut sheet, checked for the right size. A stale cached copy
// gets one fresh reload.
async function loadAstronaut() {
  const { count, h, w } = astronautCell;
  const fits = (image) => image.width === count * w && image.height === h;
  const image = await loadImage(`astronaut.png?v=${astronautVersion}`);
  if (fits(image)) return image;
  return loadImage(`astronaut.png?v=${astronautVersion}-${Date.now()}`);
}

function canvasOf(w, h, paint) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  paint(canvas.getContext("2d"));
  return canvas;
}

// Same speckles every time, so tiles don't shimmer.
function speckle(ctx, colour, seed, top) {
  let n = seed;
  ctx.fillStyle = colour;
  for (let i = 0; i < 9; i += 1) {
    n = (n * 9301 + 49297) % 233280;
    const x = Math.floor((n / 233280) * (tile - 6));
    n = (n * 9301 + 49297) % 233280;
    const y = top + Math.floor((n / 233280) * (tile - top - 6));
    ctx.fillRect(x, y, 3 + (i % 3) * 2, 3);
  }
}

function buildTiles(palette) {
  const p = palettes[palette];
  const block = (top) => {
    return canvasOf(tile, tile, (ctx) => {
      ctx.fillStyle = p.fill;
      ctx.fillRect(0, 0, tile, tile);
      ctx.fillStyle = p.dark;
      ctx.fillRect(0, tile - 3, tile, 3);
      ctx.fillRect(tile - 3, 0, 3, tile);
      speckle(ctx, p.speck, top ? 11 : 37, top ? 12 : 0);
      if (!top) return;
      ctx.fillStyle = top;
      ctx.fillRect(0, 0, tile, 9);
      ctx.fillStyle = p.dark;
      ctx.fillRect(0, 9, tile, 3);
    });
  };
  const ledge = canvasOf(tile, 20, (ctx) => {
    ctx.fillStyle = p.dark;
    ctx.fillRect(0, 0, tile, 20);
    ctx.fillStyle = p.top;
    ctx.fillRect(0, 0, tile, 8);
    ctx.fillStyle = p.fill;
    ctx.fillRect(3, 8, tile - 6, 8);
  });
  return { ice: block(iceTop), ledge, solid: block(null), surface: block(p.top) };
}

// The background, plus a mirrored copy beside it, so it can scroll forever
// without a seam.
function mirrorStrip(image) {
  const w = image.width;
  return canvasOf(w * 2, image.height, (ctx) => {
    ctx.drawImage(image, 0, 0);
    ctx.save();
    ctx.translate(w * 2, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(image, 0, 0);
    ctx.restore();
  });
}

export async function loadArt() {
  const astronaut = await loadAstronaut();
  return {
    images: { astronaut },
    loading: {},
    mirrored: mirrorSheet(astronaut),
    ready: {},
    strips: {},
    tiles: {},
  };
}

// Loads one planet's art. Safe to call again: it only loads once.
export function loadZone(art, zone) {
  if (!art.loading[zone]) {
    const names = zoneArt[zone];
    art.loading[zone] = Promise.all([
      loadImage(`${zone}/bg.jpg`),
      ...names.map((name) => loadImage(`${zone}/${name}.png`)),
    ]).then(([bg, ...sprites]) => {
      art.strips[zone] = mirrorStrip(bg);
      names.forEach((name, i) => {
        art.images[`${zone}/${name}`] = sprites[i];
      });
      art.tiles[zone] = buildTiles(zone);
      art.ready[zone] = true;
    });
  }
  return art.loading[zone];
}

// Draws a mirrored copy of the astronaut sheet so left-facing frames are
// a plain drawImage call.
export function mirrorSheet(image) {
  return canvasOf(image.width, image.height, (ctx) => {
    const { count, w } = astronautCell;
    for (let i = 0; i < count; i += 1) {
      ctx.save();
      ctx.translate(i * w + w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(image, i * w, 0, w, image.height, 0, 0, w, image.height);
      ctx.restore();
    }
  });
}
