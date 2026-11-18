// Layouts for the outer planets: Jupiter, Saturn, Uranus and Neptune. The
// fields are explained at the top of stagesInner.js. Ice lists the floor
// columns that are slippery.
export const outerStages = [
  {
    arena: { boss: "tempest", from: 122, platforms: [[7, 2, 5], [7, 15, 18]] },
    blocks: [[26, 8, 2, 2], [70, 9, 2, 1], [100, 6, 1, 4]],
    enemies: [
      ["bandbeetle", 12], ["stormjelly", 25, 5], ["sparkblob", 40],
      ["galewyvern", 48, 3], ["bandbeetle", 68], ["stormjelly", 79, 5],
      ["sparkblob", 86], ["galewyvern", 98, 3], ["bandbeetle", 104],
      ["sparkblob", 115],
    ],
    floor: [
      [0, 18], [22, 32], [36, 46], [51, 60], [64, 76], [81, 92], [96, 108],
      [112, 116],
    ],
    hazards: [
      ["laser", 29, 0, 10, 0], ["beam", 66, 75, 285, 0.6],
      ["laser", 88, 0, 10, 0.8], ["laser", 117, 0, 10, 0.3],
    ],
    id: "jupiter",
    items: [["tank", 54, 4], ["flag", 66], ["tank", 102, 9]],
    name: "JUPITER",
    pace: 1.25,
    platforms: [
      [7, 18, 22], [6, 32, 36], [7, 46, 51], [5, 54, 58], [7, 60, 64],
      [6, 76, 81], [7, 92, 96], [6, 108, 112],
    ],
    start: 2,
    tagline: "THE STORM GIANT",
  },
  {
    arena: { boss: "ringtitan", from: 130, platforms: [[7, 2, 5], [7, 15, 18]] },
    blocks: [
      [27, 9, 2, 1], [30, 0, 2, 8], [62, 8, 2, 2], [86, 8, 2, 2], [89, 4, 1, 6],
      [117, 5, 8, 1], [122, 9, 2, 1],
    ],
    enemies: [
      ["ringcrab", 10], ["orbjelly", 24, 5], ["ringeel", 36, 6],
      ["ringcrab", 45], ["dustwyvern", 60, 2], ["orbjelly", 66, 5],
      ["ringeel", 80, 6], ["ringcrab", 104], ["dustwyvern", 107, 2],
      ["ringeel", 126, 6],
    ],
    floor: [
      [0, 16], [21, 34], [39, 50], [56, 70], [76, 92], [98, 110], [116, 124],
    ],
    hazards: [
      ["laser", 12, 0, 10, 0], ["beam", 40, 49, 285, 0.8],
      ["crusher", 59, 0], ["crusher", 67, 1.2], ["laser", 80, 0, 10, 0.5],
      ["beam", 102, 108, 285, 1.2], ["rock", 123, 6],
    ],
    id: "saturn",
    items: [["tank", 57, 9], ["flag", 82], ["tank", 102, 3]],
    name: "SATURN",
    pace: 1.3,
    platforms: [
      [7, 17, 20], [6, 35, 38], [7, 51, 55], [7, 71, 75], [7, 93, 97],
      [4, 100, 104], [7, 111, 115],
    ],
    spikes: [[6, 118, 120]],
    start: 2,
    tagline: "THE RINGED GIANT",
  },
  {
    arena: { boss: "glacier", from: 124, platforms: [[7, 2, 5], [7, 15, 18]] },
    blocks: [
      [14, 9, 2, 1], [36, 7, 1, 3], [58, 5, 8, 1], [76, 8, 2, 2],
      [100, 0, 2, 8], [110, 9, 2, 1],
    ],
    enemies: [
      ["frostcrab", 10], ["shadoweel", 20, 6], ["icewyvern", 32, 2],
      ["frostcrab", 40], ["frostjelly", 52, 3], ["shadoweel", 72, 6],
      ["frostcrab", 80], ["icewyvern", 92, 2], ["frostjelly", 105, 3],
      ["frostcrab", 114], ["shadoweel", 120, 6],
    ],
    floor: [[0, 22], [26, 44], [48, 66], [70, 86], [90, 118]],
    hazards: [
      ["rock", 40, 5], ["rock", 65, 6], ["rock", 82, 5], ["crusher", 94, 0.5],
      ["rock", 106, 5], ["crusher", 116, 1.1],
    ],
    ice: [[30, 44], [54, 66], [96, 110]],
    id: "uranus",
    items: [["tank", 68, 5], ["flag", 74], ["tank", 112, 9]],
    name: "URANUS",
    pace: 1.35,
    platforms: [[7, 22, 26], [7, 44, 48], [6, 66, 70], [7, 86, 90]],
    spikes: [[6, 60, 63]],
    start: 2,
    tagline: "THE FROZEN TILT",
  },
  {
    arena: { boss: "voidtitan", from: 130, platforms: [[7, 2, 5], [7, 15, 18], [4, 9, 11]] },
    blocks: [
      [12, 9, 2, 1], [30, 0, 2, 8], [50, 7, 1, 3], [66, 5, 10, 1],
      [86, 8, 2, 2], [104, 6, 1, 4], [120, 9, 2, 1],
    ],
    enemies: [
      ["abysscrab", 10], ["crystalgargoyle", 26], ["deepjelly", 36, 4],
      ["stormeel", 47, 6], ["abysscrab", 54], ["crystalgargoyle", 70],
      ["deepjelly", 84, 4], ["stormeel", 92, 6], ["abysscrab", 102],
      ["crystalgargoyle", 108, 3], ["deepjelly", 118, 4],
    ],
    floor: [
      [0, 20], [24, 38], [43, 58], [62, 76], [80, 94], [99, 112], [116, 124],
    ],
    hazards: [
      ["geyser", 22, 0], ["geyser", 40, 0.6], ["geyser", 60, 1.2],
      ["geyser", 78, 0.3], ["geyser", 96, 0.9], ["laser", 55, 0, 10, 0.4],
      ["crusher", 90, 0.8], ["rock", 74, 6], ["crusher", 118, 0.3],
    ],
    id: "neptune",
    items: [
      ["tank", 40, 5], ["flag", 64], ["tank", 92, 9], ["tank", 117, 9],
    ],
    name: "NEPTUNE",
    pace: 1.45,
    platforms: [
      [7, 20, 24], [6, 38, 43], [7, 58, 62], [6, 76, 80], [7, 94, 99],
      [7, 112, 116], [4, 106, 110],
    ],
    spikes: [[6, 69, 72]],
    start: 2,
    tagline: "THE DARK EDGE",
  },
];
