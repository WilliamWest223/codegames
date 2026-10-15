import type { Level } from '@codegames/shared';
import { code, grid, same } from '../../helpers';
import { lang } from '../../localize';

/** recursion levels, in play order. */
export const recursionLevels: Level[] = [
  {
    id: 'recursion-1',
    conceptId: 'recursion',
    title: 'Countdown',
    role: 'intro',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: 'A **recursive** function calls itself. Each call waits for the call it made to finish, then carries on from where it was. Watch the lines **after** the call. Which output is right?',
    reinforces: ['functions'],
    choices: {
      python: [
        '3\n2\n1\nLiftoff!\nback in 1\nback in 2\nback in 3',
        '3\n2\n1\nLiftoff!',
        '3\n2\n1\nLiftoff!\nback in 3\nback in 2\nback in 1',
        '3\nback in 3\n2\nback in 2\n1\nback in 1\nLiftoff!',
      ],
      javascript: [
        '3\n2\n1\nLiftoff!\nback in 1\nback in 2\nback in 3',
        '3\n2\n1\nLiftoff!',
        '3\n2\n1\nLiftoff!\nback in 3\nback in 2\nback in 1',
        '3\nback in 3\n2\nback in 2\n1\nback in 1\nLiftoff!',
      ],
    },
    hints: [
      '`countdown(3)` prints 3, then calls `countdown(2)` and **waits**. Only when that call finishes does it print `back in 3`.',
      '`countdown(0)` is the **base case**: it prints `Liftoff!` and returns without calling again. That\'s what stops the chain.',
      'After Liftoff, the waiting calls finish in reverse order: the newest one first.',
    ],
    code: code(
      `
      def countdown(n):
          if n == 0:
              print("Liftoff!")
              return
          print(n)
          countdown(n - 1)
          print(f"back in {n}")

      countdown(3)
      `,
      `
      function countdown(n) {
        if (n === 0) {
          console.log("Liftoff!");
          return;
        }
        console.log(n);
        countdown(n - 1);
        console.log(\`back in \${n}\`);
      }

      countdown(3);
      `,
    ),
    takeaway: 'Every recursive function needs a **base case** (here `n == 0`) that stops without calling itself, and a **recursive case** that calls itself on a smaller problem (`n - 1`). Each call waits on the **call stack** until the one it made returns, so the code after the call runs on the way back out, newest call first. Use **Step through** to watch the stack grow and shrink.',
  },
  {
    id: 'recursion-2',
    conceptId: 'recursion',
    title: 'Loopless Walk',
    role: 'combine',
    game: 'grid-quest',
    mode: 'fill-blanks',
    prompt: '`sweep()` walks forward until a wall, collecting gems on the way, **without a loop**: it takes one step and then calls itself to do the rest. Fill in the base case and the recursive call. The same code must work on two more maps.',
    reinforces: ['conditionals', 'custom-commands', 'functions'],
    hints: [
      'The base case is when the walk is over: the robot is facing a wall.',
      lang(
        '`if is_blocked(): return` stops this call. Otherwise take one step, then let `sweep()` handle the rest of the corridor.',
        '`if (isBlocked()) { return; }` stops this call. Otherwise take one step, then let `sweep()` handle the rest of the corridor.',
      ),
      'The last line of `sweep` is `sweep()` itself.',
    ],
    grid: grid(`
      #######
      #####G#
      #####.#
      #>.G..#
      #######
    `),
    extraGrids: [
      grid(`
        #########
        #######G#
        #######.#
        #######G#
        #>G.....#
        #########
      `),
      grid(`
        ######
        ####.#
        ####G#
        #>..G#
        ######
      `),
    ],
    starterCode: code(
      `
      def sweep():
          if on_gem():
              collect()
          if ___:
              return
          move()
          ___

      sweep()
      turn_left()
      sweep()
      `,
      `
      function sweep() {
        if (onGem()) {
          collect();
        }
        if (___) {
          return;
        }
        move();
        ___;
      }

      sweep();
      turnLeft();
      sweep();
      `,
    ),
    solution: code(
      `
      def sweep():
          if on_gem():
              collect()
          if is_blocked():
              return
          move()
          sweep()

      sweep()
      turn_left()
      sweep()
      `,
      `
      function sweep() {
        if (onGem()) {
          collect();
        }
        if (isBlocked()) {
          return;
        }
        move();
        sweep();
      }

      sweep();
      turnLeft();
      sweep();
      `,
    ),
    requirements: {
      python: [{ pattern: '\\b(while|for)\\b', forbid: true, message: 'No loops: `sweep` repeats by calling itself.' }],
      javascript: [{ pattern: '\\b(while|for)\\b', forbid: true, message: 'No loops: `sweep` repeats by calling itself.' }],
    },
    takeaway: 'Recursion can do a loop\'s job. The base case is the loop\'s stop condition (`is the way blocked?`), and calling yourself is "go round again". Loops are usually simpler for straight lines; recursion shines when the path **branches**, which is coming up.',
  },
  {
    id: 'recursion-3',
    conceptId: 'recursion',
    title: 'Smaller and Smaller',
    role: 'combine',
    game: 'build-it',
    mode: 'fill-blanks',
    prompt: 'Two classic recursive functions, no loops allowed:\n- `total(numbers)`: the total of an empty list is 0; otherwise it\'s the **first** number plus the total of **the rest**.\n- `reverse(text)`: an empty string reversed is `""`; otherwise it\'s the rest reversed, then the first letter.\n\nThe program should print `27` and `reward`.',
    reinforces: ['collections', 'strings', 'return-values'],
    hints: [
      lang(
        '`numbers[1:]` is the list without its first item; `text[1:]` is the text without its first letter.',
        '`numbers.slice(1)` is the array without its first item; `text.slice(1)` is the text without its first letter.',
      ),
      'Trust the recursive call: assume `total(the rest)` already gives the right answer, and just add the first number to it.',
      lang(
        '`return numbers[0] + total(numbers[1:])` and `return reverse(text[1:]) + text[0]`.',
        '`return numbers[0] + total(numbers.slice(1));` and `return reverse(text.slice(1)) + text[0];`.',
      ),
    ],
    starterCode: code(
      `
      def total(numbers):
          if len(numbers) == 0:
              return ___
          return numbers[0] + ___

      def reverse(text):
          if text == "":
              return ""
          return ___ + text[0]

      print(total([4, 8, 15]))
      print(reverse("drawer"))
      `,
      `
      function total(numbers) {
        if (numbers.length === 0) {
          return ___;
        }
        return numbers[0] + ___;
      }

      function reverse(text) {
        if (text === "") {
          return "";
        }
        return ___ + text[0];
      }

      console.log(total([4, 8, 15]));
      console.log(reverse("drawer"));
      `,
    ),
    solution: code(
      `
      def total(numbers):
          if len(numbers) == 0:
              return 0
          return numbers[0] + total(numbers[1:])

      def reverse(text):
          if text == "":
              return ""
          return reverse(text[1:]) + text[0]

      print(total([4, 8, 15]))
      print(reverse("drawer"))
      `,
      `
      function total(numbers) {
        if (numbers.length === 0) {
          return 0;
        }
        return numbers[0] + total(numbers.slice(1));
      }

      function reverse(text) {
        if (text === "") {
          return "";
        }
        return reverse(text.slice(1)) + text[0];
      }

      console.log(total([4, 8, 15]));
      console.log(reverse("drawer"));
      `,
    ),
    tests: [
      { name: 'the examples', expectedOutput: '27\nreward' },
      {
        name: 'edge cases',
        hidden: true,
        expectedOutput: '0 7 desserts',
        harness: code('print(total([]), total([7]), reverse("stressed"))', 'console.log(total([]), total([7]), reverse("stressed"));'),
      },
    ],
    requirements: {
      python: [
        { pattern: '\\b(while|for)\\b', forbid: true, message: 'No loops: let each function call itself on a smaller piece.' },
        { pattern: '\\bsum\\(|\\[::-1\\]|reversed\\(', forbid: true, message: 'No shortcuts this time: build the answer recursively.' },
      ],
      javascript: [
        { pattern: '\\b(while|for)\\b', forbid: true, message: 'No loops: let each function call itself on a smaller piece.' },
        { pattern: '\\.reduce\\(|\\.reverse\\(', forbid: true, message: 'No shortcuts this time: build the answer recursively.' },
      ],
    },
  },
  {
    id: 'recursion-4',
    conceptId: 'recursion',
    title: 'Stair Climber',
    role: 'integrate',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: 'You can climb a staircase **1 or 2 steps** at a time. `ways(n)` counts the different ways to climb `n` stairs: the last move was either a 1-step (from `n - 1`) or a 2-step (from `n - 2`), so `ways(n) = ways(n - 1) + ways(n - 2)`.\n\nFor 4 stairs it should print `Ways to climb 4: 5`. Instead it crashes for every `n` above 0. Read the error: what does it say the function kept doing?',
    reinforces: ['input', 'type-conversion', 'return-values', 'conditionals', 'booleans'],
    hints: [
      'Trace `ways(1)` by hand: it calls `ways(0)` (fine, that\'s the base case) and `ways(-1)`. What does `ways(-1)` call?',
      'Subtracting 2 can **jump over** 0, so the base case never catches it and the calls go on forever (until the call stack overflows).',
      lang(
        'There is exactly 1 way to climb 0 stairs and 1 way to climb 1 stair: make the base case `if steps <= 1: return 1`.',
        'There is exactly 1 way to climb 0 stairs and 1 way to climb 1 stair: make the base case `if (steps <= 1) { return 1; }`.',
      ),
    ],
    starterCode: code(
      `
      def ways(steps):
          if steps == 0:
              return 1
          return ways(steps - 1) + ways(steps - 2)

      n = int(input())
      print(f"Ways to climb {n}: {ways(n)}")
      `,
      `
      function ways(steps) {
        if (steps === 0) {
          return 1;
        }
        return ways(steps - 1) + ways(steps - 2);
      }

      const n = Number(prompt());
      console.log(\`Ways to climb \${n}: \${ways(n)}\`);
      `,
    ),
    solution: code(
      `
      def ways(steps):
          if steps <= 1:
              return 1
          return ways(steps - 1) + ways(steps - 2)

      n = int(input())
      print(f"Ways to climb {n}: {ways(n)}")
      `,
      `
      function ways(steps) {
        if (steps <= 1) {
          return 1;
        }
        return ways(steps - 1) + ways(steps - 2);
      }

      const n = Number(prompt());
      console.log(\`Ways to climb \${n}: \${ways(n)}\`);
      `,
    ),
    tests: [
      { name: '4 stairs', input: '4', expectedOutput: 'Ways to climb 4: 5' },
      { name: '1 stair', input: '1', expectedOutput: 'Ways to climb 1: 1' },
      { name: '10 stairs', input: '10', expectedOutput: 'Ways to climb 10: 89', hidden: true },
      { name: 'no stairs', input: '0', expectedOutput: 'Ways to climb 0: 1', hidden: true },
    ],
    takeaway: lang(
      '`RecursionError: maximum recursion depth exceeded` means a function never reached its base case. Every recursive call must move **toward** a base case it is guaranteed to hit: when a step can jump by 2, catch both 0 and 1 (`<= 1`). Bonus: this function repeats the same work many times. Region 6 shows how to remember answers (memoization).',
      '`RangeError: Maximum call stack size exceeded` means a function never reached its base case, so the waiting calls piled up until the stack ran out. Every recursive call must move **toward** a base case it is guaranteed to hit: when a step can jump by 2, catch both 0 and 1 (`<= 1`). Bonus: this function repeats the same work many times. Region 6 shows how to remember answers (memoization).',
    ),
  },
  {
    id: 'recursion-5',
    conceptId: 'recursion',
    title: 'Tower of Hanoi',
    role: 'challenge',
    game: 'build-it',
    mode: 'freeform',
    prompt: 'Move a stack of `n` disks from peg **A** to peg **C**, using **B** as a spare. Only one disk moves at a time, and a bigger disk never sits on a smaller one.\n\nRead `n`, print every move as `Move disk D from X to Y`, then `Moves: N`. For `n = 2`:\n\n```\nMove disk 1 from A to B\nMove disk 2 from A to C\nMove disk 1 from B to C\nMoves: 3\n```\n\nThe trick: to move `n` disks, move the top `n - 1` out of the way, move the biggest one, then move the `n - 1` back on top. Make your function **return** how many moves it made.',
    reinforces: ['functions', 'return-values', 'input', 'type-conversion', 'string-formatting', 'conditionals'],
    hints: [
      lang(
        '`def hanoi(n, start, goal, spare):` with base case `if n == 0: return 0`.',
        '`function hanoi(n, start, goal, spare)` with base case `if (n === 0) { return 0; }`.',
      ),
      'Three steps: `hanoi(n - 1, start, spare, goal)`, print the move of disk `n` from `start` to `goal`, `hanoi(n - 1, spare, goal, start)`.',
      'Moves = the moves of the first call + 1 + the moves of the second call.',
    ],
    starterCode: same(''),
    solution: code(
      `
      def hanoi(n, start, goal, spare):
          if n == 0:
              return 0
          moves = hanoi(n - 1, start, spare, goal)
          print(f"Move disk {n} from {start} to {goal}")
          moves += 1
          moves += hanoi(n - 1, spare, goal, start)
          return moves

      n = int(input())
      total = hanoi(n, "A", "C", "B")
      print(f"Moves: {total}")
      `,
      `
      function hanoi(n, start, goal, spare) {
        if (n === 0) {
          return 0;
        }
        let moves = hanoi(n - 1, start, spare, goal);
        console.log(\`Move disk \${n} from \${start} to \${goal}\`);
        moves += 1;
        moves += hanoi(n - 1, spare, goal, start);
        return moves;
      }

      const n = Number(prompt());
      const total = hanoi(n, "A", "C", "B");
      console.log(\`Moves: \${total}\`);
      `,
    ),
    tests: [
      { name: '2 disks', input: '2', expectedOutput: 'Move disk 1 from A to B\nMove disk 2 from A to C\nMove disk 1 from B to C\nMoves: 3' },
      {
        name: '3 disks',
        input: '3',
        expectedOutput: 'Move disk 1 from A to C\nMove disk 2 from A to B\nMove disk 1 from C to B\nMove disk 3 from A to C\nMove disk 1 from B to A\nMove disk 2 from B to C\nMove disk 1 from A to C\nMoves: 7',
      },
      { name: '1 disk', input: '1', expectedOutput: 'Move disk 1 from A to C\nMoves: 1', hidden: true },
      {
        name: '10 disks (only the count is checked)',
        input: '0',
        hidden: true,
        expectedOutput: '1023',
        harness: code(
          `
          import io, contextlib
          with contextlib.redirect_stdout(io.StringIO()):
              _m = hanoi(10, "A", "C", "B")
          print(_m)
          `,
          `
          const _log = console.log;
          console.log = () => {};
          const _m = hanoi(10, "A", "C", "B");
          console.log = _log;
          console.log(_m);
          `,
        ),
      },
    ],
  },
];
