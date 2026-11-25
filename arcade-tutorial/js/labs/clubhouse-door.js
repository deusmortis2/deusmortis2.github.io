// Lab: a members-only clubhouse door, practising forms, submit handling,
// sessionStorage and JSON, the same way the arcade's sign-in works.
import { shown, text } from "./checks.js";

const key = "clubhouseSession";

function stored() {
  try {
    return JSON.parse(sessionStorage.getItem(key));
  } catch {
    return "not JSON";
  }
}

function fill(t, member, code) {
  t.$("#member").value = member;
  t.$("#code").value = code;
  t.$("#door").requestSubmit();
  return t.wait(150);
}

export default {
  beforeEach: () => sessionStorage.removeItem(key),
  firstTab: "html",
  intro: `
    <p>The Secret Clubhouse wants a door on its website. Members type their
    name and a 4-digit code; everyone else is turned away. Like the Math
    Arcade, the clubhouse should remember a member until they close the tab,
    and let them leave whenever they like.</p>
    <p>The only members are in the <code>members</code> object at the top of
    script.js: <code>ada</code> (code <code>1234</code>) and
    <code>grace</code> (code <code>9999</code>).</p>`,
  starter: {
    css: `[hidden] {
  display: none !important;
}
`,
    html: `<main>
  <h1>The Clubhouse</h1>

</main>
`,
    js: `// Only these members may come in.
const members = {
  ada: "1234",
  grace: "9999",
};
`,
  },
  stories: [
    "There's a <code>form</code> with the id <code>door</code>. Inside it, an <code>input#member</code> and an <code>input#code</code>, each wrapped in its own <code>&lt;label&gt;</code>.",
    "<code>#code</code> hides what's typed (<code>type=\"password\"</code>) and shows a number pad on phones. Both inputs are <code>required</code>.",
    "The form has a submit button and an empty <code>p#door-note</code> with <code>role=\"status\"</code>.",
    "There's a <code>section#lounge</code>, hidden at the start, holding a <code>p#welcome</code> and a <code>button#leave</code> (with <code>type=\"button\"</code>).",
    "Submitting the form never reloads the page.",
    "The name is matched ignoring capitals and spaces around it, so <code>\"  ADA \"</code> is <code>ada</code>. With the right code: save <code>{ member: \"ada\" }</code> as JSON in <code>sessionStorage</code> under the key <code>\"clubhouseSession\"</code>, hide the form, show the lounge, and put the member's name in <code>#welcome</code>.",
    "With a wrong name or code: <code>#door-note</code> says exactly <code>Wrong name or code.</code>, the code box is emptied, and nothing is saved.",
    "When the page loads and a session is already saved, go straight to the lounge.",
    "<code>#leave</code> removes the saved session, hides the lounge and shows the form again.",
  ],
  tests: [
    {
      run: (t) => {
        return Boolean(
          t.$("form#door #member")?.closest("label") &&
            t.$("form#door #code")?.closest("label") &&
            t.$("#member").closest("label") !== t.$("#code").closest("label"),
        );
      },
      text: "<code>form#door</code> has <code>#member</code> and <code>#code</code>, each in its own label.",
    },
    {
      run: (t) => {
        const code = t.$("#code");
        return (
          code?.type === "password" &&
          code.inputMode === "numeric" &&
          code.required &&
          t.$("#member")?.required
        );
      },
      text: "<code>#code</code> is a numeric password box and both inputs are required.",
    },
    {
      run: (t) => {
        return Boolean(
          t.$("#door button[type=submit], #door button:not([type])") &&
            t.$("#door-note")?.getAttribute("role") === "status",
        );
      },
      text: "The form has a submit button and a <code>#door-note</code> with <code>role=\"status\"</code>.",
    },
    {
      run: (t) => {
        return (
          Boolean(t.$("section#lounge #welcome")) &&
          t.$("#lounge #leave")?.type === "button" &&
          !shown(t, t.$("#lounge")) &&
          shown(t, t.$("#door"))
        );
      },
      text: "On a fresh visit the form shows and <code>#lounge</code> (with <code>#welcome</code> and a <code>type=\"button\"</code> <code>#leave</code>) is hidden.",
    },
    {
      run: async (t) => {
        await fill(t, "ada", "0000");
        return (
          t.win.document === t.doc &&
          text(t.$("#door-note")) === "Wrong name or code." &&
          t.$("#code").value === "" &&
          shown(t, t.$("#door")) &&
          stored() === null
        );
      },
      text: "A wrong code shows <code>Wrong name or code.</code>, empties <code>#code</code>, saves nothing and doesn't reload the page.",
    },
    {
      run: async (t) => {
        await fill(t, "bob", "1234");
        return text(t.$("#door-note")) === "Wrong name or code." &&
          stored() === null;
      },
      text: "Someone who isn't a member is turned away too.",
    },
    {
      run: async (t) => {
        await fill(t, "  ADA ", "1234");
        return (
          t.win.document === t.doc &&
          stored()?.member === "ada" &&
          !shown(t, t.$("#door")) &&
          shown(t, t.$("#lounge")) &&
          text(t.$("#welcome")).includes("ada")
        );
      },
      text: "<code>\"  ADA \"</code> with <code>1234</code> saves <code>{ member: \"ada\" }</code>, hides the form and welcomes ada in the lounge.",
    },
    {
      run: async (t) => {
        sessionStorage.setItem(key, JSON.stringify({ member: "grace" }));
        const again = await t.reload();
        return (
          shown(again, again.$("#lounge")) &&
          !shown(again, again.$("#door")) &&
          text(again.$("#welcome")).includes("grace")
        );
      },
      text: "Loading the page with a saved session goes straight to the lounge.",
    },
    {
      run: async (t) => {
        sessionStorage.setItem(key, JSON.stringify({ member: "grace" }));
        const again = await t.reload();
        again.$("#leave").click();
        await again.wait(50);
        return (
          sessionStorage.getItem(key) === null &&
          !shown(again, again.$("#lounge")) &&
          shown(again, again.$("#door"))
        );
      },
      text: "<code>#leave</code> removes the session, hides the lounge and shows the form.",
    },
  ],
  title: "Clubhouse Door",
};
