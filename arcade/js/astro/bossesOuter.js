// Bosses of the outer planets. Same rules as bossesInner.js: each one is
// only open to a smash for a moment after a big attack, and gets angry at
// half health.
import {
  arena,
  clampX,
  emitAt,
  face,
  floorY,
  flyTo,
  go,
  nextAttack,
  randomX,
  stepTo,
} from "./bossKit.js";
import { rainDown } from "./bossesInner.js";
import { createEnemy } from "./enemies.js";
import { aim, centreX, centreY } from "./enemyKit.js";
import { addPatch } from "./patches.js";
import { fireShot } from "./shots.js";
import { shove } from "./status.js";
import { addStrike } from "./strikes.js";

const skyY = 150;

// Jupiter. Calls down lightning, blows you about with gusts and dives at
// you, which leaves it dazed on the floor.
const tempest = {
  art: "jupiter/boss",
  begin: (boss) => go(boss, "float", 1.5),
  faces: 0,
  flies: true,
  h: 210,
  hp: 7,
  name: "THE TEMPEST SERPENT",
  start: (boss) => {
    boss.y = skyY - 105;
  },
  update(boss, dt, round) {
    const { player } = round;
    const { mid } = arena(round);
    const lightning = (count) => {
      for (let i = 0; i < count; i += 1) {
        const x = i === 0 ? clampX(round, centreX(player)) : randomX(round);
        addStrike(round, { h: floorY, kind: "bolt", on: 0.35, w: 50, warn: 0.8 + i * 0.1, x: x - 25, y: 0 });
      }
    };
    const steps = {
      casting: () => {
        boss.glow = "#9cf0ff";
        if (boss.timer <= 0) go(boss, "float", 1.2);
      },
      dazed: () => {
        boss.open = true;
        boss.crouch = 0.2;
        if (boss.timer <= 0) go(boss, "rise");
      },
      float: () => {
        flyTo(boss, mid + Math.sin(boss.age * 0.8) * 220, skyY, 160, dt);
        face(boss, player);
        if (boss.timer > 0) return;
        const attack = nextAttack(boss, ["lightning", "gust", "dive"]);
        if (attack === "lightning") {
          lightning(boss.angry ? 5 : 3);
          go(boss, "casting", 1.3);
          return;
        }
        if (attack === "gust") {
          boss.spit = 0.5;
          go(boss, "gust", 2.6);
          return;
        }
        boss.target = clampX(round, centreX(player), 100);
        addStrike(round, { h: 10, kind: "mark", w: boss.w, warn: 0.6, x: boss.target - boss.w / 2, y: floorY - 10 });
        go(boss, "aim", 0.6);
      },
      aim: () => {
        boss.shake = true;
        if (boss.timer <= 0) go(boss, "plunge");
      },
      gust: () => {
        boss.gust = Math.sign(centreX(player) - centreX(boss)) || 1;
        shove(player, boss.gust * 240);
        boss.spit -= dt;
        if (boss.spit <= 0) {
          const line = aim(boss, player);
          fireShot(round, "orb", centreX(boss), centreY(boss), line.x * 170, line.y * 170);
          if (boss.angry) lightning(1);
          boss.spit = 0.8;
        }
        if (boss.timer > 0) return;
        boss.gust = 0;
        go(boss, "float", 1.4);
      },
      plunge: () => {
        const there = flyTo(boss, boss.target, floorY - boss.h / 2, 750, dt);
        if (!there) return;
        emitAt(round, "quake", centreX(boss), floorY);
        go(boss, "dazed", 2.2);
      },
      rise: () => {
        if (flyTo(boss, mid, skyY, 220, dt)) go(boss, "float", 1);
      },
    };
    steps[boss.state]();
  },
  w: 170,
};

// Sends a ring spinning along the floor (jump it). A boomerang ring turns
// at the far wall and comes back high (stay low).
function throwRing(round, boss, speed, high, comesBack) {
  const { left, right } = arena(round);
  const dir = Math.sign(centreX(round.player) - centreX(boss)) || -1;
  const lowY = floorY - 30;
  const shot = fireShot(round, "ring", centreX(boss) + dir * 60, high ? floorY - 150 : lowY, dir * speed);
  shot.phase = "out";
  shot.steer = (ring, dt) => {
    const middle = ring.x + ring.w / 2;
    const atWall = (ring.vx < 0 && middle < left + 70) || (ring.vx > 0 && middle > right - 70);
    if (ring.phase === "out" && atWall) {
      if (!comesBack) {
        ring.age = ring.def.life + 1;
        return;
      }
      ring.phase = "back";
      ring.vx = -ring.vx;
    }
    if (ring.phase !== "back") return;
    const goal = floorY - 150 - ring.h / 2;
    ring.y += Math.sign(goal - ring.y) * Math.min(Math.abs(goal - ring.y), 400 * dt);
    if (Math.abs(middle - centreX(boss)) > 40) return;
    ring.age = ring.def.life + 1;
    boss.ringOut = false;
  };
  emitAt(round, "throw", centreX(boss), boss.y + 60);
  return shot;
}

// Saturn. Its spinning ring guards it, so stomps clang off. It throws the
// ring as a boomerang (open to a smash until it comes back) and shakes
// crystals down from the sky.
const ringtitan = {
  art: "saturn/boss",
  begin: (boss) => go(boss, "walk", 1.4),
  faces: 0,
  h: 260,
  hp: 8,
  name: "THE RING TITAN",
  update(boss, dt, round) {
    const { player } = round;
    boss.guarded = !boss.ringOut;
    const steps = {
      crystals: () => {
        boss.shake = true;
        if (boss.timer > 0) return;
        rainDown(round, boss.angry ? 7 : 5, "icicle");
        emitAt(round, "quake", centreX(boss), floorY);
        go(boss, "walk", 1.6);
      },
      throw: () => {
        boss.shake = true;
        if (boss.timer > 0) return;
        boss.ringOut = true;
        throwRing(round, boss, boss.angry ? 560 : 430, false, true);
        go(boss, "bare", 8);
      },
      bare: () => {
        boss.open = true;
        boss.crouch = 0.15;
        if (!boss.ringOut || boss.timer <= 0) {
          boss.ringOut = false;
          go(boss, "walk", 1.2);
        }
      },
      walk: () => {
        stepTo(boss, centreX(player), boss.angry ? 95 : 70, dt);
        if (boss.timer > 0) return;
        go(boss, nextAttack(boss, ["throw", "crystals"]), 0.6);
      },
    };
    steps[boss.state]();
  },
  w: 170,
};

// Uranus. Breathes frost that freezes you and ices the floor, sends a row
// of ice spikes racing across the arena (then needs a rest), and tosses its
// ring.
const glacier = {
  art: "uranus/boss",
  begin: (boss) => go(boss, "walk", 1.4),
  faces: 0,
  h: 260,
  hp: 8,
  name: "THE GLACIER TITAN",
  update(boss, dt, round) {
    const { player } = round;
    const { left, right } = arena(round);
    const steps = {
      breath: () => {
        boss.glow = "#bff6ff";
        if (boss.timer > 0) return;
        boss.spit = 0;
        boss.ice = 0;
        go(boss, "breathing", 1.2);
      },
      breathing: () => {
        boss.spit -= dt;
        boss.ice -= dt;
        const mouth = { x: centreX(boss) + boss.dir * 70, y: boss.y + 70 };
        if (boss.spit <= 0) {
          const line = aim({ h: 0, w: 0, x: mouth.x, y: mouth.y }, player);
          fireShot(round, "frost", mouth.x, mouth.y, line.x * 340, line.y * 340);
          boss.spit = 0.1;
        }
        if (boss.ice <= 0) {
          addPatch(round, "ice", clampX(round, centreX(boss) + boss.dir * (120 + Math.random() * 300)), floorY, 6);
          boss.ice = 0.15;
        }
        if (boss.timer <= 0) go(boss, "walk", 1.4);
      },
      spikes: () => {
        boss.shake = true;
        if (boss.timer > 0) return;
        let count = 0;
        for (let x = centreX(boss) + boss.dir * 110; x > left && x < right; x += boss.dir * 50) {
          addStrike(round, { h: 90, kind: "spike", on: 0.45, w: 40, warn: 0.35 + count * 0.08, x: x - 20, y: floorY - 90 });
          count += 1;
        }
        emitAt(round, "quake", centreX(boss), floorY);
        go(boss, "winded", 0.8 + count * 0.08 + 2.2);
      },
      toss: () => {
        boss.shake = true;
        if (boss.timer > 0) return;
        throwRing(round, boss, 460, false, false);
        if (boss.angry) throwRing(round, boss, 300, true, false);
        go(boss, "walk", 1.4);
      },
      walk: () => {
        stepTo(boss, centreX(player), boss.angry ? 80 : 60, dt);
        if (boss.timer > 0) return;
        face(boss, player);
        go(boss, nextAttack(boss, ["breath", "spikes", "toss", "spikes"]), 0.7);
      },
      winded: () => {
        // Only open once the spikes have finished racing out.
        boss.open = boss.timer < 2.2;
        boss.crouch = boss.open ? 0.3 : 0;
        if (boss.timer <= 0) go(boss, "walk", 1.2);
      },
    };
    steps[boss.state]();
  },
  w: 170,
};

// Neptune. Teleports around (dazed for a moment each time it lands), fires
// rings of orbs, drags you in with a gravity well and sends out mind waves
// that swap left and right. Angry, it calls two deep jellies to help.
const voidtitan = {
  art: "neptune/boss",
  begin: (boss) => go(boss, "orbs", 0.6),
  faces: 0,
  h: 260,
  hp: 10,
  name: "THE VOID TITAN",
  update(boss, dt, round) {
    const { player } = round;
    const { left, mid, right } = arena(round);
    const next = () => {
      const attack = nextAttack(boss, ["teleport", "orbs", "well", "teleport", "pulse"]);
      go(boss, attack, { orbs: 0.5, pulse: 0.6, teleport: 0.6, well: 2.6 }[attack]);
    };
    const orbRing = (count, turn) => {
      for (let i = 0; i < count; i += 1) {
        const angle = turn + (i * Math.PI * 2) / count;
        fireShot(round, "orb", centreX(boss), centreY(boss), Math.cos(angle) * 170, Math.sin(angle) * 170);
      }
    };
    if (boss.angry && !boss.summoned) {
      boss.summoned = true;
      [3, 18].forEach((col) => round.enemies.push(createEnemy(["deepjelly", round.level.arena + col, 4])));
    }
    const steps = {
      appear: () => {
        boss.harmless = true;
        boss.alpha = 1 - boss.timer / 0.5;
        if (boss.timer <= 0) go(boss, "dazed", 1.6);
      },
      dazed: () => {
        boss.open = true;
        boss.crouch = 0.2;
        if (boss.timer <= 0) next();
      },
      orbs: () => {
        boss.glow = "#c878ff";
        if (boss.timer > 0) return;
        orbRing(boss.angry ? 12 : 8, boss.age);
        if (boss.angry) boss.second = 0.5;
        emitAt(round, "orb", centreX(boss), centreY(boss));
        go(boss, "after", 1);
      },
      after: () => {
        if (boss.second > 0) {
          boss.second -= dt;
          if (boss.second <= 0) orbRing(12, boss.age + 0.26);
        }
        if (boss.timer <= 0) next();
      },
      pulse: () => {
        boss.shake = true;
        if (boss.timer > 0) return;
        fireShot(round, "mindwave", boss.x - 10, floorY, -330);
        fireShot(round, "mindwave", boss.x + boss.w + 10, floorY, 330);
        emitAt(round, "orb", centreX(boss), floorY);
        go(boss, "after", 1);
      },
      teleport: () => {
        boss.ghost = true;
        boss.harmless = true;
        boss.alpha = boss.timer / 0.6;
        if (boss.timer > 0) return;
        // Land on whichever spot is furthest from the astronaut.
        const spots = [left + 130, mid, right - 130];
        const far = spots.reduce((a, b) => {
          return Math.abs(b - centreX(player)) > Math.abs(a - centreX(player)) ? b : a;
        });
        boss.x = far - boss.w / 2;
        face(boss, player);
        go(boss, "appear", 0.5);
      },
      well: () => {
        boss.guarded = true;
        boss.spiky = true;
        boss.aura = 150;
        const gap = centreX(boss) - centreX(player);
        if (Math.abs(gap) < 520) shove(player, Math.sign(gap) * 170);
        if (boss.timer <= 0) next();
      },
    };
    steps[boss.state]();
  },
  w: 170,
};

export const outerBosses = { glacier, ringtitan, tempest, voidtitan };
