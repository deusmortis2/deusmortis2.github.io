// Which merfolk a player can choose. Three mermaids and three mermen are
// open from the start. An adventure that befriends 25, 50 and 75 creatures
// opens three more of each at every one of those steps, straight away.
// Unlocks belong to the arcade login and survive starting a new character.
import { unlockOrder } from "./cast.js";

// Befriended counts that unlock the next three of each.
export const unlockSteps = [25, 50, 75];
export const perUnlock = 3;
const total = 12;

function key(username) {
  return `tidesong:unlocks:${username || "guest"}`;
}

// How many unlock steps this login has reached, in its best adventure.
export function unlockTier(username) {
  try {
    const tier = Number(JSON.parse(localStorage.getItem(key(username)))?.tier);
    return Number.isInteger(tier) && tier > 0 ? tier : 0;
  } catch {
    return 0;
  }
}

export function setUnlockTier(username, tier) {
  try {
    localStorage.setItem(key(username), JSON.stringify({ tier }));
  } catch {
    // Storage can be blocked; unlocks then last for this session only.
  }
}

export function unlockedCount(username) {
  return Math.min(total, perUnlock * (1 + unlockTier(username)));
}

// The character indices open to this player, in unlock order.
export function unlockedLooks(username, group) {
  return unlockOrder[group].slice(0, unlockedCount(username));
}

export function isUnlocked(username, group, look) {
  return unlockedLooks(username, group).includes(look);
}

// The befriended count that unlocks the next three, for the creator's note.
export function nextUnlockAt(username) {
  return unlockSteps[Math.min(unlockTier(username), unlockSteps.length - 1)];
}

// How many unlock steps an adventure has reached. Saves from before the
// steps only flag the first one (`unlockClaimed`).
function stepsReached(state) {
  if (Number.isInteger(state.unlockStep)) return state.unlockStep;
  return state.unlockClaimed ? 1 : 0;
}

// Call after anything that can befriend a creature. The first time this
// adventure reaches an unlock step, the login's unlocks catch up to it.
// Returns null, or { count, fresh } for the step just reached: `count` is
// how many were befriended, and `fresh` is true when it opened characters
// this login did not have yet. Either way the game offers a new look.
export function claimUnlock(state, username) {
  const before = stepsReached(state);
  const reached = unlockSteps.filter((n) => {
    return state.caught.length >= n;
  }).length;
  if (reached <= before) return null;
  state.unlockStep = reached;
  delete state.unlockClaimed;
  const fresh = reached > unlockTier(username);
  if (fresh) setUnlockTier(username, reached);
  return { count: unlockSteps[reached - 1], fresh };
}
