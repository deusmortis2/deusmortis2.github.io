// Art for Jörmungandr. Every sprite is cut from the concept picture (see
// jormungandr-cutter/cut.py); the board itself is drawn here to match it.
import { boardX, boardY, cell, cols, realms, rows } from "./board.js";

const names = [
  "apple", "boar", "bolt", "egg", "head", "heart", "logo", "potion",
  "rune", "runes", "star", "thor",
];

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Couldn't load ${src}`));
    img.src = src;
  });
}

export async function loadArt() {
  const art = {};
  const images = await Promise.all(names.map((n) => loadImage(`img/jormungandr/${n}.png`)));
  names.forEach((name, i) => {
    art[name] = images[i];
  });
  art.glyphs = buildGlyphs(art.runes);
  art.boards = new Map();
  return art;
}

// The rune strip is white glyphs on black in 56px cells. Each becomes a
// gold glyph with transparency, ready to stamp.
function buildGlyphs(strip) {
  const size = 56;
  const count = Math.round(strip.width / size);
  const glyphs = [];
  for (let i = 0; i < count; i += 1) {
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const g = c.getContext("2d");
    g.drawImage(strip, i * size, 0, size, size, 0, 0, size, size);
    const data = g.getImageData(0, 0, size, size);
    for (let p = 0; p < data.data.length; p += 4) {
      const on = data.data[p];
      data.data[p] = 154;
      data.data[p + 1] = 112;
      data.data[p + 2] = 52;
      data.data[p + 3] = on;
    }
    g.putImageData(data, 0, 0);
    glyphs.push(c);
  }
  return glyphs;
}

// A fixed pseudo-random sequence, so each realm's board looks the same
// every time it's drawn.
function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

function drawCells(g, floor) {
  g.fillStyle = "#0b0b1a";
  g.fillRect(boardX, boardY, cols * cell, rows * cell);
  g.fillStyle = floor;
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      g.fillRect(boardX + x * cell + 2, boardY + y * cell + 2, cell - 3, cell - 3);
    }
  }
  // Faint scanlines, like the old screen in the picture.
  g.fillStyle = "rgba(0, 0, 0, 0.16)";
  for (let y = boardY; y < boardY + rows * cell; y += 3) {
    g.fillRect(boardX, y, cols * cell, 1);
  }
}

// Gold runes carved into some of the outer cells.
function drawBorderRunes(g, glyphs, rand) {
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const edge = x === 0 || y === 0 || x === cols - 1 || y === rows - 1;
      if (!edge || rand() > 0.45) continue;
      const glyph = glyphs[Math.floor(rand() * glyphs.length)];
      g.globalAlpha = 0.75;
      g.drawImage(glyph, boardX + x * cell + 2, boardY + y * cell + 2, cell - 4, cell - 4);
    }
  }
  g.globalAlpha = 1;
}

// Blue cracks of light running out from the middle.
function drawCracks(g, cx, cy, rand) {
  g.strokeStyle = "rgba(60, 130, 240, 0.28)";
  g.shadowColor = "#3d8bff";
  g.shadowBlur = 6;
  g.lineWidth = 1.5;
  for (let i = 0; i < 9; i += 1) {
    let angle = rand() * Math.PI * 2;
    let r = 60 + rand() * 40;
    g.beginPath();
    g.moveTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r * 0.8);
    for (let j = 0; j < 5; j += 1) {
      r += 18 + rand() * 22;
      angle += (rand() - 0.5) * 0.5;
      g.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r * 0.8);
    }
    g.stroke();
  }
  g.shadowBlur = 0;
}

// The glowing gold rune circle in the middle of the board.
function drawCircle(g, glyphs, cx, cy) {
  g.strokeStyle = "rgba(214, 170, 90, 0.55)";
  g.shadowColor = "#e8b04a";
  g.shadowBlur = 10;
  [[150, 3], [128, 2], [70, 2], [52, 1]].forEach(([r, w]) => {
    g.lineWidth = w;
    g.beginPath();
    g.ellipse(cx, cy, r, r * 0.8, 0, 0, Math.PI * 2);
    g.stroke();
  });
  g.shadowBlur = 0;
  g.globalAlpha = 0.5;
  for (let i = 0; i < 16; i += 1) {
    const a = (i / 16) * Math.PI * 2;
    const glyph = glyphs[i % glyphs.length];
    g.drawImage(glyph, cx + Math.cos(a) * 139 - 9, cy + Math.sin(a) * 111 - 9, 18, 18);
  }
  g.globalAlpha = 1;
}

function drawFrame(g) {
  g.strokeStyle = "#2c6a80";
  g.lineWidth = 4;
  g.strokeRect(boardX - 4, boardY - 4, cols * cell + 8, rows * cell + 8);
  g.strokeStyle = "#0e2a36";
  g.lineWidth = 2;
  g.strokeRect(boardX - 8, boardY - 8, cols * cell + 16, rows * cell + 16);
}

// The board for one realm, drawn once and cached.
export function boardImage(art, realm) {
  if (art.boards.has(realm)) return art.boards.get(realm);
  const c = document.createElement("canvas");
  c.width = boardX * 2 + cols * cell;
  c.height = boardY + rows * cell + 8;
  const g = c.getContext("2d");
  const rand = seeded(1234 + realm * 77);
  const cx = boardX + (cols * cell) / 2;
  const cy = boardY + (rows * cell) / 2;
  drawCells(g, realms[realm].floor);
  drawBorderRunes(g, art.glyphs, rand);
  drawCracks(g, cx, cy, rand);
  drawCircle(g, art.glyphs, cx, cy);
  drawFrame(g);
  art.boards.set(realm, c);
  return c;
}

// Draws an image centred on (x, y), fitted inside a size x size box.
export function drawFitted(ctx, img, x, y, size) {
  const scale = size / Math.max(img.width, img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, x - w / 2, y - h / 2, w, h);
}
