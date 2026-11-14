// Draws the region you're in: its painted scene, plus small touches on top
// (building names when you're close, the glow of a legendary's lair, signs
// at the edges saying where they lead, strong currents into sealed regions)
// and the moving ambience (light rays, bubbles, darkness).
import { keeperSheet, sceneImage } from "./art.js";
import { keeperAtlas } from "./keeperAtlas.js";
import { keeperHeight } from "./world.js";
import { zones } from "./zones.js";

const signRange = 240;

const edgeRange = 150;

// Keeps the camera inside the region, or centres a region smaller than the
// screen.
export function cameraFor(zone, x, y, view) {
  const z = zones[zone];
  const fit = (pos, size, len) => {
    if (len <= size) return (len - size) / 2;
    return Math.max(0, Math.min(len - size, pos - size / 2));
  };
  return { camX: fit(x, view.width, z.width), camY: fit(y, view.height, z.height) };
}

function pill(ctx, text, x, y, color = "#ffffff", fill = "rgba(8,16,36,0.82)") {
  ctx.font = "bold 13px system-ui, sans-serif";
  const w = ctx.measureText(text).width + 16;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - 11, w, 22, 11);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y + 1);
}

function drawScene(ctx, view, zone) {
  const z = zones[zone];
  ctx.fillStyle = z.water;
  ctx.fillRect(0, 0, view.width, view.height);
  const img = sceneImage(zone);
  if (!img) {
    pill(ctx, "Loading...", view.width / 2, view.height / 2);
    return;
  }
  // The scene file may be stored smaller or larger than it is drawn.
  const kx = img.naturalWidth / z.width;
  const ky = img.naturalHeight / z.height;
  const x0 = Math.max(0, view.camX);
  const y0 = Math.max(0, view.camY);
  const w = Math.min(z.width, view.camX + view.width) - x0;
  const h = Math.min(z.height, view.camY + view.height) - y0;
  // Small paintings are enlarged to fill their region. Keep their pixels
  // sharp instead of letting the browser blur them.
  ctx.imageSmoothingEnabled = z.image.scale <= 1;
  ctx.drawImage(img, x0 * kx, y0 * ky, w * kx, h * ky, Math.round(x0 - view.camX), Math.round(y0 - view.camY), w, h);
  ctx.imageSmoothingEnabled = true;
}

function drawKeepers(ctx, view, zone, region, time) {
  const sheet = keeperSheet();
  if (!sheet) return;
  const set = keeperAtlas[zones[zone].keepers ?? "regular"];
  region.buildings.forEach((b, i) => {
    const r = set[b.kind];
    if (!r) return;
    const w = r[2] * (keeperHeight / r[3]);
    // A slow bob, out of step from one keeper to the next.
    const bob = Math.sin(time * 1.6 + i * 1.3) * 2;
    const x = b.keeper.x - w / 2 - view.camX;
    const y = b.keeper.feet - keeperHeight + bob - view.camY;
    if (x > view.width || y > view.height || x + w < 0 || y + keeperHeight < 0) return;
    ctx.drawImage(sheet, r[0], r[1], r[2], r[3], Math.round(x), Math.round(y), w, keeperHeight);
  });
}

function drawSigns(ctx, view, region, player) {
  region.buildings.forEach((b) => {
    if (Math.hypot(b.door.x - player.x, b.door.y - player.y) > signRange) return;
    // Below the shopkeeper, so it hides neither them nor the sign.
    pill(ctx, b.label, b.keeper.x - view.camX, b.keeper.feet - view.camY + 12, "#fff2c4");
  });
}

function drawLair(ctx, view, region, state) {
  const lair = region.lair;
  const x = lair.x - view.camX;
  const y = lair.y - view.camY;
  if (x < -80 || y < -80 || x > view.width + 80 || y > view.height + 80) return;
  const caught = state.caught.has(lair.species);
  const pulse = 0.5 + Math.sin(state.time * 3) * 0.5;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const g = ctx.createRadialGradient(x, y, 4, x, y, 46 + pulse * 8);
  g.addColorStop(0, caught ? "rgba(255,255,255,0.25)" : "rgba(255,236,150,0.75)");
  g.addColorStop(1, "rgba(255,236,150,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, 54 + pulse * 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = caught ? "rgba(255,255,255,0.35)" : `rgba(255,230,120,${0.55 + pulse * 0.45})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 18 + pulse * 5, 0, Math.PI * 2);
  ctx.stroke();
  if (Math.hypot(lair.x - state.player.x, lair.y - state.player.y) < signRange * 1.4) {
    pill(ctx, `★ ${lair.name}`, x, y - 46, caught ? "#cfd8e3" : "#ffe14d");
  }
}

// Each exit along the edges: a sign when you're near it, and a shimmering
// current across it if the region beyond is sealed.
function drawEdges(ctx, view, zone, state) {
  const z = zones[zone];
  const p = state.player;
  Object.entries(z.exits).forEach(([side, list]) => {
    list.forEach(([a, b, to]) => {
      const horizontal = side === "north" || side === "south";
      const len = horizontal ? z.width : z.height;
      const from = a * len;
      const until = b * len;
      const edge = { east: z.width, north: 0, south: z.height, west: 0 }[side];
      const along = horizontal ? p.x : p.y;
      const across = horizontal ? p.y : p.x;
      const near = Math.abs(across - edge) < edgeRange && along >= from && along <= until;
      const locked = state.isLocked(to);
      if (locked) {
        const shift = (state.time * 60) % 24;
        ctx.strokeStyle = "rgba(220,240,255,0.45)";
        ctx.lineWidth = 3;
        for (let s = from + shift; s < until; s += 24) {
          const dx = horizontal ? s : edge;
          const dy = horizontal ? edge : s;
          ctx.beginPath();
          if (horizontal) {
            ctx.moveTo(dx - view.camX, dy - view.camY + (side === "north" ? 6 : -6));
            ctx.lineTo(dx - view.camX + 12, dy - view.camY + (side === "north" ? 18 : -18));
          } else {
            ctx.moveTo(dx - view.camX + (side === "west" ? 6 : -6), dy - view.camY);
            ctx.lineTo(dx - view.camX + (side === "west" ? 18 : -18), dy - view.camY + 12);
          }
          ctx.stroke();
        }
      }
      if (!near) return;
      const arrow = { east: "▶", north: "▲", south: "▼", west: "◀" }[side];
      const sx = horizontal ? Math.max(from, Math.min(until, p.x)) : edge;
      const sy = horizontal ? edge : Math.max(from, Math.min(until, p.y));
      const ix = { east: -90, north: 0, south: 0, west: 90 }[side];
      const iy = { east: 0, north: 30, south: -30, west: 0 }[side];
      const label = `${side === "west" || side === "north" ? `${arrow} ` : ""}${zones[to].name}${side === "east" || side === "south" ? ` ${arrow}` : ""}`;
      pill(ctx, locked ? `${label} (sealed)` : label, sx - view.camX + ix, sy - view.camY + iy, locked ? "#ffb3b3" : "#bff3ff");
    });
  });
}

export function createWorldRenderer(world) {
  const bubbles = [];

  const draw = (ctx, view, state) => {
    const region = world.region(state.zone);
    drawScene(ctx, view, state.zone);
    drawKeepers(ctx, view, state.zone, region, state.time);
    drawLair(ctx, view, region, state);
    drawSigns(ctx, view, region, state.player);
    drawEdges(ctx, view, state.zone, state);
  };

  // Light rays, bubbles and darkness: everything that moves.
  const drawAmbience = (ctx, view, state) => {
    const zone = zones[state.zone];
    const { height, width } = view;
    if (!state.lowGraphics && zone.dark < 0.15) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 4; i += 1) {
        const x = ((i * 290 + state.time * 18 - view.camX * 0.2) % (width + 400) + width + 400) % (width + 400) - 200;
        const g = ctx.createLinearGradient(x, 0, x + 120, height);
        g.addColorStop(0, "rgba(255,255,255,0.06)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 70, 0);
        ctx.lineTo(x + 220, height);
        ctx.lineTo(x + 120, height);
        ctx.fill();
      }
      ctx.restore();
    }
    const want = state.lowGraphics ? 8 : 26;
    while (bubbles.length < want) {
      bubbles.push({ r: 1 + Math.random() * 3, s: 20 + Math.random() * 40, x: Math.random() * width, y: height + Math.random() * height });
    }
    bubbles.length = Math.min(bubbles.length, want);
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = 1;
    bubbles.forEach((b) => {
      b.y -= b.s * state.dt;
      b.x += Math.sin(state.time * 2 + b.s) * 0.3;
      if (b.y < -10) {
        b.y = height + 10;
        b.x = Math.random() * width;
      }
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.stroke();
    });
    const dark = state.hasLantern ? zone.dark * 0.5 : zone.dark;
    if (dark > 0.05) {
      const radius = state.hasLantern ? 320 : 200;
      const g = ctx.createRadialGradient(state.screenX, state.screenY, radius * 0.3, state.screenX, state.screenY, radius);
      g.addColorStop(0, "rgba(0,0,8,0)");
      g.addColorStop(1, `rgba(0,0,8,${dark})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);
    }
  };

  return { draw, drawAmbience };
}
