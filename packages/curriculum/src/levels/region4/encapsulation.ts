import type { Level } from '@codegames/shared';
import { code, dedent } from '../../helpers';
import { lang } from '../../localize';
import { codeWithToInt, ENCAPSULATION_2_START, MACHINE_SOLUTION } from './shared';

/** encapsulation levels, in play order. */
export const encapsulationLevels: Level[] = [
  {
    id: 'encapsulation-1',
    conceptId: 'encapsulation',
    title: 'Guarded Account',
    role: 'intro',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: `An object can **guard its own rules**. This account refuses to go below zero: \`withdraw\` ${lang('raises a `ValueError`', 'throws an `Error`')} instead of taking money that isn't there. The main program catches it and reads its message with ${lang('`except ValueError as err:` and prints `err`', '`catch (err)` and `err.message`')}.\n\nThe balance is ${lang('`_balance`: the underscore means *hands off, use the methods*', '`#balance`: the `#` makes it **private**, so only the class\'s own methods can touch it')}. Predict the output.`,
    reinforces: ['methods', 'error-handling'],
    hints: [
      'Start: 0, then a deposit of 50. Now follow the three withdrawals in order.',
      `When ${lang('`raise`', '`throw`')} runs, \`withdraw\` stops at once: the balance doesn't change, and the \`"took"\` line is skipped. The program jumps to ${lang('`except`', '`catch`')}.`,
      '50 − 20 leaves 30. Is 40 more than 30?',
    ],
    code: code(
      `
      class Account:
          def __init__(self, owner):
              self.owner = owner
              self._balance = 0

          def deposit(self, amount):
              if amount <= 0:
                  raise ValueError("deposit must be positive")
              self._balance += amount

          def withdraw(self, amount):
              if amount > self._balance:
                  raise ValueError("not enough money")
              self._balance -= amount

          def get_balance(self):
              return self._balance

      acc = Account("Ada")
      acc.deposit(50)
      for amount in [20, 40, 10]:
          try:
              acc.withdraw(amount)
              print("took", amount)
          except ValueError as err:
              print("refused:", err)
      print(acc.get_balance())
      `,
      `
      class Account {
        #balance = 0;

        constructor(owner) {
          this.owner = owner;
        }

        deposit(amount) {
          if (amount <= 0) {
            throw new Error("deposit must be positive");
          }
          this.#balance += amount;
        }

        withdraw(amount) {
          if (amount > this.#balance) {
            throw new Error("not enough money");
          }
          this.#balance -= amount;
        }

        getBalance() {
          return this.#balance;
        }
      }

      const acc = new Account("Ada");
      acc.deposit(50);
      for (const amount of [20, 40, 10]) {
        try {
          acc.withdraw(amount);
          console.log("took", amount);
        } catch (err) {
          console.log("refused:", err.message);
        }
      }
      console.log(acc.getBalance());
      `,
    ),
    takeaway: lang(
      '**Encapsulation:** the object guards its own rules. Other code asks through methods (`withdraw`, `get_balance`) instead of changing the data directly. In Python, `_balance` means *hands off* by agreement; Python won\'t stop you, so it\'s up to you to respect it.',
      '**Encapsulation:** the object guards its own rules. Other code asks through methods (`withdraw`, `getBalance`) instead of changing the data directly. In JavaScript, `#balance` is truly private: code outside the class can\'t even read it.',
    ),
  },
  {
    id: 'encapsulation-2',
    conceptId: 'encapsulation',
    title: 'Reach Around',
    role: 'combine',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: `The shop buys three things for 4, 9 and 3 coins. The input is how many coins the wallet starts with. It must never overspend: when the wallet can't pay, print \`Can't afford N\` instead.\n\n${lang('Right now the shop reaches around the wallet and changes `_coins` itself, so it ends up with **negative** coins.', 'Right now the shop reaches around the wallet and changes `#coins` itself, and JavaScript won\'t even run it.')} Go through the wallet's \`pay\` method instead.`,
    reinforces: ['methods', 'error-handling', 'iterating-collections', 'input', 'string-formatting'],
    hints: [
      `The rule "never overspend" lives in \`pay\`: it ${lang('raises', 'throws')} when the price is too high. Call it instead of changing the coins yourself.`,
      lang('Put `wallet.pay(price)` and the `Bought for` line inside `try:`, and print `Can\'t afford` in `except ValueError:`.', 'Put `wallet.pay(price);` and the `Bought for` line inside `try { }`, and print `Can\'t afford` in `catch (err) { }`.'),
    ],
    starterCode: ENCAPSULATION_2_START,
    solution: code(
      `
      class Wallet:
          def __init__(self, coins):
              self._coins = coins

          def pay(self, price):
              if price > self._coins:
                  raise ValueError("not enough coins")
              self._coins -= price

          def coins(self):
              return self._coins

      wallet = Wallet(int(input()))
      for price in [4, 9, 3]:
          try:
              wallet.pay(price)
              print(f"Bought for {price}")
          except ValueError:
              print(f"Can't afford {price}")
      print(f"Coins left: {wallet.coins()}")
      `,
      `
      class Wallet {
        #coins;

        constructor(coins) {
          this.#coins = coins;
        }

        pay(price) {
          if (price > this.#coins) {
            throw new Error("not enough coins");
          }
          this.#coins -= price;
        }

        coins() {
          return this.#coins;
        }
      }

      const wallet = new Wallet(Number(prompt()));
      for (const price of [4, 9, 3]) {
        try {
          wallet.pay(price);
          console.log(\`Bought for \${price}\`);
        } catch (err) {
          console.log(\`Can't afford \${price}\`);
        }
      }
      console.log(\`Coins left: \${wallet.coins()}\`);
      `,
    ),
    requirements: {
      python: [{ pattern: '\\b(?!self\\b)[a-z_]\\w*\\._[a-z]\\w*', forbid: true, message: 'Only the object\'s own methods should touch its `_private` data: call a method instead.' }, { pattern: '\\b(?!self\\b)\\w+\\s*\\.\\s*_coins', forbid: true, message: 'Leave `_coins` to the wallet\'s own methods: call `wallet.pay(price)` and `wallet.coins()` instead.' }],
      javascript: [{ pattern: '\\x23coins', message: 'Keep the coins private in `#coins`, so only the wallet\'s own methods can change them.' }, { pattern: '\\b(?!this\\b)\\w+\\s*\\.\\s*\\x23coins', forbid: true, message: 'Only the wallet\'s own methods can touch `#coins`: call `wallet.pay(price)` and `wallet.coins()` instead.' }],
    },
    tests: [
      { name: '10 coins', input: '10', expectedOutput: 'Bought for 4\nCan\'t afford 9\nBought for 3\nCoins left: 3' },
      { name: 'only 2 coins', input: '2', expectedOutput: 'Can\'t afford 4\nCan\'t afford 9\nCan\'t afford 3\nCoins left: 2', hidden: true },
      { name: 'exactly enough', input: '16', expectedOutput: 'Bought for 4\nBought for 9\nBought for 3\nCoins left: 0', hidden: true },
      {
        name: 'pay itself refuses an overspend',
        input: '0',
        expectedOutput: 'refused 5',
        hidden: true,
        harness: {
          python: dedent(`
            _w = Wallet(5)
            try:
                _w.pay(9)
                print("paid", _w.coins())
            except ValueError:
                print("refused", _w.coins())
          `),
          javascript: dedent(`
            const _w = new Wallet(5);
            try {
              _w.pay(9);
              console.log("paid", _w.coins());
            } catch (_e) {
              console.log("refused", _w.coins());
            }
          `),
        },
      },
    ],
    takeaway: lang(
      'Python trusts you not to touch `_coins`; it ran, and quietly broke the rule. Go through the method: that\'s where the rule lives. (JavaScript would have refused to run with `#coins`.)',
      'JavaScript enforces `#coins`: code outside the class can\'t touch it at all. (Python\'s `_coins` is only a polite sign, and the same reach-around would quietly overspend.) Either way, go through the method: that\'s where the rule lives.',
    ),
  },
  {
    id: 'encapsulation-3',
    conceptId: 'encapsulation',
    title: 'Valid From Birth',
    role: 'combine',
    game: 'build-it',
    mode: 'fill-blanks',
    prompt: `A \`Pet\` should refuse to be born wrong. ${lang('`Pet(name, age)`', '`new Pet(name, age)`')} must refuse an empty name with \`a pet needs a name\`, and a negative age with \`age can't be negative\`.\n\nRead \`NAME, AGE\` lines until \`done\`. Print \`Skipped: <reason>\` for bad ones, then list the good pets:\n\n\`\`\`\nSkipped: a pet needs a name\nSkipped: age can't be negative\nRex is 3\nBo is 5\n\`\`\`\n\n(for \`Rex, 3\`, \`, 2\`, \`Tom, -1\`, \`Bo, 5\`, \`done\`). Fill in the blanks.`,
    reinforces: ['methods', 'error-handling', 'strings', 'while-loops', 'loop-control', 'input', 'type-conversion'],
    hints: [
      `A check that fails should ${lang('`raise ValueError("...")`', '`throw new Error("...")`')} with the exact reason. That stops the ${lang('`__init__`', 'constructor')}, so the bad pet is never made.`,
      lang('To read the reason, name the error: `except ValueError as err:`, then print `err` inside the f-string.', 'The reason is the error\'s message: `err.message`.'),
      lang('The blanks: `raise ValueError("a pet needs a name")`, `raise ValueError("age can\'t be negative")`, `as err`, and `err`.', 'The blanks: `throw new Error("a pet needs a name")`, `throw new Error("age can\'t be negative")`, and `err.message`.'),
    ],
    starterCode: codeWithToInt(
      `
      class Pet:
          def __init__(self, name, age):
              if name == "":
                  ___
              if age < 0:
                  ___
              self.name = name
              self.age = age

      pets = []
      while True:
          line = input()
          if line == "done":
              break
          parts = line.split(",")
          try:
              pets.append(Pet(parts[0].strip(), int(parts[1])))
          except ValueError ___:
              print(f"Skipped: {___}")
      for pet in pets:
          print(f"{pet.name} is {pet.age}")
      `,
      `
      class Pet {
        constructor(name, age) {
          if (name === "") {
            ___
          }
          if (age < 0) {
            ___
          }
          this.name = name;
          this.age = age;
        }
      }

      const pets = [];
      while (true) {
        const line = prompt();
        if (line === "done") {
          break;
        }
        const parts = line.split(",");
        try {
          pets.push(new Pet(parts[0].trim(), toInt(parts[1])));
        } catch (err) {
          console.log(\`Skipped: \${___}\`);
        }
      }
      for (const pet of pets) {
        console.log(\`\${pet.name} is \${pet.age}\`);
      }
      `,
    ),
    solution: codeWithToInt(
      `
      class Pet:
          def __init__(self, name, age):
              if name == "":
                  raise ValueError("a pet needs a name")
              if age < 0:
                  raise ValueError("age can't be negative")
              self.name = name
              self.age = age

      pets = []
      while True:
          line = input()
          if line == "done":
              break
          parts = line.split(",")
          try:
              pets.append(Pet(parts[0].strip(), int(parts[1])))
          except ValueError as err:
              print(f"Skipped: {err}")
      for pet in pets:
          print(f"{pet.name} is {pet.age}")
      `,
      `
      class Pet {
        constructor(name, age) {
          if (name === "") {
            throw new Error("a pet needs a name");
          }
          if (age < 0) {
            throw new Error("age can't be negative");
          }
          this.name = name;
          this.age = age;
        }
      }

      const pets = [];
      while (true) {
        const line = prompt();
        if (line === "done") {
          break;
        }
        const parts = line.split(",");
        try {
          pets.push(new Pet(parts[0].trim(), toInt(parts[1])));
        } catch (err) {
          console.log(\`Skipped: \${err.message}\`);
        }
      }
      for (const pet of pets) {
        console.log(\`\${pet.name} is \${pet.age}\`);
      }
      `,
    ),
    tests: [
      { name: 'two good pets, two bad', input: 'Rex, 3\n, 2\nTom, -1\nBo, 5\ndone', expectedOutput: 'Skipped: a pet needs a name\nSkipped: age can\'t be negative\nRex is 3\nBo is 5' },
      { name: 'a newborn is fine', input: 'Ada, 0\ndone', expectedOutput: 'Ada is 0', hidden: true },
      {
        name: 'the class refuses bad pets itself',
        input: 'done',
        expectedOutput: 'refused: age can\'t be negative\nrefused: a pet needs a name\nmade Ok',
        hidden: true,
        harness: {
          python: dedent(`
            for _args in [["Zed", -5], ["", 1], ["Ok", 0]]:
                try:
                    _p = Pet(_args[0], _args[1])
                    print("made", _p.name)
                except ValueError as _e:
                    print("refused:", _e)
          `),
          javascript: dedent(`
            for (const _args of [["Zed", -5], ["", 1], ["Ok", 0]]) {
              try {
                const _p = new Pet(_args[0], _args[1]);
                console.log("made", _p.name);
              } catch (_e) {
                console.log("refused:", _e.message);
              }
            }
          `),
        },
      },
    ],
    takeaway: `Checking in the ${lang('`__init__`', 'constructor')} means a bad object can **never exist**: every \`Pet\` anywhere in the program is valid from birth.`,
  },
  {
    id: 'encapsulation-4',
    conceptId: 'encapsulation',
    title: 'Vending Machine',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: `Complete the \`Machine\` class. It holds \`stock\` and \`prices\` (${lang('dictionaries', 'objects')}) and a private credit, ${lang('`_credit`', '`#credit`')}:\n\n- \`insert(coins)\` adds credit, and refuses fewer than 1 coin (${lang('a `ValueError`', 'an `Error`')}): \`Insert at least 1 coin\`\n- \`buy(item)\` refuses (${lang('raise a `ValueError`', 'throw an `Error`')}), with exactly these messages: an unknown item (\`No such item: soda\`), a sold-out item (\`gum is sold out\`), and too little credit (\`chips costs 3\`). Otherwise it takes one from stock and the price from credit.\n- \`credit()\` returns the credit\n\nThe main loop reads \`insert N\`, \`buy ITEM\` (print \`Enjoy your ITEM!\`) and \`quit\`; anything else prints \`Commands: insert N, buy ITEM, quit\`. Print every refusal's message. After \`quit\`, print \`Change: N\`.\n\nHidden tests call \`buy\` directly, so the rules must live **inside** the class.`,
    reinforces: ['methods', 'maps', 'error-handling', 'strings', 'while-loops', 'loop-control', 'else-if-chains', 'input', 'type-conversion', 'string-formatting'],
    hints: [
      `Each rule in \`buy\` is an \`if\` that ${lang('`raise`s a `ValueError`', '`throw`s an `Error`')} with its message. Check them in order: unknown item, sold out, not enough credit.`,
      lang('An unknown item: `if item not in self.stock:`. Sold out: `self.stock[item] == 0`. Too little: `self._credit < self.prices[item]`.', 'An unknown item: `if (!(item in this.stock))`. Sold out: `this.stock[item] === 0`. Too little: `this.#credit < this.prices[item]`.'),
      lang('In the loop, split the line into words and put the whole if/elif dispatch inside `try:`, with `except ValueError as err: print(err)`.', 'In the loop, split the line into words and put the whole if/else dispatch inside `try { }`, with `catch (err) { console.log(err.message); }`. Use `toInt(words[1])` for the coins.'),
    ],
    starterCode: codeWithToInt(
      `
      class Machine:
          def __init__(self, stock, prices):
              self.stock = stock
              self.prices = prices
              self._credit = 0

          def insert(self, coins):
              # refuse fewer than 1 coin, otherwise add to the credit
              pass

          def buy(self, item):
              # refuse an unknown item, a sold-out item, or too little credit;
              # otherwise take one from stock and the price from the credit
              pass

          def credit(self):
              return 0

      machine = Machine({"chips": 2, "gum": 0}, {"chips": 3, "gum": 1})
      # 1. loop: read a line and split it into words
      # 2. "quit" stops the loop
      # 3. "insert N" and "buy ITEM" call the methods ("Enjoy your ITEM!" after a buy)
      # 4. anything else prints the list of commands
      # 5. catch every refusal and print its message
      # after the loop, print the change
      `,
      `
      class Machine {
        #credit = 0;

        constructor(stock, prices) {
          this.stock = stock;
          this.prices = prices;
        }

        insert(coins) {
          // refuse fewer than 1 coin, otherwise add to the credit
        }

        buy(item) {
          // refuse an unknown item, a sold-out item, or too little credit;
          // otherwise take one from stock and the price from the credit
        }

        credit() {
          return 0;
        }
      }

      const machine = new Machine({ chips: 2, gum: 0 }, { chips: 3, gum: 1 });
      // 1. loop: read a line and split it into words
      // 2. "quit" stops the loop
      // 3. "insert N" and "buy ITEM" call the methods ("Enjoy your ITEM!" after a buy)
      // 4. anything else prints the list of commands
      // 5. catch every refusal and print its message
      // after the loop, print the change
      `,
    ),
    solution: MACHINE_SOLUTION,
    requirements: {
      python: [{ pattern: '\\b(?!self\\b)[a-z_]\\w*\\._[a-z]\\w*', forbid: true, message: 'Only the object\'s own methods should touch its `_private` data: call a method instead.' }],
    },
    tests: [
      {
        name: 'a full visit',
        input: 'buy chips\ninsert 2\nbuy chips\ninsert 2\nbuy chips\nbuy gum\nbuy soda\ndance\nquit',
        expectedOutput: 'chips costs 3\nchips costs 3\nEnjoy your chips!\ngum is sold out\nNo such item: soda\nCommands: insert N, buy ITEM, quit\nChange: 1',
      },
      { name: 'no coins, then plenty', input: 'insert 0\ninsert 5\nbuy chips\nquit', expectedOutput: 'Insert at least 1 coin\nEnjoy your chips!\nChange: 2', hidden: true },
      {
        name: 'buy checks unknown items and credit',
        input: 'quit',
        expectedOutput: 'No such item: soda\ntea costs 2\n0 1',
        hidden: true,
        harness: {
          python: dedent(`
            _m = Machine({"tea": 1}, {"tea": 2})
            for _item in ["soda", "tea"]:
                try:
                    _m.buy(_item)
                    print("sold")
                except ValueError as _e:
                    print(_e)
            print(_m.credit(), _m.stock["tea"])
          `),
          javascript: dedent(`
            const _m = new Machine({ tea: 1 }, { tea: 2 });
            for (const _item of ["soda", "tea"]) {
              try {
                _m.buy(_item);
                console.log("sold");
              } catch (_e) {
                console.log(_e.message);
              }
            }
            console.log(_m.credit(), _m.stock["tea"]);
          `),
        },
      },
      {
        name: 'insert checks its own rule',
        input: 'quit',
        expectedOutput: 'Insert at least 1 coin',
        hidden: true,
        harness: {
          python: dedent(`
            _m = Machine({"tea": 1}, {"tea": 2})
            try:
                _m.insert(0)
                print("accepted")
            except ValueError as _e:
                print(_e)
          `),
          javascript: dedent(`
            const _m = new Machine({ tea: 1 }, { tea: 2 });
            try {
              _m.insert(0);
              console.log("accepted");
            } catch (_e) {
              console.log(_e.message);
            }
          `),
        },
      },
      {
        name: 'buy checks its own rules',
        input: 'quit',
        expectedOutput: '3 0\ntea is sold out',
        hidden: true,
        harness: {
          python: dedent(`
            _m = Machine({"tea": 1}, {"tea": 2})
            _m.insert(5)
            _m.buy("tea")
            print(_m.credit(), _m.stock["tea"])
            try:
                _m.buy("tea")
            except ValueError as _e:
                print(_e)
          `),
          javascript: dedent(`
            const _m = new Machine({ tea: 1 }, { tea: 2 });
            _m.insert(5);
            _m.buy("tea");
            console.log(_m.credit(), _m.stock["tea"]);
            try {
              _m.buy("tea");
            } catch (_e) {
              console.log(_e.message);
            }
          `),
        },
      },
    ],
    takeaway: 'The machine\'s rules live **inside** `buy`, so no caller can skip them: the main loop, a test, or a second machine all get the same checks. The loop only talks to the user and prints what went wrong.',
  },
  {
    id: 'encapsulation-5',
    conceptId: 'encapsulation',
    title: 'Backpack',
    role: 'challenge',
    game: 'build-it',
    mode: 'freeform',
    prompt: `Write a \`Backpack\` class. ${lang('`Backpack(capacity)`', '`new Backpack(capacity)`')} holds at most \`capacity\` items. Refusals ${lang('raise a `ValueError`', 'throw an `Error`')} with the message:\n\n- \`add(item)\` refuses an item that's already in it with \`Already packed\` (check this first), and refuses when it's full with \`Backpack is full\`\n- \`remove(item)\` refuses an item that isn't in it with \`Not in backpack\`\n- \`contents()\` **returns** the items as a sorted ${lang('list', 'array')}\n\nThe first input line is the capacity. Then read commands \`add ITEM\` and \`remove ITEM\` until \`done\`, printing every refusal. Finish with \`Packed: map, rope\` (sorted, joined with \`, \`), or \`Packed: nothing\` when it's empty.`,
    reinforces: ['methods', 'error-handling', 'collections', 'strings', 'conditionals', 'while-loops', 'loop-control', 'input'],
    hints: [
      `Keep a ${lang('list', 'array')} of items in the ${lang('`__init__`', 'constructor')}, along with the capacity. Each refusal is an \`if\` that ${lang('raises a `ValueError`', 'throws an `Error`')}.`,
      `Check "already packed" before "full". \`contents\` returns a sorted copy: ${lang('`sorted(self.items)`', '`[...this.items].sort()`')}.`,
      lang('In the loop, split each command, call `add` or `remove` inside `try:`, and print the error in `except ValueError as err:`.', 'In the loop, split each command, call `add` or `remove` inside `try { }`, and print `err.message` in `catch (err)`.'),
    ],
    starterCode: code(
      `
      class Backpack:
          def __init__(self, capacity):
              pass

          # add(item), remove(item), contents()

      backpack = Backpack(int(input()))
      # read commands until "done", then print what's packed
      `,
      `
      class Backpack {
        constructor(capacity) {
        }

        // add(item), remove(item), contents()
      }

      const backpack = new Backpack(Number(prompt()));
      // read commands until "done", then print what's packed
      `,
    ),
    solution: code(
      `
      class Backpack:
          def __init__(self, capacity):
              self.capacity = capacity
              self._items = []

          def add(self, item):
              if item in self._items:
                  raise ValueError("Already packed")
              if len(self._items) >= self.capacity:
                  raise ValueError("Backpack is full")
              self._items.append(item)

          def remove(self, item):
              if item not in self._items:
                  raise ValueError("Not in backpack")
              self._items.remove(item)

          def contents(self):
              return sorted(self._items)

      backpack = Backpack(int(input()))
      while True:
          words = input().split()
          if words[0] == "done":
              break
          try:
              if words[0] == "add":
                  backpack.add(words[1])
              elif words[0] == "remove":
                  backpack.remove(words[1])
          except ValueError as err:
              print(err)
      if backpack.contents():
          print("Packed: " + ", ".join(backpack.contents()))
      else:
          print("Packed: nothing")
      `,
      `
      class Backpack {
        #items = [];

        constructor(capacity) {
          this.capacity = capacity;
        }

        add(item) {
          if (this.#items.includes(item)) {
            throw new Error("Already packed");
          }
          if (this.#items.length >= this.capacity) {
            throw new Error("Backpack is full");
          }
          this.#items.push(item);
        }

        remove(item) {
          if (!this.#items.includes(item)) {
            throw new Error("Not in backpack");
          }
          this.#items.splice(this.#items.indexOf(item), 1);
        }

        contents() {
          return [...this.#items].sort();
        }
      }

      const backpack = new Backpack(Number(prompt()));
      while (true) {
        const words = prompt().split(" ");
        if (words[0] === "done") {
          break;
        }
        try {
          if (words[0] === "add") {
            backpack.add(words[1]);
          } else if (words[0] === "remove") {
            backpack.remove(words[1]);
          }
        } catch (err) {
          console.log(err.message);
        }
      }
      if (backpack.contents().length > 0) {
        console.log("Packed: " + backpack.contents().join(", "));
      } else {
        console.log("Packed: nothing");
      }
      `,
    ),
    requirements: {
      python: [{ pattern: '\\b(?!self\\b)[a-z_]\\w*\\._[a-z]\\w*', forbid: true, message: 'Only the object\'s own methods should touch its `_private` data: call a method instead.' }],
    },
    tests: [
      {
        name: 'a full trip',
        input: '2\nadd rope\nadd lamp\nadd rope\nadd map\nremove lamp\nadd map\nremove lamp\ndone',
        expectedOutput: 'Already packed\nBackpack is full\nNot in backpack\nPacked: map, rope',
      },
      { name: 'room to spare', input: '3\nadd tent\nadd axe\ndone', expectedOutput: 'Packed: axe, tent', hidden: true },
      { name: 'nothing packed', input: '1\nremove sock\ndone', expectedOutput: 'Not in backpack\nPacked: nothing', hidden: true },
      {
        name: 'add refuses duplicates; contents are sorted',
        input: '2\ndone',
        expectedOutput: { python: "Already packed\n['map', 'rope']", javascript: "Already packed\n[ 'map', 'rope' ]" },
        hidden: true,
        harness: {
          python: dedent(`
            _b = Backpack(3)
            _b.add("rope")
            _b.add("map")
            try:
                _b.add("map")
            except ValueError as _e:
                print(_e)
            print(_b.contents())
          `),
          javascript: dedent(`
            const _b = new Backpack(3);
            _b.add("rope");
            _b.add("map");
            try {
              _b.add("map");
            } catch (_e) {
              console.log(_e.message);
            }
            console.log(_b.contents());
          `),
        },
      },
      {
        name: 'a backpack used by hidden code',
        input: '2\ndone',
        expectedOutput: { python: "Backpack is full\nNot in backpack\n['map']", javascript: "Backpack is full\nNot in backpack\n[ 'map' ]" },
        hidden: true,
        harness: {
          python: dedent(`
            _b = Backpack(1)
            _b.add("map")
            try:
                _b.add("rope")
            except ValueError as _e:
                print(_e)
            try:
                _b.remove("rope")
            except ValueError as _e:
                print(_e)
            print(_b.contents())
          `),
          javascript: dedent(`
            const _b = new Backpack(1);
            _b.add("map");
            try {
              _b.add("rope");
            } catch (_e) {
              console.log(_e.message);
            }
            try {
              _b.remove("rope");
            } catch (_e) {
              console.log(_e.message);
            }
            console.log(_b.contents());
          `),
        },
      },
    ],
    takeaway: 'The backpack enforces its own rules (no duplicates, a capacity), so every caller gets them for free. The main loop just asks and reports what the object says.',
  },
];
