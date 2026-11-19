// Drawn effects made from the user's concept sheet (img/astro/fx/):
//   fire1          a thrown fireball in flight
//   splash         the lava splash where a thrown fireball lands
//   fire2, fire3   the fire it leaves: burning, then dying down
//   smolder        the burnt-out bed left after the fire goes out
//   vine1 to 4     the hydra's thorn vines: sprout, growing, rising, full
//   dart           a bee's stinger
// Each image's bottom edge is the ground it stands on.

const splashTime = 0.22;
const dyingTime = 0.6;

function glow(ctx, cx, cy, r, rgb, strength) {
  const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
  g.addColorStop(0, `rgba(${rgb}, ${strength})`);
  g.addColorStop(1, `rgba(${rgb}, 0)`);
  ctx.fillStyle = g;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
}

// Draws an image with its bottom centre at (cx, floor).
function stand(ctx, image, cx, floor, sx = 1, sy = 1) {
  ctx.save();
  ctx.translate(cx, floor);
  ctx.scale(sx, sy);
  ctx.drawImage(image, -image.width / 2, -image.height);
  ctx.restore();
}

// The fireball flies tail first into the wind: the drawing's tail points up
// and left, so it's turned to face the way the shot is going.
export function drawFireball(ctx, s, x, fx) {
  const cx = x + s.w / 2;
  const cy = s.y + s.h / 2;
  glow(ctx, cx, cy, 24, "255, 140, 0", 0.7);
  const image = fx.fire1;
  if (!image) return false;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.atan2(s.vy, s.vx) - Math.PI / 4);
  ctx.drawImage(image, -image.width * 0.62, -image.height * 0.4);
  ctx.restore();
  return true;
}

export function drawDart(ctx, s, x, fx) {
  const image = fx.dart;
  if (!image) return false;
  ctx.save();
  ctx.translate(x + s.w / 2, s.y + s.h / 2);
  ctx.rotate(Math.atan2(s.vy, s.vx));
  // The tip sits on the shot; the speed lines trail behind it.
  ctx.drawImage(image, -image.width + 8, -image.height / 2);
  ctx.restore();
  return true;
}

// Burning ground: a lava splash where a fireball landed, then the fire
// licks along the ground, flickering, and dies down at the end.
export function drawFire(ctx, p, x, clock, fx) {
  if (!fx.fire2) return false;
  const cx = x + p.w / 2;
  const floor = p.y + p.h;
  glow(ctx, cx, floor - 10, 40, "255, 110, 0", 0.35 * Math.min(1, p.life / dyingTime));
  if (p.splashed && p.age < splashTime) {
    const grow = 0.55 + (p.age / splashTime) * 0.45;
    stand(ctx, fx.splash, cx, floor + 2, grow, grow);
    return true;
  }
  if (p.life < dyingTime) {
    ctx.globalAlpha = Math.max(0, p.life / dyingTime);
    stand(ctx, fx.fire3, cx, floor + 1);
    ctx.globalAlpha = 1;
    return true;
  }
  // Mirror back and forth and stretch a little so the flames dance.
  const beat = Math.floor(clock * 9 + p.x * 0.1);
  const flip = beat % 2 === 0 ? 1 : -1;
  const grow = p.age < splashTime * 2 ? 0.6 + (p.age / (splashTime * 2)) * 0.4 : 1;
  const tall = grow * (0.9 + Math.abs(Math.sin(clock * 11 + p.x)) * 0.25);
  stand(ctx, fx.fire2, cx, floor + 1, flip * grow, tall);
  return true;
}

// The smouldering bed after a fire: embers pulse and smoke drifts up.
export function drawEmbers(ctx, p, x, clock, fx) {
  const cx = x + p.w / 2;
  const floor = p.y + p.h;
  const fade = Math.min(1, p.life / 0.5);
  ctx.globalAlpha = fade;
  if (fx.smolder) stand(ctx, fx.smolder, cx, floor + 1);
  for (let i = 0; i < 4; i += 1) {
    const ex = cx - 14 + i * 9;
    const pulse = Math.abs(Math.sin(clock * 6 + i * 1.7 + p.x));
    ctx.fillStyle = pulse > 0.5 ? "#ff7a1a" : "#a8321a";
    ctx.fillRect(ex, floor - 4, 3, 2);
  }
  for (let i = 0; i < 3; i += 1) {
    const rise = (p.age * 0.9 + i / 3) % 1;
    ctx.globalAlpha = fade * (1 - rise) * 0.55;
    ctx.fillStyle = i % 2 ? "#5a5550" : "#7a746c";
    const sx = cx - 8 + i * 8 + Math.sin(clock * 3 + i) * 3;
    const r = 3 + rise * 5;
    ctx.beginPath();
    ctx.arc(sx, floor - 6 - rise * 34, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// While the warning flashes a vine sprouts and grows; when the strike
// lands it shoots up to full height and sways until it sinks back.
export function drawVine(ctx, s, x, clock, fx) {
  if (!fx.vine4) return false;
  const cx = x + s.w / 2;
  const floor = s.y + s.h;
  if (!s.fired) {
    const grown = Math.min(1, s.age / s.warn);
    const image = grown < 0.5 ? fx.vine1 : fx.vine2;
    const size = grown < 0.5 ? 0.6 + grown : 0.5 + (grown - 0.5) * 0.6;
    stand(ctx, image, cx, floor + 2, size, size);
    return true;
  }
  const t = s.age - s.warn;
  const left = s.on - t;
  const sink = left < 0.15 ? Math.max(0.1, left / 0.15) : 1;
  const image = t < 0.12 ? fx.vine3 : fx.vine4;
  const rise = t < 0.12 ? 0.6 + (t / 0.12) * 0.4 : 1;
  ctx.save();
  ctx.translate(cx, floor + 2);
  // Lean the top from side to side; the root stays put.
  ctx.transform(1, 0, Math.sin(clock * 6 + s.x) * 0.08, 1, 0, 0);
  ctx.scale(1, rise * sink);
  ctx.drawImage(image, -image.width / 2, -image.height);
  ctx.restore();
  return true;
}
