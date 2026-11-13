// Backgrounds for the three stages: a clear blue sky, a starry night sky
// and the countryside close below. Everything is painted once at load. The
// ground scrolls down the screen, since the dragon flies "up" the screen.
import { height, seeded, width } from "./entities.js";
import { paintGround } from "./ground.js";
import { blocky, paintPuffs } from "./painter.js";

const moonAt = { x: 400, y: 78 };

// Where the dragon's shadow falls, and how dark it is, in each stage.
export const shadowStyles = {
  day: { alpha: 0.16, dx: -14, dy: 26 },
  ground: { alpha: 0.38, dx: -8, dy: 14 },
  night: { alpha: 0.14, dx: -14, dy: 26 },
};

function paintStars(rand) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  for (let i = 0; i < 140; i += 1) {
    const bright = rand();
    ctx.fillStyle = `rgba(220, 230, 255, ${0.25 + bright * 0.6})`;
    const size = bright > 0.92 ? 2 : 1;
    ctx.fillRect(Math.floor(rand() * width), Math.floor(rand() * height), size, size);
  }
  const twinkles = Array.from({ length: 18 }, () => ({
    phase: rand() * Math.PI * 2,
    speed: 1.5 + rand() * 2.5,
    x: Math.floor(rand() * width),
    y: Math.floor(rand() * height),
  }));
  return { canvas, twinkles };
}

function paintMoon() {
  const moon = paintPuffs([{ lift: 0, r: 12, x: 0, y: 0 }], {
    light: { x: -0.6, y: 0.2, z: 0.75 },
    rim: "#8f8a74",
    tones: ["#a9a38a", "#cdc7aa", "#e6e1c6", "#f7f4e4", "#fffdf4"],
  });
  const ctx = moon.getContext("2d");
  ctx.globalCompositeOperation = "source-atop";
  ctx.fillStyle = "rgba(120, 112, 90, 0.45)";
  [[9, 8, 2], [16, 13, 2], [10, 17, 1], [17, 7, 1]].forEach(([x, y, r]) => {
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  });
  return blocky(moon, 2);
}

export function buildScenery() {
  const rand = seeded(11);
  return {
    ground: { tile: paintGround() },
    moon: paintMoon(),
    stars: paintStars(rand),
  };
}

export function createScenery(theme) {
  return { scroll: 0, theme, time: 0 };
}

export function updateScenery(scene, dt) {
  scene.time += dt;
  scene.scroll += dt * 55;
}

const gradients = new Map();

function gradient(ctx, key, stops) {
  if (!gradients.has(key)) {
    const g = ctx.createLinearGradient(0, 0, 0, height);
    stops.forEach(([at, colour]) => g.addColorStop(at, colour));
    gradients.set(key, g);
  }
  return gradients.get(key);
}

function radial(ctx, x, y, r, inner) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, inner);
  g.addColorStop(1, inner.replace(/[\d.]+\)$/, "0)"));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

function drawDay(ctx) {
  ctx.fillStyle = gradient(ctx, "day", [[0, "#1f4fa8"], [0.55, "#4f8fe0"], [1, "#a8d8fb"]]);
  ctx.fillRect(0, 0, width, height);
  radial(ctx, width * 0.82, -20, 230, "rgba(255, 244, 200, 0.55)");
}

function drawNight(ctx, scene, assets) {
  ctx.fillStyle = gradient(ctx, "night", [[0, "#05081c"], [0.6, "#121a44"], [1, "#24306a"]]);
  ctx.fillRect(0, 0, width, height);
  const { canvas, twinkles } = assets.stars;
  ctx.drawImage(canvas, 0, 0);
  twinkles.forEach((s) => {
    const a = Math.max(0, Math.sin(scene.time * s.speed + s.phase));
    ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
    ctx.fillRect(s.x - 1, s.y, 3, 1);
    ctx.fillRect(s.x, s.y - 1, 1, 3);
  });
  radial(ctx, moonAt.x, moonAt.y, 120, "rgba(200, 210, 255, 0.2)");
  const { moon } = assets;
  ctx.drawImage(moon, moonAt.x - moon.width / 2, moonAt.y - moon.height / 2);
}

function drawGround(ctx, scene, assets) {
  const { tile } = assets.ground;
  const offset = scene.scroll % tile.height;
  ctx.drawImage(tile, 0, Math.floor(offset));
  ctx.drawImage(tile, 0, Math.floor(offset) - tile.height);
}

export function drawScenery(ctx, scene, assets) {
  if (scene.theme === "day") drawDay(ctx);
  if (scene.theme === "night") drawNight(ctx, scene, assets);
  if (scene.theme === "ground") drawGround(ctx, scene, assets);
}
