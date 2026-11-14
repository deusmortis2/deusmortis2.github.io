// Mermaids have hand-drawn poses for swimming and for turning round, so
// they are not swung round like a flat card (turn.js still does that for
// the mermen).
//
// - Swimming, her tail beats between its normal side-profile pose and a
//   lowered one (merfolk-swim.webp, `low` in swimAtlas.js).
// - Turning round, the side view turns to face the viewer with the tail on
//   the side it was trailing, the front picture then changes to the one
//   with the tail curled the other way, and she turns out into the side
//   view heading the other way. Facing right her front picture is the
//   switched one (tail on the left, `switch` in modelAtlas.js); facing
//   left it is the normal one.
// - Starting and stopping change between the side view and the front one.
//
// Pictures change over in a frame or two, like hand-drawn animation, so
// two pictures never show at once. What moves smoothly is where she is
// drawn: her head glides from one picture's place to the next, the side
// view leans and narrows as she turns, and the fin bends before each beat.
import { groupOf } from "./avatar.js";
import { modelAtlas } from "./modelAtlas.js";
import { drawBent, loadedArt, modelScale, swimLean, swimScale } from "./sprite.js";
import { swimAtlas } from "./swimAtlas.js";
import { makeCanvas } from "./util.js";

// Seconds for a whole turn round, side view to side view.
const turnTime = 0.36;

// Seconds to go between floating still and swimming.
const swimTime = 0.15;

// Tail beats per second while swimming.
const beatRate = 0.9;

// How far the normal fin swings down (radians) on its way to the lowered
// pose, so the tail is already moving when the picture changes.
const beatBend = -0.35;

// The side view narrows by this share, and straightens up by this share of
// its tilt, as it turns to face the viewer. The front picture opens out
// from `frontNarrow` narrower as it takes over.
const sideNarrow = 0.3;
const sideStraighten = 0.7;
const frontNarrow = 0.2;

// Fades are mixed in a square buffer this many canvas pixels across, drawn
// at `detail` times that so the pixel art stays crisp.
const size = 240;
const detail = 2;

let mix = null;
let layer = null;

// Fresh pose state: `turn` runs from 0 (facing right) to 1 (facing left),
// `swim` from 0 (floating still) to 1 (swimming), and `beat` is how far
// through the tail beat she is.
export function makePose() {
  // The beat starts with the tail up, well away from a picture change.
  return { beat: 0.75, swim: 0, turn: 0 };
}

function approach(value, goal, step) {
  if (value < goal) return Math.min(goal, value + step);
  return Math.max(goal, value - step);
}

// Eases from 0 to 1 as `x` goes from `from` to `to`. Starts and ends with
// no speed and no sudden change of speed, so fades drift in and out.
function ease(from, to, x) {
  const t = Math.min(1, Math.max(0, (x - from) / (to - from)));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

// Half-width of a picture change, in the same units as the value that
// drives it. Small enough to be over in a frame or two.
const cutWidth = 0.025;

// 0 before `at`, 1 after it, with the briefest blend between.
function cut(at, x) {
  return ease(at - cutWidth, at + cutWidth, x);
}

// Moves the pose on by `dt` seconds. Call once per frame. Changing your
// mind halfway through a turn just runs it back the other way.
export function steerPose(pose, facing, moving, dt) {
  pose.turn = approach(pose.turn, facing < 0 ? 1 : 0, dt / turnTime);
  pose.swim = approach(pose.swim, moving ? 1 : 0, dt / swimTime);
  if (moving) pose.beat = (pose.beat + dt * beatRate) % 1;
}

function lookOf(avatar) {
  return swimAtlas.mermaids[avatar.look] ? avatar.look : 0;
}

// Where the side view's head lands, relative to its centre.
function sideHead(look, { mirror, tilt, wide }) {
  const s = swimAtlas.mermaids[look];
  const [, , bw, bh] = s.body;
  const scale = swimScale.mermaids;
  const x = (s.head[0] - bw / 2) * scale;
  const y = (s.head[1] - bh / 2) * scale;
  const cos = Math.cos(tilt);
  const sin = Math.sin(tilt);
  return [(x * cos - y * sin) * mirror * wide, x * sin + y * cos];
}

// Where the front picture's head lands, relative to its centre.
function frontHead(look, { wide }) {
  const r = modelAtlas.mermaids[look];
  const scale = modelScale.mermaids;
  const [hx, hy] = modelAtlas.heads.mermaids[look];
  return [(hx - r[2] / 2) * scale * wide, (hy - r[3] / 2) * scale];
}

// The side view heading right (or left when `mirror` is -1), tipped by
// `tilt` and narrowed to `wide` of its width, moved by `shift`. The normal
// pose bends its fin by `bend`; the lowered pose is drawn when `lowered`
// is set.
function drawSide(c, look, { bend, lowered, mirror, shift, tilt, wide }) {
  const { swimmers } = loadedArt();
  const s = swimAtlas.mermaids[look];
  const [bx, by, bw, bh] = s.body;
  const scale = swimScale.mermaids;
  c.translate(shift[0], shift[1]);
  c.scale(mirror * wide, 1);
  c.rotate(tilt);
  c.scale(scale, scale);
  c.translate(-bw / 2, -bh / 2);
  if (lowered) {
    const [lx, ly, lw, lh] = s.low;
    c.drawImage(swimmers, lx, ly, lw, lh, s.lowAt[0], s.lowAt[1], lw, lh);
    return;
  }
  drawBent(c, [s.fin], [bw, bh], s.joint, s.reach, 0, bend);
  c.drawImage(swimmers, bx, by, bw, bh, 0, 0, bw, bh);
}

// A front picture, normal or switched, placed so both line up on the same
// head and body, then moved by `shift`.
function drawFront(c, look, { shift, switched, wide, wobble }) {
  const { models } = loadedArt();
  const r = modelAtlas.mermaids[look];
  const scale = modelScale.mermaids;
  const [x, y, w, h, dx, dy] = switched ? modelAtlas.switch.mermaids[look] : [...r, 0, 0];
  c.translate(shift[0], shift[1]);
  c.rotate(wobble);
  c.scale(wide, 1);
  c.drawImage(
    models, x, y, w, h,
    -(r[2] * scale) / 2 + dx * scale, -(r[3] * scale) / 2 + dy * scale,
    w * scale, h * scale,
  );
}

// Every picture showing this frame, with how much of it shows. The shares
// add up to 1.
function layersFor(look, pose, heading, wobble) {
  const p = pose.turn;
  // The turn is four pictures in quarters: side view, switched front,
  // normal front, side view the other way.
  const sideShown = p < 0.5 ? 1 - cut(0.25, p) : cut(0.75, p);
  const swim = sideShown * cut(0.5, pose.swim);
  const normal = cut(0.5, p);
  // How far round she is, smoothly, for the parts that glide: 1 side-on,
  // 0 facing the viewer.
  const side = p < 0.5 ? 1 - ease(0, 0.5, p) : ease(0.5, 1, p);
  const glide = side * ease(0, 1, pose.swim);
  const away = 1 - side;
  const mirror = p < 0.5 ? 1 : -1;
  const tilt = (heading + swimLean.mermaids) * (1 - sideStraighten * away);
  const wide = 1 - sideNarrow * away;
  // The tail beat: the fin bends down as the beat rises, then the picture
  // changes to the lowered tail, and back.
  const beat = Math.sin(pose.beat * Math.PI * 2);
  const low = cut(0, beat);
  const bend = beatBend * ease(-1, 0, beat);
  const sideAt = { mirror, tilt, wide };
  const front = { wide: 1 - frontNarrow * glide, wobble };
  // The head glides from the side view's place to the front picture's,
  // whichever picture is showing, so changing picture never jumps.
  const sh = sideHead(look, sideAt);
  const fh = frontHead(look, front);
  const head = [fh[0] + (sh[0] - fh[0]) * glide, fh[1] + (sh[1] - fh[1]) * glide];
  sideAt.shift = [head[0] - sh[0], head[1] - sh[1]];
  front.shift = [head[0] - fh[0], head[1] - fh[1]];
  return [
    { draw: (c) => { drawSide(c, look, { ...sideAt, bend, lowered: false }); }, share: swim * (1 - low) },
    { draw: (c) => { drawSide(c, look, { ...sideAt, lowered: true }); }, share: swim * low },
    { draw: (c) => { drawFront(c, look, { ...front, switched: true }); }, share: (1 - swim) * (1 - normal) },
    { draw: (c) => { drawFront(c, look, { ...front, switched: false }); }, share: (1 - swim) * normal },
  ].filter((l) => {
    return l.share > 0.003;
  });
}

// Draws a mermaid in her current pose centred on (0, 0). `heading` tips the
// side view towards the way she is swimming (up is negative) and `wobble`
// rocks the front picture. Returns false for anyone without the posed art
// (mermen, or before it has loaded), who should be drawn the old way.
export function drawPosed(ctx, avatar, pose, heading, wobble) {
  const { models, swimmers } = loadedArt();
  if (groupOf(avatar) !== "mermaids" || !models || !swimmers) return false;
  if (!modelAtlas.switch || !modelAtlas.heads || !swimAtlas.mermaids[0].low) return false;
  const layers = layersFor(lookOf(avatar), pose, heading, wobble);
  if (layers.length === 1) {
    ctx.save();
    layers[0].draw(ctx);
    ctx.restore();
    return true;
  }
  // Mid-fade: draw each picture whole into its own buffer, then add them
  // up weighted by share. Adding (rather than stacking see-through
  // pictures) keeps the figure solid where the pictures overlap.
  if (!mix) {
    mix = makeCanvas(size * detail, size * detail);
    layer = makeCanvas(size * detail, size * detail);
  }
  const m = mix.getContext("2d");
  const l = layer.getContext("2d");
  m.setTransform(1, 0, 0, 1, 0, 0);
  m.globalAlpha = 1;
  m.globalCompositeOperation = "source-over";
  m.clearRect(0, 0, mix.width, mix.height);
  m.globalCompositeOperation = "lighter";
  for (const { draw, share } of layers) {
    l.setTransform(1, 0, 0, 1, 0, 0);
    l.clearRect(0, 0, layer.width, layer.height);
    l.setTransform(detail, 0, 0, detail, (size * detail) / 2, (size * detail) / 2);
    l.save();
    draw(l);
    l.restore();
    m.globalAlpha = share;
    m.drawImage(layer, 0, 0);
  }
  ctx.drawImage(mix, -size / 2, -size / 2, size, size);
  return true;
}
