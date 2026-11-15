// The song and dance mini-game: the song plays (music.js) and its notes
// fall down four lanes, low notes on the left and high on the right. Press
// the matching arrow (or tap the lane) as each one reaches the line, in
// time with the music. How well you play scales the capture chance.
import { compose, playTune } from "./music.js";
import { tunes } from "./tunes.js";

const laneColors = ["#ff6fa8", "#4db3ff", "#7dffd9", "#ffe14d"];
const arrows = ["◀", "▼", "▲", "▶"];
const letters = ["A", "S", "W", "D"];
// Seconds a note takes to fall from the top to the line.
const travel = 1.8;
const perfectWindow = 0.075;
const goodWindow = 0.16;

// Spreads the song's pitches across the lanes, lowest on the left.
function laneMap(taps) {
  const pitches = [...new Set(taps.map((n) => n.midi))].sort((a, b) => a - b);
  return (midi) => {
    if (pitches.length < 2) return 1;
    return Math.round((pitches.indexOf(midi) * 3) / (pitches.length - 1));
  };
}

// `speed` makes rarer creatures' songs a little quicker (still slow).
export function createRhythm(song, speed = 1) {
  const tune = tunes[song.id];
  const piece = compose(tune);
  const secondsPerBeat = 60 / (tune.bpm * speed);
  const bar = tune.meter * secondsPerBeat;
  // At least one bar of count-in, and long enough for the first note to
  // fall the whole way.
  const leadIn = bar * Math.ceil(travel / bar);
  const taps = piece.lead.filter((n) => n.tap);
  const laneOf = laneMap(taps);
  const notes = taps.map((n) => {
    return { hit: null, lane: laneOf(n.midi), time: leadIn + n.beat * secondsPerBeat };
  });
  const start = performance.now();
  const music = playTune(tune, piece, secondsPerBeat, leadIn);
  return {
    beat: secondsPerBeat,
    clock: music?.clock ?? ((ms) => (ms - start) / 1000),
    end: leadIn + piece.beats * secondsPerBeat + 0.5,
    flashes: [0, 0, 0, 0],
    label: "",
    labelTime: 0,
    leadIn,
    meter: tune.meter,
    music,
    notes,
    song,
    time: 0,
  };
}

function judge(r, text) {
  r.label = text;
  r.labelTime = r.time;
}

// Feeds key presses (with their own timestamps) and advances the clock.
export function updateRhythm(r, presses) {
  r.time = r.clock(performance.now());
  presses.forEach(({ lane, time }) => {
    const at = r.clock(time);
    r.flashes[lane] = r.time;
    const note = r.notes.find((n) => {
      return n.hit === null && n.lane === lane && Math.abs(n.time - at) <= goodWindow;
    });
    if (!note) return;
    const off = Math.abs(note.time - at);
    note.hit = off <= perfectWindow ? "perfect" : "good";
    judge(r, note.hit === "perfect" ? "Perfect!" : "Good");
  });
  r.notes.forEach((n) => {
    if (n.hit === null && r.time - n.time > goodWindow) {
      n.hit = "miss";
      judge(r, "Miss");
    }
  });
  if (r.time < r.end) return false;
  r.music?.stop();
  return true;
}

// 0 (all missed) to 1 (all perfect).
export function rhythmScore(r) {
  const total = r.notes.reduce((sum, n) => {
    if (n.hit === "perfect") return sum + 1;
    if (n.hit === "good") return sum + 0.6;
    return sum;
  }, 0);
  return total / r.notes.length;
}

export function drawRhythm(ctx, r, width, height) {
  const laneW = 74;
  const left = width / 2 - laneW * 2;
  const top = 70;
  const line = height - 150;
  ctx.fillStyle = "rgba(4,10,30,0.72)";
  ctx.fillRect(left - 20, top - 50, laneW * 4 + 40, line - top + 110);
  ctx.font = "bold 18px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(`${r.song.kind}: ${r.song.name}`, width / 2, top - 28);
  for (let i = 0; i < 4; i += 1) {
    const x = left + i * laneW;
    const flash = Math.max(0, 1 - (r.time - r.flashes[i]) * 6);
    ctx.fillStyle = `rgba(255,255,255,${0.05 + flash * 0.2})`;
    ctx.fillRect(x + 4, top, laneW - 8, line - top + 30);
    ctx.strokeStyle = laneColors[i];
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x + laneW / 2, line, 24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = laneColors[i];
    ctx.font = "20px system-ui, sans-serif";
    ctx.fillText(arrows[i], x + laneW / 2, line + 1);
    // The WASD letter for this lane, under its circle.
    ctx.font = "bold 13px system-ui, sans-serif";
    ctx.fillText(letters[i], x + laneW / 2, line + 33);
  }
  r.notes.forEach((n) => {
    if (n.hit === "perfect" || n.hit === "good") return;
    const y = line - ((n.time - r.time) / travel) * (line - top);
    if (y < top - 20 || y > line + 60) return;
    const x = left + n.lane * laneW + laneW / 2;
    ctx.globalAlpha = n.hit === "miss" ? 0.35 : 1;
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fillStyle = laneColors[n.lane];
    ctx.fill();
    ctx.fillStyle = "#0a0f24";
    ctx.font = "bold 18px system-ui, sans-serif";
    ctx.fillText(arrows[n.lane], x, y + 1);
    ctx.globalAlpha = 1;
  });
  if (r.label && r.time - r.labelTime < 0.6) {
    ctx.font = "bold 26px system-ui, sans-serif";
    ctx.fillStyle = r.label === "Miss" ? "#ff6f6f" : "#ffe14d";
    ctx.fillText(r.label, width / 2, line + 52);
  }
  if (r.time < r.leadIn) {
    ctx.font = "bold 14px system-ui, sans-serif";
    ctx.fillStyle = "#cfe8ff";
    ctx.fillText("Press the arrow keys or WASD (or tap)", width / 2, top + 24);
    ctx.fillText("as notes reach the circles, to the beat", width / 2, top + 44);
    // Counts the last bar in, in time with the ticks.
    const count = Math.ceil((r.leadIn - Math.max(0, r.time)) / r.beat);
    if (count <= r.meter) {
      ctx.font = "bold 44px system-ui, sans-serif";
      ctx.fillStyle = "#ffe14d";
      ctx.fillText(String(count), width / 2, top + 110);
    }
  }
}
