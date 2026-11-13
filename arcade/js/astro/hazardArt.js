// Draws hazards, alien shots, roof spikes, oxygen tanks and checkpoint flags.
// Pure output: reads game state, never changes it.
const spikeColours = {
  mars: { edge: "#4f1d10", fill: "#c88a60" },
  saturn: { edge: "#2a4a66", fill: "#bfefff" },
  venus: { edge: "#1c1712", fill: "#8a7a60" },
};

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
  mars: { dark: "#4a3428", light: "#8a6a58" },
  saturn: { dark: "#5a8aa8", light: "#dff6ff" },
  venus: { dark: "#2a2018", light: "#6a5a48" },
};

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

function drawGeyser(ctx, h, x, clock) {
  if (h.state === "bubble") {
    ctx.fillStyle = "#ffd23f";
    for (let i = 0; i < 4; i += 1) {
      const bob = Math.abs(Math.sin(clock * 9 + i * 1.7)) * 26;
      ctx.fillRect(x + 4 + i * 9, h.bottom - 10 - bob, 6, 6);
    }
  }
  if (h.h < 4) return;
  const wave = Math.sin(clock * 30) * 3;
  ctx.fillStyle = "rgba(255, 90, 0, 0.85)";
  ctx.fillRect(x - 4 + wave, h.y, h.w + 8, h.h);
  ctx.fillStyle = "#ffb000";
  ctx.fillRect(x + 6 - wave, h.y + 10, h.w - 12, h.h - 10);
  ctx.fillStyle = "#fff2a0";
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
    painters[h.kind](ctx, h, x, clock, round.stage.palette);
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

export function drawItems(ctx, round, clock) {
  round.items.forEach((item) => {
    const x = Math.round(item.x - round.camera);
    if (x < -100 || x > 1060) return;
    if (item.kind === "flag") drawFlag(ctx, item, x, clock);
    if (item.kind === "tank" && !item.taken) drawTank(ctx, item, x, clock);
  });
}

const shotPainters = {
  acid: (ctx, s, x) => {
    ctx.fillStyle = "#7aff3a";
    ctx.fillRect(x + 2, s.y, s.w - 4, s.h);
    ctx.fillRect(x, s.y + 4, s.w, s.h - 6);
    ctx.fillStyle = "#e0ffc0";
    ctx.fillRect(x + 3, s.y + 3, 4, 4);
  },
  // A four-pointed throwing star, spinning.
  disc: (ctx, s, x) => {
    const r = s.w / 2 + 3;
    ctx.save();
    ctx.translate(x + s.w / 2, s.y + s.h / 2);
    ctx.rotate(s.age * 22);
    ctx.fillStyle = "#e8e8f8";
    ctx.beginPath();
    for (let i = 0; i < 8; i += 1) {
      const reach = i % 2 ? 5 : r;
      const angle = (i * Math.PI) / 4;
      ctx.lineTo(Math.cos(angle) * reach, Math.sin(angle) * reach);
    }
    ctx.fill();
    ctx.fillStyle = "#00e5ff";
    ctx.fillRect(-3, -3, 6, 6);
    ctx.restore();
  },
  orb: (ctx, s, x) => {
    const cx = x + s.w / 2;
    const cy = s.y + s.h / 2;
    const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, 22);
    glow.addColorStop(0, "rgba(200, 120, 255, 0.9)");
    glow.addColorStop(1, "rgba(200, 120, 255, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(cx - 22, cy - 22, 44, 44);
    ctx.fillStyle = "#f4d8ff";
    ctx.fillRect(cx - 5, cy - 5, 10, 10);
  },
  // A ridge of rock and dust bursting up out of the ground.
  wave: (ctx, s, x) => {
    const fade = Math.max(0.3, 1 - s.age / 1.25);
    const floor = s.y + s.h;
    ctx.globalAlpha = fade;
    [[0, 0.55], [8, 1], [18, 0.75], [26, 0.4]].forEach(([dx, tall], i) => {
      const jag = Math.abs(Math.sin(s.age * 30 + i)) * 4;
      ctx.fillStyle = i % 2 ? "#b89a78" : "#d8c8b0";
      ctx.beginPath();
      ctx.moveTo(x + dx - 6, floor);
      ctx.lineTo(x + dx + 2, floor - s.h * tall - jag);
      ctx.lineTo(x + dx + 10, floor);
      ctx.fill();
    });
    ctx.fillStyle = "#ffd400";
    ctx.fillRect(x - 4, floor - 4, s.w + 8, 4);
    ctx.globalAlpha = 1;
  },
};

export function drawShots(ctx, round) {
  round.shots.forEach((s) => {
    shotPainters[s.kind](ctx, s, Math.round(s.x - round.camera));
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
