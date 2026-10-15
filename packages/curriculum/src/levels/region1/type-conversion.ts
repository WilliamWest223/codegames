import type { Level } from '@codegames/shared';
import { code } from '../../helpers';
import { lang } from '../../localize';
import { NO_LITERAL_PRINT } from './shared';

/** type-conversion levels, in play order. */
export const typeConversionLevels: Level[] = [
  {
    id: 'type-conversion-1',
    conceptId: 'type-conversion',
    title: 'Shape Shifters',
    role: 'intro',
    game: 'predict-output',
    mode: 'hybrid',
    // One misconception per distractor: + on text adds; str() of a number still adds; int() rounds.
    choices: { python: ["43\n421\n5.0\n9", "421\n421\n5.0\n9", "43\n43\n5.0\n9", "43\n421\n5.0\n10"], javascript: ["43\n421\n5\n9", "421\n421\n5\n9", "43\n43\n5\n9", "43\n421\n5\n10"] },
    prompt: `You can convert values between types. ${lang('`int()` makes a whole number, `float()` a decimal, `str()` text.', '`Number()` makes a number, `String()` text, `Math.trunc()` chops off decimals.')} Predict each line.`,
    reinforces: ['types', 'operators'],
    hints: ['After converting, the normal rules for that type apply.', 'Converting a decimal to a whole number chops off the decimals (no rounding).'],
    code: code(
      `
      print(int("42") + 1)
      print(str(42) + "1")
      print(float("2.5") * 2)
      print(int(9.99))
      `,
      `
      console.log(Number("42") + 1);
      console.log(String(42) + "1");
      console.log(Number("2.5") * 2);
      console.log(Math.trunc(9.99));
      `,
    ),
    takeaway: lang('`float("2.5") * 2` prints `5.0`: Python keeps the result a float, even when it is a whole number.', 'JavaScript prints `5`, not `5.0`: all numbers share one type, so there is no separate decimal version.'),
  },
  {
    id: 'type-conversion-2',
    conceptId: 'type-conversion',
    title: 'Age Next Year',
    role: 'combine',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: `\`age\` arrived as text (that's what happens when a user types something). ${lang('Python crashes when adding 1.', 'JavaScript prints `121` instead of `13`!')} Convert it so the program prints \`13\`.`,
    reinforces: ['types', 'operators'],
    hints: ['The value in `age` is text: "12". What happens when you add 1 to text?', lang('Wrap the text in `int(...)` before adding.', 'Wrap the text in `Number(...)` before adding.')],
    starterCode: code(
      `
      age = "12"
      print(age + 1)
      `,
      `
      const age = "12";
      console.log(age + 1);
      `,
    ),
    solution: code(
      `
      age = "12"
      print(int(age) + 1)
      `,
      `
      const age = "12";
      console.log(Number(age) + 1);
      `,
    ),
    tests: [{ name: 'prints next year', expectedOutput: '13' }],
    requirements: {
      python: [{ pattern: '"12"', message: 'Keep the text "12" and convert it to a number.' }, ...NO_LITERAL_PRINT.python],
      javascript: [{ pattern: '"12"', message: 'Keep the text "12" and convert it to a number.' }, ...NO_LITERAL_PRINT.javascript],
    },
    variants: [
      { name: 'a different age', replace: { python: [['"12"', '"40"']], javascript: [['"12"', '"40"']] }, expectedOutput: '41' },
    ],
  },
  {
    id: 'type-conversion-4',
    conceptId: 'type-conversion',
    title: 'Bad Input',
    role: 'combine',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: `What happens when text doesn't look like a clean number? ${lang('Python is strict: `int("abc")` would crash with a ValueError, but it forgives spaces.', 'JavaScript never crashes on conversion: it gives the special value `NaN` ("Not a Number") instead.')} Predict each line.`,
    reinforces: ['types', 'operators'],
    hints: [lang('`int(" 12 ")` ignores the spaces around the number.', '`Number("12abc")` can\'t read the whole thing, so it gives `NaN`.'), lang('`"12abc".isdigit()` asks "is every character a digit?"', '`Number("")` (empty text) surprisingly gives 0.')],
    code: code(
      `
      print(int(" 12 ") + 1)
      print(float("3"))
      print("12abc".isdigit())
      print("123".isdigit())
      `,
      `
      console.log(Number(" 12 ") + 1);
      console.log(Number("12abc"));
      console.log(Number(""));
      console.log(Number("12abc") + 1);
      `,
    ),
    takeaway: lang('In Python, converting bad text raises a **ValueError** and stops the program. Real programs check input before converting it.', '`NaN` spreads silently: any math with `NaN` gives `NaN`. Real programs check input before trusting it.'),
  },
  {
    id: 'type-conversion-3',
    conceptId: 'type-conversion',
    title: 'Digit Sum',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: 'Add up the digits of `n = 472` (4 + 7 + 2) and print the result.\n\nTrick: convert the number to text so you can grab each digit by position, then convert each digit back to a number.',
    reinforces: ['strings-basics', 'operators', 'variables', 'output'],
    hints: [lang('`digits = str(n)` then `digits[0]` is "4".', '`const digits = String(n);` then `digits[0]` is "4".'), lang('`int(digits[0])` turns "4" into 4.', '`Number(digits[0])` turns "4" into 4.')],
    starterCode: code('n = 472\n', 'const n = 472;\n'),
    solution: code(
      `
      n = 472
      digits = str(n)
      print(int(digits[0]) + int(digits[1]) + int(digits[2]))
      `,
      `
      const n = 472;
      const digits = String(n);
      console.log(Number(digits[0]) + Number(digits[1]) + Number(digits[2]));
      `,
    ),
    tests: [{ name: 'sums the digits', expectedOutput: '13' }],
    requirements: NO_LITERAL_PRINT,
    variants: [
      { name: 'a different number', replace: { python: [['n = 472', 'n = 358']], javascript: [['const n = 472;', 'const n = 358;']] }, expectedOutput: '16' },
    ],
  },
];
