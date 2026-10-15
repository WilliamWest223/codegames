import type { Level } from '@codegames/shared';
import { code } from '../../helpers';
import { lang } from '../../localize';

/**
 * polymorphism: one call, many classes; polymorphism replaces `if type ==` chains, and duck
 * typing is taught honestly. Spec: docs/specs/region5-and-security.md §A9.
 */

/** polymorphism levels, in play order. */
export const polymorphismLevels: Level[] = [
  {
    id: 'polymorphism-1',
    conceptId: 'polymorphism',
    title: 'Same Call, Different Shape',
    role: 'intro',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: "Every shape answers the **same calls**, `name()` and `area()`, in its own way. The loop doesn't know or care which kind it has. Predict the output.",
    reinforces: ['inheritance'],
    hints: [
      '`label` lives in `Shape`, but it calls `name()` and `area()` on the actual object: a Square answers as a square.',
      'A plain `Shape()` uses the default answers: `shape` and `0`.',
      'The total adds 9, 10 and 0.',
    ],
    code: code(
      `
      class Shape:
          def name(self):
              return "shape"

          def area(self):
              return 0

          def label(self):
              return f"{self.name()} with area {self.area()}"

      class Square(Shape):
          def __init__(self, side):
              self.side = side

          def name(self):
              return "square"

          def area(self):
              return self.side * self.side

      class Rect(Shape):
          def __init__(self, w, h):
              self.w = w
              self.h = h

          def name(self):
              return "rect"

          def area(self):
              return self.w * self.h

      shapes = [Square(3), Rect(2, 5), Shape()]
      total = 0
      for s in shapes:
          print(s.label())
          total += s.area()
      print(total)
      `,
      `
      class Shape {
        name() {
          return "shape";
        }

        area() {
          return 0;
        }

        label() {
          return \`\${this.name()} with area \${this.area()}\`;
        }
      }

      class Square extends Shape {
        constructor(side) {
          super();
          this.side = side;
        }

        name() {
          return "square";
        }

        area() {
          return this.side * this.side;
        }
      }

      class Rect extends Shape {
        constructor(w, h) {
          super();
          this.w = w;
          this.h = h;
        }

        name() {
          return "rect";
        }

        area() {
          return this.w * this.h;
        }
      }

      const shapes = [new Square(3), new Rect(2, 5), new Shape()];
      let total = 0;
      for (const s of shapes) {
        console.log(s.label());
        total += s.area();
      }
      console.log(total);
      `,
    ),
    takeaway: '**Polymorphism** ("many shapes"): one call, `s.area()`, runs different code depending on the object. The loop has no `if` asking "which kind are you?"; each class answers for itself. The base class supplies defaults and says which methods every shape must have.',
  },
  {
    id: 'polymorphism-2',
    conceptId: 'polymorphism',
    title: 'Duck Typing',
    role: 'combine',
    game: 'predict-output',
    mode: 'hybrid',
    expectError: true,
    prompt: "None of these classes inherit from each other. Python and JavaScript don't check types ahead of time: they just try the call. Predict the output; the last line is the **name of the error**.",
    reinforces: ['classes', 'methods'],
    hints: [
      'Duck and Robot both have a `sound` method, so the loop happily calls each one. No parent class needed.',
      'Rock has no `sound` at all. The call only fails when the loop reaches the Rock.',
      lang(
        'Asking an object for something it doesn\'t have is an `AttributeError`.',
        'Calling something that isn\'t a function is a `TypeError` (`thing.sound` is `undefined`).',
      ),
    ],
    code: code(
      `
      class Duck:
          def sound(self):
              return "Quack"

      class Robot:
          def sound(self):
              return "Beep"

      class Rock:
          pass

      for thing in [Duck(), Robot(), Rock()]:
          print(thing.sound())
      `,
      `
      class Duck {
        sound() {
          return "Quack";
        }
      }

      class Robot {
        sound() {
          return "Beep";
        }
      }

      class Rock {}

      for (const thing of [new Duck(), new Robot(), new Rock()]) {
        console.log(thing.sound());
      }
      `,
    ),
    takeaway: '"If it walks like a duck and quacks like a duck, it\'s a duck." In Python and JavaScript any object with the right method works: that\'s **duck typing**. The catch: a missing method only shows up when that line runs. A shared base class with a default method documents the deal, and a Java or C++ compiler would check it for you before running.',
  },
  {
    id: 'polymorphism-3',
    conceptId: 'polymorphism',
    title: 'Goodbye, If Chain',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: `This program works, but every new delivery type means editing the if/else-if chain. **Refactor** it: a \`Delivery\` base class with \`name()\` and \`fee(weight)\`, and subclasses \`Standard\` (5 + weight), \`Express\` (10 + 2 × weight) and \`Pickup\` (free). Then ${lang('`total_fees(orders)`', '`totalFees(orders)`')} takes \`[delivery, weight]\` pairs, prints each line and **returns** the total, with **no checks on the kind**.\n\nThe hidden test brings a delivery type you've never seen.`,
    reinforces: ['classes', 'methods', 'iterating-collections', 'return-values', 'string-formatting', 'inheritance'],
    hints: [
      'Each subclass overrides both methods. The base class can return `"delivery"` and `0`.',
      lang(
        '`for delivery, weight in orders:` unpacks each pair; then just call `delivery.fee(weight)`.',
        '`for (const [delivery, weight] of orders)` unpacks each pair; then just call `delivery.fee(weight)`.',
      ),
      'If your function contains the word "express", it still knows too much: each class should answer for itself.',
    ],
    starterCode: code(
      `
      orders = [["standard", 3], ["express", 3], ["pickup", 10], ["express", 8]]
      total = 0
      for kind, weight in orders:
          if kind == "standard":
              fee = 5 + weight
          elif kind == "express":
              fee = 10 + 2 * weight
          else:
              fee = 0
          total += fee
          print(f"{kind}: {fee}")
      print(f"Total: {total}")
      `,
      `
      const orders = [["standard", 3], ["express", 3], ["pickup", 10], ["express", 8]];
      let total = 0;
      for (const [kind, weight] of orders) {
        let fee = 0;
        if (kind === "standard") {
          fee = 5 + weight;
        } else if (kind === "express") {
          fee = 10 + 2 * weight;
        }
        total += fee;
        console.log(\`\${kind}: \${fee}\`);
      }
      console.log(\`Total: \${total}\`);
      `,
    ),
    solution: code(
      `
      class Delivery:
          def name(self):
              return "delivery"

          def fee(self, weight):
              return 0

      class Standard(Delivery):
          def name(self):
              return "standard"

          def fee(self, weight):
              return 5 + weight

      class Express(Delivery):
          def name(self):
              return "express"

          def fee(self, weight):
              return 10 + 2 * weight

      class Pickup(Delivery):
          def name(self):
              return "pickup"

      def total_fees(orders):
          total = 0
          for delivery, weight in orders:
              fee = delivery.fee(weight)
              print(f"{delivery.name()}: {fee}")
              total += fee
          return total

      orders = [[Standard(), 3], [Express(), 3], [Pickup(), 10], [Express(), 8]]
      print(f"Total: {total_fees(orders)}")
      `,
      `
      class Delivery {
        name() {
          return "delivery";
        }

        fee(weight) {
          return 0;
        }
      }

      class Standard extends Delivery {
        name() {
          return "standard";
        }

        fee(weight) {
          return 5 + weight;
        }
      }

      class Express extends Delivery {
        name() {
          return "express";
        }

        fee(weight) {
          return 10 + 2 * weight;
        }
      }

      class Pickup extends Delivery {
        name() {
          return "pickup";
        }
      }

      function totalFees(orders) {
        let total = 0;
        for (const [delivery, weight] of orders) {
          const fee = delivery.fee(weight);
          console.log(\`\${delivery.name()}: \${fee}\`);
          total += fee;
        }
        return total;
      }

      const orders = [[new Standard(), 3], [new Express(), 3], [new Pickup(), 10], [new Express(), 8]];
      console.log(\`Total: \${totalFees(orders)}\`);
      `,
    ),
    tests: [
      { name: 'the orders', expectedOutput: 'standard: 8\nexpress: 16\npickup: 0\nexpress: 26\nTotal: 50' },
      {
        name: 'each class answers for itself',
        expectedOutput: '18 5 0 express',
        hidden: true,
        harness: {
          python: 'print(Express().fee(4), Standard().fee(0), Pickup().fee(99), Express().name())',
          javascript: 'console.log(new Express().fee(4), new Standard().fee(0), new Pickup().fee(99), new Express().name());',
        },
      },
      {
        name: 'a brand-new delivery type',
        expectedOutput: 'drone: 7\nstandard: 6\n13',
        hidden: true,
        harness: code(
          `
          class _Drone(Delivery):
              def name(self):
                  return "drone"

              def fee(self, weight):
                  return 7

          print(total_fees([[_Drone(), 1], [Standard(), 1]]))
          `,
          `
          class _Drone extends Delivery {
            name() {
              return "drone";
            }

            fee(weight) {
              return 7;
            }
          }
          console.log(totalFees([[new _Drone(), 1], [new Standard(), 1]]));
          `,
        ),
      },
    ],
    requirements: {
      python: [
        { pattern: '[=!]=\\s*["\'](standard|express|pickup)', forbid: true, message: 'No checking the kind: let each class answer `fee` and `name` for itself.' },
        { pattern: 'isinstance|type\\(', forbid: true, message: 'No checking the kind: let each class answer `fee` and `name` for itself.' },
        { pattern: 'class\\s+Express\\s*\\(\\s*Delivery\\s*\\)', message: 'Make `Express` (and the others) subclasses of `Delivery`.' },
      ],
      javascript: [
        { pattern: '[=!]==?\\s*["\'](standard|express|pickup)', forbid: true, message: 'No checking the kind: let each class answer `fee` and `name` for itself.' },
        { pattern: 'instanceof|constructor\\.name', forbid: true, message: 'No checking the kind: let each class answer `fee` and `name` for itself.' },
        { pattern: 'class\\s+Express\\s+extends\\s+Delivery', message: 'Make `Express` (and the others) subclasses of `Delivery`.' },
      ],
    },
    takeaway: `Polymorphism replaces "which kind are you?" chains. Adding a delivery type is now **one new class**, and ${lang('`total_fees`', '`totalFees`')} never changes: it worked on a Drone it had never heard of. Code that is open to new kinds without being edited is a sign of good design.`,
  },
];
