import type { Level } from '@codegames/shared';
import { code } from '../../helpers';
import { lang } from '../../localize';
import { NO_LITERAL_PRINT } from './shared';

/** types levels, in play order. */
export const typesLevels: Level[] = [
  {
    id: 'types-1',
    conceptId: 'types',
    title: 'What Type Is It?',
    role: 'intro',
    game: 'predict-output',
    mode: 'hybrid',
    choices: { python: ["int\nfloat\nstr\nbool", "int\nint\nstr\nbool", "int\nfloat\nint\nbool", "number\nnumber\nstring\nboolean"], javascript: ["number\nnumber\nstring\nboolean", "int\nfloat\nstring\nboolean", "number\nnumber\nnumber\nboolean", "number\nfloat\nstring\nboolean"] },
    prompt: `Every value has a **type**. ${lang('Four everyday Python types are `int` (whole numbers), `float` (decimals), `str` (text) and `bool` (True/False). `type(x).__name__` gives a type\'s short name.', 'Three everyday JavaScript types are `number` (all numbers), `string` (text) and `boolean` (true/false). `typeof x` gives a type\'s name.')} Predict what this prints.`,
    reinforces: ['output'],
    hints: ['Quotes make something text, even if it looks like a number.', lang('`7` is a whole number (int); `7.5` has a decimal point (float).', 'JavaScript uses one type, `number`, for both 7 and 7.5.')],
    code: code(
      `
      print(type(7).__name__)
      print(type(7.5).__name__)
      print(type("7").__name__)
      print(type(True).__name__)
      `,
      `
      console.log(typeof 7);
      console.log(typeof 7.5);
      console.log(typeof "7");
      console.log(typeof true);
      `,
    ),
    takeaway: lang('Python keeps whole numbers (`int`) and decimals (`float`) as separate types. `"7"` in quotes is text (`str`), not a number.', 'JavaScript has a single `number` type for whole numbers and decimals. `"7"` in quotes is text (a `string`), not a number.'),
  },
  {
    id: 'types-2',
    conceptId: 'types',
    title: 'Text vs Number',
    role: 'combine',
    game: 'predict-output',
    remix: true,
    mode: 'hybrid',
    prompt: 'The `+` sign does different things for different types. Predict the output.',
    reinforces: ['variables', 'output'],
    hints: ['Adding two strings glues them together.', 'Adding two numbers does math.'],
    code: code(
      `
      a = "5"
      b = "5"
      c = 5
      d = 5
      print(a + b)
      print(c + d)
      `,
      `
      const a = "5";
      const b = "5";
      const c = 5;
      const d = 5;
      console.log(a + b);
      console.log(c + d);
      `,
    ),
    takeaway: 'Joining strings with `+` is called **concatenation**.',
    investigate: [
      {
        question: 'Why do the two lines print different things?',
        choices: ['`a` and `b` hold text (in quotes), so `+` joins them; `c` and `d` are numbers, so `+` adds', 'The first line has a typo', '`+` always joins, and the second line is just a coincidence'],
        answer: 0,
      },
      {
        question: 'Which change makes the first line do math instead?',
        choices: [
          lang('`print(int(a) + int(b))`', '`console.log(Number(a) + Number(b));`'),
          lang('`print("a" + "b")`', '`console.log("a" + "b");`'),
          lang('`print(a + b + 0)`', '`console.log(a + b + 0);`'),
        ],
        answer: 0,
      },
    ],
  },
  {
    id: 'types-4',
    conceptId: 'types',
    title: 'Sneaky Text Math',
    role: 'combine',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: `What happens when you do math with **text**? ${lang('Python is strict about mixing types, but some operators still work on strings.', 'JavaScript tries very hard to make things work, sometimes too hard.')} Predict each line carefully.`,
    reinforces: ['variables', 'output'],
    hints: [lang('`*` with a string and a number repeats the string.', '`*` only means multiply, so JavaScript turns the text "3" into the number 3.'), '`+` with two strings always glues them together.'],
    code: code(
      `
      a = "3"
      print(a * 2)
      print(a + "2")
      print(3 * 2)
      `,
      `
      const a = "3";
      console.log(a * 2);
      console.log(a + "2");
      console.log(3 * 2);
      `,
    ),
    takeaway: lang('In Python, `"3" * 2` is `"33"`: the text repeated. Text that looks like a number is still text.', 'In JavaScript, `"3" * 2` is `6` but `"3" + "2"` is `"32"`. This silent guessing is called **type coercion**, and it causes many bugs, so convert input with `Number()` yourself.'),
  },
  {
    id: 'types-3',
    conceptId: 'types',
    title: 'Fix the Total',
    role: 'integrate',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: `The bill should be \`25\`, but something's wrong. ${lang('Python refuses to add text to a number and crashes.', 'JavaScript happily glues text and numbers together and prints the wrong answer!')} Fix the **type** of \`price\` so the program prints \`25\`.`,
    reinforces: ['variables', 'output', 'first-errors'],
    hints: ['Look at how `price` is created. Is it a number or text?', 'Remove the quotes around 20.'],
    starterCode: code(
      `
      price = "20"
      tip = 5
      print(price + tip)
      `,
      `
      const price = "20";
      const tip = 5;
      console.log(price + tip);
      `,
    ),
    solution: code(
      `
      price = 20
      tip = 5
      print(price + tip)
      `,
      `
      const price = 20;
      const tip = 5;
      console.log(price + tip);
      `,
    ),
    tests: [{ name: 'adds correctly', expectedOutput: '25' }],
    requirements: NO_LITERAL_PRINT,
  },
];
