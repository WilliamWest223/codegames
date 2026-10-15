import type { Level } from '@codegames/shared';
import { code } from '../../helpers';
import { lang } from '../../localize';
import { codeWithToInt } from './shared';

/** error-handling levels, in play order. */
export const errorHandlingLevels: Level[] = [
  {
    id: 'error-handling-1',
    conceptId: 'error-handling',
    title: 'Catch the Crash',
    role: 'intro',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: `Some errors you can see coming, like someone typing \`seven\` instead of \`7\`. ${lang('`try` runs some code; if it raises a `ValueError`, Python jumps straight to the `except` block', '`try` runs some code; if anything inside **throws** an error, JavaScript jumps straight to the `catch` block')} instead of crashing.${lang('', ' Careful: `Number("seven")` does **not** throw; it quietly gives `NaN` (Not a Number). That\'s why these levels use a small `toInt` helper that throws for you.')} Predict the output.`,
    reinforces: ['functions', 'iterating-collections', 'type-conversion'],
    hints: [
      lang('The first line is a warm-up: `int("12")` is the number 12.', 'The first line: `Number` doesn\'t throw on bad text, it gives `NaN`.'),
      lang('`int("seven")` raises a `ValueError`. The rest of that `try` block is skipped.', '`toInt("seven")` throws. The rest of that `try` block is skipped.'),
      'After the error is caught, the loop carries on with the next item. The program doesn\'t stop.',
    ],
    code: codeWithToInt(
      `
      def to_number(text):
          return int(text)

      print(int("12") + 1)
      for item in ["12", "seven", "3"]:
          try:
              print(to_number(item) * 2)
          except ValueError:
              print("Not a number:", item)
      print("Done")
      `,
      `
      console.log(Number("seven"));
      for (const item of ["12", "seven", "3"]) {
        try {
          console.log(toInt(item) * 2);
        } catch (err) {
          console.log("Not a number:", item);
        }
      }
      console.log("Done");
      `,
    ),
    takeaway: lang(
      'Wrap risky code in `try:` and handle the problem in `except SomeError:`. The program keeps running instead of crashing. Catch the **specific** error you expect, like `ValueError`.',
      'Wrap risky code in `try { }` and handle the problem in `catch (err) { }`. The program keeps running instead of crashing. Your own functions can `throw new Error(...)` to report a problem.',
    ),
  },
  {
    id: 'error-handling-2',
    conceptId: 'error-handling',
    title: 'Ask Again',
    role: 'combine',
    game: 'build-it',
    mode: 'fill-blanks',
    prompt: 'Keep asking for an age until the player types a **whole number**. Fill in the blank so the loop stops once the number is good:\n\n```\nPlease type a whole number\nNext year you\'ll be 13\n```\n\n(for `ten`, then `12`).',
    reinforces: ['while-loops', 'loop-control', 'input', 'type-conversion'],
    hints: [
      'If the conversion worked, the program reaches the line after it. What leaves a loop?',
      lang('The blank is `break`.', 'The blank is `break`.'),
    ],
    starterCode: codeWithToInt(
      `
      while True:
          text = input()
          try:
              age = int(text)
              ___
          except ValueError:
              print("Please type a whole number")
      print(f"Next year you'll be {age + 1}")
      `,
      `
      let age;
      while (true) {
        const text = prompt();
        try {
          age = toInt(text);
          ___;
        } catch (err) {
          console.log("Please type a whole number");
        }
      }
      console.log(\`Next year you'll be \${age + 1}\`);
      `,
    ),
    solution: codeWithToInt(
      `
      while True:
          text = input()
          try:
              age = int(text)
              break
          except ValueError:
              print("Please type a whole number")
      print(f"Next year you'll be {age + 1}")
      `,
      `
      let age;
      while (true) {
        const text = prompt();
        try {
          age = toInt(text);
          break;
        } catch (err) {
          console.log("Please type a whole number");
        }
      }
      console.log(\`Next year you'll be \${age + 1}\`);
      `,
    ),
    tests: [
      { name: 'ten, then 12', input: 'ten\n12', expectedOutput: 'Please type a whole number\nNext year you\'ll be 13' },
      { name: 'right first time', input: '30', expectedOutput: 'Next year you\'ll be 31' },
      { name: 'two bad tries', input: '4.5\nabc\n8', expectedOutput: 'Please type a whole number\nPlease type a whole number\nNext year you\'ll be 9', hidden: true },
    ],
  },
  {
    id: 'error-handling-3',
    conceptId: 'error-handling',
    title: 'Too Wide a Net',
    role: 'combine',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: `This adds up three numbers but says \`That's not a number!\` even for \`4\`, \`5\`, \`6\`. The real bug is hiding because the error handler catches **everything**. Fix the bug, and ${lang('only catch `ValueError`', 'shrink the `try` so it only wraps the `toInt` call')} so typos can never hide again.`,
    reinforces: ['variables', 'loops', 'input', 'first-errors'],
    hints: [
      lang('Temporarily delete the `try`/`except` lines and run it. What error appears?', 'Temporarily log `err.message` in the `catch` block. What error is really happening?'),
      'There\'s a typo in a variable name.',
      lang('Fix `totl`, and write `except ValueError:` instead of a bare `except:`.', 'Fix `totl`. Then shrink the net: declare `let n;` before the `try`, put **only** `n = toInt(prompt());` inside it, `continue` in the `catch`, and do the adding after the `try`.'),
    ],
    starterCode: codeWithToInt(
      `
      total = 0
      for i in range(3):
          try:
              total = totl + int(input())
          except:
              print("That's not a number!")
      print(f"Total: {total}")
      `,
      `
      let total = 0;
      for (let i = 0; i < 3; i++) {
        try {
          total = totl + toInt(prompt());
        } catch (err) {
          console.log("That's not a number!");
        }
      }
      console.log(\`Total: \${total}\`);
      `,
    ),
    solution: codeWithToInt(
      `
      total = 0
      for i in range(3):
          try:
              total = total + int(input())
          except ValueError:
              print("That's not a number!")
      print(f"Total: {total}")
      `,
      `
      let total = 0;
      for (let i = 0; i < 3; i++) {
        let n;
        try {
          n = toInt(prompt());
        } catch (err) {
          console.log("That's not a number!");
          continue;
        }
        total = total + n;
      }
      console.log(\`Total: \${total}\`);
      `,
    ),
    requirements: {
      python: [
        { pattern: 'except\\s*:', forbid: true, message: 'A bare `except:` catches every error, typos included. Name the error you expect: `except ValueError:`.' },
        { pattern: 'except\\s+(Base)?Exception\\b|except\\s*\\(', forbid: true, message: '`except Exception` is still too wide a net: it catches typos too. Catch only the error you expect: `except ValueError:`.' },
      ],
      javascript: [
        {
          pattern: 'throw\\s+(?!new\\b)\\w+|try\\s*\\{\\s*(?:(?:let|const)\\s+)?\\w+\\s*=\\s*toInt\\(\\s*(?:prompt\\(\\)|\\w+)\\s*\\);?\\s*\\}',
          message: 'Make sure a typo can\'t hide: keep **only** the `toInt` call inside the `try`, or re-throw errors you didn\'t expect (`throw err;`).',
        },
      ],
    },
    tests: [
      { name: '4, 5, 6', input: '4\n5\n6', expectedOutput: 'Total: 15' },
      { name: 'one bad number', input: '4\nabc\n6', expectedOutput: 'That\'s not a number!\nTotal: 10' },
    ],
    takeaway: 'Keep the net small: put only the line that can fail inside `try`, and catch only the error you expect. Then a typo still crashes loudly instead of hiding.',
  },
  {
    id: 'error-handling-5',
    conceptId: 'error-handling',
    title: 'Pass It Up',
    role: 'combine',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: `Your own functions can ${lang('**raise** an error with `raise ValueError("...")`', '**throw** an error with `throw new Error("...")`')} when they can't give a sensible answer. The error travels **up** to whoever called the function, and their \`try\` can catch it. Predict the output.`,
    reinforces: ['functions', 'iterating-collections', 'conditionals', 'operators'],
    hints: [
      '8 and 6 are even, so `half` returns normally for them.',
      `For 3, \`half\` stops at the ${lang('`raise`', '`throw`')}. Back in the loop, the rest of the \`try\` block is skipped, so "ok" isn't printed for 3.`,
    ],
    code: code(
      `
      def half(n):
          if n % 2 == 1:
              raise ValueError("odd")
          return n // 2

      for n in [8, 3, 6]:
          try:
              print(half(n))
              print("ok")
          except ValueError:
              print("can't halve", n)
      `,
      `
      function half(n) {
        if (n % 2 === 1) {
          throw new Error("odd");
        }
        return n / 2;
      }

      for (const n of [8, 3, 6]) {
        try {
          console.log(half(n));
          console.log("ok");
        } catch (err) {
          console.log("can't halve", n);
        }
      }
      `,
    ),
    takeaway: `${lang('`raise`', '`throw`')} stops the function on the spot and hands the error to the caller. The caller decides what to do about it: that's the split between "finding a problem" and "handling it".`,
  },
  {
    id: 'error-handling-4',
    conceptId: 'error-handling',
    title: 'Average of Nothing',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: `One line of comma-separated numbers comes in, like \`4, 8, x, 6\`. Make the program tough:\n\n1. **Skip** items that aren't numbers, printing \`Skipping x\`.\n2. Make \`average\` ${lang('`raise ValueError(...)`', '`throw new Error(...)`')} when the list is empty: an average of nothing makes no sense.\n3. Where \`average\` is called, catch that and print \`No valid numbers\`.\n\n\`\`\`\nSkipping x\nAverage: 6.0\n\`\`\``,
    reinforces: ['functions', 'return-values', 'iterating-collections', 'loop-control', 'string-formatting', 'input'],
    hints: [
      lang('Wrap `nums.append(float(part))` in `try:` / `except ValueError:`.', 'Wrap `nums.push(toNumber(part))` in `try { } catch (err) { }`.'),
      lang('At the top of `average`: `if len(nums) == 0: raise ValueError("no numbers")`.', 'At the top of `average`: `if (nums.length === 0) { throw new Error("no numbers"); }`.'),
      'Put the line that prints the average inside a second try, and print `No valid numbers` when it fails.',
    ],
    starterCode: code(
      `
      def average(nums):
          # raise a ValueError if nums is empty
          total = 0
          for n in nums:
              total += n
          return total / len(nums)

      nums = []
      for part in input().split(","):
          part = part.strip()
          if part == "":
              continue
          nums.append(float(part))

      print(f"Average: {average(nums):.1f}")
      `,
      `
      // Like toInt, but decimals are fine: throws instead of giving NaN.
      function toNumber(text) {
        const n = Number(text);
        if (Number.isNaN(n)) {
          throw new Error("not a number");
        }
        return n;
      }

      function average(nums) {
        // throw an Error if nums is empty
        let total = 0;
        for (const n of nums) {
          total += n;
        }
        return total / nums.length;
      }

      const nums = [];
      for (let part of prompt().split(",")) {
        part = part.trim();
        if (part === "") {
          continue;
        }
        nums.push(toNumber(part));
      }

      console.log(\`Average: \${average(nums).toFixed(1)}\`);
      `,
    ),
    solution: code(
      `
      def average(nums):
          if len(nums) == 0:
              raise ValueError("no numbers")
          total = 0
          for n in nums:
              total += n
          return total / len(nums)

      nums = []
      for part in input().split(","):
          part = part.strip()
          if part == "":
              continue
          try:
              nums.append(float(part))
          except ValueError:
              print(f"Skipping {part}")

      try:
          print(f"Average: {average(nums):.1f}")
      except ValueError:
          print("No valid numbers")
      `,
      `
      // Like toInt, but decimals are fine: throws instead of giving NaN.
      function toNumber(text) {
        const n = Number(text);
        if (Number.isNaN(n)) {
          throw new Error("not a number");
        }
        return n;
      }

      function average(nums) {
        if (nums.length === 0) {
          throw new Error("no numbers");
        }
        let total = 0;
        for (const n of nums) {
          total += n;
        }
        return total / nums.length;
      }

      const nums = [];
      for (let part of prompt().split(",")) {
        part = part.trim();
        if (part === "") {
          continue;
        }
        try {
          nums.push(toNumber(part));
        } catch (err) {
          console.log(\`Skipping \${part}\`);
        }
      }

      try {
        console.log(\`Average: \${average(nums).toFixed(1)}\`);
      } catch (err) {
        console.log("No valid numbers");
      }
      `,
    ),
    tests: [
      { name: '4, 8, x, 6', input: '4, 8, x, 6', expectedOutput: 'Skipping x\nAverage: 6.0' },
      { name: 'nothing valid', input: 'a,b', expectedOutput: 'Skipping a\nSkipping b\nNo valid numbers' },
      { name: 'empty gaps', input: '1,,2', expectedOutput: 'Average: 1.5', hidden: true },
      { name: 'negative and decimal numbers', input: '4, -3, 1.5, oops', expectedOutput: 'Skipping oops\nAverage: 0.8', hidden: true },
      {
        name: 'average([]) raises',
        input: '1',
        expectedOutput: 'raised',
        harness: {
          python: 'try:\n    average([])\n    print("no error")\nexcept ValueError:\n    print("raised")',
          javascript: 'try {\n  average([]);\n  console.log("no error");\n} catch (err) {\n  console.log("raised");\n}',
        },
        hidden: true,
      },
    ],
    requirements: {
      python: [{ pattern: 'try\\s*:[\\s\\S]*except\\s+ValueError[\\s\\S]*try\\s*:[\\s\\S]*except\\s+ValueError', message: 'Use `try`/`except ValueError` twice: once when converting each item, once around the call to `average`.' }],
      javascript: [{ pattern: 'try\\s*\\{[\\s\\S]*catch[\\s\\S]*try\\s*\\{[\\s\\S]*catch', message: 'Use `try`/`catch` twice: once when converting each item, once around the call to `average`.' }],
    },
    takeaway: lang(
      'Raise an error when your function can\'t give a sensible answer, and let the caller decide what to print. (Without your check, an empty list would crash with `ZeroDivisionError` deep inside `average`.)',
      'Throw an error when your function can\'t give a sensible answer, and let the caller decide what to print. (Without your check, JavaScript silently gives `NaN` for `0 / 0`, which is why you must check yourself.)',
    ),
  },
];
