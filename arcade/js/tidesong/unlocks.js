// Which merfolk a player can choose. Three mermaids and three mermen are
// open from the start. Each adventure that befriends `unlockGoal`
// creatures opens three more of each for the player's next adventures.
// Unlocks belong to the arcade login and survive starting a new character.
import { unlockOrder } from "./cast.js";

export const unlockGoal = 25;
export const perUnlock = 3;
const total = 12;

function key(username) {
  return `tidesong:unlocks:${username || "guest"}`;
}

// How many playthroughs have reached the goal so far.
export function unlockTier(username) {
  try {
    const tier = Number(JSON.parse(localStorage.getItem(key(username)))?.tier);
    return Number.isInteger(tier) && tier > 0 ? tier : 0;
  } catch {
    return 0;
  }
}

function saveTier(username, tier) {
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

// Call after anything that can befriend a creature. The first time this
// adventure reaches the goal, the next three of each unlock. Returns true
// when something new was unlocked, so the game can say so.
export function claimUnlock(state, username) {
  if (state.unlockClaimed || state.caught.length < unlockGoal) return false;
  state.unlockClaimed = true;
  if (unlockedCount(username) >= total) return false;
  saveTier(username, unlockTier(username) + 1);
  return true;
}
