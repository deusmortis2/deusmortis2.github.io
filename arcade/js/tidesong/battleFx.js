// Battle move effects: a small projectile that flies from the attacker to
// its target, then a burst where it lands. Each move has its own look in
// its element's colours, in the same simple style as the song notes.
// battle.js fires an effect with launchFx() and lands the hit after
// fxImpact() milliseconds; battleView.js draws it every frame.

// Where each fighter's body sits on the battle canvas.
const spots = { ally: { x: 235, y: 240 }, wild: { x: 690, y: 150 } };

// Seconds the landing burst plays for.
const burstTime = 0.5;

// Projectiles fly this many times slower than their listed `travel`.
// Lunges keep their own pace.
const flySlowdown = 1.4;

const tau = Math.PI * 2;

// Repeatable "random" number in 0..1, so particles keep their places from
// one frame to the next.
function rand(i, salt = 0) {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

// A point part way from `a` to `b`. It never goes past `b`, so every
// projectile stops on its target.
function lerp(a, b, k) {
  const c = Math.min(1, k);
  return { x: a.x + (b.x - a.x) * c, y: a.y + (b.y - a.y) * c };
}

// A point on a lobbed arc that peaks `height` pixels above the straight line.
function arc(a, b, k, height) {
  const p = lerp(a, b, k);
  return { x: p.x, y: p.y - Math.sin(Math.PI * Math.min(1, k)) * height };
}

// Progress of particle `i` of `n` when each sets off a little after the last.
function staggered(k, i, n, spread = 0.35) {
  return Math.min(1, (k - (i / n) * spread) / (1 - spread));
}

function dot(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.5, r), 0, tau);
  ctx.fill();
}

function ring(ctx, x, y, r, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.5, r), 0, tau);
  ctx.stroke();
}

function star(ctx, x, y, r, points, inner, color, spin = 0) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i += 1) {
    const a = spin + (i / (points * 2)) * tau;
    const d = i % 2 ? r * inner : r;
    ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
  }
  ctx.closePath();
  ctx.fill();
}

// A jagged lightning line. It re-forks every 60ms so it crackles.
function bolt(ctx, from, to, jitter, color, width, t) {
  const seed = Math.floor(t * 16);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  for (let i = 1; i < 7; i += 1) {
    const p = lerp(from, to, i / 7);
    ctx.lineTo(p.x + (rand(i, seed) - 0.5) * jitter * 2, p.y + (rand(i, seed + 9) - 0.5) * jitter * 2);
  }
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
}

// Sparks thrown outwards from `b`, slowing and fading as `s` runs 0 to 1.
function scatter(ctx, b, s, count, reach, draw) {
  ctx.globalAlpha = 1 - s;
  for (let i = 0; i < count; i += 1) {
    const a = rand(i, 3) * tau;
    const d = reach * (0.5 + rand(i, 5) * 0.5) * Math.sqrt(s);
    draw(b.x + Math.cos(a) * d, b.y + Math.sin(a) * d + s * s * 30, i);
  }
  ctx.globalAlpha = 1;
}

function bubbleAt(ctx, x, y, r) {
  ctx.fillStyle = "rgba(160,220,255,0.35)";
  ctx.beginPath();
  ctx.arc(x, y, r, 0, tau);
  ctx.fill();
  ring(ctx, x, y, r, "#dff4ff", 2);
  dot(ctx, x - r * 0.35, y - r * 0.35, r * 0.25, "#ffffff");
}

function snowflake(ctx, x, y, r, spin) {
  ctx.strokeStyle = "#eaf8ff";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 0; i < 3; i += 1) {
    const a = spin + (i / 3) * Math.PI;
    ctx.moveTo(x - Math.cos(a) * r, y - Math.sin(a) * r);
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.stroke();
  dot(ctx, x, y, r * 0.3, "#a8e6ff");
}

// Draws `paint` turned to face along the line from `a` to `b`.
function aimed(ctx, p, a, b, paint) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(Math.atan2(b.y - a.y, b.x - a.x));
  paint();
  ctx.restore();
}

// Each move: `travel` is milliseconds until it lands, `fly` draws it on the
// way (k runs 0 to 1), `burst` draws the landing (s runs 0 to 1). A `lunge`
// move sends the attacker darting in rather than throwing anything.
const effects = {
  bubble: {
    burst(ctx, s, b) {
      scatter(ctx, b, s, 8, 70, (x, y, i) => {
        ring(ctx, x, y, 4 + rand(i, 7) * 6, "#dff4ff", 2);
      });
    },
    fly(ctx, k, a, b) {
      for (let i = 0; i < 6; i += 1) {
        const q = staggered(k, i, 6);
        if (q < 0) continue;
        const p = lerp(a, b, q);
        bubbleAt(ctx, p.x, p.y + Math.sin(q * 12 + i) * 14, 7 + (i % 3) * 3);
      }
    },
    travel: 650,
  },
  coral1: {
    burst(ctx, s, b) {
      ctx.globalAlpha = 1 - s;
      ctx.strokeStyle = "#ffd0e4";
      ctx.lineWidth = 6 * (1 - s) + 1;
      ctx.beginPath();
      ctx.moveTo(b.x - 60, b.y - 50 + s * 20);
      ctx.quadraticCurveTo(b.x, b.y - 10, b.x + 60, b.y + 50 - s * 20);
      ctx.stroke();
      ctx.globalAlpha = 1;
    },
    fly(ctx, k, a, b) {
      // A whip of coral uncurling towards the target.
      const tip = lerp(a, b, k);
      ctx.strokeStyle = "#ff6fa8";
      ctx.lineCap = "round";
      for (let i = 0; i < 12; i += 1) {
        const p0 = lerp(a, tip, i / 12);
        const p1 = lerp(a, tip, (i + 1) / 12);
        const wave = Math.sin(i * 0.9 - k * 10) * 16 * (1 - k * 0.6);
        ctx.lineWidth = 9 - i * 0.6;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y + wave);
        ctx.lineTo(p1.x, p1.y + Math.sin((i + 1) * 0.9 - k * 10) * 16 * (1 - k * 0.6));
        ctx.stroke();
      }
      dot(ctx, tip.x, tip.y, 6, "#ffd0e4");
    },
    travel: 450,
  },
  coral2: {
    burst(ctx, s, b) {
      ring(ctx, b.x, b.y + 30, 20 + s * 80, `rgba(255,111,168,${1 - s})`, 5);
      scatter(ctx, b, s, 10, 90, (x, y, i) => {
        star(ctx, x, y, 6, 3, 0.4, i % 2 ? "#ff6fa8" : "#ffb3cf", i);
      });
    },
    fly(ctx, k, a, b) {
      // Chunks of reef come crashing down onto the target from above.
      for (let i = 0; i < 4; i += 1) {
        const q = staggered(k, i, 4, 0.3);
        if (q < 0) continue;
        const x = b.x + (i - 1.5) * 34;
        const y = b.y - 240 + q * q * 240;
        star(ctx, x, y, 18, 5, 0.45, i % 2 ? "#ff6fa8" : "#ff8fbf", i + q * 3);
        dot(ctx, x, y, 5, "#ffd0e4");
      }
    },
    travel: 600,
  },
  frost1: {
    burst(ctx, s, b) {
      dot(ctx, b.x, b.y, 50 * (1 - s), `rgba(220,245,255,${0.5 * (1 - s)})`);
      scatter(ctx, b, s, 7, 60, (x, y, i) => {
        snowflake(ctx, x, y, 6, i + s * 4);
      });
    },
    fly(ctx, k, a, b, t) {
      for (let i = 0; i < 4; i += 1) {
        const q = staggered(k, i, 4);
        if (q < 0) continue;
        const p = lerp(a, b, q);
        snowflake(ctx, p.x, p.y + Math.sin(q * 9 + i * 2) * 10, 11, t * 8 + i);
      }
    },
    travel: 600,
  },
  frost2: {
    burst(ctx, s, b) {
      scatter(ctx, b, s, 12, 110, (x, y, i) => {
        star(ctx, x, y, 9, 2, 0.3, i % 2 ? "#a8e6ff" : "#ffffff", i * 1.3);
      });
    },
    fly(ctx, k, a, b) {
      // A great wedge of ice rammed point first.
      aimed(ctx, lerp(a, b, k * k), a, b, () => {
        ctx.fillStyle = "rgba(168,230,255,0.85)";
        ctx.beginPath();
        ctx.moveTo(40, 0);
        ctx.lineTo(-24, -28);
        ctx.lineTo(-36, 0);
        ctx.lineTo(-24, 28);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(30, 0);
        ctx.lineTo(-18, -14);
        ctx.stroke();
      });
    },
    travel: 500,
  },
  glow1: {
    burst(ctx, s, b) {
      dot(ctx, b.x, b.y, 30 + s * 60, `rgba(220,255,245,${0.7 * (1 - s)})`);
      star(ctx, b.x, b.y, 70 * (1 - s * 0.5), 4, 0.12, `rgba(255,255,255,${1 - s})`, s);
    },
    fly(ctx, k, a, b, t) {
      for (let i = 0; i < 7; i += 1) {
        const q = staggered(k, i, 7, 0.5);
        if (q < 0) continue;
        const p = lerp(a, b, q);
        const twinkle = 0.6 + Math.sin(t * 30 + i * 2) * 0.4;
        const ang = q * 8 + i;
        star(ctx, p.x + Math.cos(ang) * 22, p.y + Math.sin(ang) * 22, 10 * twinkle, 4, 0.3, i % 2 ? "#7dffd9" : "#ffffff");
      }
    },
    travel: 600,
  },
  glow2: {
    burst(ctx, s, b) {
      ["#ff5b5b", "#ffcf3f", "#7dffd9", "#4db3ff", "#9b7bff"].forEach((c, i) => {
        ring(ctx, b.x, b.y, 20 + s * (60 + i * 14), c, 4 * (1 - s));
      });
    },
    fly(ctx, k, a, b) {
      // A rainbow beam that charges up, then shoots across.
      const reach = Math.max(0, (k - 0.3) / 0.7);
      dot(ctx, a.x, a.y, 10 + Math.min(k, 0.3) * 50, "rgba(255,255,255,0.8)");
      if (!reach) return;
      const tip = lerp(a, b, reach);
      ["#ff5b5b", "#ffcf3f", "#7dffd9", "#4db3ff", "#9b7bff"].forEach((c, i) => {
        ctx.strokeStyle = c;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y + (i - 2) * 5);
        ctx.lineTo(tip.x, tip.y + (i - 2) * 5);
        ctx.stroke();
      });
    },
    travel: 650,
  },
  shade1: {
    burst(ctx, s, b) {
      // Shadowy jaws snapping shut on the target.
      const open = 50 * (1 - Math.min(1, s * 2.5));
      ctx.globalAlpha = 1 - Math.max(0, s - 0.5) * 2;
      [-1, 1].forEach((side) => {
        const y = b.y + side * (open + 8);
        ctx.fillStyle = "#3a2370";
        ctx.beginPath();
        // Top jaw is the upper half of an oval, bottom jaw the lower half.
        ctx.ellipse(b.x, y, 60, 18, 0, side > 0 ? 0 : Math.PI, side > 0 ? Math.PI : tau);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        for (let i = 0; i < 5; i += 1) {
          const x = b.x - 40 + i * 20;
          ctx.beginPath();
          ctx.moveTo(x - 6, y);
          ctx.lineTo(x + 6, y);
          ctx.lineTo(x, y - side * 14);
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1;
    },
    fly(ctx, k, a, b) {
      const p = lerp(a, b, k);
      dot(ctx, p.x, p.y, 22, "rgba(155,123,255,0.35)");
      dot(ctx, p.x, p.y, 13, "#2a1650");
    },
    travel: 450,
  },
  shade2: {
    burst(ctx, s, b) {
      for (let i = 0; i < 3; i += 1) {
        ring(ctx, b.x, b.y, Math.max(1, (1 - s) * 90 - i * 25), `rgba(155,123,255,${1 - s})`, 5);
      }
      dot(ctx, b.x, b.y, 28 * (1 - s), "#1a0d38");
    },
    fly(ctx, k, a, b) {
      for (let i = 0; i < 3; i += 1) {
        const q = staggered(k, i, 3, 0.4);
        if (q < 0) continue;
        const p = lerp(a, b, q);
        ring(ctx, p.x, p.y, 14 + q * 26, "#9b7bff", 5);
        ring(ctx, p.x, p.y, 8 + q * 16, "#2a1650", 4);
      }
    },
    travel: 650,
  },
  storm1: {
    burst(ctx, s, b, t) {
      ctx.globalAlpha = 1 - s;
      for (let i = 0; i < 5; i += 1) {
        const a = (i / 5) * tau + 0.4;
        const end = { x: b.x + Math.cos(a) * 60, y: b.y + Math.sin(a) * 60 };
        bolt(ctx, b, end, 8, "#ffe14d", 3, t + i);
      }
      ctx.globalAlpha = 1;
    },
    fly(ctx, k, a, b, t) {
      for (let i = 0; i < 3; i += 1) {
        const q = staggered(k, i, 3);
        if (q < 0) continue;
        const p = lerp(a, b, q);
        const back = lerp(a, b, Math.max(0, q - 0.12));
        bolt(ctx, back, { x: p.x, y: p.y + (i - 1) * 16 }, 7, "#ffe14d", 4, t + i);
        dot(ctx, p.x, p.y + (i - 1) * 16, 5, "#ffffff");
      }
    },
    travel: 400,
  },
  storm2: {
    burst(ctx, s, b, t) {
      // The coil lands and a thunderbolt drops from the sky.
      if (s < 0.6) {
        bolt(ctx, { x: b.x + 20, y: 0 }, b, 26, "#fff7c2", 10 * (1 - s), t);
        bolt(ctx, { x: b.x + 20, y: 0 }, b, 26, "#ffe14d", 4, t);
      }
      dot(ctx, b.x, b.y, 80 * (1 - s), `rgba(255,240,150,${0.6 * (1 - s)})`);
    },
    fly(ctx, k, a, b, t) {
      // A spring of lightning corkscrewing towards the target.
      ctx.strokeStyle = "#ffe14d";
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i <= 30; i += 1) {
        const q = k - 0.3 + (i / 30) * 0.3;
        if (q < 0) continue;
        const p = lerp(a, b, q);
        ctx.lineTo(p.x + Math.cos(q * 40 + t * 10) * 18, p.y + Math.sin(q * 40 + t * 10) * 18);
      }
      ctx.stroke();
      const head = lerp(a, b, k);
      dot(ctx, head.x, head.y, 8, "#ffffff");
    },
    travel: 600,
  },
  tackle: {
    burst(ctx, s, b) {
      star(ctx, b.x - 30, b.y, 50 * (1 - s * 0.6), 8, 0.45, `rgba(255,236,160,${1 - s})`, s);
      star(ctx, b.x - 30, b.y, 26 * (1 - s * 0.6), 8, 0.45, `rgba(255,255,255,${1 - s})`, s);
    },
    lunge: true,
    travel: 220,
  },
  tailSlap: {
    burst(ctx, s, b) {
      // A sweeping swoosh, with a spray of water.
      ctx.globalAlpha = 1 - s;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 8 * (1 - s) + 2;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 55, -2.4 + s, -0.4 + s);
      ctx.stroke();
      ctx.globalAlpha = 1;
      scatter(ctx, b, s, 8, 70, (x, y) => {
        dot(ctx, x, y, 4, "#bfe6ff");
      });
    },
    lunge: true,
    travel: 240,
  },
  tide1: {
    burst(ctx, s, b) {
      scatter(ctx, { x: b.x, y: b.y + 10 }, s, 12, 80, (x, y, i) => {
        dot(ctx, x, y - (1 - s) * 30, 3 + rand(i, 2) * 4, "#4db3ff");
      });
    },
    fly(ctx, k, a, b) {
      for (let i = 0; i < 5; i += 1) {
        const q = staggered(k, i, 5, 0.3);
        if (q < 0) continue;
        const p = arc(a, b, q, 90 + i * 8);
        const next = arc(a, b, q + 0.02, 90 + i * 8);
        // A teardrop, round end forward.
        aimed(ctx, p, p, next, () => {
          ctx.fillStyle = "#4db3ff";
          ctx.beginPath();
          ctx.arc(0, 0, 7, -Math.PI / 2, Math.PI / 2);
          ctx.lineTo(-16, 0);
          ctx.closePath();
          ctx.fill();
          dot(ctx, 2, -3, 2, "#dff4ff");
        });
      }
    },
    travel: 650,
  },
  tide2: {
    burst(ctx, s, b, t) {
      ctx.globalAlpha = 1 - s;
      for (let i = 0; i < 3; i += 1) {
        ring(ctx, b.x, b.y, 70 * (1 - s) - i * 18, i % 2 ? "#dff4ff" : "#4db3ff", 4);
      }
      ctx.globalAlpha = 1;
      effects.tide2.whirl(ctx, b, 50 * (1 - s), t * 14);
    },
    fly(ctx, k, a, b, t) {
      effects.tide2.whirl(ctx, lerp(a, b, k), 20 + k * 25, t * 10);
    },
    travel: 650,
    whirl(ctx, p, r, spin) {
      // Three curling arms of a whirlpool.
      ctx.lineWidth = 5;
      for (let i = 0; i < 3; i += 1) {
        const a = spin + (i / 3) * tau;
        ctx.strokeStyle = i % 2 ? "#dff4ff" : "#4db3ff";
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, r), a, a + 1.8);
        ctx.stroke();
      }
    },
  },
  trident: {
    burst(ctx, s, b) {
      star(ctx, b.x, b.y, 60 * (1 - s * 0.5), 3, 0.2, `rgba(255,207,63,${1 - s})`, -Math.PI / 2);
      scatter(ctx, b, s, 8, 80, (x, y, i) => {
        star(ctx, x, y, 6, 4, 0.35, i % 2 ? "#ffcf3f" : "#ffffff");
      });
    },
    fly(ctx, k, a, b) {
      // A golden trident thrown point first.
      aimed(ctx, lerp(a, b, k), a, b, () => {
        ctx.strokeStyle = "#ffcf3f";
        ctx.lineCap = "round";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(-50, 0);
        ctx.lineTo(18, 0);
        ctx.moveTo(18, -14);
        ctx.lineTo(18, 14);
        ctx.moveTo(18, 0);
        ctx.lineTo(40, 0);
        ctx.moveTo(18, -14);
        ctx.lineTo(34, -14);
        ctx.moveTo(18, 14);
        ctx.lineTo(34, 14);
        ctx.stroke();
      });
    },
    travel: 500,
  },
  vent1: {
    burst(ctx, s, b) {
      dot(ctx, b.x, b.y, 20 + s * 40, `rgba(255,122,61,${0.7 * (1 - s)})`);
      dot(ctx, b.x, b.y, 12 + s * 20, `rgba(255,225,77,${0.8 * (1 - s)})`);
      scatter(ctx, { x: b.x, y: b.y - s * 40 }, s, 8, 50, (x, y) => {
        dot(ctx, x, y, 3, "#ffcf3f");
      });
    },
    fly(ctx, k, a, b) {
      for (let i = 0; i < 3; i += 1) {
        const q = staggered(k, i, 3);
        if (q < 0) continue;
        // Each fireball leaves a short trail of fading embers.
        for (let j = 4; j >= 0; j -= 1) {
          const p = lerp(a, b, Math.max(0, q - j * 0.03));
          dot(ctx, p.x, p.y + (i - 1) * 14, 10 - j * 1.6, j ? `rgba(255,122,61,${0.6 - j * 0.1})` : "#ffcf3f");
        }
      }
    },
    travel: 550,
  },
  vent2: {
    burst(ctx, s, b) {
      ring(ctx, b.x, b.y, 20 + s * 90, `rgba(255,122,61,${1 - s})`, 8);
      dot(ctx, b.x, b.y, 50 * (1 - s), `rgba(255,200,80,${0.7 * (1 - s)})`);
      scatter(ctx, b, s, 12, 110, (x, y, i) => {
        dot(ctx, x, y, 4 + rand(i, 4) * 4, i % 2 ? "#ff7a3d" : "#c2261b");
      });
    },
    fly(ctx, k, a, b) {
      // Globs of lava lobbed high.
      for (let i = 0; i < 4; i += 1) {
        const q = staggered(k, i, 4, 0.3);
        if (q < 0) continue;
        const p = arc(a, { x: b.x + (i - 1.5) * 24, y: b.y }, q, 150 + i * 20);
        dot(ctx, p.x, p.y, 14, "#ff7a3d");
        dot(ctx, p.x, p.y, 8, "#c2261b");
        dot(ctx, p.x - 3, p.y - 4, 3, "#ffe14d");
      }
    },
    travel: 700,
  },
};

const other = { ally: "wild", wild: "ally" };

// Starts `moveId`'s effect from `from` ("ally" or "wild").
export function launchFx(moveId, from, missed) {
  return { def: effects[moveId] ?? effects.tackle, from, missed, start: performance.now() };
}

// Milliseconds from launch until the effect reaches its target.
export function fxImpact(fx) {
  return fx.def.lunge ? fx.def.travel : fx.def.travel * flySlowdown;
}

// How far `who` has darted towards the other fighter for a lunge move.
export function lungeOffset(scene, who, now) {
  const fx = scene.fx;
  if (!fx || !fx.def.lunge || fx.from !== who) return { x: 0, y: 0 };
  const k = (now - fx.start) / (fx.def.travel * 2);
  if (k < 0 || k > 1) return { x: 0, y: 0 };
  const a = spots[who];
  const b = spots[other[who]];
  const reach = Math.sin(Math.PI * k) * 0.3;
  return { x: (b.x - a.x) * reach, y: (b.y - a.y) * reach };
}

export function drawFx(ctx, scene, now) {
  const fx = scene.fx;
  if (!fx) return;
  const t = (now - fx.start) / 1000;
  const travel = fxImpact(fx) / 1000;
  if (t > travel + burstTime) {
    scene.fx = null;
    return;
  }
  const a = spots[fx.from];
  const target = spots[other[fx.from]];
  // A miss stops just over the target's head and fades there.
  const b = fx.missed ? { x: target.x, y: target.y - 110 } : target;
  ctx.save();
  ctx.textAlign = "center";
  if (t < travel) {
    fx.def.fly?.(ctx, t / travel, a, b, t);
  } else {
    const s = (t - travel) / burstTime;
    if (!fx.missed) {
      fx.def.burst?.(ctx, s, b, t);
    } else if (fx.def.fly) {
      ctx.globalAlpha = 1 - s;
      fx.def.fly(ctx, 1, a, b, t);
    }
  }
  ctx.restore();
}
