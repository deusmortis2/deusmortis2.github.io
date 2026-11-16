// The painted art: region scenes, battle backgrounds, town and lair
// pictures and the ocean map. Images load on first use and are kept, except
// region scenes, which are large, so only the few most recent stay in memory.
const root = "img/tidesong/";
const cache = new Map();
const keepScenes = 3;
const sceneOrder = [];
// Bump a region's tag whenever its scene file is repainted, so browsers
// holding the old picture fetch the new one.
const sceneVersions = { fangshore: "den1" };

function load(path) {
  if (cache.has(path)) return cache.get(path);
  const img = new Image();
  const entry = { img, ready: false };
  img.decoding = "async";
  img.addEventListener("load", () => {
    entry.ready = true;
  });
  img.src = root + path;
  cache.set(path, entry);
  return entry;
}

// The image if it has loaded, or null while it is still on its way.
function ready(path) {
  const entry = load(path);
  return entry.ready ? entry.img : null;
}

// Marks a scene as recently used and forgets the oldest ones.
function touchScene(zone) {
  const tag = sceneVersions[zone];
  const path = `zones/${zone}.jpg${tag ? `?v=${tag}` : ""}`;
  const at = sceneOrder.indexOf(path);
  if (at !== 0) {
    if (at > 0) sceneOrder.splice(at, 1);
    sceneOrder.unshift(path);
    sceneOrder.splice(keepScenes).forEach((old) => {
      cache.delete(old);
    });
  }
  return path;
}

export function sceneImage(zone) {
  return ready(touchScene(zone));
}

// Starts loading a region's scene ahead of time (the one you're swimming
// towards).
export function preloadScene(zone) {
  load(touchScene(zone));
}

export function battleImage(zone) {
  return ready(`battles/${zone}.jpg`);
}

export function preloadBattle(zone) {
  load(`battles/${zone}.jpg`);
}

// The shopkeepers who stand outside each town's buildings.
export function keeperSheet() {
  return ready("shopkeepers.webp");
}

export function oceanMap() {
  return ready("ocean-map.jpg");
}

// Plain URLs for pictures shown in HTML panels.
export function townPicture(zone) {
  return `${root}towns/${zone}.jpg`;
}

export function lairPicture(zone) {
  return `${root}lairs/${zone}.jpg`;
}

export function oceanMapUrl() {
  return `${root}ocean-map.jpg`;
}

// Resolves once the ocean map and the first region are ready to draw.
export function whenLoaded(zone) {
  const wait = (entry) => {
    if (entry.ready) return Promise.resolve();
    return entry.img.decode().catch(() => {
      return null;
    });
  };
  sceneImage(zone);
  return Promise.all([wait(load(`zones/${zone}.jpg`)), wait(load("ocean-map.jpg"))]);
}
