// Things aliens do to the astronaut that aren't a lost life:
//   slow      stuck in goo: runs and jumps at half power
//   slippery  on ice: slow to speed up, slow to stop
//   frozen    iced solid: can't move or jump for a moment
//   confused  a mind blast: left and right swap over
// Wind and gravity wells also shove the astronaut sideways each frame.

export function newStatus() {
  return { confused: 0, frozen: 0, push: 0, slippery: 0, slow: 0 };
}

// Starts (or extends) an effect. The star power-up shrugs off the nasty
// ones, but ice underfoot is still ice.
export function afflict(player, kind, seconds) {
  if (player.powers.star > 0 && kind !== "slippery") return;
  player.status[kind] = Math.max(player.status[kind], seconds);
}

// Adds a sideways shove in px/s for this frame only.
export function shove(player, speed) {
  if (player.powers.star > 0 || player.status.frozen > 0) return;
  player.status.push += speed;
}

export function tickStatus(player, dt) {
  const { status } = player;
  ["confused", "frozen", "slippery", "slow"].forEach((kind) => {
    status[kind] = Math.max(0, status[kind] - dt);
  });
}

// The labels shown over the astronaut's head while an effect lasts.
export function statusLabel(player) {
  const { status } = player;
  if (status.frozen > 0) return "FROZEN!";
  if (status.confused > 0) return "CONFUSED!";
  if (status.slow > 0) return "STUCK!";
  return "";
}
