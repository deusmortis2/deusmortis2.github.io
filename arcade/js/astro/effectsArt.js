// Draws alien shots, ground patches, boss strikes and the astronaut's own
// bolts and quake waves. Pure output: reads game state, never changes it.

function blob(ctx, cx, cy, r, fill, shine) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  if (!shine) return;
  ctx.fillStyle = shine;
  ctx.fillRect(cx - r / 2, cy - r / 2, Math.max(3, r / 3), Math.max(3, r / 3));
}

function glowAt(ctx, cx, cy, r, rgb, strength = 0.9) {
  const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
  glow.addColorStop(0, `rgba(${rgb}, ${strength})`);
  glow.addColorStop(1, `rgba(${rgb}, 0)`);
  ctx.fillStyle = glow;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
}

// A ridge of rock bursting up out of the ground, in a given pair of colours.
function ridge(ctx, s, x, colours, base) {
  const fade = Math.max(0.3, 1 - s.age / s.def.life);
  const floor = s.y + s.h;
  ctx.globalAlpha = fade;
  [[0, 0.55], [8, 1], [18, 0.75], [26, 0.4]].forEach(([dx, tall], i) => {
    const jag = Math.abs(Math.sin(s.age * 30 + i)) * 4;
    ctx.fillStyle = colours[i % 2];
    ctx.beginPath();
    ctx.moveTo(x + dx - 6, floor);
    ctx.lineTo(x + dx + 2, floor - s.h * tall - jag);
    ctx.lineTo(x + dx + 10, floor);
    ctx.fill();
  });
  ctx.fillStyle = base;
  ctx.fillRect(x - 4, floor - 4, s.w + 8, 4);
  ctx.globalAlpha = 1;
}

function spinner(ctx, s, x, points, colour, core) {
  const r = s.w / 2 + 3;
  ctx.save();
  ctx.translate(x + s.w / 2, s.y + s.h / 2);
  ctx.rotate(s.age * 14);
  ctx.fillStyle = colour;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i += 1) {
    const reach = i % 2 ? r * 0.4 : r;
    const angle = (i * Math.PI) / points;
    ctx.lineTo(Math.cos(angle) * reach, Math.sin(angle) * reach);
  }
  ctx.fill();
  ctx.fillStyle = core;
  ctx.fillRect(-3, -3, 6, 6);
  ctx.restore();
}

const shotPainters = {
  acid: (ctx, s, x) => blob(ctx, x + 7, s.y + 9, 7, "#7aff3a", "#e0ffc0"),
  bomb: (ctx, s, x) => spinner(ctx, s, x, 6, "#bfefff", "#ffffff"),
  boulder: (ctx, s, x) => blob(ctx, x + 17, s.y + 17, 17, "#7a4a30", "#b07a58"),
  canister: (ctx, s, x) => {
    ctx.fillStyle = "#6a7a30";
    ctx.fillRect(x, s.y + 4, s.w, s.h - 4);
    ctx.fillStyle = "#c8d040";
    ctx.fillRect(x + 3, s.y, s.w - 6, 5);
    ctx.fillRect(x + 4, s.y + 10, s.w - 8, 4);
  },
  fireball: (ctx, s, x) => {
    glowAt(ctx, x + 11, s.y + 11, 22, "255, 140, 0");
    blob(ctx, x + 11, s.y + 11, 9, "#ffd23f", "#fff8c0");
  },
  frost: (ctx, s, x) => {
    ctx.globalAlpha = Math.max(0.2, 1 - s.age / s.def.life);
    glowAt(ctx, x + 13, s.y + 13, 20, "200, 245, 255");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x + 9, s.y + 9, 8, 8);
    ctx.globalAlpha = 1;
  },
  glob: (ctx, s, x) => blob(ctx, x + 12, s.y + 12, 11, "#9cff3a", "#e8ffb0"),
  icicle: (ctx, s, x) => {
    ctx.fillStyle = "#bff6ff";
    ctx.beginPath();
    ctx.moveTo(x, s.y);
    ctx.lineTo(x + s.w, s.y);
    ctx.lineTo(x + s.w / 2, s.y + s.h);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x + 3, s.y + 2, 3, s.h / 2);
  },
  laser: (ctx, s, x) => {
    glowAt(ctx, x + s.w / 2, s.y + 4, 34, "74, 224, 255", 0.6);
    ctx.fillStyle = "#4ae0ff";
    ctx.fillRect(x, s.y, s.w, s.h);
    ctx.fillStyle = "#e8ffff";
    ctx.fillRect(x, s.y + 2, s.w, 4);
  },
  lavarock: (ctx, s, x) => {
    glowAt(ctx, x + 15, s.y + 15, 26, "255, 90, 0", 0.6);
    blob(ctx, x + 15, s.y + 15, 14, "#3a2a24", "#ff7a1a");
  },
  mindwave: (ctx, s, x) => {
    ctx.globalAlpha = 0.5 + Math.sin(s.age * 20) * 0.2;
    ctx.fillStyle = "#c878ff";
    ctx.fillRect(x, s.y, s.w, s.h);
    ctx.fillStyle = "#f4d8ff";
    ctx.fillRect(x + 8, s.y + 6, s.w - 16, s.h - 6);
    ctx.globalAlpha = 1;
  },
  orb: (ctx, s, x) => {
    glowAt(ctx, x + 10, s.y + 10, 22, "200, 120, 255");
    ctx.fillStyle = "#f4d8ff";
    ctx.fillRect(x + 5, s.y + 5, 10, 10);
  },
  ring: (ctx, s, x) => {
    const cx = x + s.w / 2;
    const cy = s.y + s.h / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.lineWidth = 7;
    ctx.strokeStyle = "#c8b890";
    ctx.beginPath();
    ctx.ellipse(0, 0, s.w / 2, s.h / 2, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#fff4d0";
    ctx.beginPath();
    ctx.ellipse(0, 0, s.w / 2 - 6, s.h / 2 - 5, 0, s.age * 9, s.age * 9 + 2);
    ctx.stroke();
    ctx.restore();
  },
  seed: (ctx, s, x) => blob(ctx, x + 8, s.y + 8, 8, "#6a4a20", "#c8a050"),
  shard: (ctx, s, x) => spinner(ctx, s, x, 4, "#bfefff", "#4a8aa8"),
  spark: (ctx, s, x) => ridge(ctx, s, x, ["#fff4a0", "#9cf0ff"], "#ffffff"),
  stinger: (ctx, s, x) => {
    ctx.fillStyle = "#2a2a2a";
    ctx.fillRect(x, s.y + 3, s.w, 6);
    ctx.fillStyle = "#ffd400";
    ctx.fillRect(x + 3, s.y + 4, 6, 4);
  },
  wave: (ctx, s, x) => ridge(ctx, s, x, ["#d8c8b0", "#b89a78"], "#ffd400"),
};

export function drawShots(ctx, round) {
  round.shots.forEach((s) => {
    shotPainters[s.kind](ctx, s, Math.round(s.x - round.camera));
  });
}

const patchColours = {
  acid: ["#5ad000", "#c8ff60"],
  fire: ["#ff5a00", "#ffd23f"],
  ice: ["#bff6ff", "#ffffff"],
  slime: ["#a8b820", "#e0f060"],
  spark: ["#9cf0ff", "#ffffff"],
};

// Slime from the user's drawing: a goo cap whose drips run down over the
// edge of the ground. Drawn a little wider than the patch that slows you.
const slimeWidth = 64;
const slimeEdge = 0.45;

function drawSlime(ctx, p, x, slime, fade) {
  const h = Math.round((slime.height * slimeWidth) / slime.width);
  const left = Math.round(x + p.w / 2 - slimeWidth / 2);
  const top = Math.round(p.y + p.h - h * slimeEdge);
  ctx.globalAlpha = fade;
  ctx.drawImage(slime, left, top, slimeWidth, h);
  ctx.globalAlpha = 1;
}

export function drawPatches(ctx, round, clock, slime) {
  round.patches.forEach((p) => {
    const x = Math.round(p.x - round.camera);
    const fade = Math.min(1, p.life / 0.6);
    if (p.kind === "slime" && slime) {
      drawSlime(ctx, p, x, slime, fade);
      return;
    }
    ctx.globalAlpha = fade * 0.85;
    if (p.kind === "poison") {
      for (let i = 0; i < 6; i += 1) {
        const bx = x + 20 + ((i * 37) % (p.w - 40)) + Math.sin(clock * 1.5 + i) * 8;
        const by = p.y + 30 + ((i * 53) % (p.h - 50)) + Math.cos(clock * 1.2 + i) * 6;
        glowAt(ctx, bx, by, 38, "150, 200, 40", 0.45 * fade);
      }
      ctx.globalAlpha = 1;
      return;
    }
    const [base, top] = patchColours[p.kind];
    if (p.kind === "spark") {
      glowAt(ctx, x + p.w / 2, p.y + p.h / 2, 22, "156, 240, 255", fade);
      ctx.fillStyle = top;
      const jx = Math.sin(clock * 40 + p.x) * 6;
      ctx.fillRect(x + p.w / 2 + jx - 2, p.y + 4, 4, p.h - 8);
      ctx.globalAlpha = 1;
      return;
    }
    const flicker = p.kind === "fire" ? Math.abs(Math.sin(clock * 12 + p.x)) * 8 : 0;
    ctx.fillStyle = base;
    ctx.fillRect(x, p.y + p.h - 8, p.w, 8);
    ctx.fillStyle = top;
    if (p.kind === "fire") {
      for (let i = 0; i < 4; i += 1) {
        const tall = 8 + ((i * 7) % 12) + flicker;
        ctx.fillRect(x + 4 + i * 10, p.y + p.h - 8 - tall, 6, tall);
      }
    } else {
      ctx.fillRect(x + 4, p.y + p.h - 8, p.w - 8, 3);
    }
    ctx.globalAlpha = 1;
  });
}

function drawWarning(ctx, s, x, clock) {
  const on = Math.floor(clock * 10) % 2 === 0;
  ctx.globalAlpha = on ? 0.7 : 0.35;
  ctx.fillStyle = s.kind === "beam" ? "#4affd8" : "#ff2e88";
  if (s.kind === "beam") {
    ctx.fillRect(x, s.y + s.h / 2 - 2, s.w, 4);
  } else {
    // A flashing mark on the floor where it will hit.
    const floor = s.y + s.h;
    ctx.fillRect(x, floor - 6, s.w, 6);
    ctx.fillRect(x + s.w / 2 - 3, floor - 30, 6, 18);
  }
  ctx.globalAlpha = 1;
}

const strikePainters = {
  beam: (ctx, s, x, clock) => {
    ctx.globalAlpha = 0.85 + Math.sin(clock * 40) * 0.15;
    ctx.fillStyle = "#4affd8";
    ctx.fillRect(x, s.y, s.w, s.h);
    ctx.fillStyle = "#e8fff8";
    ctx.fillRect(x, s.y + 10, s.w, s.h - 20);
    ctx.globalAlpha = 1;
  },
  bolt: (ctx, s, x, clock) => {
    const cx = x + s.w / 2;
    ctx.strokeStyle = "#e8f8ff";
    ctx.lineWidth = 8;
    ctx.beginPath();
    for (let y = 0; y <= s.h; y += 30) {
      ctx.lineTo(cx + Math.sin(clock * 50 + y) * 14, y);
    }
    ctx.stroke();
    glowAt(ctx, cx, s.y + s.h - 10, 50, "156, 240, 255", 0.8);
  },
  spike: (ctx, s, x) => {
    ctx.fillStyle = "#7ad8f0";
    ctx.beginPath();
    ctx.moveTo(x, s.y + s.h);
    ctx.lineTo(x + s.w / 2, s.y);
    ctx.lineTo(x + s.w, s.y + s.h);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x + s.w / 2 - 2, s.y + 12, 4, s.h - 20);
  },
  vine: (ctx, s, x, clock) => {
    ctx.fillStyle = "#2a6a1a";
    const sway = Math.sin(clock * 8 + s.x) * 4;
    ctx.fillRect(x + s.w / 2 - 7 + sway, s.y + 10, 14, s.h - 10);
    ctx.fillStyle = "#8ac850";
    for (let y = s.y + 14; y < s.y + s.h - 6; y += 22) {
      ctx.fillRect(x + sway, y, 10, 5);
      ctx.fillRect(x + s.w - 10 + sway, y + 11, 10, 5);
    }
    ctx.fillStyle = "#c83a2a";
    ctx.fillRect(x + s.w / 2 - 6 + sway, s.y, 12, 12);
  },
};

export function drawStrikes(ctx, round, clock) {
  round.strikes.forEach((s) => {
    const x = Math.round(s.x - round.camera);
    if (!s.fired) {
      drawWarning(ctx, s, x, clock);
      return;
    }
    strikePainters[s.kind]?.(ctx, s, x, clock);
  });
}

export function drawBolts(ctx, round, clock) {
  round.bolts.forEach((b) => {
    const x = Math.round(b.x - round.camera);
    if (b.kind === "quake") {
      ridge(ctx, { ...b, def: { life: b.life } }, x, ["#ffd400", "#ff8a3a"], "#ffffff");
      return;
    }
    glowAt(ctx, x + b.w / 2, b.y + b.h / 2, 20, "255, 46, 136", 0.7 + Math.sin(clock * 40) * 0.2);
    ctx.fillStyle = "#ffd0ea";
    ctx.fillRect(x, b.y + 2, b.w, b.h - 4);
  });
}
