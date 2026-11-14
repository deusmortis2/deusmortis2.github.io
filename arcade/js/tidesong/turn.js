// Turns the player around as if they had depth, rather than squashing a
// flat picture through zero width. The picture is painted once into a
// buffer, then redrawn in thin upright strips: each strip is placed where
// it would sit on a body rotating about its own upright axis, and drawn a
// little larger or smaller with distance, so one side swings towards the
// viewer while the other swings away.
import { makeCanvas } from "./util.js";

// Side of the square buffer, in canvas pixels. Large enough for the
// longest picture (a tipped swimmer) at any angle.
const size = 192;

// The buffer is painted at this multiple so the strips stay crisp.
const detail = 2;

// Number of upright strips the turning picture is cut into.
const strips = 48;

// Distance from the viewer to the turning axis, in canvas pixels. Smaller
// gives stronger perspective.
const distance = 240;

// Spring that drives the turn. It starts slowly, swings through the middle
// and settles without overshooting, and it copes with a change of mind
// halfway round.
const stiffness = 170;
const damping = 2 * Math.sqrt(stiffness);

// Depth of the body as a share of its width, seen side-on.
const thickness = 0.32;

// How far either side of side-on (in cosine) the two faces blend.
const overlap = 0.3;

let buffer = null;

// Moves `turn` ({ angle, speed }) towards facing right (angle 0) or left
// (angle pi). Call once per frame.
export function steerTurn(turn, facing, dt) {
  const target = facing < 0 ? Math.PI : 0;
  const step = Math.min(dt, 1 / 30);
  const pull = stiffness * (target - turn.angle) - damping * turn.speed;
  turn.speed += pull * step;
  turn.angle += turn.speed * step;
  if (Math.abs(target - turn.angle) < 0.002 && Math.abs(turn.speed) < 0.05) {
    turn.angle = target;
    turn.speed = 0;
  }
}

// Calls `paint(ctx)` to draw a right-facing picture centred on (0, 0),
// turned by `angle` (0 faces right, pi faces left).
export function drawTurned(ctx, angle, paint) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  // Settled: draw straight to the screen, mirrored when facing left.
  if (Math.abs(s) < 0.01) {
    ctx.save();
    ctx.scale(c < 0 ? -1 : 1, 1);
    paint(ctx);
    ctx.restore();
    return;
  }
  if (!buffer) buffer = makeCanvas(size * detail, size * detail);
  const b = buffer.getContext("2d");
  b.setTransform(1, 0, 0, 1, 0, 0);
  b.clearRect(0, 0, buffer.width, buffer.height);
  b.setTransform(detail, 0, 0, detail, (size * detail) / 2, (size * detail) / 2);
  paint(b);
  ctx.save();
  // The body swells a touch and dims slightly as it turns side-on, which
  // reads as it rolling through the water rather than folding flat.
  const swell = 1 + 0.06 * s;
  ctx.scale(swell, swell);
  if ("filter" in ctx) ctx.filter = `brightness(${(1 - 0.18 * s).toFixed(3)})`;
  // A body has depth, so it never thins to a sliver: seen side-on it is
  // still `thickness` of its width across.
  const width = Math.hypot(c, thickness * s);
  // Through the middle of the turn the near side fades into the far side
  // (the picture mirrored), so there is no single frame where it flips.
  const blend = Math.min(1, Math.max(0, (c / overlap + 1) / 2));
  const fade = blend * blend * (3 - 2 * blend);
  const base = ctx.globalAlpha;
  if (fade < 1) drawStrips(ctx, s, width, -1, base * (1 - fade));
  if (fade > 0) drawStrips(ctx, s, width, 1, base * fade);
  ctx.restore();
}

// Draws the buffered picture as perspective strips, mirrored when `mirror`
// is -1.
function drawStrips(ctx, s, width, mirror, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.scale(mirror, 1);
  const strip = size / strips;
  for (let i = 0; i < strips; i += 1) {
    const u0 = -size / 2 + i * strip;
    const u1 = u0 + strip;
    // A strip keeps its depth when mirrored: the side that swung away
    // stays away, now on the other side of the axis.
    const p0 = distance / (distance + u0 * s);
    const p1 = distance / (distance + u1 * s);
    const x0 = u0 * width * p0;
    const x1 = u1 * width * p1;
    const h = (size * (p0 + p1)) / 2;
    // Each strip overlaps the next by a fraction of a pixel so no seams show.
    ctx.drawImage(
      buffer,
      i * strip * detail, 0, strip * detail, size * detail,
      x0, -h / 2, Math.max(0, x1 - x0) + 0.6, h,
    );
  }
  ctx.restore();
}
