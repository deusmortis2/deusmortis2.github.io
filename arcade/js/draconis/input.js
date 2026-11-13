// Keyboard and pointer input. Arrow keys or WASD fly, space fires, 1 to 3
// pick a power-up. Dragging flies, a quick tap fires, and tapping a
// power-up card picks it.
import { width } from "./entities.js";

const gameKeys = [
  "arrowup", "arrowdown", "arrowleft", "arrowright",
  "w", "a", "s", "d", " ", "enter", "1", "2", "3",
];

// `handlers` has onAction(input), onPick(index), pickAt(point) and
// onDrag(dx, dy). Returns the set of keys currently held down.
export function bindInput(canvas, handlers) {
  const keys = new Set();
  window.addEventListener("keydown", (event) => {
    if (document.querySelector("dialog[open]")) return;
    const key = event.key.toLowerCase();
    if (!gameKeys.includes(key)) return;
    event.preventDefault();
    if (event.repeat) return;
    if (key === " ") handlers.onAction("fire");
    if (key === "enter") handlers.onAction("enter");
    if (["1", "2", "3"].includes(key)) handlers.onPick(Number(key) - 1);
    keys.add(key);
  });
  window.addEventListener("keyup", (event) => {
    keys.delete(event.key.toLowerCase());
  });
  window.addEventListener("blur", () => keys.clear());

  let drag = null;
  const scale = () => width / canvas.getBoundingClientRect().width;
  const toCanvas = (event) => {
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * scale(), y: (event.clientY - rect.top) * scale() };
  };
  canvas.addEventListener("pointerdown", (event) => {
    const card = handlers.pickAt(toCanvas(event));
    if (card >= 0) {
      handlers.onPick(card);
      drag = null;
      return;
    }
    canvas.setPointerCapture(event.pointerId);
    drag = { moved: 0, x: event.clientX, y: event.clientY };
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!drag) return;
    const dx = (event.clientX - drag.x) * scale();
    const dy = (event.clientY - drag.y) * scale();
    drag.moved += Math.abs(dx) + Math.abs(dy);
    drag.x = event.clientX;
    drag.y = event.clientY;
    handlers.onDrag(dx, dy);
  });
  canvas.addEventListener("pointerup", () => {
    if (drag && drag.moved < 8) handlers.onAction("tap");
    drag = null;
  });
  canvas.addEventListener("pointercancel", () => {
    drag = null;
  });
  return keys;
}
