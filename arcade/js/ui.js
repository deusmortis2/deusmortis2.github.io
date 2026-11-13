// Shared setup for every game page: the sound button.
import { getSession } from "./auth.js";
import { isMuted, toggleMute } from "./sound.js";

export function initPage() {
  const mute = document.querySelector("[data-mute]");
  if (mute) {
    const render = () => {
      mute.textContent = isMuted() ? "Sound: off" : "Sound: on";
    };
    render();
    mute.addEventListener("click", () => {
      toggleMute();
      render();
    });
  }
  return getSession();
}
