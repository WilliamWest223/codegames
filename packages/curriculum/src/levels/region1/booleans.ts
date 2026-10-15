import type { Level } from '@codegames/shared';
import { code } from '../../helpers';
import { lang } from '../../localize';

/** booleans levels, in play order. */
export const booleansLevels: Level[] = [
  {
    id: 'booleans-1',
    conceptId: 'booleans',
    title: 'True or False?',
    role: 'intro',
    game: 'predict-output',
    remix: true,
    mode: 'hybrid',
    choices: { python: ["True\nFalse\nTrue\nTrue", "True\nFalse\nFalse\nTrue", "True\nFalse\nTrue\nFalse", "yes\nno\nyes\nyes"], javascript: ["true\nfalse\ntrue\ntrue", "true\nfalse\nfalse\ntrue", "True\nFalse\nTrue\nTrue", "yes\nno\nyes\nyes"] },
    prompt: `Comparisons answer yes/no questions with a **boolean**: ${lang('`True` or `False`', '`true` or `false`')}. ${lang('`==` asks "equal?", `!=` asks "not equal?".', '`===` asks "equal?", `!==` asks "not equal?".')}`,
    reinforces: ['operators'],
    hints: ['`>=` means "greater than or equal to".', lang('A single `=` stores a value; `==` compares.', 'A single `=` stores a value; `===` compares.')],
    code: code(
      `
      print(5 > 3)
      print(2 == 3)
      print(10 >= 10)
      print("cat" != "dog")
      `,
      `
      console.log(5 > 3);
      console.log(2 === 3);
      console.log(10 >= 10);
      console.log("cat" !== "dog");
      `,
    ),
    takeaway: lang('`=` stores, `==` compares. Mixing them up is one of the most common beginner bugs.', '`=` stores, `===` compares. Always use `===` and `!==`: the shorter `==` converts types first and gives surprising results.'),
  },
  {
    id: 'booleans-2',
    conceptId: 'booleans',
    title: 'Logic Gates',
    role: 'combine',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: `Combine booleans with ${lang('`and`, `or`, `not`', '`&&` (and), `||` (or), `!` (not)')}. "And" needs both true; "or" needs at least one.`,
    reinforces: ['variables', 'operators'],
    hints: ['Work out each line separately.', '"not" flips true to false and false to true.'],
    code: code(
      `
      has_key = True
      door_locked = True
      is_night = False
      print(has_key and door_locked)
      print(is_night or door_locked)
      print(not has_key)
      print(has_key and not is_night)
      `,
      `
      const hasKey = true;
      const doorLocked = true;
      const isNight = false;
      console.log(hasKey && doorLocked);
      console.log(isNight || doorLocked);
      console.log(!hasKey);
      console.log(hasKey && !isNight);
      `,
    ),
  },
  {
    id: 'booleans-3',
    conceptId: 'booleans',
    title: 'Can You Ride?',
    role: 'integrate',
    game: 'build-it',
    mode: 'fill-blanks',
    prompt: 'A roller coaster needs riders to be **at least 120 cm tall and at least 10 years old**. Read a rider\'s height and then age, and print whether they can ride. The tests check riders right on the limits, so think carefully about "at least".',
    reinforces: ['input', 'type-conversion', 'operators', 'output'],
    hints: ['"At least 120" includes 120 itself. Which comparison operator includes the number?', lang('Join the two checks with `and`.', 'Join the two checks with `&&`.'), lang('`can_ride = height >= 120 and age >= 10`', '`const canRide = height >= 120 && age >= 10;`')],
    starterCode: code(
      `
      height = int(input())
      age = int(input())
      can_ride = ___
      print(can_ride)
      `,
      `
      const height = Number(prompt());
      const age = Number(prompt());
      const canRide = ___;
      console.log(canRide);
      `,
    ),
    solution: code(
      `
      height = int(input())
      age = int(input())
      can_ride = height >= 120 and age >= 10
      print(can_ride)
      `,
      `
      const height = Number(prompt());
      const age = Number(prompt());
      const canRide = height >= 120 && age >= 10;
      console.log(canRide);
      `,
    ),
    tests: [
      { name: '130 cm, 11 years', input: '130\n11', expectedOutput: { python: 'True', javascript: 'true' } },
      { name: '119 cm, 15 years', input: '119\n15', expectedOutput: { python: 'False', javascript: 'false' } },
      { name: 'exactly 120 cm, exactly 10', input: '120\n10', expectedOutput: { python: 'True', javascript: 'true' }, hidden: true },
      { name: '150 cm, 9 years', input: '150\n9', expectedOutput: { python: 'False', javascript: 'false' }, hidden: true },
    ],
    requirements: {
      python: [{ pattern: '\\band\\b', message: 'Combine both checks with and.' }],
      javascript: [{ pattern: '&&', message: 'Combine both checks with &&.' }],
    },
  },
];
