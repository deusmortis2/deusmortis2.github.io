// Bosses of the inner planets. Each one has a few attacks it cycles
// through, and one moment after a big attack when it's open to a smash.
// Once it's down to half health it gets angry: faster and nastier.
import {
  arena,
  clampX,
  emitAt,
  face,
  floorY,
  go,
  nextAttack,
  randomX,
  stepTo,
} from "./bossKit.js";
import { spawnEnemy } from "./enemies.js";
import { centreX } from "./enemyKit.js";
import { fireShot, lob } from "./shots.js";
import { addStrike } from "./strikes.js";

const ceiling = 24;

// Warning circles on the floor, then something drops out of the sky there.
export function rainDown(round, count, kind, warn = 0.9) {
  for (let i = 0; i < count; i += 1) {
    const x = i === 0 ? clampX(round, centreX(round.player)) : randomX(round);
    addStrike(round, {
      fire: (r) => fireShot(r, kind, x, -30, 0, 250),
      h: 10, kind: "mark", w: 50, warn: warn + i * 0.12, x: x - 25, y: floorY - 10,
    });
  }
}

function throwFan(round, boss, kind, count, spread) {
  const { player } = round;
  for (let i = 0; i < count; i += 1) {
    const offset = (i - (count - 1) / 2) * spread;
    const target = { x: clampX(round, centreX(player) + offset), y: floorY };
    lob(round, kind, { x: centreX(boss), y: boss.y + 40 }, target, 0.9 + i * 0.07);
  }
  emitAt(round, "throw", centreX(boss), boss.y + 40);
}

// Mercury. Hurls lava rocks and slams the ground to send out shock waves,
// then has to catch its breath.
const magmaw = {
  art: "mercury/boss",
  begin: (boss) => go(boss, "walk", 1.5),
  faces: -1,
  h: 240,
  hp: 5,
  name: "MAGMAW",
  update(boss, dt, round) {
    const { player } = round;
    const steps = {
      hurl: () => {
        boss.shake = true;
        boss.glow = "#ff6a00";
        if (boss.timer > 0) return;
        throwFan(round, boss, "lavarock", boss.angry ? 5 : 3, 110);
        go(boss, "walk", 1.8);
      },
      slam: () => {
        boss.shake = true;
        if (boss.timer > 0) return;
        fireShot(round, "wave", boss.x - 10, floorY, -380);
        fireShot(round, "wave", boss.x + boss.w + 10, floorY, 380);
        emitAt(round, "quake", centreX(boss), floorY);
        if (boss.angry) rainDown(round, 4, "lavarock");
        go(boss, "tired", boss.angry ? 1.9 : 2.4);
      },
      tired: () => {
        boss.open = true;
        boss.crouch = 0.3;
        if (boss.timer <= 0) go(boss, "walk", 1.6);
      },
      walk: () => {
        stepTo(boss, centreX(player), boss.angry ? 85 : 55, dt);
        if (boss.timer > 0) return;
        go(boss, nextAttack(boss, ["hurl", "slam"]), 0.7);
      },
    };
    steps[boss.state]();
  },
  w: 150,
};

// Two spiderlings, unless there are already plenty about.
function brood(boss, round) {
  const babies = round.enemies.filter((e) => e.kind === "spiderling");
  if (babies.length >= 4) return;
  [-1, 1].forEach((dir) => {
    const x = centreX(boss) + dir * 90;
    round.enemies.push(spawnEnemy({ dir, kind: "spiderling", x, y: floorY }));
  });
}

// Venus. Hangs from the roof spitting acid, then drops down on you and
// gets stuck for a moment. Angry, she drops spiderlings too.
const broodqueen = {
  art: "venus/boss",
  begin: (boss) => go(boss, "hang", 1.6),
  faces: 0,
  flies: true,
  h: 150,
  hp: 6,
  name: "THE BROOD QUEEN",
  start: (boss) => {
    boss.y = ceiling;
  },
  update(boss, dt, round) {
    const { player } = round;
    const steps = {
      aim: () => {
        boss.shake = true;
        if (boss.timer > 0) return;
        boss.vy = 0;
        go(boss, "fall");
      },
      climb: () => {
        boss.y = Math.max(ceiling, boss.y - 280 * dt);
        if (boss.y === ceiling) go(boss, "hang", 1.4);
      },
      fall: () => {
        boss.vy += 2200 * dt;
        boss.y += boss.vy * dt;
        if (boss.y + boss.h < floorY) return;
        boss.y = floorY - boss.h;
        emitAt(round, "quake", centreX(boss), floorY);
        if (boss.angry) brood(boss, round);
        go(boss, "stuck", 2.4);
      },
      hang: () => {
        stepTo(boss, centreX(player), boss.angry ? 150 : 110, dt);
        boss.y = ceiling + Math.sin(boss.age * 3) * 6;
        if (boss.timer > 0) return;
        const attack = nextAttack(boss, ["spit", "drop"]);
        if (attack === "spit") {
          go(boss, "spit", 0.5);
          return;
        }
        addStrike(round, { h: 10, kind: "mark", w: boss.w, warn: 0.8, x: boss.x, y: floorY - 10 });
        go(boss, "aim", 0.8);
      },
      spit: () => {
        boss.glow = "#9cff3a";
        if (boss.timer > 0) return;
        throwFan(round, boss, "glob", boss.angry ? 5 : 3, 120);
        go(boss, "hang", 1.6);
      },
      stuck: () => {
        boss.open = true;
        boss.crouch = 0.15;
        if (boss.timer <= 0) go(boss, "climb");
      },
    };
    steps[boss.state]();
  },
  w: 200,
};

// The breath bands: low means jump (or get on a ledge), high means stay on
// the floor.
const bands = { high: { h: 34, y: 252 }, low: { h: 34, y: floorY - 50 } };

function breathBeam(round, band, warn) {
  const { left, right } = arena(round);
  addStrike(round, { ...bands[band], kind: "beam", on: 0.7, w: right - left, warn, x: left });
}

// Earth. Breathes beams across the arena, sends thorn vines up out of the
// floor and sweeps its tail. Pants after each breath.
const hydra = {
  art: "earth/boss",
  begin: (boss) => go(boss, "idle", 1),
  faces: 1,
  h: 250,
  hp: 6,
  name: "THE TRI-FANG HYDRA",
  update(boss, dt, round) {
    const { player } = round;
    const { left, right } = arena(round);
    const steps = {
      breathing: () => {
        boss.glow = "#4affd8";
        if (boss.timer <= 0) go(boss, "pant", 2.2);
      },
      idle: () => {
        face(boss, player);
        if (boss.timer > 0) return;
        const attack = nextAttack(boss, ["breath", "vines", "breath", "tail"]);
        if (attack === "breath") {
          boss.band = boss.band === "low" ? "high" : "low";
          breathBeam(round, boss.band, 0.9);
          if (boss.angry) breathBeam(round, boss.band === "low" ? "high" : "low", 2);
          go(boss, "breathing", boss.angry ? 2.7 : 1.6);
          return;
        }
        if (attack === "vines") {
          const count = boss.angry ? 5 : 3;
          for (let i = 0; i < count; i += 1) {
            const x = i === 0 ? clampX(round, centreX(player)) : randomX(round);
            addStrike(round, { h: 150, kind: "vine", on: 0.9, w: 44, warn: 0.75 + i * 0.1, x: x - 22, y: floorY - 150 });
          }
          go(boss, "idle", 2);
          return;
        }
        go(boss, "tail", 0.5);
      },
      move: () => {
        const target = boss.side > 0 ? right - boss.w / 2 - 20 : left + boss.w / 2 + 20;
        if (stepTo(boss, target, 210, dt)) go(boss, "idle", 1);
      },
      pant: () => {
        boss.open = true;
        boss.crouch = 0.3;
        if (boss.timer > 0) return;
        boss.side = centreX(boss) > (left + right) / 2 ? -1 : 1;
        go(boss, "move");
      },
      tail: () => {
        boss.shake = true;
        if (boss.timer > 0) return;
        const edge = boss.dir > 0 ? boss.x + boss.w : boss.x;
        fireShot(round, "wave", edge, floorY, boss.dir * 400);
        if (boss.angry) fireShot(round, "wave", edge, floorY, boss.dir * 260);
        emitAt(round, "quake", edge, floorY);
        go(boss, "idle", 1.4);
      },
    };
    steps[boss.state]();
  },
  w: 170,
};

// Mars. Swims under the sand towards you, bursts up where you stand, spits
// boulders, then slumps for a moment before diving back down.
const devourer = {
  art: "mars/boss",
  begin: (boss) => go(boss, "under", 1.6),
  faces: -1,
  h: 270,
  hp: 7,
  name: "THE DUNE DEVOURER",
  start: (boss) => {
    boss.sink = boss.h;
  },
  update(boss, dt, round) {
    const { player } = round;
    const steps = {
      dive: () => {
        boss.harmless = true;
        boss.sink = boss.h * (1 - boss.timer / 0.5);
        if (boss.timer > 0) return;
        boss.sink = boss.h;
        if (boss.angry) rainDown(round, 3, "boulder");
        go(boss, "under", boss.angry ? 1.5 : 2);
      },
      out: () => {
        face(boss, player);
        boss.spit -= dt;
        if (boss.spit <= 0 && !boss.spat) {
          boss.spat = true;
          throwFan(round, boss, "boulder", boss.angry ? 5 : 3, 120);
        }
        if (boss.timer <= 0) go(boss, "slump", 2.3);
      },
      rise: () => {
        boss.spiky = true;
        boss.sink = boss.h * Math.max(0, boss.timer / 0.35);
        if (boss.timer > 0) return;
        boss.sink = 0;
        boss.spit = 0.4;
        boss.spat = false;
        go(boss, "out", 1.4);
      },
      rumble: () => {
        boss.hidden = true;
        boss.shake = true;
        if (boss.timer > 0) return;
        emitAt(round, "burst", centreX(boss), floorY);
        go(boss, "rise", 0.35);
      },
      slump: () => {
        boss.open = true;
        boss.crouch = 0.35;
        if (boss.timer <= 0) go(boss, "dive", 0.5);
      },
      under: () => {
        boss.hidden = true;
        boss.sink = boss.h;
        stepTo(boss, centreX(player), boss.angry ? 300 : 230, dt);
        boss.dust = (boss.dust ?? 0) - dt;
        if (boss.dust <= 0) {
          boss.dust = 0.18;
          emitAt(round, "rumble", centreX(boss), floorY);
        }
        if (boss.timer > 0) return;
        addStrike(round, { h: 10, kind: "mark", w: boss.w, warn: 0.6, x: boss.x, y: floorY - 10 });
        go(boss, "rumble", 0.6);
      },
    };
    steps[boss.state]();
  },
  w: 140,
};

export const innerBosses = { broodqueen, devourer, hydra, magmaw };
