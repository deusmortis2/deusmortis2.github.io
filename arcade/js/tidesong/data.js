// Songs and dances, battle moves, element matchups and shop items.

// Each creature has one heart song (it is entranced) and one song it likes.
// Each song's music, and so its notes in the rhythm game, is in tunes.js.
// `hint` is what the Codex says about a creature whose heart song this is.
export const songs = [
  {
    hint: "Drowsy and slow. A soft, gentle tune might soothe it.",
    id: "lullaby", kind: "Song", name: "Lullaby of the Deep",
  },
  {
    hint: "Bounces about restlessly, as if it wants to dance.",
    id: "jig", kind: "Dance", name: "Bubble Jig",
  },
  {
    hint: "Sways gracefully with the current, round and round.",
    id: "waltz", kind: "Dance", name: "Coral Waltz",
  },
  {
    hint: "Darts about at high speed and never stops still.",
    id: "reel", kind: "Dance", name: "Riptide Reel",
  },
  {
    hint: "Gazes upwards at faint, far-off light.",
    id: "hum", kind: "Song", name: "Moonlit Hum",
  },
  {
    hint: "Calls out into the blue, then listens for an answer.",
    id: "echo", kind: "Song", name: "Whalesong Echo",
  },
  {
    hint: "Crackles with restless energy, like the air before thunder.",
    id: "chant", kind: "Song", name: "Storm Chant",
  },
  {
    hint: "Lurks in the shadows and shies away from anything bright.",
    id: "dirge", kind: "Song", name: "Abyssal Dirge",
  },
];

export const songById = Object.fromEntries(songs.map((s) => {
  return [s.id, s];
}));

export const startingSongs = ["lullaby", "jig"];
export const songPrices = {
  chant: 500, dirge: 600, echo: 400, hum: 300, jig: 0, lullaby: 0, reel: 200, waltz: 100,
};

export const elements = ["tide", "coral", "frost", "vent", "storm", "glow", "shade"];

export const elementInfo = {
  coral: { color: "#ff6fa8", label: "Coral" },
  frost: { color: "#a8e6ff", label: "Frost" },
  glow: { color: "#7dffd9", label: "Glow" },
  shade: { color: "#9b7bff", label: "Shade" },
  storm: { color: "#ffe14d", label: "Storm" },
  tide: { color: "#4db3ff", label: "Tide" },
  vent: { color: "#ff7a3d", label: "Vent" },
};

// Attacker element -> the elements it hits hard. Each element is strong
// against two and weak against two.
export const strongAgainst = {
  coral: ["tide", "storm"],
  frost: ["coral", "glow"],
  glow: ["shade", "vent"],
  shade: ["glow", "storm"],
  storm: ["tide", "shade"],
  tide: ["vent", "frost"],
  vent: ["coral", "frost"],
};

export function typeMultiplier(attack, defend) {
  if (!attack || attack === "none") return 1;
  if (strongAgainst[attack]?.includes(defend)) return 1.6;
  if (strongAgainst[defend]?.includes(attack)) return 0.65;
  return 1;
}

// Moves. Creatures know `basic` plus their element's two moves (the second
// from level 12). The mermaid has her or his own set.
export const moves = {
  bubble: { element: "tide", name: "Bubble Burst", power: 50 },
  coral1: { element: "coral", name: "Coral Lash", power: 45 },
  coral2: { element: "coral", name: "Reef Crush", power: 75 },
  frost1: { element: "frost", name: "Frost Nip", power: 45 },
  frost2: { element: "frost", name: "Glacier Ram", power: 75 },
  glow1: { element: "glow", name: "Dazzle", power: 45 },
  glow2: { element: "glow", name: "Prism Beam", power: 75 },
  shade1: { element: "shade", name: "Shadow Bite", power: 45 },
  shade2: { element: "shade", name: "Void Pulse", power: 75 },
  storm1: { element: "storm", name: "Spark", power: 45 },
  storm2: { element: "storm", name: "Thunder Coil", power: 75 },
  tackle: { element: "none", name: "Tackle", power: 38 },
  tailSlap: { element: "none", name: "Tail Slap", power: 42 },
  tide1: { element: "tide", name: "Splash", power: 45 },
  tide2: { element: "tide", name: "Riptide", power: 75 },
  trident: { element: "none", name: "Trident Strike", power: 80 },
  vent1: { element: "vent", name: "Ember Spit", power: 45 },
  vent2: { element: "vent", name: "Magma Burst", power: 75 },
};

export const secondMoveLevel = 12;

// kind: heal (hp), charm (capture boost), revive,
// calm (fewer encounters), boost (permanent stat), key (opens a region),
// gear (a new move).
export const items = {
  calmInk: { desc: "Fewer wild encounters for the next 150 steps.", kind: "calm", name: "Calm Ink", price: 30, value: 150 },
  echoShell: { desc: "Your next song is 1.5 times as likely to capture.", kind: "charm", name: "Echo Shell", price: 40, value: 1.5 },
  elixir: { desc: "Fully heals you or a companion.", kind: "heal", name: "Deep Elixir", price: 150, value: 9999 },
  guardShell: { desc: "Permanently raises your Defence by 3.", kind: "boost", name: "Guard Shell", price: 250, stat: "def", value: 3 },
  heartCoral: { desc: "Permanently raises your max HP by 15.", kind: "boost", name: "Heart Coral", price: 300, stat: "hp", value: 15 },
  heatWard: { desc: "Shields you from the scalding vents of Abyssal Anchor.", kind: "key", name: "Heat Ward", price: 2000 },
  lanternJelly: { desc: "A glowing friend that lights the dark of Gloomveil Depths.", kind: "key", name: "Lantern Jelly", price: 1200 },
  pearlCharm: { desc: "Your next song is 2.2 times as likely to capture.", kind: "charm", name: "Pearl Charm", price: 120, value: 2.2 },
  pressurePearl: { desc: "Lets you swim the fierce currents off Fangshore Coast.", kind: "key", name: "Pressure Pearl", price: 2600 },
  revive: { desc: "Revives a fainted companion with half HP.", kind: "revive", name: "Revival Coral", price: 70, value: 0.5 },
  ruinKey: { desc: "Opens the sealed waterways of Brinewallow Fen.", kind: "key", name: "Ruin Key", price: 400 },
  salve: { desc: "Heals 35 HP.", kind: "heal", name: "Sea Salve", price: 15, value: 35 },
  stormCharm: { desc: "Calms the lightning around Cragspire Bluff.", kind: "key", name: "Storm Charm", price: 1600 },
  strengthPearl: { desc: "Permanently raises your Attack by 3.", kind: "boost", name: "Strength Pearl", price: 250, stat: "atk", value: 3 },
  swiftScale: { desc: "Permanently raises your Speed by 3.", kind: "boost", name: "Swiftfin Scale", price: 250, stat: "spd", value: 3 },
  thermalCloak: { desc: "Keeps you warm in the icy waters of Frostveil Reach.", kind: "key", name: "Thermal Cloak", price: 800 },
  tonic: { desc: "Heals 100 HP.", kind: "heal", name: "Kelp Tonic", price: 50, value: 100 },
  trident: { desc: "Teaches you Trident Strike, a powerful attack.", kind: "gear", name: "Coral Trident", price: 600 },
};

// Permanent boosts cost 40% more each time you buy one.
export function itemPrice(id, bought = 0) {
  const item = items[id];
  if (item.kind !== "boost") return item.price;
  return Math.round(item.price * 1.4 ** bought);
}
