// Who hits whom: the dragon's fireballs against monsters and bosses, and
// monsters, bosses and their shots against the dragon.
import { overlaps, radius } from "./entities.js";
import { canBeHit, damageMonster, touchesDragon } from "./monsters.js";
import { nearest, rank, updateFireball } from "./powers.js";
import { shotHits } from "./shots.js";

const chainRange = 130;

const hitRadius = (t) => t.r ?? radius.monster;

// Everything a fireball can hit right now.
export function targets(round) {
  const list = round.monsters.filter(canBeHit);
  if (round.boss && canBeHit(round.boss)) list.push(round.boss);
  return list;
}

// Lightning jumps from the struck foe to the nearest others in range.
function chain(round, from, count, reward) {
  const struck = new Set([from]);
  let source = from;
  for (let i = 0; i < count; i += 1) {
    const { dist, target } = nearest(source, targets(round), struck);
    if (!target || dist > chainRange) return;
    round.effects.push({
      age: 0,
      life: 0.25,
      points: boltPath(source, target),
      type: "bolt",
    });
    reward(damageMonster(target, 1), target);
    struck.add(target);
    source = target;
  }
}

// A jagged line between two points for the lightning effect.
function boltPath(a, b) {
  const steps = 6;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const k = i / steps;
    const jitter = i === 0 || i === steps ? 0 : (Math.random() - 0.5) * 18;
    return { x: a.x + (b.x - a.x) * k + jitter, y: a.y + (b.y - a.y) * k + jitter };
  });
}

// Moves every fireball and applies its hits. `reward(result, target)` is
// called for each hit with "blocked", "hurt" or the points for a kill.
export function burnFoes(round, progress, dt, reward) {
  const lightning = rank(progress, "lightning");
  round.fireballs = round.fireballs.filter((f) => {
    const live = targets(round);
    const target = live.find(
      (t) => !f.hits.has(t) && overlaps(t, hitRadius(t), f, radius.fireball * f.scale),
    );
    if (!target) return updateFireball(f, dt, live);
    const result = damageMonster(target, f.damage);
    reward(result, target);
    if (result === "blocked") return false;
    if (lightning > 0) chain(round, target, lightning, reward);
    f.hits.add(target);
    if (f.pierce <= 0) return false;
    f.pierce -= 1;
    return true;
  });
}

export function dragonHit(round) {
  const { boss, dragon, monsters, shots } = round;
  const touching = (m) => touchesDragon(m) && overlaps(m, hitRadius(m), dragon, radius.dragon);
  if (monsters.some(touching)) return true;
  if (boss && touching(boss)) return true;
  return shots.some((s) => shotHits(s, dragon));
}
