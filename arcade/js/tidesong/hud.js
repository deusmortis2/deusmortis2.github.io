// The heads-up display while exploring: your portrait with HP and
// pearls (top left), the region name and minimap (top right), and the
// collection counts, overall and for this region (bottom left).
import { oceanMap } from "./art.js";
import { creatures } from "./creatures.js";
import { bustCanvas } from "./portrait.js";
import { playerStats } from "./state.js";
import { zones } from "./zones.js";

// The ocean map image is 1264 x 843.
export const mapSize = { h: 843, w: 1264 };
const mapW = 168;
const mapH = (mapW * mapSize.h) / mapSize.w;

// Where a spot in a region falls on the ocean map, in map pixels.
export function mapPoint(zone, x, y) {
  const z = zones[zone];
  const [x0, y0, x1, y1] = z.map;
  return { x: x0 + (x / z.width) * (x1 - x0), y: y0 + (y / z.height) * (y1 - y0) };
}

// Draws the ocean map into a box, with unvisited regions in shadow.
export function drawOceanMap(ctx, state, x, y, w, h) {
  const img = oceanMap();
  if (!img) {
    ctx.fillStyle = "#123a5c";
    ctx.fillRect(x, y, w, h);
    return;
  }
  ctx.drawImage(img, x, y, w, h);
  const kx = w / mapSize.w;
  const ky = h / mapSize.h;
  ctx.fillStyle = "rgba(4,8,22,0.62)";
  Object.values(zones).forEach((z) => {
    if (state.visited.includes(z.id)) return;
    const [x0, y0, x1, y1] = z.map;
    ctx.fillRect(x + x0 * kx, y + y0 * ky, (x1 - x0) * kx, (y1 - y0) * ky);
  });
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = "rgba(6,14,34,0.72)";
  ctx.strokeStyle = "rgba(160,220,255,0.45)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 12);
  ctx.fill();
  ctx.stroke();
}

function bar(ctx, x, y, w, h, frac, color) {
  ctx.fillStyle = "#1b2238";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x + 1, y + 1, (w - 2) * Math.max(0, Math.min(1, frac)), h - 2);
}

function drawPortraitPanel(ctx, state) {
  const stats = playerStats(state);
  panel(ctx, 12, 12, 282, 96);
  const bust = bustCanvas(state.avatar, 80);
  ctx.save();
  ctx.beginPath();
  ctx.arc(60, 60, 40, 0, Math.PI * 2);
  ctx.fillStyle = "#2a6f99";
  ctx.fill();
  ctx.clip();
  ctx.drawImage(bust, 20, 20);
  ctx.restore();
  ctx.strokeStyle = "#ffe14d";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(60, 60, 40, 0, Math.PI * 2);
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 16px system-ui, sans-serif";
  ctx.fillText(state.avatar.name, 110, 36);
  ctx.fillStyle = "#cfe8ff";
  ctx.font = "13px system-ui, sans-serif";
  ctx.fillText(`Lv ${state.player.level}`, 240, 36);
  const frac = state.player.hp / stats.hp;
  bar(ctx, 110, 46, 170, 12, frac, frac > 0.5 ? "#39d98a" : frac > 0.2 ? "#ffcf3f" : "#ff5b5b");
  ctx.fillStyle = "#cfe8ff";
  ctx.font = "11px system-ui, sans-serif";
  ctx.fillText(`${state.player.hp}/${stats.hp} HP`, 112, 74);
  ctx.fillStyle = "#fff2c4";
  ctx.font = "bold 13px system-ui, sans-serif";
  ctx.fillText(`◉ ${state.pearls} pearls`, 110, 97);
}

function drawMinimap(ctx, state, view) {
  const x = view.width - mapW - 14;
  const y = 40;
  panel(ctx, x - 8, 12, mapW + 16, mapH + 38);
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 14px system-ui, sans-serif";
  ctx.fillText(zones[state.zone].name, x + mapW / 2, 31);
  drawOceanMap(ctx, state, x, y, mapW, mapH);
  const at = mapPoint(state.zone, state.player.x, state.player.y);
  const px = x + (at.x / mapSize.w) * mapW;
  const py = y + (at.y / mapSize.h) * mapH;
  ctx.fillStyle = (view.time * 2) % 1 < 0.5 ? "#ff3b6b" : "#ffffff";
  ctx.beginPath();
  ctx.arc(px, py, 3.5, 0, Math.PI * 2);
  ctx.fill();
}

export function drawHud(ctx, state, world, view) {
  drawPortraitPanel(ctx, state);
  drawMinimap(ctx, state, view);
  const inZone = creatures.filter((c) => {
    return c.zone === state.zone;
  });
  const gotHere = inZone.filter((c) => {
    return state.caught.includes(c.id);
  }).length;
  panel(ctx, 12, view.height - 64, 236, 52);
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 14px system-ui, sans-serif";
  ctx.fillText(`Codex  ${state.caught.length} / 150 caught`, 26, view.height - 42);
  // This region's share of the Codex, so you can tell when it's finished.
  ctx.fillStyle = gotHere === inZone.length ? "#ffe27a" : "#bfe6ff";
  ctx.font = "bold 13px system-ui, sans-serif";
  ctx.fillText(`${zones[state.zone].name}  ${gotHere} / ${inZone.length}${gotHere === inZone.length ? " ★" : ""}`, 26, view.height - 22);
}
