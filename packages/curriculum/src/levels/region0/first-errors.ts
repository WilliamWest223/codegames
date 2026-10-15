import type { Level } from '@codegames/shared';
import { code, grid } from '../../helpers';
import { lang } from '../../localize';

/** first-errors levels, in play order. */
export const firstErrorsLevels: Level[] = [
  {
    id: 'first-errors-1',
    conceptId: 'first-errors',
    title: 'Missing Quote',
    role: 'intro',
    game: 'bug-hunt',
    mode: 'fill-blanks',
    prompt: 'This program crashes before it even starts. Run it, **read the error message**, and fix it so it prints `Hello, coder!`.',
    reinforces: ['output'],
    hints: ['Run it. The error box tells you which line has the problem.', 'Look closely at the quotes on that line.', 'Every opening quote needs a closing quote: add a `"` after `coder!`.'],
    starterCode: code('print("Hello, coder!)', 'console.log("Hello, coder!);'),
    solution: code('print("Hello, coder!")', 'console.log("Hello, coder!");'),
    tests: [{ name: 'prints the greeting', expectedOutput: 'Hello, coder!' }],
    takeaway: 'A **syntax error** means the code breaks the language\'s grammar rules. The error message tells you which line to look at.',
  },
  {
    id: 'first-errors-2',
    conceptId: 'first-errors',
    title: 'Spelling Counts',
    role: 'combine',
    game: 'bug-hunt',
    mode: 'fill-blanks',
    prompt: 'Computers are picky about spelling and capital letters. Fix **both** bugs so the program prints:\n\n```\nReady\nGo!\n```',
    reinforces: ['output', 'sequencing'],
    hints: ['Fix one error, run again, and read the next error.', lang('Python commands are lowercase: `print`, not `Print`.', 'It\'s `console.log`: lowercase c and lowercase l.')],
    starterCode: code(
      `
      Print("Ready")
      prnt("Go!")
      `,
      `
      Console.log("Ready");
      console.Log("Go!");
      `,
    ),
    solution: code(
      `
      print("Ready")
      print("Go!")
      `,
      `
      console.log("Ready");
      console.log("Go!");
      `,
    ),
    tests: [{ name: 'prints both lines', expectedOutput: 'Ready\nGo!' }],
  },
  {
    id: 'first-errors-3',
    conceptId: 'first-errors',
    title: 'Robot Repair',
    role: 'integrate',
    game: 'grid-quest',
    mode: 'fill-blanks',
    prompt: 'This robot program has **two** bugs: one typo that causes an error, and one extra command that crashes the robot. Fix both.',
    reinforces: ['custom-commands', 'sequencing'],
    hints: ['Read the error first: which name is misspelled?', 'After fixing the typo, run again and watch where the robot bumps.'],
    grid: grid(`
      #####
      #>.##
      ##.##
      ##G##
      #####
    `),
    starterCode: code(
      `
      def turn_right():
          turn_left()
          turn_left()
          turnleft()

      move()
      turn_right()
      move()
      move()
      move()
      collect()
      `,
      `
      function turnRight() {
        turnLeft();
        turnLeft();
        turnleft();
      }

      move();
      turnRight();
      move();
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
  },
];
