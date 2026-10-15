import type { Level } from '@codegames/shared';
import { code, same, grid } from '../../helpers';
import { lang } from '../../localize';
import { TURN_RIGHT } from './shared';

/** repeat levels, in play order. */
export const repeatLevels: Level[] = [
  {
    id: 'repeat-1',
    conceptId: 'repeat',
    title: 'Repeat After Me',
    role: 'intro',
    game: 'grid-quest',
    mode: 'fill-blanks',
    prompt: `A **loop** repeats ${lang('the indented steps under it', 'the steps between its `{` and `}`')}. Fill in how many times to repeat so the robot collects every gem.\n\n${lang('```python\nfor i in range(3):\n    # these lines run 3 times\n```', '```javascript\nfor (let i = 0; i < 3; i++) {\n  // these lines run 3 times\n}\n```')}\n\nFor now, copy this shape and change only the number. \`i\` counts the rounds; you'll meet it properly in the For Loops lessons.`,
    reinforces: ['sequencing'],
    hints: ['How many times does the robot need to step forward and collect?', 'Count the gems in the hallway.', 'There are 5 gems, so repeat 5 times.'],
    grid: grid(`
      ########
      #>GGGGG#
      ########
    `),
    starterCode: code(
      `
      for i in range(___):
          move()
          collect()
      `,
      `
      for (let i = 0; i < ___; i++) {
        move();
        collect();
      }
      `,
    ),
    solution: code(
      `
      for i in range(5):
          move()
          collect()
      `,
      `
      for (let i = 0; i < 5; i++) {
        move();
        collect();
      }
      `,
    ),
    requirements: {
      python: [{ pattern: '(move\\(\\)[\\s\\S]*){2}', forbid: true, message: 'Let the loop do the walking: write move() only once.' }],
      javascript: [{ pattern: '(move\\(\\)[\\s\\S]*){2}', forbid: true, message: 'Let the loop do the walking: write move() only once.' }],
    },
    takeaway: 'Loops let a few lines do a lot of work. Change one number and the robot handles a hallway of any length.',
    maxLines: 5,
  },
  {
    id: 'repeat-2',
    conceptId: 'repeat',
    title: 'Square Dance',
    role: 'combine',
    game: 'grid-quest',
    mode: 'guided',
    prompt: `Three gems sit at the corners of a square. Define a command ${lang('`side()`', '`side()`')} that walks one side (3 moves), collects, and turns left. Then **repeat** it 3 times.`,
    reinforces: ['custom-commands', 'sequencing'],
    hints: ['Inside side(): three moves, collect, turn left.', 'Put a call to side() inside a loop that runs 3 times.'],
    grid: grid(`
      ######
      #G..G#
      #.##.#
      #.##.#
      #>..G#
      ######
    `),
    starterCode: same(''),
    solution: code(
      `
      def side():
          move()
          move()
          move()
          collect()
          turn_left()

      for i in range(3):
          side()
      `,
      `
      function side() {
        move();
        move();
        move();
        collect();
        turnLeft();
      }

      for (let i = 0; i < 3; i++) {
        side();
      }
      `,
    ),
    requirements: {
      python: [
        { pattern: 'def\\s+side\\s*\\(', message: 'Define a command called side().' },
        { pattern: 'for\\s+\\w+\\s+in\\s+range', message: 'Use a loop to repeat side().' },
        { pattern: '(move\\(\\)[\\s\\S]*){4}', forbid: true, message: 'Only side() should contain move(): let the loop repeat it.' },
      ],
      javascript: [
        { pattern: 'function\\s+side\\s*\\(', message: 'Define a command called side().' },
        { pattern: 'for\\s*\\(', message: 'Use a loop to repeat side().' },
        { pattern: '(move\\(\\)[\\s\\S]*){4}', forbid: true, message: 'Only side() should contain move(): let the loop repeat it.' },
      ],
    },
    maxLines: 12,
  },
  {
    id: 'repeat-3',
    conceptId: 'repeat',
    title: 'Stairway to the Stars',
    role: 'integrate',
    game: 'grid-quest',
    mode: 'guided',
    prompt: `Climb four steps, collecting a gem on each. Every step is the same pattern, so find it once and **loop** it. You'll need your ${TURN_RIGHT} command again.`,
    reinforces: ['custom-commands', 'sequencing'],
    hints: ['One step: move, turn left, move, turn right, collect.', 'Repeat that 4 times.'],
    grid: grid(`
      #######
      #####G#
      ####G.#
      ###G.##
      ##G.###
      #>.####
      #######
    `),
    starterCode: same(''),
    solution: code(
      `
      def turn_right():
          turn_left()
          turn_left()
          turn_left()

      for i in range(4):
          move()
          turn_left()
          move()
          turn_right()
          collect()
      `,
      `
      function turnRight() {
        turnLeft();
        turnLeft();
        turnLeft();
      }

      for (let i = 0; i < 4; i++) {
        move();
        turnLeft();
        move();
        turnRight();
        collect();
      }
      `,
    ),
    requirements: {
      python: [
        { pattern: 'for\\s+\\w+\\s+in\\s+range', message: 'Use a loop for the repeating step pattern.' },
        { pattern: '(move\\(\\)[\\s\\S]*){3}', forbid: true, message: 'One step needs only two move() lines; let the loop repeat them.' },
      ],
      javascript: [
        { pattern: 'for\\s*\\(', message: 'Use a loop for the repeating step pattern.' },
        { pattern: '(move\\(\\)[\\s\\S]*){3}', forbid: true, message: 'One step needs only two move() lines; let the loop repeat them.' },
      ],
    },
    maxLines: 14,
  },
];
