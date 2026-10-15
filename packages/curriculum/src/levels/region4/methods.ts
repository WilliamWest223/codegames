import type { Level } from '@codegames/shared';
import { code, grid } from '../../helpers';
import { lang } from '../../localize';

/** methods levels, in play order. */
export const methodsLevels: Level[] = [
  {
    id: 'methods-1',
    conceptId: 'methods',
    title: 'Feed the Pet',
    role: 'intro',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: `A **method** is a function that lives inside a class. You call it on one object: \`rex.feed()\`. Inside it, ${lang('`self`', '`this`')} is *that* object, so the method changes only rex.\n\n\`feed\` changes the pet; \`status\` **returns** a sentence about it. Predict the output.`,
    reinforces: ['classes', 'return-values'],
    hints: [
      'Both pets start with hunger 3. Count how many times each one is fed.',
      `\`rex.feed()\` runs \`feed\` with ${lang('`self`', '`this`')} = rex, so only Rex's hunger goes down.`,
      '`status()` returns a string, and the `print` around it shows that string.',
    ],
    code: code(
      `
      class Pet:
          def __init__(self, name):
              self.name = name
              self.hunger = 3

          def feed(self):
              self.hunger -= 1

          def status(self):
              return f"{self.name} hunger: {self.hunger}"

      rex = Pet("Rex")
      bo = Pet("Bo")
      rex.feed()
      rex.feed()
      bo.feed()
      print(rex.status())
      print(bo.status())
      `,
      `
      class Pet {
        constructor(name) {
          this.name = name;
          this.hunger = 3;
        }

        feed() {
          this.hunger -= 1;
        }

        status() {
          return \`\${this.name} hunger: \${this.hunger}\`;
        }
      }

      const rex = new Pet("Rex");
      const bo = new Pet("Bo");
      rex.feed();
      rex.feed();
      bo.feed();
      console.log(rex.status());
      console.log(bo.status());
      `,
    ),
    takeaway: `A **method** is a function that belongs to an object. \`rex.feed()\` runs \`feed\` with ${lang('`self`', '`this`')} = rex, so it changes only rex. Methods that **return** (like \`status\`) can be printed or stored; methods that change the object usually return nothing.${lang(' Every method lists `self` as its first parameter; Python fills it in for you.', '')}`,
  },
  {
    id: 'methods-2',
    conceptId: 'methods',
    title: 'Step Tracker',
    role: 'combine',
    game: 'grid-quest',
    mode: 'fill-blanks',
    prompt: `The robot has a pedometer! A \`Walker\` object walks for the robot **and** remembers how far it has gone in ${lang('`self.steps`', '`this.steps`')}. Fill in the blanks so the robot reaches the gem and the program prints \`Steps: 7\`, counted by the object, not typed in.`,
    reinforces: ['classes', 'functions', 'loops', 'custom-commands'],
    hints: [
      `A new walker hasn't walked yet, so ${lang('`self.steps`', '`this.steps`')} starts at 0.`,
      `\`walk(n)\` moves n squares, so it adds **n** to the count. The count lives on the object, so it remembers between calls.`,
      'The path: 3 squares, turn left, 2 squares, turn left, 2 squares, collect. The missing call is the method that walks.',
    ],
    grid: grid(`
      #######
      ##G..##
      ####.##
      #>...##
      #######
    `),
    starterCode: code(
      `
      class Walker:
          def __init__(self):
              self.steps = ___

          def walk(self, n):
              for i in range(n):
                  move()
              self.steps += ___

      w = Walker()
      w.walk(3)
      turn_left()
      w.___(2)
      turn_left()
      w.walk(2)
      collect()
      print(f"Steps: {w.steps}")
      `,
      `
      class Walker {
        constructor() {
          this.steps = ___;
        }

        walk(n) {
          for (let i = 0; i < n; i++) {
            move();
          }
          this.steps += ___;
        }
      }

      const w = new Walker();
      w.walk(3);
      turnLeft();
      w.___(2);
      turnLeft();
      w.walk(2);
      collect();
      console.log(\`Steps: \${w.steps}\`);
      `,
    ),
    solution: code(
      `
      class Walker:
          def __init__(self):
              self.steps = 0

          def walk(self, n):
              for i in range(n):
                  move()
              self.steps += n

      w = Walker()
      w.walk(3)
      turn_left()
      w.walk(2)
      turn_left()
      w.walk(2)
      collect()
      print(f"Steps: {w.steps}")
      `,
      `
      class Walker {
        constructor() {
          this.steps = 0;
        }

        walk(n) {
          for (let i = 0; i < n; i++) {
            move();
          }
          this.steps += n;
        }
      }

      const w = new Walker();
      w.walk(3);
      turnLeft();
      w.walk(2);
      turnLeft();
      w.walk(2);
      collect();
      console.log(\`Steps: \${w.steps}\`);
      `,
    ),
    expectedOutput: 'Steps: 7',
    requirements: {
      python: [
        { pattern: '(move\\(\\)[\\s\\S]*){2}', forbid: true, message: 'Write `move()` only once: let the walker do the walking.' },
        { pattern: 'Steps: \\d|\\b7\\b', forbid: true, message: 'Don\'t type the number: print the count the walker kept.' },
        { pattern: 'self\\.steps', message: 'Keep the count on the object, in `self.steps`.' },
        { pattern: 'self\\.steps\\s*=\\s*0\\b', message: 'A new walker hasn\'t walked yet: start `self.steps` at 0.' },
        { pattern: 'self\\.steps\\s*\\+=\\s*n\\b', message: 'Add the steps this walk actually took: `self.steps += n`.' },
      ],
      javascript: [
        { pattern: '(move\\(\\)[\\s\\S]*){2}', forbid: true, message: 'Write `move()` only once: let the walker do the walking.' },
        { pattern: 'Steps: \\d|\\b7\\b', forbid: true, message: 'Don\'t type the number: print the count the walker kept.' },
        { pattern: 'this\\.steps', message: 'Keep the count on the object, in `this.steps`.' },
        { pattern: 'this\\.steps\\s*=\\s*0\\b', message: 'A new walker hasn\'t walked yet: start `this.steps` at 0.' },
        { pattern: 'this\\.steps\\s*\\+=\\s*n\\b', message: 'Add the steps this walk actually took: `this.steps += n`.' },
      ],
    },
    takeaway: `An object **remembers** between method calls: each \`walk\` adds to the same ${lang('`self.steps`', '`this.steps`')}. A plain function would forget its local variables after every call.`,
  },
  {
    id: 'methods-3',
    conceptId: 'methods',
    title: 'Missing Self',
    role: 'combine',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: `The bag can't reach its own items. Read items until \`done\`, then print \`Items in bag: 2\` (for \`rope\`, \`lamp\`, \`done\`). ${lang('There are **two** bugs, both about `self`.', 'Find the bug in the methods: JavaScript can\'t find `items`.')} Hidden tests use two bags at once.`,
    reinforces: ['classes', 'scope', 'collections', 'while-loops', 'loop-control', 'input'],
    hints: [
      `Inside a method, a bare \`items\` is a local variable that doesn't exist. The bag's list is ${lang('`self.items`', '`this.items`')}.`,
      lang('Every method needs `self` as its first parameter, even when it takes nothing else: `def count(self):`.', 'Fix both methods: `this.items.push(item);` and `return this.items.length;`.'),
    ],
    starterCode: code(
      `
      class Bag:
          def __init__(self):
              self.items = []

          def add(self, item):
              items.append(item)

          def count():
              return len(self.items)

      bag = Bag()
      while True:
          item = input()
          if item == "done":
              break
          bag.add(item)
      print(f"Items in bag: {bag.count()}")
      `,
      `
      class Bag {
        constructor() {
          this.items = [];
        }

        add(item) {
          items.push(item);
        }

        count() {
          return items.length;
        }
      }

      const bag = new Bag();
      while (true) {
        const item = prompt();
        if (item === "done") {
          break;
        }
        bag.add(item);
      }
      console.log(\`Items in bag: \${bag.count()}\`);
      `,
    ),
    solution: code(
      `
      class Bag:
          def __init__(self):
              self.items = []

          def add(self, item):
              self.items.append(item)

          def count(self):
              return len(self.items)

      bag = Bag()
      while True:
          item = input()
          if item == "done":
              break
          bag.add(item)
      print(f"Items in bag: {bag.count()}")
      `,
      `
      class Bag {
        constructor() {
          this.items = [];
        }

        add(item) {
          this.items.push(item);
        }

        count() {
          return this.items.length;
        }
      }

      const bag = new Bag();
      while (true) {
        const item = prompt();
        if (item === "done") {
          break;
        }
        bag.add(item);
      }
      console.log(\`Items in bag: \${bag.count()}\`);
      `,
    ),
    tests: [
      { name: 'rope and lamp', input: 'rope\nlamp\ndone', expectedOutput: 'Items in bag: 2' },
      { name: 'an empty bag', input: 'done', expectedOutput: 'Items in bag: 0', hidden: true },
      {
        name: 'two bags keep their own items',
        input: 'done',
        expectedOutput: '1 0',
        hidden: true,
        harness: {
          python: '_a = Bag()\n_b = Bag()\n_a.add("x")\nprint(_a.count(), _b.count())',
          javascript: 'const _a = new Bag();\nconst _b = new Bag();\n_a.add("x");\nconsole.log(_a.count(), _b.count());',
        },
      },
    ],
    takeaway: lang(
      'Inside a method, the object\'s data is always `self.something`, never the bare name. And every method takes `self` first, even if it needs nothing else.',
      'Inside a method, the object\'s data is always `this.something`, never the bare name.',
    ),
  },
  {
    id: 'methods-4',
    conceptId: 'methods',
    title: 'Shopping Cart',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: `Receipt Printer, as an object! Read lines \`NAME PRICE\` until \`done\`. Complete \`Cart\`:\n\n- it keeps the names in ${lang('`self.items`', '`this.items`')} and the prices in ${lang('`self.prices`', '`this.prices`')}\n- \`add(name, price)\` stores one item\n- \`total()\` **returns** the sum of the prices\n\nThen print each item and the total, to 2 decimals:\n\n\`\`\`\napple: $1.50\nbread: $2.25\nTotal: $3.75\n\`\`\`\n\nHidden tests use two carts at once.`,
    reinforces: ['classes', 'collections', 'iterating-collections', 'strings', 'return-values', 'while-loops', 'loop-control', 'input', 'type-conversion', 'string-formatting'],
    hints: [
      lang('Make both lists in `__init__`: `self.items = []` and `self.prices = []`. (Not above `__init__`: a list there is shared by every cart!)', 'Make both arrays in the constructor: `this.items = [];` and `this.prices = [];`.'),
      `\`add\` appends to both lists; \`total\` loops over ${lang('`self.prices`', '`this.prices`')}, adds them up and **returns** the sum.`,
      lang('Split each line: `parts = line.split()`, then `cart.add(parts[0], float(parts[1]))`. Print with `f"{name}: ${price:.2f}"`.', 'Split each line: `const parts = line.split(" ");`, then `cart.add(parts[0], Number(parts[1]));`. Print with `price.toFixed(2)`.'),
    ],
    starterCode: code(
      `
      class Cart:
          def __init__(self):
              # start with an empty list of names and an empty list of prices
              pass

          def add(self, name, price):
              # remember this item and its price
              pass

          def total(self):
              # add up the prices and return the sum
              return 0

      cart = Cart()
      # 1. read "NAME PRICE" lines until "done" and add each to the cart
      # 2. print each item, like  apple: $1.50
      # 3. print the total, like  Total: $3.75
      `,
      `
      class Cart {
        constructor() {
          // start with an empty array of names and an empty array of prices
        }

        add(name, price) {
          // remember this item and its price
        }

        total() {
          // add up the prices and return the sum
          return 0;
        }
      }

      const cart = new Cart();
      // 1. read "NAME PRICE" lines until "done" and add each to the cart
      // 2. print each item, like  apple: $1.50
      // 3. print the total, like  Total: $3.75
      `,
    ),
    solution: code(
      `
      class Cart:
          def __init__(self):
              self.items = []
              self.prices = []

          def add(self, name, price):
              self.items.append(name)
              self.prices.append(price)

          def total(self):
              result = 0
              for p in self.prices:
                  result += p
              return result

      cart = Cart()
      while True:
          line = input()
          if line == "done":
              break
          parts = line.split()
          cart.add(parts[0], float(parts[1]))

      for i in range(len(cart.items)):
          print(f"{cart.items[i]}: \${cart.prices[i]:.2f}")
      print(f"Total: \${cart.total():.2f}")
      `,
      `
      class Cart {
        constructor() {
          this.items = [];
          this.prices = [];
        }

        add(name, price) {
          this.items.push(name);
          this.prices.push(price);
        }

        total() {
          let result = 0;
          for (const p of this.prices) {
            result += p;
          }
          return result;
        }
      }

      const cart = new Cart();
      while (true) {
        const line = prompt();
        if (line === "done") {
          break;
        }
        const parts = line.split(" ");
        cart.add(parts[0], Number(parts[1]));
      }

      for (let i = 0; i < cart.items.length; i++) {
        console.log(\`\${cart.items[i]}: $\${cart.prices[i].toFixed(2)}\`);
      }
      console.log(\`Total: $\${cart.total().toFixed(2)}\`);
      `,
    ),
    requirements: {
      python: [{ pattern: '\\.total\\(\\)', message: 'Print the total that `cart.total()` returns.' }],
      javascript: [{ pattern: '\\.total\\(\\)', message: 'Print the total that `cart.total()` returns.' }],
    },
    tests: [
      {
        name: 'your cart holds the items',
        input: 'tea 2.5\ncake 3\ndone',
        expectedOutput: '2 5.50',
        hidden: true,
        // State probe: the program's own cart must have been used, not lists in the main loop.
        harness: { python: 'print(len(cart.items), f"{cart.total():.2f}")', javascript: 'console.log(cart.items.length, cart.total().toFixed(2));' },
      },
      { name: 'apple and bread', input: 'apple 1.5\nbread 2.25\ndone', expectedOutput: 'apple: $1.50\nbread: $2.25\nTotal: $3.75' },
      { name: 'three items', input: 'milk 0.99\neggs 3\njam 4.5\ndone', expectedOutput: 'milk: $0.99\neggs: $3.00\njam: $4.50\nTotal: $8.49', hidden: true },
      { name: 'an empty cart', input: 'done', expectedOutput: 'Total: $0.00', hidden: true },
      {
        name: 'two carts keep their own items',
        input: 'done',
        expectedOutput: '5.50 0',
        hidden: true,
        harness: {
          python: '_a = Cart()\n_b = Cart()\n_a.add("pen", 2)\n_a.add("pad", 3.5)\nprint(f"{_a.total():.2f}", len(_b.items))',
          javascript: 'const _a = new Cart();\nconst _b = new Cart();\n_a.add("pen", 2);\n_a.add("pad", 3.5);\nconsole.log(_a.total().toFixed(2), _b.items.length);',
        },
      },
    ],
    takeaway: lang(
      'A method that **returns** (`total()`) is easy to reuse: print it, format it, or compare it. And create each object\'s lists **in `__init__`**: a list written at class level is shared by every cart.',
      'A method that **returns** (`total()`) is easy to reuse: print it, format it, or compare it. Each object gets its own arrays because the constructor makes new ones every time.',
    ),
  },
  {
    id: 'methods-5',
    conceptId: 'methods',
    title: 'Tally Class',
    role: 'challenge',
    game: 'build-it',
    mode: 'freeform',
    prompt: `Write a \`Tally\` class that hides a counting ${lang('dictionary', 'object')} inside it:\n\n- \`add(word)\` counts one more of that word\n- \`count(word)\` returns how many times it was added (**0** if never)\n- \`top()\` returns the word added most often (on a tie, the one added first)\n\nThe main program is written for you. For \`the cat the dog the end\` it prints:\n\n\`\`\`\nthe 3\n0\n\`\`\``,
    reinforces: ['classes', 'maps', 'map-patterns', 'strings', 'iterating-collections', 'conditionals', 'input'],
    hints: [
      lang('Make the dictionary in `__init__`: `self.counts = {}`.', 'Make the object in the constructor: `this.counts = {};`.'),
      lang('Counting is the Count pattern: `self.counts[word] = self.counts.get(word, 0) + 1`. `count` can use `.get(word, 0)` too.', 'Counting is the Count pattern: `this.counts[word] = (this.counts[word] ?? 0) + 1;`. `count` can use `?? 0` too.'),
      `For \`top\`, loop over the keys with "best so far", and only swap on a **bigger** count, so the first word wins a tie.`,
    ],
    starterCode: code(
      `
      class Tally:
          # make the counting dictionary in __init__,
          # then write add(word), count(word) and top()
          pass

      t = Tally()
      for w in input().split():
          t.add(w)
      print(t.top(), t.count(t.top()))
      print(t.count("zebra"))
      `,
      `
      class Tally {
        // make the counting object in the constructor,
        // then write add(word), count(word) and top()
      }

      const t = new Tally();
      for (const w of prompt().split(" ")) {
        t.add(w);
      }
      console.log(t.top(), t.count(t.top()));
      console.log(t.count("zebra"));
      `,
    ),
    solution: code(
      `
      class Tally:
          def __init__(self):
              self.counts = {}

          def add(self, word):
              self.counts[word] = self.counts.get(word, 0) + 1

          def count(self, word):
              return self.counts.get(word, 0)

          def top(self):
              best = ""
              for word in self.counts:
                  if best == "" or self.counts[word] > self.counts[best]:
                      best = word
              return best

      t = Tally()
      for w in input().split():
          t.add(w)
      print(t.top(), t.count(t.top()))
      print(t.count("zebra"))
      `,
      `
      class Tally {
        constructor() {
          this.counts = {};
        }

        add(word) {
          this.counts[word] = (this.counts[word] ?? 0) + 1;
        }

        count(word) {
          return this.counts[word] ?? 0;
        }

        top() {
          let best = "";
          for (const word in this.counts) {
            if (best === "" || this.counts[word] > this.counts[best]) {
              best = word;
            }
          }
          return best;
        }
      }

      const t = new Tally();
      for (const w of prompt().split(" ")) {
        t.add(w);
      }
      console.log(t.top(), t.count(t.top()));
      console.log(t.count("zebra"));
      `,
    ),
    requirements: {
      python: [{ pattern: 'class\\s+Tally', message: 'Write a `Tally` class.' }],
      javascript: [{ pattern: 'class\\s+Tally', message: 'Write a `Tally` class.' }],
    },
    tests: [
      { name: 'the cat the dog the end', input: 'the cat the dog the end', expectedOutput: 'the 3\n0' },
      { name: 'a tie goes to the first word', input: 'red blue blue red green', expectedOutput: 'red 2\n0', hidden: true },
      {
        name: 'a Tally used by hidden code',
        input: 'hello',
        expectedOutput: '2 1 0 b',
        hidden: true,
        harness: {
          python: '_t = Tally()\n_t.add("b")\n_t.add("a")\n_t.add("b")\nprint(_t.count("b"), _t.count("a"), _t.count("z"), _t.top())',
          javascript: 'const _t = new Tally();\n_t.add("b");\n_t.add("a");\n_t.add("b");\nconsole.log(_t.count("b"), _t.count("a"), _t.count("z"), _t.top());',
        },
      },
    ],
    takeaway: `The counting ${lang('dictionary', 'object')} is now hidden behind three methods. Code that uses a \`Tally\` never touches it directly, so you could change how it counts without breaking anyone.`,
  },
];
