// Jörmungandr's body, drawn to match the concept picture: a thick
// black-outlined tube of big blocky green scales with a brown belly stripe
// down one side, tapering slowly to a thin curled tail. It's drawn on a
// small canvas and scaled up without smoothing, so it comes out as chunky
// pixels like the picture.
import { cell } from "./board.js";

const pixel = 3;
const fullWidth = 29;
const tipWidth = 5;
// The neck: narrowest just behind the head sprite, then flaring out to
// full width. Distances are in cells from the head.
const neckWidth = 0.66;
const neckStart = 0.35;
const neckEnd = 1.6;
const stepsPerCell = 9;
const rowsPerCell = 3;

const colours = {
  base: "#070d08",
  belly: "#50331a",
  bellyLight: "#74491f",
  outline: "#050805",
};

// Scale tones: body and highlight patch. Each scale picks one, so the hide
// is mottled like the picture's rather than evenly tiled.
const tones = [
  ["#2c4a20", "#5f8030"],
  ["#375a25", "#76953a"],
  ["#41662a", "#8ca443"],
  ["#253f1c", "#4d6c29"],
];

// Where the scales sit across the body, from the back (-1) to the belly
// (+1). They're mirrored when the belly is on the other side. Rows alternate between the two so the seams are staggered.
const evenRow = [-1, -0.14, 0.74];
const oddRow = [-1, -0.57, 0.29, 0.74];

let canvas = null;

function surface(width, height) {
  const w = Math.ceil(width / pixel);
  const h = Math.ceil(height / pixel);
  if (!canvas) canvas = document.createElement("canvas");
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  return canvas;
}

function mid(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function quad(a, c, b, t) {
  const u = 1 - t;
  return {
    x: u * u * a.x + 2 * u * t * c.x + t * t * b.x,
    y: u * u * a.y + 2 * u * t * c.y + t * t * b.y,
  };
}

// How far from the head a point is, in cells. Each cell owns the stretch
// from the midpoint before it to the midpoint after it; the head and tail
// cells own only half a stretch.
function alongAt(k, n, t) {
  if (k === 0) return t / 2;
  if (k === n - 1) return k - 0.5 + t / 2;
  return k - 0.5 + t;
}

// Which side the belly is on (+1 or -1, see bellySide in snake.js),
// blended across cell boundaries so a change of side twists over smoothly.
function bellyAt(cells, k, t) {
  const here = cells[k].belly ?? 1;
  const other = t < 0.5 ? cells[k - 1] : cells[k + 1];
  const there = other ? other.belly ?? 1 : here;
  const mix = Math.abs(t - 0.5);
  return here + (there - here) * mix;
}

function neckAt(along) {
  const f = Math.min(1, Math.max(0, (along - neckStart) / (neckEnd - neckStart)));
  const smooth = f * f * (3 - 2 * f);
  return fullWidth * (neckWidth + (1 - neckWidth) * smooth);
}

function widthAt(along, length) {
  const neck = neckAt(along);
  const taper = Math.min(6, Math.max(1.5, length * 0.4));
  const left = length - along;
  if (left >= taper) return neck;
  const f = Math.max(0, left / taper);
  return Math.min(neck, tipWidth + (fullWidth - tipWidth) * Math.pow(f, 0.8));
}

// Points along a smooth centreline through the cell centres, rounding each
// corner with a curve, from head to tail.
function centreline(cells) {
  const n = cells.length;
  const length = n - 1;
  const out = [];
  cells.forEach((p, k) => {
    const a = k === 0 ? p : mid(cells[k - 1], p);
    const b = k === n - 1 ? p : mid(p, cells[k + 1]);
    const last = k === n - 1 ? stepsPerCell : stepsPerCell - 1;
    for (let s = 0; s <= last; s += 1) {
      const t = s / stepsPerCell;
      const along = alongAt(k, n, t);
      const w = widthAt(along, length);
      out.push({ ...quad(a, p, b, t), along, belly: bellyAt(cells, k, t), k, s, w });
    }
  });
  addTangents(out);
  return out;
}

function addTangents(points) {
  points.forEach((p, i) => {
    const a = points[Math.max(0, i - 1)];
    const b = points[Math.min(points.length - 1, i + 1)];
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    p.tx = (b.x - a.x) / len;
    p.ty = (b.y - a.y) / len;
  });
}

// A thin tip past the last cell that curls off to one side, like the
// picture's tail.
function tailTip(points) {
  const end = points[points.length - 1];
  let angle = Math.atan2(end.ty, end.tx);
  let { x, y } = end;
  const tip = [];
  for (let i = 1; i <= 9; i += 1) {
    angle += 0.13;
    x += Math.cos(angle) * 3;
    y += Math.sin(angle) * 3;
    const w = Math.max(1.5, end.w * (1 - i / 10));
    tip.push({ tx: Math.cos(angle), ty: Math.sin(angle), w, x, y });
  }
  return tip;
}

function disc(g, x, y, r, colour) {
  g.fillStyle = colour;
  g.beginPath();
  g.arc(x / pixel, y / pixel, Math.max(0.5, r / pixel), 0, Math.PI * 2);
  g.fill();
}

// A point across the body: v runs from -1 to +1, the left edge to the
// right edge when looking from head to tail.
function side(p, v) {
  return { x: p.x - p.ty * v * p.w / 2, y: p.y + p.tx * v * p.w / 2 };
}

function drawTube(g, points) {
  points.forEach((p) => disc(g, p.x, p.y, p.w / 2 + pixel, colours.outline));
  points.forEach((p) => disc(g, p.x, p.y, p.w / 2, colours.base));
  const wide = points.filter((p) => p.w >= 10);
  wide.forEach((p) => {
    const b = side(p, 0.88 * p.belly);
    disc(g, b.x, b.y, p.w * 0.052, colours.belly);
  });
  wide.forEach((p) => {
    const b = side(p, 0.86 * p.belly);
    disc(g, b.x, b.y, p.w * 0.02, colours.bellyLight);
  });
}

// A stable pseudo-random number for a scale, from where it sits.
function hash(a, b, c) {
  const n = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

// A four-sided patch of the body: across from v0 to v1, and along from
// u0 to u1 (in pixels, negative toward the head).
function patch(g, p, v0, v1, u0, u1, colour) {
  const corners = [[v0, u0], [v1, u0], [v1, u1], [v0, u1]];
  g.fillStyle = colour;
  g.beginPath();
  corners.forEach(([v, u], i) => {
    const c = side(p, v);
    const x = (c.x + p.tx * u) / pixel;
    const y = (c.y + p.ty * u) / pixel;
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  });
  g.closePath();
  g.fill();
}

// One blocky scale, with a dark seam round it (the base showing through)
// and a light patch on its head-side, top corner.
function drawScale(g, p, v0, v1, len, tone) {
  const gap = pixel / p.w;
  const half = len / 2 - pixel * 0.4;
  patch(g, p, v0 + gap, v1 - gap, -half, half, tone[0]);
  const v = v0 + gap + (v1 - v0) * 0.12;
  patch(g, p, v, v + (v1 - v0) * 0.55, -half + 1, -half + len * 0.5, tone[1]);
}

// Rows of scales across the body, a fixed number per cell. Each row's
// stagger and tones come from the board cell it sits in, so the pattern
// stays put as the serpent moves.
function drawScales(g, points, cells) {
  const rowStep = stepsPerCell / rowsPerCell;
  const len = cell / rowsPerCell;
  for (let i = points.length - 1; i >= 0; i -= 1) {
    const p = points[i];
    if (p.s % rowStep !== 0 || p.w < 9) continue;
    const at = cells[p.k];
    const row = p.s / rowStep;
    const flip = (at.belly ?? 1) < 0 ? -1 : 1;
    const odd = (at.x + at.y + row) % 2 === 1;
    const edges = (odd ? oddRow : evenRow).map((v) => v * flip);
    const scaleLen = len * Math.min(1, p.w / fullWidth + 0.3);
    for (let j = 0; j < edges.length - 1; j += 1) {
      const tone = tones[Math.floor(hash(at.x, at.y, row * 5 + j) * 4)];
      drawScale(g, p, edges[j], edges[j + 1], scaleLen, tone);
    }
  }
}

// Centres are cell centres in canvas pixels, head first; cells are the
// matching board cells.
export function drawBody(ctx, centres, cells) {
  if (centres.length < 2) return;
  const g = surface(ctx.canvas.width, ctx.canvas.height).getContext("2d");
  g.clearRect(0, 0, canvas.width, canvas.height);
  const points = centreline(centres);
  drawTube(g, [...points, ...tailTip(points)]);
  drawScales(g, points, cells);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(canvas, 0, 0, canvas.width * pixel, canvas.height * pixel);
  ctx.restore();
}
