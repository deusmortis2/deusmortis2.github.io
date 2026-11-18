// Draws hazards, roof spikes, floor thorns, oxygen tanks, checkpoint flags
// and power-ups lying on the ground. Pure output: reads game state, never
// changes it.
import { powerInfo } from "./powerups.js";

const spikeColours = {
  earth: { edge: "#1c3a14", fill: "#8ac850" },
  jupiter: { edge: "#1e2430", fill: "#c8d0dc" },
  mars: { edge: "#4f1d10", fill: "#c88a60" },
  mercury: { edge: "#1e1816", fill: "#8a6a58" },
  neptune: { edge: "#0c1030", fill: "#9cb8ff" },
  saturn: { edge: "#2a4a66", fill: "#bfefff" },
  uranus: { edge: "#0e2a30", fill: "#dff8ff" },
  venus: { edge: "#1c1712", fill: "#8a7a60" },
};

// Thorns growing up from the floor, points upwards.
export function drawThorns(ctx, x, y, palette) {
  const colours = spikeColours[palette];
  for (let i = 0; i < 3; i += 1) {
    const left = x + i * 15;
    ctx.fillStyle = colours.edge;
    ctx.beginPath();
    ctx.moveTo(left, y + 45);
    ctx.lineTo(left + 15, y + 45);
    ctx.lineTo(left + 7.5, y + 17);
    ctx.fill();
    ctx.fillStyle = colours.fill;
    ctx.beginPath();
    ctx.moveTo(left + 3, y + 45);
    ctx.lineTo(left + 12, y + 45);
    ctx.lineTo(left + 7.5, y + 24);
    ctx.fill();
  }
}

export function drawSpikes(ctx, x, y, palette) {
  const colours = spikeColours[palette];
  for (let i = 0; i < 3; i += 1) {
    const left = x + i * 15;
    ctx.fillStyle = colours.edge;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(left + 15, y);
    ctx.lineTo(left + 7.5, y + 26);
    ctx.fill();
    ctx.fillStyle = colours.fill;
    ctx.beginPath();
    ctx.moveTo(left + 2, y);
    ctx.lineTo(left + 13, y);
    ctx.lineTo(left + 7.5, y + 20);
    ctx.fill();
  }
}

function drawCrusher(ctx, h, x, clock) {
  const shake = h.state === "shake" ? Math.sin(clock * 70) * 3 : 0;
  const left = x + shake;
  // Warning shadow on the floor while it's getting ready.
  if (h.state === "shake" || h.state === "slam") {
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.fillRect(x - 4, h.floor - 8, h.w + 8, 8);
  }
  ctx.fillStyle = "#55556a";
  ctx.fillRect(left + h.w / 2 - 8, 0, 16, h.y);
  ctx.fillStyle = "#7a7a90";
  ctx.fillRect(left + h.w / 2 - 4, 0, 4, h.y);
  ctx.fillStyle = "#3a3a4c";
  ctx.fillRect(left, h.y, h.w, h.h);
  ctx.fillStyle = "#8a8aa4";
  ctx.fillRect(left + 4, h.y + 4, h.w - 8, h.h - 18);
  ctx.fillStyle = h.state === "shake" ? "#ff2e88" : "#ffd400";
  ctx.fillRect(left + 10, h.y + 14, h.w - 20, 8);
  // Teeth along the bottom.
  ctx.fillStyle = "#d8d8e8";
  for (let i = 0; i < 5; i += 1) {
    const tx = left + 4 + i * ((h.w - 8) / 5);
    ctx.beginPath();
    ctx.moveTo(tx, h.y + h.h - 14);
    ctx.lineTo(tx + (h.w - 8) / 5, h.y + h.h - 14);
    ctx.lineTo(tx + (h.w - 8) / 10, h.y + h.h);
    ctx.fill();
  }
}

const rockColours = {
  earth: { dark: "#3a3a2a", light: "#7a7a5a" },
  jupiter: { dark: "#3a4458", light: "#9aa8bc" },
  mars: { dark: "#4a3428", light: "#8a6a58" },
  mercury: { dark: "#2a2220", light: "#6a5a50" },
  neptune: { dark: "#2a3a80", light: "#9cb8ff" },
  saturn: { dark: "#5a8aa8", light: "#dff6ff" },
  uranus: { dark: "#3a8a9a", light: "#e8ffff" },
  venus: { dark: "#2a2018", light: "#6a5a48" },
};

// Geyser colours: lava, acid or freezing vapour.
const geyserColours = {
  neptune: ["rgba(90, 140, 255, 0.85)", "#9cc8ff", "#e8f4ff", "#c8e0ff"],
  venus: ["rgba(120, 200, 0, 0.85)", "#c8e040", "#f4ffb0", "#e0ff60"],
};
const lavaGeyser = ["rgba(255, 90, 0, 0.85)", "#ffb000", "#fff2a0", "#ffd23f"];

function drawRock(ctx, h, x, clock, palette) {
  const colours = rockColours[palette];
  if (h.state === "broken") return;
  const wobble = h.state === "wobble" ? Math.sin(clock * 60) * 3 : 0;
  const size = h.grow;
  const cx = x + h.w / 2 + wobble;
  ctx.fillStyle = colours.dark;
  ctx.beginPath();
  ctx.moveTo(cx - (h.w / 2) * size, h.y);
  ctx.lineTo(cx + (h.w / 2) * size, h.y);
  ctx.lineTo(cx, h.y + h.h * size);
  ctx.fill();
  ctx.fillStyle = colours.light;
  ctx.beginPath();
  ctx.moveTo(cx - (h.w / 2 - 6) * size, h.y);
  ctx.lineTo(cx + 2 * size, h.y);
  ctx.lineTo(cx - 2 * size, h.y + (h.h - 12) * size);
  ctx.fill();
}

function drawGeyser(ctx, h, x, clock, palette) {
  const [outer, middle, core, bubble] = geyserColours[palette] ?? lavaGeyser;
  if (h.state === "bubble") {
    ctx.fillStyle = bubble;
    for (let i = 0; i < 4; i += 1) {
      const bob = Math.abs(Math.sin(clock * 9 + i * 1.7)) * 26;
      ctx.fillRect(x + 4 + i * 9, h.bottom - 10 - bob, 6, 6);
    }
  }
  if (h.h < 4) return;
  const wave = Math.sin(clock * 30) * 3;
  ctx.fillStyle = outer;
  ctx.fillRect(x - 4 + wave, h.y, h.w + 8, h.h);
  ctx.fillStyle = middle;
  ctx.fillRect(x + 6 - wave, h.y + 10, h.w - 12, h.h - 10);
  ctx.fillStyle = core;
  ctx.fillRect(x + 15, h.y + 24, h.w - 30, h.h - 24);
}

function drawBeam(ctx, h, x, clock) {
  const upright = h.kind === "laser";
  const on = h.state === "on";
  const warn = h.state === "warn" && Math.floor(clock * 16) % 2 === 0;
  ctx.fillStyle = "#3a3a4c";
  if (upright) {
    ctx.fillRect(x - 9, h.y, h.w + 18, 16);
    ctx.fillRect(x - 9, h.y + h.h - 10, h.w + 18, 10);
  } else {
    ctx.fillRect(x - 14, h.y - 8, 16, h.h + 16);
    ctx.fillRect(x + h.w - 2, h.y - 8, 16, h.h + 16);
  }
  if (!on && !warn) return;
  const glow = on ? 1 : 0.35;
  ctx.globalAlpha = glow * (0.85 + Math.sin(clock * 40) * 0.15);
  ctx.fillStyle = "#ff2e88";
  if (upright) ctx.fillRect(x, h.y + 16, h.w, h.h - 26);
  else ctx.fillRect(x + 2, h.y, h.w - 4, h.h);
  ctx.fillStyle = "#ffd0ea";
  if (upright) ctx.fillRect(x + 3, h.y + 16, h.w - 6, h.h - 26);
  else ctx.fillRect(x + 2, h.y + 3, h.w - 4, h.h - 6);
  ctx.globalAlpha = 1;
}

const painters = {
  beam: drawBeam,
  crusher: drawCrusher,
  geyser: drawGeyser,
  laser: drawBeam,
  rock: drawRock,
};

export function drawHazards(ctx, round, clock) {
  round.hazards.forEach((h) => {
    const x = Math.round(h.x - round.camera);
    if (x < -200 || x > 1160) return;
    painters[h.kind](ctx, h, x, clock, round.stage.id);
  });
}

function drawTank(ctx, item, x, clock) {
  const y = item.y + Math.sin(clock * 3) * 4;
  ctx.fillStyle = "#2a5db0";
  ctx.fillRect(x, y + 6, item.w, item.h - 6);
  ctx.fillStyle = "#9cf0ff";
  ctx.fillRect(x + 4, y + 10, 6, item.h - 14);
  ctx.fillStyle = "#c0c0d0";
  ctx.fillRect(x + 6, y, item.w - 12, 8);
  ctx.fillStyle = "#ffffff";
  ctx.font = '10px "Press Start 2P", monospace';
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("O2", x + item.w / 2 + 2, y + 16);
}

function drawFlag(ctx, item, x, clock) {
  ctx.fillStyle = "#c0c0d0";
  ctx.fillRect(x, item.y, 6, item.h);
  const colour = item.taken ? "#39ff14" : "#00e5ff";
  const ripple = Math.sin(clock * 6) * 3;
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.moveTo(x + 6, item.y + 4);
  ctx.lineTo(x + 40, item.y + 18 + ripple);
  ctx.lineTo(x + 6, item.y + 32);
  ctx.fill();
}

// A power-up: a glowing bubble with a letter. It blinks before it vanishes.
function drawDrop(ctx, drop, x, clock) {
  if (drop.life < 3 && Math.floor(clock * 8) % 2 === 0) return;
  const { colour } = powerInfo[drop.kind];
  const cx = x + drop.w / 2;
  const cy = drop.y + drop.h / 2 + Math.sin(clock * 4 + drop.x) * 3;
  const glow = ctx.createRadialGradient(cx, cy, 4, cx, cy, 26);
  glow.addColorStop(0, colour);
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = glow;
  ctx.fillRect(cx - 26, cy - 26, 52, 52);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#0a0a1f";
  ctx.beginPath();
  ctx.arc(cx, cy, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = colour;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = colour;
  ctx.font = '12px "Press Start 2P", monospace';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(powerLetters[drop.kind], cx + 1, cy + 1);
}

export const powerLetters = {
  blaster: "B", boots: "J", heart: "+", o2: "O", quake: "Q", shield: "S", speed: "F", star: "*",
};

export function drawItems(ctx, round, clock) {
  round.items.forEach((item) => {
    const x = Math.round(item.x - round.camera);
    if (x < -100 || x > 1060) return;
    if (item.kind === "flag") drawFlag(ctx, item, x, clock);
    if (item.kind === "tank" && !item.taken) drawTank(ctx, item, x, clock);
  });
  round.drops.forEach((drop) => {
    drawDrop(ctx, drop, Math.round(drop.x - round.camera), clock);
  });
}

// Little pips over an alien that takes more than one smash.
export function drawHealth(ctx, enemy) {
  const total = enemy.def.hp;
  for (let i = 0; i < total; i += 1) {
    ctx.fillStyle = i < enemy.hp ? "#ff2e88" : "#3a2a44";
    ctx.fillRect(i * 14 - (total * 14) / 2 + 2, -enemy.h - 18, 10, 8);
  }
}
