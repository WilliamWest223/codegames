import type { Level } from '@codegames/shared';
import { code, same, grid } from '../../helpers';
import { lang } from '../../localize';

/** return-values levels, in play order. */
export const returnValuesLevels: Level[] = [
  {
    id: 'return-values-1',
    conceptId: 'return-values',
    title: 'Ask the Robot',
    role: 'intro',
    game: 'grid-quest',
    mode: 'fill-blanks',
    prompt: `${lang('`is_blocked()`', '`isBlocked()`')} has been **answering** you all along: it hands back ${lang('`True` or `False`', '`true` or `false`')}. That's a **return value**. Now write your own question: ${lang('`wall_on_left()`', '`wallOnLeft()`')} turns left, checks, turns back, and **returns** the answer. Walk until there's an opening on your left, then go through it. Tested on two maps.`,
    reinforces: ['while-loops'],
    hints: ['Store the answer in a variable before turning back, or you\'ll check the wrong direction.', lang('`blocked = is_blocked()` then `return blocked`.', '`const blocked = isBlocked();` then `return blocked;`')],
    grid: grid(`
      #########
      ####G####
      ####.####
      #>......#
      #########
    `),
    extraGrids: [grid(`
      #########
      ######G##
      ######.##
      #>......#
      #########
    `)],
    starterCode: code(
      `
      def turn_right():
          turn_left()
          turn_left()
          turn_left()

      def wall_on_left():
          turn_left()
          blocked = ___
          turn_right()
          return ___

      while wall_on_left():
          move()
      turn_left()
      move()
      move()
      collect()
      `,
      `
      function turnRight() {
        turnLeft();
        turnLeft();
        turnLeft();
      }

      function wallOnLeft() {
        turnLeft();
        const blocked = ___;
        turnRight();
        return ___;
      }

      while (wallOnLeft()) {
        move();
      }
      turnLeft();
      move();
      move();
      collect();
      `,
    ),
    solution: code(
      `
      def turn_right():
          turn_left()
          turn_left()
          turn_left()

      def wall_on_left():
          turn_left()
          blocked = is_blocked()
          turn_right()
          return blocked

      while wall_on_left():
          move()
      turn_left()
      move()
      move()
      collect()
      `,
      `
      function turnRight() {
        turnLeft();
        turnLeft();
        turnLeft();
      }

      function wallOnLeft() {
        turnLeft();
        const blocked = isBlocked();
        turnRight();
        return blocked;
      }

      while (wallOnLeft()) {
        move();
      }
      turnLeft();
      move();
      move();
      collect();
      `,
    ),
    takeaway: '`return` hands an answer back to whoever called the function. The call itself then *becomes* that value, so you can use it in a `while` or `if`.',
  },
  {
    id: 'return-values-2',
    conceptId: 'return-values',
    title: 'Print or Return?',
    role: 'combine',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: 'Two functions that look alike: one **prints** its answer, one **returns** it. Predict the output carefully, including what `a` holds.',
    reinforces: ['operators'],
    hints: [lang('Calling `double_p(3)` prints 6 straight away, but gives nothing back.', 'Calling `doubleP(3)` prints 6 straight away, but gives nothing back.'), lang('A function with no `return` gives back `None`.', 'A function with no `return` gives back `undefined`.'), lang('`double_r(double_r(2))`: the inner call happens first.', '`doubleR(doubleR(2))`: the inner call happens first.')],
    code: code(
      `
      def double_p(n):
          print(n * 2)

      def double_r(n):
          return n * 2

      a = double_p(3)
      b = double_r(3)
      print(a, b)
      print(double_r(double_r(2)))
      `,
      `
      function doubleP(n) {
        console.log(n * 2);
      }

      function doubleR(n) {
        return n * 2;
      }

      const a = doubleP(3);
      const b = doubleR(3);
      console.log(a, b);
      console.log(doubleR(doubleR(2)));
      `,
    ),
    modify: {
      prompt: lang(
        'Now **modify** `double_p` so the program prints `6 6` and then `8` (and nothing else).',
        'Now **modify** `doubleP` so the program prints `6 6` and then `8` (and nothing else).',
      ),
      expectedOutput: '6 6\n8',
      solution: code(
        `
        def double_p(n):
            return n * 2

        def double_r(n):
            return n * 2

        a = double_p(3)
        b = double_r(3)
        print(a, b)
        print(double_r(double_r(2)))
        `,
        `
        function doubleP(n) {
          return n * 2;
        }

        function doubleR(n) {
          return n * 2;
        }

        const a = doubleP(3);
        const b = doubleR(3);
        console.log(a, b);
        console.log(doubleR(doubleR(2)));
        `,
      ),
      requirements: {
        python: [
          { pattern: 'print\\(a, b\\)', message: 'Keep print(a, b): change the function instead.' },
          { pattern: 'a\\s*=\\s*double_p\\(3\\)', message: 'Keep calling double_p: change the function itself.' },
        ],
        javascript: [
          { pattern: 'console\\.log\\(a, b\\)', message: 'Keep console.log(a, b): change the function instead.' },
          { pattern: 'a\\s*=\\s*doubleP\\(3\\)', message: 'Keep calling doubleP: change the function itself.' },
        ],
      },
    },
    takeaway: 'Printing **shows** a value to a person. Returning **gives** it to the program so it can be stored and used. Most functions should return.',
  },
  {
    id: 'return-values-3',
    conceptId: 'return-values',
    title: 'Stop at Return',
    role: 'combine',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: '`return` doesn\'t just hand back a value: it **ends** the function right there. Predict the output.',
    reinforces: ['conditionals'],
    hints: ['For 5, the first `if` is true, so the function returns "positive" and stops.', 'Is the last line inside `sign` ever reached?'],
    remix: true,
    code: code(
      `
      def sign(n):
          if n > 0:
              return "positive"
          if n < 0:
              return "negative"
          return "zero"
          print("never")

      print(sign(5))
      print(sign(-2))
      print(sign(0))
      `,
      `
      function sign(n) {
        if (n > 0) {
          return "positive";
        }
        if (n < 0) {
          return "negative";
        }
        return "zero";
        console.log("never");
      }

      console.log(sign(5));
      console.log(sign(-2));
      console.log(sign(0));
      `,
    ),
  },
  {
    id: 'return-values-4',
    conceptId: 'return-values',
    title: 'Tax Function',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: `Complete ${lang('`price_with_tax(price, rate)`', '`priceWithTax(price, rate)`')} so it **returns** the price with tax added (rate 0.2 means 20%). The main program reads two prices and prints their total with 20% tax:\n\n\`\`\`\nTotal: $18.00\n\`\`\`\n\n(for 10 and 5). Hidden tests call your function with other prices and rates.`,
    reinforces: ['input', 'type-conversion', 'string-formatting', 'operators', 'output'],
    hints: ['Price with tax = price × (1 + rate).', lang('Read each price with `float(input())`, then add `price_with_tax(a, 0.2) + price_with_tax(b, 0.2)`. That only works if the function **returns**.', 'Read each price with `Number(prompt())`, then add `priceWithTax(a, 0.2) + priceWithTax(b, 0.2)`. That only works if the function **returns**.'), lang('`return price * (1 + rate)`', '`return price * (1 + rate);`')],
    starterCode: code(
      `
      def price_with_tax(price, rate):
          # return the price with tax added
          return 0

      # read two prices (they can have decimals)
      # add up both prices with 20% tax, using your function
      # print it like: Total: $18.00
      `,
      `
      function priceWithTax(price, rate) {
        // return the price with tax added
        return 0;
      }

      // read two prices (they can have decimals)
      // add up both prices with 20% tax, using your function
      // print it like: Total: $18.00
      `,
    ),
    solution: code(
      `
      def price_with_tax(price, rate):
          return price * (1 + rate)

      a = float(input())
      b = float(input())
      total = price_with_tax(a, 0.2) + price_with_tax(b, 0.2)
      print(f"Total: \${total:.2f}")
      `,
      `
      function priceWithTax(price, rate) {
        return price * (1 + rate);
      }

      const a = Number(prompt());
      const b = Number(prompt());
      const total = priceWithTax(a, 0.2) + priceWithTax(b, 0.2);
      console.log(\`Total: $\${total.toFixed(2)}\`);
      `,
    ),
    tests: [
      { name: '10 and 5', input: '10\n5', expectedOutput: 'Total: $18.00' },
      { name: '19.99 at 20%', input: '1\n1', expectedOutput: '23.99', harness: { python: 'print(f"{price_with_tax(19.99, 0.2):.2f}")', javascript: 'console.log(priceWithTax(19.99, 0.2).toFixed(2));' }, hidden: true },
      { name: '100 at 5%', input: '1\n1', expectedOutput: '105.00', harness: { python: 'print(f"{price_with_tax(100, 0.05):.2f}")', javascript: 'console.log(priceWithTax(100, 0.05).toFixed(2));' }, hidden: true },
    ],
  },
  {
    id: 'return-values-5',
    conceptId: 'return-values',
    title: 'First and Done',
    role: 'integrate',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: 'This prime checker says **9 is prime**! A prime number can only be divided evenly by 1 and itself. Find the bug: it\'s about *when* the function returns.',
    reinforces: ['loops', 'conditionals', 'operators', 'input'],
    hints: ['Trace 9: the loop tries d = 2 first. What happens?', 'The function returns True after checking just **one** divisor.', 'Only return True after the loop has tried **every** divisor: delete the `else` branch inside the loop.'],
    starterCode: code(
      `
      def is_prime(n):
          if n < 2:
              return False
          for d in range(2, n):
              if n % d == 0:
                  return False
              else:
                  return True
          return True

      n = int(input())
      if is_prime(n):
          print(f"{n} is prime")
      else:
          print(f"{n} is not prime")
      `,
      `
      function isPrime(n) {
        if (n < 2) {
          return false;
        }
        for (let d = 2; d < n; d++) {
          if (n % d === 0) {
            return false;
          } else {
            return true;
          }
        }
        return true;
      }

      const n = Number(prompt());
      if (isPrime(n)) {
        console.log(\`\${n} is prime\`);
      } else {
        console.log(\`\${n} is not prime\`);
      }
      `,
    ),
    solution: code(
      `
      def is_prime(n):
          if n < 2:
              return False
          for d in range(2, n):
              if n % d == 0:
                  return False
          return True

      n = int(input())
      if is_prime(n):
          print(f"{n} is prime")
      else:
          print(f"{n} is not prime")
      `,
      `
      function isPrime(n) {
        if (n < 2) {
          return false;
        }
        for (let d = 2; d < n; d++) {
          if (n % d === 0) {
            return false;
          }
        }
        return true;
      }

      const n = Number(prompt());
      if (isPrime(n)) {
        console.log(\`\${n} is prime\`);
      } else {
        console.log(\`\${n} is not prime\`);
      }
      `,
    ),
    tests: [
      { name: '9', input: '9', expectedOutput: '9 is not prime' },
      { name: '7', input: '7', expectedOutput: '7 is prime' },
      { name: '2', input: '2', expectedOutput: '2 is prime' },
      { name: '25', input: '25', expectedOutput: '25 is not prime', hidden: true },
      { name: '4', input: '4', expectedOutput: '4 is not prime', hidden: true },
      { name: 'is_prime(15)', input: '2', expectedOutput: { python: 'False', javascript: 'false' }, harness: { python: 'print(is_prime(15))', javascript: 'console.log(isPrime(15));' }, hidden: true },
    ],
    takeaway: 'A loop that searches for a "no" can return early when it finds one. The "yes" can only be decided **after** the loop has checked everything.',
  },
  {
    id: 'return-values-6',
    conceptId: 'return-values',
    title: 'Leap Years',
    role: 'challenge',
    game: 'build-it',
    mode: 'freeform',
    prompt: `Write ${lang('`is_leap(year)`', '`isLeap(year)`')} that **returns** a boolean. A year is a leap year if it's divisible by 4, **except** years divisible by 100, **unless** they're also divisible by 400. Then read a year and print \`Leap year\` or \`Not a leap year\`. *Optional challenge.*`,
    reinforces: ['else-if-chains', 'booleans', 'operators'],
    hints: ['Check the most specific rule first: divisible by 400.', 'Then 100, then 4.', 'Return True/False values, not the text "True".'],
    starterCode: same(''),
    solution: code(
      `
      def is_leap(year):
          if year % 400 == 0:
              return True
          elif year % 100 == 0:
              return False
          elif year % 4 == 0:
              return True
          else:
              return False

      year = int(input())
      if is_leap(year):
          print("Leap year")
      else:
          print("Not a leap year")
      `,
      `
      function isLeap(year) {
        if (year % 400 === 0) {
          return true;
        } else if (year % 100 === 0) {
          return false;
        } else if (year % 4 === 0) {
          return true;
        } else {
          return false;
        }
      }

      const year = Number(prompt());
      if (isLeap(year)) {
        console.log("Leap year");
      } else {
        console.log("Not a leap year");
      }
      `,
    ),
    tests: [
      { name: '2024', input: '2024', expectedOutput: 'Leap year' },
      { name: '2023', input: '2023', expectedOutput: 'Not a leap year' },
      {
        name: '1900, 2000, 2024, 2023',
        input: '2000',
        expectedOutput: { python: 'False True True False', javascript: 'false true true false' },
        harness: { python: 'print(is_leap(1900), is_leap(2000), is_leap(2024), is_leap(2023))', javascript: 'console.log(isLeap(1900), isLeap(2000), isLeap(2024), isLeap(2023));' },
        hidden: true,
      },
    ],
  },
];
