// Every alien in Astro Stomp, four per planet, and what each one does.
// Art is img/astro/<art>.png. Faces is the way the artwork looks (1 right,
// -1 left, 0 straight on). Box is the share of the picture that counts as
// the alien's body for collisions.
import {
  drifter,
  emberCharge,
  gasser,
  lobber,
  lunger,
  molten,
  scuttle,
  splitInTwo,
  splitter,
} from "./movesHot.js";
import {
  blinker,
  eyeBeam,
  freezer,
  icer,
  icicleJelly,
  liveWire,
  mindJelly,
  statue,
} from "./movesIce.js";
import {
  bomber,
  gale,
  gravityWell,
  hopper,
  roller,
  serpentine,
  shardCrab,
  zapper,
} from "./movesSky.js";
import {
  ambusher,
  burrower,
  clawGuard,
  hangFromRoof,
  prowler,
  shell,
  skitter,
  snapper,
  stingerHover,
  swooper,
} from "./movesWild.js";

const flier = { box: [0.62, 0.66], flies: true };

export const kinds = {
  // Mercury.
  ashhound: { art: "mercury/hound", faces: 1, move: emberCharge, points: 250, speed: 70 },
  cindercrab: { art: "mercury/crab", faces: 1, move: scuttle, points: 150, speed: 60 },
  flameimp: { art: "mercury/imp", faces: 0, move: lobber, points: 200, speed: 45 },
  magmabeetle: { art: "mercury/beetle", faces: 1, move: molten, points: 250, speed: 35 },
  // Venus.
  acidjelly: { ...flier, art: "venus/jelly", faces: 0, move: drifter, points: 200 },
  gasminer: { art: "venus/miner", faces: 1, move: gasser, points: 250, speed: 50 },
  sludgeslug: {
    art: "venus/slug", faces: 1, move: splitter, onDeath: splitInTwo, points: 200, speed: 34,
  },
  sulphurwasp: { ...flier, art: "venus/wasp", faces: 1, move: lunger, points: 250 },
  // Earth.
  glowpanther: { art: "earth/panther", faces: 1, move: prowler, points: 300, speed: 80 },
  mossturtle: { art: "earth/turtle", faces: 1, move: shell, points: 300, shell: true, speed: 40 },
  snapvine: { art: "earth/plant", box: [0.55, 0.9], faces: 1, move: snapper, points: 250 },
  warhornet: { ...flier, art: "earth/hornet", faces: 1, move: stingerHover, points: 250 },
  // Mars.
  dustbat: { ...flier, art: "mars/bat", faces: 0, move: swooper, points: 250 },
  palecrawler: {
    art: "mars/crawler", faces: 1, move: ambusher, points: 300, setup: hangFromRoof, speed: 70,
  },
  redscorpion: { art: "mars/scorpion", faces: 1, move: burrower, points: 300, speed: 60 },
  rustcrab: { art: "mars/crab", faces: 0, move: clawGuard, points: 250, speed: 55 },
  // Jupiter.
  bandbeetle: { art: "jupiter/beetle", faces: 1, move: roller, points: 300, speed: 50 },
  galewyvern: { ...flier, art: "jupiter/wyvern", faces: 1, move: gale, points: 300 },
  sparkblob: { art: "jupiter/blob", faces: 0, move: hopper, points: 250 },
  stormjelly: { ...flier, art: "jupiter/jelly", faces: 0, move: zapper, points: 300 },
  // Saturn.
  dustwyvern: { ...flier, art: "saturn/wyvern", faces: 1, move: bomber, points: 300 },
  orbjelly: { ...flier, art: "saturn/jelly", faces: 0, move: gravityWell, points: 300 },
  ringcrab: { art: "saturn/crab", faces: 1, move: shardCrab, points: 250, speed: 50 },
  ringeel: { ...flier, art: "saturn/eel", faces: 1, move: serpentine, points: 300 },
  // Uranus.
  frostcrab: { art: "uranus/crab", faces: 1, move: icer, points: 300, speed: 50 },
  frostjelly: { ...flier, art: "uranus/jelly", faces: 0, hp: 2, move: icicleJelly, points: 400 },
  icewyvern: { ...flier, art: "uranus/wyvern", faces: 1, move: freezer, points: 350 },
  shadoweel: { ...flier, art: "uranus/eel", faces: 1, move: blinker, points: 350 },
  // Neptune.
  abysscrab: { art: "neptune/crab", faces: 1, move: eyeBeam, points: 350, speed: 50 },
  crystalgargoyle: { ...flier, art: "neptune/gargoyle", faces: 1, move: statue, points: 400 },
  deepjelly: { ...flier, art: "neptune/jelly", faces: 0, move: mindJelly, points: 350 },
  stormeel: { ...flier, art: "neptune/eel", faces: 1, move: liveWire, points: 350 },
  // The Brood Queen's babies: her own picture, shrunk right down.
  spiderling: { art: "venus/boss", faces: 0, move: skitter, points: 100, scale: 0.22, speed: 120 },
};

// How the HUD and hints name each alien's trick, shown the first time you
// meet one on a planet.
export const tips = {
  abysscrab: "ABYSS CRABS FIRE LASERS: JUMP THEM!",
  bandbeetle: "ROLLING BEETLES CAN'T BE STOMPED. WAIT!",
  crystalgargoyle: "GARGOYLES ARE SAFE AS STONE. HIT THEM AWAKE!",
  deepjelly: "MIND RINGS SWAP LEFT AND RIGHT!",
  frostcrab: "FROST FREEZES YOU. ICE IS SLIPPERY!",
  galewyvern: "WYVERN GUSTS PUSH YOU. MIND THE EDGE!",
  gasminer: "POISON GAS DRAINS OXYGEN FAST!",
  magmabeetle: "HOT BEETLES BURN! SMASH THEM WHEN GREY.",
  mossturtle: "SMASH A TURTLE, THEN KICK ITS SHELL!",
  orbjelly: "GRAVITY JELLIES PULL YOU IN!",
  redscorpion: "SCORPIONS HIDE IN THE SAND!",
  rustcrab: "CLAWS UP! WAIT FOR THE CRAB TO SNAP.",
  sludgeslug: "SLUGS SPLIT IN TWO. SLIME SLOWS YOU!",
  stormjelly: "DON'T TOUCH A JELLY WHILE IT ZAPS!",
};
