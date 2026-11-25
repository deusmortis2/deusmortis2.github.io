// The course outline. Every page reads this list: the course map, the
// lesson sidebars and the labs' "next step" links. A lesson's id matches a
// <section id> in its course page; a lab's id matches a file in js/labs/.
export const courses = [
  {
    id: "main-page",
    page: "main-page.html",
    summary:
      "The sign-in screen and the game picker: the retro theme, forms, " +
      "JavaScript modules, sessions and a data-driven grid of game cards.",
    title: "Course 1: The Main Page",
    steps: [
      { id: "tour", title: "A Tour of the Arcade" },
      { id: "skeleton", title: "The Page Skeleton" },
      { id: "theme", title: "A Retro Theme with CSS Variables" },
      { id: "layout", title: "Screens, Panels and Big Type" },
      { id: "buttons", title: "Pixel Buttons" },
      { id: "neon-sign", lab: true, title: "Lab: Neon Bakery Sign" },
      { id: "form", title: "The Sign-in Form" },
      { id: "modules", title: "JavaScript Modules" },
      { id: "signin", title: "Handling the Sign-in" },
      { id: "sessions", title: "Remembering Who's Playing" },
      { id: "clubhouse-door", lab: true, title: "Lab: Clubhouse Door" },
      { id: "picker", title: "The Game Picker Grid" },
      { id: "shared", title: "Shared Setup and the Game List" },
      { id: "movie-night", lab: true, title: "Lab: Movie Night Picker" },
    ],
  },
  {
    id: "tictactoe",
    page: "tictactoe.html",
    summary:
      "From an empty page to a CPU that looks ahead: building a board with " +
      "JavaScript, rendering from state, async turns and minimax.",
    title: "Course 2: Tic-Tac-Toe",
    steps: [
      { id: "ttt-page", title: "The Game Page" },
      { id: "ttt-css", title: "Styling the Board" },
      { id: "ttt-state", title: "The Game's State" },
      { id: "ttt-build", title: "Building the Board with JavaScript" },
      { id: "ttt-render", title: "Drawing State to the Screen" },
      { id: "lights-out", lab: true, title: "Lab: Lights Out" },
      { id: "ttt-win", title: "Finding a Winner" },
      { id: "bingo-checker", lab: true, title: "Lab: Bingo Checker" },
      { id: "ttt-turns", title: "Taking Turns with async/await" },
      { id: "ttt-minimax", title: "Minimax: a CPU That Looks Ahead" },
      { id: "ttt-mistakes", title: "Making the CPU Beatable" },
      { id: "pebble-nim", lab: true, title: "Lab: Pebble Nim" },
      { id: "ttt-rounds", title: "Ending a Round and the Question Gate" },
      { id: "rps-scoreboard", lab: true, title: "Lab: Rock, Paper, Scissors" },
    ],
  },
];

// Where a step lives: lessons are sections of their course page, labs all
// share lab.html.
export function stepHref(course, step) {
  if (step.lab) return `lab.html?id=${step.id}`;
  return `${course.page}#${step.id}`;
}

export function findStep(id) {
  for (const course of courses) {
    const index = course.steps.findIndex((step) => step.id === id);
    if (index !== -1) return { course, index, step: course.steps[index] };
  }
  return null;
}

// The step after this one, crossing into the next course at the end.
export function nextStep(id) {
  const found = findStep(id);
  if (!found) return null;
  const { course, index } = found;
  if (index + 1 < course.steps.length) {
    return { course, step: course.steps[index + 1] };
  }
  const nextCourse = courses[courses.indexOf(course) + 1];
  return nextCourse ? { course: nextCourse, step: nextCourse.steps[0] } : null;
}

export function previousStep(id) {
  const found = findStep(id);
  if (!found || found.index === 0) return null;
  return { course: found.course, step: found.course.steps[found.index - 1] };
}
