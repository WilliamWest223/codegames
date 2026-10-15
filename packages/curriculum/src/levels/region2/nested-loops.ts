import type { Level } from '@codegames/shared';
import { code, grid } from '../../helpers';
import { lang } from '../../localize';
import { TURN_RIGHT_TXT, NEEDS_FOR, NEEDS_WHILE } from './shared';

/** nested-loops levels, in play order. */
export const nestedLoopsLevels: Level[] = [
  {
    id: 'nested-loops-1',
    conceptId: 'nested-loops',
    title: 'Grid of Stars',
    role: 'intro',
    game: 'predict-output',
    remix: true,
    mode: 'hybrid',
    choices: { python: ["****\n****\n****", "***\n***\n***\n***", "************", "****\n********\n************"], javascript: ["****\n****\n****", "***\n***\n***\n***", "************", "****\n********\n************"] },
    prompt: 'A loop inside a loop: for **each** round of the outer loop, the inner loop runs **all the way** through. Predict the output.',
    reinforces: ['loops', 'strings-basics'],
    hints: ['The inner loop builds one line of stars.', 'The outer loop decides how many lines.'],
    code: code(
      `
      for row in range(3):
          line = ""
          for col in range(4):
              line += "*"
          print(line)
      `,
      `
      for (let row = 0; row < 3; row++) {
        let line = "";
        for (let col = 0; col < 4; col++) {
          line += "*";
        }
        console.log(line);
      }
      `,
    ),
    takeaway: 'Inner loops run completely for **each** round of the outer loop: 3 rows × 4 stars = 12 stars.',
    modify: {
      prompt: 'Now **modify** it: make a rectangle with **2 rows of 5 stars**.',
      expectedOutput: '*****\n*****',
      solution: code(
        `
        for row in range(2):
            line = ""
            for col in range(5):
                line += "*"
            print(line)
        `,
        `
        for (let row = 0; row < 2; row++) {
          let line = "";
          for (let col = 0; col < 5; col++) {
            line += "*";
          }
          console.log(line);
        }
        `,
      ),
      requirements: {
        python: [{ pattern: '(for|while)[\\s\\S]+(for|while)', message: 'Keep both loops.' }, { pattern: '\\*{2,}', forbid: true, message: 'Let the inner loop build the stars one at a time.' }],
        javascript: [{ pattern: '(for|while)[\\s\\S]+(for|while)', message: 'Keep both loops.' }, { pattern: '\\*{2,}', forbid: true, message: 'Let the inner loop build the stars one at a time.' }],
      },
    },
  },
  {
    id: 'nested-loops-2',
    conceptId: 'nested-loops',
    title: 'Staircase',
    role: 'combine',
    game: 'build-it',
    mode: 'guided',
    prompt: 'Read `n` and draw a staircase of `#` with n rows, where row 1 has 1 block, row 2 has 2, and so on. Use **two loops**: one for rows, and an inner loop that builds each row one `#` at a time (no `*` shortcut this time: it\'s practice for grids later).\n\nFor n = 3:\n\n```\n#\n##\n###\n```',
    reinforces: ['loops', 'input', 'strings-basics'],
    hints: ['The outer loop counts rows from 1 to n.', 'The inner loop adds one `#` per step, as many steps as the row number.'],
    starterCode: code(
      `
      # SET UP
      # LOOP (rows)
      #   SET UP
      #   LOOP (blocks)
      #     UPDATE
      #   REPORT
      `,
      `
      // SET UP
      // LOOP (rows)
      //   SET UP
      //   LOOP (blocks)
      //     UPDATE
      //   REPORT
      `,
    ),
    solution: code(
      `
      n = int(input())
      for row in range(1, n + 1):
          line = ""
          for i in range(row):
              line += "#"
          print(line)
      `,
      `
      const n = Number(prompt());
      for (let row = 1; row <= n; row++) {
        let line = "";
        for (let i = 0; i < row; i++) {
          line += "#";
        }
        console.log(line);
      }
      `,
    ),
    tests: [
      { name: 'n = 3', input: '3', expectedOutput: '#\n##\n###' },
      { name: 'n = 5', input: '5', expectedOutput: '#\n##\n###\n####\n#####', hidden: true },
    ],
    requirements: {
      python: [{ pattern: '(for|while)[\\s\\S]+(for|while)', message: 'Use a loop inside a loop.' }],
      javascript: [{ pattern: '(for|while)[\\s\\S]+(for|while)', message: 'Use a loop inside a loop.' }],
    },
  },
  {
    id: 'nested-loops-4',
    conceptId: 'nested-loops',
    title: 'Sweep One Row',
    role: 'combine',
    game: 'grid-quest',
    mode: 'fill-blanks',
    prompt: `Warm-up for the big room sweep: define ${lang('`sweep_row()`', '`sweepRow()`')} that walks to the end of a row and collects every gem it passes. Gems can be anywhere: your code is tested on two different rows.`,
    reinforces: ['while-loops', 'conditionals'],
    hints: ['Walk while the way ahead is clear.', 'After each step, check for a gem.', lang('Blank 1: `not is_blocked()`. Blank 2: `on_gem()`.', 'Blank 1: `!isBlocked()`. Blank 2: `onGem()`.')],
    grid: grid(`
      #########
      #>.G.GG.#
      #########
    `),
    extraGrids: [grid(`
      #######
      #>GG..#
      #######
    `)],
    starterCode: code(
      `
      def sweep_row():
          while ___:
              move()
              if ___:
                  collect()

      sweep_row()
      `,
      `
      function sweepRow() {
        while (___) {
          move();
          if (___) {
            collect();
          }
        }
      }

      sweepRow();
      `,
    ),
    solution: code(
      `
      def sweep_row():
          while not is_blocked():
              move()
              if on_gem():
                  collect()

      sweep_row()
      `,
      `
      function sweepRow() {
        while (!isBlocked()) {
          move();
          if (onGem()) {
            collect();
          }
        }
      }

      sweepRow();
      `,
    ),
  },
  {
    id: 'nested-loops-3',
    conceptId: 'nested-loops',
    title: 'Room Sweep',
    role: 'integrate',
    game: 'grid-quest',
    mode: 'fill-blanks',
    prompt: `Sweep the whole room in a snake pattern: along a row, down, back along the next row, collecting every gem. Gems can be anywhere, and your code is tested on **two different rooms**.\n\nYour ${lang('`sweep_row()`', '`sweepRow()`')} from the last level is ready. Fill in the blanks to **get to the next row**: after an even row (0) the robot faces right and must turn down and around to face left; after an odd row (1) it's the mirror image. The first tile of each new row can have a gem too!`,
    reinforces: ['while-loops', 'conditionals', 'custom-commands', 'loops'],
    hints: [
      'Use Step to watch where the robot ends up after row 0: at the right wall, facing right.',
      `After row 0: ${TURN_RIGHT_TXT} to face down, ${lang('`move()`', '`move()`')}, collect if there's a gem, then ${TURN_RIGHT_TXT} again to face left. After row 1 it's the mirror image with ${lang('`turn_left()`', '`turnLeft()`')}.`,
      lang(
        'First blank (4 lines plus the gem check): `turn_right()`, `move()`, `if on_gem(): collect()`, `turn_right()`. The second blank is the same with `turn_left()`.',
        'First blank: `turnRight();`, `move();`, `if (onGem()) { collect(); }`, `turnRight();`. The second blank is the same with `turnLeft()`.',
      ),
    ],
    grid: grid(`
      #######
      #>.G.G#
      #G..G.#
      #.G...#
      #######
    `),
    extraGrids: [grid(`
      #######
      #>G...#
      #...G.#
      #G...G#
      #######
    `)],
    starterCode: code(
      `
      def turn_right():
          turn_left()
          turn_left()
          turn_left()

      def sweep_row():
          while not is_blocked():
              move()
              if on_gem():
                  collect()

      for row in range(3):
          sweep_row()
          if row == 2:
              break
          if row % 2 == 0:
              ___
          else:
              ___
      `,
      `
      function turnRight() {
        turnLeft();
        turnLeft();
        turnLeft();
      }

      function sweepRow() {
        while (!isBlocked()) {
          move();
          if (onGem()) {
            collect();
          }
        }
      }

      for (let row = 0; row < 3; row++) {
        sweepRow();
        if (row === 2) {
          break;
        }
        if (row % 2 === 0) {
          ___
        } else {
          ___
        }
      }
      `,
    ),
    solution: code(
      `
      def turn_right():
          turn_left()
          turn_left()
          turn_left()

      def sweep_row():
          while not is_blocked():
              move()
              if on_gem():
                  collect()

      for row in range(3):
          sweep_row()
          if row == 2:
              break
          if row % 2 == 0:
              turn_right()
              move()
              if on_gem():
                  collect()
              turn_right()
          else:
              turn_left()
              move()
              if on_gem():
                  collect()
              turn_left()
      `,
      `
      function turnRight() {
        turnLeft();
        turnLeft();
        turnLeft();
      }

      function sweepRow() {
        while (!isBlocked()) {
          move();
          if (onGem()) {
            collect();
          }
        }
      }

      for (let row = 0; row < 3; row++) {
        sweepRow();
        if (row === 2) {
          break;
        }
        if (row % 2 === 0) {
          turnRight();
          move();
          if (onGem()) {
            collect();
          }
          turnRight();
        } else {
          turnLeft();
          move();
          if (onGem()) {
            collect();
          }
          turnLeft();
        }
      }
      `,
    ),
    requirements: { python: [...NEEDS_WHILE.python, ...NEEDS_FOR.python], javascript: [...NEEDS_WHILE.javascript, ...NEEDS_FOR.javascript] },
  },
];
