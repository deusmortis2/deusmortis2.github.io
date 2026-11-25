// Progress and saved lab code, kept in this browser's localStorage. Nothing
// is sent anywhere, so progress is per browser.
const progressKey = "arcadeTutorial.progress";
const codePrefix = "arcadeTutorial.code.";

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage blocked (private mode, say): progress just isn't kept.
  }
}

export function isDone(id) {
  return Boolean(readJson(progressKey, {})[id]);
}

export function markDone(id) {
  const done = readJson(progressKey, {});
  done[id] = true;
  writeJson(progressKey, done);
}

export function loadCode(labId) {
  return readJson(codePrefix + labId, null);
}

export function saveCode(labId, code) {
  writeJson(codePrefix + labId, code);
}

export function clearCode(labId) {
  try {
    localStorage.removeItem(codePrefix + labId);
  } catch {
    // Nothing was saved, so there's nothing to clear.
  }
}
