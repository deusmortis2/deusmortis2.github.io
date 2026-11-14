// Where each shopkeeper sits in img/tidesong/shopkeepers.webp: [x, y, w, h].
// Made by merfolk-cutter/cutkeep.py and packkeep.py from the shopkeeper
// sheets in tidesongzones/shopkeepers. Sets: arctic (Frostveil), deep
// (diving gear, for Gloomveil and Abyssal) and regular (everywhere else).
export const keeperAtlas = {
  arctic: {
    songs: [0, 0, 118, 224],
    pool: [122, 0, 157, 224],
    healer: [283, 0, 125, 224],
    shop: [412, 0, 119, 224],
  },
  deep: {
    songs: [0, 228, 111, 224],
    pool: [115, 228, 142, 224],
    healer: [261, 228, 114, 224],
    shop: [379, 228, 119, 224],
  },
  regular: {
    songs: [0, 456, 115, 224],
    pool: [119, 456, 142, 224],
    healer: [265, 456, 112, 224],
    shop: [381, 456, 120, 224],
  },
};
