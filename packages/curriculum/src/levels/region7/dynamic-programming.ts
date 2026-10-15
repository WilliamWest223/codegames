import type { Level } from '@codegames/shared';
import { code } from '../../helpers';
import { lang } from '../../localize';
import { pair } from './shared';

const STAIRS_WRONG = pair(
  `
  n = int(input())
  ways = [0] * (n + 2)
  ways[1] = 1
  ways[2] = 1
  for i in range(3, n + 1):
      ways[i] = ways[i - 1] + ways[i - 2]
  print(f"Ways: {ways[n]}")
  `,
  `
  const n = Number(prompt());
  const ways = new Array(n + 2).fill(0);
  ways[1] = 1;
  ways[2] = 1;
  for (let i = 3; i <= n; i++) {
    ways[i] = ways[i - 1] + ways[i - 2];
  }
  console.log(\`Ways: \${ways[n]}\`);
  `,
);

const STAIRS_RIGHT = {
  python: STAIRS_WRONG.python.replace('ways[2] = 1', 'ways[2] = 2'),
  javascript: STAIRS_WRONG.javascript.replace('ways[2] = 1;', 'ways[2] = 2;'),
};

/** dynamic-programming levels, in play order. */
export const dynamicProgrammingLevels: Level[] = [
  {
    id: 'dynamic-programming-1',
    conceptId: 'dynamic-programming',
    title: 'Remember the Answer',
    role: 'intro',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: 'Two versions of the Fibonacci function, each counting how many times it is called. The second one **remembers** every answer in a dictionary (a *memo*) so no value is computed twice. Which output is right?',
    reinforces: ['recursion', 'maps', 'functions', 'big-o'],
    choices: {
      python: ['Naive: 6765 in 21891 calls\nMemo: 6765 in 39 calls', 'Naive: 6765 in 21891 calls\nMemo: 6765 in 21 calls', 'Naive: 6765 in 6765 calls\nMemo: 6765 in 20 calls', 'Naive: 6765 in 21891 calls\nMemo: 6765 in 21891 calls'],
      javascript: ['Naive: 6765 in 21891 calls\nMemo: 6765 in 39 calls', 'Naive: 6765 in 21891 calls\nMemo: 6765 in 21 calls', 'Naive: 6765 in 6765 calls\nMemo: 6765 in 20 calls', 'Naive: 6765 in 21891 calls\nMemo: 6765 in 21891 calls'],
    },
    hints: [
      'Both give the same number; only the call counts differ.',
      'The memo version computes each `fib(k)` once, but every computed `fib(k)` still makes **two** calls: one does real work, the other finds its answer in the memo. The counter counts both.',
      'From 20 down to 1 is 20 calls that do work; the 19 memo hits bring it to 39.',
    ],
    code: code(
      `
      calls = 0

      def fib(n):
          global calls
          calls += 1
          if n < 2:
              return n
          return fib(n - 1) + fib(n - 2)

      memo = {}

      def fib_memo(n):
          global calls
          calls += 1
          if n < 2:
              return n
          if n not in memo:
              memo[n] = fib_memo(n - 1) + fib_memo(n - 2)
          return memo[n]

      print(f"Naive: {fib(20)} in {calls} calls")
      calls = 0
      print(f"Memo: {fib_memo(20)} in {calls} calls")
      `,
      `
      let calls = 0;

      function fib(n) {
        calls += 1;
        if (n < 2) {
          return n;
        }
        return fib(n - 1) + fib(n - 2);
      }

      const memo = {};

      function fibMemo(n) {
        calls += 1;
        if (n < 2) {
          return n;
        }
        if (!Object.hasOwn(memo, n)) {
          memo[n] = fibMemo(n - 1) + fibMemo(n - 2);
        }
        return memo[n];
      }

      console.log(\`Naive: \${fib(20)} in \${calls} calls\`);
      calls = 0;
      console.log(\`Memo: \${fibMemo(20)} in \${calls} calls\`);
      `,
    ),
    investigate: [
      { question: 'Why is the naive version so slow?', choices: ['It recomputes the same sub-problems over and over: fib(18) is computed twice, fib(17) three times, and so on, exponentially', 'Recursion is always slow', 'Because 6765 is a big number'], answer: 0 },
      { question: 'What makes a problem a good fit for memoization?', choices: ['Overlapping sub-problems: the same smaller question is asked many times', 'Any loop', 'Problems with no recursion'], answer: 0 },
    ],
    takeaway: '**Dynamic programming** is recursion plus memory: when the same sub-problem comes up again and again, store its answer and look it up. The naive version is O(2ⁿ); the memo version is O(n). The next step is to drop recursion entirely and fill a table from the small cases up.',
  },
  {
    id: 'dynamic-programming-2',
    conceptId: 'dynamic-programming',
    title: 'Off by One Step',
    role: 'combine',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: 'How many ways can you climb `n` stairs taking 1 or 2 steps at a time? Each stair\'s count is the sum of the two below it, filled in **bottom-up**: 10 stairs → `Ways: 89`.\n\nIt prints `Ways: 55`, and says there is only 1 way to climb 2 stairs when there are 2 (`1+1` and `2`). The table\'s starting values are wrong. Fix them.',
    reinforces: ['collections', 'loops', 'input', 'type-conversion', 'recursion', 'string-formatting'],
    hints: [
      'The whole table is built from `ways[1]` and `ways[2]`. If one of those is wrong, every later value is wrong too.',
      'Count by hand: 1 stair → 1 way. 2 stairs → `1+1` or `2`: 2 ways. 3 stairs → 3 ways.',
      'Set `ways[2] = 2`.',
    ],
    starterCode: STAIRS_WRONG,
    solution: STAIRS_RIGHT,
    tests: [
      { name: 'ten stairs', input: '10', expectedOutput: 'Ways: 89' },
      { name: 'two stairs', input: '2', expectedOutput: 'Ways: 2' },
      { name: 'one stair', input: '1', expectedOutput: 'Ways: 1', hidden: true },
      { name: 'twenty stairs', input: '20', expectedOutput: 'Ways: 10946', hidden: true },
    ],
    takeaway: 'A bottom-up table replaces recursion with a loop: compute the small cases first and build on them, so there is no call stack and no memo lookup. Its weak point is the **base cases**: an error there propagates through every cell, so check the smallest inputs by hand before trusting the big ones.',
  },
  {
    id: 'dynamic-programming-3',
    conceptId: 'dynamic-programming',
    title: 'Making Change',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: `A vending machine with the coin values on the first line (like \`1 3 4\`). Then amounts until \`done\`; for each, print the fewest coins that make it and the number of different coin combinations:\n\n\`\`\`\n6: fewest 2, ways 4\n2: impossible, ways 0\n\`\`\`\n\nWrite ${lang('`fewest(coins, amount)`', '`fewest(coins, amount)`')}, which **returns** the minimum number of coins or -1, and ${lang('`ways(coins, amount)`', '`ways(coins, amount)`')}, which returns how many combinations there are (order does not matter: 3+3 and 1+1+4 are different, 1+4 and 4+1 are the same). Both fill a table from 0 up to the amount. Greedy "take the biggest coin" does not work here: 6 with coins 1 3 4 is 3+3, not 4+1+1.`,
    reinforces: ['collections', 'loops', 'nested-loops', 'functions', 'return-values', 'conditionals', 'input', 'type-conversion', 'string-formatting', 'strings', 'while-loops'],
    hints: [
      lang('`fewest`: `best = [0] + [None] * amount`. For each `a` from 1 to amount, for each coin `c <= a` with `best[a - c]` known: `best[a]` is the smallest `best[a - c] + 1`. Return `best[amount]` or -1.', '`fewest`: `best = [0, ...]` with `Infinity` for the rest. For each `a` from 1 to amount, for each coin `c <= a`: `best[a] = Math.min(best[a], best[a - c] + 1)`. Return `best[amount]` or -1 if still `Infinity`.'),
      lang('`ways`: `table = [1] + [0] * amount`. For each **coin** (outer loop), for each `a` from `coin` to amount: `table[a] += table[a - coin]`. Coins outside makes each combination count once.', '`ways`: `table = [1, 0, 0, ...]`. For each **coin** (outer loop), for each `a` from `coin` to amount: `table[a] += table[a - coin]`. Coins outside makes each combination count once.'),
      lang('Output: `print(f"{amount}: fewest {f}, ways {w}")`, with `impossible` in place of `fewest {f}` when `f == -1`.', 'Output: `${amount}: fewest ${f}, ways ${w}`, with `impossible` in place of `fewest ${f}` when `f === -1`.'),
    ],
    starterCode: code(
      `
      def fewest(coins, amount):
          # Minimum coins to make amount, or -1.
          pass

      def ways(coins, amount):
          # Number of coin combinations that make amount.
          pass

      coins = list(map(int, input().split()))
      # Read amounts until "done" and report each.
      `,
      `
      function fewest(coins, amount) {
        // Minimum coins to make amount, or -1.
      }

      function ways(coins, amount) {
        // Number of coin combinations that make amount.
      }

      const coins = prompt().split(" ").map(Number);
      // Read amounts until "done" and report each.
      `,
    ),
    solution: code(
      `
      def fewest(coins, amount):
          best = [0] + [None] * amount
          for a in range(1, amount + 1):
              for c in coins:
                  if c <= a and best[a - c] is not None:
                      if best[a] is None or best[a - c] + 1 < best[a]:
                          best[a] = best[a - c] + 1
          return -1 if best[amount] is None else best[amount]

      def ways(coins, amount):
          table = [1] + [0] * amount
          for c in coins:
              for a in range(c, amount + 1):
                  table[a] += table[a - c]
          return table[amount]

      coins = list(map(int, input().split()))
      while True:
          line = input()
          if line == "done":
              break
          amount = int(line)
          f = fewest(coins, amount)
          w = ways(coins, amount)
          if f == -1:
              print(f"{amount}: impossible, ways {w}")
          else:
              print(f"{amount}: fewest {f}, ways {w}")
      `,
      `
      function fewest(coins, amount) {
        const best = new Array(amount + 1).fill(Infinity);
        best[0] = 0;
        for (let a = 1; a <= amount; a++) {
          for (const c of coins) {
            if (c <= a && best[a - c] + 1 < best[a]) {
              best[a] = best[a - c] + 1;
            }
          }
        }
        return best[amount] === Infinity ? -1 : best[amount];
      }

      function ways(coins, amount) {
        const table = new Array(amount + 1).fill(0);
        table[0] = 1;
        for (const c of coins) {
          for (let a = c; a <= amount; a++) {
            table[a] += table[a - c];
          }
        }
        return table[amount];
      }

      const coins = prompt().split(" ").map(Number);
      while (true) {
        const line = prompt();
        if (line === "done") {
          break;
        }
        const amount = Number(line);
        const f = fewest(coins, amount);
        const w = ways(coins, amount);
        if (f === -1) {
          console.log(\`\${amount}: impossible, ways \${w}\`);
        } else {
          console.log(\`\${amount}: fewest \${f}, ways \${w}\`);
        }
      }
      `,
    ),
    tests: [
      { name: 'greedy would be wrong', input: '1 3 4\n6\n10\ndone', expectedOutput: '6: fewest 2, ways 4\n10: fewest 3, ways 8' },
      { name: 'impossible amounts', input: '2 5\n3\n7\n10\ndone', expectedOutput: '3: impossible, ways 0\n7: fewest 2, ways 1\n10: fewest 2, ways 2', hidden: true },
      { name: 'zero', input: '1 2\n0\ndone', expectedOutput: '0: fewest 0, ways 1', hidden: true },
      {
        name: 'functions on their own',
        input: '1\ndone',
        hidden: true,
        expectedOutput: '2 2 -1 0',
        harness: code('print(fewest([1, 3, 4], 6), ways([2, 5], 10), fewest([2], 3), ways([2], 3))', 'console.log(fewest([1, 3, 4], 6), ways([2, 5], 10), fewest([2], 3), ways([2], 3));'),
      },
    ],
    takeaway: 'Two tables, two questions, one method: define `table[a]` as "the answer for amount a", work out how it follows from smaller amounts, fill from 0 up. The loop **order** matters: coins outside / amounts inside counts each combination once; the other way round counts orderings. Dynamic programming is less a trick than a habit: ask "what is the answer for a smaller input, and how does mine follow from it?"',
  },
];
