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
  {
    id: "draconis",
    page: "draconis.html",
    summary:
      "A canvas action game from the ground up: the game loop, delta time, " +
      "held keys, sprites, collisions, stage data, monster state machines " +
      "and a maths clock that never resets.",
    title: "Course 3: Deus Draconis",
    steps: [
      { id: "dd-canvas", title: "The Canvas and Its Coordinates" },
      { id: "dd-loop", title: "The Game Loop" },
      { id: "dd-input", title: "Keyboard and Pointer Input" },
      { id: "window-washer", lab: true, title: "Lab: Window Washer" },
      { id: "dd-entities", title: "Game Objects as Plain Objects" },
      { id: "dd-sprites", title: "Drawing Sprites" },
      { id: "dd-collide", title: "Collisions: Circles and Boxes" },
      { id: "firefly-jar", lab: true, title: "Lab: Firefly Jar" },
      { id: "dd-stages", title: "Stages and Spawn Schedules" },
      { id: "dd-gate", title: "Phases and the Question Gate" },
      { id: "sushi-conveyor", lab: true, title: "Lab: Sushi Conveyor" },
      { id: "dd-monsters", title: "Monsters as State Machines" },
      { id: "dd-shots", title: "Monster Shots" },
      { id: "dd-powers", title: "Fireballs, Levels and Power-ups" },
      { id: "robot-sparring", lab: true, title: "Lab: Robot Sparring" },
      { id: "dd-boss", title: "The Wyrm Boss" },
      { id: "dd-scenery", title: "Scenery, the HUD and the Draw Order" },
    ],
  },
  {
    id: "astro",
    page: "astro.html",
    summary:
      "A tour of a big canvas platformer: tile physics, forgiving jumps, " +
      "aliens and bosses as data plus state machines, drop tables and an " +
      "oxygen meter.",
    title: "Course 7: Astro Stomp",
    steps: [
      { id: "astro-tour", title: "A Tour of Astro Stomp" },
      { id: "astro-levels", title: "Planets Made of Data" },
      { id: "astro-physics", title: "Tile Collision Without Tunnelling" },
      { id: "lunar-leap", lab: true, title: "Lab: Moon Rover Hop" },
      { id: "astro-player", title: "The Astronaut: Run, Jump, Smash" },
      { id: "astro-contacts", title: "Stomp or Ouch?" },
      { id: "drone-stomper", lab: true, title: "Lab: Drone Stomper" },
      { id: "astro-minions", title: "Aliens as Data" },
      { id: "astro-moves", title: "Move Sets: Little State Machines" },
      { id: "astro-bosses", title: "Bosses and the Open Moment" },
      { id: "astro-shots", title: "Shots, Lobs and Warning Strikes" },
      { id: "astro-powerups", title: "Power-ups and the Drop Table" },
      { id: "supply-pod", lab: true, title: "Lab: Supply Pod" },
      { id: "astro-frame", title: "One Frame, Start to Finish" },
      { id: "astro-oxygen", title: "Oxygen, Score and Game Over" },
      { id: "spacewalk-air", lab: true, title: "Lab: Spacewalk Air Supply" },
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
