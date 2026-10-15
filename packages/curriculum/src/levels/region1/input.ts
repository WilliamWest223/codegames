import type { Level } from '@codegames/shared';
import { code, same } from '../../helpers';
import { lang } from '../../localize';
import { INPUT } from './shared';

/** input levels, in play order. */
export const inputLevels: Level[] = [
  {
    id: 'input-1',
    conceptId: 'input',
    title: 'Echo',
    role: 'intro',
    game: 'build-it',
    mode: 'guided',
    prompt: `${INPUT} reads one line typed by the user. Read a name and greet it ${lang('using an f-string', 'using a template literal')}:\n\n\`\`\`\nHello, Ada!\n\`\`\`\n\nThe tests type different names, so don't type the name yourself. You may write a question inside, like ${lang('`input("Name? ")`', '`prompt("Name? ")`')}; it's shown to the user but not checked.`,
    reinforces: ['variables', 'string-formatting'],
    hints: ['The name is already read into `name` for you.', lang('`print(f"Hello, {name}!")`', '`` console.log(`Hello, ${name}!`); ``')],
    starterCode: code('name = input()\n', 'const name = prompt();\n'),
    solution: code(
      `
      name = input()
      print(f"Hello, {name}!")
      `,
      `
      const name = prompt();
      console.log(\`Hello, \${name}!\`);
      `,
    ),
    tests: [
      { name: 'greets Ada', input: 'Ada', expectedOutput: 'Hello, Ada!' },
      { name: 'greets Grace', input: 'Grace', expectedOutput: 'Hello, Grace!', hidden: true },
    ],
    requirements: {
      python: [{ pattern: 'f"|f\'', message: 'Build the greeting with an f-string.' }],
      javascript: [{ pattern: '`', message: 'Build the greeting with a template literal (backticks).' }],
    },
    takeaway: lang('`input()` always gives you **text**, even if the user types a number.', 'In CodeGames, `prompt()` reads the next line of input, like `input()` in Python. (In a real web page it pops up a box.) It always gives you **text**, even if the user types a number.'),
  },
  {
    id: 'input-2',
    conceptId: 'input',
    title: 'Double It',
    role: 'combine',
    game: 'build-it',
    mode: 'guided',
    prompt: 'Read a whole number and print **double** its value. Remember: input arrives as text!',
    reinforces: ['type-conversion', 'operators'],
    hints: ['Input always arrives as text. Convert it to a number before doing math.', lang('`n = int(input())` then print `n * 2`.', '`const n = Number(prompt());` then log `n * 2`.')],
    starterCode: same(''),
    solution: code(
      `
      n = int(input())
      print(n * 2)
      `,
      `
      const n = Number(prompt());
      console.log(n * 2);
      `,
    ),
    tests: [
      { name: '4 → 8', input: '4', expectedOutput: '8' },
      { name: '21 → 42', input: '21', expectedOutput: '42' },
      { name: 'negative', input: '-3', expectedOutput: '-6', hidden: true },
    ],
  },
  {
    id: 'input-3',
    conceptId: 'input',
    title: 'Rectangle Calculator',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: 'Read a rectangle\'s **width**, then its **height** (two lines of input). Print:\n\n```\nArea: 12\nPerimeter: 14\n```\n\n(for width 3, height 4). Area = width × height. Perimeter = 2 × (width + height).',
    reinforces: ['type-conversion', 'operators', 'string-formatting', 'output'],
    hints: [`Call ${INPUT} twice, once for each number.`, 'Use parentheses so the addition happens before multiplying by 2.'],
    starterCode: same(''),
    solution: code(
      `
      width = int(input())
      height = int(input())
      print(f"Area: {width * height}")
      print(f"Perimeter: {2 * (width + height)}")
      `,
      `
      const width = Number(prompt());
      const height = Number(prompt());
      console.log(\`Area: \${width * height}\`);
      console.log(\`Perimeter: \${2 * (width + height)}\`);
      `,
    ),
    tests: [
      { name: '3 by 4', input: '3\n4', expectedOutput: 'Area: 12\nPerimeter: 14' },
      { name: '10 by 2', input: '10\n2', expectedOutput: 'Area: 20\nPerimeter: 24', hidden: true },
    ],
    requirements: {
      python: [{ pattern: 'f"|f\'', message: 'Build the lines with f-strings.' }],
      javascript: [{ pattern: '`', message: 'Build the lines with template literals (backticks).' }],
    },
  },
];
