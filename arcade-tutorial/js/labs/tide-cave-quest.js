// Lab: a choose-your-path cave story, practising a choose() that returns a
// promise resolved by a button click, and an async loop that awaits it,
// like Tidesong's battle panels.
import { fn, shown, text } from "./checks.js";

function buttons(t) {
  return t.$$("#actions button");
}

// Clicks the button with this label, once it has appeared.
async function pick(t, label) {
  for (let i = 0; i < 40; i += 1) {
    const button = buttons(t).find((b) => text(b) === label);
    if (button) {
      button.click();
      await t.wait(20);
      return;
    }
    // Waiting for the page to show the next choice.
    await t.wait(10);
  }
  throw new Error(`No button labelled "${label}" appeared in #actions.`);
}

// Resolves with the promise's value, or "pending" if it hasn't settled.
async function settled(t, promise) {
  return Promise.race([promise, t.wait(60).then(() => "pending")]);
}

export default {
  firstTab: "js",
  intro: `
    <p>A choose-your-path story: you stand at the mouth of a cave and pick
    where to go next, one button at a time, until you reach an ending.</p>
    <p>Build it like Tidesong's battles. <code>choose()</code> shows a
    question and some buttons, and returns a <strong>Promise</strong> that
    resolves with the chosen option's <code>value</code> when one is
    clicked. Then the whole story is a short <code>async</code> loop that
    <code>await</code>s each choice. Write both as top-level function
    declarations.</p>`,
  starter: {
    css: `#actions {
  display: flex;
  gap: 8px;
}
`,
    html: `<h1>Cave Quest</h1>
<p id="message">Ready for an adventure?</p>
<div id="actions"></div>
<button id="start" type="button">Start</button>
`,
    js: `// Each room has its text and the options you can pick there. A room
// with no options is an ending.
const rooms = {
  entrance: {
    text: "You stand at the mouth of a dark cave.",
    options: [
      { label: "Go in", value: "tunnel" },
      { label: "Go home", value: "home" },
    ],
  },
  tunnel: {
    text: "The tunnel splits in two.",
    options: [
      { label: "Left", value: "lake" },
      { label: "Right", value: "treasure" },
      { label: "Back", value: "entrance" },
    ],
  },
  lake: {
    text: "An underground lake blocks the way.",
    options: [
      { label: "Swim", value: "treasure" },
      { label: "Back", value: "tunnel" },
    ],
  },
  treasure: { text: "You found the treasure!", options: [] },
  home: { text: "You go home for tea.", options: [] },
};

function choose(prompt, options) {
}

async function runQuest() {
}
`,
  },
  stories: [
    "<code>choose(prompt, options)</code> puts <code>prompt</code> in <code>#message</code> and replaces whatever is in <code>#actions</code> with one <code>&lt;button type=\"button\"&gt;</code> per option, showing its <code>label</code>.",
    "<code>choose</code> returns a Promise. It stays pending until a button is clicked, then resolves with that option's <code>value</code>, and <code>#actions</code> is emptied.",
    "<code>runQuest()</code> starts in the <code>entrance</code> room and loops: show the room with <code>choose</code>, await the choice, move to that room. When it reaches a room with no options, it shows that room's text in <code>#message</code>, leaves <code>#actions</code> empty, and resolves with the room's id (<code>\"treasure\"</code> or <code>\"home\"</code>).",
    "Nothing starts when the page loads. Clicking <code>#start</code> hides it and runs <code>runQuest()</code>.",
  ],
  tests: [
    {
      run: (t) => {
        const promise = fn(t, "choose")("Pick one", [{ label: "A", value: 1 }]);
        return promise instanceof t.win.Promise || typeof promise?.then === "function";
      },
      text: "<code>choose</code> returns a Promise.",
    },
    {
      run: (t) => {
        t.$("#actions").innerHTML = "<button>Old</button>";
        fn(t, "choose")("Which way?", [
          { label: "North", value: "n" },
          { label: "South", value: "s" },
        ]);
        const list = buttons(t);
        return (
          text(t.$("#message")) === "Which way?" &&
          list.length === 2 &&
          text(list[0]) === "North" && text(list[1]) === "South" &&
          list.every((b) => b.type === "button")
        );
      },
      text: "<code>choose</code> shows the prompt and replaces <code>#actions</code> with one button per option.",
    },
    {
      run: async (t) => {
        const promise = fn(t, "choose")("Which way?", [
          { label: "North", value: "n" },
          { label: "South", value: "s" },
        ]);
        const before = await settled(t, promise);
        await pick(t, "South");
        const after = await settled(t, promise);
        return before === "pending" && after === "s";
      },
      text: "The promise waits for a click, then resolves with the clicked option's <code>value</code>.",
    },
    {
      run: async (t) => {
        fn(t, "choose")("Which way?", [{ label: "North", value: "n" }]);
        await pick(t, "North");
        return buttons(t).length === 0;
      },
      text: "After a click, <code>#actions</code> is empty.",
    },
    {
      run: async (t) => {
        const quest = fn(t, "runQuest")();
        await t.wait(20);
        const first = text(t.$("#message")) === "You stand at the mouth of a dark cave.";
        await pick(t, "Go in");
        await pick(t, "Right");
        const ending = await settled(t, quest);
        return (
          first &&
          ending === "treasure" &&
          text(t.$("#message")) === "You found the treasure!" &&
          buttons(t).length === 0
        );
      },
      text: "Go in, then Right, ends the quest with <code>\"treasure\"</code> and shows the treasure text.",
    },
    {
      run: async (t) => {
        const quest = fn(t, "runQuest")();
        await pick(t, "Go in");
        await pick(t, "Left");
        await pick(t, "Back");
        await pick(t, "Back");
        await pick(t, "Go home");
        return (await settled(t, quest)) === "home" &&
          text(t.$("#message")) === "You go home for tea.";
      },
      text: "Back goes back: Go in, Left, Back, Back, Go home ends with <code>\"home\"</code>.",
    },
    {
      run: async (t) => {
        await t.wait(30);
        const idle = buttons(t).length === 0;
        t.$("#start").click();
        await t.wait(30);
        return idle && !shown(t, t.$("#start")) && buttons(t).length === 2;
      },
      text: "Nothing runs on load; clicking <code>#start</code> hides it and begins the quest.",
    },
  ],
  title: "Cave Quest",
};
