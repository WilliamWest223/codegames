import type { Level } from '@codegames/shared';
import { code, same, grid } from '../../helpers';
import { MOVE, TURN_LEFT, COLLECT } from './shared';

/** sequencing levels, in play order. */
export const sequencingLevels: Level[] = [
  {
    id: 'sequencing-1',
    conceptId: 'sequencing',
    title: 'First Steps',
    role: 'intro',
    game: 'grid-quest',
    mode: 'guided',
    prompt: `The robot runs your commands **one at a time, top to bottom**.\n\nUse ${MOVE} to step forward and ${COLLECT} to pick up the gem.`,
    reinforces: [],
    hints: [`The gem is 3 tiles ahead. How many times do you need ${MOVE}?`, `Write ${MOVE} three times, then ${COLLECT}.`],
    grid: grid(`
      #######
      #>..G.#
      #######
    `),
    starterCode: code(
      `
      # Each line is one command for the robot.
      move()
      `,
      `
      // Each line is one command for the robot.
      move();
      `,
    ),
    solution: code(
      `
      move()
      move()
      move()
      collect()
      `,
      `
      move();
      move();
      move();
      collect();
      `,
    ),
    takeaway: 'A program is a list of instructions the computer follows in order. Changing the order changes the result.',
  },
  {
    id: 'sequencing-2',
    conceptId: 'sequencing',
    title: 'Turn the Corner',
    role: 'combine',
    game: 'grid-quest',
    mode: 'guided',
    prompt: `The gem is around a corner. ${TURN_LEFT} turns the robot 90° to its left **without moving**.`,
    reinforces: [],
    hints: ['Walk to the corner first, then turn.', `After turning, ${MOVE} goes in the new direction.`],
    grid: grid(`
      #####
      #G..#
      ###.#
      ###^#
      #####
    `),
    starterCode: same(''),
    solution: code(
      `
      move()
      move()
      turn_left()
      move()
      move()
      collect()
      `,
      `
      move();
      move();
      turnLeft();
      move();
      move();
      collect();
      `,
    ),
  },
  {
    id: 'sequencing-3',
    conceptId: 'sequencing',
    title: 'Scrambled Route',
    role: 'integrate',
    game: 'parsons',
    mode: 'parsons',
    prompt: 'Someone shuffled the robot\'s program! Put the lines in an order that collects **both** gems.',
    reinforces: [],
    hints: ['Trace the path with your finger first.', 'The robot faces right (east) when it starts. The second gem is up and to the right.', 'Grab the first gem, take one more step, turn left (to face up), then step and collect.'],
    grid: grid(`
      ######
      ####G#
      #>.G.#
      ######
    `),
    solution: code(
      `
      move()
      move()
      collect()
      move()
      turn_left()
      move()
      collect()
      `,
      `
      move();
      move();
      collect();
      move();
      turnLeft();
      move();
      collect();
      `,
    ),
  },
];
