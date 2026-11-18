// Boss attacks that warn you first and then strike a fixed spot:
//   bolt   a lightning column from the sky
//   beam   a breath beam straight across the arena
//   vine   a thorny vine bursting out of the floor
//   spike  an ice spike bursting out of the floor
//   mark   just a warning; when it runs out, fire() makes whatever falls
// Each one flashes a warning for `warn` seconds, then hurts for `on`.
import { overlaps } from "./physics.js";

export function addStrike(round, spec) {
  round.strikes.push({ age: 0, on: 0, ...spec, fired: false });
}

export function updateStrikes(round, dt) {
  round.strikes = round.strikes.filter((strike) => {
    strike.age += dt;
    if (!strike.fired && strike.age >= strike.warn) {
      strike.fired = true;
      strike.fire?.(round, strike);
      if (strike.kind !== "mark") round.events.push({ type: strike.kind, x: strike.x + strike.w / 2, y: strike.y + strike.h });
    }
    return strike.age < strike.warn + strike.on;
  });
}

export const strikeLive = (strike) => strike.fired && strike.kind !== "mark";

// The live strike the player is standing in, if any.
export function strikeHit(round) {
  return round.strikes.find((strike) => {
    return strikeLive(strike) && overlaps(round.player, strike);
  });
}
