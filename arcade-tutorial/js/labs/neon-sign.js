// Lab: a neon sign and menu board for a bakery, practising custom
// properties, flexbox, clamp(), shadows, keyframes and button modifiers.
import { cssRules, rgb } from "./checks.js";

const hardShadow = /\)\s+-?[\d.]+px\s+-?[\d.]+px\s+0px/;

export default {
  firstTab: "html",
  intro: `
    <p>The Night Owl Bakery wants a glowing sign for its website, in the
    same chunky retro style as the Math Arcade. Build it with the skills
    from the last four lessons: custom properties, a flex column, big
    clamped type, hard shadows, a blinking line and pixel buttons.</p>
    <p>The <strong>index.html</strong> tab holds only what goes inside
    <code>&lt;body&gt;</code>. Your CSS and JavaScript tabs are added to the
    page for you.</p>`,
  starter: {
    css: `/* Start with your colours on :root */
`,
    html: `<main class="shop">

</main>
`,
    js: `// No JavaScript needed for this lab.
`,
  },
  stories: [
    "In the CSS, <code>:root</code> defines at least two custom properties: <code>--glow</code> (the sign's colour) and <code>--bg</code> (the page background).",
    "The <code>body</code>'s background colour is <code>var(--bg)</code>.",
    "<code>main.shop</code> is a flex column with its items centred and a <code>gap</code> between them.",
    "Inside it, an <code>h1</code> with the class <code>sign</code> shows the bakery's name. Its <code>font-size</code> uses <code>clamp()</code> and it has a <code>text-shadow</code>.",
    "A paragraph with the class <code>blink</code> (try \"OPEN LATE\") blinks using an <code>@keyframes</code> animation that jumps with <code>steps()</code> instead of fading.",
    "A <code>div</code> with the class <code>menu-board</code> has a border and a hard <code>box-shadow</code> with no blur. It holds at least three elements with the class <code>menu-item</code>.",
    "There are two buttons with the class <code>btn</code>. One also has the class <code>ghost</code> and a transparent background.",
    "Add a <code>[hidden]</code> rule so the <code>hidden</code> attribute always wins, even over your own <code>display</code> rules.",
  ],
  tests: [
    {
      run: (t) => {
        const root = t.style(t.doc.documentElement);
        return (
          root.getPropertyValue("--glow").trim() !== "" &&
          root.getPropertyValue("--bg").trim() !== ""
        );
      },
      text: "<code>:root</code> defines <code>--glow</code> and <code>--bg</code>.",
    },
    {
      run: (t) => {
        const bg = t.style(t.doc.documentElement).getPropertyValue("--bg");
        return (
          /var\(\s*--bg\s*\)/.test(t.code.css) &&
          t.style(t.doc.body).backgroundColor === rgb(t, bg.trim())
        );
      },
      text: "The body's background colour is <code>var(--bg)</code>.",
    },
    {
      run: (t) => {
        const main = t.$("main.shop");
        if (!main) return false;
        const s = t.style(main);
        return (
          s.display === "flex" &&
          s.flexDirection === "column" &&
          s.alignItems === "center" &&
          parseFloat(s.rowGap) > 0
        );
      },
      text: "<code>main.shop</code> is a flex column with centred items and a gap.",
    },
    {
      run: (t) => {
        const sign = t.$("main.shop h1.sign");
        return (
          Boolean(sign?.textContent.trim()) &&
          t.style(sign).textShadow !== "none" &&
          /sign[^{]*\{[^}]*font-size\s*:\s*clamp\(/.test(t.code.css)
        );
      },
      text: "<code>h1.sign</code> inside <code>main.shop</code> has text, a <code>text-shadow</code> and a <code>clamp()</code> font size.",
    },
    {
      run: (t) => {
        const blink = t.$(".blink");
        if (!blink) return false;
        const s = t.style(blink);
        const keyframes = cssRules(t).some((rule) => {
          return rule.type === CSSRule.KEYFRAMES_RULE &&
            rule.name === s.animationName;
        });
        return (
          s.animationName !== "none" &&
          keyframes &&
          s.animationTimingFunction.includes("steps")
        );
      },
      text: "<code>.blink</code> runs an <code>@keyframes</code> animation with a <code>steps()</code> timing function.",
    },
    {
      run: (t) => {
        const board = t.$(".menu-board");
        if (!board) return false;
        const s = t.style(board);
        return (
          s.borderTopStyle !== "none" &&
          parseFloat(s.borderTopWidth) > 0 &&
          hardShadow.test(s.boxShadow)
        );
      },
      text: "<code>.menu-board</code> has a border and a <code>box-shadow</code> with a blur of 0.",
    },
    {
      run: (t) => t.$$(".menu-board .menu-item").length >= 3,
      text: "<code>.menu-board</code> holds at least three <code>.menu-item</code> elements.",
    },
    {
      run: (t) => {
        const plain = t.$$(".btn").filter((b) => !b.classList.contains("ghost"));
        const ghost = t.$(".btn.ghost");
        return (
          plain.length > 0 &&
          Boolean(ghost) &&
          t.style(ghost).backgroundColor === "rgba(0, 0, 0, 0)"
        );
      },
      text: "There's a <code>.btn</code> and a <code>.btn.ghost</code>, and the ghost one's background is transparent.",
    },
    {
      run: (t) => {
        const board = t.$(".menu-board");
        if (!board) return false;
        board.style.display = "block";
        board.hidden = true;
        // The inline display: block only loses to an !important rule.
        return t.style(board).display === "none";
      },
      text: "A <code>[hidden]</code> rule with <code>display: none !important</code> makes <code>hidden</code> always win.",
    },
  ],
  title: "Neon Bakery Sign",
};
