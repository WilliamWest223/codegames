import type { Level } from '@codegames/shared';
import { code, same, grid } from '../../helpers';
import { TURN_LEFT, TURN_RIGHT } from './shared';

/** boss-0 levels, in play order. */
export const boss0Levels: Level[] = [
  {
    id: 'boss-0',
    conceptId: 'boss-0',
    title: 'Robot Rescue',
    role: 'boss',
    game: 'grid-quest',
    mode: 'freeform',
    prompt: `**Boss level!** Guide the robot down the canyon: collect all 3 gems, stop on the flag 🏁, and then print \`Rescue complete!\`.\n\nThe canyon repeats the same pattern, so your solution must use **your own command** and a **loop**, and start with a **comment** explaining your plan.`,
    reinforces: ['sequencing', 'output', 'custom-commands', 'repeat', 'comments'],
    hints: ['Find the pattern: walk two tiles, collect, step down a level.', `One level: move, move, collect, ${TURN_RIGHT}, move, ${TURN_LEFT}.`, 'After the loop, one more move reaches the flag.'],
    grid: grid(`
      ##########
      #>.G######
      ###..G####
      #####..G##
      #######.F#
      ##########
    `),
    starterCode: same(''),
    solution: code(
      `
      # Each level of the canyon: walk 2, grab the gem, drop down.
      def turn_right():
          turn_left()
          turn_left()
          turn_left()

      for i in range(3):
          move()
          move()
          collect()
          turn_right()
          move()
          turn_left()

      move()
      print("Rescue complete!")
      `,
      `
      // Each level of the canyon: walk 2, grab the gem, drop down.
      function turnRight() {
        turnLeft();
        turnLeft();
        turnLeft();
      }

      for (let i = 0; i < 3; i++) {
        move();
        move();
        collect();
        turnRight();
        move();
        turnLeft();
      }

      move();
      console.log("Rescue complete!");
      `,
    ),
    expectedOutput: 'Rescue complete!',
    requirements: {
      python: [
        { pattern: 'def\\s+\\w+\\s*\\(', message: 'Define at least one command of your own.' },
        { pattern: 'for\\s+\\w+\\s+in\\s+range', message: 'Use a loop for the repeating pattern.' },
        { pattern: '#\\s*\\S', message: 'Add a comment (#) explaining your plan.' },
        { pattern: '(move\\(\\)[\\s\\S]*){5}', forbid: true, message: 'Too many move() lines: put the repeating part in a loop.' },
      ],
      javascript: [
        { pattern: 'function\\s+\\w+\\s*\\(', message: 'Define at least one command of your own.' },
        { pattern: 'for\\s*\\(', message: 'Use a loop for the repeating pattern.' },
        { pattern: '//\\s*\\S', message: 'Add a comment (//) explaining your plan.' },
        { pattern: '(move\\(\\)[\\s\\S]*){5}', forbid: true, message: 'Too many move() lines: put the repeating part in a loop.' },
      ],
    },
    takeaway: 'You combined sequencing, your own commands, loops and comments. Spotting a **repeating pattern** and turning it into a loop is the heart of programming.',
    maxLines: 20,
  },
];
