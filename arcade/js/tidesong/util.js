// Small shared helpers: seeded randomness, value noise, colour mixing and
// clamping. Everything procedural in Tidesong goes through these, so the same
// seed always builds the same world and the same creature art.

export function clamp(value, low, high) {
  return Math.max(low, Math.min(high, value));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

// A stable 32-bit hash of any string or number.
export function hash(input) {
  let h = 2166136261;
  for (const char of String(input)) {
    h = Math.imul(h ^ char.codePointAt(0), 16777619) >>> 0;
  }
  return h;
}

// Mulberry32: a tiny seeded generator returning floats in [0, 1).
export function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

// Deterministic 0..1 value for a lattice point.
function lattice(seed, x, y) {
  let h = seed ^ Math.imul(x, 374761393) ^ Math.imul(y, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function smooth(t) {
  return t * t * (3 - 2 * t);
}

// Smooth value noise in [0, 1].
export function noise2(seed, x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const tx = smooth(x - xi);
  const ty = smooth(y - yi);
  const a = lattice(seed, xi, yi);
  const b = lattice(seed, xi + 1, yi);
  const c = lattice(seed, xi, yi + 1);
  const d = lattice(seed, xi + 1, yi + 1);
  return lerp(lerp(a, b, tx), lerp(c, d, tx), ty);
}

// Three octaves of value noise, still in [0, 1].
export function fbm(seed, x, y) {
  return (
    noise2(seed, x, y) * 0.57 +
    noise2(seed + 17, x * 2.1, y * 2.1) * 0.29 +
    noise2(seed + 41, x * 4.3, y * 4.3) * 0.14
  );
}

function toRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex([r, g, b]) {
  const part = (v) => {
    return Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0");
  };
  return `#${part(r)}${part(g)}${part(b)}`;
}

// Mixes two #rrggbb colours: t = 0 gives a, t = 1 gives b.
export function mix(a, b, t) {
  const ca = toRgb(a);
  const cb = toRgb(b);
  return toHex(ca.map((v, i) => lerp(v, cb[i], t)));
}

export function shade(hex, amount) {
  return amount < 0 ? mix(hex, "#000000", -amount) : mix(hex, "#ffffff", amount);
}

export function alpha(hex, a) {
  const [r, g, b] = toRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

// HSL (degrees, 0..100, 0..100) to #rrggbb.
export function hsl(h, s, l) {
  const sat = s / 100;
  const lig = l / 100;
  const k = (n) => {
    return (n + h / 30) % 12;
  };
  const f = (n) => {
    const a = sat * Math.min(lig, 1 - lig);
    return lig - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  };
  return toHex([f(0) * 255, f(8) * 255, f(4) * 255]);
}

// An offscreen canvas, or null where the browser can't make one.
export function makeCanvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(width));
  canvas.height = Math.max(1, Math.ceil(height));
  return canvas;
}

export function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => {
    return {
      "\"": "&quot;",
      "&": "&amp;",
      "'": "&#39;",
      "<": "&lt;",
      ">": "&gt;",
    }[c];
  });
}
