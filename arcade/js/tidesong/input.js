// Keyboard and touch input. Movement is a vector; one-shot actions (menu,
// codex, map, bag, the four rhythm lanes) are queued until read.
const moveKeys = {
  a: [-1, 0], arrowdown: [0, 1], arrowleft: [-1, 0], arrowright: [1, 0],
  arrowup: [0, -1], d: [1, 0], s: [0, 1], w: [0, -1],
};

const actionKeys = {
  b: "bag", c: "codex", enter: "confirm", escape: "menu", m: "map", p: "party", " ": "confirm",
};

// Rhythm lanes: 0 left, 1 down, 2 up, 3 right. Arrow keys or WASD, the
// same keys you swim with.
const laneKeys = {
  a: 0, arrowdown: 1, arrowleft: 0, arrowright: 3, arrowup: 2, d: 3, s: 1, w: 2,
};

function typing(event) {
  const el = event.target;
  return el instanceof HTMLElement && (el.isContentEditable || ["INPUT", "SELECT", "TEXTAREA"].includes(el.tagName));
}

export function createInput(stickEl) {
  const held = new Set();
  const actions = [];
  const lanes = [];
  const stick = { active: false, x: 0, y: 0 };
  let touchUsed = false;

  window.addEventListener("keydown", (event) => {
    if (typing(event) || document.querySelector("dialog[open]")) return;
    const key = event.key.toLowerCase();
    // Let Enter and Space press a focused button as normal.
    if ((key === "enter" || key === " ") && event.target instanceof HTMLButtonElement) return;
    if (moveKeys[key] || actionKeys[key] || laneKeys[key] !== undefined) event.preventDefault();
    if (moveKeys[key]) held.add(key);
    if (event.repeat) return;
    if (actionKeys[key]) actions.push(actionKeys[key]);
    if (laneKeys[key] !== undefined) lanes.push({ lane: laneKeys[key], time: performance.now() });
  });
  window.addEventListener("keyup", (event) => {
    held.delete(event.key.toLowerCase());
  });
  window.addEventListener("blur", () => {
    held.clear();
    stick.active = false;
  });

  // The joystick: drag anywhere inside its circle.
  const knob = stickEl.querySelector(".ts-knob");
  const moveStick = (event) => {
    const rect = stickEl.getBoundingClientRect();
    const r = rect.width / 2;
    let dx = (event.clientX - rect.left - r) / r;
    let dy = (event.clientY - rect.top - r) / r;
    const len = Math.hypot(dx, dy);
    if (len > 1) {
      dx /= len;
      dy /= len;
    }
    stick.x = Math.abs(dx) < 0.18 ? 0 : dx;
    stick.y = Math.abs(dy) < 0.18 ? 0 : dy;
    knob.style.transform = `translate(${dx * 40}%, ${dy * 40}%)`;
  };
  stickEl.addEventListener("pointerdown", (event) => {
    stick.active = true;
    stickEl.setPointerCapture(event.pointerId);
    moveStick(event);
  });
  stickEl.addEventListener("pointermove", (event) => {
    if (stick.active) moveStick(event);
  });
  const release = () => {
    stick.active = false;
    stick.x = 0;
    stick.y = 0;
    knob.style.transform = "";
  };
  stickEl.addEventListener("pointerup", release);
  stickEl.addEventListener("pointercancel", release);

  window.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "touch" || touchUsed) return;
    touchUsed = true;
    document.body.classList.add("ts-touch");
  });

  return {
    clearLanes() {
      lanes.length = 0;
    },
    direction() {
      let x = stick.x;
      let y = stick.y;
      held.forEach((key) => {
        x += moveKeys[key][0];
        y += moveKeys[key][1];
      });
      const len = Math.hypot(x, y);
      return len > 1 ? { x: x / len, y: y / len } : { x, y };
    },
    flush() {
      actions.length = 0;
      lanes.length = 0;
    },
    nextAction() {
      return actions.shift() ?? null;
    },
    pressLane(lane) {
      lanes.push({ lane, time: performance.now() });
    },
    push(action) {
      actions.push(action);
    },
    takeLanes() {
      return lanes.splice(0);
    },
  };
}
