// The ten regions of the ocean. Each region is one painted scene (its zone
// map image), and swimming off an edge carries you into the neighbouring
// region, laid out like the ocean map (img/tidesong/ocean-map.jpg).
//
// Positions in a region (buildings, doors, lairs) are in the image's own
// pixels. `scale` is how many world pixels each image pixel covers, so every
// town's buildings come out about the same size on screen.
//
// tier: order of difficulty (also sets which songs its creatures respond to).
// levels: wild creature levels. requires: key item needed to swim in.
// dark: how dark it is without a lantern (0 to 1). water: the region's colour
// for menus and loading screens. map: the region's box on the ocean map, and
// lair.mapX / mapY the lair's own dot there.

// Building kinds, in the order they stand in every painted town: the tower
// with the lyre sign, the wave sign, the mortar sign and the sword sign.
export const buildingOrder = ["songs", "pool", "healer", "shop"];
export const buildingLabels = {
  healer: "Healer", pool: "Tide Pool", shop: "Shop", songs: "Song Hall",
};

// [left, top, right, doorX, doorY]: the solid footprint runs from top to the
// bottom of the doorway, and the door is the spot in front of it.
function town(id, name, buildings, extraSolids = []) {
  return {
    buildings: buildings.map(([x0, y0, x1, doorX, doorY], i) => {
      return { door: [doorX, doorY], kind: buildingOrder[i], rect: [x0, y0, x1, doorY] };
    }),
    id,
    name,
    solids: extraSolids,
  };
}

export const zones = {
  abyssal: {
    dark: 0.2, levels: [25, 31], name: "Abyssal Anchor", requires: "heatWard", tier: 8, water: "#3a1f24",
    image: { h: 2144, scale: 1.25, w: 1984 },
    lair: { name: "The Hydrothermal Furnace", x: 1555, y: 1965, mapX: 1155, mapY: 735 },
    map: [850, 610, 1264, 843],
    town: town("lastLight", "Last Light Station", [
      [152, 150, 287, 217, 535], [334, 368, 493, 408, 535],
      [532, 293, 651, 592, 514], [699, 302, 866, 776, 527],
    ]),
    exits: { north: [[0, 0.5, "pelagia"], [0.5, 1, "cragspire"]], west: [[0, 1, "gloomveil"]] },
  },
  brinewallow: {
    dark: 0, levels: [12, 17], name: "Brinewallow Fen", requires: "ruinKey", tier: 4, water: "#3b4a35",
    image: { h: 976, scale: 1.6, w: 1089 },
    lair: { name: "Crocodile Grotto", x: 885, y: 830, mapX: 752, mapY: 93 },
    map: [430, 0, 850, 200],
    town: town("mudskipper", "Mudskipper Haven", [
      [63, 70, 132, 98, 172], [154, 97, 231, 195, 160],
      [256, 55, 319, 287, 143], [341, 51, 422, 381, 160],
    ]),
    exits: {
      east: [[0, 1, "fangshore"]], south: [[0, 1, "verdant"]], west: [[0, 1, "frostveil"]],
    },
  },
  cragspire: {
    dark: 0.1, levels: [21, 27], name: "Cragspire Bluff", requires: "stormCharm", tier: 7, water: "#24384f",
    image: { h: 1888, scale: 0.85, w: 2220 },
    lair: { name: "The Sea Lion Nest", x: 1810, y: 1440, mapX: 1190, mapY: 498 },
    map: [880, 200, 1264, 600],
    town: town("barnacleBay", "Barnacle Bay", [
      [176, 80, 348, 255, 447], [453, 147, 625, 545, 343],
      [672, 61, 825, 738, 343], [882, 52, 1102, 970, 347],
    ]),
    exits: {
      north: [[0, 1, "fangshore"]], south: [[0, 0.5, "pelagia"], [0.5, 1, "abyssal"]],
      west: [[0, 1, "verdant"]],
    },
  },
  fangshore: {
    dark: 0, levels: [30, 40], name: "Fangshore Coast", requires: "pressurePearl", tier: 9, water: "#2b4a3a",
    image: { h: 992, scale: 1.4, w: 1069 },
    lair: { name: "The Jaguar's Den", x: 875, y: 800, mapX: 1190, mapY: 77 },
    map: [850, 0, 1264, 210],
    town: town("grizzlyWatch", "Grizzly Watch", [
      [76, 152, 156, 115, 261], [183, 182, 272, 248, 257],
      [301, 132, 376, 338, 239], [401, 132, 515, 449, 259],
    ]),
    exits: { south: [[0, 1, "cragspire"]], west: [[0, 1, "brinewallow"]] },
  },
  fluvius: {
    dark: 0, levels: [6, 10], name: "Fluvius Basin", requires: null, tier: 2, water: "#2a6a5f",
    image: { h: 992, scale: 1.4, w: 1069 },
    lair: { name: "Axolotl Hollow", x: 865, y: 860, mapX: 347, mapY: 288 },
    map: [0, 215, 430, 420],
    town: town("capybara", "Capybara Crossing", [
      [76, 152, 156, 115, 261], [183, 182, 272, 248, 257],
      [301, 132, 376, 338, 239], [401, 132, 515, 449, 259],
    ]),
    exits: {
      east: [[0, 1, "verdant"]], north: [[0, 1, "frostveil"]], south: [[0, 1, "prismreef"]],
    },
  },
  frostveil: {
    dark: 0, levels: [15, 20], name: "Frostveil Reach", requires: "thermalCloak", tier: 5, water: "#4f9fc2",
    image: { h: 1024, scale: 2, w: 572 },
    lair: { name: "The Leviathan's Ice Cave", x: 487, y: 792, mapX: 352, mapY: 132 },
    map: [0, 0, 430, 215],
    town: town("winterport", "Winterport Keep", [
      [45, 50, 92, 66, 125], [102, 70, 168, 134, 118],
      [178, 38, 223, 198, 112], [239, 37, 307, 265, 118],
    ]),
    exits: { east: [[0, 1, "brinewallow"]], south: [[0, 1, "fluvius"]] },
  },
  gloomveil: {
    dark: 0.35, levels: [18, 24], name: "Gloomveil Depths", requires: "lanternJelly", tier: 6, water: "#1b1f3a",
    image: { h: 2048, scale: 0.9, w: 2048 },
    lair: { name: "The Vampire Squid Crypt", x: 1530, y: 1590, mapX: 347, mapY: 711 },
    map: [0, 600, 520, 843],
    town: town("lanternfall", "Lanternfall Sanctuary", [
      [170, 150, 302, 245, 508], [358, 343, 506, 425, 500],
      [558, 266, 694, 622, 484], [730, 258, 926, 818, 504],
    ], [[302, 160, 900, 340]]),
    exits: { east: [[0, 1, "abyssal"]], north: [[0, 0.6, "prismreef"], [0.6, 1, "pelagia"]] },
  },
  pelagia: {
    dark: 0, levels: [9, 14], name: "Pelagia Horizon", requires: null, tier: 3, water: "#2f8a72",
    image: { h: 1344, scale: 1, w: 3168 },
    lair: { name: "The Orca Vault", x: 2772, y: 1112, mapX: 979, mapY: 499 },
    map: [620, 440, 1100, 650],
    town: town("stormwatch", "Stormwatch Spire", [
      [286, 20, 433, 367, 495], [486, 357, 648, 562, 490],
      [695, 276, 829, 765, 486], [881, 271, 1057, 973, 500],
    ], [[433, 152, 1033, 340]]),
    exits: {
      north: [[0, 0.45, "verdant"], [0.45, 1, "cragspire"]],
      south: [[0, 0.4, "gloomveil"], [0.4, 1, "abyssal"]],
      west: [[0, 1, "prismreef"]],
    },
  },
  prismreef: {
    dark: 0, levels: [2, 6], name: "Prismreef Shallows", requires: null, tier: 0, water: "#2ea7c7",
    image: { h: 1344, scale: 1, w: 3168 },
    lair: { name: "The Wobbegong Cavern", x: 2000, y: 1072, mapX: 557, mapY: 499 },
    map: [200, 420, 620, 650],
    town: town("coralhaven", "Coralhaven Market", [
      [315, 215, 458, 395, 430], [497, 280, 648, 548, 430],
      [685, 205, 840, 720, 430], [840, 180, 1030, 918, 430],
    ]),
    exits: {
      east: [[0, 1, "pelagia"]], north: [[0, 0.5, "fluvius"], [0.5, 1, "verdant"]],
      south: [[0, 1, "gloomveil"]],
    },
  },
  verdant: {
    dark: 0, levels: [5, 9], name: "Verdant Canopy", requires: null, tier: 1, water: "#1f7f6a",
    image: { h: 1344, scale: 1, w: 3168 },
    lair: { name: "The Swell Shark Trench", x: 2693, y: 1110, mapX: 806, mapY: 289 },
    map: [430, 200, 880, 440],
    town: town("otterholm", "Otterholm", [
      [223, 77, 408, 325, 290], [415, 135, 573, 490, 282],
      [592, 65, 727, 658, 235], [742, 70, 938, 828, 282],
    ]),
    exits: {
      east: [[0, 1, "cragspire"]], north: [[0, 1, "brinewallow"]],
      south: [[0, 0.5, "prismreef"], [0.5, 1, "pelagia"]], west: [[0, 1, "fluvius"]],
    },
  },
};

Object.entries(zones).forEach(([id, z]) => {
  z.id = id;
  z.width = Math.round(z.image.w * z.image.scale);
  z.height = Math.round(z.image.h * z.image.scale);
});

// Zone ids in difficulty order, which is also the creature numbering order.
export const zoneOrder = Object.keys(zones).sort((a, b) => {
  return zones[a].tier - zones[b].tier;
});

// What each town's Shop sells and its Song Hall teaches, by region.
// `teaches` is a song id, `sells` lists item ids.
const townGoods = {
  abyssal: {
    sells: ["elixir", "pearlCharm", "revive", "guardShell", "pressurePearl"],
    teaches: null,
  },
  brinewallow: {
    sells: ["tonic", "pearlCharm", "revive", "calmInk", "heartCoral", "thermalCloak"],
    teaches: "chant",
  },
  cragspire: {
    sells: ["elixir", "pearlCharm", "revive", "strengthPearl", "heartCoral", "heatWard"],
    teaches: null,
  },
  fangshore: {
    sells: ["elixir", "pearlCharm", "revive", "heartCoral", "swiftScale", "strengthPearl"],
    teaches: null,
  },
  fluvius: {
    sells: ["salve", "tonic", "echoShell", "revive", "calmInk", "strengthPearl", "ruinKey"],
    teaches: "hum",
  },
  frostveil: {
    sells: ["tonic", "elixir", "pearlCharm", "revive", "strengthPearl", "guardShell", "lanternJelly"],
    teaches: "dirge",
  },
  gloomveil: {
    sells: ["tonic", "elixir", "pearlCharm", "revive", "calmInk", "swiftScale", "stormCharm"],
    teaches: null,
  },
  pelagia: {
    sells: ["tonic", "echoShell", "pearlCharm", "revive", "guardShell", "swiftScale", "trident"],
    teaches: "echo",
  },
  prismreef: {
    sells: ["salve", "echoShell", "revive", "calmInk", "strengthPearl", "guardShell"],
    teaches: "waltz",
  },
  verdant: {
    sells: ["salve", "tonic", "echoShell", "revive", "calmInk", "swiftScale", "heartCoral"],
    teaches: "reel",
  },
};

export const towns = zoneOrder.map((zone) => {
  const z = zones[zone];
  return { id: z.town.id, name: z.town.name, ...townGoods[zone], zone };
});

// Town ids from saves made before the regions were repainted, mapped to the
// town of the same difficulty now.
export const oldTownIds = {
  ashvent: "lastLight", brinewick: "capybara", coralhaven: "coralhaven", kelpholm: "otterholm",
  lanternfall: "lanternfall", lastLight: "grizzlyWatch", reefmarket: "stormwatch",
  rimefast: "winterport", stormwatch: "barnacleBay", sunkenSpire: "mudskipper",
};
