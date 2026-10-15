import type { Level } from '@codegames/shared';
import { code, same, grid } from '../../helpers';
import { lang } from '../../localize';

/** functions levels, in play order. */
export const functionsLevels: Level[] = [
  {
    id: 'functions-1',
    conceptId: 'functions',
    title: 'Walk N',
    role: 'intro',
    game: 'grid-quest',
    mode: 'fill-blanks',
    prompt: `Your commands can take **inputs**! The name in the brackets of ${lang('`def walk(steps):`', '`function walk(steps)`')} is a **parameter**: a variable that gets its value when you *call* the command. \`walk(3)\` walks 3 steps; \`walk(2)\` walks 2.\n\nFill in the blank so \`walk\` uses its parameter.`,
    reinforces: ['custom-commands'],
    hints: ['The loop should repeat as many times as the value passed in.', 'If you write a number in the blank, `walk(2)` will walk the wrong distance.', 'The blank is `steps`.'],
    grid: grid(`
      #######
      ####G##
      ####.##
      #>...##
      #######
    `),
    starterCode: code(
      `
      def walk(steps):
          for i in range(___):
              move()

      walk(3)
      turn_left()
      walk(2)
      collect()
      `,
      `
      function walk(steps) {
        for (let i = 0; i < ___; i++) {
          move();
        }
      }

      walk(3);
      turnLeft();
      walk(2);
      collect();
      `,
    ),
    solution: code(
      `
      def walk(steps):
          for i in range(steps):
              move()

      walk(3)
      turn_left()
      walk(2)
      collect()
      `,
      `
      function walk(steps) {
        for (let i = 0; i < steps; i++) {
          move();
        }
      }

      walk(3);
      turnLeft();
      walk(2);
      collect();
      `,
    ),
    maxLines: 12,
    takeaway: 'A **parameter** is a variable in the definition; an **argument** is the value you pass in the call. `walk(3)` passes the argument 3 into the parameter `steps`.',
  },
  {
    id: 'functions-2',
    conceptId: 'functions',
    title: 'Names on the Inside',
    role: 'combine',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: 'Does the argument need the same name as the parameter? Predict the output.',
    reinforces: ['string-formatting'],
    hints: ['Inside `greet`, `name` is whatever value was passed in, whatever the caller called it.', 'Setting a variable called `name` outside the function doesn\'t change what `greet(pet)` passes.'],
    code: code(
      `
      def greet(name):
          print(f"Hi, {name}!")

      pet = "Rex"
      greet(pet)
      greet("Bo")
      name = "Zed"
      greet(pet)
      `,
      `
      function greet(name) {
        console.log(\`Hi, \${name}!\`);
      }

      const pet = "Rex";
      greet(pet);
      greet("Bo");
      const name = "Zed";
      greet(pet);
      `,
    ),
    modify: {
      prompt: 'Now **modify** it: add one line at the end so it also greets Zed, using the `name` variable. Don\'t change the function.',
      expectedOutput: 'Hi, Rex!\nHi, Bo!\nHi, Rex!\nHi, Zed!',
      solution: code(
        `
        def greet(name):
            print(f"Hi, {name}!")

        pet = "Rex"
        greet(pet)
        greet("Bo")
        name = "Zed"
        greet(pet)
        greet(name)
        `,
        `
        function greet(name) {
          console.log(\`Hi, \${name}!\`);
        }

        const pet = "Rex";
        greet(pet);
        greet("Bo");
        const name = "Zed";
        greet(pet);
        greet(name);
        `,
      ),
      requirements: {
        python: [
          { pattern: 'greet\\(\\s*name\\s*\\)\\s*$', message: 'Call greet with the name variable.' },
          { pattern: 'print\\(\\s*f?"Hi, Zed', forbid: true, message: 'Use greet(), not a new print.' },
        ],
        javascript: [
          { pattern: 'greet\\(\\s*name\\s*\\);?\\s*$', message: 'Call greet with the name variable.' },
          { pattern: 'console\\.log\\(\\s*["`]Hi, Zed', forbid: true, message: 'Use greet(), not a new console.log.' },
        ],
      },
    },
    takeaway: 'Arguments are matched to parameters by **position**, not by name. Inside the function, the parameter is a brand-new name for whatever was passed in.',
  },
  {
    id: 'functions-3',
    conceptId: 'functions',
    title: 'Wrong Way Round',
    role: 'combine',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: 'The box should be **5 wide and 3 tall**, but it comes out tall and thin. The function is fine: fix the **call**.',
    reinforces: ['nested-loops'],
    hints: ['Look at the order of the parameters in the definition.', 'The first value you pass becomes `width`, the second becomes `height`.', 'Call it as `box(5, 3)`.'],
    starterCode: code(
      `
      def box(width, height):
          for row in range(height):
              line = ""
              for col in range(width):
                  line += "#"
              print(line)

      box(3, 5)
      `,
      `
      function box(width, height) {
        for (let row = 0; row < height; row++) {
          let line = "";
          for (let col = 0; col < width; col++) {
            line += "#";
          }
          console.log(line);
        }
      }

      box(3, 5);
      `,
    ),
    solution: code(
      `
      def box(width, height):
          for row in range(height):
              line = ""
              for col in range(width):
                  line += "#"
              print(line)

      box(5, 3)
      `,
      `
      function box(width, height) {
        for (let row = 0; row < height; row++) {
          let line = "";
          for (let col = 0; col < width; col++) {
            line += "#";
          }
          console.log(line);
        }
      }

      box(5, 3);
      `,
    ),
    tests: [{ name: '5 wide, 3 tall', expectedOutput: '#####\n#####\n#####' }],
    requirements: {
      python: [
        { pattern: 'def box\\(width, height\\):', message: 'Leave the function as it is; fix the call.' },
        { pattern: 'for row in range\\(height\\)', message: 'Leave the function as it is; fix the call.' },
        { pattern: 'box\\(\\s*(5\\s*,\\s*3|width\\s*=\\s*5\\s*,\\s*height\\s*=\\s*3|height\\s*=\\s*3\\s*,\\s*width\\s*=\\s*5)\\s*\\)', message: 'Fix the call to the function.' },
      ],
      javascript: [
        { pattern: 'function box\\(width, height\\)', message: 'Leave the function as it is; fix the call.' },
        { pattern: 'row < height', message: 'Leave the function as it is; fix the call.' },
        { pattern: 'box\\(\\s*(5\\s*,\\s*3)\\s*\\)', message: 'Fix the call to the function.' },
      ],
    },
    takeaway: lang(
      'Arguments go to parameters in order. Python also lets you name them to be safe: `box(width=5, height=3)`.',
      'Arguments go to parameters in order, so the order in the call must match the order in the definition. JavaScript doesn\'t check the count either: pass too few and the missing parameter is `undefined` (so maths with it gives `NaN`).',
    ),
  },
  {
    id: 'functions-4',
    conceptId: 'functions',
    title: 'Pattern Painter',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: `Write two functions:\n- \`row(char, n)\` **prints** one line of \`n\` copies of \`char\`, built with a loop\n- \`triangle(n)\` prints a triangle of \`*\` with \`n\` rows by **calling \`row\`**\n\nThen read \`n\` and call \`triangle(n)\`. For 3:\n\n\`\`\`\n*\n**\n***\n\`\`\`\n\nHidden tests also call your functions directly, and check that \`triangle\` really uses \`row\`.`,
    reinforces: ['nested-loops', 'loops', 'input', 'type-conversion'],
    hints: [
      '`row` starts with an empty string, adds `char` to it in a loop, then prints it.',
      'Rows go from 1 to n: row 1 has 1 star. So `triangle` loops and calls `row("*", ...)` each time round.',
      lang('In `triangle`: `for i in range(1, n + 1): row("*", i)`', 'In `triangle`: `for (let i = 1; i <= n; i++) { row("*", i); }`'),
    ],
    starterCode: code(
      `
      def row(char, n):
          # build a line of n copies of char, then print it
          pass

      def triangle(n):
          # print n rows, using row()
          pass

      # read n, then draw the triangle
      `,
      `
      function row(char, n) {
        // build a line of n copies of char, then print it
      }

      function triangle(n) {
        // print n rows, using row()
      }

      // read n, then draw the triangle
      `,
    ),
    solution: code(
      `
      def row(char, n):
          line = ""
          for i in range(n):
              line += char
          print(line)

      def triangle(n):
          for i in range(1, n + 1):
              row("*", i)

      n = int(input())
      triangle(n)
      `,
      `
      function row(char, n) {
        let line = "";
        for (let i = 0; i < n; i++) {
          line += char;
        }
        console.log(line);
      }

      function triangle(n) {
        for (let i = 1; i <= n; i++) {
          row("*", i);
        }
      }

      const n = Number(prompt());
      triangle(n);
      `,
    ),
    tests: [
      { name: 'triangle of 3', input: '3', expectedOutput: '*\n**\n***' },
      { name: 'triangle of 5', input: '5', expectedOutput: '*\n**\n***\n****\n*****', hidden: true },
      { name: 'row("#", 4)', input: '1', expectedOutput: '####', harness: { python: 'row("#", 4)', javascript: 'row("#", 4);' }, hidden: true },
      {
        name: 'triangle(2) calls row',
        input: '1',
        expectedOutput: 'row called\n*\nrow called\n**',
        // Spy: swap in a row() that announces itself, so triangle must go through it.
        harness: {
          python: '_row = row\ndef row(*args, **kwargs):\n    print("row called")\n    _row(*args, **kwargs)\ntriangle(2)',
          javascript: 'const _row = row;\nrow = (...args) => {\n  console.log("row called");\n  _row(...args);\n};\ntriangle(2);',
        },
        hidden: true,
      },
    ],
    requirements: {
      python: [{ pattern: '\\*\\s*\\(?\\s*n\\b|\\bn\\s*\\)?\\s*\\*|\\.ljust\\(|\\.rjust\\(', forbid: true, message: 'Build the row in a loop this time (no * shortcut).' }],
      javascript: [
        { pattern: '\\.repeat\\(|\\.padEnd\\(|\\.padStart\\(', forbid: true, message: 'Build the row in a loop this time (no .repeat shortcut).' },
        { pattern: 'function\\s+row\\s*\\(', message: 'Keep `function row(char, n)` from the starter: the hidden tests check that triangle uses it.' },
      ],
    },
  },
  {
    id: 'functions-5',
    conceptId: 'functions',
    title: 'Spiral',
    role: 'challenge',
    game: 'grid-quest',
    mode: 'freeform',
    prompt: 'Collect every gem by spiralling inward. Each side gets shorter: 4, 4, 4, 3, 3, 2, 2, 1, 1. Write `side(n)` (walk n, collect, turn left) and drive it with a loop where n shrinks. *Optional challenge.*',
    reinforces: ['while-loops', 'loops', 'custom-commands'],
    hints: ['Each side ends on a gem: walk, collect, turn left.', 'After the first side, the lengths come in pairs.', 'Call side(4) once, then loop: side(n), side(n), n -= 1.'],
    grid: grid(`
      #######
      #G...G#
      #.G.G.#
      #.GG..#
      #G..G.#
      #>...G#
      #######
    `),
    starterCode: same(''),
    solution: code(
      `
      def side(n):
          for i in range(n):
              move()
          collect()
          turn_left()

      n = 4
      side(n)
      while n > 0:
          side(n)
          side(n)
          n -= 1
      `,
      `
      function side(n) {
        for (let i = 0; i < n; i++) {
          move();
        }
        collect();
        turnLeft();
      }

      let n = 4;
      side(n);
      while (n > 0) {
        side(n);
        side(n);
        n -= 1;
      }
      `,
    ),
    maxLines: 16,
    requirements: {
      python: [
        { pattern: 'def\\s+side\\s*\\(\\s*\\w+\\s*\\)', message: 'Define side(n) with a parameter.' },
        { pattern: '(\\bside\\s*\\([\\s\\S]*){5}', forbid: true, message: 'Let a loop make the calls, with n shrinking each time round, instead of writing every side() by hand.' },
      ],
      javascript: [
        { pattern: 'function\\s+side\\s*\\(\\s*\\w+\\s*\\)', message: 'Define side(n) with a parameter.' },
        { pattern: '(\\bside\\s*\\([\\s\\S]*){5}', forbid: true, message: 'Let a loop make the calls, with n shrinking each time round, instead of writing every side() by hand.' },
      ],
    },
  },
];
