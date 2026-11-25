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
    title: "Course 4: Astro Stomp",
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
  {
    id: "jormungandr",
    page: "jormungandr.html",
    summary:
      "A snake game on a canvas: the game loop, a grid of cells, a body " +
      "that's just a list, a step clock, a runaway Thor, procedural " +
      "drawing, phases and the leaderboard.",
    title: "Course 5: Jörmungandr",
    steps: [
      { id: "jor-page", title: "The Game Page" },
      { id: "jor-loop", title: "The Game Loop" },
      { id: "jor-grid", title: "A Board Made of Cells" },
      { id: "jor-treasure-map", lab: true, title: "Lab: Treasure Map" },
      { id: "jor-snake", title: "The Serpent Is a List" },
      { id: "jor-input", title: "Steering the Serpent" },
      { id: "jor-robot-remote", lab: true, title: "Lab: Robot Vacuum Remote" },
      { id: "jor-step", title: "Moving to a Beat" },
      { id: "jor-eat", title: "Eating, Growing and Crashing" },
      { id: "jor-mole-patrol", lab: true, title: "Lab: Mole Patrol" },
      { id: "jor-thor", title: "Thor Runs Away" },
      { id: "jor-draw", title: "Drawing a Frame" },
      { id: "jor-body", title: "The Serpent's Body" },
      { id: "jor-phases", title: "Phases and the Question Gate" },
      { id: "jor-scores", title: "Scores and the Leaderboard" },
      { id: "jor-high-scores", lab: true, title: "Lab: Pinball Hall of Fame" },
    ],
  },
  {
    id: "tidesong",
    page: "tidesong.html",
    summary:
      "A big game split into modules: the game loop, a world of joined " +
      "regions, data-built creatures, promise-driven battles, a rhythm " +
      "game, and saves synced between computers.",
    title: "Course 6: Tidesong",
    steps: [
      { id: "tide-page", title: "A Canvas with Buttons on Top" },
      { id: "tide-modules", title: "One Game, Many Modules" },
      { id: "tide-loop", title: "The Game Loop and Input" },
      { id: "tide-world", title: "Regions, Edges and the Camera" },
      { id: "tide-trail-map", lab: true, title: "Lab: Trail Map" },
      { id: "tide-creatures", title: "150 Creatures from One String" },
      { id: "tide-encounters", title: "Weighted Random Encounters" },
      { id: "tide-fishing-pond", lab: true, title: "Lab: Fishing Pond" },
      { id: "tide-panels", title: "Waiting for the Player with Promises" },
      { id: "tide-battle", title: "The Battle Loop" },
      { id: "tide-cave-quest", lab: true, title: "Lab: Cave Quest" },
      { id: "tide-rhythm", title: "The Song and Dance Game" },
      { id: "tide-drum-tutor", lab: true, title: "Lab: Drum Tutor" },
      { id: "tide-catch", title: "Befriending, Keys and the Question Gate" },
      { id: "tide-save", title: "Saving and Loading" },
      { id: "tide-cloud", title: "Cloud Sync: the Newest Save Wins" },
      { id: "tide-sticky-notes", lab: true, title: "Lab: Sticky Notes Sync" },
      { id: "tide-art", title: "Atlases, Caches and Poses" },
      { id: "tide-unlocks", title: "Unlocking New Merfolk" },
    ],
  },
  {
    id: "spireclash",
    page: "spireclash.html",
    summary:
      "A 3D duel with three.js: a game loop driven by dt, yaw and pitch, " +
      "box collisions, a building grid held up by a flood fill, hitscan " +
      "shots, aim assist maths and a rival with a reaction time.",
    title: "Course 7: Spireclash",
    steps: [
      { id: "spire-page", title: "The Game Page" },
      { id: "spire-scene", title: "A 3D Scene with three.js" },
      { id: "spire-loop", title: "The Game Loop" },
      { id: "spire-crossing", lab: true, title: "Lab: Pelican Crossing" },
      { id: "spire-angles", title: "Angles: Yaw and Pitch" },
      { id: "spire-lighthouse", lab: true, title: "Lab: Lighthouse Keeper" },
      { id: "spire-input", title: "Mouse Look and the Keyboard" },
      { id: "spire-physics", title: "Moving a Knight" },
      { id: "spire-grid", title: "The Building Grid" },
      { id: "spire-collapse", title: "When Supports Break" },
      { id: "spire-ice-floes", lab: true, title: "Lab: Ice Floes" },
      { id: "spire-shots", title: "Hitscan Shots and Damage" },
      { id: "spire-aim-assist", title: "Aim Assist" },
      { id: "spire-rival", title: "A Rival That Thinks" },
      { id: "spire-star-tracker", lab: true, title: "Lab: Star Tracker" },
      { id: "spire-rounds", title: "Rounds, Questions and the Leaderboard" },
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
