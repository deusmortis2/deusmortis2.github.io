// Lab: a fishing game's catch table, practising parsing a compact data
// string and a weighted random pick with a boost, like Tidesong's
// creatures and encounters.
import { fn } from "./checks.js";

const pondText = "Minnow common|Perch common|Carp uncommon|Pike rare";

// A fake Math.random that hands out the given numbers in order.
function sequence(...values) {
  let i = 0;
  return () => {
    const value = values[i];
    i += 1;
    if (value === undefined) {
      throw new Error("random() was called more times than expected.");
    }
    return value;
  };
}

function names(fish) {
  return fish.map((f) => f.name).join(",");
}

export default {
  firstTab: "js",
  intro: `
    <p>A fishing game stores its fish the way Tidesong stores its
    creatures: one compact string, <code>name rarity</code> pairs separated
    by <code>|</code>. Each fish gets an <code>id</code> from its place in
    the list, starting at 1.</p>
    <p>Then, like <code>rollEncounter</code>, pick which fish bites with a
    <strong>weighted random choice</strong>, and give fish the player
    hasn't caught yet a boost that grows with every catch of a fish they
    already had. Write each function as a top-level function declaration.</p>`,
  starter: {
    css: "",
    html: `<h1>Fishing Pond</h1>
<p>Bonus: add a Cast button that shows what bites.</p>
`,
    js: `const pondText = \`
  Minnow common | Perch common |
  Carp uncommon | Pike rare
\`;

const rarityWeight = { common: 10, rare: 1, uncommon: 4 };

function parseFish(text) {
}

function boostFor(streak) {
}

function fishWeight(fish, caught, streak) {
}

function rollFish(pond, caught, streak, random = Math.random) {
}
`,
  },
  stories: [
    "<code>parseFish(text)</code> splits the text on <code>|</code>, trims each piece, skips empty pieces, and returns an array of <code>{ id, name, rarity }</code> objects, with ids 1, 2, 3... in order.",
    "<code>boostFor(streak)</code> returns <code>1 + streak * 0.5</code>, but never more than 4.",
    "<code>fishWeight(fish, caught, streak)</code> is the fish's <code>rarityWeight</code>, multiplied by <code>boostFor(streak)</code> if its id is <strong>not</strong> in the <code>caught</code> array.",
    "<code>rollFish(pond, caught, streak, random)</code> calls <code>random()</code> exactly once, multiplies it by the total weight of the pond, then walks the pond in order subtracting each fish's weight, and returns the first fish that takes the roll to 0 or below. If none does, it returns the first fish.",
  ],
  tests: [
    {
      run: (t) => {
        const fish = fn(t, "parseFish")(pondText);
        return (
          Array.isArray(fish) &&
          fish.length === 4 &&
          JSON.stringify(fish[0]) === JSON.stringify({ id: 1, name: "Minnow", rarity: "common" }) &&
          fish[3].id === 4 && fish[3].rarity === "rare"
        );
      },
      text: "<code>parseFish</code> turns <code>\"Minnow common|...|Pike rare\"</code> into four <code>{ id, name, rarity }</code> objects with ids 1 to 4.",
    },
    {
      run: (t) => {
        const fish = fn(t, "parseFish")("\n  Eel rare |\n Trout common | |\n");
        return names(fish) === "Eel,Trout" && fish[1].id === 2;
      },
      text: "Spaces and line breaks around pieces are trimmed, and empty pieces are skipped.",
    },
    {
      run: (t) => {
        const boostFor = fn(t, "boostFor");
        return boostFor(0) === 1 && boostFor(2) === 2 && boostFor(6) === 4 && boostFor(50) === 4;
      },
      text: "<code>boostFor</code> grows by 0.5 a step from 1, and stops at 4.",
    },
    {
      run: (t) => {
        const fishWeight = fn(t, "fishWeight");
        const carp = { id: 3, name: "Carp", rarity: "uncommon" };
        return (
          fishWeight(carp, [], 0) === 4 &&
          fishWeight(carp, [], 2) === 8 &&
          fishWeight(carp, [3], 2) === 4
        );
      },
      text: "<code>fishWeight</code> boosts only fish that haven't been caught.",
    },
    {
      run: (t) => {
        const pond = fn(t, "parseFish")(pondText);
        const rollFish = fn(t, "rollFish");
        return (
          rollFish(pond, [], 0, sequence(0)).name === "Minnow" &&
          rollFish(pond, [], 0, sequence(0.5)).name === "Perch" &&
          rollFish(pond, [], 0, sequence(0.9)).name === "Carp" &&
          rollFish(pond, [], 0, sequence(0.99)).name === "Pike"
        );
      },
      text: "With nothing caught, the total is 25: rolls of 0, 0.5, 0.9 and 0.99 land on Minnow, Perch, Carp and Pike.",
    },
    {
      run: (t) => {
        const pond = fn(t, "parseFish")(pondText);
        const rollFish = fn(t, "rollFish");
        // Minnow and Perch caught; Carp 4 * 4 = 16 and Pike 1 * 4 = 4.
        return (
          rollFish(pond, [1, 2], 6, sequence(0.6)).name === "Carp" &&
          rollFish(pond, [1, 2], 6, sequence(0.95)).name === "Pike"
        );
      },
      text: "The boost works: with Minnow and Perch caught and a streak of 6, a roll of 0.6 lands on Carp and 0.95 on Pike.",
    },
    {
      run: (t) => {
        const pond = fn(t, "parseFish")(pondText);
        const rollFish = fn(t, "rollFish");
        return rollFish(pond, [], 0, sequence(0.45)).name === "Perch" &&
          rollFish(pond, [], 0, sequence(1)).name === "Pike";
      },
      text: "<code>rollFish</code> calls <code>random()</code> only once and always returns a fish.",
    },
  ],
  title: "Fishing Pond",
};
