import type { Level } from '@codegames/shared';
import { code } from '../../helpers';
import { lang } from '../../localize';

/** closures levels, in play order. */
export const closuresLevels: Level[] = [
  {
    id: 'closures-1',
    conceptId: 'closures',
    title: 'Make a Counter',
    role: 'intro',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: 'A function can **build and return another function**. The inner function remembers the variables around it, even after the outer function has finished. That\'s a **closure**. Which output is right?',
    reinforces: ['scope'],
    choices: {
      python: ['1\n2\n1\n3', '1\n2\n3\n4', '1\n1\n1\n1', '1\n2\n1\n2'],
      javascript: ['1\n2\n1\n3', '1\n2\n3\n4', '1\n1\n1\n1', '1\n2\n1\n2'],
    },
    hints: [
      lang(
        'Each call to `make_counter()` runs it again: a fresh `count = 0` and a fresh `tick`.',
        'Each call to `makeCounter()` runs it again: a fresh `count = 0` and a fresh `tick`.',
      ),
      '`a` and `b` each remember **their own** `count`.',
      lang(
        '`nonlocal count` lets `tick` change the `count` from the function around it.',
        '`tick` changes the `count` from the function around it: it isn\'t a new variable.',
      ),
    ],
    code: code(
      `
      def make_counter():
          count = 0
          def tick():
              nonlocal count
              count += 1
              return count
          return tick

      a = make_counter()
      b = make_counter()
      print(a())
      print(a())
      print(b())
      print(a())
      `,
      `
      function makeCounter() {
        let count = 0;
        function tick() {
          count += 1;
          return count;
        }
        return tick;
      }

      const a = makeCounter();
      const b = makeCounter();
      console.log(a());
      console.log(a());
      console.log(b());
      console.log(a());
      `,
    ),
    takeaway: lang(
      'A **closure** is a function plus the variables it remembers from where it was made. Every `make_counter()` call makes a new `count`, so `a` and `b` count separately. To *change* a remembered variable, the inner function says `nonlocal count`; just reading it needs nothing.',
      'A **closure** is a function plus the variables it remembers from where it was made. Every `makeCounter()` call makes a new `count`, so `a` and `b` count separately, and `count` stays private: nothing outside can touch it.',
    ),
  },
  {
    id: 'closures-2',
    conceptId: 'closures',
    title: 'Score Keeper',
    role: 'combine',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: `${lang('`make_scorer(bonus)`', '`makeScorer(bonus)`')} should return a function that adds \`points + bonus\` to a **running** total and returns the total. With bonus 2 and points 10, 5, 20 it should print \`12\`, \`19\`, \`41\`.\n\n${lang('It crashes. Read the error: which variable, and where?', 'It prints `12`, `7`, `22`: the total never grows. Where does it start from 0?')}`,
    reinforces: ['scope', 'functions', 'type-conversion'],
    hints: [
      lang(
        '`total += ...` inside `add` makes Python treat `total` as a brand-new local variable of `add`, with no value yet.',
        '`let total = 0;` is inside `add`, so every call makes a brand-new total.',
      ),
      lang(
        'Tell Python you mean the outer one: put `nonlocal total` as the first line of `add`.',
        'The total must live **outside** `add` but inside `makeScorer`, so it is made once per scorer and remembered.',
      ),
    ],
    starterCode: code(
      `
      def make_scorer(bonus):
          total = 0
          def add(points):
              total += points + bonus
              return total
          return add

      player = make_scorer(int(input()))
      for points in [10, 5, 20]:
          print(player(points))
      `,
      `
      function makeScorer(bonus) {
        function add(points) {
          let total = 0;
          total += points + bonus;
          return total;
        }
        return add;
      }

      const player = makeScorer(Number(prompt()));
      for (const points of [10, 5, 20]) {
        console.log(player(points));
      }
      `,
    ),
    solution: code(
      `
      def make_scorer(bonus):
          total = 0
          def add(points):
              nonlocal total
              total += points + bonus
              return total
          return add

      player = make_scorer(int(input()))
      for points in [10, 5, 20]:
          print(player(points))
      `,
      `
      function makeScorer(bonus) {
        let total = 0;
        function add(points) {
          total += points + bonus;
          return total;
        }
        return add;
      }

      const player = makeScorer(Number(prompt()));
      for (const points of [10, 5, 20]) {
        console.log(player(points));
      }
      `,
    ),
    tests: [
      { name: 'bonus 2', input: '2', expectedOutput: '12\n19\n41' },
      { name: 'bonus 0', input: '0', expectedOutput: '10\n15\n35', hidden: true },
      {
        name: 'two scorers keep separate totals',
        input: '0',
        hidden: true,
        expectedOutput: '10 6',
        harness: code(
          `
          _a = make_scorer(0)
          _b = make_scorer(1)
          _a(5)
          print(_a(5), _b(5))
          `,
          `
          const _a = makeScorer(0);
          const _b = makeScorer(1);
          _a(5);
          console.log(_a(5), _b(5));
          `,
        ),
      },
    ],
    takeaway: lang(
      'Assigning to a name inside a function (`total += ...`) makes it **local** to that function, unless you say `nonlocal total` (for an enclosing function) or `global total` (for the whole program; avoid it). That\'s why the error said the variable had no value yet.',
      'Where a `let` sits decides how long the variable lives. Inside `add`, it is reborn on every call. One level up, inside `makeScorer`, it is made once per scorer and the closure keeps it alive.',
    ),
  },
  {
    id: 'closures-3',
    conceptId: 'closures',
    title: 'Price Rules',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: `A shop applies discount rules **in order**. The first input line is the price; then rule lines until \`done\`:\n- \`percent N\`: N% off\n- \`minus N\`: N off, but never below 0\n\nAnything else prints \`Unknown rule: WORD\` and is skipped. Then print the number of rules and the final price with 2 decimals:\n\n\`\`\`\nRules: 2\nFinal: 25.00\n\`\`\`\n\nWrite two **rule makers** that return functions: ${lang('`make_percent_off(p)` and `make_minus(n)`', '`makePercentOff(p)` and `makeMinus(n)`')}. Store the rules you build in a list, then apply them all to the price at the end.`,
    reinforces: ['functions', 'collections', 'while-loops', 'else-if-chains', 'input', 'type-conversion', 'string-formatting', 'higher-order-functions'],
    hints: [
      lang(
        'A rule maker defines a function inside and returns it: `def make_minus(n):` / `    def rule(price):` / `        return max(0, price - n)` / `    return rule`.',
        'A rule maker returns a function: `function makeMinus(n) { return (price) => Math.max(0, price - n); }`.',
      ),
      'Each rule remembers its own `n` or `p`: that\'s the closure doing the work.',
      lang('At the end: `for rule in rules: price = rule(price)`.', 'At the end: `for (const rule of rules) { price = rule(price); }`.'),
    ],
    starterCode: code(
      `
      # 1. Rule makers: each returns a function that takes a price and returns the new price.
      def make_percent_off(p):
          pass

      def make_minus(n):
          pass

      price = float(input())
      rules = []
      # 2. Read rule lines until "done"; build a rule for each and add it to the list.

      # 3. Apply every rule in order, then print the results.
      `,
      `
      // 1. Rule makers: each returns a function that takes a price and returns the new price.
      function makePercentOff(p) {
      }

      function makeMinus(n) {
      }

      let price = Number(prompt());
      const rules = [];
      // 2. Read rule lines until "done"; build a rule for each and add it to the list.

      // 3. Apply every rule in order, then print the results.
      `,
    ),
    solution: code(
      `
      def make_percent_off(p):
          def rule(price):
              return price * (100 - p) / 100
          return rule

      def make_minus(n):
          def rule(price):
              return max(0, price - n)
          return rule

      price = float(input())
      rules = []
      while True:
          words = input().split()
          if words[0] == "done":
              break
          elif words[0] == "percent":
              rules.append(make_percent_off(int(words[1])))
          elif words[0] == "minus":
              rules.append(make_minus(int(words[1])))
          else:
              print(f"Unknown rule: {words[0]}")

      for rule in rules:
          price = rule(price)
      print(f"Rules: {len(rules)}")
      print(f"Final: {price:.2f}")
      `,
      `
      function makePercentOff(p) {
        return (price) => (price * (100 - p)) / 100;
      }

      function makeMinus(n) {
        return (price) => Math.max(0, price - n);
      }

      let price = Number(prompt());
      const rules = [];
      while (true) {
        const words = prompt().split(" ");
        if (words[0] === "done") {
          break;
        } else if (words[0] === "percent") {
          rules.push(makePercentOff(Number(words[1])));
        } else if (words[0] === "minus") {
          rules.push(makeMinus(Number(words[1])));
        } else {
          console.log(\`Unknown rule: \${words[0]}\`);
        }
      }

      for (const rule of rules) {
        price = rule(price);
      }
      console.log(\`Rules: \${rules.length}\`);
      console.log(\`Final: \${price.toFixed(2)}\`);
      `,
    ),
    tests: [
      { name: 'percent, then minus', input: '40\npercent 25\nminus 5\ndone', expectedOutput: 'Rules: 2\nFinal: 25.00' },
      { name: 'order matters', input: '40\nminus 5\npercent 25\ndone', expectedOutput: 'Rules: 2\nFinal: 26.25' },
      { name: 'never below zero, unknown rules skipped', input: '10\nminus 30\nbogus 1\ndone', expectedOutput: 'Unknown rule: bogus\nRules: 1\nFinal: 0.00', hidden: true },
      {
        name: 'each rule remembers its own number',
        input: '1\ndone',
        hidden: true,
        expectedOutput: { python: 'True True 3', javascript: 'true true 3' },
        harness: code(
          `
          _f = make_percent_off(50)
          _g = make_percent_off(10)
          print(_f(80) == 40, _g(80) == 72, make_minus(2)(5))
          `,
          `
          const _f = makePercentOff(50);
          const _g = makePercentOff(10);
          console.log(_f(80) === 40, _g(80) === 72, makeMinus(2)(5));
          `,
        ),
      },
    ],
    takeaway: 'Functions that **make** functions let you turn data (`percent 25`) into behavior once, then run it later, as many times as you like. Each rule carries its own number with it. Real shops, games and web apps store "what to do later" this way: event handlers, settings, undo steps.',
  },
];
