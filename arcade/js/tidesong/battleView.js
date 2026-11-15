// Draws a battle: the region's water, the wild creature on the right facing
// left, your fighter (you or a companion) on the left facing right, and both
// health boxes.
import { battleImage } from "./art.js";
import { castMember } from "./avatar.js";
import { drawFx, lungeOffset } from "./battleFx.js";
import { creatureCanvas } from "./creatureArt.js";
import { creatureById, statsFor } from "./creatures.js";
import { elementInfo, songById } from "./data.js";
import { fullCanvas } from "./portrait.js";
import { drawRhythm } from "./rhythm.js";
import { knownHeart, playerStats } from "./state.js";
import { shade } from "./util.js";
import { zones } from "./zones.js";

const rarityColors = {
  common: "#cfd8e3", legendary: "#ffcf3f", rare: "#ff8fcf", uncommon: "#7dffd9",
};

function hpBar(ctx, x, y, w, hp, max) {
  const frac = Math.max(0, hp / max);
  ctx.fillStyle = "#1b2238";
  ctx.fillRect(x, y, w, 10);
  ctx.fillStyle = frac > 0.5 ? "#39d98a" : frac > 0.2 ? "#ffcf3f" : "#ff5b5b";
  ctx.fillRect(x + 1, y + 1, (w - 2) * frac, 8);
}

function infoBox(ctx, x, y, lines) {
  const { name, level, hp, max, tag, tagColor, extra, nameColor } = lines;
  ctx.fillStyle = "rgba(8,16,36,0.82)";
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, 300, extra ? 94 : 74, 10);
  ctx.fill();
  ctx.stroke();
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.font = "bold 18px system-ui, sans-serif";
  ctx.fillStyle = nameColor ?? "#ffffff";
  ctx.fillText(name, x + 14, y + 26);
  ctx.textAlign = "right";
  ctx.fillStyle = "#cfe8ff";
  ctx.font = "15px system-ui, sans-serif";
  ctx.fillText(`Lv ${level}`, x + 286, y + 26);
  if (tag) {
    ctx.textAlign = "left";
    ctx.font = "bold 11px system-ui, sans-serif";
    const w = ctx.measureText(tag).width + 12;
    ctx.fillStyle = tagColor;
    ctx.beginPath();
    ctx.roundRect(x + 14, y + 34, w, 16, 8);
    ctx.fill();
    ctx.fillStyle = "#0a0f24";
    ctx.fillText(tag, x + 20, y + 46);
  }
  ctx.textAlign = "right";
  ctx.font = "12px system-ui, sans-serif";
  ctx.fillStyle = "#cfe8ff";
  ctx.fillText(`${Math.max(0, hp)} / ${max} HP`, x + 286, y + 47);
  hpBar(ctx, x + 14, y + 56, 272, hp, max);
  if (extra) {
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffd6ef";
    ctx.fillText(extra, x + 14, y + 84);
  }
}

// The region's painted battle scene, with a soft shadow at the top and
// bottom so the health boxes stay easy to read. A plain gradient stands in
// while the picture loads.
function background(ctx, zone, width, height) {
  const z = zones[zone];
  const img = battleImage(zone);
  if (img) {
    ctx.drawImage(img, 0, 0, width, height);
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, shade(z.water, 0.25));
    g.addColorStop(1, shade(z.water, -0.45));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  }
  const top = ctx.createLinearGradient(0, 0, 0, 130);
  top.addColorStop(0, "rgba(4,10,26,0.45)");
  top.addColorStop(1, "rgba(4,10,26,0)");
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, width, 130);
  // A faint pool of shadow under each fighter.
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath();
  ctx.ellipse(700, 268, 120, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(220, 405, 150, 26, 0, 0, Math.PI * 2);
  ctx.fill();
}

function shakeOffset(scene, who, now) {
  if (!scene.hit || scene.hit.who !== who) return 0;
  const t = (now - scene.hit.time) / 1000;
  if (t > 0.4) return 0;
  return Math.sin(t * 60) * 10 * (1 - t / 0.4);
}

function drawWild(ctx, scene, state, now, time) {
  const wild = scene.wild;
  const art = creatureCanvas(wild.species.id, 230, "left");
  let scale = 1;
  let fade = 1;
  if (scene.capture) {
    const t = (now - scene.capture.start) / 1000;
    if (scene.capture.done) {
      scale = Math.max(0.05, 1 - t * 1.6);
      fade = Math.max(0, 1 - t * 1.4);
    }
    // Notes spiralling around the creature while the song works.
    ctx.font = "26px system-ui, sans-serif";
    ctx.textAlign = "center";
    for (let i = 0; i < 6; i += 1) {
      const a = t * 3 + (i / 6) * Math.PI * 2;
      ctx.fillStyle = ["#ffe14d", "#ff8fcf", "#7dffd9"][i % 3];
      ctx.fillText(i % 2 ? "♪" : "♫", 700 + Math.cos(a) * 130, 150 + Math.sin(a) * 70);
    }
  }
  const bob = Math.sin(time * 2.2) * 6;
  const lunge = lungeOffset(scene, "wild", now);
  const dx = shakeOffset(scene, "wild", now) + lunge.x;
  const size = 230 * scale;
  ctx.globalAlpha = fade;
  ctx.drawImage(art, 700 - size / 2 + dx, 150 - size / 2 + bob + lunge.y + (230 - size) / 2, size, size);
  ctx.globalAlpha = 1;
  const species = wild.species;
  const info = elementInfo[species.element];
  const heart = knownHeart(state, species);
  infoBox(ctx, 24, 22, {
    extra: heart ? `Heart song: ${songById[heart].name}` : "Heart song: unknown",
    hp: wild.hp,
    level: wild.level,
    max: wild.stats.hp,
    name: species.name,
    nameColor: rarityColors[species.rarity],
    tag: `${info.label} · ${species.rarity}`,
    tagColor: info.color,
  });
}

function drawAlly(ctx, scene, state, now, time) {
  const fighter = scene.fighter?.() ?? "you";
  const lunge = lungeOffset(scene, "ally", now);
  const dx = shakeOffset(scene, "ally", now) + lunge.x;
  const bob = Math.sin(time * 1.8 + 1) * 4 + lunge.y;
  if (fighter === "you") {
    const art = fullCanvas(state.avatar, 290);
    const x = 220 - art.width / 2 + dx;
    // Pictures drawn turned to the left are mirrored so the player always
    // faces the wild creature on the right.
    if (castMember(state.avatar).turned === "left") {
      ctx.save();
      ctx.translate(x + art.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(art, 0, 110 + bob);
      ctx.restore();
    } else {
      ctx.drawImage(art, x, 110 + bob);
    }
    const stats = playerStats(state);
    infoBox(ctx, 636, 252, {
      hp: state.player.hp,
      level: state.player.level,
      max: stats.hp,
      name: state.avatar.name,
    });
    return;
  }
  const c = state.party.find((p) => {
    return p.uid === fighter;
  });
  if (!c) return;
  const species = creatureById(c.species);
  const art = creatureCanvas(species.id, 210, "right");
  ctx.drawImage(art, 220 - 105 + dx, 235 - 105 + bob);
  const info = elementInfo[species.element];
  infoBox(ctx, 636, 252, {
    hp: c.hp,
    level: c.level,
    max: statsFor(species, c.level).hp,
    name: species.name,
    tag: info.label,
    tagColor: info.color,
  });
}

export function drawBattle(ctx, scene, state, view) {
  const now = performance.now();
  background(ctx, scene.zone, view.width, view.height);
  if (scene.wild) drawWild(ctx, scene, state, now, view.time);
  drawAlly(ctx, scene, state, now, view.time);
  drawFx(ctx, scene, now);
  if (scene.rhythm) drawRhythm(ctx, scene.rhythm, view.width, view.height);
}
