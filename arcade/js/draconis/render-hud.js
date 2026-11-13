// Heads-up display: score, level, lives, fireballs, owned power-ups, the
// boss health bar, the power-up choice cards and the full-screen messages.
import { height, width } from "./entities.js";
import { maxAmmo, powerInfo, rank, wardReady, xpNeeded } from "./powers.js";
import { stageSeconds, stages } from "./stages.js";

const font = '"Press Start 2P", monospace';

export function text(ctx, value, x, y, { align = "left", colour = "#ffffff", size = 10 } = {}) {
  ctx.font = `${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = "top";
  // Small text gets a thinner shadow so it stays readable.
  const drop = size < 8 ? 1 : 2;
  ctx.fillStyle = "#000000";
  ctx.fillText(value, x + drop, y + drop);
  ctx.fillStyle = colour;
  ctx.fillText(value, x, y);
}

// Choice cards sit at the bottom right, just above the fireball icons.
const card = { gap: 4, h: 30, w: 182 };

export function choiceLayout(count) {
  const x = width - card.w - 8;
  const bottom = height - 34;
  return Array.from({ length: count }, (_, i) => ({
    h: card.h,
    w: card.w,
    x,
    y: bottom - (count - i) * (card.h + card.gap),
  }));
}

// Which card (if any) is under a point in canvas coordinates.
export function choiceAt(options, point) {
  return choiceLayout(options.length).findIndex(
    (c) => point.x >= c.x && point.x <= c.x + c.w && point.y >= c.y && point.y <= c.y + c.h,
  );
}

function powerIcon(ctx, info, x, y, size, dim = false) {
  ctx.fillStyle = "#0a0a1f";
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = dim ? "#555566" : info.colour;
  ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
  ctx.font = `${Math.floor(size * 0.55)}px ${font}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#0a0a1f";
  ctx.fillText(info.letter, x + size / 2 + 1, y + size / 2 + 1);
}

function drawChoice(ctx, game) {
  const { choice, clock, progress } = game;
  if (!choice) return;
  const cards = choiceLayout(choice.length);
  text(ctx, `LEVEL ${progress.level}! PICK ONE`, width - 10, cards[0].y - 14, {
    align: "right",
    colour: "#ffd400",
    size: 8,
  });
  const pulse = 0.6 + 0.4 * Math.sin(clock * 6);
  cards.forEach((c, i) => {
    const info = powerInfo(choice[i]);
    const owned = rank(progress, info.id);
    ctx.fillStyle = "rgba(10, 10, 31, 0.88)";
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = info.colour;
    ctx.lineWidth = 2;
    ctx.strokeRect(c.x + 1, c.y + 1, c.w - 2, c.h - 2);
    ctx.globalAlpha = 1;
    powerIcon(ctx, info, c.x + 5, c.y + 5, 20);
    const level = owned > 0 ? ` ${owned + 1}` : "";
    text(ctx, `${info.name}${level}`, c.x + 30, c.y + 6, { colour: info.colour, size: 7 });
    text(ctx, info.text, c.x + 30, c.y + 18, { colour: "#d8d8f0", size: 6 });
    text(ctx, `${i + 1}`, c.x + c.w - 6, c.y + 6, { align: "right", colour: "#888899", size: 6 });
  });
}

function drawLevel(ctx, progress) {
  text(ctx, `LV ${progress.level}`, 10, 42, { colour: "#7fe7ff", size: 8 });
  const w = 80;
  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.fillRect(52, 42, w + 2, 8);
  ctx.fillStyle = "#7fe7ff";
  ctx.fillRect(53, 43, (w * progress.xp) / xpNeeded(progress.level), 6);
}

function drawOwned(ctx, progress, y) {
  let x = 6;
  Object.keys(progress.powers).forEach((id) => {
    const info = powerInfo(id);
    const dim = id === "ward" && !wardReady(progress);
    powerIcon(ctx, info, x, y, 14, dim);
    for (let i = 0; i < rank(progress, id); i += 1) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x + 1 + i * 4, y - 4, 3, 2);
    }
    x += 17;
  });
}

function drawBossBar(ctx, boss) {
  if (!boss || !boss.alive) return;
  const w = 240;
  const x = (width - w) / 2;
  text(ctx, boss.spec.name, width / 2, 46, { align: "center", colour: "#ff4d4d", size: 8 });
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(x - 2, 58, w + 4, 10);
  ctx.fillStyle = boss.hp <= boss.maxHp / 2 ? "#ff2e2e" : "#ff8a2e";
  ctx.fillRect(x, 60, (w * Math.max(0, boss.hp)) / boss.maxHp, 6);
}

export function drawHud(ctx, sprites, game) {
  const { ammo, boss, time } = game.round;
  const clock = time >= stageSeconds ? "BOSS" : `${Math.floor(time)}/${stageSeconds}`;
  text(ctx, `STAGE ${game.stage + 1}  ${clock}`, 10, 10);
  text(ctx, `SCORE ${game.score}`, 10, 26, { colour: "#ffd400" });
  drawLevel(ctx, game.progress);
  const wait = Math.max(0, Math.ceil(game.nextQuestion - game.mathTime));
  text(ctx, `BOOST IN ${wait}`, width - 10, 10, { align: "right", colour: "#ff2e88" });
  drawBossBar(ctx, boss);
  const lifeY = height - sprites.life.height - 6;
  for (let i = 0; i < 3 - game.deaths; i += 1) {
    ctx.drawImage(sprites.life, 6 + i * (sprites.life.width + 2), lifeY);
  }
  drawOwned(ctx, game.progress, lifeY - 18);
  for (let i = 0; i < maxAmmo(game.progress); i += 1) {
    ctx.globalAlpha = i < ammo ? 1 : 0.25;
    ctx.drawImage(sprites.fireballIcon, width - 28 - i * 24, height - 28);
  }
  ctx.globalAlpha = 1;
  drawChoice(ctx, game);
}

function overlayLines(game) {
  const lives = 3 - game.deaths;
  const stage = stages[game.stage];
  const screens = {
    clear: [`STAGE ${game.stage + 1} CLEAR!`, `+${game.stageBonus} BONUS`, ""],
    intro: [`STAGE ${game.stage + 1}`, stage.name, "GET READY..."],
    over: ["GAME OVER", "CONTINUE FOR 3 NEW LIVES", "ENTER OR TAP TO CONTINUE"],
    ready: ["OUCH!", `${lives} ${lives === 1 ? "LIFE" : "LIVES"} LEFT`, "GET READY..."],
    revived: ["CONTINUE!", "3 LIVES. KEEP GOING!", "GET READY..."],
    title: ["DEUS DRACONIS", "SURVIVE 3 STAGES", "SPACE OR TAP TO START"],
    won: ["YOU WON!", `SCORE ${game.score}`, "ENTER OR TAP: PLAY AGAIN"],
  };
  return screens[game.phase];
}

export function drawOverlay(ctx, game) {
  const lines = overlayLines(game);
  if (!lines) return;
  // Stage intros keep the new sky visible behind a lighter veil.
  ctx.fillStyle = game.phase === "intro" ? "rgba(10, 10, 31, 0.45)" : "rgba(10, 10, 31, 0.72)";
  ctx.fillRect(0, 0, width, height);
  text(ctx, lines[0], width / 2, 120, { align: "center", colour: "#ff2e88", size: 20 });
  text(ctx, lines[1], width / 2, 170, { align: "center", colour: "#ffd400", size: 12 });
  const steady = ["intro", "ready", "revived"].includes(game.phase);
  if (steady || Math.floor(game.clock * 2) % 2 === 0) {
    text(ctx, lines[2], width / 2, 220, { align: "center", size: 10 });
  }
}
