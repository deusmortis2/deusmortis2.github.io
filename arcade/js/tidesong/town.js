// Town buildings: the Healer (answer a question, then rest), the Shop, the
// Song Hall (learn new songs and dances) and the Tide Pool (swap creatures
// between your team and storage).
import { lairPicture, townPicture } from "./art.js";
import { creatureCanvas } from "./creatureArt.js";
import { creatureById, statsFor } from "./creatures.js";
import { elementInfo, itemPrice, items, songById, songPrices } from "./data.js";
import { html } from "./panels.js";
import { addItem, healAll, partyLimit, playerStats } from "./state.js";
import { escapeHtml } from "./util.js";

const titles = {
  healer: "Healer",
  pool: "Tide Pool",
  shop: "Shop",
  songs: "Song Hall",
};

function shell(env, town, kind, body) {
  return new Promise((resolve) => {
    env.panels.open("ts-town", (root) => {
      const view = html(`
        <div class="ts-sheet">
          <div class="ts-banner" style="background-image:url('${townPicture(town.zone)}')"></div>
          <header><h2>${escapeHtml(town.name)} · ${titles[kind]}</h2>
          <span class="ts-pearls">◉ <b></b> pearls</span></header>
          <div class="ts-sheet-body"></div>
          <footer><button type="button" class="ts-btn ghost" data-leave>Leave</button></footer>
        </div>`);
      root.append(view);
      const pearls = view.querySelector(".ts-pearls b");
      const refreshPearls = () => {
        pearls.textContent = String(env.state.pearls);
      };
      refreshPearls();
      view.querySelector("[data-leave]").addEventListener("click", () => {
        env.panels.close();
        env.save();
        resolve();
      });
      body(view.querySelector(".ts-sheet-body"), refreshPearls);
      view.querySelector("button")?.focus();
    });
  });
}

function healer(env, town) {
  return shell(env, town, "healer", (body) => {
    const { state } = env;
    const stats = playerStats(state);
    body.innerHTML = `
      <p class="ts-lead">"Welcome, traveller. Rest in the warm currents and I'll mend you and your
      companions."</p>
      <p>${escapeHtml(state.avatar.name)}: ${state.player.hp}/${stats.hp} HP</p>
      <button type="button" class="ts-btn go" data-rest>Rest and heal</button>
      <p class="ts-note" role="status"></p>`;
    const note = body.querySelector(".ts-note");
    const button = body.querySelector("[data-rest]");
    button.addEventListener("click", async () => {
      button.disabled = true;
      await env.ask("Answer to rest at the Healer");
      healAll(state);
      state.lastTown = town.id;
      env.sound("heal");
      env.save();
      note.textContent = "You and your companions are fully healed!";
    });
  });
}

function shopRow(env, id, refresh) {
  const { state } = env;
  const item = items[id];
  const bought = state.player.bought[id] ?? 0;
  const price = itemPrice(id, bought);
  const owned = item.kind === "key" || item.kind === "gear" ? state.keys.includes(id) : false;
  const have = item.kind === "boost" ? `bought ${bought}` : owned ? "owned" : `have ${state.items[id] ?? 0}`;
  const row = html(`
    <div class="ts-row">
      <div><b>${escapeHtml(item.name)}</b> <small>${have}</small><p>${escapeHtml(item.desc)}</p></div>
      <button type="button" class="ts-btn small">${owned ? "Owned" : `${price} ◉`}</button>
    </div>`);
  const button = row.querySelector("button");
  button.disabled = owned || state.pearls < price;
  button.addEventListener("click", () => {
    if (state.pearls < price) return;
    state.pearls -= price;
    if (item.kind === "boost") {
      state.player.boosts[item.stat] += item.value;
      state.player.bought[id] = bought + 1;
      if (item.stat === "hp") state.player.hp += item.value;
    } else if (item.kind === "key" || item.kind === "gear") {
      state.keys.push(id);
    } else {
      addItem(state, id);
    }
    env.sound("buy");
    env.save();
    refresh();
  });
  return row;
}

function shop(env, town) {
  return shell(env, town, "shop", (body, refreshPearls) => {
    const refresh = () => {
      refreshPearls();
      // Rebuilding the rows drops keyboard focus, so put it back on the same
      // row (or the next one you can still afford) to keep WASD working.
      const rows = [...body.children];
      const was = rows.findIndex((row) => {
        return row.contains(document.activeElement);
      });
      body.replaceChildren(...town.sells.map((id) => {
        return shopRow(env, id, refresh);
      }));
      if (was < 0) return;
      const buttons = [...body.querySelectorAll("button")];
      const next = buttons.slice(was).find((b) => {
        return !b.disabled;
      }) ?? [...buttons].reverse().find((b) => {
        return !b.disabled;
      }) ?? body.closest(".ts-sheet")?.querySelector("[data-leave]");
      next?.focus();
    };
    refresh();
  });
}

function songHall(env, town) {
  return shell(env, town, "songs", (body, refreshPearls) => {
    const { state } = env;
    const refresh = () => {
      refreshPearls();
      const known = state.songs.map((id) => {
        return `<li>${escapeHtml(songById[id].name)} <small>${songById[id].kind}</small></li>`;
      }).join("");
      const song = town.teaches ? songById[town.teaches] : null;
      const learned = song && state.songs.includes(song.id);
      body.innerHTML = `
        ${song ? `<div class="ts-row"><div><b>${escapeHtml(song.name)}</b> <small>${song.kind}</small>
          <p>Creatures whose heart song this is: "${escapeHtml(song.hint)}"</p></div>
          <button type="button" class="ts-btn small" data-learn ${learned || state.pearls < songPrices[song.id] ? "disabled" : ""}>
          ${learned ? "Known" : `Learn · ${songPrices[song.id]} ◉`}</button></div>`
          : "<p class=\"ts-lead\">The song master here has taught all they know to the halls of other towns.</p>"}
        <h3>Your songs and dances</h3><ul class="ts-songs">${known}</ul>
        <p class="ts-note">Tip: every creature's Codex page has a hint about the song it loves.</p>`;
      body.querySelector("[data-learn]")?.addEventListener("click", () => {
        state.pearls -= songPrices[song.id];
        state.songs.push(song.id);
        env.sound("level");
        env.save();
        refresh();
      });
    };
    refresh();
  });
}

function creatureCard(c, action) {
  const species = creatureById(c.species);
  const max = statsFor(species, c.level).hp;
  const card = html(`
    <button type="button" class="ts-card">
      <span class="ts-card-art"></span>
      <b>${escapeHtml(species.name)}</b>
      <small>Lv ${c.level} · ${c.hp}/${max} HP</small>
      <small style="color:${elementInfo[species.element].color}">${elementInfo[species.element].label}</small>
      <em>${action}</em>
    </button>`);
  card.querySelector(".ts-card-art").append(creatureCanvas(species.id, 64).cloneNode(true));
  const art = card.querySelector("canvas");
  art.getContext("2d").drawImage(creatureCanvas(species.id, 64), 0, 0);
  return card;
}

function tidePool(env, town) {
  return shell(env, town, "pool", (body) => {
    const { state } = env;
    const refresh = () => {
      body.innerHTML = `<h3>Team (${state.party.length}/${partyLimit})</h3><div class="ts-grid" data-team></div>
        <h3>Tide Pool (${state.storage.length})</h3><div class="ts-grid" data-pool></div>
        <p class="ts-note">Your first team member leads every battle. Tap a creature to move it.</p>`;
      const team = body.querySelector("[data-team]");
      const pool = body.querySelector("[data-pool]");
      state.party.forEach((c, i) => {
        const card = creatureCard(c, i === 0 ? "Leader · to pool" : "To pool");
        card.addEventListener("click", () => {
          state.storage.push(...state.party.splice(i, 1));
          refresh();
        });
        team.append(card);
      });
      state.storage.forEach((c, i) => {
        const card = creatureCard(c, state.party.length < partyLimit ? "To team" : "Team full");
        card.disabled = state.party.length >= partyLimit;
        card.addEventListener("click", () => {
          state.party.push(...state.storage.splice(i, 1));
          refresh();
        });
        pool.append(card);
      });
      if (state.party.length === 0) team.textContent = "Nobody yet. Befriend creatures with songs!";
      if (state.storage.length === 0) pool.textContent = "Empty.";
    };
    refresh();
  });
}

export function enterBuilding(env, town, kind) {
  const open = { healer, pool: tidePool, shop, songs: songHall }[kind];
  return open(env, town);
}

export { creatureCard };

// The entrance to a legendary's lair: its picture, and a choice to go in.
export function visitLair(panels, lair, species) {
  return new Promise((resolve) => {
    panels.open("ts-town", (root) => {
      const view = html(`
        <div class="ts-sheet ts-lair">
          <header><h2>${escapeHtml(lair.name)}</h2></header>
          <div class="ts-sheet-body">
            <img class="ts-lair-art" src="${lairPicture(lair.zone)}" alt="">
            <p class="ts-lead">Something ancient stirs in the dark. ${escapeHtml(species.name)}, the
            legendary of these waters, is waiting. Legendaries only listen to their heart song.</p>
          </div>
          <footer>
            <button type="button" class="ts-btn go" data-go>Swim in</button>
            <button type="button" class="ts-btn ghost" data-leave>Not yet</button>
          </footer>
        </div>`);
      root.append(view);
      const finish = (go) => {
        panels.close();
        resolve(go);
      };
      view.querySelector("[data-go]").addEventListener("click", () => {
        finish(true);
      });
      view.querySelector("[data-leave]").addEventListener("click", () => {
        finish(false);
      });
      view.querySelector("[data-go]").focus();
    });
  });
}
