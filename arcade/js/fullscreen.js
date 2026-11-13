// A fullscreen toggle for a game. The button hides itself where the browser
// can't take an element fullscreen (iPhone Safari, for one).
function current() {
  return document.fullscreenElement ?? document.webkitFullscreenElement ?? null;
}

function enter(el) {
  if (el.requestFullscreen) return el.requestFullscreen();
  return el.webkitRequestFullscreen?.();
}

function leave() {
  if (document.exitFullscreen) return document.exitFullscreen();
  return document.webkitExitFullscreen?.();
}

// `target` goes fullscreen when `button` is clicked or F is pressed.
export function bindFullscreen(button, target) {
  const supported = document.fullscreenEnabled ?? document.webkitFullscreenEnabled;
  if (!supported) {
    button.hidden = true;
    return;
  }
  const toggle = () => {
    Promise.resolve(current() ? leave() : enter(target)).catch(() => {});
  };
  const render = () => {
    button.textContent = current() ? "Exit fullscreen" : "Fullscreen";
  };
  button.addEventListener("click", toggle);
  window.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() !== "f" || event.repeat) return;
    if (document.querySelector("dialog[open]")) return;
    toggle();
  });
  document.addEventListener("fullscreenchange", render);
  document.addEventListener("webkitfullscreenchange", render);
  render();
}
