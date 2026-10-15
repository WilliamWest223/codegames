import type { Level } from '@codegames/shared';
import { code, same } from '../../helpers';
import { lang } from '../../localize';
import { NEEDS_FOR } from './shared';

/** loops levels, in play order. */
export const loopsLevels: Level[] = [
  {
    id: 'loops-1',
    conceptId: 'loops',
    title: 'Count Along',
    role: 'intro',
    game: 'predict-output',
    remix: true,
    mode: 'hybrid',
    choices: { python: ["2\n4\n6\n8\n10", "2\n4\n6\n8\n10\n12", "0\n2\n4\n6\n8", "1\n2\n3\n4\n5"], javascript: ["2\n4\n6\n8\n10", "2\n4\n6\n8\n10\n12", "0\n2\n4\n6\n8", "1\n2\n3\n4\n5"] },
    prompt: `A **for** loop gives you a counter. ${lang('`range(1, 6)` counts 1, 2, 3, 4, 5 (it stops *before* 6).', '`for (let i = 1; i < 6; i++)` counts 1, 2, 3, 4, 5: start at 1, keep going while i < 6, add 1 each time.')} Predict the output.`,
    reinforces: ['repeat', 'operators'],
    hints: ['Write down i for each round, then what gets printed.', lang('The rounds are i = 1, 2, 3, 4, 5. Each round prints i × 2.', 'The rounds are i = 1, 2, 3, 4, 5. Each round prints i × 2.')],
    code: code(
      `
      for i in range(1, 6):
          print(i * 2)
      `,
      `
      for (let i = 1; i < 6; i++) {
        console.log(i * 2);
      }
      `,
    ),
    takeaway: lang('`range(start, stop)` counts from start up to, but **not including**, stop.', 'A for loop has three parts: start (`let i = 1`), keep-going condition (`i < 6`), and step (`i++`).'),
    modify: {
      prompt: 'Now **modify** it: change **one number** so it prints the 3 times table instead: 3, 6, 9, 12, 15.',
      requirements: {
        python: [{ pattern: 'for\\s+i\\s+in\\s+range', message: 'Keep the loop: change one number inside it.' }, { pattern: 'print\\(\\s*\\d', forbid: true, message: 'Keep printing a calculation, not typed-in numbers.' }],
        javascript: [{ pattern: 'for\\s*\\(', message: 'Keep the loop: change one number inside it.' }, { pattern: 'console\\.log\\(\\s*\\d', forbid: true, message: 'Keep logging a calculation, not typed-in numbers.' }],
      },
      expectedOutput: '3\n6\n9\n12\n15',
      solution: code(
        `
        for i in range(1, 6):
            print(i * 3)
        `,
        `
        for (let i = 1; i < 6; i++) {
          console.log(i * 3);
        }
        `,
      ),
    },
  },
  {
    id: 'loops-4',
    conceptId: 'loops',
    title: 'Inside or Outside?',
    role: 'combine',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: `Which lines are **inside** the loop? ${lang('In Python, a line is inside the loop if it\'s indented under it. Indentation is not decoration: it changes what the program does.', 'In JavaScript, a line is inside the loop if it\'s between the loop\'s `{` and `}`. Indentation is just for humans, so read the braces carefully.')} Predict the output.`,
    reinforces: ['repeat', 'output'],
    hints: ['Find where each loop\'s body ends.', 'Lines inside run once per round; lines after the loop run once.'],
    code: code(
      `
      for i in range(2):
          print("A")
          print("B")
      for i in range(2):
          print("C")
      print("D")
      `,
      `
      for (let i = 0; i < 2; i++) {
        console.log("A");
        console.log("B");
      }
      for (let i = 0; i < 2; i++) {
        console.log("C");
      }
      console.log("D");
      `,
    ),
    investigate: [
      {
        question: 'Why does `B` print twice?',
        choices: [
          lang('It is indented under the first `for`, so it repeats with `A`', 'It is inside the first loop\'s `{ }`, so it repeats with `A`'),
          'Every print in a program runs twice',
          'The second loop prints it',
        ],
        answer: 0,
      },
      {
        question: 'Why does `D` print only once?',
        choices: [
          lang('It isn\'t indented, so it runs once, after both loops', 'It is outside both loops\' braces, so it runs once, after them'),
          'The loops ran out of turns before it',
          'A program only prints its last line once',
        ],
        answer: 0,
      },
    ],
  },
  {
    id: 'loops-7',
    conceptId: 'loops',
    title: 'Indent Repair',
    role: 'combine',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: `This should print only the **final** total of 1 + 2 + … + n. Instead it prints a total every round. The bug is about ${lang('**indentation**', '**where the `}` is**')}: which lines are inside the loop?`,
    reinforces: ['input', 'operators'],
    hints: ['Run it: how many lines does it print for n = 3?', 'The print happens inside the loop, so it runs every round.', lang('Un-indent the `print(total)` line so it lines up with `for`.', 'Move the `console.log(total);` line below the closing `}`.')],
    starterCode: code(
      `
      n = int(input())
      total = 0
      for i in range(1, n + 1):
          total += i
          print(total)
      `,
      `
      const n = Number(prompt());
      let total = 0;
      for (let i = 1; i <= n; i++) {
        total += i;
        console.log(total);
      }
      `,
    ),
    solution: code(
      `
      n = int(input())
      total = 0
      for i in range(1, n + 1):
          total += i
      print(total)
      `,
      `
      const n = Number(prompt());
      let total = 0;
      for (let i = 1; i <= n; i++) {
        total += i;
      }
      console.log(total);
      `,
    ),
    tests: [
      { name: 'n = 3', input: '3', expectedOutput: '6' },
      { name: 'n = 5', input: '5', expectedOutput: '15', hidden: true },
    ],
    takeaway: lang('In Python, one level of indentation is the difference between "every round" and "once at the end".', 'In JavaScript, the braces decide what repeats. Indent to match the braces so the code shows what it really does.'),
  },
  {
    id: 'loops-2',
    conceptId: 'loops',
    title: 'Times Table',
    role: 'combine',
    game: 'build-it',
    mode: 'guided',
    prompt: 'Read a number `n` and print its times table from 1 to 5:\n\n```\n3 x 1 = 3\n3 x 2 = 6\n3 x 3 = 9\n3 x 4 = 12\n3 x 5 = 15\n```',
    reinforces: ['input', 'type-conversion', 'string-formatting'],
    hints: [lang('`for i in range(1, 6):`', '`for (let i = 1; i <= 5; i++)`'), lang('`print(f"{n} x {i} = {n * i}")`', '`` console.log(`${n} x ${i} = ${n * i}`); ``')],
    starterCode: code(
      `
      n = int(input())
      # 1. LOOP: visit every number i from 1 to 5 (include 5!)
      # 2. REPORT: inside the loop, print one line of the table built from n and i
      `,
      `
      const n = Number(prompt());
      // 1. LOOP: visit every number i from 1 to 5 (include 5!)
      // 2. REPORT: inside the loop, print one line of the table built from n and i
      `,
    ),
    solution: code(
      `
      n = int(input())
      for i in range(1, 6):
          print(f"{n} x {i} = {n * i}")
      `,
      `
      const n = Number(prompt());
      for (let i = 1; i <= 5; i++) {
        console.log(\`\${n} x \${i} = \${n * i}\`);
      }
      `,
    ),
    tests: [
      { name: '3', input: '3', expectedOutput: '3 x 1 = 3\n3 x 2 = 6\n3 x 3 = 9\n3 x 4 = 12\n3 x 5 = 15' },
      { name: '7', input: '7', expectedOutput: '7 x 1 = 7\n7 x 2 = 14\n7 x 3 = 21\n7 x 4 = 28\n7 x 5 = 35', hidden: true },
    ],
    requirements: NEEDS_FOR,
    parallelExample: {
      prompt: '**Doubles:** print 1 to 5, each doubled. The loop variable counts 1 to 5, and each line is built from it.',
      code: code(
        `
        for i in range(1, 6):
            print(f"{i} doubled is {i * 2}")
        `,
        `
        for (let i = 1; i <= 5; i++) {
          console.log(\`\${i} doubled is \${i * 2}\`);
        }
        `,
      ),
    },
  },
  {
    id: 'loops-3',
    conceptId: 'loops',
    title: 'Sum and Evens',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: 'Read `n`. Loop over every number from 1 to n to work out:\n- the **sum** of all of them\n- how many of them are **even**\n\nFor n = 5:\n\n```\nSum: 15\nEvens: 2\n```',
    reinforces: ['input', 'conditionals', 'operators', 'string-formatting'],
    hints: [lang('To include n itself, stop one past it: `range(1, n + 1)`.', 'To include n itself, keep going while `i <= n`.'), 'Start total = 0 and evens = 0 before the loop.', lang('A number is even when `i % 2 == 0`.', 'A number is even when `i % 2 === 0`.')],
    starterCode: code(
      `
      n = int(input())
      # 1. SET UP: start total and evens at 0, before the loop
      # 2. LOOP: visit every number i from 1 to n (include n!)
      #    2a. UPDATE: add i to total
      #    2b. UPDATE: if i is even, count it
      # 3. REPORT: after the loop, print Sum: … and Evens: …
      `,
      `
      const n = Number(prompt());
      // 1. SET UP: start total and evens at 0, before the loop
      // 2. LOOP: visit every number i from 1 to n (include n!)
      //    2a. UPDATE: add i to total
      //    2b. UPDATE: if i is even, count it
      // 3. REPORT: after the loop, print Sum: … and Evens: …
      `,
    ),
    solution: code(
      `
      n = int(input())
      total = 0
      evens = 0
      for i in range(1, n + 1):
          total += i
          if i % 2 == 0:
              evens += 1
      print(f"Sum: {total}")
      print(f"Evens: {evens}")
      `,
      `
      const n = Number(prompt());
      let total = 0;
      let evens = 0;
      for (let i = 1; i <= n; i++) {
        total += i;
        if (i % 2 === 0) {
          evens += 1;
        }
      }
      console.log(\`Sum: \${total}\`);
      console.log(\`Evens: \${evens}\`);
      `,
    ),
    tests: [
      { name: 'n = 5', input: '5', expectedOutput: 'Sum: 15\nEvens: 2' },
      { name: 'n = 10', input: '10', expectedOutput: 'Sum: 55\nEvens: 5' },
      { name: 'n = 1', input: '1', expectedOutput: 'Sum: 1\nEvens: 0', hidden: true },
    ],
    requirements: NEEDS_FOR,
  },
  {
    id: 'loops-5',
    conceptId: 'loops',
    title: 'Missing the Last One',
    role: 'integrate',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: 'This program should add up every number from 1 to `n` (for n = 4: 1 + 2 + 3 + 4 = 10). It\'s always a little short. Find the **off-by-one** bug.',
    reinforces: ['input', 'type-conversion', 'operators', 'variables'],
    hints: ['Try n = 1 by hand. What numbers does the loop visit?', lang('`range(1, n)` stops **before** n.', '`i < n` stops **before** reaching n.'), lang('Use `range(1, n + 1)`.', 'Use `i <= n`.')],
    starterCode: code(
      `
      n = int(input())
      total = 0
      for i in range(1, n):
          total += i
      print(total)
      `,
      `
      const n = Number(prompt());
      let total = 0;
      for (let i = 1; i < n; i++) {
        total += i;
      }
      console.log(total);
      `,
    ),
    solution: code(
      `
      n = int(input())
      total = 0
      for i in range(1, n + 1):
          total += i
      print(total)
      `,
      `
      const n = Number(prompt());
      let total = 0;
      for (let i = 1; i <= n; i++) {
        total += i;
      }
      console.log(total);
      `,
    ),
    tests: [
      { name: 'n = 4', input: '4', expectedOutput: '10' },
      { name: 'n = 10', input: '10', expectedOutput: '55' },
      { name: 'n = 1', input: '1', expectedOutput: '1', hidden: true },
    ],
    requirements: {
      python: [{ pattern: 'for\\s+\\w+\\s+in\\s+', message: 'Keep the for loop; fix its range.' }, { pattern: 'print\\(\\s*\\d', forbid: true, message: 'Print the total, not a typed-in number.' }, { pattern: 'print\\(\\s*total\\s*\\+', forbid: true, message: 'Fix the loop so it includes n, instead of adding n at the end.' }],
      javascript: [{ pattern: 'for\\s*\\(', message: 'Keep the for loop; fix its condition.' }, { pattern: 'console\\.log\\(\\s*\\d', forbid: true, message: 'Log the total, not a typed-in number.' }, { pattern: 'console\\.log\\(\\s*total\\s*\\+', forbid: true, message: 'Fix the loop so it includes n, instead of adding n at the end.' }],
    },
    takeaway: '**Off-by-one** errors are so common they have a name. Always test the smallest case (like n = 1) and the edges.',
  },
  {
    id: 'loops-6',
    conceptId: 'loops',
    title: 'FizzBuzz',
    role: 'challenge',
    game: 'build-it',
    mode: 'freeform',
    prompt: 'A classic programming challenge! Read `n`. For every number from 1 to n print:\n- `FizzBuzz` if it\'s divisible by both 3 and 5\n- `Fizz` if it\'s divisible by 3\n- `Buzz` if it\'s divisible by 5\n- otherwise, the number itself\n\nFor n = 5: `1`, `2`, `Fizz`, `4`, `Buzz`. *Optional challenge: earns the Proficient badge faster.*',
    reinforces: ['input', 'else-if-chains', 'operators', 'conditionals'],
    hints: ['"Divisible by 3" means `i % 3` is 0.', 'Order matters: check "both 3 and 5" **first**.', lang('`if i % 15 == 0:` works for both.', '`if (i % 15 === 0)` works for both.')],
    starterCode: same(''),
    solution: code(
      `
      n = int(input())
      for i in range(1, n + 1):
          if i % 15 == 0:
              print("FizzBuzz")
          elif i % 3 == 0:
              print("Fizz")
          elif i % 5 == 0:
              print("Buzz")
          else:
              print(i)
      `,
      `
      const n = Number(prompt());
      for (let i = 1; i <= n; i++) {
        if (i % 15 === 0) {
          console.log("FizzBuzz");
        } else if (i % 3 === 0) {
          console.log("Fizz");
        } else if (i % 5 === 0) {
          console.log("Buzz");
        } else {
          console.log(i);
        }
      }
      `,
    ),
    tests: [
      { name: 'n = 5', input: '5', expectedOutput: '1\n2\nFizz\n4\nBuzz' },
      { name: 'n = 15', input: '15', expectedOutput: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz', hidden: true },
    ],
  },
];
