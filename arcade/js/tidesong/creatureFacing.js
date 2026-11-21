// Which way each creature's picture faces as drawn in the reference art, in
// the same slot order as creatureAtlas.js: "L" left, "R" right, "F" facing
// the viewer (never mirrored). Battles use this to turn every wild creature
// towards the left and every companion towards the right.
export const creatureFacing = {
  abyssal: "LLLRLFRRLRFFLFF",
  brinewallow: "FLLRRFFRFFRRRLR",
  cragspire: "FFFFRLRRFRRRLLR",
  fangshore: "RRLLRLLLLLRLRRL",
  fluvius: "RRFRLFRRRRRLLLL",
  frostveil: "FFLLRFRFLFFFLRL",
  gloomveil: "RLRRRFRLRFLLLFF",
  pelagia: "LLFFLLLRRLFRLLL",
  prismreef: "RRFRLFLLLRLFFFL",
  verdant: "RFLLFFRRLLLFRRR",
};

// True when the picture must be mirrored to face `want` ("left" or "right").
export function needsFlip(zone, slot, want) {
  const drawn = creatureFacing[zone]?.[slot] ?? "F";
  if (drawn === "F") return false;
  return drawn !== (want === "left" ? "L" : "R");
}
