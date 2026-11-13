// A tiny pixel painter for scenery. It shades clusters of overlapping
// spheres ("puffs") with a few palette tones, ordered dithering and a dark
// rim, so the moon, tree tops and rocks match the hand-shaded look of the
// dragon and monster sprites.
const bayer = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

export function dither(x, y) {
  return bayer[y % 4][x % 4] / 16 - 0.47;
}

function unit(v) {
  const len = Math.hypot(v.x, v.y, v.z);
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

export function canvasOf(w, h) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(w));
  canvas.height = Math.max(1, Math.ceil(h));
  return canvas;
}

// Nearest-neighbour upscale, so each painted pixel becomes a crisp block.
export function blocky(source, scale) {
  const canvas = canvasOf(source.width * scale, source.height * scale);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [Math.floor(n / 65536), Math.floor(n / 256) % 256, n % 256];
}

// Finds the highest puff over each pixel. Returns the bounds and a buffer
// of { index, nx, ny, z } (or null where the pixel is empty).
function surface(puffs) {
  const minX = Math.floor(Math.min(...puffs.map((p) => p.x - p.r))) - 1;
  const minY = Math.floor(Math.min(...puffs.map((p) => p.y - p.r))) - 1;
  const maxX = Math.ceil(Math.max(...puffs.map((p) => p.x + p.r))) + 1;
  const maxY = Math.ceil(Math.max(...puffs.map((p) => p.y + p.r))) + 1;
  const w = maxX - minX;
  const h = maxY - minY;
  const cells = new Array(w * h).fill(null);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const px = x + minX + 0.5;
      const py = y + minY + 0.5;
      puffs.forEach((p, index) => {
        const dx = px - p.x;
        const dy = py - p.y;
        const d2 = dx * dx + dy * dy;
        if (d2 >= p.r * p.r) return;
        const z = (p.lift ?? 0) + Math.sqrt(p.r * p.r - d2);
        const cell = cells[y * w + x];
        if (cell && cell.z >= z) return;
        cells[y * w + x] = { index, nx: dx / p.r, ny: dy / p.r, z };
      });
    }
  }
  return { cells, h, w };
}

// Paints puffs ({ x, y, r, lift }) lit from `light` (screen space, y down)
// using `tones` from darkest to lightest and an optional `rim` outline.
export function paintPuffs(puffs, { light, rim, tones }) {
  const { cells, h, w } = surface(puffs);
  const canvas = canvasOf(w, h);
  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(w, h);
  const lit = unit(light);
  const topZ = Math.max(...cells.filter(Boolean).map((c) => c.z));
  const rgb = tones.map(hexToRgb);
  const rimRgb = rim ? hexToRgb(rim) : null;
  const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? null : cells[y * w + x]);
  cells.forEach((cell, i) => {
    if (!cell) return;
    const x = i % w;
    const y = Math.floor(i / w);
    const nz = Math.sqrt(Math.max(0, 1 - cell.nx ** 2 - cell.ny ** 2));
    const diffuse = cell.nx * lit.x + cell.ny * lit.y + nz * lit.z;
    let v = (0.5 + 0.5 * diffuse) * 0.8 + (cell.z / topZ) * 0.2;
    v += (dither(x, y) * 0.6) / tones.length;
    let tone = Math.max(0, Math.min(tones.length - 1, Math.floor(v * tones.length)));
    const around = [at(x - 1, y), at(x + 1, y), at(x, y - 1), at(x, y + 1)];
    // A higher neighbouring puff casts a crease, which separates the lumps.
    const creased = around.some((n) => n && n.index !== cell.index && n.z > cell.z + 1.5);
    if (creased) tone = Math.max(0, tone - 1);
    const edge = around.some((n) => !n);
    const colour = edge && rimRgb ? rimRgb : rgb[tone];
    image.data.set([...colour, 255], i * 4);
  });
  ctx.putImageData(image, 0, 0);
  return canvas;
}

// Copy of a sprite filled with one colour (used for shadows).
export function silhouette(source, colour) {
  const canvas = canvasOf(source.width, source.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(source, 0, 0);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = colour;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
}
