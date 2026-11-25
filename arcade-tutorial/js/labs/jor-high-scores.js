// Lab: a pinball machine's best scores, practising Jörmungandr's high
// score code: a key per player, localStorage wrapped in try/catch, zero
// padding, and saving only a new best.
import { fn, text } from "./checks.js";

const prefix = "pinballBest:";

// The lab page shares this site's localStorage, so old test scores are
// cleared before and after every test.
function clearScores() {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(prefix))
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    // Storage blocked: there's nothing to clear.
  }
}

// Makes localStorage throw on the lab page, like a blocked browser.
function blockStorage(t) {
  Object.defineProperty(t.win, "localStorage", {
    configurable: true,
    get() {
      throw new t.win.Error("Storage is blocked.");
    },
  });
}

export default {
  beforeEach: clearScores,
  firstTab: "js",
  intro: `
    <p>An old pinball machine in the corner of a café keeps each regular's
    best score. Write its high-score code the way Jörmungandr's
    <code>loadHigh</code>, <code>saveHigh</code> and <code>recordRun</code>
    do: one <code>localStorage</code> key per player, never crashing when
    storage is blocked, and only ever keeping a <em>better</em> score.</p>
    <p>Write each function as a top-level <strong>function
    declaration</strong> so the tests can find it. The tests also check
    what the page shows when it loads.</p>`,
  starter: {
    css: "",
    html: `<h1>Pinball Hall of Fame</h1>
<p>Player: <span id="player">guest</span></p>
<p>Best: <span id="best"></span></p>
`,
    js: `function pad(score) {
}

function bestKey(player) {
}

function loadBest(player) {
}

function saveBest(player, score) {
}

function betterScore(saved, score) {
}
`,
  },
  stories: [
    "<code>pad(score)</code> rounds the score down to a whole number and returns it as a string of at least 6 digits, with zeros in front: <code>pad(42.9)</code> is <code>\"000042\"</code>.",
    "<code>bestKey(player)</code> returns the storage key <code>pinballBest:</code> followed by the player's name, or <code>pinballBest:guest</code> when <code>player</code> is <code>null</code> or <code>undefined</code>.",
    "<code>loadBest(player)</code> reads that player's saved best from <code>localStorage</code> and returns it as a number. Nothing saved, something unreadable, or storage that throws an error all give <code>0</code>.",
    "<code>saveBest(player, score)</code> works out the new best (the bigger of the saved best and <code>score</code>), saves it as a string under the player's key, and returns it. If storage throws, it still returns the new best without crashing.",
    "<code>betterScore(saved, score)</code> rounds <code>score</code> down, and returns it only if it's above 0 <em>and</em> above <code>saved</code> (a missing <code>saved</code> counts as 0). Otherwise it returns <code>null</code>. A score of <code>NaN</code> gives <code>null</code>.",
    "When the page loads, <code>#best</code> shows the guest's best, padded: <code>000000</code> if there isn't one.",
  ],
  tests: [
    {
      run: (t) => {
        const pad = fn(t, "pad");
        return (
          pad(42.9) === "000042" &&
          pad(0) === "000000" &&
          pad(1250) === "001250" &&
          pad(1234567) === "1234567"
        );
      },
      text: "<code>pad</code> rounds down and adds zeros up to 6 digits, without cutting longer scores.",
    },
    {
      run: (t) => {
        const bestKey = fn(t, "bestKey");
        return (
          bestKey("ana") === "pinballBest:ana" &&
          bestKey(null) === "pinballBest:guest" &&
          bestKey(undefined) === "pinballBest:guest"
        );
      },
      text: "<code>bestKey</code> includes the player's name, or <code>guest</code>.",
    },
    {
      run: (t) => {
        const loadBest = fn(t, "loadBest");
        localStorage.setItem(`${prefix}ana`, "900");
        localStorage.setItem(`${prefix}bo`, "lots");
        return loadBest("ana") === 900 && loadBest("bo") === 0 &&
          loadBest("cy") === 0;
      },
      text: "<code>loadBest</code> returns the saved number, and <code>0</code> when there's nothing saved or it isn't a number.",
    },
    {
      run: (t) => {
        const saveBest = fn(t, "saveBest");
        const first = saveBest("ana", 500);
        const lower = saveBest("ana", 300);
        const higher = saveBest("ana", 800);
        return first === 500 && lower === 500 && higher === 800 &&
          localStorage.getItem(`${prefix}ana`) === "800";
      },
      text: "<code>saveBest</code> keeps the bigger score and saves it under the player's key.",
    },
    {
      run: (t) => {
        const saveBest = fn(t, "saveBest");
        saveBest("ana", 700);
        saveBest(null, 50);
        return localStorage.getItem(`${prefix}ana`) === "700" &&
          localStorage.getItem(`${prefix}guest`) === "50";
      },
      text: "Each player has their own best, and a missing player is the guest.",
    },
    {
      run: (t) => {
        const loadBest = fn(t, "loadBest");
        const saveBest = fn(t, "saveBest");
        blockStorage(t);
        return loadBest("ana") === 0 && saveBest("ana", 450) === 450;
      },
      text: "With storage blocked, <code>loadBest</code> gives 0 and <code>saveBest</code> still returns the score instead of throwing.",
    },
    {
      run: (t) => {
        const betterScore = fn(t, "betterScore");
        return (
          betterScore(900, 1200.7) === 1200 &&
          betterScore(undefined, 30) === 30 &&
          betterScore(900, 600) === null &&
          betterScore(900, 900) === null
        );
      },
      text: "<code>betterScore</code> returns a rounded-down score only when it beats the saved one.",
    },
    {
      run: (t) => {
        const betterScore = fn(t, "betterScore");
        return betterScore(0, 0) === null && betterScore(0, -5) === null &&
          betterScore(0, Number.NaN) === null;
      },
      text: "Scores of 0, below 0, or <code>NaN</code> are never saved.",
    },
    {
      run: async (t) => {
        const empty = text(t.$("#best"));
        localStorage.setItem(`${prefix}guest`, "1250");
        const again = await t.reload();
        return empty === "000000" && text(again.$("#best")) === "001250";
      },
      text: "On load, <code>#best</code> shows the guest's best padded to 6 digits.",
    },
  ],
  title: "Pinball Hall of Fame",
};
