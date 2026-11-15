// The player's whole adventure, plus saving and loading it. Saves live in
// this browser's localStorage: each arcade login has a few save slots, so
// you can keep several characters and switch between them.
import { sanitiseAvatar } from "./avatar.js";
import { creatureById, makeCreature, statsFor } from "./creatures.js";
import { items, startingSongs } from "./data.js";
import { oldTownIds, zones } from "./zones.js";

// Version 2: the regions were repainted, so positions are pixels inside a
// region (state.zone) and `visited` lists region ids.
const saveVersion = 2;
export const partyLimit = 4;
export const startLevel = 5;

export const saveSlots = 3;

// Slot 0 keeps the key from before there were slots, so older saves turn
// up in the first slot without being moved.
export function saveKey(username, slot = 0) {
  const base = `tidesong:save:${username || "guest"}`;
  return slot ? `${base}:${slot + 1}` : base;
}

export function newState(avatar, start) {
  return {
    avatar,
    calmSteps: 0,
    caught: [],
    charm: 1,
    // Wild battles since you last met a creature you hadn't befriended.
    discovery: 0,
    items: { echoShell: 2, salve: 20 },
    keys: [],
    lastTown: "coralhaven",
    lowGraphics: false,
    party: [],
    pearls: 150,
    player: {
      boosts: { atk: 0, def: 0, hp: 0, spd: 0 },
      bought: {},
      hp: 0,
      level: startLevel,
      x: start.x,
      xp: startLevel ** 3,
      y: start.y,
    },
    reactions: {},
    seen: [],
    songs: [...startingSongs],
    steps: 0,
    storage: [],
    version: saveVersion,
    visited: [],
    zone: start.zone ?? "prismreef",
  };
}

// The mermaid's stats grow with level, plus anything bought in shops.
export function playerStats(state) {
  const { boosts, level } = state.player;
  const grow = (base) => {
    return Math.floor((base * 2 * level * 1.1) / 50);
  };
  return {
    atk: grow(62) + 8 + boosts.atk,
    def: grow(56) + 8 + boosts.def,
    hp: grow(72) + level + 22 + boosts.hp,
    spd: grow(60) + 8 + boosts.spd,
  };
}

export function playerMoves(state) {
  const list = ["tailSlap", "bubble"];
  if (state.keys.includes("trident")) list.push("trident");
  return list;
}

export function healAll(state) {
  const stats = playerStats(state);
  state.player.hp = stats.hp;
  [...state.party, ...state.storage].forEach((c) => {
    c.hp = statsFor(creatureById(c.species), c.level).hp;
  });
}

export function addItem(state, id, count = 1) {
  state.items[id] = (state.items[id] ?? 0) + count;
}

export function useUpItem(state, id) {
  state.items[id] -= 1;
  if (state.items[id] <= 0) delete state.items[id];
}

export function markSeen(state, id) {
  if (!state.seen.includes(id)) state.seen.push(id);
}

export function hasCaught(state, id) {
  return state.caught.includes(id);
}

// Puts a captured creature in the party, or in storage once it's full.
export function addCaptured(state, species, level, hp) {
  const creature = makeCreature(species, level);
  creature.hp = hp;
  if (!state.caught.includes(species.id)) state.caught.push(species.id);
  markSeen(state, species.id);
  if (state.party.length < partyLimit) {
    state.party.push(creature);
    return "party";
  }
  state.storage.push(creature);
  return "storage";
}

// Each region's legendary leaves its key item behind (see `drops` in
// zones.js). Returns the key if it's new to you, otherwise null.
export function claimLegendKey(state, species) {
  const key = species.rarity === "legendary" ? zones[species.zone]?.drops : null;
  if (!key || state.keys.includes(key)) return null;
  state.keys.push(key);
  return key;
}

// What a creature's reaction to a song has taught you: heart, liked or none.
export function learnReaction(state, speciesId, songId, reaction) {
  state.reactions[speciesId] ??= {};
  state.reactions[speciesId][songId] = reaction;
}

export function knownHeart(state, species) {
  const known = state.reactions[species.id] ?? {};
  return Object.keys(known).find((song) => {
    return known[song] === "heart";
  }) ?? null;
}

// What each slot last held, so savedAt only moves when something changed.
const lastSaved = {};

export function saveGame(state, username, slot = 0) {
  const key = saveKey(username, slot);
  const { savedAt, ...rest } = state;
  const body = JSON.stringify(rest);
  // When this adventure last changed. The copy saved last wins when saves
  // are synced between computers (see cloud.js).
  if (!savedAt || body !== lastSaved[key]) state.savedAt = Date.now();
  lastSaved[key] = body;
  try {
    localStorage.setItem(key, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

function validCreature(c) {
  return c && Number.isInteger(c.species) && creatureById(c.species) && Number.isFinite(c.level);
}

export function loadGame(username, slot = 0) {
  let raw = null;
  try {
    raw = JSON.parse(localStorage.getItem(saveKey(username, slot)));
  } catch {
    return null;
  }
  if (!raw || !raw.player) return null;
  // Saves from before the repaint keep everything except where you are: you
  // wake up in the town of the same difficulty as the one you last rested in.
  if (raw.version === 1) {
    raw.lastTown = oldTownIds[raw.lastTown] ?? "coralhaven";
    raw.visited = [];
    raw.zone = null;
    raw.version = saveVersion;
  }
  if (raw.version !== saveVersion) return null;
  const fresh = newState(sanitiseAvatar(raw.avatar), { x: 0, y: 0 });
  const state = { ...fresh, ...raw, avatar: sanitiseAvatar(raw.avatar) };
  state.player = { ...fresh.player, ...raw.player };
  state.player.boosts = { ...fresh.player.boosts, ...raw.player.boosts };
  // Songs no longer use up voice, so older saves drop it.
  delete state.player.voice;
  delete state.player.boosts.voice;
  delete state.player.bought.voiceConch;
  state.party = (raw.party ?? []).filter(validCreature).slice(0, partyLimit);
  state.storage = (raw.storage ?? []).filter(validCreature);
  // An unknown region means the game puts you back in your last town.
  if (!zones[state.zone]) state.zone = null;
  // A region that has shrunk since the save can leave you past its edge.
  // Then you wake up in your last town too.
  const here = zones[state.zone];
  if (here && (state.player.x > here.width || state.player.y > here.height)) {
    state.zone = null;
  }
  state.visited = (raw.visited ?? []).filter((id) => {
    return zones[id];
  });
  state.items = Object.fromEntries(Object.entries(raw.items ?? {}).filter(([id, n]) => {
    return items[id] && n > 0;
  }));
  // Keys used to be bought in shops. A save that befriended a legendary
  // before keys dropped from them gets that legendary's key now.
  state.keys = [...(raw.keys ?? [])];
  (raw.caught ?? []).forEach((id) => {
    const species = creatureById(id);
    if (species) claimLegendKey(state, species);
  });
  return state;
}

// Every slot in order, with null for an empty one.
export function listSaves(username) {
  return Array.from({ length: saveSlots }, (_, slot) => {
    return loadGame(username, slot);
  });
}

// The slot keeps when it was deleted, so a synced copy from another
// computer can't bring the adventure back.
export function deleteSave(username, slot = 0) {
  try {
    localStorage.setItem(saveKey(username, slot), JSON.stringify({ deletedAt: Date.now() }));
  } catch {
    // Storage blocked: nothing to delete.
  }
}
