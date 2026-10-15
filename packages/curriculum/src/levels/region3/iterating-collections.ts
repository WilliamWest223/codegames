import type { Level } from '@codegames/shared';
import { code, grid } from '../../helpers';
import { lang } from '../../localize';

/** iterating-collections levels, in play order. */
export const iteratingCollectionsLevels: Level[] = [
  {
    id: 'iterating-collections-1',
    conceptId: 'iterating-collections',
    title: 'Roll Call',
    role: 'intro',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: `Two ways to visit every item. ${lang('`for name in names:`', '`for (const name of names)`')} hands you each **item**. A counting loop over the indexes hands you each **position**, and you look the item up yourself. ${lang('A third way, `enumerate`, hands you both.', 'And watch the third loop closely.')} Predict the output.`,
    reinforces: ['loops', 'operators'],
    hints: [
      'The first loop runs once per name, in order.',
      'The second loop counts i = 0, 1, 2, and prints `i + 1` so the roll call starts at 1.',
      lang('`enumerate(names, 1)` hands you a number (starting at 1) **and** the item each time round.', 'Careful with the third loop: `for...in` gives the indexes as **text**, `"0"`, `"1"`, `"2"`. What is `"0" + 1`?'),
    ],
    code: code(
      `
      names = ["Ada", "Linus", "Grace"]
      for name in names:
          print("Hi " + name)
      for i in range(len(names)):
          print(i + 1, names[i])
      for i, name in enumerate(names, 1):
          print(i, name)
      `,
      `
      const names = ["Ada", "Linus", "Grace"];
      for (const name of names) {
        console.log("Hi " + name);
      }
      for (let i = 0; i < names.length; i++) {
        console.log(i + 1, names[i]);
      }
      for (const i in names) {
        console.log(i + 1);
      }
      `,
    ),
    takeaway: lang(
      'Use `for item in items:` when you only need the items. Loop over `range(len(items))` when you also need each position.',
      'Use `for (const item of items)` when you only need the items. Use a counting loop up to `items.length` when you also need each position. (Careful: `for...in` gives you the *indexes as strings*, not the items.)',
    ),
  },
  {
    id: 'iterating-collections-8',
    conceptId: 'iterating-collections',
    title: 'Route Cards',
    role: 'combine',
    game: 'grid-quest',
    mode: 'guided',
    prompt: `Mission control sent the robot a **route**: a ${lang('list', 'array')} of step cards. Write a loop that reads each card and does it: \`"move"\`, \`"left"\`, \`"right"\` or \`"grab"\`. Your program should work for **any** route (we'll test it with another route on another map), so you may only write \`move()\` once!`,
    reinforces: ['else-if-chains', 'collections', 'loops'],
    hints: [
      lang('Loop over the cards with `for step in route:`, then check which card it is.', 'Loop over the cards with `for (const step of route)`, then check which card it is.'),
      lang('`if step == "move": move()`, then `elif` for the other three cards.', '`if (step === "move") { move(); }`, then `else if` for the other three cards.'),
      lang('The robot can only turn left: a right turn is three left turns.', 'The robot can only turn left: a right turn is three left turns.'),
    ],
    grid: grid(`
      #######
      ###..G#
      ###.###
      #>.G###
      #######
    `),
    starterCode: code(
      `
      route = ["move", "move", "grab", "left", "move", "move", "right", "move", "move", "grab"]

      for step in route:
          if step == "move":
              move()
          # handle "left", "right" and "grab" too
      `,
      `
      const route = ["move", "move", "grab", "left", "move", "move", "right", "move", "move", "grab"];

      for (const step of route) {
        if (step === "move") {
          move();
        }
        // handle "left", "right" and "grab" too
      }
      `,
    ),
    solution: code(
      `
      route = ["move", "move", "grab", "left", "move", "move", "right", "move", "move", "grab"]

      for step in route:
          if step == "move":
              move()
          elif step == "left":
              turn_left()
          elif step == "right":
              turn_left()
              turn_left()
              turn_left()
          elif step == "grab":
              collect()
      `,
      `
      const route = ["move", "move", "grab", "left", "move", "move", "right", "move", "move", "grab"];

      for (const step of route) {
        if (step === "move") {
          move();
        } else if (step === "left") {
          turnLeft();
        } else if (step === "right") {
          turnLeft();
          turnLeft();
          turnLeft();
        } else if (step === "grab") {
          collect();
        }
      }
      `,
    ),
    routeVariants: [
      {
        name: 'a different route',
        replace: {
          python: [['route = ["move", "move", "grab", "left", "move", "move", "right", "move", "move", "grab"]', 'route = ["move", "grab", "left", "move", "right", "move", "grab"]']],
          javascript: [['const route = ["move", "move", "grab", "left", "move", "move", "right", "move", "move", "grab"];', 'const route = ["move", "grab", "left", "move", "right", "move", "grab"];']],
        },
        grid: grid(`
          ######
          #..G##
          #>G###
          ######
        `),
      },
    ],
    requirements: {
      python: [
        { pattern: '(move\\(\\)[\\s\\S]*){2}', forbid: true, message: 'Write `move()` only once: let the loop read the cards and do each step.' },
        { pattern: '(collect\\(\\)[\\s\\S]*){2}', forbid: true, message: 'Write `collect()` only once: let the loop read the cards and do each step.' },
      ],
      javascript: [
        { pattern: '(move\\(\\)[\\s\\S]*){2}', forbid: true, message: 'Write `move()` only once: let the loop read the cards and do each step.' },
        { pattern: '(collect\\(\\)[\\s\\S]*){2}', forbid: true, message: 'Write `collect()` only once: let the loop read the cards and do each step.' },
      ],
    },
    takeaway: `Data can drive a program: the ${lang('list', 'array')} says *what* to do, the loop says *how*. Change the route and the same code follows a new path.`,
  },
  {
    id: 'iterating-collections-2',
    conceptId: 'iterating-collections',
    title: 'Double Trouble',
    role: 'combine',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: `Prices just doubled! This should change every price in the ${lang('list', 'array')}, but the prices come out unchanged. Fix the loop. (We'll test it with a different ${lang('list', 'array')} too.)`,
    reinforces: ['operators', 'loops'],
    hints: [
      'Trace it: the loop variable `p` gets a **copy** of each price. Changing `p` changes the copy, not the list.',
      'To change the item in the list, you need its **position**: loop over the indexes instead.',
      lang('`for i in range(len(prices)):` then `prices[i] = prices[i] * 2`.', '`for (let i = 0; i < prices.length; i++)` then `prices[i] = prices[i] * 2;`.'),
    ],
    starterCode: code(
      `
      prices = [3, 5, 2]
      for p in prices:
          p = p * 2
      print(prices)
      `,
      `
      const prices = [3, 5, 2];
      for (let p of prices) {
        p = p * 2;
      }
      console.log(prices);
      `,
    ),
    solution: code(
      `
      prices = [3, 5, 2]
      for i in range(len(prices)):
          prices[i] = prices[i] * 2
      print(prices)
      `,
      `
      const prices = [3, 5, 2];
      for (let i = 0; i < prices.length; i++) {
        prices[i] = prices[i] * 2;
      }
      console.log(prices);
      `,
    ),
    requirements: {
      python: [{ pattern: '(\\[\\s*\\d+\\s*,[\\s\\S]*){2}', forbid: true, message: 'Don\'t type the new list: change the items with a loop.' }],
      javascript: [{ pattern: '(\\[\\s*\\d+\\s*,[\\s\\S]*){2}', forbid: true, message: 'Don\'t type the new array: change the items with a loop.' }],
    },
    tests: [{ name: 'every price doubled', expectedOutput: { python: '[6, 10, 4]', javascript: '[ 6, 10, 4 ]' } }],
    variants: [
      {
        name: 'a different list',
        replace: { python: [['[3, 5, 2]', '[10, 1, 4, 6]']], javascript: [['[3, 5, 2]', '[10, 1, 4, 6]']] },
        expectedOutput: { python: '[20, 2, 8, 12]', javascript: '[ 20, 2, 8, 12 ]' },
      },
    ],
    takeaway: 'The loop variable is a **copy** of each item: reassigning it never changes the list. To change items in place, loop over the positions and assign to `items[i]`.',
  },
  {
    id: 'iterating-collections-7',
    conceptId: 'iterating-collections',
    title: 'Shared Bag',
    role: 'combine',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: `A function gets a number and a ${lang('list', 'array')}. It changes both of its parameters. Which change does the caller see? Predict the output.`,
    reinforces: ['functions', 'collections'],
    hints: [
      '`n = n + 1` makes a new number and moves the **inside** name tag. The caller\'s `count` is untouched.',
      `${lang('`items.append`', '`items.push`')} changes the ${lang('list', 'array')} itself, and the caller's \`bag\` is a name tag on that **same** ${lang('list', 'array')}.`,
    ],
    code: code(
      `
      def add_bonus(n, items):
          n = n + 1
          items.append("bonus")

      count = 1
      bag = []
      add_bonus(count, bag)
      print(count, bag)
      `,
      `
      function addBonus(n, items) {
        n = n + 1;
        items.push("bonus");
      }

      const count = 1;
      const bag = [];
      addBonus(count, bag);
      console.log(count, bag);
      `,
    ),
    takeaway: `Reassigning a parameter only moves the inside name tag. But a method that **changes** a ${lang('list', 'array')} changes the caller's ${lang('list', 'array')} too: they share it. (Hangman will rely on this!)`,
  },
  {
    id: 'iterating-collections-3',
    conceptId: 'iterating-collections',
    title: 'Coldest Day',
    role: 'combine',
    game: 'parsons',
    mode: 'parsons',
    prompt: 'Arrange the lines to find the **coldest** temperature in the list and print `Coldest: 4`. **One line is a trap.**',
    reinforces: ['conditionals', 'loops'],
    hints: [
      'Start with a "best so far" guess, then let each temperature challenge it.',
      'The trap starts the lowest at 0. Every temperature here is above 0, so it would never be replaced!',
      'Start from a real item: the first temperature.',
    ],
    solution: code(
      `
      temps = [7, 12, 4, 9, 5]
      lowest = temps[0]
      for t in temps:
          if t < lowest:
              lowest = t
      print("Coldest:", lowest)
      `,
      `
      const temps = [7, 12, 4, 9, 5];
      let lowest = temps[0];
      for (const t of temps) {
        if (t < lowest) {
          lowest = t;
        }
      }
      console.log("Coldest:", lowest);
      `,
    ),
    distractors: { python: ['lowest = 0'], javascript: ['let lowest = 0;'] },
    tests: [{ name: 'coldest', expectedOutput: 'Coldest: 4' }],
  },
  {
    id: 'iterating-collections-4',
    conceptId: 'iterating-collections',
    title: 'Average Function',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: `Read numbers until a \`0\`, storing them in a ${lang('list', 'array')}. Then:\n\n1. Complete ${lang('`average(nums)`', '`average(nums)`')} so it **returns** the average. Add them up with a loop.\n2. Then count how many numbers are **above** the average.\n\nFor \`2\`, \`4\`, \`9\`, \`0\`:\n\n\`\`\`\nAverage: 5.00\nAbove average: 1\n\`\`\`\n\nHidden tests call \`average\` directly.`,
    reinforces: ['functions', 'return-values', 'while-loops', 'loop-control', 'loops', 'conditionals', 'input', 'type-conversion', 'string-formatting'],
    hints: [
      lang('Reading until 0: `while True:`, read `x = float(input())`, `break` if it\'s 0, otherwise `nums.append(x)`.', 'Reading until 0: `while (true)`, read `const x = Number(prompt());`, `break` if it\'s 0, otherwise `nums.push(x);`.'),
      'Average = total ÷ how many. The loop builds the total.',
      lang('`len(nums)` tells you how many.', '`nums.length` tells you how many.'),
      'For the count, loop over the list again and add 1 every time a number is bigger than the average.',
    ],
    starterCode: code(
      `
      def average(nums):
          # add up nums with a loop, then return the average
          return 0

      nums = []
      # 1. keep reading numbers (they can have decimals) into nums until a 0
      # 2. print the average like: Average: 5.00
      # 3. count how many numbers are above the average and print: Above average: 1
      `,
      `
      function average(nums) {
        // add up nums with a loop, then return the average
        return 0;
      }

      const nums = [];
      // 1. keep reading numbers into nums until a 0
      // 2. print the average like: Average: 5.00
      // 3. count how many numbers are above the average and print: Above average: 1
      `,
    ),
    solution: code(
      `
      def average(nums):
          total = 0
          for n in nums:
              total += n
          return total / len(nums)

      nums = []
      while True:
          x = float(input())
          if x == 0:
              break
          nums.append(x)

      avg = average(nums)
      print(f"Average: {avg:.2f}")
      above = 0
      for n in nums:
          if n > avg:
              above += 1
      print(f"Above average: {above}")
      `,
      `
      function average(nums) {
        let total = 0;
        for (const n of nums) {
          total += n;
        }
        return total / nums.length;
      }

      const nums = [];
      while (true) {
        const x = Number(prompt());
        if (x === 0) {
          break;
        }
        nums.push(x);
      }

      const avg = average(nums);
      console.log(\`Average: \${avg.toFixed(2)}\`);
      let above = 0;
      for (const n of nums) {
        if (n > avg) {
          above += 1;
        }
      }
      console.log(\`Above average: \${above}\`);
      `,
    ),
    requirements: {
      python: [{ pattern: '\\bsum\\(', forbid: true, message: 'Add the numbers up with a loop this time (no `sum()`).' }],
      javascript: [{ pattern: '\\.reduce\\(', forbid: true, message: 'Add the numbers up with a loop this time (no `.reduce()`).' }],
    },
    tests: [
      { name: '2, 4, 9', input: '2\n4\n9\n0', expectedOutput: 'Average: 5.00\nAbove average: 1' },
      { name: 'all the same', input: '10\n10\n0', expectedOutput: 'Average: 10.00\nAbove average: 0' },
      { name: 'average([1, 2, 3, 4])', input: '1\n0', expectedOutput: '2.5', harness: { python: 'print(average([1, 2, 3, 4]))', javascript: 'console.log(average([1, 2, 3, 4]));' }, hidden: true },
      { name: 'many numbers', input: '1\n2\n3\n4\n5\n6\n0', expectedOutput: 'Average: 3.50\nAbove average: 3', hidden: true },
    ],
  },
  {
    id: 'iterating-collections-5',
    conceptId: 'iterating-collections',
    title: 'Broken Leaderboard',
    role: 'integrate',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: 'Five scores come in; the leaderboard should show the **top 3**, highest first. For `9`, `100`, `25`, `7`, `50`:\n\n```\n1. 100\n2. 50\n3. 25\n```\n\nSomething about the sorting is broken. Find it.',
    reinforces: ['collections', 'loops', 'input', 'type-conversion', 'string-formatting'],
    hints: [
      lang('Read the error: something is `None`. Where did `scores` become `None`?', 'Look at the order after sorting: `100, 25, 50, 7, 9`. That\'s alphabetical order, as if the numbers were text!'),
      lang('`.sort()` sorts the list **in place** and returns `None`. Assigning its result throws your list away.', 'With no arguments, `.sort()` compares items as **text**. The `byNumber` helper compares them as numbers, but nobody uses it.'),
      lang('Write just `scores.sort()` on its own line.', 'Pass the helper in: `scores.sort(byNumber)`.'),
    ],
    starterCode: code(
      `
      scores = []
      for i in range(5):
          scores.append(int(input()))

      scores = scores.sort()
      scores.reverse()
      for i in range(3):
          print(f"{i + 1}. {scores[i]}")
      `,
      `
      function byNumber(a, b) {
        return a - b;
      }

      const scores = [];
      for (let i = 0; i < 5; i++) {
        scores.push(Number(prompt()));
      }

      scores.sort();
      scores.reverse();
      for (let i = 0; i < 3; i++) {
        console.log(\`\${i + 1}. \${scores[i]}\`);
      }
      `,
    ),
    solution: code(
      `
      scores = []
      for i in range(5):
          scores.append(int(input()))

      scores.sort()
      scores.reverse()
      for i in range(3):
          print(f"{i + 1}. {scores[i]}")
      `,
      `
      function byNumber(a, b) {
        return a - b;
      }

      const scores = [];
      for (let i = 0; i < 5; i++) {
        scores.push(Number(prompt()));
      }

      scores.sort(byNumber);
      scores.reverse();
      for (let i = 0; i < 3; i++) {
        console.log(\`\${i + 1}. \${scores[i]}\`);
      }
      `,
    ),
    tests: [
      { name: '9, 100, 25, 7, 50', input: '9\n100\n25\n7\n50', expectedOutput: '1. 100\n2. 50\n3. 25' },
      { name: 'another round', input: '3\n20\n100\n4\n50', expectedOutput: '1. 100\n2. 50\n3. 20', hidden: true },
    ],
    takeaway: lang(
      '`.sort()` changes the list **in place** and returns `None`, so never write `x = x.sort()`. If you want a new sorted list instead, use `sorted(x)`.',
      'With no arguments, `.sort()` compares items as **text**. Hand it a compare function to sort numbers, and pass the function itself, without brackets: `sort(byNumber)`. `sort` calls it for you.',
    ),
  },
  {
    id: 'iterating-collections-6',
    conceptId: 'iterating-collections',
    title: 'Bird Watcher',
    role: 'challenge',
    game: 'build-it',
    mode: 'freeform',
    prompt: `**Challenge.** \`birds\` holds how many birds you spotted each day of a week. Using **one loop**, work out:\n\n\`\`\`\nTotal: 19\nBusiest day: 4 (7 birds)\nZero days: 2\n\`\`\`\n\nDays are numbered from 1. No built-in shortcuts (${lang('`sum`, `max`, `.count`', '`Math.max`, `.reduce`, `.filter`')}): we'll also test a different week.`,
    reinforces: ['loops', 'conditionals', 'variables', 'string-formatting', 'operators'],
    hints: [
      'Keep three things as you go: a running total, the position of the busiest day so far, and a count of zeros.',
      'Loop over the **indexes** so you know which day you\'re on.',
      'The busiest day is index + 1 when you print it.',
    ],
    starterCode: code(
      `
      birds = [2, 5, 0, 7, 4, 0, 1]
      `,
      `
      const birds = [2, 5, 0, 7, 4, 0, 1];
      `,
    ),
    solution: code(
      `
      birds = [2, 5, 0, 7, 4, 0, 1]

      total = 0
      busiest = 0
      zero_days = 0
      for i in range(len(birds)):
          total += birds[i]
          if birds[i] > birds[busiest]:
              busiest = i
          if birds[i] == 0:
              zero_days += 1

      print(f"Total: {total}")
      print(f"Busiest day: {busiest + 1} ({birds[busiest]} birds)")
      print(f"Zero days: {zero_days}")
      `,
      `
      const birds = [2, 5, 0, 7, 4, 0, 1];

      let total = 0;
      let busiest = 0;
      let zeroDays = 0;
      for (let i = 0; i < birds.length; i++) {
        total += birds[i];
        if (birds[i] > birds[busiest]) {
          busiest = i;
        }
        if (birds[i] === 0) {
          zeroDays += 1;
        }
      }

      console.log(\`Total: \${total}\`);
      console.log(\`Busiest day: \${busiest + 1} (\${birds[busiest]} birds)\`);
      console.log(\`Zero days: \${zeroDays}\`);
      `,
    ),
    requirements: {
      python: [{ pattern: '\\b(sum|max)\\(|\\.count\\(', forbid: true, message: 'Work it out with your own loop: no `sum()`, `max()` or `.count()`.' }],
      javascript: [{ pattern: 'Math\\.max|\\.reduce\\(|\\.filter\\(', forbid: true, message: 'Work it out with your own loop: no `Math.max`, `.reduce()` or `.filter()`.' }],
    },
    tests: [{ name: 'this week', expectedOutput: 'Total: 19\nBusiest day: 4 (7 birds)\nZero days: 2' }],
    variants: [
      {
        name: 'a different week',
        replace: { python: [['[2, 5, 0, 7, 4, 0, 1]', '[3, 0, 8, 1, 0, 0]']], javascript: [['[2, 5, 0, 7, 4, 0, 1]', '[3, 0, 8, 1, 0, 0]']] },
        expectedOutput: 'Total: 12\nBusiest day: 3 (8 birds)\nZero days: 3',
      },
    ],
  },
];
