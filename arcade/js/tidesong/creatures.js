// The 150 creatures, 15 per region in difficulty order. In each region the
// first 6 are common, the next 5 uncommon, then 3 rare and 1 legendary (the
// legendary only appears at its lair). Their pictures are cut from the
// reference art in FantasyCreatures/FantasyCreatures (see creatureAtlas.js);
// heart songs and stats are worked out from the name and body.
import { secondMoveLevel, songs } from "./data.js";
import { zoneOrder, zones } from "./zones.js";
import { hash, makeRng } from "./util.js";

// Name, body, element. Grouped by region in zoneOrder: Prismreef Shallows,
// Verdant Canopy, Fluvius Basin, Pelagia Horizon, Brinewallow Fen, Frostveil
// Reach, Gloomveil Depths, Cragspire Bluff, Abyssal Anchor, Fangshore Coast.
const table = `
Sunnyfin fish tide|Wigglet fish coral|Puffle puffer tide|Scrubby fish tide|Chompet fish coral|Blossa anemone coral|Bannerine fish tide|Frillo fish vent|Tessera turtle coral|Pearlie snail coral|Zipjaw fish storm|Prismop octopus glow|Punchwick shrimp storm|Starclam shell glow|Tasselfin shark coral|
Kelpaw mammal tide|Moonbell jelly glow|Tangerfin fish coral|Sheepfin fish tide|Snippit crab coral|Prickle urchin shade|Leaflet seahorse coral|Shawlie slug glow|Spiklaw crab coral|Opaline snail glow|Grumble eel shade|Octavine octopus coral|Whipfin shark tide|Jawbie shark tide|Glowswell shark glow|
Hopple frog tide|Pinchkin crab coral|Snoozle mammal tide|Rollo snail coral|Zippity bug storm|Skitter bug tide|Rivermo mammal tide|Paddlepaw mammal tide|Slinkle eel shade|Twigby mammal coral|Nibblers fish shade|Voltwhip eel storm|Lilymunch seal coral|Paddlebeak mammal tide|Lumifrill frog glow|
Skimwing fish storm|Streakfin fish tide|Driftsail jelly storm|Everbell jelly glow|Galewing bird storm|Moonflop fish tide|Spinnaker fish tide|Cloakray ray glow|Herdsong whale tide|Voyager turtle tide|Malletjaw shark storm|Rapierfin fish tide|Stripejaw shark shade|Tidesinger whale tide|Horizora whale storm|
Fiddlet crab coral|Reedling shrimp tide|Mudhop fish tide|Puddlewing bird tide|Gemshell turtle coral|Flipbell jelly glow|Nettlewisp jelly storm|Curlicue seahorse coral|Mudglide ray shade|Helmshell crab shade|Rubyreed bird coral|Mistpip dolphin tide|Grazelle seal coral|Marshstripe cat shade|Brinejaw lizard shade|
Shimmerkin shrimp frost|Waddlepuff bird frost|Frostkit mammal frost|Glassfin fish frost|Driftwing bird storm|Snowhoot bird frost|Melonmoon whale frost|Whiskertusk seal frost|Spotslide seal shade|Wingwisp slug glow|Manebell jelly storm|Floepaw bear frost|Glacijaw shark shade|Spiralhorn whale frost|Glaciath whale frost|
Lumilure fish glow|Zaplet fish storm|Barrelbug shrimp glow|Peeper fish glow|Nibblejaw shark shade|Chainglow jelly glow|Redlamp fish glow|Fangle fish shade|Yawnjaw shark shade|Stiltclaw crab shade|Swirlshell snail glow|Duskdrake serpent shade|Gloomnose whale shade|Inkmonarch squid shade|Duskcloak squid shade|
Clingles shell storm|Capling snail tide|Bluelets shell tide|Starla star coral|Shellhop crab coral|Sparklet shrimp storm|Goggles fish tide|Pebblebeak bird storm|Splashfoot crab storm|Mossbun slug coral|Cliffpip bird storm|Wavepup seal tide|Pouchling bird tide|Cragscale lizard storm|Cragmane seal storm|
Stiltfin fish shade|Sniffletail fish shade|Oinkle slug shade|Platebug shrimp shade|Ironcurl snail vent|Glassbloom jelly glow|Lanternmaw angler glow|Wartglow angler glow|Snagglefin fish shade|Ghostling shark shade|Fuzzclaw crab vent|Flapsy octopus shade|Gobblemaw eel shade|Ventspire worm vent|Cinderbloom worm vent|
Divepip bird tide|Bristlebun mammal coral|Starsnout mammal shade|Burrowby mammal shade|Swiftail mammal storm|Scalepaw mammal coral|Ruffletail mammal coral|Snapjaw turtle shade|Ripplescale lizard tide|Coilmire serpent shade|Whiskerdive cat tide|Sprintleaf lizard coral|Tidehowl mammal storm|Timberpaw bear coral|Tuftfang cat shade|
`;

export const rarities = ["common", "uncommon", "rare", "legendary"];
const rarityMult = { common: 1, legendary: 1.45, rare: 1.22, uncommon: 1.1 };
export const catchRates = { common: 0.5, legendary: 0.1, rare: 0.2, uncommon: 0.34 };

// Base stats by body shape: hp, atk, def, spd.
const bodyStats = {
  anemone: [56, 44, 64, 20], angler: [50, 66, 42, 38], bear: [84, 74, 58, 36],
  bird: [50, 58, 42, 72], bug: [40, 58, 34, 76], cat: [58, 70, 44, 70],
  crab: [52, 56, 72, 30], dolphin: [66, 60, 46, 72], eel: [46, 62, 36, 62],
  fish: [46, 50, 42, 66], frog: [50, 54, 44, 64], jelly: [46, 52, 40, 44],
  lizard: [62, 64, 56, 48], mammal: [64, 58, 50, 58], octopus: [62, 60, 52, 46],
  puffer: [58, 42, 62, 34], ray: [56, 52, 52, 56], seahorse: [46, 46, 52, 52],
  seal: [72, 56, 46, 54], serpent: [72, 72, 52, 56], shark: [60, 76, 46, 62],
  shell: [54, 38, 78, 18], shrimp: [40, 62, 36, 72], slug: [52, 46, 52, 34],
  snail: [56, 40, 70, 22], squid: [52, 58, 40, 62], star: [52, 40, 66, 24],
  turtle: [76, 50, 72, 26], urchin: [46, 52, 76, 20], whale: [96, 62, 56, 36],
  worm: [56, 56, 60, 30],
};

const bodyBlurbs = {
  anemone: "It sways its soft tentacles and gives little fish a safe home.",
  angler: "It dangles a glowing lure to draw in the curious.",
  bear: "Big, strong and fluffy, it wades in to scoop fish from the water.",
  bird: "It dives from the sky to snatch a fish, then bobs on the waves.",
  bug: "It skims and zips over the water faster than the eye can follow.",
  cat: "It stalks the shallows on silent paws, then pounces with a splash.",
  crab: "It scuttles sideways and pinches anything that gets too close.",
  dolphin: "Clever and playful, it loves to race alongside swimmers.",
  eel: "It hides in crevices and strikes like a whip.",
  fish: "It travels in quick, flashing schools.",
  frog: "It leaps from lily pad to lily pad with a happy splash.",
  jelly: "It drifts wherever the current carries it.",
  lizard: "It basks on warm rocks, then slips into the water to cool down.",
  mammal: "Playful and curious, it is as happy on the shore as in the water.",
  octopus: "A master of disguise with eight clever arms.",
  puffer: "It puffs up into a spiky ball when startled.",
  ray: "It glides on wide wings just above the sea floor.",
  seahorse: "It curls its tail around kelp to rest.",
  seal: "It barks happily and naps on warm rocks.",
  serpent: "Old tales say it has guarded these waters for centuries.",
  shark: "A powerful hunter that never stops swimming.",
  shell: "It clamps its shell shut tight whenever danger comes near.",
  shrimp: "Tiny but fierce, it snaps its claws with a loud crack.",
  slug: "Its bright colours warn others that it tastes awful.",
  snail: "It carries its home on its back and never hurries anywhere.",
  squid: "It squirts a cloud of ink and vanishes.",
  star: "It clings to rocks and can regrow a lost arm.",
  turtle: "It has swum the oceans for longer than anyone remembers.",
  urchin: "Its sharp spines keep even sharks away.",
  whale: "Its song can be heard from the other side of the ocean.",
  worm: "It lives in a tube and pops out to wave its feathery plumes.",
};

function build() {
  const rows = table.split("|").map((s) => {
    return s.trim();
  }).filter(Boolean);
  return rows.map((row, index) => {
    const [name, body, element] = row.split(" ");
    const zone = zoneOrder[Math.floor(index / 15)];
    const slot = index % 15;
    let rarity = "legendary";
    if (slot < 6) rarity = "common";
    else if (slot < 11) rarity = "uncommon";
    else if (slot < 14) rarity = "rare";
    const rng = makeRng(hash(`${name}:songs`));
    // Heart songs only come from songs that can be learned by this region.
    const pool = Math.min(songs.length, 3 + zones[zone].tier);
    const heart = Math.floor(rng() * pool);
    let liked = Math.floor(rng() * (pool - 1));
    if (liked >= heart) liked += 1;
    return {
      blurb: bodyBlurbs[body],
      body,
      element,
      heart: songs[heart].id,
      id: index + 1,
      liked: songs[liked].id,
      name,
      rarity,
      // Its place among the region's 15, which is also its atlas picture.
      slot,
      zone,
    };
  });
}

export const creatures = build();

export function creatureById(id) {
  return creatures[id - 1];
}

export function creaturesInZone(zone) {
  return creatures.filter((c) => {
    return c.zone === zone;
  });
}

export function statsFor(species, level) {
  const [hp, atk, def, spd] = bodyStats[species.body];
  const m = rarityMult[species.rarity];
  const grow = (base) => {
    return Math.floor((base * 2 * level * m) / 50) + 5;
  };
  return {
    atk: grow(atk),
    def: grow(def),
    hp: Math.floor((hp * 2 * level * m) / 50) + level + 12,
    spd: grow(spd),
  };
}

export function movesFor(species, level) {
  const list = ["tackle", `${species.element}1`];
  if (level >= secondMoveLevel) list.push(`${species.element}2`);
  return list;
}

// A fresh creature instance (wild, or newly captured).
export function makeCreature(species, level) {
  const stats = statsFor(species, level);
  return {
    hp: stats.hp,
    level,
    species: species.id,
    uid: `${species.id}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`,
    xp: level ** 3,
  };
}

export function xpForLevel(level) {
  return level ** 3;
}

// XP a defeated or captured creature is worth.
export function xpReward(species, level) {
  const bonus = { common: 1, legendary: 3, rare: 1.8, uncommon: 1.3 }[species.rarity];
  return Math.round(((34 * level) / 5) * bonus * 1.5);
}
