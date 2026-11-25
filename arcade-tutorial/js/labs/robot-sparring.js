// Lab: a robot sparring ring, practising a damage function that answers
// "blocked", "hurt" or points, a cooldown that refills charges one at a
// time, a level-based recharge time and XP that can level up repeatedly.
import { fn } from "./checks.js";

function robot(overrides = {}) {
  return { down: false, guarding: false, hp: 3, points: 50, ...overrides };
}

function battery(overrides = {}) {
  return { charges: 0, clock: 0, max: 3, refill: 2, ...overrides };
}

export default {
  firstTab: "js",
  intro: `
    <p>In the sparring ring, two practice robots punch it out. Each punch
    can be blocked by a guard, dent the other robot, or knock it down for
    points. Punches use up battery charges that refill over time, and
    winning bouts earns XP that makes the battery recharge faster.</p>
    <p>These are the same patterns as the dragon's fireballs and levels in
    Deus Draconis. Write each function as a top-level <strong>function
    declaration</strong>. There's no preview: the tests check the
    functions.</p>`,
  starter: {
    css: "",
    html: `<h1>Robot Sparring</h1>
<p>Bonus: build a scoreboard for a bout here.</p>
`,
    js: `function hitRobot(target, damage) {
}

function rechargeTick(battery, dt) {
}

function refillTime(level) {
}

function xpNeeded(level) {
}

function addXp(progress, amount) {
}
`,
  },
  stories: [
    "<code>hitRobot(target, damage)</code> applies one punch. If <code>target.guarding</code> is true, nothing changes and it returns <code>\"blocked\"</code>. Otherwise it takes <code>damage</code> off <code>target.hp</code>. If the robot still has more than 0 hp it returns <code>\"hurt\"</code>; if not, it sets <code>target.down</code> to <code>true</code> and returns <code>target.points</code>.",
    "<code>rechargeTick(battery, dt)</code> runs one frame of the battery's cooldown. A battery is <code>{ charges, max, clock, refill }</code>. While <code>charges</code> is below <code>max</code>, add <code>dt</code> to <code>clock</code>; when full, set <code>clock</code> to 0. Then, if <code>clock</code> has reached <code>refill</code>, add one charge and set <code>clock</code> back to 0. Change the battery object and also return it.",
    "<code>refillTime(level)</code> returns the seconds to refill one charge: 4 at level 1, 20% quicker for each level after that (<code>4 * 0.8 ** (level - 1)</code>), but never less than 1.",
    "<code>xpNeeded(level)</code> returns the XP needed to finish that level: <code>10 + level * 5</code>.",
    "<code>addXp(progress, amount)</code> adds XP to <code>progress</code> (<code>{ level, xp }</code>). While the XP is enough to finish the current level, take that much XP off and go up a level. Leftover XP carries over. Return how many levels were gained.",
  ],
  tests: [
    {
      run: (t) => {
        const hitRobot = fn(t, "hitRobot");
        const target = robot();
        const result = hitRobot(target, 1);
        return result === "hurt" && target.hp === 2 && target.down === false;
      },
      text: "A punch for 1 on a 3-hp robot returns <code>\"hurt\"</code> and leaves it on 2 hp.",
    },
    {
      run: (t) => {
        const hitRobot = fn(t, "hitRobot");
        const a = robot({ hp: 2 });
        const b = robot({ hp: 1, points: 80 });
        return (
          hitRobot(a, 5) === 50 && a.down === true &&
          hitRobot(b, 1) === 80 && b.down === true && b.hp === 0
        );
      },
      text: "A punch that takes the robot to 0 hp or below knocks it down and returns its <code>points</code>.",
    },
    {
      run: (t) => {
        const hitRobot = fn(t, "hitRobot");
        const target = robot({ guarding: true, hp: 1 });
        return hitRobot(target, 9) === "blocked" && target.hp === 1 && target.down === false;
      },
      text: "A guarding robot blocks: the result is <code>\"blocked\"</code> and its hp doesn't change.",
    },
    {
      run: (t) => {
        const rechargeTick = fn(t, "rechargeTick");
        const b = battery();
        rechargeTick(b, 0.5);
        const half = b.clock === 0.5 && b.charges === 0;
        rechargeTick(b, 1.5);
        return half && b.charges === 1 && b.clock === 0;
      },
      text: "<code>rechargeTick</code> counts up the clock, and adds a charge (resetting the clock) once it reaches <code>refill</code>.",
    },
    {
      run: (t) => {
        const rechargeTick = fn(t, "rechargeTick");
        const b = battery({ charges: 3, clock: 1.5 });
        const returned = rechargeTick(b, 1);
        return returned === b && b.charges === 3 && b.clock === 0;
      },
      text: "A full battery keeps its clock at 0 and never goes over <code>max</code>. <code>rechargeTick</code> returns the same battery object.",
    },
    {
      run: (t) => {
        const rechargeTick = fn(t, "rechargeTick");
        const b = battery({ charges: 1, refill: 1 });
        for (let i = 0; i < 40; i += 1) rechargeTick(b, 0.25);
        return b.charges === 3 && b.clock === 0;
      },
      text: "Ten seconds of small ticks fills a battery to <code>max</code> and no further.",
    },
    {
      run: (t) => {
        const refillTime = fn(t, "refillTime");
        return (
          refillTime(1) === 4 &&
          Math.abs(refillTime(2) - 3.2) < 1e-9 &&
          Math.abs(refillTime(4) - 2.048) < 1e-9 &&
          refillTime(10) === 1 &&
          refillTime(50) === 1
        );
      },
      text: "<code>refillTime</code> is 4 at level 1, 3.2 at level 2, and never drops below 1.",
    },
    {
      run: (t) => {
        const xpNeeded = fn(t, "xpNeeded");
        return xpNeeded(1) === 15 && xpNeeded(2) === 20 && xpNeeded(10) === 60;
      },
      text: "<code>xpNeeded</code> is 15 for level 1, 20 for level 2 and 60 for level 10.",
    },
    {
      run: (t) => {
        const addXp = fn(t, "addXp");
        const p = { level: 1, xp: 0 };
        const none = addXp(p, 10);
        const one = addXp(p, 10);
        return none === 0 && one === 1 && p.level === 2 && p.xp === 5;
      },
      text: "<code>addXp</code> levels up once the XP is enough, and the leftover carries over: 10 + 10 XP at level 1 is level 2 with 5 XP.",
    },
    {
      run: (t) => {
        const addXp = fn(t, "addXp");
        const p = { level: 1, xp: 0 };
        const gained = addXp(p, 65);
        return gained === 3 && p.level === 4 && p.xp === 5;
      },
      text: "One big reward can gain several levels: 65 XP from level 1 is three levels (15 + 20 + 25), with 5 left over.",
    },
  ],
  title: "Robot Sparring",
};
