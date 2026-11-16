// Turn-based encounters. Weaken a creature by fighting it yourself or with a
// companion, then sing or dance to capture it. Every creature has a heart
// song: the right one makes capture far more likely, and legendaries ignore
// every other song. Resolves "caught", "won", "fled" or "blackout".
import { catchRates, creatureById, movesFor, statsFor, xpForLevel, xpReward } from "./creatures.js";
import { fxImpact, launchFx } from "./battleFx.js";
import { elementInfo, items, moves, songById, strongAgainst, typeMultiplier } from "./data.js";
import { addCaptured, claimLegendKey, hasCaught, learnReaction, markSeen, playerMoves, playerStats, useUpItem } from "./state.js";
import { zones } from "./zones.js";
import { clamp } from "./util.js";

const maxLevel = 60;
const songMultipliers = { heart: 2.6, liked: 1.35, none: 0.45 };
// Legendaries only answer their heart song, so when they hear it the odds
// get a big extra boost on top of the usual heart-song multiplier.
const legendaryHeartBonus = 3;
const reactionText = {
  heart: "is entranced! Its heart song!",
  liked: "sways along. It likes this one.",
  none: "seems unmoved.",
};

function fighterOf(battle) {
  const { state } = battle;
  if (battle.fighter === "you") {
    const stats = playerStats(state);
    return {
      element: "none",
      getHp: () => {
        return state.player.hp;
      },
      level: state.player.level,
      maxHp: stats.hp,
      moves: playerMoves(state),
      name: state.avatar.name,
      setHp: (hp) => {
        state.player.hp = hp;
      },
      stats,
    };
  }
  const c = state.party.find((p) => {
    return p.uid === battle.fighter;
  });
  const species = creatureById(c.species);
  const stats = statsFor(species, c.level);
  return {
    creature: c,
    element: species.element,
    getHp: () => {
      return c.hp;
    },
    level: c.level,
    maxHp: stats.hp,
    moves: movesFor(species, c.level),
    name: species.name,
    setHp: (hp) => {
      c.hp = hp;
    },
    stats,
  };
}

function damage(level, atk, def, moveId, attackerElement, defenderElement) {
  const move = moves[moveId];
  const mult = typeMultiplier(move.element, defenderElement);
  const same = move.element !== "none" && move.element === attackerElement ? 1.2 : 1;
  const crit = Math.random() < 0.06 ? 1.5 : 1;
  const base = (((2 * level) / 5 + 2) * move.power * atk) / Math.max(1, def) / 50 + 2;
  const amount = Math.max(1, Math.round(base * mult * same * crit * (0.85 + Math.random() * 0.15)));
  return { amount, crit: crit > 1, mult };
}

// HP left after a hit. A target at full HP always survives on at least 1, so
// no single attack can knock out a fresh creature; later hits can finish it.
function hpAfterHit(hp, maxHp, amount) {
  const floor = hp >= maxHp ? 1 : 0;
  return Math.max(Math.min(floor, hp), hp - amount);
}

async function effectLine(say, result) {
  if (result.crit) await say("A critical hit!");
  if (result.mult > 1) await say("It's super effective!");
  if (result.mult < 1) await say("It's not very effective...");
}

// Shows the "used" message while the move's effect flies across, and calls
// `land` the moment it reaches the target (unless it missed). Waits for both
// the message and the landing, so damage never shows before the hit.
function strike(b, text, moveId, from, missed, land) {
  const fx = launchFx(moveId, from, missed);
  b.scene.fx = fx;
  const arrival = new Promise((resolve) => {
    setTimeout(() => {
      if (!missed) land();
      resolve();
    }, fxImpact(fx));
  });
  return Promise.all([b.say(text), arrival]);
}

async function playerAttack(b, moveId) {
  const f = fighterOf(b);
  const wild = b.scene.wild;
  const missed = Math.random() < 0.05;
  const result = damage(f.level, f.stats.atk, wild.stats.def, moveId, f.element, wild.species.element);
  await strike(b, `${f.name} used ${moves[moveId].name}!`, moveId, "ally", missed, () => {
    wild.hp = hpAfterHit(wild.hp, wild.stats.hp, result.amount);
    b.scene.hit = { time: performance.now(), who: "wild" };
    b.sound("hit");
  });
  if (missed) {
    await b.say("It missed!");
    return;
  }
  await effectLine(b.say, result);
}

async function wildAttack(b) {
  const wild = b.scene.wild;
  const list = movesFor(wild.species, wild.level);
  const moveId = Math.random() < 0.35 ? list[0] : list[list.length - 1];
  const f = fighterOf(b);
  const missed = Math.random() < 0.06;
  const result = damage(wild.level, wild.stats.atk, f.stats.def, moveId, wild.species.element, f.element);
  await strike(b, `${wild.species.name} used ${moves[moveId].name}!`, moveId, "wild", missed, () => {
    f.setHp(hpAfterHit(f.getHp(), f.maxHp, result.amount));
    b.scene.hit = { time: performance.now(), who: "ally" };
    b.sound("hurt");
  });
  if (missed) {
    await b.say("It missed!");
    return;
  }
  await effectLine(b.say, result);
}

function levelUp(entity, gain) {
  entity.xp += gain;
  let grew = 0;
  while (entity.level < maxLevel && entity.xp >= xpForLevel(entity.level + 1)) {
    entity.level += 1;
    grew += 1;
  }
  return grew;
}

async function reward(b) {
  const { state } = b;
  const wild = b.scene.wild;
  const gain = xpReward(wild.species, wild.level);
  const legendary = wild.species.rarity === "legendary";
  const pearls = Math.round((6 + wild.level * 3) * (legendary ? 5 : 1));
  state.pearls += pearls;
  await b.say(`You found ${pearls} pearls.`);
  // A legendary leaves behind the key item to the next sealed region.
  const key = claimLegendKey(state, wild.species);
  if (key) {
    const opens = Object.values(zones).find((z) => {
      return z.requires === key;
    });
    b.sound("level");
    await b.say(`${wild.species.name} left you a ${items[key].name}!${opens ? ` The way into ${opens.name} is open.` : ""}`);
  }
  for (const uid of b.participants) {
    if (uid === "you") {
      const before = playerStats(state);
      const grew = levelUp(state.player, gain);
      if (grew) {
        const after = playerStats(state);
        state.player.hp = Math.min(after.hp, state.player.hp + after.hp - before.hp);
        b.sound("level");
        await b.say(`${state.avatar.name} grew to level ${state.player.level}!`);
      }
      continue;
    }
    const c = state.party.find((p) => {
      return p.uid === uid;
    });
    if (!c || c.hp <= 0) continue;
    const species = creatureById(c.species);
    const before = statsFor(species, c.level).hp;
    const grew = levelUp(c, gain);
    if (grew) {
      c.hp = Math.min(statsFor(species, c.level).hp, c.hp + statsFor(species, c.level).hp - before);
      b.sound("level");
      await b.say(`${species.name} grew to level ${c.level}!`);
    }
  }
}

async function chooseMove(b) {
  const f = fighterOf(b);
  const options = f.moves.map((id) => {
    const move = moves[id];
    const info = elementInfo[move.element];
    return {
      color: info?.color,
      label: move.name,
      sub: `${info?.label ?? "Normal"} · power ${move.power}`,
      value: id,
    };
  });
  options.push({ label: "Back", tone: "ghost", value: null });
  return b.choose(`${f.name}: choose a move`, options);
}

async function sing(b) {
  const { state } = b;
  const wild = b.scene.wild;
  const known = state.reactions[wild.species.id] ?? {};
  const options = state.songs.map((id) => {
    const song = songById[id];
    const reaction = known[id];
    let sub = song.kind;
    if (reaction) sub = `${song.kind} · ${{ heart: "heart song!", liked: "liked", none: "no effect" }[reaction]}`;
    return { label: song.name, sub, tone: reaction === "heart" ? "good" : "", value: id };
  });
  options.push({ label: "Back", tone: "ghost", value: null });
  const songId = await b.choose("Which song or dance?", options);
  if (!songId) return "back";
  const song = songById[songId];
  await b.say(`${state.avatar.name} begins the ${song.name}...`);
  const speed = { common: 1, legendary: 1.25, rare: 1.15, uncommon: 1.07 }[wild.species.rarity];
  const score = await b.playRhythm(song, speed);
  let reaction = "none";
  if (wild.species.heart === songId) reaction = "heart";
  else if (wild.species.liked === songId) reaction = "liked";
  learnReaction(state, wild.species.id, songId, reaction);
  const flawless = score >= 0.9;
  await b.say(`${flawless ? "A flawless performance!" : `Performance: ${Math.round(score * 100)}%.`} ${wild.species.name} ${reactionText[reaction]}`);
  const legendary = wild.species.rarity === "legendary";
  if (legendary && reaction !== "heart") {
    state.charm = 1;
    await b.say(`${wild.species.name} will only answer to its heart song.`);
    return "failed";
  }
  const hpFactor = 1.5 - wild.hp / wild.stats.hp;
  const perf = 0.35 + score * 0.85;
  const bonus = legendary ? legendaryHeartBonus : 1;
  const chance = clamp(catchRates[wild.species.rarity] * songMultipliers[reaction] * bonus * perf * hpFactor * state.charm, 0.02, 0.96);
  state.charm = 1;
  b.scene.capture = { start: performance.now() };
  b.sound("sing");
  await b.say("...");
  // A flawless heart song always lands.
  const caught = (flawless && reaction === "heart") || Math.random() < chance;
  if (!caught) {
    b.scene.capture = null;
    b.sound("wrong");
    await b.say(`${wild.species.name} broke free of the song!`);
    return "failed";
  }
  b.scene.capture = { done: true, start: performance.now() };
  b.sound("win");
  const where = addCaptured(state, wild.species, wild.level, Math.max(1, wild.hp));
  await b.say(`You befriended ${wild.species.name}!`);
  if (where === "storage") await b.say("Your team is full, so it swam off to your Tide Pool.");
  await reward(b);
  return "caught";
}

async function useBag(b) {
  const { state } = b;
  const usable = Object.keys(state.items).filter((id) => {
    return ["heal", "charm", "revive"].includes(items[id].kind);
  });
  if (usable.length === 0) {
    await b.say("Your bag has nothing to use in battle.");
    return false;
  }
  const options = usable.map((id) => {
    return { label: `${items[id].name} x${state.items[id]}`, sub: items[id].desc, value: id };
  });
  options.push({ label: "Back", tone: "ghost", value: null });
  const id = await b.choose("Use which item?", options);
  if (!id) return false;
  const item = items[id];
  if (item.kind === "charm") {
    state.charm = item.value;
    useUpItem(state, id);
    await b.say(`The ${item.name} hums softly. Your next song will be stronger.`);
    return true;
  }
  return useOnTarget(b, id);
}

async function useOnTarget(b, id) {
  const { state } = b;
  const item = items[id];
  const reviving = item.kind === "revive";
  const targets = [];
  if (!reviving) {
    targets.push({ label: state.avatar.name, sub: `${state.player.hp}/${playerStats(state).hp} HP`, value: "you" });
  }
  state.party.forEach((c) => {
    const species = creatureById(c.species);
    const max = statsFor(species, c.level).hp;
    if (reviving === c.hp <= 0) targets.push({ label: species.name, sub: `${c.hp}/${max} HP`, value: c.uid });
  });
  if (targets.length === 0) {
    await b.say(reviving ? "Nobody needs reviving." : "Nobody can use that.");
    return false;
  }
  targets.push({ label: "Back", tone: "ghost", value: null });
  const who = await b.choose(`Use ${item.name} on...`, targets);
  if (!who) return false;
  useUpItem(state, id);
  if (who === "you") {
    const max = playerStats(state).hp;
    state.player.hp = Math.min(max, state.player.hp + item.value);
    await b.say(`${state.avatar.name} feels better (${state.player.hp}/${max} HP).`);
    return true;
  }
  const c = state.party.find((p) => {
    return p.uid === who;
  });
  const species = creatureById(c.species);
  const max = statsFor(species, c.level).hp;
  c.hp = reviving ? Math.ceil(max * item.value) : Math.min(max, c.hp + item.value);
  await b.say(`${species.name} ${reviving ? "is back on its fins" : "feels better"} (${c.hp}/${max} HP).`);
  return true;
}

async function switchFighter(b) {
  const { state } = b;
  const options = [];
  if (b.fighter !== "you") {
    options.push({ label: state.avatar.name, sub: `You · ${state.player.hp} HP`, value: "you" });
  }
  state.party.forEach((c) => {
    if (c.uid === b.fighter || c.hp <= 0) return;
    const species = creatureById(c.species);
    options.push({ color: elementInfo[species.element].color, label: species.name, sub: `Lv ${c.level} · ${c.hp} HP`, value: c.uid });
  });
  if (options.length === 0) {
    await b.say("There's nobody else ready to fight.");
    return false;
  }
  options.push({ label: "Back", tone: "ghost", value: null });
  const pick = await b.choose("Who should fight?", options);
  if (!pick) return false;
  b.fighter = pick;
  b.participants.add(pick);
  b.sound("swap");
  await b.say(pick === "you" ? `${state.avatar.name} swims forward!` : `Go, ${fighterOf(b).name}!`);
  return true;
}

async function tryFlee(b) {
  const wild = b.scene.wild;
  const legendary = wild.species.rarity === "legendary";
  const mine = fighterOf(b).stats.spd;
  const odds = legendary ? 0.4 : clamp(0.55 + (mine - wild.stats.spd) * 0.03, 0.3, 0.95);
  if (Math.random() < odds) {
    await b.say("You swam away safely!");
    return true;
  }
  await b.say("The current pulls you back. You couldn't get away!");
  return false;
}

// When a hit drops the fighter to a third of its HP or less, suggest a
// healing item. It only speaks as the HP crosses the line, so it won't nag
// every turn, but it speaks again if you heal up and get knocked down.
const lowHpShare = 1 / 3;

async function lowHpHint(b, f, before) {
  const line = f.maxHp * lowHpShare;
  if (f.getHp() > line || before <= line) return;
  const heal = ["salve", "tonic"].find((id) => {
    return b.state.items[id] > 0;
  });
  if (!heal) {
    await b.say(`${f.name} is low on HP, and your bag has nothing to heal with. You could swim away!`);
    return;
  }
  const count = b.state.items[heal];
  await b.say(`${f.name} is low on HP! Open your Bag and use a ${items[heal].name} to heal (you have ${count}).`);
}

// The wild creature's turn, then checks for fainting.
async function enemyTurn(b) {
  const before = fighterOf(b).getHp();
  await wildAttack(b);
  const f = fighterOf(b);
  if (f.getHp() > 0) {
    await lowHpHint(b, f, before);
    return null;
  }
  if (b.fighter !== "you") {
    b.sound("faint");
    await b.say(`${f.name} fainted!`);
    b.fighter = "you";
    b.participants.add("you");
    await b.say(`${b.state.avatar.name} swims in to take over!`);
    return null;
  }
  b.sound("lose");
  await b.say(`${b.state.avatar.name} is too exhausted to go on...`);
  return "blackout";
}

// Scanning costs a turn and, in one line, names the elements the creature is
// weak to and its heart song. The heart song is written into your notes, so
// the Sing menu and the Codex remember it.
async function scan(b) {
  const species = b.scene.wild.species;
  const weakTo = Object.keys(strongAgainst).filter((id) => {
    return strongAgainst[id].includes(species.element);
  }).map((id) => {
    return elementInfo[id].label;
  });
  learnReaction(b.state, species.id, species.heart, "heart");
  b.sound("swap");
  await b.say(`${species.name} is weak to ${weakTo.join(" and ")}. Its heart song is the ${songById[species.heart].name}.`);
}

async function playerTurn(b) {
  const choice = await b.choose(`What will ${fighterOf(b).name} do?`, [
    { label: "Fight", sub: "Weaken it", tone: "fight", value: "fight" },
    { label: "Sing / Dance", sub: "Capture it", tone: "sing", value: "sing" },
    { label: "Bag", sub: "Use an item", value: "bag" },
    { label: "Team", sub: "Switch fighter", value: "team" },
    { label: "Scan", sub: "Reveal its secrets", value: "scan" },
    { label: "Swim away", sub: "Flee", tone: "ghost", value: "flee" },
  ], { columns: 3 });
  if (choice === "fight") {
    const moveId = await chooseMove(b);
    if (!moveId) return "again";
    const attacker = b.fighter;
    // A faster creature strikes first, and then doesn't strike again.
    if (b.scene.wild.stats.spd > fighterOf(b).stats.spd) {
      const result = await enemyTurn(b);
      if (result) return result;
      if (b.fighter === attacker) await playerAttack(b, moveId);
      return "acted-first";
    }
    await playerAttack(b, moveId);
    return "acted";
  }
  if (choice === "sing") {
    const result = await sing(b);
    if (result === "back") return "again";
    return result === "caught" ? "caught" : "acted";
  }
  if (choice === "bag") return (await useBag(b)) ? "acted" : "again";
  if (choice === "team") return (await switchFighter(b)) ? "acted" : "again";
  if (choice === "scan") {
    await scan(b);
    return "acted";
  }
  return (await tryFlee(b)) ? "fled" : "acted";
}

export async function runBattle(env, species, level) {
  const { state } = env;
  const stats = statsFor(species, level);
  const scene = env.scene;
  scene.wild = { hp: stats.hp, level, species, stats };
  scene.hit = null;
  scene.fx = null;
  scene.capture = null;
  const firstSighting = !state.seen.includes(species.id);
  const befriended = hasCaught(state, species.id);
  markSeen(state, species.id);
  const lead = state.party.find((c) => {
    return c.hp > 0;
  });
  const b = {
    ...env,
    fighter: lead ? lead.uid : "you",
    participants: new Set([lead ? lead.uid : "you"]),
  };
  b.scene.fighter = () => {
    return b.fighter;
  };
  const legendary = species.rarity === "legendary";
  await b.say(legendary ? `${species.name}, guardian of these waters, rises to meet you!` : `A wild ${species.name} (Lv ${level}) swims up!`);
  if (!befriended) {
    await b.say(firstSighting
      ? `New creature! You've never met a ${species.name} before. Befriend it to add it to your team!`
      : `You haven't befriended a ${species.name} yet. Sing to it to win it over!`);
  }
  if (lead) await b.say(`Go, ${creatureById(lead.species).name}!`);
  for (;;) {
    const outcome = await playerTurn(b);
    if (outcome === "again") continue;
    if (["caught", "fled", "blackout"].includes(outcome)) return outcome;
    if (b.scene.wild.hp <= 0) {
      b.sound("faint");
      await b.say(`The wild ${species.name} swam off, worn out.`);
      await reward(b);
      return "won";
    }
    if (outcome === "acted-first") continue;
    const result = await enemyTurn(b);
    if (result) return result;
  }
}
