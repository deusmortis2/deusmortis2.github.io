// Tidesong: an underwater open-world adventure. Create a mermaid, explore
// ten ocean regions, and befriend 150 sea creatures by weakening them in
// battle and then singing their heart song. Math: a question comes up after
// every battle, and resting at a Healer or waking up after blacking out
// each need one answered right too. Using items never asks a question.
import { askQuestion, loadQuestions } from "../questions.js";
import { assignedSource } from "../question-sets.js";
import { play } from "../sound.js";
import { bindFullscreen } from "../fullscreen.js";
import { initPage } from "../ui.js";
import { runBattle } from "./battle.js";
import { drawBattle } from "./battleView.js";
import { runCreator } from "./creator.js";
import { loadCastArt } from "./cast.js";
import { loadCreatureArt } from "./creatureArt.js";
import { pullSaves, pushSlot, pushUnlocks } from "./cloud.js";
import { claimUnlock } from "./unlocks.js";
import { creatureById } from "./creatures.js";
import { items } from "./data.js";
import { drawHud } from "./hud.js";
import { createInput } from "./input.js";
import { openBag, openCodex, openMainMenu, openMap, openTeam } from "./menus.js";
import { createPanels, html } from "./panels.js";
import { clearPortraitCache } from "./portrait.js";
import { createRhythm, rhythmScore, updateRhythm } from "./rhythm.js";
import { clearSpriteCache, drawModel, drawSwimmer, loadModelArt, spriteFrame, spriteFrames, spriteHeight, spriteWidth } from "./sprite.js";
import { deleteSave, healAll, listSaves, newState, saveGame } from "./state.js";
import { enterBuilding, visitLair } from "./town.js";
import { escapeHtml } from "./util.js";
import { preloadBattle, preloadScene, whenLoaded } from "./art.js";
import { createWorld, legendaryLevel, rollEncounter, tileSize } from "./world.js";
import { cameraFor, createWorldRenderer } from "./worldRender.js";
import { drawPosed, makePose, steerPose } from "./pose.js";
import { drawTurned, steerTurn } from "./turn.js";
import { keySource, zones } from "./zones.js";

// The bank the teacher has assigned this game (Teacher page).
const questionSource = await assignedSource("tidesong");
const swimSpeed = 190;
// The swimming sprite is drawn larger so you match the painted merfolk.
const playerScale = 1.8;
// Chance of meeting a creature on each step through the wild.
const encounterChance = 0.045;
const calmChance = 0.012;
// Start loading the next region this close to its edge.
const preloadRange = 360;
const autosaveEvery = 20;

const session = initPage();
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const frame = document.getElementById("game-frame");
const view = { camX: 0, camY: 0, height: canvas.height, time: 0, width: canvas.width };
const panels = createPanels(frame);
const input = createInput(frame.querySelector(".ts-stick"));
const lanesEl = frame.querySelector(".ts-lanes");
const world = createWorld();
const renderer = createWorldRenderer(world);
const username = session?.username ?? "guest";

const game = {
  atDoor: false,
  atLair: false,
  busy: false,
  dt: 0,
  facing: 1,
  flash: 0,
  inTown: false,
  mode: "title",
  moving: false,
  // An unlock step just reached: offer a new look once the player is free.
  lookOffer: null,
  // Mermaid swimming and turning poses (see pose.js).
  pose: makePose(),
  saveTimer: 0,
  scene: { zone: "prismreef" },
  sinceEncounter: 0,
  // Which save slot the adventure in play belongs to.
  slot: 0,
  state: null,
  stride: 0,
  swimAngle: 0,
  tilt: 0,
  turn: { angle: 0, speed: 0 },
  warned: 0,
};

const sounds = {
  buy: "place", door: "jump", encounter: "zap", faint: "kill", heal: "correct", hit: "bounce",
  hurt: "hit", level: "correct", lose: "lose", sing: "pickup", swap: "whoosh", win: "win", wrong: "wrong",
};

function sound(name) {
  play(sounds[name] ?? name);
}

const questionsReady = loadQuestions(questionSource).then(() => {
  return true;
}).catch(() => {
  document.getElementById("load-error").textContent = "Couldn't load the math questions, so they'll be skipped for now.";
  return false;
});

async function ask(label) {
  if (!(await questionsReady)) return true;
  await askQuestion({ inputDelay: 300, label, source: questionSource });
  return true;
}

function save() {
  if (!game.state) return;
  // Befriending 25, 50 and 75 creatures unlocks more merfolk, and each
  // time the player may switch to one.
  const reached = claimUnlock(game.state, username);
  if (reached) {
    if (reached.fresh) pushUnlocks(username);
    game.lookOffer = reached;
  }
  saveGame(game.state, username, game.slot);
  pushSlot(username, game.slot);
}

function isLocked(zone) {
  const need = zones[zone].requires;
  return Boolean(need) && !game.state.keys.includes(need);
}

// Regions you've swum in show on the ocean map.
function isVisited(zone) {
  return game.state.visited.includes(zone);
}

function visit(zone) {
  if (!game.state.visited.includes(zone)) game.state.visited.push(zone);
  preloadBattle(zone);
}

function placeAtTown(id) {
  const town = world.townById(id) ?? world.towns[0];
  game.state.zone = town.zone;
  game.state.player.x = town.x;
  game.state.player.y = town.y;
  game.atDoor = false;
  game.atLair = false;
  visit(town.zone);
}

// Town buildings are solid; the four corners of your body are checked.
function blocked(x, y) {
  const corners = [[-20, -14], [20, -14], [-20, 16], [20, 16]];
  return corners.some(([dx, dy]) => {
    return world.isSolid(game.state.zone, x + dx, y + dy);
  });
}

// If you'd come out inside a building (an edge that lands on a tower, or a
// save made while stuck), move to the nearest open water instead.
function unstick(p) {
  if (!blocked(p.x, p.y)) return;
  const z = zones[game.state.zone];
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
  for (let d = 8; d <= 1200; d += 8) {
    const spot = dirs.map(([dx, dy]) => {
      return { x: p.x + dx * d, y: p.y + dy * d };
    }).find((s) => {
      return s.x > 24 && s.y > 24 && s.x < z.width - 24 && s.y < z.height - 24 && !blocked(s.x, s.y);
    });
    if (spot) {
      p.x = spot.x;
      p.y = spot.y;
      return;
    }
  }
}

function warnSealed(zone) {
  if (view.time - game.warned < 3) return;
  game.warned = view.time;
  const key = zones[zone].requires;
  const from = keySource(key);
  panels.toast(`A powerful current blocks the way into ${zones[zone].name}. You need a ${items[key].name}.${from ? ` The legendary of ${from.name} guards one.` : ""}`);
}

// Crossing an edge carries you into the next region, if it's open to you.
function crossEdge(nx, ny) {
  const { state } = game;
  const exit = world.exitAt(state.zone, nx, ny);
  if (!exit) return false;
  if (!exit.to) return true;
  if (isLocked(exit.to)) {
    warnSealed(exit.to);
    return true;
  }
  const from = state.zone;
  const at = world.arrival(from, exit);
  state.zone = exit.to;
  state.player.x = at.x;
  state.player.y = at.y;
  unstick(state.player);
  game.flash = view.time;
  game.fade = true;
  game.atDoor = false;
  game.atLair = false;
  visit(exit.to);
  panels.toast(zones[exit.to].name);
  return true;
}

// Loads the region ahead when you swim close to an edge.
function preloadAhead(p) {
  const z = zones[game.state.zone];
  const probes = [[p.x, -1], [p.x, z.height + 1], [-1, p.y], [z.width + 1, p.y]];
  const near = [p.y, z.height - p.y, p.x, z.width - p.x];
  probes.forEach(([x, y], i) => {
    if (near[i] > preloadRange) return;
    const exit = world.exitAt(game.state.zone, x, y);
    if (exit?.to && !isLocked(exit.to)) preloadScene(exit.to);
  });
}

function battleEnv() {
  return {
    choose: panels.choose,
    playRhythm,
    say: panels.say,
    scene: game.scene,
    sound,
    state: game.state,
  };
}

function playRhythm(song, speed) {
  panels.hideBattle();
  lanesEl.hidden = false;
  input.clearLanes();
  game.scene.rhythm = createRhythm(song, speed);
  return new Promise((resolve) => {
    game.scene.rhythmDone = () => {
      const score = rhythmScore(game.scene.rhythm);
      game.scene.rhythm = null;
      lanesEl.hidden = true;
      resolve(score);
    };
  });
}

async function startBattle(species, level) {
  game.busy = true;
  game.flash = view.time;
  game.fade = false;
  sound("encounter");
  await new Promise((r) => {
    setTimeout(r, 450);
  });
  game.mode = "battle";
  game.scene = { zone: game.state.zone };
  const result = await runBattle(battleEnv(), species, level);
  panels.hideBattle();
  if (result === "blackout") {
    const lost = Math.floor(game.state.pearls * 0.15);
    game.state.pearls -= lost;
    await ask("You blacked out! Answer to wake up safe in town");
    healAll(game.state);
    placeAtTown(game.state.lastTown);
    panels.toast(`You woke up in ${world.townById(game.state.lastTown).name}, fully healed.${lost ? ` You dropped ${lost} pearls.` : ""}`, 4000);
  } else {
    await ask("Battle over! Answer to keep swimming");
  }
  game.mode = "explore";
  game.sinceEncounter = 0;
  game.busy = false;
  input.flush();
  save();
}

async function openScreen(kind) {
  game.busy = true;
  const env = { isLocked, isVisited, panels, sound, state: game.state, world };
  if (kind === "menu") {
    const choice = await openMainMenu(env);
    if (choice === "quit" && !window.confirm("Quit to the main menu without saving? Anything since your last save will be lost.")) {
      game.busy = false;
      return openScreen("menu");
    }
    if (choice === "title" || choice === "quit") {
      // Saved first, so the adventure is waiting in its slot. Quitting skips
      // this, so the slot keeps its last save.
      if (choice === "title") save();
      game.state = null;
      game.mode = "title";
      game.busy = false;
      showTitle();
      return;
    }
    if (choice === "graphics") {
      game.state.lowGraphics = !game.state.lowGraphics;
      panels.toast(`Graphics set to ${game.state.lowGraphics ? "low (faster on older Chromebooks)" : "full"}.`);
    } else if (choice === "save") {
      save();
      panels.toast("Saved!");
    } else if (choice !== "resume") {
      game.busy = false;
      return openScreen(choice);
    }
  }
  if (kind === "codex") await openCodex(env, game.state.zone);
  if (kind === "team" || kind === "party") await openTeam(env);
  if (kind === "bag") await openBag(env);
  if (kind === "map") await openMap(env);
  save();
  input.flush();
  game.busy = false;
}

async function useDoor(door) {
  const { state } = game;
  game.busy = true;
  sound("door");
  const town = world.townById(door.town);
  state.lastTown = town.id;
  await enterBuilding({ ask, panels, save, sound, state }, town, door.kind);
  input.flush();
  game.busy = false;
}

async function useLair(lair) {
  const { state } = game;
  const species = creatureById(lair.species);
  if (state.caught.includes(species.id)) {
    panels.toast(`${species.name} rests in ${lair.name} peacefully. It's your friend now.`);
    return;
  }
  game.busy = true;
  const go = await visitLair(panels, lair, species);
  input.flush();
  game.busy = false;
  if (go) await startBattle(species, legendaryLevel(species.id));
}

// At an unlock step: the character picker, starting on the current look.
async function offerLook() {
  const { count, fresh } = game.lookOffer;
  game.lookOffer = null;
  game.busy = true;
  // The note under the tabs gives the counts, so the heading stays short.
  const title = fresh ? `${count} befriended! New merfolk unlocked!` : `${count} befriended! Switch your look?`;
  const chosen = await runCreator(panels, username, { switching: game.state.avatar, title });
  if (chosen) {
    game.state.avatar = chosen;
    // The pictures and turn pose belong to the old character.
    game.pose = makePose();
    clearPortraitCache();
    clearSpriteCache();
    save();
    panels.toast("New look saved!");
  }
  input.flush();
  game.busy = false;
}

// One step through the wild: maybe a creature appears.
async function step() {
  const { state } = game;
  const p = state.player;
  state.steps += 1;
  game.sinceEncounter += 1;
  if (state.calmSteps > 0) state.calmSteps -= 1;
  if (!world.isWild(state.zone, p.x, p.y) || game.sinceEncounter < 6) return;
  if (Math.random() < (state.calmSteps > 0 ? calmChance : encounterChance)) {
    const { level, species } = rollEncounter(state.zone, { caught: state.caught, streak: state.discovery ?? 0 });
    // Meeting one you haven't befriended resets the boost; otherwise it grows.
    state.discovery = state.caught.includes(species.id) ? (state.discovery ?? 0) + 1 : 0;
    await startBattle(species, level);
  }
}

// Doors, lairs and towns trigger as you swim into them.
function checkSpot() {
  const { state } = game;
  const p = state.player;
  const door = world.doorAt(state.zone, p.x, p.y);
  if (door && !game.atDoor) {
    game.atDoor = true;
    useDoor(door);
    return true;
  }
  game.atDoor = Boolean(door);
  const lair = world.lairAt(state.zone, p.x, p.y);
  if (lair && !game.atLair) {
    game.atLair = true;
    useLair(lair);
    return true;
  }
  game.atLair = Boolean(lair);
  const area = world.region(state.zone).area;
  const inTown = p.x >= area.x0 && p.x <= area.x1 && p.y >= area.y0 && p.y <= area.y1;
  if (inTown && !game.inTown) panels.toast(`Welcome to ${zones[state.zone].town.name}!`);
  game.inTown = inTown;
  return false;
}

function updateExplore(dt) {
  const { state } = game;
  const action = input.nextAction();
  if (action && action !== "confirm") {
    openScreen(action);
    return;
  }
  const dir = input.direction();
  game.moving = dir.x !== 0 || dir.y !== 0;
  if (dir.x !== 0) game.facing = dir.x < 0 ? -1 : 1;
  game.tilt += ((game.moving ? Math.atan2(dir.y, Math.abs(dir.x) + 0.001) * 0.7 : 0) - game.tilt) * Math.min(1, dt * 8);
  steerSwimmer(dir, dt);
  const p = state.player;
  const sx = p.x;
  const sy = p.y;
  const nx = p.x + dir.x * swimSpeed * dt;
  const ny = p.y + dir.y * swimSpeed * dt;
  if (crossEdge(nx, p.y) || crossEdge(p.x, ny)) return;
  if (!blocked(nx, p.y)) p.x = nx;
  if (!blocked(p.x, ny)) p.y = ny;
  preloadAhead(p);
  if (checkSpot()) return;
  game.stride += Math.hypot(p.x - sx, p.y - sy);
  if (game.stride >= tileSize) {
    game.stride -= tileSize;
    step();
  }
  game.saveTimer += dt;
  if (game.saveTimer > autosaveEvery) {
    game.saveTimer = 0;
    save();
  }
}

// While swimming the side profile tips towards the direction of travel
// (in the mirrored frame, so 0 is level and up is negative). Changing
// direction turns the picture round (see turn.js) rather than snapping.
function steerSwimmer(dir, dt) {
  if (game.moving) {
    const target = Math.atan2(dir.y, Math.abs(dir.x)) * 0.8;
    game.swimAngle += (target - game.swimAngle) * Math.min(1, dt * 7);
  }
  steerTurn(game.turn, game.facing, dt);
  steerPose(game.pose, game.facing, game.moving, dt);
}

function drawPlayer() {
  const p = game.state.player;
  const sx = p.x - view.camX;
  const sy = p.y - view.camY;
  // At rest the front model floats upright and bobs. The bob eases out as
  // she sets off rather than stopping dead.
  const still = 1 - game.pose.swim;
  const bob = Math.sin(view.time * 2) * 2 * still;
  ctx.save();
  ctx.translate(sx, sy + bob);
  // Everyone turns through their own drawn poses (pose.js); turning like a
  // card is only the fallback when that art is missing.
  const wobble = Math.sin(view.time * 2) * 0.025 * still;
  if (!drawPosed(ctx, game.state.avatar, game.pose, game.swimAngle, wobble)) {
    drawTurned(ctx, game.turn.angle, paintPlayer);
  }
  ctx.restore();
  return { sx, sy };
}

// Paints the player facing right, centred on (0, 0).
function paintPlayer(c) {
  const { avatar } = game.state;
  if (game.moving) {
    // Swimming switches to the side profile; only its tail moves.
    const flap = Math.sin(view.time * 10) * 0.4;
    if (drawSwimmer(c, avatar, game.swimAngle, flap)) return;
  } else {
    c.rotate(Math.sin(view.time * 2) * 0.025);
  }
  if (drawModel(c, avatar)) return;
  const speed = game.moving ? 14 : 5;
  const f = Math.floor(view.time * speed) % spriteFrames;
  // The drawn stand-in is already a side view, so it only leans.
  c.rotate(game.tilt * 0.35);
  c.scale(playerScale, playerScale);
  c.drawImage(spriteFrame(avatar, f), -spriteWidth / 2, -spriteHeight / 2);
}

function renderExplore() {
  const { state } = game;
  const p = state.player;
  Object.assign(view, cameraFor(state.zone, p.x, p.y, view));
  renderer.draw(ctx, view, {
    caught: new Set(state.caught),
    isLocked,
    player: p,
    time: view.time,
    zone: state.zone,
  });
  const { sx, sy } = drawPlayer();
  renderer.drawAmbience(ctx, view, {
    dt: game.dt,
    hasLantern: game.state.keys.includes("lanternJelly"),
    lowGraphics: game.state.lowGraphics,
    screenX: sx,
    screenY: sy,
    time: view.time,
    zone: game.state.zone,
  });
  drawHud(ctx, game.state, world, view);
  // A white flash before a battle, or a quick dip to dark between regions.
  const flash = view.time - game.flash;
  if (flash < 0.45) {
    ctx.fillStyle = game.fade
      ? `rgba(4,10,26,${0.9 * (1 - flash / 0.45)})`
      : `rgba(255,255,255,${0.8 * (1 - flash / 0.45)})`;
    ctx.fillRect(0, 0, view.width, view.height);
  }
}

function renderBackdrop() {
  const g = ctx.createLinearGradient(0, 0, 0, view.height);
  g.addColorStop(0, "#5fd0ee");
  g.addColorStop(1, "#0a2c50");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, view.width, view.height);
  renderer.drawAmbience(ctx, view, {
    dt: game.dt, hasLantern: false, lowGraphics: false, screenX: 0, screenY: 0, time: view.time, zone: "prismreef",
  });
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  game.dt = dt;
  view.time += dt;
  if (game.mode === "explore" && game.state) {
    if (!game.busy && !panels.isOpen() && game.lookOffer) offerLook();
    if (!game.busy && !panels.isOpen()) updateExplore(dt);
    renderExplore();
  } else if (game.mode === "battle") {
    const r = game.scene.rhythm;
    if (r && updateRhythm(r, input.takeLanes())) game.scene.rhythmDone();
    drawBattle(ctx, game.scene, game.state, view);
  } else {
    renderBackdrop();
  }
  requestAnimationFrame(loop);
}

function begin(state) {
  game.state = state;
  game.lookOffer = null;
  game.mode = "explore";
  game.atDoor = true;
  game.atLair = true;
  game.inTown = true;
  game.stride = 0;
  clearPortraitCache();
  clearSpriteCache();
  if (!zones[state.zone]) placeAtTown(state.lastTown);
  unstick(state.player);
  visit(state.zone);
  input.flush();
}

async function newGame(slot) {
  const avatar = await runCreator(panels, username);
  // Backing out of the character select returns to the main menu.
  if (!avatar) {
    showTitle();
    return;
  }
  const home = world.townById("coralhaven");
  const state = newState(avatar, { x: home.x, y: home.y, zone: home.zone });
  healAll(state);
  game.slot = slot;
  begin(state);
  save();
  panels.toast(`Welcome to Coralhaven Market, ${state.avatar.name}! Swim out of town to meet wild creatures. Visit the Shop and Song Hall here first.`, 7000);
}

async function continueGame(saved, slot) {
  panels.close();
  // The region you saved in may not be loaded yet if it isn't slot 1's.
  await whenLoaded(zones[saved.zone] ? saved.zone : "prismreef");
  game.slot = slot;
  begin(saved);
  panels.toast(`Welcome back, ${saved.avatar.name}!`);
}

function slotRow(saved, slot) {
  if (!saved) {
    return `<li class="ts-slot empty">
      <span class="ts-slot-info"><b>Slot ${slot + 1}</b>Empty</span>
      <button type="button" class="ts-btn go" data-new="${slot}">New character</button>
    </li>`;
  }
  return `<li class="ts-slot">
    <span class="ts-slot-info"><b>Slot ${slot + 1}: ${escapeHtml(saved.avatar.name)}</b>Level ${saved.player.level}, ${saved.caught.length}/150 befriended</span>
    <button type="button" class="ts-btn go" data-continue="${slot}">Continue</button>
    <button type="button" class="ts-btn ghost small" data-delete="${slot}">Delete</button>
  </li>`;
}

function showTitle() {
  const saves = listSaves(username);
  panels.open("ts-title", (root) => {
    const full = saves.every(Boolean);
    const view2 = html(`
      <div class="ts-title-card">
        <h2>TIDESONG</h2>
        <p>Explore a vast ocean, sing to sea creatures and befriend all 150.</p>
        <ul class="ts-slots">${saves.map(slotRow).join("")}</ul>
        ${full ? "<p class=\"ts-note\">Every slot is in use. Delete one to start a new character.</p>" : ""}
      </div>`);
    root.append(view2);
    view2.querySelectorAll("[data-continue]").forEach((b) => {
      b.addEventListener("click", () => {
        const slot = Number(b.dataset.continue);
        continueGame(saves[slot], slot);
      });
    });
    view2.querySelectorAll("[data-new]").forEach((b) => {
      b.addEventListener("click", () => {
        panels.close();
        newGame(Number(b.dataset.new));
      });
    });
    view2.querySelectorAll("[data-delete]").forEach((b) => {
      b.addEventListener("click", () => {
        const slot = Number(b.dataset.delete);
        if (!window.confirm(`Delete ${saves[slot].avatar.name}'s adventure in slot ${slot + 1}? This can't be undone.`)) return;
        deleteSave(username, slot);
        pushSlot(username, slot);
        panels.close();
        showTitle();
      });
    });
    view2.querySelector("button").focus();
  });
}

// Lane buttons for touch screens during songs.
lanesEl.querySelectorAll("button").forEach((button) => {
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    input.pressLane(Number(button.dataset.lane));
  });
});

frame.querySelectorAll("[data-open]").forEach((button) => {
  button.addEventListener("click", () => {
    if (game.mode === "explore" && !game.busy && !panels.isOpen()) openScreen(button.dataset.open);
  });
});

window.addEventListener("beforeunload", save);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) save();
});
bindFullscreen(document.getElementById("fullscreen"), frame);

if (session) {
  // A signed-in student's saves from other computers come down first.
  await pullSaves(username);
  // The merfolk and creature pictures, the ocean map and the first region
  // load before the title screen.
  const firstZone = listSaves(username).find(Boolean)?.zone ?? "prismreef";
  Promise.all([loadCastArt(), loadModelArt(), loadCreatureArt(), whenLoaded(zones[firstZone] ? firstZone : "prismreef")]).finally(() => {
    showTitle();
    requestAnimationFrame(loop);
  });
}

// For the arcade's headless preview capture and debugging.
window.__tidesong = { begin, game, openScreen, startBattle, world };
