// The lab page: an HTML/CSS/JS editor, a live preview, and a test runner.
// Each test loads the code into a fresh hidden iframe, so one test's clicks
// never leak into the next.
import { findStep, nextStep, stepHref } from "./course.js";
import { clearCode, isDone, loadCode, markDone, saveCode } from "./progress.js";

const id = new URLSearchParams(location.search).get("id");
const found = findStep(id);
const brief = document.querySelector(".brief");
const editors = {
  css: document.getElementById("code-css"),
  html: document.getElementById("code-html"),
  js: document.getElementById("code-js"),
};
const tabs = [...document.querySelectorAll(".tab")];
const runButton = document.getElementById("run");
const resetButton = document.getElementById("reset");
const resultEl = document.getElementById("result");
const preview = document.getElementById("preview");
const testTimeout = 4000;

function currentCode() {
  return {
    css: editors.css.value,
    html: editors.html.value,
    js: editors.js.value,
  };
}

// The page the code runs in. The error catcher goes first so it sees
// errors from the lab's own script, syntax errors included.
function buildDoc({ css, html, js }) {
  const script = js.replace(/<\/script/gi, "<\\/script");
  return [
    "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\">",
    "<script>window.__labErrors = [];",
    "addEventListener(\"error\", (e) => { __labErrors.push(e.message); });",
    "</script>",
    `<style>${css}</style></head><body>${html}`,
    `<script>${script}\n</script></body></html>`,
  ].join("");
}

// Loads the code into a brand-new hidden iframe and resolves its window.
function loadFrame(code) {
  return new Promise((resolve) => {
    document.querySelector(".test-frame")?.remove();
    const frame = document.createElement("iframe");
    frame.className = "test-frame";
    frame.setAttribute("aria-hidden", "true");
    frame.tabIndex = -1;
    frame.addEventListener("load", () => resolve(frame.contentWindow), {
      once: true,
    });
    frame.srcdoc = buildDoc(code);
    document.body.append(frame);
  });
}

// What every test receives. reload() starts the page over (for tests of
// what happens on load) and returns a new helper.
function helper(win, code) {
  const doc = win.document;
  return {
    $: (selector) => doc.querySelector(selector),
    $$: (selector) => [...doc.querySelectorAll(selector)],
    code,
    doc,
    reload: async () => helper(await loadFrame(code), code),
    style: (el) => win.getComputedStyle(el),
    wait: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    win,
  };
}

function withTimeout(promise) {
  return Promise.race([
    promise,
    new Promise((resolve, reject) => {
      setTimeout(() => reject(new Error("The test timed out.")), testTimeout);
    }),
  ]);
}

async function runOne(lab, test, code) {
  lab.beforeEach?.();
  const win = await loadFrame(code);
  try {
    const passed = await withTimeout(Promise.resolve(test.run(helper(win, code))));
    return { passed: Boolean(passed), win };
  } catch (error) {
    return { error: error.message, passed: false, win };
  }
}

async function runTests(lab, items) {
  const code = currentCode();
  runButton.disabled = true;
  resultEl.className = "result";
  resultEl.textContent = "Running...";
  items.forEach((li) => {
    li.className = "";
    li.querySelector(".why").textContent = "";
  });
  let passes = 0;
  let firstError = "";
  for (const [i, test] of lab.tests.entries()) {
    // Tests run one at a time on purpose: each gets its own fresh page.
    const outcome = await runOne(lab, test, code);
    firstError ||= outcome.win.__labErrors?.[0] ?? "";
    items[i].className = outcome.passed ? "pass" : "fail";
    if (outcome.error) {
      items[i].querySelector(".why").textContent = outcome.error;
    }
    if (outcome.passed) passes += 1;
  }
  document.querySelector(".test-frame")?.remove();
  lab.beforeEach?.();
  runButton.disabled = false;
  showResult(lab, passes, firstError);
}

function showResult(lab, passes, firstError) {
  const all = passes === lab.tests.length;
  resultEl.className = all ? "result good" : "result bad";
  if (all) {
    markDone(id);
    resultEl.textContent = "All tests pass! Lab complete.";
    document.getElementById("next").hidden = false;
    return;
  }
  const errorNote = firstError ? ` Your code threw: ${firstError}` : "";
  resultEl.textContent =
    `${passes} of ${lab.tests.length} tests pass.${errorNote}`;
}

let previewTimer = 0;
function refreshPreview() {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(() => {
    saveCode(id, currentCode());
    preview.srcdoc = buildDoc(currentCode());
  }, 500);
}

function selectTab(name) {
  tabs.forEach((tab) => {
    const on = tab.dataset.tab === name;
    tab.setAttribute("aria-selected", String(on));
    editors[tab.dataset.tab].hidden = !on;
  });
  editors[name].focus();
}

// Tab indents instead of leaving the editor. Escape then Tab still moves
// on, so keyboard users are never trapped.
let escaped = false;
function onEditorKey(event) {
  if (event.key === "Escape") {
    escaped = true;
    return;
  }
  if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();
    runButton.click();
    return;
  }
  if (event.key !== "Tab" || escaped) {
    escaped = false;
    return;
  }
  event.preventDefault();
  const box = event.target;
  const { selectionEnd, selectionStart } = box;
  box.setRangeText("  ", selectionStart, selectionEnd, "end");
  refreshPreview();
}

function fillBrief(lab) {
  const { course } = found;
  brief.querySelector("[data-course]").textContent = course.title;
  brief.querySelector("h1").textContent = lab.title;
  brief.querySelector("[data-intro]").innerHTML = lab.intro;
  brief.querySelector("[data-stories]").innerHTML = lab.stories
    .map((story) => `<li>${story}</li>`)
    .join("");
  const list = brief.querySelector(".tests");
  const items = lab.tests.map((test) => {
    const li = document.createElement("li");
    const text = document.createElement("span");
    text.innerHTML = test.text;
    const why = document.createElement("span");
    why.className = "why";
    text.append(why);
    li.append(text);
    return li;
  });
  list.replaceChildren(...items);
  const next = nextStep(id);
  const nextLink = document.getElementById("next");
  nextLink.href = next ? stepHref(next.course, next.step) : "index.html";
  nextLink.textContent = next ? `Next: ${next.step.title} →` : "Course map →";
  nextLink.hidden = !isDone(id);
  document.getElementById("back").href = stepHref(course, course.steps[0])
    .replace(/#.*/, "");
  document.title = `${lab.title} | Arcade Tutorial`;
  return items;
}

function loadEditors(lab) {
  const saved = loadCode(id);
  const code = saved ?? lab.starter;
  Object.entries(editors).forEach(([name, box]) => {
    box.value = code[name] ?? "";
    box.addEventListener("input", refreshPreview);
    box.addEventListener("keydown", onEditorKey);
  });
  preview.srcdoc = buildDoc(currentCode());
}

async function start() {
  if (!found?.step.lab) {
    brief.querySelector("h1").textContent = "Lab not found";
    return;
  }
  const lab = (await import(`./labs/${id}.js`)).default;
  const items = fillBrief(lab);
  loadEditors(lab);
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => selectTab(tab.dataset.tab));
  });
  selectTab(lab.firstTab ?? "html");
  runButton.addEventListener("click", () => runTests(lab, items));
  resetButton.addEventListener("click", () => {
    if (!confirm("Throw away your code and go back to the starter code?")) {
      return;
    }
    clearCode(id);
    Object.entries(editors).forEach(([name, box]) => {
      box.value = lab.starter[name] ?? "";
    });
    refreshPreview();
  });
}

start();
