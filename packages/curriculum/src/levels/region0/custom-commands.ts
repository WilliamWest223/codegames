import type { Level } from '@codegames/shared';
import { code, same, grid } from '../../helpers';
import { lang } from '../../localize';
import { MOVE, TURN_LEFT, TURN_RIGHT, COLLECT } from './shared';

/** custom-commands levels, in play order. */
export const customCommandsLevels: Level[] = [
  {
    id: 'custom-commands-1',
    conceptId: 'custom-commands',
    title: 'Make a Right Turn',
    role: 'intro',
    game: 'grid-quest',
    mode: 'fill-blanks',
    prompt: `The robot only knows how to turn left. But three left turns make one right turn!\n\nFill in the blanks (\`___\`) to finish your own command ${TURN_RIGHT}, then watch it work.`,
    reinforces: ['sequencing'],
    hints: [`${TURN_RIGHT} should contain ${TURN_LEFT} three times.`, lang('The indented lines belong to the command. In Python, indentation isn\'t decoration: it is how Python knows which lines are inside.', 'The lines between `{` and `}` belong to the command.')],
    grid: grid(`
      ####
      #>.#
      ##.#
      ##G#
      ####
    `),
    starterCode: code(
      `
      def turn_right():
          turn_left()
          ___
          ___

      move()
      turn_right()
      move()
      move()
      collect()
      `,
      `
      function turnRight() {
        turnLeft();
        ___
        ___
      }

      move();
      turnRight();
      move();
      move();
      collect();
      `,
    ),
    solution: code(
      `
      def turn_right():
          turn_left()
          turn_left()
          turn_left()

      move()
      turn_right()
      move()
      move()
      collect()
      `,
      `
      function turnRight() {
        turnLeft();
        turnLeft();
        turnLeft();
      }

      move();
      turnRight();
      move();
      move();
      collect();
      `,
    ),
    takeaway: `You just **defined** a new command. ${lang('`def`', '`function`')} gives a name to a group of steps, and you can use that name as often as you like.`,
  },
  {
    id: 'custom-commands-2',
    conceptId: 'custom-commands',
    title: 'Zig-Zag',
    role: 'combine',
    game: 'grid-quest',
    mode: 'guided',
    prompt: `Zig-zag down the stairs to the gem. Define ${TURN_RIGHT} again (from memory if you can!) and use it.`,
    reinforces: ['sequencing'],
    hints: ['Pattern: move, turn right, move, turn left...', `Your ${TURN_RIGHT} is three ${TURN_LEFT}s.`],
    grid: grid(`
      ######
      #>.###
      ##..##
      ###.G#
      ######
    `),
    starterCode: code('# Define turn_right() first, then guide the robot.\n', '// Define turnRight() first, then guide the robot.\n'),
    solution: code(
      `
      def turn_right():
          turn_left()
          turn_left()
          turn_left()

      move()
      turn_right()
      move()
      turn_left()
      move()
      turn_right()
      move()
      turn_left()
      move()
      collect()
      `,
      `
      function turnRight() {
        turnLeft();
        turnLeft();
        turnLeft();
      }

      move();
      turnRight();
      move();
      turnLeft();
      move();
      turnRight();
      move();
      turnLeft();
      move();
      collect();
      `,
    ),
    requirements: {
      python: [
        { pattern: 'def\\s+turn_right\\s*\\(', message: 'Define your own turn_right() command.' },
        { pattern: '(turn_right\\(\\)[\\s\\S]*){3}', message: 'Use your turn_right() command for each right turn.' },
        { pattern: '(turn_left\\(\\)[\\s\\S]*){6}', forbid: true, message: 'Use turn_right() instead of writing three turn_left()s again.' },
      ],
      javascript: [
        { pattern: 'function\\s+turnRight\\s*\\(', message: 'Define your own turnRight() command.' },
        { pattern: '(turnRight\\(\\)[\\s\\S]*){3}', message: 'Use your turnRight() command for each right turn.' },
        { pattern: '(turnLeft\\(\\)[\\s\\S]*){6}', forbid: true, message: 'Use turnRight() instead of writing three turnLeft()s again.' },
      ],
    },
  },
  {
    id: 'custom-commands-3',
    conceptId: 'custom-commands',
    title: 'Gem Hallway',
    role: 'integrate',
    game: 'grid-quest',
    mode: 'guided',
    prompt: `Four gems in a row. Writing ${MOVE} and ${COLLECT} four times each is tiring...\n\nDefine a command ${lang('`grab_next()`', '`grabNext()`')} that moves one step **and** collects, then call it four times.`,
    reinforces: ['sequencing'],
    hints: ['Your command has two lines inside it.', 'Then the main program is just four calls.'],
    grid: grid(`
      #######
      #>GGGG#
      #######
    `),
    starterCode: same(''),
    solution: code(
      `
      def grab_next():
          move()
          collect()

      grab_next()
      grab_next()
      grab_next()
      grab_next()
      `,
      `
      function grabNext() {
        move();
        collect();
      }

      grabNext();
      grabNext();
      grabNext();
      grabNext();
      `,
    ),
    requirements: {
      python: [
        { pattern: 'def\\s+grab_next\\s*\\(', message: 'Define a command called grab_next().' },
        { pattern: '(grab_next\\(\\)[\\s\\S]*){5}', message: 'Call grab_next() once for each gem (4 times).' },
        { pattern: '(move\\(\\)[\\s\\S]*){2}', forbid: true, message: 'Only grab_next() should contain move(): call your command instead.' },
      ],
      javascript: [
        { pattern: 'function\\s+grabNext\\s*\\(', message: 'Define a command called grabNext().' },
        { pattern: '(grabNext\\(\\)[\\s\\S]*){5}', message: 'Call grabNext() once for each gem (4 times).' },
        { pattern: '(move\\(\\)[\\s\\S]*){2}', forbid: true, message: 'Only grabNext() should contain move(): call your command instead.' },
      ],
    },
  },
];
