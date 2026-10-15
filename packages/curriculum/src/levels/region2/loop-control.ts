import type { Level } from '@codegames/shared';
import { code } from '../../helpers';
import { lang } from '../../localize';
import { INPUT } from './shared';

/** loop-control levels, in play order. */
export const loopControlLevels: Level[] = [
  {
    id: 'loop-control-1',
    conceptId: 'loop-control',
    title: 'Break Out',
    role: 'intro',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: '`break` leaves a loop immediately. `continue` skips the rest of this round and jumps to the next one. Predict the output.',
    reinforces: ['loops', 'conditionals'],
    hints: ['The first loop stops completely at 4.', 'The second loop skips only 3.'],
    code: code(
      `
      for i in range(1, 10):
          if i == 4:
              break
          print(i)
      print("---")
      for i in range(1, 6):
          if i == 3:
              continue
          print(i)
      `,
      `
      for (let i = 1; i < 10; i++) {
        if (i === 4) {
          break;
        }
        console.log(i);
      }
      console.log("---");
      for (let i = 1; i < 6; i++) {
        if (i === 3) {
          continue;
        }
        console.log(i);
      }
      `,
    ),
    takeaway: '`break` leaves the loop for good; `continue` skips just the rest of this round.',
  },
  {
    id: 'loop-control-2',
    conceptId: 'loop-control',
    title: 'Add Until Zero',
    role: 'combine',
    game: 'build-it',
    mode: 'guided',
    prompt: `Read numbers one per line and add them up. When the number is \`0\`, **stop** and print the total.\n\nA common pattern: loop "forever" with ${lang('`while True:`', '`while (true)`')} and \`break\` out when you see the 0.`,
    reinforces: ['while-loops', 'input', 'type-conversion'],
    hints: [`Read with ${INPUT} inside the loop.`, 'Check for 0 before adding.'],
    starterCode: code(
      `
      # 1. SET UP: start the total at 0, before the loop
      # 2. LOOP: repeat "forever"
      #    2a. READ: get the next number
      #    2b. DECIDE: if it is 0, leave the loop
      #    2c. UPDATE: otherwise, add it to the total
      # 3. REPORT: after the loop, print the total
      `,
      `
      // 1. SET UP: start the total at 0, before the loop
      // 2. LOOP: repeat "forever"
      //    2a. READ: get the next number
      //    2b. DECIDE: if it is 0, leave the loop
      //    2c. UPDATE: otherwise, add it to the total
      // 3. REPORT: after the loop, print the total
      `,
    ),
    solution: code(
      `
      total = 0
      while True:
          n = int(input())
          if n == 0:
              break
          total += n
      print(total)
      `,
      `
      let total = 0;
      while (true) {
        const n = Number(prompt());
        if (n === 0) {
          break;
        }
        total += n;
      }
      console.log(total);
      `,
    ),
    tests: [
      { name: '5 + 3', input: '5\n3\n0', expectedOutput: '8' },
      { name: 'just zero', input: '0', expectedOutput: '0' },
      { name: 'hidden', input: '10\n-2\n7\n0', expectedOutput: '15', hidden: true },
    ],
    requirements: {
      python: [{ pattern: '\\bbreak\\b', message: 'Use break to stop at 0.' }],
      javascript: [{ pattern: '\\bbreak\\b', message: 'Use break to stop at 0.' }],
    },
  },
  {
    id: 'loop-control-3',
    conceptId: 'loop-control',
    title: 'Skip the Odds',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: 'Read `n`. Print every **even** number from 1 to n, one per line, then `Done`. Use `continue` to skip the odd ones.\n\nFor n = 7:\n\n```\n2\n4\n6\nDone\n```',
    reinforces: ['loops', 'conditionals', 'operators', 'input'],
    hints: ['An odd number has `i % 2` not equal to 0.', 'If it\'s odd, continue; otherwise print it.'],
    starterCode: code(
      `
      # SET UP
      # LOOP
      #   DECIDE
      #   REPORT
      # REPORT (after the loop)
      `,
      `
      // SET UP
      // LOOP
      //   DECIDE
      //   REPORT
      // REPORT (after the loop)
      `,
    ),
    solution: code(
      `
      n = int(input())
      for i in range(1, n + 1):
          if i % 2 != 0:
              continue
          print(i)
      print("Done")
      `,
      `
      const n = Number(prompt());
      for (let i = 1; i <= n; i++) {
        if (i % 2 !== 0) {
          continue;
        }
        console.log(i);
      }
      console.log("Done");
      `,
    ),
    tests: [
      { name: 'n = 7', input: '7', expectedOutput: '2\n4\n6\nDone' },
      { name: 'n = 1', input: '1', expectedOutput: 'Done' },
      { name: 'n = 10', input: '10', expectedOutput: '2\n4\n6\n8\n10\nDone', hidden: true },
    ],
    requirements: {
      python: [{ pattern: '\\bcontinue\\b', message: 'Use continue to skip odd numbers.' }],
      javascript: [{ pattern: '\\bcontinue\\b', message: 'Use continue to skip odd numbers.' }],
    },
  },
];
