// DOM panels that sit over the game canvas: the battle message box with its
// buttons, full-screen overlays (creator, towns, codex...) and toasts.
// Battle and town flows are written as async code that awaits say() and
// choose(), which keeps the turn logic readable.
import { escapeHtml } from "./util.js";

export function createPanels(frame) {
  const battle = frame.querySelector(".ts-battle");
  const message = battle.querySelector(".ts-msg");
  const actions = battle.querySelector(".ts-actions");
  const overlay = frame.querySelector(".ts-overlay");
  const toastEl = frame.querySelector(".ts-toast");
  let toastTimer = 0;

  // Arrow keys or WASD move focus between buttons in a button group. Focus
  // goes to the nearest button in that direction on screen, so up and down
  // move between rows of a grid. With nothing that way, it wraps in order.
  const navKeys = {
    a: [-1, 0], arrowdown: [0, 1], arrowleft: [-1, 0], arrowright: [1, 0],
    arrowup: [0, -1], d: [1, 0], s: [0, 1], w: [0, -1],
  };
  const centre = (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };
  const arrowFocus = (container) => {
    container.onkeydown = (event) => {
      const dir = navKeys[event.key.toLowerCase()];
      if (!dir || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable
        || ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName))) return;
      const buttons = [...container.querySelectorAll("button:not([disabled])")].filter((b) => {
        return b.offsetParent !== null;
      });
      const at = buttons.indexOf(document.activeElement);
      if (at < 0) return;
      event.preventDefault();
      event.stopPropagation();
      const from = centre(buttons[at]);
      let best = null;
      let bestScore = Infinity;
      buttons.forEach((b, i) => {
        if (i === at) return;
        const to = centre(b);
        const along = (to.x - from.x) * dir[0] + (to.y - from.y) * dir[1];
        if (along < 4) return;
        const across = Math.abs((to.x - from.x) * dir[1] + (to.y - from.y) * dir[0]);
        // Favour buttons straight ahead over ones off to the side.
        const score = along + across * 2;
        if (score < bestScore) {
          bestScore = score;
          best = b;
        }
      });
      if (best) {
        best.focus({ preventScroll: false });
        return;
      }
      const step = dir[0] + dir[1];
      buttons[(at + step + buttons.length) % buttons.length].focus();
    };
  };

  // If a menu is up but focus fell off it (a button you pressed got disabled
  // or rebuilt), the first WASD or arrow press lands on its first button.
  window.addEventListener("keydown", (event) => {
    if (!navKeys[event.key.toLowerCase()] || document.querySelector("dialog[open]")) return;
    const active = document.activeElement;
    if (active && active !== document.body) return;
    const group = !overlay.hidden ? overlay : !battle.hidden ? actions : null;
    const first = group && [...group.querySelectorAll("button:not([disabled])")].find((b) => {
      return b.offsetParent !== null;
    });
    if (!first) return;
    event.preventDefault();
    event.stopPropagation();
    first.focus();
  }, true);

  const say = (text, { hold = false } = {}) => {
    battle.hidden = false;
    message.textContent = text;
    actions.replaceChildren();
    return new Promise((resolve) => {
      const wait = hold ? 0 : 900 + text.length * 28;
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        battle.onclick = null;
        window.removeEventListener("keydown", onKey, true);
        clearTimeout(timer);
        resolve();
      };
      const onKey = (event) => {
        if (["Enter", " ", "z"].includes(event.key)) {
          event.preventDefault();
          event.stopPropagation();
          finish();
        }
      };
      const timer = hold ? 0 : setTimeout(finish, wait);
      setTimeout(() => {
        battle.onclick = finish;
        window.addEventListener("keydown", onKey, true);
      }, 180);
    });
  };

  // options: [{ label, value, sub, disabled, tone }]. Resolves with value.
  const choose = (prompt, options, { columns } = {}) => {
    battle.hidden = false;
    message.textContent = prompt;
    const fit = options.length > 6 ? 4 : options.length > 4 ? 3 : 2;
    actions.style.setProperty("--cols", String(columns ?? fit));
    return new Promise((resolve) => {
      const buttons = options.map((opt) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `ts-choice ${opt.tone ?? ""}`;
        button.disabled = Boolean(opt.disabled);
        button.innerHTML = `<span>${escapeHtml(opt.label)}</span>${opt.sub ? `<small>${escapeHtml(opt.sub)}</small>` : ""}`;
        if (opt.color) button.style.setProperty("--tone", opt.color);
        button.addEventListener("click", (event) => {
          event.stopPropagation();
          actions.replaceChildren();
          resolve(opt.value);
        });
        return button;
      });
      actions.replaceChildren(...buttons);
      arrowFocus(actions);
      buttons.find((b) => {
        return !b.disabled;
      })?.focus({ preventScroll: true });
    });
  };

  const hideBattle = () => {
    battle.hidden = true;
    actions.replaceChildren();
    message.textContent = "";
  };

  // Shows a full overlay. `build` fills the panel element; returns a close fn.
  const open = (className, build) => {
    overlay.hidden = false;
    overlay.className = `ts-overlay ${className}`;
    overlay.replaceChildren();
    build(overlay);
    arrowFocus(overlay);
    return close;
  };

  const close = () => {
    overlay.hidden = true;
    overlay.replaceChildren();
  };

  const toast = (text, ms = 2600) => {
    toastEl.textContent = text;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.hidden = true;
    }, ms);
  };

  return {
    choose,
    close,
    hideBattle,
    isOpen: () => {
      return !overlay.hidden;
    },
    open,
    say,
    toast,
  };
}

// Builds an element from an HTML string (trusted templates only; any
// player-typed text must go through escapeHtml first).
export function html(markup) {
  const template = document.createElement("template");
  template.innerHTML = markup.trim();
  return template.content.firstElementChild;
}
