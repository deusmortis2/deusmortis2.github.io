// Keyboard, swipe and tap input. Arrow keys or WASD steer, space boosts
// (hold), B uses the stored power-up. On a touch screen, swipe on the
// board to steer and use the BOOST and POWER buttons under it.
import { width } from "./board.js";

const steering = {
  a: "left",
  arrowdown: "down",
  arrowleft: "left",
  arrowright: "right",
  arrowup: "up",
  d: "right",
  s: "down",
  w: "up",
};

const gameKeys = [...Object.keys(steering), " ", "enter", "b", "r", "c"];

// `handlers`: onSteer(name), onKey(key), onTap(point). Returns an object
// whose `boosting` is true while space or the BOOST button is held.
export function bindInput(canvas, handlers, buttons) {
  const state = { boosting: false };
  window.addEventListener("keydown", (event) => {
    if (document.querySelector("dialog[open]")) return;
    const key = event.key.toLowerCase();
    if (!gameKeys.includes(key)) return;
    event.preventDefault();
    if (key === " ") state.boosting = true;
    if (event.repeat) return;
    if (steering[key]) handlers.onSteer(steering[key]);
    handlers.onKey(key);
  });
  window.addEventListener("keyup", (event) => {
    if (event.key === " ") state.boosting = false;
  });
  window.addEventListener("blur", () => {
    state.boosting = false;
  });
  bindSwipe(canvas, handlers);
  bindButtons(buttons, state, handlers);
  return state;
}

function toCanvas(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const scale = width / rect.width;
  return { x: (event.clientX - rect.left) * scale, y: (event.clientY - rect.top) * scale };
}

function swipeDirection(dx, dy) {
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "right" : "left";
  return dy > 0 ? "down" : "up";
}

// Each 24px of dragging in one direction counts as a swipe, so a long
// drag round a corner can steer twice. A touch that hardly moves is a tap.
function bindSwipe(canvas, handlers) {
  let drag = null;
  canvas.addEventListener("pointerdown", (event) => {
    canvas.setPointerCapture(event.pointerId);
    drag = { moved: false, x: event.clientX, y: event.clientY };
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!drag) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    handlers.onSteer(swipeDirection(dx, dy));
    drag = { moved: true, x: event.clientX, y: event.clientY };
  });
  canvas.addEventListener("pointerup", (event) => {
    if (drag && !drag.moved) handlers.onTap(toCanvas(canvas, event));
    drag = null;
  });
  canvas.addEventListener("pointercancel", () => {
    drag = null;
  });
}

function bindButtons(buttons, state, handlers) {
  const { boost, power } = buttons;
  boost.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    state.boosting = true;
  });
  ["pointerup", "pointerleave", "pointercancel"].forEach((type) => {
    boost.addEventListener(type, () => {
      state.boosting = false;
    });
  });
  power.addEventListener("click", () => handlers.onKey("b"));
}
