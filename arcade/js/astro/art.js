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

// Ice laid over the top of a frozen brick block.
export const iceTop = "#dff8ff";

// Each planet's terrain.png (made from the user's Venus terrain draft,
// recoloured per planet):
//   (0, 0)    dirt, 2 x 2 tiles; the top row has the grassy edge
//   (90, 0)   the dirt's top row again, frosted, for icy columns
//   (180, 0)  stone bricks, 2 x 2 tiles, for raised blocks and ledges
//   (270, 0)  a liquid pool 135 x 50 that tiles left to right
// and gush.png: the geyser, 6 frames of 135 x 218 with the liquid surface
// at y 168. Frame 0 is calm, 1 bubbles, 2 spurts, 3 rises, 4 and 5 roar.
export const gushCell = { h: 218, surface: 168, w: 135 };
const poolSize = { h: 50, w: 135 };
// Slime is drawn the same on every planet (only Venus has slime slugs).
const slimePath = "venus/slime.png";
const terrainVersion = "draft1";

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

function piece(sheet, sx, sy, w, h) {
  return canvasOf(w, h, (ctx) => {
    ctx.drawImage(sheet, sx, sy, w, h, 0, 0, w, h);
  });
}

// Cuts terrain.png into tiles. Dirt and bricks come as two columns, picked
// by column so neighbours join up like the drawing.
function buildTiles(sheet) {
  const pair = (sx, sy, h = tile) => {
    return [piece(sheet, sx, sy, tile, h), piece(sheet, sx + tile, sy, tile, h)];
  };
  // The pool twice over, so any 45 px window can be cut from one copy.
  const pool = canvasOf(poolSize.w * 2, poolSize.h, (ctx) => {
    ctx.drawImage(sheet, 270, 0, poolSize.w, poolSize.h, 0, 0, poolSize.w, poolSize.h);
    ctx.drawImage(sheet, 270, 0, poolSize.w, poolSize.h, poolSize.w, 0, poolSize.w, poolSize.h);
  });
  return {
    bricks: [pair(180, 0), pair(180, tile)],
    ice: pair(90, 0),
    ledge: pair(180, 0, 20),
    pool,
    solid: pair(0, tile),
    surface: pair(0, 0),
  };
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
  const [astronaut, slime] = await Promise.all([
    loadAstronaut(),
    loadImage(`${slimePath}?v=${terrainVersion}`),
  ]);
  return {
    gush: {},
    images: { astronaut, slime },
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
      loadImage(`${zone}/terrain.png?v=${terrainVersion}`),
      loadImage(`${zone}/gush.png?v=${terrainVersion}`),
      ...names.map((name) => loadImage(`${zone}/${name}.png`)),
    ]).then(([bg, terrain, gush, ...sprites]) => {
      art.strips[zone] = mirrorStrip(bg);
      names.forEach((name, i) => {
        art.images[`${zone}/${name}`] = sprites[i];
      });
      art.tiles[zone] = buildTiles(terrain);
      art.gush[zone] = gush;
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
