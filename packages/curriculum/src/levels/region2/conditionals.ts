import type { Level } from '@codegames/shared';
import { code, grid } from '../../helpers';
import { lang } from '../../localize';

/** conditionals levels, in play order. */
export const conditionalsLevels: Level[] = [
  {
    id: 'conditionals-1',
    conceptId: 'conditionals',
    title: 'Gem or Not?',
    role: 'intro',
    game: 'grid-quest',
    mode: 'fill-blanks',
    prompt: `Some tiles have gems, some don't, and ${lang('`collect()`', '`collect()`')} crashes on an empty tile. An **if** statement runs its code only when a condition is true.\n\nFill in the condition so the robot collects only when it's standing on a gem. ${lang('`on_gem()`', '`onGem()`')} answers that question.`,
    reinforces: ['repeat', 'booleans'],
    hints: ['What question does the robot need to ask before collecting?', 'The sensor that answers it is listed above the editor.', lang('The blank should be `on_gem()`.', 'The blank should be `onGem()`.')],
    grid: grid(`
      #########
      #>G.GG.G#
      #########
    `),
    extraGrids: [grid(`
      #########
      #>.GG.G.#
      #########
    `)],
    starterCode: code(
      `
      for i in range(6):
          move()
          if ___:
              collect()
      `,
      `
      for (let i = 0; i < 6; i++) {
        move();
        if (___) {
          collect();
        }
      }
      `,
    ),
    solution: code(
      `
      for i in range(6):
          move()
          if on_gem():
              collect()
      `,
      `
      for (let i = 0; i < 6; i++) {
        move();
        if (onGem()) {
          collect();
        }
      }
      `,
    ),
    takeaway: 'Your code now works on **any** arrangement of gems. That\'s the power of decisions: one program, many situations.',
  },
  {
    id: 'conditionals-2',
    conceptId: 'conditionals',
    title: 'Pass or Fail',
    role: 'combine',
    game: 'build-it',
    mode: 'guided',
    prompt: `Read a test score. Print \`Pass\` if it's **50 or more**, otherwise print \`Fail\`.\n\n${lang('```python\nif condition:\n    ...\nelse:\n    ...\n```', '```javascript\nif (condition) {\n  ...\n} else {\n  ...\n}\n```')}`,
    reinforces: ['input', 'type-conversion', 'booleans'],
    hints: ['Convert the input to a number first.', 'Use `>=` to include exactly 50.'],
    starterCode: code('score = int(input())\n', 'const score = Number(prompt());\n'),
    solution: code(
      `
      score = int(input())
      if score >= 50:
          print("Pass")
      else:
          print("Fail")
      `,
      `
      const score = Number(prompt());
      if (score >= 50) {
        console.log("Pass");
      } else {
        console.log("Fail");
      }
      `,
    ),
    tests: [
      { name: '75 passes', input: '75', expectedOutput: 'Pass' },
      { name: '49 fails', input: '49', expectedOutput: 'Fail' },
      { name: 'exactly 50', input: '50', expectedOutput: 'Pass', hidden: true },
    ],
    parallelExample: {
      prompt: '**Weather check:** print `Hot` when it is **25 or more**, otherwise `Cool`. One test, two branches; `>=` includes 25 itself. (Here the temperature is fixed; your program reads its number.)',
      code: code(
        `
        temp = 30
        if temp >= 25:
            print("Hot")
        else:
            print("Cool")
        `,
        `
        const temp = 30;
        if (temp >= 25) {
          console.log("Hot");
        } else {
          console.log("Cool");
        }
        `,
      ),
    },
  },
  {
    id: 'conditionals-5',
    conceptId: 'conditionals',
    title: 'Or What?',
    role: 'combine',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: 'This program should print `Weekend!` for `Sat` or `Sun`, and `Weekday` otherwise. But it says `Weekend!` for **every** day. Find out why.',
    reinforces: ['input', 'booleans'],
    hints: [lang('Read `day == "Sat" or "Sun"` the way Python does: `(day == "Sat") or ("Sun")`.', 'Read `day === "Sat" || "Sun"` the way JavaScript does: `(day === "Sat") || ("Sun")`.'), 'A non-empty string like "Sun" counts as true all by itself.', lang('Compare both: `day == "Sat" or day == "Sun"`.', 'Compare both: `day === "Sat" || day === "Sun"`.')],
    starterCode: code(
      `
      day = input()
      if day == "Sat" or "Sun":
          print("Weekend!")
      else:
          print("Weekday")
      `,
      `
      const day = prompt();
      if (day === "Sat" || "Sun") {
        console.log("Weekend!");
      } else {
        console.log("Weekday");
      }
      `,
    ),
    solution: code(
      `
      day = input()
      if day == "Sat" or day == "Sun":
          print("Weekend!")
      else:
          print("Weekday")
      `,
      `
      const day = prompt();
      if (day === "Sat" || day === "Sun") {
        console.log("Weekend!");
      } else {
        console.log("Weekday");
      }
      `,
    ),
    tests: [
      { name: 'Sat', input: 'Sat', expectedOutput: 'Weekend!' },
      { name: 'Mon', input: 'Mon', expectedOutput: 'Weekday' },
      { name: 'Sun', input: 'Sun', expectedOutput: 'Weekend!', hidden: true },
      { name: 'Wed', input: 'Wed', expectedOutput: 'Weekday', hidden: true },
    ],
    takeaway: 'Each side of `or` must be a full comparison. Computers don\'t fill in the missing "day ==" the way people do.',
  },
  {
    id: 'conditionals-3',
    conceptId: 'conditionals',
    title: 'Ticket Booth',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: 'Read a visitor\'s age. Tickets cost **$12**, but children **under 12** and seniors **65 and over** pay **$6**. Print:\n\n```\nTicket: $6\n```',
    reinforces: ['input', 'type-conversion', 'booleans', 'string-formatting', 'variables'],
    hints: ['Start with price = 12, then change it if the discount applies.', lang('One `if` with `or` can check both discounts.', 'One `if` with `||` can check both discounts.')],
    starterCode: code(
      `
      # 1. READ: get the visitor's age as a whole number
      # 2. DECIDE: start from the full price, then switch to the cheaper price
      #    if the age gets a discount (check both groups, and their exact edges!)
      # 3. REPORT: print the price in the format shown
      `,
      `
      // 1. READ: get the visitor's age as a whole number
      // 2. DECIDE: start from the full price, then switch to the cheaper price
      //    if the age gets a discount (check both groups, and their exact edges!)
      // 3. REPORT: print the price in the format shown
      `,
    ),
    solution: code(
      `
      age = int(input())
      price = 12
      if age < 12 or age >= 65:
          price = 6
      print(f"Ticket: \${price}")
      `,
      `
      const age = Number(prompt());
      let price = 12;
      if (age < 12 || age >= 65) {
        price = 6;
      }
      console.log(\`Ticket: $\${price}\`);
      `,
    ),
    tests: [
      { name: 'child', input: '8', expectedOutput: 'Ticket: $6' },
      { name: 'adult', input: '30', expectedOutput: 'Ticket: $12' },
      { name: 'exactly 12', input: '12', expectedOutput: 'Ticket: $12', hidden: true },
      { name: 'exactly 65', input: '65', expectedOutput: 'Ticket: $6', hidden: true },
      { name: 'senior', input: '70', expectedOutput: 'Ticket: $6', hidden: true },
    ],
    takeaway: 'Boundaries are where bugs hide. "Under 12" is `< 12`, but "65 and over" is `>= 65`. Always test the exact edge values.',
  },
  {
    id: 'conditionals-4',
    conceptId: 'conditionals',
    title: 'One Equals Too Few',
    role: 'integrate',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: `This program should print \`Perfect!\` only for a score of exactly 100, and \`Keep going\` otherwise. ${lang('Python refuses to run it.', 'JavaScript runs it, but says `Perfect!` for **every** score!')} Find the bug: it's a single character.`,
    reinforces: ['input', 'type-conversion', 'booleans', 'first-errors'],
    hints: [lang('Read the error message: Python even suggests the fix.', 'What does a single `=` do? It stores a value. Inside an `if`, that\'s not what you want.'), lang('`=` stores, `==` compares.', '`=` stores, `===` compares.'), lang('Change `if score = 100:` to `if score == 100:`', 'Change `if (score = 100)` to `if (score === 100)`')],
    starterCode: code(
      `
      score = int(input())
      if score = 100:
          print("Perfect!")
      else:
          print("Keep going")
      `,
      `
      let score = Number(prompt());
      if (score = 100) {
        console.log("Perfect!");
      } else {
        console.log("Keep going");
      }
      `,
    ),
    solution: code(
      `
      score = int(input())
      if score == 100:
          print("Perfect!")
      else:
          print("Keep going")
      `,
      `
      let score = Number(prompt());
      if (score === 100) {
        console.log("Perfect!");
      } else {
        console.log("Keep going");
      }
      `,
    ),
    tests: [
      { name: '100', input: '100', expectedOutput: 'Perfect!' },
      { name: '50', input: '50', expectedOutput: 'Keep going' },
      { name: 'hidden 0', input: '0', expectedOutput: 'Keep going', hidden: true },
    ],
    takeaway: lang('Python protects you here: a single `=` in an `if` is a syntax error. In many other languages (like JavaScript) it silently runs and causes a logic bug.', 'In JavaScript, `if (score = 100)` **stores** 100 in score, and 100 counts as true, so the `if` always runs. This is one of the most famous bugs in programming.'),
    requirements: {
      javascript: [{ pattern: 'score\\s*===\\s*100', message: 'Compare with === (three equals signs) in JavaScript.' }],
    },
  },
  {
    id: 'conditionals-6',
    conceptId: 'conditionals',
    title: 'Never Equal',
    role: 'integrate',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: 'The secret number is 7, but even typing `7` prints `Nope`. No error, just wrong. Fix it.',
    reinforces: ['input', 'type-conversion', 'types', 'booleans'],
    hints: [lang('What type does `input()` give you?', 'What type does `prompt()` give you?'), lang('The text `"7"` is not equal to the number `7`.', 'With `===`, the text `"7"` is never equal to the number `7`.'), lang('Convert it: `guess = int(input())`.', 'Convert it: `const guess = Number(prompt());`.')],
    starterCode: code(
      `
      guess = input()
      if guess == 7:
          print("You got it!")
      else:
          print("Nope")
      `,
      `
      const guess = prompt();
      if (guess === 7) {
        console.log("You got it!");
      } else {
        console.log("Nope");
      }
      `,
    ),
    solution: code(
      `
      guess = int(input())
      if guess == 7:
          print("You got it!")
      else:
          print("Nope")
      `,
      `
      const guess = Number(prompt());
      if (guess === 7) {
        console.log("You got it!");
      } else {
        console.log("Nope");
      }
      `,
    ),
    tests: [
      { name: '7', input: '7', expectedOutput: 'You got it!' },
      { name: '3', input: '3', expectedOutput: 'Nope' },
      { name: '07', input: '07', expectedOutput: 'You got it!', hidden: true },
    ],
    requirements: {
      python: [{ pattern: '==\\s*7', message: 'Keep comparing with the number 7; fix the input instead.' }],
      javascript: [{ pattern: '===\\s*7', message: 'Keep comparing with the number 7; fix the input instead.' }],
    },
    takeaway: 'Text and numbers are never equal, even when they look the same. Convert input before comparing it.',
  },
];
