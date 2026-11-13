// Drawing for monsters, their shots and small hit effects. Pure output:
// reads game state, never changes it.
import { height, width } from "./entities.js";
import { kinds } from "./monsters.js";
import { beamFiring } from "./shots.js";

export function glow(ctx, x, y, r, inner, outer) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

function drawRotated(ctx, sprite, x, y, angle) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.rotate(angle);
  ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
  ctx.restore();
}

export function drawMonsterShadows(ctx, sprites, monsters, style) {
  ctx.globalAlpha = style.alpha * 0.8;
  monsters.forEach((m) => {
    if (!m.alive || (m.alpha ?? 1) < 0.5) return;
    const s = sprites.monsterShadows[m.kind];
    ctx.drawImage(s, Math.round(m.x + style.dx - s.width / 2), Math.round(m.y + style.dy - s.height / 2));
  });
  ctx.globalAlpha = 1;
}

// A blinking "!" at the edge of the screen where a griffin is about to dive.
function drawWarning(ctx, m, t) {
  if (Math.floor(t * 8) % 2 === 0) return;
  const x = Math.min(Math.max(m.x, 18), width - 18);
  ctx.fillStyle = "#ffd400";
  ctx.font = '16px "Press Start 2P", monospace';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("!", x, m.y + 10);
}

function drawAimLine(ctx, m, t) {
  const locked = m.timer <= 0.25;
  ctx.strokeStyle = locked ? "rgba(255, 60, 60, 0.9)" : `rgba(255, 80, 80, ${0.35 + 0.2 * Math.sin(t * 20)})`;
  ctx.lineWidth = locked ? 2 : 1;
  ctx.setLineDash(locked ? [] : [4, 4]);
  ctx.beginPath();
  ctx.moveTo(m.x, m.y);
  ctx.lineTo(m.x + Math.cos(m.aim) * 600, m.y + Math.sin(m.aim) * 600);
  ctx.stroke();
  ctx.setLineDash([]);
}

// Little extras that show what a monster is about to do.
function drawTells(ctx, m, t) {
  ctx.globalCompositeOperation = "lighter";
  if (m.charging) {
    const grow = Math.min(1, 0.4 + (1.6 - m.timer) * 0.6);
    glow(ctx, m.x, m.y + 4, 26 * grow, "rgba(255, 60, 90, 0.6)", "rgba(255, 0, 60, 0)");
  }
  if (m.awake) {
    glow(ctx, m.x - 4, m.y - 12, 6, "rgba(255, 40, 40, 0.9)", "rgba(255, 0, 0, 0)");
    glow(ctx, m.x + 4, m.y - 12, 6, "rgba(255, 40, 40, 0.9)", "rgba(255, 0, 0, 0)");
  }
  if (m.windup) glow(ctx, m.x, m.y - 6, 24, "rgba(255, 150, 40, 0.4)", "rgba(255, 100, 0, 0)");
  ctx.globalCompositeOperation = "source-over";
  if (m.state === "aim") drawAimLine(ctx, m, t);
}

function drawHealth(ctx, m) {
  if (m.maxHp < 2 || m.hp === m.maxHp) return;
  const w = 24;
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(m.x - w / 2 - 1, m.y - 30, w + 2, 5);
  ctx.fillStyle = "#ff4d4d";
  ctx.fillRect(m.x - w / 2, m.y - 29, (w * m.hp) / m.maxHp, 3);
}

function monsterSprite(sprites, m) {
  if (m.flash > 0) return sprites.monstersHit[m.kind];
  if (m.stone) return sprites.monstersStone[m.kind];
  return sprites.monsters[m.kind];
}

// Monsters bob and stretch their wings slightly so the still art feels
// alive. A stone gargoyle holds still. A shot monster greys out, spins and
// fades.
export function drawMonster(ctx, sprites, m, t) {
  if (m.kind === kinds.griffin && m.state === "warn") {
    drawWarning(ctx, m, t);
    return;
  }
  const alpha = m.alive ? (m.alpha ?? 1) : 1;
  if (alpha <= 0) return;
  if (m.alive) drawTells(ctx, m, t);
  const sprite = m.alive ? monsterSprite(sprites, m) : sprites.monstersDead[m.kind];
  const still = m.stone;
  const shake = m.windup || m.state === "wake" ? Math.sin(t * 70) * 2 : 0;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(Math.round(m.x + shake), Math.round(m.y + (still ? 0 : Math.sin(t * 3) * 2)));
  if (m.alive) {
    ctx.rotate(m.tilt);
    if (!still) ctx.scale(1 + Math.sin(t * 5) * 0.05, 1);
  } else {
    ctx.globalAlpha = Math.max(0, 1 - m.fade);
    ctx.rotate(m.fade * 4);
    ctx.scale(1 - m.fade * 0.5, 1 - m.fade * 0.5);
  }
  ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
  ctx.restore();
  if (m.alive) drawHealth(ctx, m);
}

function drawBeam(ctx, s, t) {
  if (!beamFiring(s)) {
    const a = 0.3 + 0.3 * Math.abs(Math.sin(t * 14));
    ctx.strokeStyle = `rgba(255, 70, 100, ${a})`;
    ctx.lineWidth = 1 + (s.age / s.warnSecs) * 2;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x, height);
    ctx.stroke();
    ctx.setLineDash([]);
    return;
  }
  const flicker = 0.85 + 0.15 * Math.sin(t * 50);
  const fadeOut = Math.min(1, (s.warnSecs + s.fireSecs - s.age) * 6);
  const w = s.r * flicker * fadeOut;
  // Solid colours rather than additive light, so it shows on the bright sky.
  ctx.fillStyle = "rgba(200, 0, 60, 0.35)";
  ctx.fillRect(s.x - w - 5, s.y, (w + 5) * 2, height - s.y);
  ctx.fillStyle = "#ff2d6a";
  ctx.fillRect(s.x - w, s.y, w * 2, height - s.y);
  ctx.fillStyle = "#ffd6e2";
  ctx.fillRect(s.x - w / 3, s.y, (w / 3) * 2, height - s.y);
}

function drawArrow(ctx, s) {
  const angle = Math.atan2(s.vy, s.vx);
  const bx = s.x - Math.cos(angle) * 14;
  const by = s.y - Math.sin(angle) * 14;
  ctx.globalCompositeOperation = "lighter";
  glow(ctx, s.x, s.y, 9, "rgba(90, 230, 255, 0.55)", "rgba(0, 180, 255, 0)");
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = "#e8e2cf";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(s.x, s.y);
  ctx.stroke();
  ctx.fillStyle = "#bff6ff";
  ctx.fillRect(Math.round(s.x) - 2, Math.round(s.y) - 2, 4, 4);
}

function drawWisp(ctx, s, t) {
  ctx.globalCompositeOperation = "lighter";
  s.trail.forEach((p, i) => {
    const a = 0.35 * (1 - i / s.trail.length);
    glow(ctx, p.x, p.y, 7 - i * 0.6, `rgba(170, 80, 255, ${a})`, "rgba(120, 0, 255, 0)");
  });
  const pulse = 1 + Math.sin(t * 18) * 0.15;
  glow(ctx, s.x, s.y, 12 * pulse, "rgba(200, 120, 255, 0.8)", "rgba(120, 0, 255, 0)");
  glow(ctx, s.x, s.y, 4, "rgba(255, 240, 255, 1)", "rgba(255, 200, 255, 0)");
  ctx.globalCompositeOperation = "source-over";
}

function drawEmber(ctx, s, t) {
  ctx.globalCompositeOperation = "lighter";
  glow(ctx, s.x, s.y, 11 + Math.sin(t * 30 + s.x) * 1.5, "rgba(255, 110, 30, 0.7)", "rgba(255, 40, 0, 0)");
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#ffe27a";
  ctx.fillRect(Math.round(s.x) - 3, Math.round(s.y) - 3, 6, 6);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(Math.round(s.x) - 1, Math.round(s.y) - 1, 2, 2);
}

// The red band where a wyrm is about to dive.
function drawDiveWarning(ctx, boss, t) {
  const a = 0.15 + 0.15 * Math.abs(Math.sin(t * 12));
  ctx.fillStyle = `rgba(255, 30, 60, ${a})`;
  ctx.fillRect(boss.diveX - 48, boss.y, 96, height - boss.y);
  ctx.strokeStyle = "rgba(255, 60, 90, 0.8)";
  ctx.setLineDash([6, 5]);
  ctx.strokeRect(boss.diveX - 48, boss.y, 96, height - boss.y);
  ctx.setLineDash([]);
}

// Glows that warn which breath attack is coming.
function drawBossTells(ctx, boss, t) {
  const mouthY = boss.y + 30;
  ctx.globalCompositeOperation = "lighter";
  if (boss.state === "ring" && boss.timer < 0.55) {
    glow(ctx, boss.x, mouthY, 20 + boss.timer * 40, "rgba(255, 140, 40, 0.7)", "rgba(255, 60, 0, 0)");
  }
  if (boss.state === "sweep") {
    glow(ctx, boss.x, mouthY, 16 + Math.sin(t * 30) * 3, "rgba(255, 200, 80, 0.6)", "rgba(255, 90, 0, 0)");
  }
  ctx.globalCompositeOperation = "source-over";
}

export function drawBoss(ctx, sprites, boss, frame, t, theme) {
  const art = sprites.boss[boss.spec.look];
  const sprite = (boss.flash > 0 ? art.hit : art.frames)[frame];
  if (boss.alive && boss.charging) drawDiveWarning(ctx, boss, t);
  if (theme === "ground") {
    ctx.globalAlpha = 0.3;
    const s = art.shadows[frame];
    ctx.drawImage(s, Math.round(boss.x - 10 - s.width / 2), Math.round(boss.y + 30 - s.height / 2));
    ctx.globalAlpha = 1;
  }
  ctx.save();
  ctx.translate(Math.round(boss.x), Math.round(boss.y));
  if (!boss.alive) {
    const k = boss.fade / 1.8;
    ctx.globalAlpha = Math.max(0, 1 - k);
    ctx.rotate(k * 1.5);
    ctx.scale(1 - k * 0.4, 1 - k * 0.4);
  }
  ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
  ctx.restore();
  if (boss.alive) drawBossTells(ctx, boss, t);
}

export function drawShots(ctx, sprites, shots, t, beams) {
  shots.forEach((s) => {
    if ((s.type === "beam") !== beams) return;
    if (s.type === "beam") drawBeam(ctx, s, t);
    if (s.type === "axe") drawRotated(ctx, sprites.axe, s.x, s.y, s.age * 14);
    if (s.type === "feather") drawRotated(ctx, sprites.feather, s.x, s.y, Math.atan2(s.vy, s.vx));
    if (s.type === "boulder") drawRotated(ctx, sprites.boulder, s.x, s.y, s.age * 3);
    if (s.type === "shard") drawRotated(ctx, sprites.shard, s.x, s.y, s.spin + s.age * 9);
    if (s.type === "arrow") drawArrow(ctx, s);
    if (s.type === "wisp") drawWisp(ctx, s, t);
    if (s.type === "ember") drawEmber(ctx, s, t);
  });
}

function drawBolt(ctx, e, k) {
  ctx.globalAlpha = 1 - k;
  [["rgba(80, 200, 255, 0.8)", 4], ["#ffffff", 1.5]].forEach(([colour, w]) => {
    ctx.strokeStyle = colour;
    ctx.lineWidth = w;
    ctx.beginPath();
    e.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
}

function drawBoom(ctx, e, k) {
  ctx.globalCompositeOperation = "lighter";
  glow(ctx, e.x, e.y, 10 + k * (e.size ?? 30), `rgba(255, 180, 60, ${0.9 * (1 - k)})`, "rgba(255, 60, 0, 0)");
  ctx.globalCompositeOperation = "source-over";
}

export function drawEffects(ctx, effects) {
  effects.forEach((e) => {
    const k = Math.min(1, Math.max(0, e.age) / (e.life ?? 0.4));
    if (e.age < 0) return;
    if (e.type === "bolt") drawBolt(ctx, e, k);
    if (e.type === "boom") drawBoom(ctx, e, k);
    if (e.type === "ward") {
      ctx.strokeStyle = `rgba(0, 229, 255, ${1 - k})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(e.x, e.y, 20 + k * 50, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (e.type === "dust") {
      ctx.strokeStyle = `rgba(190, 160, 120, ${1 - k})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(e.x, e.y, 6 + k * 22, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (e.type === "clink") {
      ctx.fillStyle = `rgba(255, 255, 220, ${1 - k})`;
      for (let i = 0; i < 6; i += 1) {
        const a = (i / 6) * Math.PI * 2;
        ctx.fillRect(e.x + Math.cos(a) * k * 16 - 1, e.y + Math.sin(a) * k * 16 - 1, 2, 2);
      }
    }
  });
}
