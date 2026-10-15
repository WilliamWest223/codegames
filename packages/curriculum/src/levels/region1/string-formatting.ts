import type { Level } from '@codegames/shared';
import { code } from '../../helpers';
import { lang } from '../../localize';

/** string-formatting levels, in play order. */
export const stringFormattingLevels: Level[] = [
  {
    id: 'string-formatting-1',
    conceptId: 'string-formatting',
    title: 'Fill the Template',
    role: 'intro',
    game: 'predict-output',
    mode: 'hybrid',
    choices: { python: ["Pixel is 2 years old\nNext year Pixel will be 3", "{pet} is {age} years old\nNext year {pet} will be {age + 1}", "Pixel is 2 years old\nNext year Pixel will be 2 + 1", "pet is age years old\nNext year pet will be age + 1"], javascript: ["Pixel is 2 years old\nNext year Pixel will be 3", "${pet} is ${age} years old\nNext year ${pet} will be ${age + 1}", "Pixel is 2 years old\nNext year Pixel will be 2 + 1", "pet is age years old\nNext year pet will be age + 1"] },
    prompt: `${lang('An **f-string** starts with `f` and drops values into `{curly braces}`.', 'A **template literal** uses backticks `` ` `` and drops values into `${...}`.')} It's much easier than gluing with \`+\`. Predict the output.`,
    reinforces: ['strings-basics', 'variables'],
    hints: ['Each placeholder is replaced by the value of the expression inside it.', 'The second line does math inside the placeholder: age + 1.'],
    code: code(
      `
      pet = "Pixel"
      age = 2
      print(f"{pet} is {age} years old")
      print(f"Next year {pet} will be {age + 1}")
      `,
      `
      const pet = "Pixel";
      const age = 2;
      console.log(\`\${pet} is \${age} years old\`);
      console.log(\`Next year \${pet} will be \${age + 1}\`);
      `,
    ),
    takeaway: lang('f-strings can hold any expression inside `{}`, even math like `{age + 1}`.', 'Template literals can hold any expression inside `${}`, even math like `${age + 1}`.'),
  },
  {
    id: 'string-formatting-2',
    conceptId: 'string-formatting',
    title: 'Name Badge',
    role: 'combine',
    game: 'build-it',
    mode: 'fill-blanks',
    prompt: `Use ${lang('an f-string', 'a template literal')} to print:\n\n\`\`\`\nHi, I'm Mia and I'm level 4!\n\`\`\``,
    reinforces: ['variables', 'strings-basics'],
    hints: ['Write the whole sentence inside the quotes, then put placeholders where the name and level go.', lang('`f"Hi, I\'m {name} ..."`', '`` `Hi, I\'m ${name} ...` ``')],
    starterCode: code(
      `
      name = "Mia"
      level = 4
      print(f"___")
      `,
      `
      const name = "Mia";
      const level = 4;
      console.log(\`___\`);
      `,
    ),
    solution: code(
      `
      name = "Mia"
      level = 4
      print(f"Hi, I'm {name} and I'm level {level}!")
      `,
      `
      const name = "Mia";
      const level = 4;
      console.log(\`Hi, I'm \${name} and I'm level \${level}!\`);
      `,
    ),
    tests: [{ name: 'prints the badge', expectedOutput: "Hi, I'm Mia and I'm level 4!" }],
    requirements: {
      python: [{ pattern: '\\{name\\}', message: 'Put {name} inside the f-string.' }, { pattern: '\\{level\\}', message: 'Put {level} inside the f-string.' }],
      javascript: [{ pattern: '\\$\\{name\\}', message: 'Put ${name} inside the template.' }, { pattern: '\\$\\{level\\}', message: 'Put ${level} inside the template.' }],
    },
  },
  {
    id: 'string-formatting-3',
    conceptId: 'string-formatting',
    title: 'Price Tag',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: `Print a price tag for the order, with the total **always showing 2 decimal places**:\n\n\`\`\`\n3 x Potion = $7.50\n\`\`\`\n\n${lang('Format a number with 2 decimals using `{total:.2f}` inside an f-string. The `$` before it is just a dollar sign; the placeholder starts at `{`.', 'Format a number with 2 decimals using `total.toFixed(2)`. In `$${...}` the first `$` is just a dollar sign; the placeholder starts at `${`.')}`,
    reinforces: ['operators', 'variables', 'output'],
    hints: ['First compute total = price × quantity.', lang('`f"{qty} x {item} = ${total:.2f}"`', '`` `${qty} x ${item} = $${total.toFixed(2)}` ``')],
    starterCode: code(
      `
      item = "Potion"
      price = 2.5
      qty = 3
      `,
      `
      const item = "Potion";
      const price = 2.5;
      const qty = 3;
      `,
    ),
    solution: code(
      `
      item = "Potion"
      price = 2.5
      qty = 3
      total = price * qty
      print(f"{qty} x {item} = \${total:.2f}")
      `,
      `
      const item = "Potion";
      const price = 2.5;
      const qty = 3;
      const total = price * qty;
      console.log(\`\${qty} x \${item} = $\${total.toFixed(2)}\`);
      `,
    ),
    tests: [{ name: 'prints the tag', expectedOutput: '3 x Potion = $7.50' }],
    requirements: {
      python: [{ pattern: '7\\.5', forbid: true, message: 'Calculate the total from price and qty.' }],
      javascript: [{ pattern: '7\\.5', forbid: true, message: 'Calculate the total from price and qty.' }],
    },
    variants: [
      {
        name: 'a bigger order',
        replace: { python: [['qty = 3', 'qty = 4']], javascript: [['const qty = 3;', 'const qty = 4;']] },
        expectedOutput: '4 x Potion = $10.00',
      },
    ],
  },
];
