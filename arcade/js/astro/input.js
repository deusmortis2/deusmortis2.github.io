// Keyboard and touch input. Actions are left, right, jump, down, fire,
// start, cont (continue a saved mission) and restart (back to Mercury
// after a game over).
const keyActions = {
  " ": "jump",
  a: "left",
  arrowdown: "down",
  arrowleft: "left",
  arrowright: "right",
  arrowup: "jump",
  c: "cont",
  d: "right",
  j: "fire",
  r: "restart",
  enter: "start",
  s: "down",
  w: "jump",
  x: "fire",
  z: "jump",
};

// On-screen buttons in canvas pixels, shown once the screen is touched.
export const touchButtons = [
  { action: "left", label: "<", r: 52, x: 80, y: 462 },
  { action: "right", label: ">", r: 52, x: 205, y: 462 },
  { action: "down", label: "V", r: 52, x: 755, y: 462 },
  { action: "jump", label: "^", r: 60, x: 880, y: 420 },
  // Only shown (and only works) while the blaster is on.
  { action: "fire", label: "*", r: 44, x: 880, y: 300 },
];

export function createInput(canvas, viewWidth) {
  const keys = new Set();
  const fresh = new Set();
  const touches = new Map();
  // Where the last tap or click landed, in canvas pixels.
  const state = { tap: null, touch: false };

  const press = (action) => {
    fresh.add(action);
  };

  window.addEventListener("keydown", (event) => {
    if (document.querySelector("dialog[open]")) return;
    const action = keyActions[event.key.toLowerCase()];
    if (!action) return;
    event.preventDefault();
    if (!event.repeat) press(action);
    if (action === "jump" && !event.repeat) press("start");
    keys.add(action);
  });
  window.addEventListener("keyup", (event) => {
    keys.delete(keyActions[event.key.toLowerCase()]);
  });
  window.addEventListener("blur", () => {
    keys.clear();
    touches.clear();
  });


  const canvasPoint = (event) => {
    const rect = canvas.getBoundingClientRect();
    const scale = viewWidth / rect.width;
    return {
      x: (event.clientX - rect.left) * scale,
      y: (event.clientY - rect.top) * scale,
    };
  };

  canvas.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch") state.touch = true;
    canvas.setPointerCapture(event.pointerId);
    state.tap = canvasPoint(event);
    const button = state.touch ? buttonAt(state.tap) : null;
    press("start");
    if (!button) return;
    touches.set(event.pointerId, button.action);
    press(button.action);
  });
  const buttonAt = ({ x, y }) => {
    return touchButtons.find((b) => Math.hypot(b.x - x, b.y - y) < b.r * 1.3);
  };

  canvas.addEventListener("pointermove", (event) => {
    if (!touches.has(event.pointerId)) return;
    const button = buttonAt(canvasPoint(event));
    // Sliding a thumb from left to right swaps direction without lifting.
    const isMove = button && ["left", "right"].includes(button.action);
    if (isMove) touches.set(event.pointerId, button.action);
  });
  const release = (event) => {
    touches.delete(event.pointerId);
  };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);

  return {
    clear() {
      keys.clear();
      fresh.clear();
      touches.clear();
    },
    // Call once per frame after the game has read this frame's presses.
    endFrame() {
      fresh.clear();
    },
    held(action) {
      return keys.has(action) || [...touches.values()].includes(action);
    },
    pressed(action) {
      return fresh.has(action);
    },
    state,
  };
}
