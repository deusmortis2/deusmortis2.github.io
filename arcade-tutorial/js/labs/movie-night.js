// Lab: a film picker built from an array of objects, practising the game
// picker's ideas: a top bar, an auto-fit grid, link cards and filtering
// data before drawing it.
import { cssRules, sameList, shown, text } from "./checks.js";

const showing = ["The Clockwork Comet", "Mossheart", "Saltwind", "Night Ferry"];
const everything = [
  "The Clockwork Comet",
  "Mossheart",
  "Paper Lanterns",
  "Saltwind",
  "Glass Orchard",
  "Night Ferry",
];

function titles(t) {
  return t
    .$$("#movies .movie-card")
    .filter((card) => shown(t, card))
    .map((card) => text(card.querySelector("h2")));
}

export default {
  firstTab: "js",
  intro: `
    <p>A small cinema club wants a "what's on tonight" page that works
    like the Math Arcade's game picker. The films are already listed as an
    array of objects in script.js. Your job is to turn that data into a
    grid of cards, and to let visitors peek at the films that are coming
    soon.</p>
    <p>Don't write the cards in the HTML: build them from the
    <code>movies</code> array, so adding a film only means adding an
    object.</p>`,
  starter: {
    css: `[hidden] {
  display: none !important;
}
`,
    html: `<header class="topbar">
  <span class="brand">MOVIE NIGHT</span>
</header>
<main>
  <div id="movies"></div>
</main>
`,
    js: `// Tonight's line-up. Only films with showing: true are on the picker.
const movies = [
  { page: "clockwork-comet.html", showing: true, title: "The Clockwork Comet", year: 1987 },
  { page: "mossheart.html", showing: true, title: "Mossheart", year: 2003 },
  { page: "paper-lanterns.html", showing: false, title: "Paper Lanterns", year: 1999 },
  { page: "saltwind.html", showing: true, title: "Saltwind", year: 2015 },
  { page: "glass-orchard.html", showing: false, title: "Glass Orchard", year: 2021 },
  { page: "night-ferry.html", showing: true, title: "Night Ferry", year: 1974 },
];
`,
  },
  stories: [
    "<code>.topbar</code> is a flex row with <code>justify-content: space-between</code>. Next to the brand is a <code>&lt;nav&gt;</code> holding a <code>&lt;label&gt;</code> with a checkbox, <code>input#show-all</code>, labelled \"Show coming soon\".",
    "<code>#movies</code> is a CSS grid whose columns use <code>repeat(auto-fit, minmax(...))</code>.",
    "Your JavaScript adds one <code>a.movie-card</code> to <code>#movies</code> for each film with <code>showing: true</code>, in the array's order. The HTML tab has no cards in it.",
    "Each card's <code>href</code> is the film's <code>page</code>, and the card holds an <code>h2</code> with the title and a <code>p.year</code> with the year.",
    "Ticking <code>#show-all</code> redraws the grid with every film, in order. The films that aren't showing get the class <code>coming-soon</code>. Unticking it goes back to tonight's films only.",
    "There's a <code>.movie-card:hover</code> rule that moves the card with <code>transform</code>.",
  ],
  tests: [
    {
      run: (t) => {
        const bar = t.$(".topbar");
        if (!bar) return false;
        const s = t.style(bar);
        return (
          s.display === "flex" &&
          s.justifyContent === "space-between" &&
          Boolean(bar.querySelector("nav label #show-all[type=checkbox]"))
        );
      },
      text: "<code>.topbar</code> is a space-between flex row with a <code>nav</code> holding a labelled <code>#show-all</code> checkbox.",
    },
    {
      run: (t) => {
        const grid = t.$("#movies");
        return (
          Boolean(grid) &&
          t.style(grid).display === "grid" &&
          /repeat\(\s*auto-fit\s*,\s*minmax\(/.test(t.code.css)
        );
      },
      text: "<code>#movies</code> is a grid using <code>repeat(auto-fit, minmax(...))</code>.",
    },
    {
      run: (t) => !t.code.html.includes("movie-card"),
      text: "The HTML tab doesn't contain any cards: they come from JavaScript.",
    },
    {
      run: (t) => {
        return sameList(titles(t), showing) &&
          t.$$("#movies .movie-card").length === showing.length;
      },
      text: "There are four cards, one per film showing tonight, in the array's order.",
    },
    {
      run: (t) => {
        const card = t.$$("#movies .movie-card")[2];
        return (
          card?.tagName === "A" &&
          card.getAttribute("href") === "saltwind.html" &&
          text(card.querySelector("p.year")) === "2015"
        );
      },
      text: "Each card is a link to the film's <code>page</code> with a <code>p.year</code> (Saltwind is the third card: <code>saltwind.html</code>, 2015).",
    },
    {
      run: async (t) => {
        t.$("#show-all").click();
        await t.wait(50);
        const soon = t
          .$$("#movies .movie-card.coming-soon")
          .map((card) => text(card.querySelector("h2")));
        return (
          sameList(titles(t), everything) &&
          sameList(soon, ["Paper Lanterns", "Glass Orchard"])
        );
      },
      text: "Ticking <code>#show-all</code> shows all six films in order, and only the two not showing have <code>.coming-soon</code>.",
    },
    {
      run: async (t) => {
        t.$("#show-all").click();
        await t.wait(50);
        t.$("#show-all").click();
        await t.wait(50);
        return (
          sameList(titles(t), showing) &&
          t.$$("#movies .movie-card").length === showing.length &&
          t.$$(".coming-soon").length === 0
        );
      },
      text: "Unticking it again goes back to exactly the four films showing tonight.",
    },
    {
      run: (t) => {
        return cssRules(t).some((rule) => {
          return rule.selectorText?.includes(".movie-card:hover") &&
            rule.style.transform !== "";
        });
      },
      text: "A <code>.movie-card:hover</code> rule sets a <code>transform</code>.",
    },
  ],
  title: "Movie Night Picker",
};
