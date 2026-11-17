// Free-play build: no logins, so no leaderboard.
const done = Promise.resolve();

export const spireclashBots = ["squire", "knight", "archmage"];
export const tidesongGoal = 150;

export function recordTicTacToeWin() {
  return done;
}

export function recordRun() {
  return done;
}

export function recordSpireclashWin() {
  return done;
}

export function tidesongBetter() {
  return false;
}

export function recordTidesong() {
  return done;
}
