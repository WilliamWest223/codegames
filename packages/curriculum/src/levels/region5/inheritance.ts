import type { Level } from '@codegames/shared';
import { code } from '../../helpers';
import { lang } from '../../localize';
import { codeWithToInt } from '../region4/shared';

/**
 * inheritance: subclasses, `super`, overriding, and your own exception class.
 * Spec: docs/specs/region5-and-security.md §A8.
 */

const HEALER_MAIN = code(
  `
  mia = Healer("Mia", 12, int(input()))
  bo = Unit("Bo", 3)
  for turn in range(3):
      print(mia.heal(bo))
  print(bo.status())
  print(mia.status())
  `,
  `
  const mia = new Healer("Mia", 12, Number(prompt()));
  const bo = new Unit("Bo", 3);
  for (let turn = 0; turn < 3; turn++) {
    console.log(mia.heal(bo));
  }
  console.log(bo.status());
  console.log(mia.status());
  `,
);

/** The Healer program: the given classes, then the fixed main program. */
function healer(python: string, javascript: string) {
  const c = code(python, javascript);
  return { python: `${c.python}\n${HEALER_MAIN.python}`, javascript: `${c.javascript}\n${HEALER_MAIN.javascript}` };
}

/** inheritance levels, in play order. */
export const inheritanceLevels: Level[] = [
  {
    id: 'inheritance-1',
    conceptId: 'inheritance',
    title: 'Pets and Dogs',
    role: 'intro',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: `${lang('`class Dog(Pet):`', '`class Dog extends Pet`')} makes Dog a **subclass** of Pet: a Dog gets every Pet method for free, and can **override** (replace) some. Watch which \`speak\` each \`describe\` uses. Which output is right?`,
    reinforces: ['methods'],
    hints: [
      `\`Dog\` has no \`describe\` of its own, so it uses Pet's. Pet's \`describe\` calls ${lang('`self.speak()`', '`this.speak()`')}, and for a Dog, that's Dog's \`speak\`.`,
      lang('`Puppy` runs Pet\'s `__init__` through `super().__init__(name)`, then adds `age`.', '`Puppy`\'s constructor runs Pet\'s through `super(name)`, then adds `age`.'),
      lang('`super().describe()` runs the parent\'s version, and Puppy adds to the end of it.', '`super.describe()` runs the parent\'s version, and Puppy adds to the end of it.'),
    ],
    code: code(
      `
      class Pet:
          def __init__(self, name):
              self.name = name

          def speak(self):
              return "..."

          def describe(self):
              return f"{self.name} says {self.speak()}"

      class Dog(Pet):
          def speak(self):
              return "Woof"

      class Puppy(Dog):
          def __init__(self, name, age):
              super().__init__(name)
              self.age = age

          def describe(self):
              return super().describe() + f" ({self.age} months)"

      print(Pet("Rock").describe())
      print(Dog("Rex").describe())
      print(Puppy("Bit", 3).describe())
      print(isinstance(Puppy("Bit", 3), Pet))
      `,
      `
      class Pet {
        constructor(name) {
          this.name = name;
        }

        speak() {
          return "...";
        }

        describe() {
          return \`\${this.name} says \${this.speak()}\`;
        }
      }

      class Dog extends Pet {
        speak() {
          return "Woof";
        }
      }

      class Puppy extends Dog {
        constructor(name, age) {
          super(name);
          this.age = age;
        }

        describe() {
          return super.describe() + \` (\${this.age} months)\`;
        }
      }

      console.log(new Pet("Rock").describe());
      console.log(new Dog("Rex").describe());
      console.log(new Puppy("Bit", 3).describe());
      console.log(new Puppy("Bit", 3) instanceof Pet);
      `,
    ),
    choices: {
      python: [
        'Rock says ...\nRex says Woof\nBit says Woof (3 months)\nTrue',
        'Rock says ...\nRex says ...\nBit says ... (3 months)\nTrue',
        'Rock says ...\nRex says Woof\n(3 months)\nTrue',
        'Rock says ...\nRex says Woof\nBit says Woof (3 months)\nFalse',
      ],
      javascript: [
        'Rock says ...\nRex says Woof\nBit says Woof (3 months)\ntrue',
        'Rock says ...\nRex says ...\nBit says ... (3 months)\ntrue',
        'Rock says ...\nRex says Woof\n(3 months)\ntrue',
        'Rock says ...\nRex says Woof\nBit says Woof (3 months)\nfalse',
      ],
    },
    takeaway: `A subclass **inherits** its parent's methods and can **override** them. When a parent method calls ${lang('`self.speak()`', '`this.speak()`')}, the object's *own* class decides which \`speak\` runs, even from inside Pet's code. ${lang('`super()`', '`super`')} reaches the parent's version when you want to extend it rather than replace it. A Puppy **is a** Pet, so ${lang('`isinstance`', '`instanceof`')} says yes.`,
  },
  {
    id: 'inheritance-2',
    conceptId: 'inheritance',
    title: 'Arrange the Knight',
    role: 'combine',
    game: 'parsons',
    mode: 'parsons',
    prompt: 'A Knight is a Unit whose armor blocks 3 damage from every hit. Arrange the lines so Kay (20 HP) takes hits of 5 and 2 and ends on `Kay 18`. **Two lines are traps.**',
    reinforces: ['classes', 'methods'],
    hints: [
      `Unit first (with ${lang('`__init__`', '`constructor`')} and ${lang('`take_hit`', '`takeHit`')}), then Knight, then the lines that use them.`,
      lang('Knight needs `(Unit)` in its class line, or it has no `__init__` and no `hp`.', 'Knight needs `extends Unit`, or it has no constructor and no `hp`.'),
      lang(
        'Knight\'s `take_hit` should hand the reduced damage to the **parent\'s** `take_hit`. Calling `self.take_hit` would call itself forever.',
        'Knight\'s `takeHit` should hand the reduced damage to the **parent\'s** `takeHit`. Calling `this.takeHit` would call itself forever.',
      ),
    ],
    solution: code(
      `
      class Unit:
          def __init__(self, name, hp):
              self.name = name
              self.hp = hp

          def take_hit(self, damage):
              self.hp -= damage

      class Knight(Unit):
          def take_hit(self, damage):
              super().take_hit(max(0, damage - 3))

      k = Knight("Kay", 20)
      k.take_hit(5)
      k.take_hit(2)
      print(k.name, k.hp)
      `,
      `
      class Unit {
        constructor(name, hp) {
          this.name = name;
          this.hp = hp;
        }

        takeHit(damage) {
          this.hp -= damage;
        }
      }

      class Knight extends Unit {
        takeHit(damage) {
          super.takeHit(Math.max(0, damage - 3));
        }
      }

      const k = new Knight("Kay", 20);
      k.takeHit(5);
      k.takeHit(2);
      console.log(k.name, k.hp);
      `,
    ),
    distractors: {
      python: ['class Knight:', 'self.take_hit(max(0, damage - 3))'],
      javascript: ['class Knight {', 'this.takeHit(Math.max(0, damage - 3));'],
    },
    tests: [
      { name: 'Kay takes two hits', expectedOutput: 'Kay 18' },
      {
        name: 'small hits never heal',
        expectedOutput: '10',
        hidden: true,
        harness: code(
          `
          _k = Knight("Zed", 10)
          _k.take_hit(2)
          print(_k.hp)
          `,
          `
          const _k = new Knight("Zed", 10);
          _k.takeHit(2);
          console.log(_k.hp);
          `,
        ),
      },
    ],
  },
  {
    id: 'inheritance-3',
    conceptId: 'inheritance',
    title: 'Forgot Super',
    role: 'combine',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: 'A Healer is a Unit that carries potions. With 2 potions it should print:\n\n```\nMia heals Bo\nMia heals Bo\nMia is out of potions\nBo: 13 HP\nMia: 12 HP\n```\n\nIt crashes. Read the error: what does the Healer not have, and who was supposed to set it?',
    reinforces: ['classes', 'methods', 'loops', 'input'],
    hints: [
      lang(
        'The error says a Healer has no `name`. Unit\'s `__init__` sets `name` and `hp`, but does it ever run for a Healer?',
        'The error says you must call the super constructor before using `this`. A subclass constructor has to run the parent\'s first.',
      ),
      lang(
        'Defining `__init__` in Healer **replaces** Unit\'s. To run the parent\'s too, call it.',
        'Defining a constructor in Healer **replaces** Unit\'s. To run the parent\'s too, call it.',
      ),
      lang('First line of Healer\'s `__init__`: `super().__init__(name, hp)`.', 'First line of Healer\'s constructor: `super(name, hp);`.'),
    ],
    starterCode: healer(
      `
      class Unit:
          def __init__(self, name, hp):
              self.name = name
              self.hp = hp

          def status(self):
              return f"{self.name}: {self.hp} HP"

      class Healer(Unit):
          def __init__(self, name, hp, potions):
              self.potions = potions

          def heal(self, other):
              if self.potions == 0:
                  return f"{self.name} is out of potions"
              self.potions -= 1
              other.hp += 5
              return f"{self.name} heals {other.name}"
      `,
      `
      class Unit {
        constructor(name, hp) {
          this.name = name;
          this.hp = hp;
        }

        status() {
          return \`\${this.name}: \${this.hp} HP\`;
        }
      }

      class Healer extends Unit {
        constructor(name, hp, potions) {
          this.potions = potions;
        }

        heal(other) {
          if (this.potions === 0) {
            return \`\${this.name} is out of potions\`;
          }
          this.potions -= 1;
          other.hp += 5;
          return \`\${this.name} heals \${other.name}\`;
        }
      }
      `,
    ),
    solution: healer(
      `
      class Unit:
          def __init__(self, name, hp):
              self.name = name
              self.hp = hp

          def status(self):
              return f"{self.name}: {self.hp} HP"

      class Healer(Unit):
          def __init__(self, name, hp, potions):
              super().__init__(name, hp)
              self.potions = potions

          def heal(self, other):
              if self.potions == 0:
                  return f"{self.name} is out of potions"
              self.potions -= 1
              other.hp += 5
              return f"{self.name} heals {other.name}"
      `,
      `
      class Unit {
        constructor(name, hp) {
          this.name = name;
          this.hp = hp;
        }

        status() {
          return \`\${this.name}: \${this.hp} HP\`;
        }
      }

      class Healer extends Unit {
        constructor(name, hp, potions) {
          super(name, hp);
          this.potions = potions;
        }

        heal(other) {
          if (this.potions === 0) {
            return \`\${this.name} is out of potions\`;
          }
          this.potions -= 1;
          other.hp += 5;
          return \`\${this.name} heals \${other.name}\`;
        }
      }
      `,
    ),
    tests: [
      { name: '2 potions', input: '2', expectedOutput: 'Mia heals Bo\nMia heals Bo\nMia is out of potions\nBo: 13 HP\nMia: 12 HP' },
      { name: '5 potions', input: '5', expectedOutput: 'Mia heals Bo\nMia heals Bo\nMia heals Bo\nBo: 18 HP\nMia: 12 HP', hidden: true },
    ],
    takeaway: lang(
      'A subclass `__init__` **replaces** the parent\'s, so the parent\'s setup doesn\'t happen unless you call `super().__init__(...)`, usually as the first line. Python only notices later, when something reads the missing attribute.',
      'In a subclass constructor, JavaScript **requires** `super(...)` before you touch `this`. That rule stops the "half-built object" bug at once instead of later.',
    ),
  },
  {
    id: 'inheritance-4',
    conceptId: 'inheritance',
    title: 'Your Own Error',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: `Errors are classes too, so you can make your own by inheriting. Write ${lang('`class InsufficientFunds(ValueError)`', '`class InsufficientFunds extends Error`')} and an \`Account\` whose \`withdraw(amount)\`:\n- refuses a zero or negative amount with a plain ${lang('`ValueError`', '`Error`')} (\`Amount must be positive\`)\n- refuses more than the balance with \`InsufficientFunds\` (\`Only 30 left\`)\n\nThe first input is the starting balance; then withdrawals until \`done\`. Print \`OK, N left\`, \`Declined: ...\` for InsufficientFunds, \`Not a valid amount\` for anything else that goes wrong, and finally \`Final: N\`.`,
    reinforces: ['error-handling', 'encapsulation', 'while-loops', 'input', 'type-conversion', 'string-formatting'],
    hints: [
      lang(
        '`class InsufficientFunds(ValueError): pass` is a complete class: it inherits everything, including the message.',
        '`class InsufficientFunds extends Error {}` is a complete class: it inherits everything, including `.message`.',
      ),
      lang(
        'Catch the **specific** error first: `except InsufficientFunds as err:` must come **before** `except ValueError:`, because an InsufficientFunds **is** a ValueError and the first matching `except` wins.',
        'In `catch (err)`, test the specific kind first: `if (err instanceof InsufficientFunds)`, otherwise it\'s some other problem.',
      ),
      lang(
        '`int("abc")` raises a ValueError too, so "Not a valid amount" covers both bad text and bad numbers.',
        '`toInt("abc")` throws an Error too, so "Not a valid amount" covers both bad text and bad numbers.',
      ),
    ],
    starterCode: codeWithToInt(
      `
      # 1. Your own error type: an InsufficientFunds is a kind of ValueError.

      class Account:
          def __init__(self, balance):
              self._balance = balance

          def withdraw(self, amount):
              # 2. Refuse bad amounts and overdrafts; otherwise take the money.
              pass

          def balance(self):
              return self._balance

      account = Account(int(input()))
      # 3. Read withdrawals until "done"; catch each kind of error separately.
      `,
      `
      // 1. Your own error type: an InsufficientFunds is a kind of Error.

      class Account {
        #balance;

        constructor(balance) {
          this.#balance = balance;
        }

        withdraw(amount) {
          // 2. Refuse bad amounts and overdrafts; otherwise take the money.
        }

        balance() {
          return this.#balance;
        }
      }

      const account = new Account(toInt(prompt()));
      // 3. Read withdrawals until "done"; catch each kind of error separately.
      `,
    ),
    solution: codeWithToInt(
      `
      class InsufficientFunds(ValueError):
          pass

      class Account:
          def __init__(self, balance):
              self._balance = balance

          def withdraw(self, amount):
              if amount <= 0:
                  raise ValueError("Amount must be positive")
              if amount > self._balance:
                  raise InsufficientFunds(f"Only {self._balance} left")
              self._balance -= amount

          def balance(self):
              return self._balance

      account = Account(int(input()))
      while True:
          line = input()
          if line == "done":
              break
          try:
              account.withdraw(int(line))
              print(f"OK, {account.balance()} left")
          except InsufficientFunds as err:
              print(f"Declined: {err}")
          except ValueError:
              print("Not a valid amount")
      print(f"Final: {account.balance()}")
      `,
      `
      class InsufficientFunds extends Error {}

      class Account {
        #balance;

        constructor(balance) {
          this.#balance = balance;
        }

        withdraw(amount) {
          if (amount <= 0) {
            throw new Error("Amount must be positive");
          }
          if (amount > this.#balance) {
            throw new InsufficientFunds(\`Only \${this.#balance} left\`);
          }
          this.#balance -= amount;
        }

        balance() {
          return this.#balance;
        }
      }

      const account = new Account(toInt(prompt()));
      while (true) {
        const line = prompt();
        if (line === "done") {
          break;
        }
        try {
          account.withdraw(toInt(line));
          console.log(\`OK, \${account.balance()} left\`);
        } catch (err) {
          if (err instanceof InsufficientFunds) {
            console.log(\`Declined: \${err.message}\`);
          } else {
            console.log("Not a valid amount");
          }
        }
      }
      console.log(\`Final: \${account.balance()}\`);
      `,
    ),
    tests: [
      {
        name: 'a day at the bank',
        input: '50\n20\n40\nabc\n-5\n30\ndone',
        expectedOutput: 'OK, 30 left\nDeclined: Only 30 left\nNot a valid amount\nNot a valid amount\nOK, 0 left\nFinal: 0',
      },
      { name: 'exactly everything', input: '10\n10\n1\ndone', expectedOutput: 'OK, 0 left\nDeclined: Only 0 left\nFinal: 0', hidden: true },
      {
        name: 'it really is your own error type',
        input: '1\ndone',
        expectedOutput: 'custom Only 5 left',
        hidden: true,
        harness: code(
          `
          try:
              Account(5).withdraw(9)
          except InsufficientFunds as _e:
              print("custom", _e)
          `,
          `
          try {
            new Account(5).withdraw(9);
          } catch (_e) {
            console.log(_e instanceof InsufficientFunds ? "custom" : "plain", _e.message);
          }
          `,
        ),
      },
    ],
    requirements: {
      python: [{ pattern: 'class\\s+InsufficientFunds\\s*\\(\\s*ValueError\\s*\\)', message: 'Make `InsufficientFunds` a kind of `ValueError`: `class InsufficientFunds(ValueError):`.' }],
      javascript: [{ pattern: 'class\\s+InsufficientFunds\\s+extends\\s+Error', message: 'Make `InsufficientFunds` a kind of `Error`: `class InsufficientFunds extends Error {}`.' }],
    },
    takeaway: lang(
      'Your own exception classes name **your** problems (`InsufficientFunds`), and inheriting from `ValueError` means older code that catches `ValueError` still works. `except` clauses are tried top to bottom and the first match wins, so put the most specific one first.',
      'Your own error classes name **your** problems (`InsufficientFunds`). `instanceof` tells kinds apart inside one `catch`. Because `InsufficientFunds extends Error`, it still has `.message` and works anywhere an `Error` does.',
    ),
  },
];
