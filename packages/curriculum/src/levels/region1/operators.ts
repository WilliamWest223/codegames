import type { Level } from '@codegames/shared';
import { code, grid } from '../../helpers';
import { lang } from '../../localize';
import { NO_LITERAL_PRINT } from './shared';

/** operators levels, in play order. */
export const operatorsLevels: Level[] = [
  {
    id: 'operators-1',
    conceptId: 'operators',
    title: 'Calculator',
    role: 'intro',
    game: 'predict-output',
    remix: true,
    mode: 'hybrid',
    choices: { python: ["10\n4\n21\n3.5\n3\n1", "10\n4\n21\n3\n3\n1", "10\n4\n21\n3.5\n3.5\n1", "10\n4\n21\n3.5\n3\n3"], javascript: ["10\n4\n21\n3.5\n3\n1", "10\n4\n21\n3\n3\n1", "10\n4\n21\n3.5\n3.5\n1", "10\n4\n21\n3.5\n3\n3"] },
    prompt: `Meet the math operators: \`+\` \`-\` \`*\` (times) \`/\` (divide) and \`%\` (remainder). ${lang('`//` divides and rounds down.', '`Math.floor()` rounds down.')} Predict each line.`,
    reinforces: ['types', 'output'],
    hints: ['7 divided by 2 is 3 remainder 1.', '`%` gives just the remainder.'],
    code: code(
      `
      print(7 + 3)
      print(7 - 3)
      print(7 * 3)
      print(7 / 2)
      print(7 // 2)
      print(7 % 2)
      `,
      `
      console.log(7 + 3);
      console.log(7 - 3);
      console.log(7 * 3);
      console.log(7 / 2);
      console.log(Math.floor(7 / 2));
      console.log(7 % 2);
      `,
    ),
    takeaway: lang('`/` always gives a decimal (`7 / 2` is `3.5`), while `//` rounds down to a whole number. `%` is the remainder, handy for "is it even?" checks.', '`/` gives a decimal when needed (`7 / 2` is `3.5`); use `Math.floor()` to round down. `%` is the remainder, handy for "is it even?" checks.'),
  },
  {
    id: 'operators-2',
    conceptId: 'operators',
    title: 'Pizza Party',
    role: 'combine',
    game: 'build-it',
    mode: 'guided',
    prompt: `3 pizzas, 8 slices each, 5 friends. Print three lines:\n1. the total number of slices\n2. how many whole slices each friend gets\n3. how many slices are left over\n\nUse the variables, so the program would still work for a different party.`,
    reinforces: ['variables', 'types'],
    hints: ['Total = pizzas × slices per pizza.', lang('Use `//` for whole slices and `%` for leftovers.', 'Use `Math.floor(total / friends)` for whole slices and `%` for leftovers.')],
    starterCode: code(
      `
      pizzas = 3
      slices_per_pizza = 8
      friends = 5
      `,
      `
      const pizzas = 3;
      const slicesPerPizza = 8;
      const friends = 5;
      `,
    ),
    solution: code(
      `
      pizzas = 3
      slices_per_pizza = 8
      friends = 5
      total = pizzas * slices_per_pizza
      print(total)
      print(total // friends)
      print(total % friends)
      `,
      `
      const pizzas = 3;
      const slicesPerPizza = 8;
      const friends = 5;
      const total = pizzas * slicesPerPizza;
      console.log(total);
      console.log(Math.floor(total / friends));
      console.log(total % friends);
      `,
    ),
    tests: [{ name: 'party math', expectedOutput: '24\n4\n4' }],
    parallelExample: {
      prompt: '**Cookie jar:** 2 boxes of 12 cookies shared by 7 kids. Same three steps: multiply for the total, then whole shares, then leftovers.',
      code: code(
        `
        boxes = 2
        cookies_per_box = 12
        kids = 7
        total = boxes * cookies_per_box
        print(total)
        print(total // kids)
        print(total % kids)
        `,
        `
        const boxes = 2;
        const cookiesPerBox = 12;
        const kids = 7;
        const total = boxes * cookiesPerBox;
        console.log(total);
        console.log(Math.floor(total / kids));
        console.log(total % kids);
        `,
      ),
    },
    requirements: {
      python: [...NO_LITERAL_PRINT.python, { pattern: '%', message: 'Use % to find the leftovers.' }],
      javascript: [...NO_LITERAL_PRINT.javascript, { pattern: '%', message: 'Use % to find the leftovers.' }],
    },
    variants: [
      {
        name: 'a party with 4 pizzas',
        replace: { python: [['pizzas = 3', 'pizzas = 4']], javascript: [['const pizzas = 3;', 'const pizzas = 4;']] },
        expectedOutput: '32\n6\n2',
      },
    ],
  },
  {
    id: 'operators-4',
    conceptId: 'operators',
    title: 'Who Goes First?',
    role: 'combine',
    game: 'predict-output',
    remix: true,
    mode: 'hybrid',
    prompt: 'Like in math class, `*` and `/` happen **before** `+` and `-`, and brackets go first of all. Operators of the same rank go left to right. Predict each line.',
    reinforces: ['variables', 'types'],
    hints: ['In `2 + 3 * 4`, do the `*` first.', '`10 - 4 - 3` goes left to right: (10 - 4) - 3.'],
    code: code(
      `
      print(2 + 3 * 4)
      print((2 + 3) * 4)
      print(10 - 4 - 3)
      print(7 // 2 * 2)
      `,
      `
      console.log(2 + 3 * 4);
      console.log((2 + 3) * 4);
      console.log(10 - 4 - 3);
      console.log(Math.floor(7 / 2) * 2);
      `,
    ),
    takeaway: 'When in doubt, add brackets. They make the order obvious to the computer **and** to people reading your code.',
    investigate: [
      {
        question: 'Why do the first two lines print different numbers?',
        choices: ['`*` happens before `+`, and brackets go first of all', 'The computer works from right to left', '`+` happens before `*`'],
        answer: 0,
      },
      {
        question: 'Why is `10 - 4 - 3` equal to 3?',
        choices: ['Operators of the same rank go left to right: (10 - 4) - 3', 'It works out 10 - (4 - 3)', 'Two minus signs cancel out'],
        answer: 0,
      },
    ],
    modify: {
      prompt: 'Now **modify** it: add one pair of brackets to the **first** line so it prints `20` (leave the other lines alone).',
      requirements: {
        python: [{ pattern: '(\\(2\\s*\\+\\s*3\\)\\s*\\*\\s*4[\\s\\S]*){2}', message: 'Add brackets around 2 + 3 on the first line (keep the numbers).' }],
        javascript: [{ pattern: '(\\(2\\s*\\+\\s*3\\)\\s*\\*\\s*4[\\s\\S]*){2}', message: 'Add brackets around 2 + 3 on the first line (keep the numbers).' }],
      },
      expectedOutput: '20\n20\n3\n6',
      solution: code(
        `
        print((2 + 3) * 4)
        print((2 + 3) * 4)
        print(10 - 4 - 3)
        print(7 // 2 * 2)
        `,
        `
        console.log((2 + 3) * 4);
        console.log((2 + 3) * 4);
        console.log(10 - 4 - 3);
        console.log(Math.floor(7 / 2) * 2);
        `,
      ),
    },
  },
  {
    id: 'operators-5',
    conceptId: 'operators',
    title: 'Robot Math',
    role: 'combine',
    game: 'grid-quest',
    mode: 'guided',
    prompt: 'The gem is `blocks` blocks away, and each block is `size` tiles long. Calculate `steps` with an operator, loop that many times, then collect. Don\'t type the answer as a number: let the program work it out.',
    reinforces: ['variables', 'repeat'],
    hints: ['steps = blocks × size.', lang('`steps = blocks * size`, then `for i in range(steps):`', '`const steps = blocks * size;`, then `for (let i = 0; i < steps; i++)`')],
    grid: grid(`
      #########
      #>.....G#
      #########
    `),
    starterCode: code(
      `
      blocks = 3
      size = 2
      `,
      `
      const blocks = 3;
      const size = 2;
      `,
    ),
    solution: code(
      `
      blocks = 3
      size = 2
      steps = blocks * size
      for i in range(steps):
          move()
      collect()
      `,
      `
      const blocks = 3;
      const size = 2;
      const steps = blocks * size;
      for (let i = 0; i < steps; i++) {
        move();
      }
      collect();
      `,
    ),
    requirements: {
      python: [
        { pattern: 'blocks\\s*\\*\\s*size|size\\s*\\*\\s*blocks', message: 'Calculate the steps with blocks * size.' },
        { pattern: '(move\\(\\)[\\s\\S]*){2}', forbid: true, message: 'Use a loop: write move() only once.' },
      ],
      javascript: [
        { pattern: 'blocks\\s*\\*\\s*size|size\\s*\\*\\s*blocks', message: 'Calculate the steps with blocks * size.' },
        { pattern: '(move\\(\\)[\\s\\S]*){2}', forbid: true, message: 'Use a loop: write move() only once.' },
      ],
    },
  },
  {
    id: 'operators-3',
    conceptId: 'operators',
    title: 'Level Up',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: 'Your hero starts with `xp = 0` and completes **3 quests worth 25 XP each**. Use `+=` (add to a variable) once per quest, then print the XP. Every 30 XP is one level, and heroes start at level 1, so finally print the level.\n\n```\n75\n3\n```',
    reinforces: ['variables', 'types', 'output'],
    hints: ['`xp += 25` is short for `xp = xp + 25`.', lang('Level = `xp // 30 + 1`.', 'Level = `Math.floor(xp / 30) + 1`.')],
    starterCode: code('xp = 0\n', 'let xp = 0;\n'),
    solution: code(
      `
      xp = 0
      xp += 25
      xp += 25
      xp += 25
      print(xp)
      print(xp // 30 + 1)
      `,
      `
      let xp = 0;
      xp += 25;
      xp += 25;
      xp += 25;
      console.log(xp);
      console.log(Math.floor(xp / 30) + 1);
      `,
    ),
    tests: [{ name: 'levels up', expectedOutput: '75\n3' }],
    requirements: {
      python: [
        ...NO_LITERAL_PRINT.python,
        { pattern: '(\\+=\\s*25[\\s\\S]*){3}|(for|while)[\\s\\S]*\\+=\\s*25', message: 'Use xp += 25 for each of the 3 quests (three lines, or a loop).' },
        { pattern: '75', forbid: true, message: 'Let the program add up the XP instead of typing 75.' },
      ],
      javascript: [
        ...NO_LITERAL_PRINT.javascript,
        { pattern: '(\\+=\\s*25[\\s\\S]*){3}|(for|while)[\\s\\S]*\\+=\\s*25', message: 'Use xp += 25 for each of the 3 quests (three lines, or a loop).' },
        { pattern: '75', forbid: true, message: 'Let the program add up the XP instead of typing 75.' },
      ],
    },
    variants: [
      {
        name: 'starting with 10 XP',
        replace: { python: [['xp = 0', 'xp = 10']], javascript: [['let xp = 0;', 'let xp = 10;']] },
        expectedOutput: '85\n3',
      },
      {
        name: 'starting with 40 XP',
        replace: { python: [['xp = 0', 'xp = 40']], javascript: [['let xp = 0;', 'let xp = 40;']] },
        expectedOutput: '115\n4',
      },
    ],
  },
];
