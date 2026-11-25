// Lab: bingo line checking, practising the same tools as winnerOf and
// emptyCells: a list of lines as data, find, every, flatMap, and pure
// functions that never change their input.
import { fn, sameList } from "./checks.js";

function card(marks) {
  const cells = Array(25).fill(false);
  marks.forEach((i) => {
    cells[i] = true;
  });
  return Object.freeze(cells);
}

function hasLine(lines, line) {
  return lines.some((l) => sameList([...l].sort((a, b) => a - b), line));
}

export default {
  firstTab: "js",
  intro: `
    <p>A bingo card is a 5 by 5 grid. Squares are numbered 0 to 24, left to
    right and top to bottom, and <code>marked[i]</code> is
    <code>true</code> once square <code>i</code> has been called. Five
    marked squares in a row, column or diagonal is a bingo.</p>
    <p>This lab is all functions, no page: the tests call them directly.
    Write each one as a <strong>function declaration</strong> at the top
    level of script.js (<code>function bingoLines() { ... }</code>) so the
    tests can find it. The preview is yours to experiment in.</p>`,
  starter: {
    css: "",
    html: `<h1>Bingo Checker</h1>
<p>The tests call your functions directly. Use this page for anything you like.</p>
`,
    js: `// Squares are numbered 0 to 24, left to right, top to bottom.
// marked is an array of 25 booleans: true means the square has been called.

function bingoLines() {
}

function winningLine(marked) {
}

function unmarked(marked) {
}
`,
  },
  stories: [
    "<code>bingoLines()</code> returns all 12 winning lines as arrays of 5 square numbers: 5 rows, 5 columns and the 2 diagonals. You can type them out or build them with loops.",
    "<code>winningLine(marked)</code> returns the first line in <code>bingoLines()</code> whose squares are all marked, or <code>null</code> if there isn't one.",
    "<code>unmarked(marked)</code> returns the numbers of the squares that aren't marked, smallest first.",
    "Neither function changes the array it's given.",
  ],
  tests: [
    {
      run: (t) => {
        const lines = fn(t, "bingoLines")();
        return (
          Array.isArray(lines) &&
          lines.length === 12 &&
          lines.every((line) => Array.isArray(line) && line.length === 5)
        );
      },
      text: "<code>bingoLines()</code> returns 12 lines of 5 squares each.",
    },
    {
      run: (t) => {
        const lines = fn(t, "bingoLines")();
        return [0, 1, 2, 3, 4].every((r) => {
          const row = [0, 1, 2, 3, 4].map((c) => r * 5 + c);
          const col = [0, 1, 2, 3, 4].map((c) => c * 5 + r);
          return hasLine(lines, row) && hasLine(lines, col);
        });
      },
      text: "It includes every row (like <code>[5, 6, 7, 8, 9]</code>) and every column (like <code>[2, 7, 12, 17, 22]</code>).",
    },
    {
      run: (t) => {
        const lines = fn(t, "bingoLines")();
        return hasLine(lines, [0, 6, 12, 18, 24]) &&
          hasLine(lines, [4, 8, 12, 16, 20]);
      },
      text: "It includes both diagonals: <code>[0, 6, 12, 18, 24]</code> and <code>[4, 8, 12, 16, 20]</code>.",
    },
    {
      run: (t) => {
        const winningLine = fn(t, "winningLine");
        return (
          winningLine(card([])) === null &&
          winningLine(card([10, 11, 12, 13])) === null &&
          winningLine(card([0, 1, 2, 3, 9, 14, 19])) === null
        );
      },
      text: "<code>winningLine</code> returns <code>null</code> for an empty card and for cards with only near-misses.",
    },
    {
      run: (t) => {
        const line = fn(t, "winningLine")(card([3, 1, 6, 11, 16, 21, 24]));
        return Array.isArray(line) &&
          sameList([...line].sort((a, b) => a - b), [1, 6, 11, 16, 21]);
      },
      text: "With column 1 marked (plus some other squares), it returns <code>[1, 6, 11, 16, 21]</code>.",
    },
    {
      run: (t) => {
        const line = fn(t, "winningLine")(card([4, 8, 12, 16, 20]));
        return Array.isArray(line) &&
          sameList([...line].sort((a, b) => a - b), [4, 8, 12, 16, 20]);
      },
      text: "It finds the diagonal from the top right to the bottom left.",
    },
    {
      run: (t) => {
        const unmarked = fn(t, "unmarked");
        const most = Array.from({ length: 25 }, (_, i) => i)
          .filter((i) => ![0, 7, 24].includes(i));
        return (
          sameList(unmarked(card(most)), [0, 7, 24]) &&
          sameList(unmarked(card(Array.from({ length: 25 }, (_, i) => i))), [])
        );
      },
      text: "<code>unmarked</code> returns the unmarked squares in order (<code>[0, 7, 24]</code>), and <code>[]</code> for a full card.",
    },
    {
      run: (t) => {
        const source = [false, true, true, true, true, true, ...Array(19).fill(false)];
        const before = JSON.stringify(source);
        fn(t, "winningLine")(source);
        fn(t, "unmarked")(source);
        return JSON.stringify(source) === before;
      },
      text: "Neither function changes the card it's given.",
    },
  ],
  title: "Bingo Checker",
};
