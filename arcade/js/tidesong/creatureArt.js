// Each creature's picture, cut from the reference art (one atlas image per
// region, see creatureAtlas.js). Pictures are fitted into a square and
// cached per creature, size and mode, so a battle draws one cached image a
// frame.
import { creatureArtVersion, creatureAtlas } from "./creatureAtlas.js";
import { creatureById } from "./creatures.js";
import { needsFlip } from "./creatureFacing.js";
import { makeCanvas } from "./util.js";
import { zoneOrder } from "./zones.js";

const atlases = new Map();
const cache = new Map();

function atlasFor(zone) {
  if (!atlases.has(zone)) {
    const img = new Image();
    const entry = { img, ready: false };
    img.decoding = "async";
    img.addEventListener("load", () => {
      entry.ready = true;
    });
    img.src = `img/tidesong/creatures/${zone}.webp?v=${creatureArtVersion[zone] ?? ""}`;
    entry.loaded = new Promise((resolve) => {
      img.addEventListener("load", resolve);
      img.addEventListener("error", resolve);
    });
    atlases.set(zone, entry);
  }
  return atlases.get(zone);
}

// Resolves once every region's creature pictures have loaded.
export function loadCreatureArt() {
  return Promise.all(zoneOrder.map((zone) => {
    return atlasFor(zone).loaded;
  }));
}

// A cached image of the creature, fitted into a size x size square and
// standing on its bottom edge. mode: "full", "silhouette" (not yet seen, in
// the Codex), "left" or "right" (turned to face that way, for battles).
// While its picture is still loading this returns a blank canvas, which
// isn't cached.
export function creatureCanvas(id, size, mode = "full") {
  const key = `${id}:${size}:${mode}`;
  if (cache.has(key)) return cache.get(key);
  const species = creatureById(id);
  const atlas = atlasFor(species.zone);
  const canvas = makeCanvas(size, size);
  if (!atlas.ready) return canvas;
  const [sx, sy, sw, sh] = creatureAtlas[species.zone][species.slot];
  const scale = Math.min(size / sw, size / sh);
  const w = sw * scale;
  const h = sh * scale;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  if ((mode === "left" || mode === "right") && needsFlip(species.zone, species.slot, mode)) {
    ctx.translate(size, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(atlas.img, sx, sy, sw, sh, (size - w) / 2, size - h, w, h);
  if (mode === "silhouette") {
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = "#0b1a2e";
    ctx.fillRect(0, 0, size, size);
  }
  cache.set(key, canvas);
  return canvas;
}
