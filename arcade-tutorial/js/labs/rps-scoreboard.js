// Lab: rock, paper, scissors against a CPU that "thinks", practising a
// score object, a status line, a busy lock, wait() and a play-again flow.
import { fn, shown, text } from "./checks.js";

const picks = ["rock", "paper", "scissors"];
const pickStatus = "Pick rock, paper or scissors";

function choiceButtons(t) {
  return picks.map((id) => t.$(`#${id}`));
}

function scores(t) {
  return ["you", "draw", "cpu"].map((k) => text(t.$(`#score-${k}`))).join(",");
}

async function playRound(t, mine, theirs) {
  t.win.cpuPick = () => theirs;
  t.$(`#${mine}`).click();
  await t.wait(500);
}

export default {
  firstTab: "js",
  intro: `
    <p>Rock beats scissors, scissors beats paper, paper beats rock. Build a
    rock, paper, scissors game against the CPU that plays out like the
    arcade's tic-tac-toe: the CPU "thinks" for a moment, the result shows,
    the score goes up, and a Play again button starts the next round.</p>
    <p>The HTML is done for you. Write <code>wait</code>,
    <code>cpuPick</code> and <code>winnerOf</code> as top-level
    <strong>function declarations</strong>. When the CPU decides, call
    <code>cpuPick()</code> by name: the tests swap it for their own version
    to control what the CPU plays.</p>`,
  starter: {
    css: `[hidden] {
  display: none !important;
}

.scores {
  display: flex;
  gap: 12px;
}

.scores div {
  padding: 6px 12px;
  border: 2px solid currentColor;
}

.scores strong {
  display: block;
}
`,
    html: `<h1>Rock, Paper, Scissors</h1>
<div class="scores">
  <div>YOU <strong id="score-you">0</strong></div>
  <div>DRAW <strong id="score-draw">0</strong></div>
  <div>CPU <strong id="score-cpu">0</strong></div>
</div>
<p id="status" role="status" aria-live="polite"></p>
<div class="choices">
  <button id="rock" type="button">Rock</button>
  <button id="paper" type="button">Paper</button>
  <button id="scissors" type="button">Scissors</button>
</div>
<button id="again" type="button" hidden>Play again</button>
`,
    js: `// Start with wait(ms), cpuPick() and winnerOf(you, cpu).
`,
  },
  stories: [
    "<code>wait(ms)</code> returns a Promise that resolves after <code>ms</code> milliseconds.",
    "<code>cpuPick()</code> returns <code>\"rock\"</code>, <code>\"paper\"</code> or <code>\"scissors\"</code> at random.",
    "<code>winnerOf(you, cpu)</code> returns <code>\"you\"</code>, <code>\"cpu\"</code> or <code>\"draw\"</code>.",
    "When the page loads, <code>#status</code> says <code>Pick rock, paper or scissors</code>.",
    "Clicking a choice straight away sets <code>#status</code> to <code>CPU is thinking...</code> and disables all three choice buttons. Clicks while the CPU is thinking are ignored.",
    "After waiting 300 milliseconds, call <code>cpuPick()</code>. <code>#status</code> shows <code>You win!</code>, <code>CPU wins!</code> or <code>It's a draw!</code>, the matching score goes up by one, and <code>#again</code> appears. The choices stay disabled.",
    "Clicking <code>#again</code> hides it, enables the choices and puts the status back to <code>Pick rock, paper or scissors</code>. The scores are kept.",
  ],
  tests: [
    {
      run: async (t) => {
        const wait = fn(t, "wait");
        const startedAt = performance.now();
        const promise = wait(80);
        if (typeof promise?.then !== "function") return false;
        await promise;
        return performance.now() - startedAt >= 75;
      },
      text: "<code>wait(80)</code> returns a Promise that resolves after about 80 milliseconds.",
    },
    {
      run: (t) => {
        const cpuPick = fn(t, "cpuPick");
        const seen = new Set(Array.from({ length: 90 }, () => cpuPick()));
        return seen.size === 3 && [...seen].every((p) => picks.includes(p));
      },
      text: "<code>cpuPick()</code> only returns <code>\"rock\"</code>, <code>\"paper\"</code> or <code>\"scissors\"</code>, and returns all three over many calls.",
    },
    {
      run: (t) => {
        const winnerOf = fn(t, "winnerOf");
        const expected = {
          "paper,paper": "draw",
          "paper,rock": "you",
          "paper,scissors": "cpu",
          "rock,paper": "cpu",
          "rock,rock": "draw",
          "rock,scissors": "you",
          "scissors,paper": "you",
          "scissors,rock": "cpu",
          "scissors,scissors": "draw",
        };
        return Object.entries(expected).every(([pair, result]) => {
          const [you, cpu] = pair.split(",");
          return winnerOf(you, cpu) === result;
        });
      },
      text: "<code>winnerOf</code> is right for all nine pairs.",
    },
    {
      run: (t) => {
        return (
          text(t.$("#status")) === pickStatus &&
          scores(t) === "0,0,0" &&
          !shown(t, t.$("#again")) &&
          choiceButtons(t).every((b) => !b.disabled)
        );
      },
      text: "On load: the status asks you to pick, the scores are 0, <code>#again</code> is hidden and the choices work.",
    },
    {
      run: async (t) => {
        t.$("#rock").click();
        const thinking = text(t.$("#status")) === "CPU is thinking...";
        const locked = choiceButtons(t).every((b) => b.disabled);
        await t.wait(150);
        return thinking && locked &&
          text(t.$("#status")) === "CPU is thinking..." &&
          scores(t) === "0,0,0";
      },
      text: "Clicking a choice shows <code>CPU is thinking...</code> at once, disables the choices, and nothing is decided before 300 milliseconds.",
    },
    {
      run: async (t) => {
        await playRound(t, "rock", "scissors");
        return (
          text(t.$("#status")) === "You win!" &&
          scores(t) === "1,0,0" &&
          shown(t, t.$("#again")) &&
          choiceButtons(t).every((b) => b.disabled)
        );
      },
      text: "Rock against the CPU's scissors: <code>You win!</code>, your score is 1, <code>#again</code> shows and the choices stay disabled.",
    },
    {
      run: async (t) => {
        await playRound(t, "rock", "paper");
        return text(t.$("#status")) === "CPU wins!" && scores(t) === "0,0,1";
      },
      text: "Rock against paper: <code>CPU wins!</code> and the CPU's score is 1.",
    },
    {
      run: async (t) => {
        t.win.cpuPick = () => "paper";
        t.$("#paper").click();
        t.$("#paper").click();
        await t.wait(500);
        return text(t.$("#status")) === "It's a draw!" &&
          scores(t) === "0,1,0";
      },
      text: "Paper against paper is <code>It's a draw!</code>, and a quick double click only plays one round.",
    },
    {
      run: async (t) => {
        await playRound(t, "rock", "scissors");
        t.$("#again").click();
        await t.wait(30);
        return (
          !shown(t, t.$("#again")) &&
          choiceButtons(t).every((b) => !b.disabled) &&
          text(t.$("#status")) === pickStatus &&
          scores(t) === "1,0,0"
        );
      },
      text: "<code>#again</code> hides itself, enables the choices and resets the status, keeping the score.",
    },
  ],
  title: "Rock, Paper, Scissors",
};
