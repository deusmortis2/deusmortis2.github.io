// The oxygen meter. It drains all the time outside the boss arena (five
// times faster inside a poison cloud) and pauses once the boss's gate
// shuts. O2 tanks fill it back up and oxygen bubbles top it up; math
// answers don't. Once it's empty the astronaut starts choking and loses a
// life every few seconds.
export const maxOxygen = 30;
const chokeSeconds = 2;
// Units drained per second: a full meter lasts 20 seconds.
const drainRate = 1.5;

export function fillOxygen(round) {
  round.oxygen = maxOxygen;
  round.choke = chokeSeconds;
}

// Drains the meter. Returns true when an empty tank should cost a life.
export function breathe(round, dt) {
  // No drain during the boss fight (or after it, on the way to the rocket).
  if (round.fight !== "before") return false;
  const drain = drainRate * (round.poisoned ? 5 : 1);
  round.oxygen = Math.max(0, round.oxygen - dt * drain);
  if (round.oxygen > 0) {
    round.choke = chokeSeconds;
    return false;
  }
  round.choke -= dt;
  if (round.choke > 0) return false;
  round.choke = chokeSeconds;
  return true;
}
