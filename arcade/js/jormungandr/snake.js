// The serpent: a list of cells, head first, moving one cell per step.
import { startCells } from "./board.js";

export const directions = {
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: -1 },
};

export function createSnake() {
  return {
    // Every cell remembers which side the belly was on when the head
    // passed through it (see bellySide).
    body: startCells.map((c) => ({ ...c, belly: -1 })),
    dir: directions.right,
    grow: 0,
    // Turns pressed between steps, so a quick "up then left" isn't lost.
    queue: [],
  };
}

// Queues a turn. Reversing straight into the neck, or repeating the
// direction already queued, is ignored.
export function turn(snake, dir) {
  const last = snake.queue.at(-1) ?? snake.dir;
  if (dir.x === last.x && dir.y === last.y) return;
  if (dir.x === -last.x && dir.y === -last.y) return;
  if (snake.queue.length < 2) snake.queue.push(dir);
}

// The cell the head moves into next, taking the next queued turn.
export function takeTurn(snake) {
  if (snake.queue.length > 0) snake.dir = snake.queue.shift();
  const head = snake.body[0];
  return { x: head.x + snake.dir.x, y: head.y + snake.dir.y };
}

// True if the snake's body covers (x, y). The tail cell is left out when
// it is about to move away, since the head can follow straight into it.
export function bodyAt(snake, x, y, tailMoves = false) {
  const end = tailMoves && snake.grow === 0 ? snake.body.length - 1 : snake.body.length;
  for (let i = 0; i < end; i += 1) {
    if (snake.body[i].x === x && snake.body[i].y === y) return true;
  }
  return false;
}

// The belly sits on the head sprite's jaw side. Heading left that's the
// left of travel (+1); heading right the sprite is mirrored, so it's the
// right (-1). Heading up or down keeps whichever side it was on, so the
// belly only twists over when the serpent turns back on itself.
function bellySide(snake) {
  if (snake.dir.x > 0) return -1;
  if (snake.dir.x < 0) return 1;
  return snake.body[0]?.belly ?? 1;
}

export function advance(snake, cell) {
  snake.body.unshift({ ...cell, belly: bellySide(snake) });
  if (snake.grow > 0) {
    snake.grow -= 1;
    return;
  }
  snake.body.pop();
}

// Left and right of the current heading, for a shield to swerve into.
export function sideTurns(snake) {
  const { x, y } = snake.dir;
  return [{ x: -y, y: x }, { x: y, y: -x }];
}
