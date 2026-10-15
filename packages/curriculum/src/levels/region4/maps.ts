import type { Level } from '@codegames/shared';
import { code, grid } from '../../helpers';
import { lang } from '../../localize';
import { TURN_ROUTE } from './shared';

/** maps levels, in play order. */
export const mapsLevels: Level[] = [
  {
    id: 'maps-1',
    conceptId: 'maps',
    title: 'Item Prices',
    role: 'intro',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: `A ${lang('**dictionary**', '**object**')} stores values under **keys** instead of positions: \`"apple"\` is the key, \`3\` its value. Predict every line. The last line asks for a key that isn't there: ${lang('if the program crashes, write the **error name** (like `KeyError`) as your last line.', 'what does JavaScript give you instead of crashing?')}`,
    reinforces: ['collections'],
    hints: [
      `\`prices["apple"]\` looks up the value stored under the key \`"apple"\`. ${lang('`len(prices)`', '`Object.keys(prices).length`')} counts the keys.`,
      'Assigning to a key that already exists doesn\'t add a second "apple": it **replaces** the old value. A new key (like "milk") is added at the end.',
      lang(
        'There are 3 keys after the changes, and "milk" is one of them. "cheese" was never added, so Python stops with `KeyError`.',
        'There are 3 keys after the changes, and "milk" is one of them. "cheese" was never added, so JavaScript quietly gives `undefined`.',
      ),
    ],
    code: code(
      `
      prices = {"apple": 3, "bread": 5}
      print(prices["apple"])
      prices["milk"] = 2
      prices["apple"] = 4
      print(prices["apple"])
      print(len(prices))
      print("milk" in prices)
      print(prices)
      print(prices["cheese"])
      `,
      `
      const prices = { apple: 3, bread: 5 };
      console.log(prices["apple"]);
      prices["milk"] = 2;
      prices["apple"] = 4;
      console.log(prices["apple"]);
      console.log(Object.keys(prices).length);
      console.log("milk" in prices);
      console.log(prices);
      console.log(prices["cheese"]);
      `,
    ),
    expectError: true,
    takeaway: lang(
      '`d[key]` reads a value, `d[key] = v` adds it or **replaces** the old one, and `key in d` checks whether a key is there. Keys have no positions: you look things up by name. Reading a missing key crashes with **KeyError**.',
      '`obj[key]` reads a value, `obj[key] = v` adds it or **replaces** the old one, and `key in obj` checks whether a key is there. Keys have no positions: you look things up by name. Reading a missing key gives `undefined` instead of an error, so the bug shows up later.',
    ),
  },
  {
    id: 'maps-2',
    conceptId: 'maps',
    title: 'Dot or Bracket?',
    role: 'combine',
    game: 'predict-output',
    mode: 'hybrid',
    choices: { python: ["2\n99\nFalse\n0", "99\n99\nFalse\n0", "2\n2\nFalse\n0"], javascript: ["2\n99\nfalse\n0", "99\n99\nfalse\n0", "2\n2\nfalse\n0"] },
    prompt: `The ${lang('dictionary', 'object')} has a key that is literally called \`"item"\`, **and** there's a variable called \`item\`. Which one does each line use? Predict the output.`,
    reinforces: ['variables'],
    hints: [
      lang(
        'Brackets with a **variable** inside, `stock[item]`, look up whatever text the variable holds right now.',
        'Brackets with a **variable** inside, `stock[item]`, look up whatever text the variable holds right now.',
      ),
      lang(
        'Quotes make it literal: `stock["item"]` means the key called "item", whatever the variable says.',
        'The dot never looks at variables: `stock.item` means the key literally called "item".',
      ),
      lang(
        '"shield" isn\'t a key, so `in` gives `False`, and `.get(item, 0)` gives the default, `0`.',
        '"shield" isn\'t a key, so `in` gives `false`, and `stock[item]` is `undefined`, so `?? 0` gives `0`.',
      ),
    ],
    code: code(
      `
      stock = {"sword": 2, "item": 99}
      item = "sword"
      print(stock[item])
      print(stock["item"])
      item = "shield"
      print(item in stock)
      print(stock.get(item, 0))
      `,
      `
      const stock = { sword: 2, item: 99 };
      let item = "sword";
      console.log(stock[item]);
      console.log(stock.item);
      item = "shield";
      console.log(item in stock);
      console.log(stock[item] ?? 0);
      `,
    ),
    takeaway: lang(
      'Brackets with a variable look up the variable\'s **value**; quotes mean that exact key. To read a key that may be missing, `d.get(key, 0)` gives a default instead of crashing.',
      'Brackets with a variable look up the variable\'s **value**. `obj.name` only works for a fixed name you type. To read a key that may be missing, `obj[key] ?? 0` gives a default. And remember: arrays use `.includes(x)`, objects use `key in obj`.',
    ),
  },
  {
    id: 'maps-3',
    conceptId: 'maps',
    title: 'Turn Table',
    role: 'combine',
    game: 'grid-quest',
    mode: 'fill-blanks',
    prompt: `The robot reads a route of \`[direction, steps]\` cards. \`turns\` is a lookup table: how many **left turns** each direction needs. Fill in the missing numbers and the lookup. Only one \`move()\` and one ${lang('`turn_left()`', '`turnLeft()`')}! (We'll run the same code with another route on another map.)`,
    reinforces: ['iterating-collections', 'nested-loops', 'collections'],
    hints: [
      'Turning right is the same as turning left three times. Going straight ahead needs no turns at all.',
      'The inner loop should turn as many times as the table says for **this card\'s** direction, which is stored in `direction`.',
      lang('`"ahead": 0`, `"right": 3`, and `range(turns[direction])`.', '`ahead: 0`, `right: 3`, and `i < turns[direction]`.'),
    ],
    grid: grid(`
      #########
      ###....##
      ###.##.##
      #>..##G##
      #########
    `),
    starterCode: code(
      `
      turns = {"ahead": ___, "left": 1, "back": 2, "right": ___}
      ${TURN_ROUTE.python}

      for step in route:
          direction = step[0]
          for i in range(turns[___]):
              turn_left()
          for i in range(step[1]):
              move()
      collect()
      `,
      `
      const turns = { ahead: ___, left: 1, back: 2, right: ___ };
      ${TURN_ROUTE.javascript}

      for (const step of route) {
        const direction = step[0];
        for (let i = 0; i < turns[___]; i++) {
          turnLeft();
        }
        for (let i = 0; i < step[1]; i++) {
          move();
        }
      }
      collect();
      `,
    ),
    solution: code(
      `
      turns = {"ahead": 0, "left": 1, "back": 2, "right": 3}
      ${TURN_ROUTE.python}

      for step in route:
          direction = step[0]
          for i in range(turns[direction]):
              turn_left()
          for i in range(step[1]):
              move()
      collect()
      `,
      `
      const turns = { ahead: 0, left: 1, back: 2, right: 3 };
      ${TURN_ROUTE.javascript}

      for (const step of route) {
        const direction = step[0];
        for (let i = 0; i < turns[direction]; i++) {
          turnLeft();
        }
        for (let i = 0; i < step[1]; i++) {
          move();
        }
      }
      collect();
      `,
    ),
    routeVariants: [
      {
        name: 'a different route',
        replace: {
          python: [[TURN_ROUTE.python, 'route = [["left", 1], ["right", 2], ["right", 1], ["left", 2]]']],
          javascript: [[TURN_ROUTE.javascript, 'const route = [["left", 1], ["right", 2], ["right", 1], ["left", 2]];']],
        },
        grid: grid(`
          #######
          #...###
          #>#..G#
          #######
        `),
      },
    ],
    requirements: {
      python: [
        { pattern: '(move\\(\\)[\\s\\S]*){2}', forbid: true, message: 'Write `move()` only once: let the route cards decide how far to go.' },
        { pattern: '(turn_left\\(\\)[\\s\\S]*){2}', forbid: true, message: 'Write `turn_left()` only once: let the `turns` table decide how many turns.' },
        { pattern: 'turns\\[', message: 'Look the number of turns up in the table: `turns[direction]`.' },
        { pattern: '\\bdef\\b', forbid: true, message: 'No helper functions this time: let the table and the route do the work.' },
      ],
      javascript: [
        { pattern: '(move\\(\\)[\\s\\S]*){2}', forbid: true, message: 'Write `move()` only once: let the route cards decide how far to go.' },
        { pattern: '(turnLeft\\(\\)[\\s\\S]*){2}', forbid: true, message: 'Write `turnLeft()` only once: let the `turns` table decide how many turns.' },
        { pattern: 'turns\\[', message: 'Look the number of turns up in the table: `turns[direction]`.' },
        { pattern: '\\bfunction\\b', forbid: true, message: 'No helper functions this time: let the table and the route do the work.' },
      ],
    },
    takeaway: `A lookup table turns a **word** into a **number**: \`turns["right"]\` is 3. You can't loop ${lang('`range("right")`', '`"right"` times')}, but you can loop \`turns["right"]\` times. Tables like this replace long ${lang('if/elif', 'if/else if')} chains.`,
  },
  {
    id: 'maps-4',
    conceptId: 'maps',
    title: 'Missing Key',
    role: 'combine',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: `The shop sells what's in stock. For each order it should print \`Sold apple\`, \`Out of bread\` (we sell it, but none are left), or \`We don't sell milk\`. ${lang('Right now it crashes.', 'Right now it says "Out of milk", but the shop never sold milk!')} Fix it. (We'll test other orders too.)`,
    reinforces: ['booleans', 'else-if-chains', 'iterating-collections'],
    hints: [
      lang('Which order makes it crash? Is "milk" a key in `stock`?', 'What is `stock["milk"]`? And what is `undefined > 0`?'),
      lang('Check the key exists **before** reading it: `if item in stock and stock[item] > 0:`. `and` stops early, so the lookup only happens when the key is there.', 'Check the key exists **before** reading it: `if (item in stock && stock[item] > 0)`.'),
      lang('Then two more cases: `elif item in stock:` prints "Out of …", and `else:` prints "We don\'t sell …".', 'Then two more cases: `else if (item in stock)` prints "Out of …", and `else` prints "We don\'t sell …".'),
    ],
    starterCode: code(
      `
      stock = {"apple": 3, "bread": 1}
      orders = ["apple", "milk", "bread", "bread"]
      for item in orders:
          if stock[item] > 0:
              stock[item] -= 1
              print(f"Sold {item}")
          else:
              print(f"Out of {item}")
      `,
      `
      const stock = { apple: 3, bread: 1 };
      const orders = ["apple", "milk", "bread", "bread"];
      for (const item of orders) {
        if (stock[item] > 0) {
          stock[item] -= 1;
          console.log(\`Sold \${item}\`);
        } else {
          console.log(\`Out of \${item}\`);
        }
      }
      `,
    ),
    solution: code(
      `
      stock = {"apple": 3, "bread": 1}
      orders = ["apple", "milk", "bread", "bread"]
      for item in orders:
          if item in stock and stock[item] > 0:
              stock[item] -= 1
              print(f"Sold {item}")
          elif item in stock:
              print(f"Out of {item}")
          else:
              print(f"We don't sell {item}")
      `,
      `
      const stock = { apple: 3, bread: 1 };
      const orders = ["apple", "milk", "bread", "bread"];
      for (const item of orders) {
        if (item in stock && stock[item] > 0) {
          stock[item] -= 1;
          console.log(\`Sold \${item}\`);
        } else if (item in stock) {
          console.log(\`Out of \${item}\`);
        } else {
          console.log(\`We don't sell \${item}\`);
        }
      }
      `,
    ),
    tests: [{ name: 'four orders', expectedOutput: "Sold apple\nWe don't sell milk\nSold bread\nOut of bread" }],
    variants: [
      {
        name: 'other orders',
        replace: {
          python: [['orders = ["apple", "milk", "bread", "bread"]', 'orders = ["gum", "apple", "apple"]']],
          javascript: [['const orders = ["apple", "milk", "bread", "bread"];', 'const orders = ["gum", "apple", "apple"];']],
        },
        expectedOutput: "We don't sell gum\nSold apple\nSold apple",
      },
    ],
    takeaway: lang(
      'Check a key exists before you read it. `and` stops as soon as the left side is False, so `item in stock and stock[item] > 0` never reads a missing key.',
      'Check a key exists before you read it. `&&` stops as soon as the left side is false, so `item in stock && stock[item] > 0` never reads a missing key. Without the check JavaScript doesn\'t crash: `undefined > 0` is just `false`, and the wrong message slips through.',
    ),
  },
  {
    id: 'maps-5',
    conceptId: 'maps',
    title: 'Phone Book',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: `Commands arrive one per line: \`add NAME NUMBER\`, \`find NAME\`, \`count\`, and \`done\` to stop.\n\n1. Complete \`lookup(book, name)\` so it **returns** the number, or \`not found\`.\n2. Write the main loop. For \`find\` print \`Ada: 555-1234\`; for \`count\` print \`Contacts: 2\`.\n\nAdding a name that's already in the book replaces the old number. Hidden tests call \`lookup\` directly.`,
    reinforces: ['functions', 'return-values', 'strings', 'while-loops', 'loop-control', 'else-if-chains', 'input', 'string-formatting'],
    hints: [
      lang('Loop forever with `while True:`, read a line and split it into words: `words = input().split()`. `break` when `words[0] == "done"`.', 'Loop forever with `while (true)`, read a line and split it into words: `const words = prompt().split(" ");`. `break` when `words[0] === "done"`.'),
      'For `add`, the name is `words[1]` and the number is `words[2]`: store the number **under** the name, `book[words[1]] = words[2]`.',
      lang('In `lookup`: `if name in book: return book[name]`, then `return "not found"`. Count the contacts with `len(book)`.', 'In `lookup`: `if (name in book) { return book[name]; }`, then `return "not found";`. Count the contacts with `Object.keys(book).length`.'),
    ],
    starterCode: code(
      `
      def lookup(book, name):
          # return the number stored under name, or "not found"
          return ""

      book = {}
      # keep reading commands until "done"
      # split each line into words
      # add / find / count
      `,
      `
      function lookup(book, name) {
        // return the number stored under name, or "not found"
        return "";
      }

      const book = {};
      // keep reading commands until "done"
      // split each line into words
      // add / find / count
      `,
    ),
    solution: code(
      `
      def lookup(book, name):
          if name in book:
              return book[name]
          return "not found"

      book = {}
      while True:
          words = input().split()
          if words[0] == "done":
              break
          elif words[0] == "add":
              book[words[1]] = words[2]
          elif words[0] == "find":
              print(f"{words[1]}: {lookup(book, words[1])}")
          elif words[0] == "count":
              print(f"Contacts: {len(book)}")
      `,
      `
      function lookup(book, name) {
        if (name in book) {
          return book[name];
        }
        return "not found";
      }

      const book = {};
      while (true) {
        const words = prompt().split(" ");
        if (words[0] === "done") {
          break;
        } else if (words[0] === "add") {
          book[words[1]] = words[2];
        } else if (words[0] === "find") {
          console.log(\`\${words[1]}: \${lookup(book, words[1])}\`);
        } else if (words[0] === "count") {
          console.log(\`Contacts: \${Object.keys(book).length}\`);
        }
      }
      `,
    ),
    tests: [
      {
        name: 'add, find, replace, count',
        input: 'add Ada 555-1234\nadd Bo 555-9876\nfind Ada\nfind Cy\nadd Ada 555-0000\nfind Ada\ncount\ndone',
        expectedOutput: 'Ada: 555-1234\nCy: not found\nAda: 555-0000\nContacts: 2',
      },
      { name: 'empty book', input: 'find Zed\ndone', expectedOutput: 'Zed: not found', hidden: true },
      {
        name: 'lookup() returns the number',
        input: 'done',
        expectedOutput: '1 not found',
        harness: { python: 'print(lookup({"Zed": "1"}, "Zed"), lookup({}, "Zed"))', javascript: 'console.log(lookup({ Zed: "1" }, "Zed"), lookup({}, "Zed"));' },
        hidden: true,
      },
    ],
    takeaway: `${lang('A dictionary', 'An object')} is a phone book: look up by name, not by position. Each key appears **once**, so adding Ada again replaces her number instead of making a second Ada.`,
  },
];
