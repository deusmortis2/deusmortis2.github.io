// Screens opened from the world: the main menu, Codex (the 150-creature
// collection book), Team, Bag and the full Map.
import { creatureCanvas } from "./creatureArt.js";
import { creatureById, creatures, statsFor } from "./creatures.js";
import { elementInfo, items, songById } from "./data.js";
import { html } from "./panels.js";
import { bustCanvas } from "./portrait.js";
import { knownHeart, playerMoves, playerStats, useUpItem } from "./state.js";
import { creatureCard } from "./town.js";
import { escapeHtml } from "./util.js";
import { drawOceanMap, mapPoint, mapSize } from "./hud.js";
import { zoneOrder, zones } from "./zones.js";

function sheet(env, title, build, className = "") {
  return new Promise((resolve) => {
    env.panels.open(`ts-menu ${className}`, (root) => {
      const view = html(`
        <div class="ts-sheet">
          <header><h2>${title}</h2><button type="button" class="ts-btn ghost small" data-close>Close</button></header>
          <div class="ts-sheet-body"></div>
        </div>`);
      root.append(view);
      const close = () => {
        env.panels.close();
        resolve();
      };
      view.querySelector("[data-close]").addEventListener("click", close);
      view.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          close();
        }
      });
      build(view.querySelector(".ts-sheet-body"), close);
      view.querySelector("[data-close]").focus();
    });
  });
}

function art(id, size, mode) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  canvas.getContext("2d").drawImage(creatureCanvas(id, size, mode), 0, 0);
  return canvas;
}

function codexDetail(env, species, panel) {
  const { state } = env;
  const caught = state.caught.includes(species.id);
  const seen = caught || state.seen.includes(species.id);
  const heart = knownHeart(state, species);
  const reactions = state.reactions[species.id] ?? {};
  const liked = Object.keys(reactions).find((s) => {
    return reactions[s] === "liked";
  });
  const tried = Object.keys(reactions).filter((s) => {
    return reactions[s] === "none";
  }).map((s) => {
    return songById[s].name;
  });
  const info = elementInfo[species.element];
  panel.replaceChildren(html(`
    <div class="ts-codex-detail">
      <div class="ts-codex-art"></div>
      <h3>#${String(species.id).padStart(3, "0")} ${seen ? escapeHtml(species.name) : "???"}</h3>
      <p><span class="ts-tag" style="--c:${seen ? info.color : "#556"}">${seen ? info.label : "?"}</span>
      <span class="ts-tag" style="--c:#cfd8e3">${species.rarity}</span>
      <span class="ts-tag" style="--c:#9fe8ff">${zones[species.zone].name}</span></p>
      ${seen ? `<p>${escapeHtml(species.blurb)}</p>
      <p class="ts-hint">♥ ${escapeHtml(songById[species.heart].hint)}</p>
      <p>Heart song: <b>${heart ? escapeHtml(songById[heart].name) : "not found yet"}</b></p>
      ${liked ? `<p>Also likes: ${escapeHtml(songById[liked].name)}</p>` : ""}
      ${tried.length ? `<p class="ts-note">No effect: ${escapeHtml(tried.join(", "))}</p>` : ""}`
    : "<p>You haven't met this creature yet. It lives somewhere in this region.</p>"}
      <p><b>${caught ? "★ Befriended" : seen ? "Seen, not yet befriended" : "Not seen"}</b></p>
    </div>`));
  panel.querySelector(".ts-codex-art").append(art(species.id, 140, seen ? "full" : "silhouette"));
}

export function openCodex(env, startZone) {
  return sheet(env, `Codex · ${env.state.caught.length}/150 befriended`, (body) => {
    const { state } = env;
    body.innerHTML = `
      <div class="ts-codex">
        <div class="ts-codex-list">
          <label>Region <select data-zone></select></label>
          <div class="ts-codex-grid"></div>
        </div>
        <div class="ts-codex-panel"></div>
      </div>`;
    const select = body.querySelector("[data-zone]");
    zoneOrder.forEach((id) => {
      const inZone = creatures.filter((c) => {
        return c.zone === id;
      });
      const got = inZone.filter((c) => {
        return state.caught.includes(c.id);
      }).length;
      select.append(new Option(`${zones[id].name} (${got}/15)`, id));
    });
    select.value = startZone;
    const grid = body.querySelector(".ts-codex-grid");
    const panel = body.querySelector(".ts-codex-panel");
    const fill = () => {
      grid.replaceChildren();
      creatures.filter((c) => {
        return c.zone === select.value;
      }).forEach((species, i) => {
        const caught = state.caught.includes(species.id);
        const seen = caught || state.seen.includes(species.id);
        const cell = html(`<button type="button" class="ts-codex-cell${caught ? " caught" : ""}">
          <small>#${String(species.id).padStart(3, "0")}${caught ? " ★" : ""}</small><b>${seen ? escapeHtml(species.name) : "???"}</b></button>`);
        cell.prepend(art(species.id, 56, seen ? "full" : "silhouette"));
        cell.addEventListener("click", () => {
          codexDetail(env, species, panel);
        });
        cell.addEventListener("focus", () => {
          codexDetail(env, species, panel);
        });
        grid.append(cell);
        if (i === 0) codexDetail(env, species, panel);
      });
    };
    select.addEventListener("change", fill);
    fill();
  }, "ts-wide");
}

export function openTeam(env) {
  return sheet(env, "Team", (body) => {
    const { state } = env;
    const refresh = () => {
      const stats = playerStats(state);
      const moveNames = playerMoves(state).map((m) => {
        return m === "tailSlap" ? "Tail Slap" : m === "bubble" ? "Bubble Burst" : "Trident Strike";
      });
      body.innerHTML = `
        <div class="ts-you">
          <div class="ts-you-art"></div>
          <div><h3>${escapeHtml(state.avatar.name)} · Lv ${state.player.level}</h3>
          <p>HP ${state.player.hp}/${stats.hp} · Attack ${stats.atk} · Defence ${stats.def} · Speed ${stats.spd}</p>
          <p>Moves: ${moveNames.join(", ")}</p>
          <p>Songs: ${state.songs.map((s) => {
    return escapeHtml(songById[s].name);
  }).join(", ")}</p></div>
        </div>
        <h3>Companions</h3><div class="ts-grid" data-team></div>
        <p class="ts-note">Tap a companion to make it your leader (it fights first). Swap with stored
        creatures at any town's Tide Pool.</p>`;
      body.querySelector(".ts-you-art").append(bustCanvas(state.avatar, 96).cloneNode());
      body.querySelector(".ts-you-art canvas").getContext("2d").drawImage(bustCanvas(state.avatar, 96), 0, 0);
      const team = body.querySelector("[data-team]");
      state.party.forEach((c, i) => {
        const card = creatureCard(c, i === 0 ? "Leader" : "Make leader");
        card.addEventListener("click", () => {
          state.party.unshift(...state.party.splice(i, 1));
          refresh();
        });
        team.append(card);
      });
      if (state.party.length === 0) team.textContent = "No companions yet. Sing to a wild creature to befriend it!";
    };
    refresh();
  });
}

function useOutside(env, id, refresh) {
  const { state } = env;
  const item = items[id];
  if (item.kind === "calm") {
    state.calmSteps = item.value;
    useUpItem(state, id);
    env.panels.toast("Calm Ink spreads around you. Creatures will leave you be for a while.");
    return refresh();
  }
  // Heal or revive: pick who.
  const reviving = item.kind === "revive";
  const targets = [];
  if (!reviving) targets.push({ label: state.avatar.name, who: "you" });
  state.party.forEach((c) => {
    if (reviving === c.hp <= 0) targets.push({ label: creatureById(c.species).name, who: c });
  });
  const picker = html(`<div class="ts-picker"><p>Use ${escapeHtml(item.name)} on:</p></div>`);
  targets.forEach((t) => {
    const b = html(`<button type="button" class="ts-btn small">${escapeHtml(t.label)}</button>`);
    b.addEventListener("click", async () => {
      await env.ask(`Answer to use your ${item.name}`);
      useUpItem(state, id);
      if (t.who === "you") {
        state.player.hp = Math.min(playerStats(state).hp, state.player.hp + item.value);
      } else {
        const max = statsFor(creatureById(t.who.species), t.who.level).hp;
        t.who.hp = reviving ? Math.ceil(max * item.value) : Math.min(max, t.who.hp + item.value);
      }
      env.sound("heal");
      refresh();
    });
    picker.append(b);
  });
  if (targets.length === 0) picker.append("Nobody needs this right now.");
  return picker;
}

export function openBag(env) {
  return sheet(env, "Bag", (body) => {
    const { state } = env;
    const refresh = () => {
      body.replaceChildren();
      const ids = Object.keys(state.items);
      ids.forEach((id) => {
        const item = items[id];
        const usable = ["heal", "revive", "calm"].includes(item.kind);
        const row = html(`<div class="ts-row"><div><b>${escapeHtml(item.name)} x${state.items[id]}</b>
          <p>${escapeHtml(item.desc)}</p></div>
          ${usable ? "<button type=\"button\" class=\"ts-btn small\">Use</button>" : "<small>Use in battle</small>"}</div>`);
        row.querySelector("button")?.addEventListener("click", () => {
          const picker = useOutside(env, id, refresh);
          if (picker) row.append(picker);
        });
        body.append(row);
      });
      if (ids.length === 0) body.append(html("<p>Your bag is empty. Visit a town Shop.</p>"));
      const keys = state.keys.map((k) => {
        return items[k].name;
      });
      body.append(html(`<div><h3>Gear</h3><p>${keys.length ? escapeHtml(keys.join(", ")) : "None yet. Some regions need special gear to enter."}</p></div>`));
    };
    refresh();
  });
}

export function openMap(env) {
  return sheet(env, "Ocean map", (body) => {
    const { state, world } = env;
    const canvas = document.createElement("canvas");
    canvas.width = mapSize.w;
    canvas.height = mapSize.h;
    canvas.className = "ts-map";
    const ctx = canvas.getContext("2d");
    drawOceanMap(ctx, state, 0, 0, mapSize.w, mapSize.h);
    // Sealed regions you know about are crossed with a strong current.
    ctx.strokeStyle = "rgba(255,150,150,0.55)";
    ctx.lineWidth = 3;
    Object.values(zones).forEach((z) => {
      if (!env.isLocked(z.id) || !state.visited.some((v) => {
        return Object.values(zones[v].exits).flat().some((e) => {
          return e[2] === z.id;
        });
      })) return;
      const [x0, y0, x1, y1] = z.map;
      ctx.strokeRect(x0 + 4, y0 + 4, x1 - x0 - 8, y1 - y0 - 8);
    });
    world.lairs.forEach((l) => {
      if (!env.isVisited(l.zone)) return;
      const dot = zones[l.zone].lair;
      const at = { x: dot.mapX, y: dot.mapY };
      ctx.font = "bold 34px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 5;
      ctx.strokeStyle = "#000";
      ctx.strokeText("★", at.x, at.y);
      ctx.fillStyle = state.caught.includes(l.species) ? "#9aa3ad" : "#ffe14d";
      ctx.fillText("★", at.x, at.y);
    });
    const me = mapPoint(state.zone, state.player.x, state.player.y);
    ctx.fillStyle = "#ff3b6b";
    ctx.beginPath();
    ctx.arc(me.x, me.y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 4;
    ctx.stroke();
    body.append(canvas);
    const locked = Object.values(zones).filter((z) => {
      return z.requires && !state.keys.includes(z.requires);
    }).map((z) => {
      return `${z.name}: needs ${items[z.requires].name}`;
    });
    body.append(html(`<p class="ts-note">You are in <b>${escapeHtml(zones[state.zone].name)}</b>. Shaded regions are still unexplored. ★ marks a legendary's lair. ${locked.length ? `Sealed: ${escapeHtml(locked.join(" · "))}` : "Every region is open to you!"}</p>`));
  }, "ts-wide");
}

export function openMainMenu(env) {
  return new Promise((resolve) => {
    sheet(env, "Menu", (body, close) => {
      const options = [
        ["resume", "Resume"], ["team", "Team (P)"], ["bag", "Bag (B)"], ["codex", "Codex (C)"],
        ["map", "Map (M)"], ["graphics", `Graphics: ${env.state.lowGraphics ? "Low (faster)" : "Full"}`],
        ["save", "Save now"], ["title", "Save & switch character"],
        ["quit", "Quit without saving"],
      ];
      body.innerHTML = "<div class=\"ts-menu-grid\"></div><p class=\"ts-note\">Your adventure saves automatically in this browser. Switch character to play another save slot or start someone new. This adventure stays saved. Quit without saving goes back to the main menu and loses anything since the last save.</p>";
      const grid = body.querySelector(".ts-menu-grid");
      options.forEach(([value, label]) => {
        const b = html(`<button type="button" class="ts-btn">${escapeHtml(label)}</button>`);
        b.addEventListener("click", () => {
          close();
          resolve(value);
        });
        grid.append(b);
      });
      grid.querySelector("button").focus();
    }).then(() => {
      resolve("resume");
    });
  });
}
