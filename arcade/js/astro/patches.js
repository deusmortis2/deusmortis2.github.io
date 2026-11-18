// Patches that aliens leave behind for a while:
//   fire    burning ground (hurts)
//   acid    a bubbling puddle (hurts)
//   slime   sticky goo (slows the astronaut down)
//   ice     a frozen sheet (slippery: hard to stop or turn)
//   poison  a gas cloud (oxygen drains five times faster inside it)
//   spark   crackling electricity hanging in the air (hurts)
import { overlaps } from "./physics.js";
import { afflict } from "./status.js";

const sizes = {
  acid: { h: 14, life: 3.5, w: 56 },
  fire: { h: 22, life: 2.5, w: 44 },
  ice: { h: 10, life: 5, w: 56 },
  poison: { h: 120, life: 4.5, w: 140 },
  slime: { h: 10, life: 3.5, w: 52 },
  spark: { h: 30, life: 1.2, w: 30 },
};

export const hurtsOnTouch = new Set(["acid", "fire", "spark"]);

// X is the middle of the patch and y its bottom (usually the floor), except
// sparks, which hang in the air centred on (x, y).
export function addPatch(round, kind, x, y, life = sizes[kind].life) {
  const { h, w } = sizes[kind];
  const top = kind === "spark" ? y - h / 2 : y - h;
  round.patches.push({ age: 0, h, kind, life, max: life, w, x: x - w / 2, y: top });
}

export function updatePatches(round, dt) {
  round.patches = round.patches.filter((patch) => {
    patch.age += dt;
    patch.life -= dt;
    return patch.life > 0;
  });
}

// Applies every patch the player is standing in. Returns the patch that
// hurts them, if any, so the game can take a life.
export function touchPatches(round) {
  const { player } = round;
  let harmful = null;
  round.poisoned = false;
  round.patches.forEach((patch) => {
    // A fading patch stops working in its last moment.
    if (patch.life < 0.15 || !overlaps(player, patch)) return;
    if (patch.kind === "slime") afflict(player, "slow", 0.25);
    if (patch.kind === "ice") afflict(player, "slippery", 0.25);
    if (patch.kind === "poison") round.poisoned = true;
    if (hurtsOnTouch.has(patch.kind)) harmful = patch;
  });
  return harmful;
}
