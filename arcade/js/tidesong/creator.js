// Choosing your character: a mermaid or merman from the cast, shown exactly
// as drawn, plus a name. Three of each are open at first; the rest show as
// locked until adventures unlock them (unlocks.js). Resolves with the
// finished avatar, or null if the player backs out to the main menu.
// With `switching` (the avatar in play) it is the look picker offered at
// each unlock milestone: no name box, and it resolves with the new avatar,
// or null to keep the current one.
import { bodies } from "./avatar.js";
import { castList, drawCast, unlockOrder } from "./cast.js";
import { html } from "./panels.js";
import { drawPortrait, portraitHeight, portraitWidth } from "./portrait.js";
import { isUnlocked, nextUnlockAt, perUnlock, unlockedLooks } from "./unlocks.js";
import { escapeHtml } from "./util.js";

function renderPreview(canvas, avatar) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const g = ctx.createRadialGradient(150, 160, 20, 150, 220, 260);
  g.addColorStop(0, "#3fb7d9");
  g.addColorStop(1, "#0c3a5e");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  [[40, 380, 5], [262, 300, 4], [52, 120, 3], [250, 60, 6], [30, 250, 3]].forEach(([x, y, r]) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  });
  drawPortrait(ctx, avatar, 0, 0, 1);
}

function card(group, look, avatar, username) {
  const member = castList(group)[look];
  const open = isUnlocked(username, group, look);
  const on = open && look === avatar.look;
  const state = open ? "" : " locked";
  return `<button type="button" class="ts-cast-card${on ? " on" : ""}${state}" data-look="${look}"
    aria-pressed="${on}" ${open ? "" : "disabled"} aria-label="${escapeHtml(member.name)}${open ? "" : " (locked)"}">
    <canvas width="100" height="146"></canvas>
    <span>${open ? escapeHtml(member.name) : "Locked"}</span>
  </button>`;
}

export function runCreator(panels, username, { switching = null, title = "Choose your merfolk" } = {}) {
  const firstOpen = (group) => {
    return unlockedLooks(username, group)[0];
  };
  const avatar = switching
    ? { ...switching }
    : { body: 0, look: firstOpen("mermaids"), name: "" };
  if (!switching) avatar.name = castList("mermaids")[avatar.look].name;
  const nameBox = switching ? "" : `<label class="ts-name">Name <input maxlength="14" autocomplete="off" spellcheck="false"></label>`;
  const backLabel = switching ? "Keep my look" : "Back";
  const goLabel = switching ? "Switch!" : "Dive in!";
  return new Promise((resolve) => {
    panels.open("ts-creator-screen", (root) => {
      const view = html(`
        <div class="ts-creator">
          <div class="ts-preview">
            <canvas width="${portraitWidth}" height="${portraitHeight}" aria-label="Your character"></canvas>
            ${nameBox}
          </div>
          <div class="ts-options">
            <h2>${escapeHtml(title)}</h2>
            <div class="ts-body-tabs" role="group" aria-label="Mermaid or merman"></div>
            <p class="ts-note ts-unlock-note"></p>
            <div class="ts-cast"></div>
          </div>
          <div class="ts-creator-actions">
            <button type="button" class="ts-btn ghost" data-back>${backLabel}</button>
            <button type="button" class="ts-btn ghost" data-random>Surprise me</button>
            <button type="button" class="ts-btn go" data-begin>${goLabel}</button>
          </div>
        </div>`);
      root.append(view);
      const preview = view.querySelector(".ts-preview canvas");
      const tabs = view.querySelector(".ts-body-tabs");
      const note = view.querySelector(".ts-unlock-note");
      const grid = view.querySelector(".ts-cast");
      // Switching has no name box. The name then follows the character
      // only if it is still that character's own name.
      const name = view.querySelector("input") ?? { value: avatar.name };
      name.value = avatar.name;
      let typed = Boolean(switching)
        && avatar.name !== castList(bodies[avatar.body].group)[avatar.look].name;

      const pick = (look) => {
        const group = bodies[avatar.body].group;
        // Follow the character's name until the player types their own.
        avatar.look = look;
        if (!typed) {
          avatar.name = castList(group)[look].name;
          name.value = avatar.name;
        }
      };

      const refresh = () => {
        const group = bodies[avatar.body].group;
        tabs.innerHTML = bodies.map((b, i) => {
          const on = i === avatar.body;
          return `<button type="button" class="ts-btn small${on ? " go" : " ghost"}" data-body="${i}" aria-pressed="${on}">${b.plural}</button>`;
        }).join("");
        const open = unlockedLooks(username, group).length;
        note.textContent = open >= 12
          ? `All 12 ${bodies[avatar.body].plural.toLowerCase()} are unlocked!`
          : `${open} of 12 unlocked. Befriend ${nextUnlockAt(username)} creatures in one adventure to unlock ${perUnlock} more mermaids and ${perUnlock} more mermen.`;
        grid.innerHTML = unlockOrder[group].map((look) => {
          return card(group, look, avatar, username);
        }).join("");
        grid.querySelectorAll(".ts-cast-card").forEach((button) => {
          const ctx = button.querySelector("canvas").getContext("2d");
          drawCast(ctx, group, Number(button.dataset.look), 0, 0, 100, 146);
        });
        renderPreview(preview, avatar);
      };

      tabs.addEventListener("click", (event) => {
        const button = event.target.closest("[data-body]");
        if (!button) return;
        avatar.body = Number(button.dataset.body);
        pick(firstOpen(bodies[avatar.body].group));
        refresh();
        tabs.querySelector(`[data-body="${avatar.body}"]`)?.focus();
      });
      grid.addEventListener("click", (event) => {
        const button = event.target.closest("[data-look]");
        if (!button || button.disabled) return;
        pick(Number(button.dataset.look));
        refresh();
        grid.querySelector(`[data-look="${avatar.look}"]`)?.focus();
      });
      if (!switching) {
        name.addEventListener("input", () => {
          typed = name.value.trim() !== "";
          avatar.name = name.value;
        });
      }
      view.querySelector("[data-random]").addEventListener("click", () => {
        const open = unlockedLooks(username, bodies[avatar.body].group);
        pick(open[Math.floor(Math.random() * open.length)]);
        refresh();
      });
      view.querySelector("[data-back]").addEventListener("click", () => {
        panels.close();
        resolve(null);
      });
      view.querySelector("[data-begin]").addEventListener("click", () => {
        const fallback = castList(bodies[avatar.body].group)[avatar.look].name;
        avatar.name = name.value.trim().slice(0, 14) || fallback;
        panels.close();
        resolve({ ...avatar });
      });
      refresh();
    });
  });
}
