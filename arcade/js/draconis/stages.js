// The three stages. Each has its own sky, its own monsters and a spawn
// schedule that speeds up as the stage goes on.
import { kinds } from "./monsters.js";

export const stageSeconds = 60;

// Each stage ends with a wyrm boss. Later wyrms are tougher and know more
// attacks (see boss.js).
export const stages = [
  {
    boss: {
      attacks: ["sweep", "ring"],
      hp: 30,
      look: "storm",
      minions: [],
      name: "STORM WYRM",
      points: 100,
    },
    kinds: [kinds.goblin, kinds.eye, kinds.griffin],
    name: "BLUE SKY",
    pace: 1,
    scenery: "day",
    spawnGaps: [4.5, 3.2],
  },
  {
    boss: {
      attacks: ["sweep", "summon", "ring"],
      hp: 50,
      look: "phantom",
      minions: [kinds.skeleton, kinds.gargoyle],
      name: "PHANTOM WYRM",
      points: 200,
    },
    kinds: [kinds.skeleton, kinds.gargoyle, kinds.orc],
    name: "NIGHT SKY",
    pace: 0.95,
    scenery: "night",
    spawnGaps: [4.5, 3.4],
  },
  {
    boss: {
      attacks: ["sweep", "dive", "ring", "summon", "dive"],
      hp: 75,
      look: "crimson",
      minions: [kinds.goblin, kinds.eye, kinds.orc],
      name: "CRIMSON WYRM",
      points: 300,
    },
    kinds: [
      kinds.goblin,
      kinds.eye,
      kinds.griffin,
      kinds.skeleton,
      kinds.gargoyle,
      kinds.orc,
    ],
    name: "LOW FLIGHT",
    pace: 0.85,
    scenery: "ground",
    shuffle: true,
    spawnGaps: [3.4, 2.4],
  },
];

function shuffled(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Monsters take turns through the stage's kinds, so every kind keeps
// showing up. The gap between spawns shrinks from the first value to the
// second, and spawning stops a few seconds before the stage ends.
export function buildSpawns(stage) {
  const [startGap, endGap] = stage.spawnGaps;
  const list = [];
  let order = [];
  let at = 1.5;
  while (at < stageSeconds - 5) {
    if (order.length === 0) order = stage.shuffle ? shuffled(stage.kinds) : [...stage.kinds];
    list.push({ at, kind: order.shift() });
    at += startGap + (endGap - startGap) * (at / stageSeconds);
  }
  return list;
}
