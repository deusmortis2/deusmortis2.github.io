// The oxygen meter. It drains all the time; O2 tanks and right answers to the
// math question fill it back up. Once it's empty the astronaut starts
// choking and loses a life every few seconds.
export const maxOxygen = 30;
const chokeSeconds = 2;

export function fillOxygen(round) {
  round.oxygen = maxOxygen;
  round.choke = chokeSeconds;
}

// Drains the meter. Returns true when an empty tank should cost a life.
export function breathe(round, dt) {
  round.oxygen = Math.max(0, round.oxygen - dt);
  if (round.oxygen > 0) {
    round.choke = chokeSeconds;
    return false;
  }
  round.choke -= dt;
  if (round.choke > 0) return false;
  round.choke = chokeSeconds;
  return true;
}
