import type { Level } from '@codegames/shared';
import { code } from '../../helpers';
import { lang } from '../../localize';

/** two-pointers levels, in play order. */
export const twoPointersLevels: Level[] = [
  {
    id: 'two-pointers-1',
    conceptId: 'two-pointers',
    title: 'Both Ends at Once',
    role: 'intro',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: 'Is a word a **palindrome** (reads the same backwards)? This checker walks two indexes toward each other: one from the left, one from the right, printing each pair it compares. Which output is right?',
    reinforces: ['while-loops', 'strings', 'conditionals', 'return-values'],
    choices: {
      python: ['l-l\ne-e\nv-v\nlevel: yes\nr-s\nrobots: no', 'l-l\ne-e\nv-v\nlevel: yes\nr-s\no-t\nrobots: no', 'l-l\ne-e\nlevel: yes\nr-s\nrobots: no', 'l-l\ne-e\nv-e\nlevel: no\nr-s\nrobots: no'],
      javascript: ['l-l\ne-e\nv-v\nlevel: yes\nr-s\nrobots: no', 'l-l\ne-e\nv-v\nlevel: yes\nr-s\no-t\nrobots: no', 'l-l\ne-e\nlevel: yes\nr-s\nrobots: no', 'l-l\ne-e\nv-e\nlevel: no\nr-s\nrobots: no'],
    },
    hints: [
      'For `level`, after two pairs both indexes are 2 (the `v`). Does the loop condition still hold when `left == right`?',
      'Check the loop condition: it is `left <= right`, so the middle letter is compared with itself.',
      'For `robots`, `r` and `s` differ, so the function returns on the very first pair.',
    ],
    code: code(
      `
      def is_palindrome(word):
          left = 0
          right = len(word) - 1
          while left <= right:
              print(f"{word[left]}-{word[right]}")
              if word[left] != word[right]:
                  return False
              left += 1
              right -= 1
          return True

      for word in ["level", "robots"]:
          print(f"{word}: {'yes' if is_palindrome(word) else 'no'}")
      `,
      `
      function isPalindrome(word) {
        let left = 0;
        let right = word.length - 1;
        while (left <= right) {
          console.log(\`\${word[left]}-\${word[right]}\`);
          if (word[left] !== word[right]) {
            return false;
          }
          left += 1;
          right -= 1;
        }
        return true;
      }

      for (const word of ["level", "robots"]) {
        console.log(\`\${word}: \${isPalindrome(word) ? "yes" : "no"}\`);
      }
      `,
    ),
    investigate: [
      { question: 'How many comparisons does this make for a 1,000-letter palindrome?', choices: ['About 500: the pointers meet in the middle', '1,000', 'About 500,000'], answer: 0 },
      { question: 'What would `while left < right` change?', choices: ['The middle letter of odd-length words would not be compared with itself (same answer, one line fewer)', 'Palindromes would be reported as "no"', 'Nothing: the output is identical'], answer: 0 },
    ],
    takeaway: 'The **two-pointer** technique keeps two indexes and moves them based on what they see. It turns many "compare every pair" O(n²) loops into a single O(n) pass over data that is sorted or symmetric. The art is choosing *which* pointer moves, and *why*.',
  },
  {
    id: 'two-pointers-2',
    conceptId: 'two-pointers',
    title: 'Which Pointer Moves?',
    role: 'combine',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: 'A **sorted** list of prices and a budget. This should print the pair of two different items that adds up to exactly the budget, moving a `left` and a `right` pointer toward each other: `1 4 6 9 12` with budget `15` → `6 + 9 = 15`.\n\nIt prints `No pair` instead. One branch moves the wrong pointer. Fix it.',
    reinforces: ['while-loops', 'conditionals', 'collections', 'input', 'type-conversion', 'string-formatting'],
    hints: [
      'When the current sum is too **small**, which pointer can make it bigger? Only `left` moving right (the list is sorted).',
      'When the sum is too **big**, `right -= 1` makes it smaller. The code does this in both branches... one of them is wrong.',
      'Too small → `left += 1`. Too big → `right -= 1`. Exactly one line changes.',
    ],
    starterCode: code(
      `
      prices = list(map(int, input().split()))
      budget = int(input())

      left = 0
      right = len(prices) - 1
      answer = "No pair"
      while left < right:
          total = prices[left] + prices[right]
          if total == budget:
              answer = f"{prices[left]} + {prices[right]} = {budget}"
              break
          if total < budget:
              right -= 1
          else:
              right -= 1
      print(answer)
      `,
      `
      const prices = prompt().split(" ").map(Number);
      const budget = Number(prompt());

      let left = 0;
      let right = prices.length - 1;
      let answer = "No pair";
      while (left < right) {
        const total = prices[left] + prices[right];
        if (total === budget) {
          answer = \`\${prices[left]} + \${prices[right]} = \${budget}\`;
          break;
        }
        if (total < budget) {
          right -= 1;
        } else {
          right -= 1;
        }
      }
      console.log(answer);
      `,
    ),
    solution: code(
      `
      prices = list(map(int, input().split()))
      budget = int(input())

      left = 0
      right = len(prices) - 1
      answer = "No pair"
      while left < right:
          total = prices[left] + prices[right]
          if total == budget:
              answer = f"{prices[left]} + {prices[right]} = {budget}"
              break
          if total < budget:
              left += 1
          else:
              right -= 1
      print(answer)
      `,
      `
      const prices = prompt().split(" ").map(Number);
      const budget = Number(prompt());

      let left = 0;
      let right = prices.length - 1;
      let answer = "No pair";
      while (left < right) {
        const total = prices[left] + prices[right];
        if (total === budget) {
          answer = \`\${prices[left]} + \${prices[right]} = \${budget}\`;
          break;
        }
        if (total < budget) {
          left += 1;
        } else {
          right -= 1;
        }
      }
      console.log(answer);
      `,
    ),
    tests: [
      { name: 'middle pair', input: '1 4 6 9 12\n15', expectedOutput: '6 + 9 = 15' },
      { name: 'the two ends', input: '1 4 6 9 12\n13', expectedOutput: '1 + 12 = 13', hidden: true },
      { name: 'needs left to move', input: '1 2 3 10\n5', expectedOutput: '2 + 3 = 5' },
      { name: 'nothing fits', input: '1 2 3\n7', expectedOutput: 'No pair', hidden: true },
    ],
    takeaway: 'On sorted data the two pointers give you a **direction**: the sum is too small, so only moving `left` up can help; too big, so only moving `right` down can. Each step rules out one item for good, which is why the whole scan is O(n). Get the direction wrong and you either loop forever or skip the answer.',
  },
  {
    id: 'two-pointers-3',
    conceptId: 'two-pointers',
    title: 'Sliding Window',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: `A shop logs daily sales (first line, like \`3 8 2 5 7 1\`). Then come queries until \`done\`:\n\n- \`best K\`: the biggest total of any **K consecutive** days → \`best 3: 15\`\n- \`under LIMIT\`: the **longest** run of consecutive days whose total stays ≤ LIMIT → \`under 14: 3\` (the days \`3 8 2\`, or \`2 5 7\`, or \`5 7 1\`)\n\nWrite ${lang('`best_window(sales, k)`', '`bestWindow(sales, k)`')} and ${lang('`longest_under(sales, limit)`', '`longestUnder(sales, limit)`')}, each **returning** a number, using a **sliding window**: a \`start\` and \`end\` index where the window total is updated by adding the new day and subtracting the day that leaves. No recomputing the sum of every window from scratch, so no nested loops.`,
    reinforces: ['functions', 'return-values', 'loops', 'while-loops', 'collections', 'strings', 'input', 'type-conversion', 'string-formatting', 'conditionals'],
    hints: [
      lang('`best_window`: total the first k days with a loop (sum() is not allowed). Then for `end` in `range(k, len(sales))`: `total += sales[end] - sales[end - k]` and keep the max.', '`bestWindow`: total the first k days with a loop. Then for `end` from `k` to the end: `total += sales[end] - sales[end - k]` and keep the max.'),
      lang('`longest_under`: `start = 0; total = 0; best = 0`. For each `end`: add `sales[end]`; `while total > limit: total -= sales[start]; start += 1`; then `best = max(best, end - start + 1)`.', '`longestUnder`: `let start = 0, total = 0, best = 0`. For each `end`: add `sales[end]`; `while (total > limit) { total -= sales[start]; start += 1; }`; then `best = Math.max(best, end - start + 1)`.'),
      lang('Split each query: `cmd, value = line.split()`, convert `value` with `int()`.', 'Split each query: `const [cmd, value] = line.split(" ")`, convert `value` with `Number()`.'),
    ],
    requirements: {
      python: [
        { pattern: 'sum\\(', forbid: true, message: 'Slide the window: update the running total instead of summing each window with sum().' },
        { pattern: '^([ \\t]*)for\\b[^\\n]*:[ \\t]*\\n(?:\\1[ \\t]+[^\\n]*\\n|[ \\t]*\\n)*?\\1[ \\t]+for\\b', forbid: true, message: 'No nested loops: slide the window.' },
      ],
      javascript: [
        { pattern: '\\.reduce\\(|\\.slice\\(', forbid: true, message: 'Slide the window: update the running total instead of summing each window with reduce or slice.' },
        { pattern: 'for\\s*\\([^)]*\\)\\s*\\{[^}]*for\\s*\\(', forbid: true, message: 'No nested loops: slide the window.' },
      ],
    },
    starterCode: code(
      `
      def best_window(sales, k):
          # Biggest total of any k consecutive days.
          pass

      def longest_under(sales, limit):
          # Longest run of consecutive days with total <= limit.
          pass

      sales = list(map(int, input().split()))
      # Answer "best K" and "under LIMIT" queries until "done".
      `,
      `
      function bestWindow(sales, k) {
        // Biggest total of any k consecutive days.
      }

      function longestUnder(sales, limit) {
        // Longest run of consecutive days with total <= limit.
      }

      const sales = prompt().split(" ").map(Number);
      // Answer "best K" and "under LIMIT" queries until "done".
      `,
    ),
    solution: code(
      `
      def best_window(sales, k):
          total = 0
          for i in range(k):
              total += sales[i]
          best = total
          for end in range(k, len(sales)):
              total += sales[end] - sales[end - k]
              if total > best:
                  best = total
          return best

      def longest_under(sales, limit):
          start = 0
          total = 0
          best = 0
          for end in range(len(sales)):
              total += sales[end]
              while total > limit:
                  total -= sales[start]
                  start += 1
              if end - start + 1 > best:
                  best = end - start + 1
          return best

      sales = list(map(int, input().split()))
      while True:
          line = input()
          if line == "done":
              break
          cmd, value = line.split()
          value = int(value)
          if cmd == "best":
              print(f"best {value}: {best_window(sales, value)}")
          else:
              print(f"under {value}: {longest_under(sales, value)}")
      `,
      `
      function bestWindow(sales, k) {
        let total = 0;
        for (let i = 0; i < k; i++) {
          total += sales[i];
        }
        let best = total;
        for (let end = k; end < sales.length; end++) {
          total += sales[end] - sales[end - k];
          if (total > best) {
            best = total;
          }
        }
        return best;
      }

      function longestUnder(sales, limit) {
        let start = 0;
        let total = 0;
        let best = 0;
        for (let end = 0; end < sales.length; end++) {
          total += sales[end];
          while (total > limit) {
            total -= sales[start];
            start += 1;
          }
          if (end - start + 1 > best) {
            best = end - start + 1;
          }
        }
        return best;
      }

      const sales = prompt().split(" ").map(Number);
      while (true) {
        const line = prompt();
        if (line === "done") {
          break;
        }
        const [cmd, raw] = line.split(" ");
        const value = Number(raw);
        if (cmd === "best") {
          console.log(\`best \${value}: \${bestWindow(sales, value)}\`);
        } else {
          console.log(\`under \${value}: \${longestUnder(sales, value)}\`);
        }
      }
      `,
    ),
    tests: [
      { name: 'both queries', input: '3 8 2 5 7 1\nbest 3\nunder 14\nunder 10\ndone', expectedOutput: 'best 3: 15\nunder 14: 3\nunder 10: 2' },
      { name: 'window of one and the whole week', input: '4 1 9 2\nbest 1\nbest 4\nunder 100\ndone', expectedOutput: 'best 1: 9\nbest 4: 16\nunder 100: 4', hidden: true },
      { name: 'limit too small for any day', input: '5 6 7\nunder 4\ndone', expectedOutput: 'under 4: 0', hidden: true },
      {
        name: 'functions on their own',
        input: '1\ndone',
        hidden: true,
        expectedOutput: '7 2 3',
        harness: code('print(best_window([2, 1, 4, 3], 2), best_window([5, 2, 1], 1) - 3, longest_under([1, 1, 1, 5], 3))', 'console.log(bestWindow([2, 1, 4, 3], 2), bestWindow([5, 2, 1], 1) - 3, longestUnder([1, 1, 1, 5], 3));'),
      },
    ],
    takeaway: 'A **sliding window** is two pointers that move the same way. Fixed size: add the new item, drop the old one. Variable size: grow `end` every step, shrink `start` only while the window breaks the rule. Either way each index enters and leaves once, so the total work is O(n), where a nested loop would be O(n²) or worse.',
  },
];
