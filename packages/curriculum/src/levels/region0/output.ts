import type { Level } from '@codegames/shared';
import { code, same } from '../../helpers';
import { lang } from '../../localize';
import { PRINT } from './shared';

/** output levels, in play order. */
export const outputLevels: Level[] = [
  {
    id: 'output-1',
    conceptId: 'output',
    title: 'Hello, World!',
    role: 'intro',
    game: 'build-it',
    mode: 'guided',
    prompt: `Programmers traditionally start with one line. Use ${PRINT} to show exactly:\n\n\`\`\`\nHello, World!\n\`\`\`\n\nText goes inside quotes: ${lang('`print("like this")`', '`console.log("like this")`')}.`,
    reinforces: ['sequencing'],
    hints: ['Put the text inside quotes, inside the brackets.', 'Capital H, comma, space, capital W, exclamation mark. The output must match exactly.', lang('`print("Hello, World!")`', '`console.log("Hello, World!");`')],
    starterCode: code('# Print Hello, World!', '// Print Hello, World!'),
    solution: code('print("Hello, World!")', 'console.log("Hello, World!");'),
    tests: [{ name: 'prints the greeting', expectedOutput: 'Hello, World!' }],
    takeaway: 'Text in quotes is called a **string**. The computer prints it exactly as written.',
  },
  {
    id: 'output-2',
    conceptId: 'output',
    title: 'Countdown',
    role: 'combine',
    game: 'predict-output',
    mode: 'hybrid',
    choices: { python: ["3\n2\n1\n\nLiftoff!", "3\n2\n1\nLiftoff!", "3\n2\n1\n()\nLiftoff!", "321\nLiftoff!"], javascript: ["3\n2\n1\n\nLiftoff!", "3\n2\n1\nLiftoff!", "3\n2\n1\n()\nLiftoff!", "321\nLiftoff!"] },
    prompt: 'Read the program and predict **exactly** what it prints, line by line.',
    reinforces: ['sequencing'],
    hints: [`Each ${PRINT} starts a new line.`, `An empty ${PRINT} prints a blank line.`],
    code: code(
      `
      print("3")
      print("2")
      print("1")
      print()
      print("Liftoff!")
      `,
      `
      console.log("3");
      console.log("2");
      console.log("1");
      console.log();
      console.log("Liftoff!");
      `,
    ),
    modify: {
      prompt: 'Now **modify** it: make the countdown start from 5 instead of 3 (still ending with a blank line and `Liftoff!`).',
      expectedOutput: '5\n4\n3\n2\n1\n\nLiftoff!',
      solution: code(
        `
        print("5")
        print("4")
        print("3")
        print("2")
        print("1")
        print()
        print("Liftoff!")
        `,
        `
        console.log("5");
        console.log("4");
        console.log("3");
        console.log("2");
        console.log("1");
        console.log();
        console.log("Liftoff!");
        `,
      ),
    },
  },
  {
    id: 'output-3',
    conceptId: 'output',
    title: 'Banner Maker',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: 'Print this banner, line by line:\n\n```\n+--------+\n| CODE!  |\n+--------+\n```',
    reinforces: ['sequencing'],
    hints: ['You need three print lines.', 'Count the dashes: there are 8 between the plus signs.'],
    starterCode: same(''),
    solution: code(
      `
      print("+--------+")
      print("| CODE!  |")
      print("+--------+")
      `,
      `
      console.log("+--------+");
      console.log("| CODE!  |");
      console.log("+--------+");
      `,
    ),
    tests: [{ name: 'prints the banner', expectedOutput: '+--------+\n| CODE!  |\n+--------+' }],
  },
];
