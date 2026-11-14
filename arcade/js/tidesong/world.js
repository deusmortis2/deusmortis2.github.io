// The ocean: ten painted regions joined edge to edge. This works out what is
// solid (town buildings), where the doors and lairs are, where each edge of a
// region leads, and which wild creature you meet.
import { creatureById, creaturesInZone } from "./creatures.js";
import { buildingLabels, towns, zones } from "./zones.js";

// Size of one "step" for counting steps and rolling encounters.
export const tileSize = 32;

// How far in from the edge you appear after crossing into a region.
const arriveInset = 48;
// Each shopkeeper stands centred in front of their door, under the sign:
// their feet `keeperDrop` below the bottom of the doorway (a building can
// set its own in zones.js, where its sign hangs low). Touching the keeper, anywhere from the
// door down to just past their tail, opens the building.
export const keeperHeight = 112;
const keeperDrop = 30;
const doorHalfWidth = 42;
const doorBelowFeet = 30;
// Where you wake up or arrive in town: this far below the Healer's keeper,
// clear of the door so it doesn't open straight away.
const squareGap = 36;
// Wild creatures keep away from towns and lairs.
const townMargin = 140;
const lairCalm = 150;
const lairRadius = 40;

function scaled(zone, x, y) {
  const s = zones[zone].image.scale;
  return { x: x * s, y: y * s };
}

function scaledRect(zone, [x0, y0, x1, y1]) {
  const s = zones[zone].image.scale;
  return { x0: x0 * s, x1: x1 * s, y0: y0 * s, y1: y1 * s };
}

function inRect(r, x, y) {
  return x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;
}

const opposite = { east: "west", north: "south", south: "north", west: "east" };

export function createWorld() {
  // Everything in world pixels, worked out once per region.
  const regions = Object.fromEntries(Object.keys(zones).map((id) => {
    const z = zones[id];
    const buildings = z.town.buildings.map((b) => {
      const door = scaled(id, ...b.door);
      const feet = door.y + (b.keeperDrop ?? keeperDrop);
      return {
        door,
        doorRect: {
          x0: door.x - doorHalfWidth, x1: door.x + doorHalfWidth, y0: door.y - 4, y1: feet + doorBelowFeet,
        },
        keeper: { feet, x: door.x },
        kind: b.kind,
        label: buildingLabels[b.kind],
        rect: scaledRect(id, b.rect),
      };
    });
    const solids = [...buildings.map((b) => {
      return b.rect;
    }), ...z.town.solids.map((r) => {
      return scaledRect(id, r);
    })];
    const area = solids.reduce((a, r) => {
      return {
        x0: Math.min(a.x0, r.x0 - townMargin), x1: Math.max(a.x1, r.x1 + townMargin),
        y0: Math.min(a.y0, r.y0 - townMargin), y1: Math.max(a.y1, r.y1 + townMargin),
      };
    }, { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity });
    const healer = buildings.find((b) => {
      return b.kind === "healer";
    });
    const lairAt = scaled(id, z.lair.x, z.lair.y);
    const legend = creaturesInZone(id).find((s) => {
      return s.rarity === "legendary";
    });
    return [id, {
      area,
      buildings,
      lair: { ...lairAt, name: z.lair.name, species: legend.id, zone: id },
      solids,
      square: { x: healer.door.x, y: healer.doorRect.y1 + squareGap },
    }];
  }));

  const townList = towns.map((t) => {
    return { ...t, ...regions[t.zone].square };
  });

  const region = (zone) => {
    return regions[zone];
  };

  const isSolid = (zone, x, y) => {
    const z = zones[zone];
    if (x < 0 || y < 0 || x >= z.width || y >= z.height) return false;
    return regions[zone].solids.some((r) => {
      return inRect(r, x, y);
    });
  };

  const doorAt = (zone, x, y) => {
    const b = regions[zone].buildings.find((d) => {
      return inRect(d.doorRect, x, y);
    });
    if (!b) return null;
    return { kind: b.kind, town: zones[zone].town.id };
  };

  const lairAt = (zone, x, y) => {
    const l = regions[zone].lair;
    return Math.hypot(l.x - x, l.y - y) < lairRadius ? l : null;
  };

  // Wild creatures live everywhere except in towns and right by a lair.
  const isWild = (zone, x, y) => {
    const r = regions[zone];
    if (inRect(r.area, x, y)) return false;
    return Math.hypot(r.lair.x - x, r.lair.y - y) > lairCalm;
  };

  // Which edge (if any) a point has crossed, and where it leads.
  const exitAt = (zone, x, y) => {
    const z = zones[zone];
    let side = null;
    let along = 0;
    if (y < 0) [side, along] = ["north", x / z.width];
    else if (y > z.height) [side, along] = ["south", x / z.width];
    else if (x < 0) [side, along] = ["west", y / z.height];
    else if (x > z.width) [side, along] = ["east", y / z.height];
    if (!side) return null;
    const exit = (z.exits[side] ?? []).find(([a, b]) => {
      return along >= a && along <= b;
    });
    if (!exit) return { side, to: null };
    const [a, b, to] = exit;
    return { side, t: (along - a) / (b - a || 1), to };
  };

  // Where you come out in the next region after leaving by `exit`.
  const arrival = (from, exit) => {
    const z = zones[exit.to];
    const side = opposite[exit.side];
    const back = (z.exits[side] ?? []).find(([, , to]) => {
      return to === from;
    }) ?? [0, 1, from];
    const along = back[0] + exit.t * (back[1] - back[0]);
    const clampAlong = (len) => {
      return Math.max(arriveInset, Math.min(len - arriveInset, along * len));
    };
    if (side === "north") return { x: clampAlong(z.width), y: arriveInset };
    if (side === "south") return { x: clampAlong(z.width), y: z.height - arriveInset };
    if (side === "west") return { x: arriveInset, y: clampAlong(z.height) };
    return { x: z.width - arriveInset, y: clampAlong(z.height) };
  };

  return {
    arrival,
    doorAt,
    exitAt,
    isSolid,
    isWild,
    lairAt,
    lairs: Object.values(regions).map((r) => {
      return r.lair;
    }),
    region,
    townById: (id) => {
      return townList.find((t) => {
        return t.id === id;
      });
    },
    towns: townList,
  };
}

// Each battle against a creature you've already befriended makes the ones
// you haven't befriended a little more likely (15% per battle, up to 4 times as likely).
const discoveryStep = 0.15;
const discoveryCap = 4;

export function discoveryMultiplier(streak = 0) {
  return Math.min(discoveryCap, 1 + streak * discoveryStep);
}

// Picks a wild creature for a region: commons are far more likely, and
// creatures you haven't befriended yet get a boost that grows with `streak`.
export function rollEncounter(zone, { caught = [], streak = 0 } = {}, rng = Math.random) {
  const pool = creaturesInZone(zone).filter((s) => {
    return s.rarity !== "legendary";
  });
  const rarityWeight = { common: 10, rare: 1.2, uncommon: 4 };
  const boost = discoveryMultiplier(streak);
  const weight = (s) => {
    return rarityWeight[s.rarity] * (caught.includes(s.id) ? 1 : boost);
  };
  const total = pool.reduce((sum, s) => {
    return sum + weight(s);
  }, 0);
  let roll = rng() * total;
  const species = pool.find((s) => {
    roll -= weight(s);
    return roll <= 0;
  }) ?? pool[0];
  const [low, high] = zones[zone].levels;
  const level = low + Math.floor(rng() * (high - low + 1));
  return { level, species };
}

export function legendaryLevel(speciesId) {
  const species = creatureById(speciesId);
  return zones[species.zone].levels[1] + 4;
}
