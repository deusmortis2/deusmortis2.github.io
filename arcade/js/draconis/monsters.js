// Monster behaviours. Kinds match the tiles in img/draconis/monsters.png:
// 0 goblin, 1 orc, 2 skeleton, 3 gargoyle, 4 floating eye, 5 griffin.
// Each behaviour is a small state machine with its own way of moving and its
// own projectile (see shots.js).
import { height, randomBetween, width } from "./entities.js";
import { arrowVolley, axe, beam, boulder, featherFan, wisp } from "./shots.js";

export const kinds = { eye: 4, gargoyle: 3, goblin: 0, griffin: 5, orc: 1, skeleton: 2 };

// Hit points and score for each kind, indexed by kind number.
const toughness = [1, 3, 1, 2, 2, 1];
const points = [5, 15, 10, 15, 10, 10];

function setState(m, state, timer = 0) {
  m.state = state;
  m.timer = timer;
}

// Moves towards a point at a fixed speed. Returns true on arrival.
function approach(m, x, y, speed, dt) {
  const dx = x - m.x;
  const dy = y - m.y;
  const dist = Math.hypot(dx, dy);
  const step = speed * dt;
  if (dist <= step) {
    m.x = x;
    m.y = y;
    return true;
  }
  m.x += (dx / dist) * step;
  m.y += (dy / dist) * step;
  return false;
}

// Goblin: flaps straight across the sky in a gentle wave, lobbing axes.
const goblin = {
  init(m) {
    const fromLeft = Math.random() < 0.5;
    m.x = fromLeft ? -30 : width + 30;
    m.baseY = randomBetween(45, 110);
    m.vx = fromLeft ? 55 : -55;
    m.timer = 1.2;
  },
  update(m, dt, world) {
    m.x += m.vx * dt;
    m.y = m.baseY + Math.sin(m.age * 2.2) * 14;
    m.timer -= dt;
    if (m.timer <= 0 && m.x > 30 && m.x < width - 30) {
      world.spawnShots([axe(m, world.dragon)], "fire");
      m.timer = 2.3 * m.pace;
    }
    return m.x > -40 && m.x < width + 40;
  },
};

// Floating eye: drifts above the dragon, stares, then fires a beam straight
// down. The warning line shows where the beam will land.
const eye = {
  init(m) {
    m.x = randomBetween(60, width - 60);
    m.y = -30;
    m.hoverY = randomBetween(50, 85);
    m.cycles = 0;
    setState(m, "enter");
  },
  update(m, dt, world) {
    m.charging = m.state === "charge";
    if (m.state === "enter" && approach(m, m.x, m.hoverY, 60, dt)) {
      setState(m, "drift", 1.6 * m.pace);
    }
    if (m.state === "drift") {
      approach(m, world.dragon.x, m.hoverY + Math.sin(m.age * 2) * 6, 34, dt);
      m.timer -= dt;
      if (m.timer <= 0) {
        world.spawnShots([beam(m)], "launch");
        setState(m, "charge", 1.6);
      }
    }
    if (m.state === "charge") {
      m.timer -= dt;
      if (m.timer > 0) return true;
      m.cycles += 1;
      setState(m, m.cycles >= 3 ? "leave" : "drift", 2.2 * m.pace);
    }
    if (m.state === "leave") m.y -= 60 * dt;
    return m.y > -40;
  },
};

function bezier(a, b, c, u) {
  return (1 - u) ** 2 * a + 2 * u * (1 - u) * b + u ** 2 * c;
}

// Griffin: a warning flash at the edge, then a swooping dive that bottoms
// out just above the dragon, firing a fan of feathers on the way down.
const griffin = {
  init(m) {
    m.side = Math.random() < 0.5 ? -1 : 1;
    m.swoops = 0;
    m.x = m.side < 0 ? -40 : width + 40;
    m.y = 24;
    setState(m, "warn", 0.8);
  },
  update(m, dt, world) {
    if (m.state === "warn") {
      m.timer -= dt;
      if (m.timer > 0) return true;
      const { dragon } = world;
      const endX = m.side < 0 ? width + 40 : -40;
      m.path = {
        cx: 2 * dragon.x - 0.5 * (m.x + endX),
        cy: 2 * (dragon.y - 20) - 0.5 * (m.y + 24),
        x0: m.x,
        x2: endX,
        y0: m.y,
        y2: 24,
      };
      m.shot = false;
      setState(m, "swoop", 0);
    }
    if (m.state !== "swoop") return true;
    m.timer += dt / (3 * m.pace);
    const u = Math.min(m.timer, 1);
    const { cx, cy, x0, x2, y0, y2 } = m.path;
    const lastX = m.x;
    m.x = bezier(x0, cx, x2, u);
    m.y = bezier(y0, cy, y2, u);
    m.tilt = Math.max(-0.5, Math.min(0.5, (m.x - lastX) * 0.08));
    if (!m.shot && u > 0.3) {
      m.shot = true;
      world.spawnShots(featherFan(m, world.dragon), "slime");
    }
    if (u < 1) return true;
    m.swoops += 1;
    m.side = -m.side;
    setState(m, "warn", 0.8);
    return m.swoops < 2;
  },
};

// Orc: tough and slow. Plods along above the dragon, winds up, and hurls a
// boulder that bursts into a ring of shards.
const orc = {
  init(m) {
    m.x = randomBetween(80, width - 80);
    m.y = -35;
    setState(m, "enter");
  },
  update(m, dt, world) {
    m.windup = m.state === "windup";
    if (m.state === "enter" && approach(m, m.x, 58, 45, dt)) {
      setState(m, "stomp", 1.2);
    }
    if (m.state === "stomp" || m.state === "windup") {
      const speed = m.windup ? 0 : 32;
      approach(m, world.dragon.x, 58 + Math.sin(m.age * 1.5) * 4, speed, dt);
      m.timer -= dt;
    }
    if (m.state === "stomp" && m.timer <= 0) setState(m, "windup", 0.55);
    if (m.state === "windup" && m.timer <= 0) {
      world.spawnShots([boulder(m, world.dragon)], "slam");
      setState(m, m.age > 15 ? "leave" : "stomp", 2.8 * m.pace);
    }
    if (m.state === "leave") m.y -= 40 * dt;
    return m.y > -40;
  },
};

// Skeleton archer: blinks in somewhere new, takes aim (a red sight line
// follows the dragon, then locks), fires a volley and fades away again.
// It can't be hit while it is faded out.
const skeleton = {
  init(m) {
    m.cycles = 0;
    m.alpha = 0;
    m.x = -100;
    setState(m, "hidden", 0.3);
  },
  update(m, dt, world) {
    m.timer -= dt;
    const done = m.timer <= 0;
    m.hidden = m.state === "hidden" || m.state === "appear" || m.state === "vanish";
    if (m.state === "hidden") {
      m.alpha = 0;
      if (!done) return true;
      if (m.cycles >= 4) return false;
      m.x = randomBetween(50, width - 50);
      m.y = randomBetween(35, 120);
      setState(m, "appear", 0.4);
    } else if (m.state === "appear") {
      m.alpha = 1 - Math.max(0, m.timer) / 0.4;
      if (done) setState(m, "aim", 1 * m.pace);
    } else if (m.state === "aim") {
      // The aim follows the dragon until the last quarter second.
      if (m.timer > 0.25) {
        const { dragon } = world;
        m.aim = Math.atan2(dragon.y - m.y, dragon.x - m.x);
      }
      if (done) {
        world.spawnShots(arrowVolley(m, m.aim), "fire");
        setState(m, "linger", 0.5);
      }
    } else if (m.state === "linger") {
      if (done) setState(m, "vanish", 0.4);
    } else if (m.state === "vanish") {
      m.alpha = Math.max(0, m.timer) / 0.4;
      if (!done) return true;
      m.cycles += 1;
      setState(m, "hidden", 0.6);
    }
    return true;
  },
};

// Gargoyle: perches as stone (fireballs bounce off) and spits homing wisps,
// then wakes up, dive-bombs the dragon and flies back to its perch.
const gargoyle = {
  init(m) {
    m.x = randomBetween(70, width - 70);
    m.y = -35;
    m.perch = { x: m.x, y: randomBetween(40, 70) };
    m.dives = 0;
    setState(m, "enter");
  },
  update(m, dt, world) {
    m.stone = m.state === "stone";
    m.awake = m.state === "wake" || m.state === "dive";
    if (m.state === "enter" && approach(m, m.perch.x, m.perch.y, 70, dt)) {
      setState(m, "stone", 0);
      m.spits = 0;
    }
    if (m.state === "stone") {
      m.timer += dt;
      const spitAt = [0.6, 1.6];
      if (m.timer > spitAt[m.spits]) {
        const turn = m.spits === 0 ? -0.6 : 0.6;
        world.spawnShots([wisp(m, world.dragon, turn)], "slime");
        m.spits += 1;
      }
      if (m.timer > 2.6 * m.pace) setState(m, "wake", 0.45);
    }
    if (m.state === "wake") {
      m.timer -= dt;
      if (m.timer <= 0) {
        m.dive = { x: world.dragon.x, y: world.dragon.y };
        setState(m, "dive");
      }
    }
    if (m.state === "dive") {
      const { x, y } = m.dive;
      const dist = Math.hypot(x - m.x, y - m.y) || 1;
      m.x += ((x - m.x) / dist) * 280 * dt;
      m.y += ((y - m.y) / dist) * 280 * dt;
      // Overshoot: keep going until well past the target point.
      if (dist < 8) m.dive = { x: x + (x - m.perch.x) * 0.2, y: height + 60 };
      if (m.y > height - 20) setState(m, "rise");
    }
    if (m.state === "rise" && approach(m, m.perch.x, m.perch.y, 140, dt)) {
      m.dives += 1;
      m.spits = 0;
      setState(m, m.dives >= 3 ? "leave" : "stone", 0);
    }
    if (m.state === "leave") m.y -= 80 * dt;
    return m.state !== "leave" || m.y > -40;
  },
};

const behaviours = [goblin, orc, skeleton, gargoyle, eye, griffin];

// `pace` scales the gaps between attacks, so later stages press harder.
export function createMonster(kind, pace = 1) {
  const m = {
    age: 0,
    alive: true,
    fade: 0,
    flash: 0,
    hp: toughness[kind],
    kind,
    maxHp: toughness[kind],
    pace,
    tilt: 0,
    x: 0,
    y: 0,
  };
  behaviours[kind].init(m);
  return m;
}

// Returns false once the monster should be removed.
export function updateMonster(m, dt, world) {
  if (!m.alive) {
    m.fade += dt;
    return m.fade < 1;
  }
  m.age += dt;
  m.flash = Math.max(0, m.flash - dt);
  return behaviours[m.kind].update(m, dt, world);
}

export function canBeHit(m) {
  return m.alive && !m.hidden;
}

// Applies a hit. Returns "blocked", "hurt" or the points for a kill. Works
// for bosses too, which carry their own points.
export function damageMonster(m, amount = 1) {
  if (m.stone) return "blocked";
  m.hp -= amount;
  m.flash = 0.12;
  if (m.hp > 0) return "hurt";
  m.alive = false;
  return m.points ?? points[m.kind];
}

// Only solid, visible monsters hurt the dragon on contact.
export function touchesDragon(m) {
  return m.alive && !m.hidden;
}
