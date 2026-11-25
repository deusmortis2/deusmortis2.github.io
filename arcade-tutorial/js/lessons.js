// Runs a course page: one <section class="lesson-body"> per lesson, shown
// one at a time by the URL hash, plus the sidebar, code blocks, quizzes
// and the previous/next buttons.
import { courses, nextStep, previousStep, stepHref } from "./course.js";
import { isDone, markDone } from "./progress.js";
import { highlight } from "./highlight.js";

const course = courses.find((c) => c.id === document.body.dataset.course);
const sections = [...document.querySelectorAll(".lesson-body")];
const main = document.querySelector(".lesson");
const sidebarList = document.querySelector(".sidebar .steps");

// Code samples are written as <script type="text/plain"> so they need no
// HTML escaping. They become highlighted <pre> blocks here.
function buildCodeBlocks() {
  document.querySelectorAll("script[type='text/plain']").forEach((source) => {
    const pre = document.createElement("pre");
    const code = document.createElement("code");
    const text = dedent(source.textContent.replace(/<\\\/script/g, "</script"));
    code.innerHTML = highlight(text, source.dataset.lang ?? "js");
    if (source.dataset.file) pre.dataset.file = source.dataset.file;
    pre.append(code);
    source.replaceWith(pre);
  });
}

function dedent(text) {
  const lines = text.replace(/^\n+|\s+$/g, "").split("\n");
  const indents = lines
    .filter((line) => line.trim())
    .map((line) => line.match(/^ */)[0].length);
  const cut = Math.min(...indents);
  return lines.map((line) => line.slice(cut)).join("\n");
}

function renderSidebar(currentId) {
  sidebarList.replaceChildren(
    ...course.steps.map((step) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = stepHref(course, step);
      if (step.id === currentId) a.setAttribute("aria-current", "page");
      const tick = document.createElement("span");
      tick.className = "tick";
      tick.textContent = isDone(step.id) ? "✓" : "";
      li.classList.toggle("done", isDone(step.id));
      a.append(tick, step.title);
      li.append(a);
      return li;
    }),
  );
}

// Turns each quiz question's <ul> into answer buttons. A lesson is done
// once every question in it has been answered right.
function buildQuiz(section) {
  const questions = [...section.querySelectorAll(".q")];
  let remaining = questions.length;
  questions.forEach((q) => {
    const list = q.querySelector("ul");
    const why = q.querySelector(".why");
    const feedback = document.createElement("p");
    feedback.className = "feedback";
    feedback.setAttribute("role", "status");
    why.hidden = true;
    const choices = document.createElement("div");
    choices.className = "choices";
    let solved = false;
    [...list.children].forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice";
      button.innerHTML = item.innerHTML;
      button.addEventListener("click", () => {
        if (solved) return;
        if (!item.hasAttribute("data-right")) {
          button.classList.add("wrong");
          button.disabled = true;
          feedback.textContent = "Not quite. Have another look and try again.";
          feedback.className = "feedback bad";
          return;
        }
        solved = true;
        button.classList.add("right");
        choices.querySelectorAll(".choice").forEach((b) => {
          b.disabled = true;
        });
        feedback.textContent = "Correct!";
        feedback.className = "feedback good";
        why.hidden = false;
        remaining -= 1;
        if (remaining === 0) finishLesson(section);
      });
      choices.append(button);
    });
    list.replaceWith(choices);
    why.before(feedback);
  });
}

function finishLesson(section) {
  markDone(section.id);
  section.querySelector(".complete").hidden = false;
  renderSidebar(section.id);
}

function addPager(section) {
  const pager = document.createElement("nav");
  pager.className = "pager";
  const back = previousStep(section.id);
  const next = nextStep(section.id);
  const link = (href, text, ghost) => {
    const a = document.createElement("a");
    a.className = ghost ? "btn ghost" : "btn";
    a.href = href;
    a.textContent = text;
    return a;
  };
  pager.append(
    back
      ? link(stepHref(back.course, back.step), `← ${back.step.title}`, true)
      : link("index.html", "← Course map", true),
    next
      ? link(stepHref(next.course, next.step), `${next.step.title} →`, false)
      : link("index.html", "Back to the course map", false),
  );
  const done = document.createElement("p");
  done.className = "complete";
  done.textContent = "Lesson complete! Your progress is saved in this browser.";
  done.hidden = !isDone(section.id);
  section.append(done, pager);
}

function show() {
  const id = location.hash.slice(1);
  const current = sections.find((s) => s.id === id) ?? sections[0];
  sections.forEach((s) => {
    s.hidden = s !== current;
  });
  const step = course.steps.find((s) => s.id === current.id);
  document.title = `${step.title} | Arcade Tutorial`;
  renderSidebar(current.id);
  main.scrollTo?.(0, 0);
  window.scrollTo(0, 0);
}

buildCodeBlocks();
sections.forEach((section) => {
  buildQuiz(section);
  addPager(section);
});
window.addEventListener("hashchange", show);
show();
