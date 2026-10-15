import type { Level } from '@codegames/shared';
import { code } from '../../helpers';
import { lang } from '../../localize';

/** big-o levels, in play order. */
export const bigOLevels: Level[] = [
  {
    id: 'big-o-1',
    conceptId: 'big-o',
    title: 'Scan vs Pairs',
    role: 'intro',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: 'Algorithms are compared by **how their step count grows** when the input grows. These two functions count their own steps. Which output is right?',
    reinforces: ['nested-loops', 'functions', 'return-values'],
    choices: {
      python: ['10 items: scan 10, pairs 100\n20 items: scan 20, pairs 400', '10 items: scan 10, pairs 20\n20 items: scan 20, pairs 40', '10 items: scan 10, pairs 100\n20 items: scan 20, pairs 200', '10 items: scan 10, pairs 100\n20 items: scan 40, pairs 400'],
      javascript: ['10 items: scan 10, pairs 100\n20 items: scan 20, pairs 400', '10 items: scan 10, pairs 20\n20 items: scan 20, pairs 40', '10 items: scan 10, pairs 100\n20 items: scan 20, pairs 200', '10 items: scan 10, pairs 100\n20 items: scan 40, pairs 400'],
    },
    hints: [
      'A single loop over `n` items takes `n` steps.',
      'A loop **inside** a loop runs the inner body `n` times for each of the `n` outer rounds: `n × n`.',
      'Doubling `n` doubles the scan, but multiplies the pairs by four.',
    ],
    code: code(
      `
      def count_items(n):
          steps = 0
          for i in range(n):
              steps += 1
          return steps

      def count_pairs(n):
          steps = 0
          for i in range(n):
              for j in range(n):
                  steps += 1
          return steps

      for n in [10, 20]:
          print(f"{n} items: scan {count_items(n)}, pairs {count_pairs(n)}")
      `,
      `
      function countItems(n) {
        let steps = 0;
        for (let i = 0; i < n; i++) {
          steps += 1;
        }
        return steps;
      }

      function countPairs(n) {
        let steps = 0;
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) {
            steps += 1;
          }
        }
        return steps;
      }

      for (const n of [10, 20]) {
        console.log(\`\${n} items: scan \${countItems(n)}, pairs \${countPairs(n)}\`);
      }
      `,
    ),
    investigate: [
      { question: 'When `n` doubles from 10 to 20, what happens to the **pairs** count?', choices: ['It doubles', 'It quadruples (×4)', 'It stays the same'], answer: 1 },
      { question: 'A scan of 1,000 items takes about 1,000 steps. A pairs loop over 1,000 items takes about…', choices: ['2,000 steps', '1,000,000 steps', '1,000 steps'], answer: 1 },
    ],
    takeaway: 'Programmers write the growth as **Big-O**: one loop over the input is **O(n)** (double the input, double the work); a loop inside a loop is **O(n²)** (double the input, four times the work). For 10 items nobody notices. For a million, O(n²) is a trillion steps. Counting steps, not seconds, is how you spot that before it hurts.',
  },
  {
    id: 'big-o-2',
    conceptId: 'big-o',
    title: 'Every Pair Once',
    role: 'combine',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: 'This program looks for a duplicate by comparing items in pairs, and counts its comparisons. For `3 1 4 1 5` it should report **10** checks (every pair once) and a duplicate.\n\nIt reports 25 checks and always finds a "duplicate", even for `1 2 3 4`. Why? Fix the loop so each pair is compared **once**, and an item is never compared with itself.',
    reinforces: ['nested-loops', 'iterating-collections', 'booleans', 'input', 'type-conversion'],
    hints: [
      'With `j` starting from 0, the pair (0, 1) is checked twice (also as (1, 0)), and `i == j` compares an item with itself: always equal.',
      lang('Start the inner loop **after** `i`: `for j in range(i + 1, len(items)):`.', 'Start the inner loop **after** `i`: `for (let j = i + 1; j < items.length; j++)`.'),
      'For 5 items that is 4 + 3 + 2 + 1 = 10 pairs: about half of n², still O(n²).',
    ],
    starterCode: code(
      `
      def duplicate_checks(items):
          checks = 0
          found = False
          for i in range(len(items)):
              for j in range(len(items)):
                  checks += 1
                  if items[i] == items[j]:
                      found = True
          return checks, found

      items = list(map(int, input().split()))
      checks, found = duplicate_checks(items)
      print(f"Checks: {checks}")
      print("Duplicate: yes" if found else "Duplicate: no")
      `,
      `
      function duplicateChecks(items) {
        let checks = 0;
        let found = false;
        for (let i = 0; i < items.length; i++) {
          for (let j = 0; j < items.length; j++) {
            checks += 1;
            if (items[i] === items[j]) {
              found = true;
            }
          }
        }
        return [checks, found];
      }

      const items = prompt().split(" ").map(Number);
      const [checks, found] = duplicateChecks(items);
      console.log(\`Checks: \${checks}\`);
      console.log(found ? "Duplicate: yes" : "Duplicate: no");
      `,
    ),
    solution: code(
      `
      def duplicate_checks(items):
          checks = 0
          found = False
          for i in range(len(items)):
              for j in range(i + 1, len(items)):
                  checks += 1
                  if items[i] == items[j]:
                      found = True
          return checks, found

      items = list(map(int, input().split()))
      checks, found = duplicate_checks(items)
      print(f"Checks: {checks}")
      print("Duplicate: yes" if found else "Duplicate: no")
      `,
      `
      function duplicateChecks(items) {
        let checks = 0;
        let found = false;
        for (let i = 0; i < items.length; i++) {
          for (let j = i + 1; j < items.length; j++) {
            checks += 1;
            if (items[i] === items[j]) {
              found = true;
            }
          }
        }
        return [checks, found];
      }

      const items = prompt().split(" ").map(Number);
      const [checks, found] = duplicateChecks(items);
      console.log(\`Checks: \${checks}\`);
      console.log(found ? "Duplicate: yes" : "Duplicate: no");
      `,
    ),
    tests: [
      { name: 'five items, one duplicate', input: '3 1 4 1 5', expectedOutput: 'Checks: 10\nDuplicate: yes' },
      { name: 'no duplicate', input: '1 2 3 4', expectedOutput: 'Checks: 6\nDuplicate: no' },
      { name: 'one item', input: '7', expectedOutput: 'Checks: 0\nDuplicate: no', hidden: true },
      { name: 'two equal items', input: '2 2', expectedOutput: 'Checks: 1\nDuplicate: yes', hidden: true },
    ],
    takeaway: 'Comparing every pair once is n(n−1)/2 checks: about half of n², which is still O(n²). Big-O ignores constant factors like "half"; it cares that doubling the input quadruples the work. Later in this region (Instant Lookups) you\'ll see how a set makes this O(n).',
  },
  {
    id: 'big-o-3',
    conceptId: 'big-o',
    title: 'Growth Table',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: `Build a step counter for three growth rates. Read numbers \`n\` until \`done\` and print one line each:\n\n\`\`\`\nn=16: halve 4, scan 16, pairs 256\n\`\`\`\n\nWrite three functions that **count by looping**, not with formulas:\n- ${lang('`count_halvings(n)`', '`countHalvings(n)`')}: how many times \`n\` can be halved (whole-number division) before it reaches 1 or less. 16 → 4, 5 → 2, 1 → 0. That is **O(log n)**.\n- ${lang('`count_scan(n)`', '`countScan(n)`')}: one step per item, **O(n)**.\n- ${lang('`count_pairs(n)`', '`countPairs(n)`')}: one step per pair in a nested loop, **O(n²)**.`,
    reinforces: ['functions', 'return-values', 'while-loops', 'nested-loops', 'input', 'type-conversion', 'string-formatting'],
    hints: [
      lang('Halving: `while n > 1:` / `    n = n // 2` / `    steps += 1`.', 'Halving: `while (n > 1) { n = Math.floor(n / 2); steps += 1; }`.'),
      'Scan and pairs are the two counters from the first level: one loop, and a loop inside a loop.',
      lang('Read until done: `line = input()` / `if line == "done": break` / `n = int(line)`.', 'Read until done: `const line = prompt();` / `if (line === "done") break;` / `const n = Number(line);`.'),
    ],
    requirements: {
      python: [
        { pattern: '\\*\\*|math\\.|n\\s*\\*\\s*n', forbid: true, message: 'Count the steps with loops: no powers, logs or n * n formulas.' },
        { pattern: '\\bfor\\b[\\s\\S]*\\bfor\\b[\\s\\S]*\\bfor\\b', message: 'Count scan and pairs with for loops (one, then one inside another).' },
      ],
      javascript: [
        { pattern: '\\*\\*|Math\\.(pow|log)|n\\s*\\*\\s*n', forbid: true, message: 'Count the steps with loops: no powers, logs or n * n formulas.' },
        { pattern: '\\bfor\\b[\\s\\S]*\\bfor\\b[\\s\\S]*\\bfor\\b', message: 'Count scan and pairs with for loops (one, then one inside another).' },
      ],
    },
    starterCode: code(
      `
      def count_halvings(n):
          pass

      def count_scan(n):
          pass

      def count_pairs(n):
          pass

      # Read n until "done" and print the table line for each.
      `,
      `
      function countHalvings(n) {
      }

      function countScan(n) {
      }

      function countPairs(n) {
      }

      // Read n until "done" and print the table line for each.
      `,
    ),
    solution: code(
      `
      def count_halvings(n):
          steps = 0
          while n > 1:
              n = n // 2
              steps += 1
          return steps

      def count_scan(n):
          steps = 0
          for i in range(n):
              steps += 1
          return steps

      def count_pairs(n):
          steps = 0
          for i in range(n):
              for j in range(n):
                  steps += 1
          return steps

      while True:
          line = input()
          if line == "done":
              break
          n = int(line)
          print(f"n={n}: halve {count_halvings(n)}, scan {count_scan(n)}, pairs {count_pairs(n)}")
      `,
      `
      function countHalvings(n) {
        let steps = 0;
        while (n > 1) {
          n = Math.floor(n / 2);
          steps += 1;
        }
        return steps;
      }

      function countScan(n) {
        let steps = 0;
        for (let i = 0; i < n; i++) {
          steps += 1;
        }
        return steps;
      }

      function countPairs(n) {
        let steps = 0;
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) {
            steps += 1;
          }
        }
        return steps;
      }

      while (true) {
        const line = prompt();
        if (line === "done") {
          break;
        }
        const n = Number(line);
        console.log(\`n=\${n}: halve \${countHalvings(n)}, scan \${countScan(n)}, pairs \${countPairs(n)}\`);
      }
      `,
    ),
    tests: [
      { name: 'three sizes', input: '16\n5\n1\ndone', expectedOutput: 'n=16: halve 4, scan 16, pairs 256\nn=5: halve 2, scan 5, pairs 25\nn=1: halve 0, scan 1, pairs 1' },
      { name: 'a hundred', input: '100\ndone', expectedOutput: 'n=100: halve 6, scan 100, pairs 10000', hidden: true },
      {
        name: 'the functions on their own',
        input: 'done',
        hidden: true,
        expectedOutput: '10 7 9',
        harness: code('print(count_halvings(1024), count_scan(7), count_pairs(3))', 'console.log(countHalvings(1024), countScan(7), countPairs(3));'),
      },
    ],
    takeaway: 'Three shapes to remember: **O(log n)** barely grows (a million items, about 20 halvings), **O(n)** grows in step with the input, **O(n²)** explodes. The rest of this region is about turning O(n²) into O(n) or O(log n).',
  },
];
