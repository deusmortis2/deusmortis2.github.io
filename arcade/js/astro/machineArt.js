// Draws the drawn machines: the smasher hanging from the ceiling, the
// rocket that lands after a boss and blasts off again, and the bar of
// planets on the "get ready" card. Pure output: reads game state, never
// changes it. Sizes come from machineSizes.js, written by the art cutter.
import { glowBetween } from "./looks.js";
import { machineSizes } from "./machineSizes.js";

const smasher = (name) => machineSizes[`smasher/${name}`];

// How far down the ceiling mount sits. The retracted frames hang the head
// box this far below the mount's top.
export const smasherRest = 39;
const mountTop = smasherRest - smasher("green").box;

// The head box drawn by the art, which is also the smasher's hit box.
export const smasherBox = { h: 68, w: 80 };

// The sheet's frames: green retracted while it waits, red retracted while
// it shakes, red stretched as it slams and winds back up, and red impact
// (with flying grit) for a moment after it hits the floor.
function smasherHead(h) {
  if (h.state === "sit" && h.timer > 0.4) return "impact";
  return "head";
}

function drawPiece(ctx, images, name, cx, top, height) {
  const size = smasher(name);
  const image = images[`smasher/${name}`];
  ctx.drawImage(image, Math.round(cx - size.x), Math.round(top), size.w, height ?? size.h);
}

export function drawSmasher(ctx, h, x, clock, images) {
  const shake = h.state === "shake" ? Math.sin(clock * 70) * 3 : 0;
  const cx = x + h.w / 2 + shake;
  // Warning shadow on the floor while it's getting ready.
  if (h.state === "shake" || h.state === "slam") {
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.fillRect(x - 4, h.floor - 8, h.w + 8, 8);
  }
  if (h.state === "idle" || h.state === "shake") {
    const name = h.state === "idle" ? "green" : "red";
    drawPiece(ctx, images, name, cx, h.y - smasher(name).box);
    return;
  }
  const head = smasherHead(h);
  const headTop = h.y - smasher(head).box;
  // The rods stretch from under the mount down into the head's collar.
  const rodsTop = mountTop + smasher("mount").h - 6;
  const rodsLength = headTop - rodsTop + 8;
  if (rodsLength > 0) drawPiece(ctx, images, "rods", cx, rodsTop, rodsLength);
  drawPiece(ctx, images, head, cx, headTop);
  drawPiece(ctx, images, "mount", cx, mountTop);
}

// rocket.png: cell 0 is the hull, cells 1 to 5 are the flames from the
// sheet (approach, pre-landing, launching, ascending, distance). The
// landed frame is the hull on its own.
const flames = { approach: 1, ascending: 4, distance: 5, launching: 3, prelanding: 2 };

function rocketFlame(rocket) {
  if (rocket.lift > 0) {
    if (rocket.lift < 60) return flames.launching;
    return rocket.lift < 320 ? flames.ascending : flames.distance;
  }
  if (rocket.landed) return 0;
  return rocket.drop > 160 ? flames.approach : flames.prelanding;
}

function drawFlame(ctx, image, part, x, y, clock) {
  const { cell, parts } = machineSizes.rocket;
  const size = parts[part];
  const flicker = 1 + Math.sin(clock * 47) * 0.08 + Math.sin(clock * 29) * 0.05;
  const height = size.h * flicker;
  // A soft glow behind the fire.
  glowBetween(ctx, x, y + height * 0.3, height * 0.7, "rgba(255, 200, 80, 0.55)", "rgba(255, 140, 40, 0)");
  ctx.drawImage(image, part * cell[0], 0, size.w, size.h, Math.round(x - size.x), Math.round(y - 4), size.w, height);
}

// Smoke rolling out along the ground as the rocket lifts off, like the
// cloud in the sheet's launching frame. It spreads and fades as it climbs.
function drawLaunchSmoke(ctx, x, ground, lift) {
  const fade = 1 - lift / 400;
  if (lift <= 0 || fade <= 0) return;
  const spread = 20 + lift * 0.5;
  ctx.globalAlpha = fade * 0.8;
  [-1, -0.55, 0, 0.55, 1].forEach((side, i) => {
    const r = 14 + lift * 0.06 + (i % 2) * 6;
    ctx.fillStyle = i % 2 ? "#c8c8d4" : "#e4e4ec";
    ctx.beginPath();
    ctx.arc(x + side * spread, ground - r * 0.6, r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

export function drawRocket(ctx, round, clock, image) {
  const { rocket } = round;
  if (!rocket.landed && rocket.drop === undefined) return;
  const x = rocket.x - round.camera;
  const y = rocket.y - rocket.lift - (rocket.drop ?? 0);
  drawLaunchSmoke(ctx, x, rocket.y, rocket.lift);
  const hull = machineSizes.rocket.parts[0];
  const part = rocketFlame(rocket);
  if (part > 0) drawFlame(ctx, image, part, x, y, clock);
  ctx.drawImage(image, 0, 0, hull.w, hull.h, Math.round(x - hull.x), Math.round(y - hull.h), hull.w, hull.h);
}

// The glow each planet had in the drawing, put back under the cut-out.
const planetGlows = [
  "200, 180, 160", "255, 190, 80", "90, 160, 255", "255, 110, 60",
  "235, 225, 210", "255, 210, 120", "120, 230, 240", "90, 110, 255",
];

// Clips to one planet: its disc, or for Saturn the space between its
// neighbours so the rings show.
function clipPlanet(ctx, discs, i, left, top) {
  const [cx, cy, r] = discs[i];
  ctx.beginPath();
  if (i === 5) {
    const [lx, , lr] = discs[i - 1];
    const [rx, , rr] = discs[i + 1];
    ctx.rect(left + lx + lr, top, rx - rr - lx - lr, machineSizes.planets.h);
  } else {
    ctx.arc(left + cx, top + cy, r + 1, 0, Math.PI * 2);
  }
  ctx.clip();
}

// The planet bar on the "get ready" card. Planets not reached yet are
// faded, and the one you're on gets a gold ring.
export function drawPlanetBar(ctx, image, stageIndex, centreX, centreY) {
  const { discs, h, w } = machineSizes.planets;
  const left = Math.round(centreX - w / 2);
  const top = Math.round(centreY - h / 2);
  discs.forEach(([cx, cy, r], i) => {
    const reached = i <= stageIndex;
    const px = left + cx;
    const py = top + cy;
    if (reached) {
      const glow = ctx.createRadialGradient(px, py, r * 0.8, px, py, r * 1.5);
      glow.addColorStop(0, `rgba(${planetGlows[i]}, 0.5)`);
      glow.addColorStop(1, `rgba(${planetGlows[i]}, 0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(px - r * 1.5, py - r * 1.5, r * 3, r * 3);
    }
    ctx.save();
    clipPlanet(ctx, discs, i, left, top);
    ctx.globalAlpha = reached ? 1 : 0.35;
    ctx.drawImage(image, left, top);
    ctx.restore();
    if (i !== stageIndex) return;
    ctx.strokeStyle = "#ffd400";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(px, py, r + 7, 0, Math.PI * 2);
    ctx.stroke();
  });
}
