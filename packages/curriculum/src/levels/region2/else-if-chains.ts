import type { Level } from '@codegames/shared';
import { code } from '../../helpers';
import { lang } from '../../localize';

/** else-if-chains levels, in play order. */
export const elseIfChainsLevels: Level[] = [
  {
    id: 'else-if-chains-1',
    conceptId: 'else-if-chains',
    title: 'Grade Ladder',
    role: 'intro',
    game: 'predict-output',
    mode: 'hybrid',
    choices: { python: ["B\nDone", "B\nC\nDone", "B\nC\nKeep practicing\nDone", "B"], javascript: ["B\nDone", "B\nC\nDone", "B\nC\nKeep practicing\nDone", "B"] },
    prompt: `${lang('`elif`', '`else if`')} adds more choices. The computer checks each condition **top to bottom** and runs only the **first** one that's true. What gets printed?`,
    reinforces: ['conditionals', 'booleans'],
    hints: ['83 is not >= 90, so check the next condition.', 'Only one branch runs.'],
    code: code(
      `
      score = 83
      if score >= 90:
          print("A")
      elif score >= 80:
          print("B")
      elif score >= 70:
          print("C")
      else:
          print("Keep practicing")
      print("Done")
      `,
      `
      const score = 83;
      if (score >= 90) {
        console.log("A");
      } else if (score >= 80) {
        console.log("B");
      } else if (score >= 70) {
        console.log("C");
      } else {
        console.log("Keep practicing");
      }
      console.log("Done");
      `,
    ),
    takeaway: 'Only the **first** true branch runs, so order your conditions from most specific to least specific.',
    modify: {
      prompt: 'Now **modify** it: change only the score so the program prints `C` and then `Done`.',
      requirements: {
        python: [{ pattern: 'if score >= 90:[\\s\\S]*elif score >= 80:[\\s\\S]*elif score >= 70:', message: 'Keep the if/elif chain as it is; change only the score.' }],
        javascript: [{ pattern: 'if \\(score >= 90\\)[\\s\\S]*else if \\(score >= 80\\)[\\s\\S]*else if \\(score >= 70\\)', message: 'Keep the if/else chain as it is; change only the score.' }],
      },
      expectedOutput: 'C\nDone',
      solution: code(
        `
        score = 75
        if score >= 90:
            print("A")
        elif score >= 80:
            print("B")
        elif score >= 70:
            print("C")
        else:
            print("Keep practicing")
        print("Done")
        `,
        `
        const score = 75;
        if (score >= 90) {
          console.log("A");
        } else if (score >= 80) {
          console.log("B");
        } else if (score >= 70) {
          console.log("C");
        } else {
          console.log("Keep practicing");
        }
        console.log("Done");
        `,
      ),
    },
  },
  {
    id: 'else-if-chains-5',
    conceptId: 'else-if-chains',
    title: 'One Branch or Many?',
    role: 'combine',
    game: 'predict-output',
    remix: true,
    mode: 'hybrid',
    prompt: `Two programs, one difference: the first uses separate \`if\`s, the second uses ${lang('`elif`', '`else if`')}. Predict both outputs.`,
    reinforces: ['conditionals', 'booleans'],
    hints: ['Separate `if`s are each checked, no matter what happened before.', 'In a chain, once one branch runs, the rest are skipped.'],
    code: code(
      `
      score = 95
      if score >= 90:
          print("A")
      if score >= 80:
          print("B")
      if score >= 70:
          print("C")
      print("---")
      if score >= 90:
          print("A")
      elif score >= 80:
          print("B")
      elif score >= 70:
          print("C")
      `,
      `
      const score = 95;
      if (score >= 90) {
        console.log("A");
      }
      if (score >= 80) {
        console.log("B");
      }
      if (score >= 70) {
        console.log("C");
      }
      console.log("---");
      if (score >= 90) {
        console.log("A");
      } else if (score >= 80) {
        console.log("B");
      } else if (score >= 70) {
        console.log("C");
      }
      `,
    ),
    takeaway: `Use a chain (${lang('`elif`', '`else if`')}) when only **one** option should happen; use separate \`if\`s when several can.`,
    investigate: [
      {
        question: 'Why does the first part print more than one letter?',
        choices: ['Each separate `if` is checked on its own, and the score passes several of them', 'The first `if` makes the others run too', 'The program prints every letter it can find'],
        answer: 0,
      },
      {
        question: 'Why does the second part print only one letter?',
        choices: [
          lang('In an `if`/`elif` chain, once one branch runs, the rest are skipped', 'In an `if`/`else if` chain, once one branch runs, the rest are skipped'),
          'Only the first test in a program can be true',
          'The other letters were already printed',
        ],
        answer: 0,
      },
    ],
  },
  {
    id: 'else-if-chains-4',
    conceptId: 'else-if-chains',
    title: 'Ladder Puzzle',
    role: 'combine',
    game: 'parsons',
    mode: 'parsons',
    prompt: 'Arrange the lines into a program that reads a number of stars (0–3) and prints a rating: `Amazing` for 3, `Good` for 2, `Okay` for 1, and `Try again` for 0. **One line is a trap** and doesn\'t belong.',
    reinforces: ['input', 'type-conversion', 'booleans'],
    hints: ['The first line reads the input.', lang('`elif` and `else` lines must line up with the `if`.', 'Each `} else if` continues the chain started by `if`.'), lang('The trap uses `=` where a comparison is needed.', 'The trap uses `=` where a comparison is needed.')],
    solution: code(
      `
      stars = int(input())
      if stars == 3:
          print("Amazing")
      elif stars == 2:
          print("Good")
      elif stars == 1:
          print("Okay")
      else:
          print("Try again")
      `,
      `
      const stars = Number(prompt());
      if (stars === 3) {
        console.log("Amazing");
      } else if (stars === 2) {
        console.log("Good");
      } else if (stars === 1) {
        console.log("Okay");
      } else {
        console.log("Try again");
      }
      `,
    ),
    distractors: { python: ['elif stars = 1:'], javascript: ['} else if (stars = 1) {'] },
    tests: [
      { name: '3', input: '3', expectedOutput: 'Amazing' },
      { name: '2', input: '2', expectedOutput: 'Good' },
      { name: '1', input: '1', expectedOutput: 'Okay' },
      { name: '0', input: '0', expectedOutput: 'Try again' },
    ],
  },
  {
    id: 'else-if-chains-2',
    conceptId: 'else-if-chains',
    title: 'Weather Advisor',
    role: 'combine',
    game: 'build-it',
    mode: 'guided',
    prompt: 'Read a temperature (whole number). Print:\n- `Freezing` below 0\n- `Cold` from 0 up to 14\n- `Nice` from 15 up to 24\n- `Hot` at 25 or above',
    reinforces: ['input', 'type-conversion', 'booleans'],
    hints: ['Check from coldest to hottest.', '"Below 0" is `< 0`; "up to 14" means `< 15`.'],
    starterCode: code(
      `
      # 1. READ: get the temperature as a whole number
      # 2. DECIDE: test the bands in order, coldest first;
      #    only the first band that matches should run
      # 3. REPORT: each band prints its own word
      `,
      `
      // 1. READ: get the temperature as a whole number
      // 2. DECIDE: test the bands in order, coldest first;
      //    only the first band that matches should run
      // 3. REPORT: each band prints its own word
      `,
    ),
    solution: code(
      `
      temp = int(input())
      if temp < 0:
          print("Freezing")
      elif temp < 15:
          print("Cold")
      elif temp < 25:
          print("Nice")
      else:
          print("Hot")
      `,
      `
      const temp = Number(prompt());
      if (temp < 0) {
        console.log("Freezing");
      } else if (temp < 15) {
        console.log("Cold");
      } else if (temp < 25) {
        console.log("Nice");
      } else {
        console.log("Hot");
      }
      `,
    ),
    tests: [
      { name: '-5', input: '-5', expectedOutput: 'Freezing' },
      { name: '10', input: '10', expectedOutput: 'Cold' },
      { name: '20', input: '20', expectedOutput: 'Nice' },
      { name: '30', input: '30', expectedOutput: 'Hot' },
      { name: 'edge 0', input: '0', expectedOutput: 'Cold', hidden: true },
      { name: 'edge 15', input: '15', expectedOutput: 'Nice', hidden: true },
      { name: 'edge 25', input: '25', expectedOutput: 'Hot', hidden: true },
    ],
  },
  {
    id: 'else-if-chains-3',
    conceptId: 'else-if-chains',
    title: 'Order Matters',
    role: 'integrate',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: 'This grader should print `Excellent` for 90+, `Pass` for 50–89, and `Try again` below 50. But nobody ever gets `Excellent`! Run the tests, figure out why, and fix it.',
    reinforces: ['input', 'type-conversion', 'booleans', 'conditionals'],
    hints: ['Which condition is checked first when the score is 95?', 'Is 95 >= 50? Then that branch runs, and the rest are skipped.', 'Put the most specific (highest) check first.'],
    starterCode: code(
      `
      score = int(input())
      if score >= 50:
          print("Pass")
      elif score >= 90:
          print("Excellent")
      else:
          print("Try again")
      `,
      `
      const score = Number(prompt());
      if (score >= 50) {
        console.log("Pass");
      } else if (score >= 90) {
        console.log("Excellent");
      } else {
        console.log("Try again");
      }
      `,
    ),
    solution: code(
      `
      score = int(input())
      if score >= 90:
          print("Excellent")
      elif score >= 50:
          print("Pass")
      else:
          print("Try again")
      `,
      `
      const score = Number(prompt());
      if (score >= 90) {
        console.log("Excellent");
      } else if (score >= 50) {
        console.log("Pass");
      } else {
        console.log("Try again");
      }
      `,
    ),
    tests: [
      { name: '95', input: '95', expectedOutput: 'Excellent' },
      { name: '60', input: '60', expectedOutput: 'Pass' },
      { name: '10', input: '10', expectedOutput: 'Try again' },
      { name: 'edge 90', input: '90', expectedOutput: 'Excellent', hidden: true },
    ],
    takeaway: 'No error appeared, yet the program was wrong. **Logic bugs are silent**; tests are how you catch them.',
  },
];
