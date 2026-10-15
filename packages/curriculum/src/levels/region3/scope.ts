import type { Level } from '@codegames/shared';
import { code } from '../../helpers';
import { lang } from '../../localize';

/** scope levels, in play order. */
export const scopeLevels: Level[] = [
  {
    id: 'scope-1',
    conceptId: 'scope',
    title: 'What Stays Inside',
    role: 'intro',
    game: 'predict-output',
    mode: 'hybrid',
    choices: { python: ["inside: 5\noutside: 1", "inside: 5\noutside: 5", "inside: 5\ninside: 5\noutside: 1"], javascript: ["inside: 5\noutside: 1", "inside: 5\noutside: 5", "inside: 5\ninside: 5\noutside: 1"] },
    prompt: 'A variable created inside a function is **local**: it lives only inside that function. Predict the output.',
    reinforces: ['variables'],
    hints: [lang('Inside `change`, `x = 5` creates a *new* local `x`.', 'Inside `change`, `let x = 5` creates a *new* local `x`.'), 'The outside `x` is never touched.'],
    remix: true,
    code: code(
      `
      x = 1

      def change():
          x = 5
          print("inside:", x)

      change()
      print("outside:", x)
      `,
      `
      let x = 1;

      function change() {
        let x = 5;
        console.log("inside:", x);
      }

      change();
      console.log("outside:", x);
      `,
    ),
    takeaway: 'Each function has its own **scope**. Variables made inside it are separate from variables outside, even with the same name. To get a value out, `return` it.',
  },
  {
    id: 'scope-2',
    conceptId: 'scope',
    title: 'Counter Trouble',
    role: 'combine',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: `Read three points and print the total. ${lang('Python crashes with an UnboundLocalError.', 'JavaScript prints only the last number, because the score restarts at 0 on every call.')} Fix it the clean way: pass the score **in** as a parameter and **return** the new score.`,
    reinforces: ['loops', 'operators'],
    hints: ['A function can\'t see (or keep) the score unless you hand it over.', lang('Make it `def add_points(score, p):` and `return score + p`.', 'Make it `function addPoints(score, p)` and `return score + p;`.'), lang('Then call it as `score = add_points(score, int(input()))`.', 'Then call it as `score = addPoints(score, Number(prompt()));`.')],
    starterCode: code(
      `
      score = 0

      def add_points(p):
          score += p

      for i in range(3):
          add_points(int(input()))
      print(score)
      `,
      `
      function addPoints(p) {
        let score = 0;
        score += p;
        return score;
      }

      let score = 0;
      for (let i = 0; i < 3; i++) {
        score = addPoints(Number(prompt()));
      }
      console.log(score);
      `,
    ),
    solution: code(
      `
      score = 0

      def add_points(score, p):
          return score + p

      for i in range(3):
          score = add_points(score, int(input()))
      print(score)
      `,
      `
      function addPoints(score, p) {
        return score + p;
      }

      let score = 0;
      for (let i = 0; i < 3; i++) {
        score = addPoints(score, Number(prompt()));
      }
      console.log(score);
      `,
    ),
    tests: [
      { name: '10, 20, 5', input: '10\n20\n5', expectedOutput: '35' },
      { name: '1, 2, 3', input: '1\n2\n3', expectedOutput: '6', hidden: true },
      { name: 'add_points(10, 5) returns 15', input: '1\n1\n1', expectedOutput: '15', harness: { python: 'print(add_points(10, 5))', javascript: 'console.log(addPoints(10, 5));' }, hidden: true },
    ],
    requirements: {
      python: [
        { pattern: '\\bglobal\\b', forbid: true, message: 'Pass the score in and return it instead of using global.' },
        { pattern: 'def add_points\\(', message: 'Keep the add_points function.' },
        { pattern: '=\\s*add_points\\(', message: 'Store what add_points returns: `score = add_points(...)`.' },
      ],
      javascript: [
        { pattern: 'function addPoints\\(', message: 'Keep the addPoints function.' },
        { pattern: '=\\s*addPoints\\(', message: 'Store what addPoints returns: `score = addPoints(...)`.' },
      ],
    },
    takeaway: 'Functions work best as little machines: values go **in** through parameters, results come **out** with `return`.',
  },
  {
    id: 'scope-3',
    conceptId: 'scope',
    title: 'Loop Variable Leak',
    role: 'combine',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: `After a loop ends, do its variables still exist? ${lang('Python and JavaScript disagree here!', 'JavaScript and Python disagree here!')} Predict the output.`,
    reinforces: ['loops'],
    hints: [lang('In Python, a `for` loop\'s variable is still there after the loop, holding its last value.', 'In JavaScript, `let` and `const` inside `{ }` only exist inside those braces.'), lang('The last round had i = 2.', '`typeof` something that doesn\'t exist gives "undefined".')],
    code: code(
      `
      for i in range(3):
          square = i * i
      print(i)
      print(square)
      `,
      `
      for (let i = 0; i < 3; i++) {
        const square = i * i;
      }
      console.log(typeof i);
      console.log(typeof square);
      `,
    ),
    takeaway: lang(
      'In Python, variables made in a loop stay around afterwards: loops and `if`s don\'t make a new scope, functions do.',
      'In JavaScript, `let`/`const` are **block-scoped**: they vanish at the closing `}`.',
    ),
  },
  {
    id: 'scope-4',
    conceptId: 'scope',
    title: 'Shadow Hunt',
    role: 'integrate',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: 'Read three test scores and print the average (1 decimal place) and `Pass` (50 or more) or `Fail`. The average always comes out as 0! Two variables share a name, but they are not the same variable.',
    reinforces: ['input', 'type-conversion', 'operators', 'conditionals'],
    hints: ['The `avg` inside `average` is local; the outside `avg` stays 0.', 'Make `average` return its result.', lang('`avg = average(a, b, c)`', '`const avg = average(a, b, c);`')],
    starterCode: code(
      `
      avg = 0

      def average(a, b, c):
          avg = (a + b + c) / 3

      a = int(input())
      b = int(input())
      c = int(input())
      average(a, b, c)
      print(f"Average: {avg:.1f}")
      if avg >= 50:
          print("Pass")
      else:
          print("Fail")
      `,
      `
      let avg = 0;

      function average(a, b, c) {
        let avg = (a + b + c) / 3;
      }

      const a = Number(prompt());
      const b = Number(prompt());
      const c = Number(prompt());
      average(a, b, c);
      console.log(\`Average: \${avg.toFixed(1)}\`);
      if (avg >= 50) {
        console.log("Pass");
      } else {
        console.log("Fail");
      }
      `,
    ),
    solution: code(
      `
      def average(a, b, c):
          return (a + b + c) / 3

      a = int(input())
      b = int(input())
      c = int(input())
      avg = average(a, b, c)
      print(f"Average: {avg:.1f}")
      if avg >= 50:
          print("Pass")
      else:
          print("Fail")
      `,
      `
      function average(a, b, c) {
        return (a + b + c) / 3;
      }

      const a = Number(prompt());
      const b = Number(prompt());
      const c = Number(prompt());
      const avg = average(a, b, c);
      console.log(\`Average: \${avg.toFixed(1)}\`);
      if (avg >= 50) {
        console.log("Pass");
      } else {
        console.log("Fail");
      }
      `,
    ),
    tests: [
      { name: '60, 70, 80', input: '60\n70\n80', expectedOutput: 'Average: 70.0\nPass' },
      { name: '10, 20, 30', input: '10\n20\n30', expectedOutput: 'Average: 20.0\nFail' },
      { name: '50, 50, 50', input: '50\n50\n50', expectedOutput: 'Average: 50.0\nPass', hidden: true },
      { name: 'average(1, 2, 3) returns 2', input: '1\n1\n1', expectedOutput: { python: '2.0', javascript: '2' }, harness: { python: 'print(average(1, 2, 3))', javascript: 'console.log(average(1, 2, 3));' }, hidden: true },
    ],
  },
];
