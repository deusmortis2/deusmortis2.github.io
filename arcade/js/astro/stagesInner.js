// Layouts for the inner planets: Mercury, Venus, Earth and Mars.
//   blocks     [col, row, width, height] of solid rock
//   platforms  [row, fromCol, toCol] one-way ledges (thorns and spikes too)
//   enemies    [kind, col, row]; row is where the feet rest (9 is the floor)
//   hazards    see hazards.js; items are O2 tanks and checkpoint flags
//   arena      where the boss room starts, and its ledges (columns counted
//              from the arena's left edge)
// Pace speeds up how often the aliens use their tricks.
export const innerStages = [
  {
    arena: { boss: "magmaw", from: 110, platforms: [[7, 2, 5], [7, 15, 18]] },
    blocks: [[16, 9, 2, 1], [34, 8, 2, 2], [52, 7, 1, 3], [70, 9, 3, 1], [92, 8, 2, 2]],
    enemies: [
      ["cindercrab", 10], ["flameimp", 30], ["cindercrab", 40],
      ["magmabeetle", 56], ["ashhound", 72], ["flameimp", 88],
      ["magmabeetle", 98],
    ],
    floor: [[0, 22], [26, 44], [48, 60], [64, 80], [84, 104]],
    hazards: [
      ["geyser", 24, 0.3], ["geyser", 46, 0.8], ["geyser", 62, 1.4],
      ["geyser", 82, 0.4], ["rock", 68, 0], ["rock", 96, 0],
    ],
    id: "mercury",
    items: [["tank", 64, 9], ["flag", 66], ["tank", 100, 9]],
    lava: true,
    name: "MERCURY",
    pace: 1,
    platforms: [[7, 22, 26], [7, 44, 48], [6, 60, 64], [7, 80, 84]],
    start: 2,
    tagline: "THE SCORCHED FURNACE",
  },
  {
    arena: { boss: "broodqueen", from: 116, platforms: [[7, 2, 5], [7, 15, 18]] },
    blocks: [
      [12, 9, 2, 1], [30, 8, 2, 2], [48, 0, 2, 8], [66, 9, 2, 1], [86, 7, 1, 3],
    ],
    enemies: [
      ["sludgeslug", 10], ["gasminer", 28], ["acidjelly", 33, 5],
      ["sulphurwasp", 45, 4], ["sludgeslug", 52], ["gasminer", 68],
      ["acidjelly", 82, 5], ["sulphurwasp", 90, 4], ["sludgeslug", 100],
      ["gasminer", 107],
    ],
    floor: [[0, 20], [24, 38], [42, 56], [60, 74], [78, 92], [96, 110]],
    hazards: [
      ["geyser", 22, 0], ["geyser", 40, 1], ["geyser", 58, 0.5],
      ["geyser", 76, 1.5], ["geyser", 94, 0.8], ["crusher", 35, 0.4],
      ["crusher", 70, 1.2], ["crusher", 103, 0.6],
    ],
    id: "venus",
    items: [["tank", 62, 9], ["flag", 64], ["tank", 105, 9]],
    lava: true,
    name: "VENUS",
    pace: 1.1,
    platforms: [[7, 20, 24], [7, 38, 42], [6, 56, 60], [7, 74, 78], [7, 92, 96]],
    start: 2,
    tagline: "THE ACID CLOUDS",
  },
  {
    arena: { boss: "hydra", from: 118, platforms: [[7, 2, 5], [7, 15, 18]] },
    blocks: [
      [14, 8, 2, 2], [36, 9, 3, 1], [40, 6, 1, 4], [60, 5, 10, 1],
      [82, 8, 2, 2], [104, 9, 2, 1],
    ],
    enemies: [
      ["mossturtle", 10], ["snapvine", 22], ["warhornet", 31, 4],
      ["glowpanther", 46], ["mossturtle", 53], ["snapvine", 66],
      ["warhornet", 79, 4], ["glowpanther", 86], ["mossturtle", 101],
      ["snapvine", 112],
    ],
    floor: [[0, 24], [28, 46], [51, 70], [75, 90], [95, 112]],
    hazards: [["rock", 33, 0], ["rock", 86, 0], ["rock", 108, 0]],
    id: "earth",
    items: [["tank", 76, 9], ["flag", 78], ["tank", 110, 9]],
    name: "EARTH",
    pace: 1.15,
    platforms: [
      [7, 24, 28], [7, 46, 51], [7, 70, 75], [6, 90, 95], [6, 106, 110],
    ],
    spikes: [[6, 62, 64]],
    start: 2,
    tagline: "THE OVERGROWN RUINS",
    thorns: [[9, 18, 20], [9, 56, 58], [9, 98, 100]],
  },
  {
    arena: { boss: "devourer", from: 122, platforms: [[7, 2, 5], [7, 15, 18]] },
    blocks: [
      [14, 9, 2, 1], [18, 8, 1, 2], [20, 4, 1, 6], [40, 0, 2, 8], [44, 8, 2, 2],
      [57, 5, 12, 1], [70, 9, 3, 1], [100, 8, 2, 2], [103, 5, 8, 1],
    ],
    enemies: [
      ["rustcrab", 11], ["redscorpion", 30], ["dustbat", 36, 3],
      ["rustcrab", 48], ["palecrawler", 63, 6], ["redscorpion", 75],
      ["dustbat", 90, 3], ["rustcrab", 96], ["palecrawler", 107, 6],
      ["redscorpion", 115],
    ],
    floor: [[0, 24], [28, 52], [56, 80], [85, 116]],
    hazards: [
      ["rock", 59, 6], ["rock", 67, 6], ["rock", 105, 6], ["rock", 109, 6],
      ["crusher", 113, 0.5],
    ],
    id: "mars",
    items: [["tank", 78, 9], ["flag", 76], ["tank", 91, 6]],
    name: "MARS",
    pace: 1.2,
    platforms: [[7, 30, 35], [7, 88, 93]],
    spikes: [[6, 61, 64]],
    start: 2,
    tagline: "THE RED DESERT",
  },
];
