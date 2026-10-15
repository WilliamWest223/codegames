import type { Level } from '@codegames/shared';
import { code } from '../../helpers';
import { lang } from '../../localize';
import { NO_LITERAL_PRINT } from './shared';

/** strings-basics levels, in play order. */
export const stringsBasicsLevels: Level[] = [
  {
    id: 'strings-basics-1',
    conceptId: 'strings-basics',
    title: 'String Toolkit',
    role: 'intro',
    game: 'predict-output',
    mode: 'hybrid',
    choices: { python: ["5\nr\nt\nROBOT", "5\nr\no\nROBOT", "4\nr\nt\nROBOT", "5\nr\nt\nRobot"], javascript: ["5\nr\nt\nROBOT", "5\nr\no\nROBOT", "4\nr\nt\nROBOT", "5\nr\nt\nRobot"] },
    prompt: `Strings come with tools: length, single letters by position, and upper case. **Positions start at 0**, not 1!`,
    reinforces: ['variables'],
    hints: ['"robot" has 5 letters.', 'Position 0 is the first letter.'],
    code: code(
      `
      word = "robot"
      print(len(word))
      print(word[0])
      print(word[4])
      print(word.upper())
      `,
      `
      const word = "robot";
      console.log(word.length);
      console.log(word[0]);
      console.log(word[4]);
      console.log(word.toUpperCase());
      `,
    ),
    takeaway: 'Positions (indexes) start at **0**, so the last letter of a 5-letter word is at position 4.',
  },
  {
    id: 'strings-basics-2',
    conceptId: 'strings-basics',
    title: 'Initials',
    role: 'combine',
    game: 'build-it',
    mode: 'guided',
    prompt: 'Print the initials of `first` and `last` with dots, like `A.L.`. Build it from the variables using indexing and `+`.',
    reinforces: ['variables', 'operators'],
    hints: ['The first letter is at position 0.', 'Glue strings with `+`: letter + "." + letter + "."'],
    starterCode: code(
      `
      first = "Ada"
      last = "Lovelace"
      `,
      `
      const first = "Ada";
      const last = "Lovelace";
      `,
    ),
    solution: code(
      `
      first = "Ada"
      last = "Lovelace"
      print(first[0] + "." + last[0] + ".")
      `,
      `
      const first = "Ada";
      const last = "Lovelace";
      console.log(first[0] + "." + last[0] + ".");
      `,
    ),
    tests: [{ name: 'prints initials', expectedOutput: 'A.L.' }],
    parallelExample: {
      prompt: '**Place code:** the first letters of `city` and `country`, joined by a dash. Index 0 is the first letter, and `+` glues the pieces together.',
      code: code(
        `
        city = "Paris"
        country = "France"
        print(city[0] + "-" + country[0])
        `,
        `
        const city = "Paris";
        const country = "France";
        console.log(city[0] + "-" + country[0]);
        `,
      ),
    },
    requirements: {
      python: [
        { pattern: 'first\\[0\\]', message: 'Take the first letter from first with first[0].' },
        { pattern: 'last\\[0\\]', message: 'Take the first letter from last with last[0].' },
        { pattern: '"A"|\'A\'|"L"|\'L\'', forbid: true, message: 'Get the letters from the variables, not by typing them.' },
      ],
      javascript: [
        { pattern: 'first\\[0\\]', message: 'Take the first letter from first with first[0].' },
        { pattern: 'last\\[0\\]', message: 'Take the first letter from last with last[0].' },
        { pattern: '"A"|\'A\'|"L"|\'L\'', forbid: true, message: 'Get the letters from the variables, not by typing them.' },
      ],
    },
  },
  {
    id: 'strings-basics-3',
    conceptId: 'strings-basics',
    title: 'Shout It',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: `Turn \`phrase\` into a shout: upper case followed by three exclamation marks. Then print how many characters the original phrase has.\n\n\`\`\`\nLEVEL UP!!!\n8\n\`\`\`\n\n${lang('Tip: `"!" * 3` makes `"!!!"`.', 'Tip: `"!".repeat(3)` makes `"!!!"`.')}`,
    reinforces: ['variables', 'operators', 'output'],
    hints: [lang('`phrase.upper()` makes upper case.', '`phrase.toUpperCase()` makes upper case.'), lang('`len(phrase)` counts characters (spaces count too).', '`phrase.length` counts characters (spaces count too).')],
    starterCode: code('phrase = "level up"\n', 'const phrase = "level up";\n'),
    solution: code(
      `
      phrase = "level up"
      print(phrase.upper() + "!" * 3)
      print(len(phrase))
      `,
      `
      const phrase = "level up";
      console.log(phrase.toUpperCase() + "!".repeat(3));
      console.log(phrase.length);
      `,
    ),
    tests: [{ name: 'shouts', expectedOutput: 'LEVEL UP!!!\n8' }],
    requirements: {
      python: [
        { pattern: 'LEVEL', forbid: true, message: 'Make the upper case with .upper(), not by typing it.' },
        { pattern: 'len\\(', message: 'Count the characters with len().' },
        ...NO_LITERAL_PRINT.python,
      ],
      javascript: [
        { pattern: 'LEVEL', forbid: true, message: 'Make the upper case with .toUpperCase(), not by typing it.' },
        { pattern: '\\.length', message: 'Count the characters with .length.' },
        ...NO_LITERAL_PRINT.javascript,
      ],
    },
  },
];
