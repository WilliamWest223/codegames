import type { Level } from '@codegames/shared';
import { code } from '../../helpers';
import { lang } from '../../localize';

/** binary-search levels, in play order. */
export const binarySearchLevels: Level[] = [
  {
    id: 'binary-search-1',
    conceptId: 'binary-search',
    title: 'Guess by Halving',
    role: 'intro',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: 'The number is between 1 and 100. Instead of guessing 1, 2, 3…, this guesser always picks the **middle** of what is left: a **binary search**. Which output is right for the secret 37?',
    reinforces: ['while-loops', 'conditionals', 'operators'],
    choices: {
      python: ['50: too high\n25: too low\n37: found in 3 guesses', '50: too high\n25: too low\n37: found in 2 guesses', '50: too high\n24: too low\n37: found in 3 guesses', '50: too high\n25: too low\n38: too high\n37: found in 4 guesses'],
      javascript: ['50: too high\n25: too low\n37: found in 3 guesses', '50: too high\n25: too low\n37: found in 2 guesses', '50: too high\n24: too low\n37: found in 3 guesses', '50: too high\n25: too low\n38: too high\n37: found in 4 guesses'],
    },
    hints: [
      'First guess: the middle of 1..100 is (1 + 100) // 2 = 50.',
      '50 is too high, so `hi` becomes 49. The middle of 1..49 is 25.',
      '25 is too low, so `lo` becomes 26. The middle of 26..49 is (26 + 49) // 2 = 37.',
    ],
    code: code(
      `
      def guess(target):
          lo = 1
          hi = 100
          guesses = 0
          while lo <= hi:
              mid = (lo + hi) // 2
              guesses += 1
              if mid == target:
                  print(f"{mid}: found in {guesses} guesses")
                  return
              if mid < target:
                  print(f"{mid}: too low")
                  lo = mid + 1
              else:
                  print(f"{mid}: too high")
                  hi = mid - 1

      guess(37)
      `,
      `
      function guess(target) {
        let lo = 1;
        let hi = 100;
        let guesses = 0;
        while (lo <= hi) {
          const mid = Math.floor((lo + hi) / 2);
          guesses += 1;
          if (mid === target) {
            console.log(\`\${mid}: found in \${guesses} guesses\`);
            return;
          }
          if (mid < target) {
            console.log(\`\${mid}: too low\`);
            lo = mid + 1;
          } else {
            console.log(\`\${mid}: too high\`);
            hi = mid - 1;
          }
        }
      }

      guess(37);
      `,
    ),
    investigate: [
      { question: 'Why does the search try 25 right after 50?', choices: ['50 was too high, so the answer is in 1–49, and 25 is the middle of that', 'It always counts down by 25', 'It picks a random number each time'], answer: 0 },
      { question: 'Each guess halves what is left. For 1–1000, how many guesses at most?', choices: ['About 10', 'About 500', '1000'], answer: 0 },
    ],
    takeaway: 'Binary search is **O(log n)**: each step throws away half of what is left, so a million sorted items take about 20 steps instead of a million. The price is that the data must be **sorted**, and the two moves must be exact: `lo = mid + 1` when too low, `hi = mid - 1` when too high.',
  },
  {
    id: 'binary-search-2',
    conceptId: 'binary-search',
    title: 'The Last Slot',
    role: 'combine',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: 'This binary search over a sorted list prints `Found at I` or `Not found`, then `Steps: K`.\n\nIt finds `8` in `2 5 8 12 16 23` but says `Not found` for `23`, the last item, and for a one-item list it never even looks. One character in the loop condition is wrong. Fix it.',
    reinforces: ['while-loops', 'conditionals', 'collections', 'functions', 'input', 'type-conversion'],
    hints: [
      'Trace the search for 23: `lo` climbs to 5 and `hi` is 5. The loop stops without checking index 5.',
      'When `lo == hi` there is still one candidate left. The loop must run while `lo <= hi`.',
      'With one item, `lo` and `hi` both start at 0: `0 < 0` is false, so nothing is checked.',
    ],
    starterCode: code(
      `
      def binary_search(items, target):
          lo = 0
          hi = len(items) - 1
          steps = 0
          while lo < hi:
              mid = (lo + hi) // 2
              steps += 1
              if items[mid] == target:
                  return mid, steps
              if items[mid] < target:
                  lo = mid + 1
              else:
                  hi = mid - 1
          return -1, steps

      items = list(map(int, input().split()))
      target = int(input())
      index, steps = binary_search(items, target)
      print(f"Found at {index}" if index != -1 else "Not found")
      print(f"Steps: {steps}")
      `,
      `
      function binarySearch(items, target) {
        let lo = 0;
        let hi = items.length - 1;
        let steps = 0;
        while (lo < hi) {
          const mid = Math.floor((lo + hi) / 2);
          steps += 1;
          if (items[mid] === target) {
            return [mid, steps];
          }
          if (items[mid] < target) {
            lo = mid + 1;
          } else {
            hi = mid - 1;
          }
        }
        return [-1, steps];
      }

      const items = prompt().split(" ").map(Number);
      const target = Number(prompt());
      const [index, steps] = binarySearch(items, target);
      console.log(index !== -1 ? \`Found at \${index}\` : "Not found");
      console.log(\`Steps: \${steps}\`);
      `,
    ),
    solution: code(
      `
      def binary_search(items, target):
          lo = 0
          hi = len(items) - 1
          steps = 0
          while lo <= hi:
              mid = (lo + hi) // 2
              steps += 1
              if items[mid] == target:
                  return mid, steps
              if items[mid] < target:
                  lo = mid + 1
              else:
                  hi = mid - 1
          return -1, steps

      items = list(map(int, input().split()))
      target = int(input())
      index, steps = binary_search(items, target)
      print(f"Found at {index}" if index != -1 else "Not found")
      print(f"Steps: {steps}")
      `,
      `
      function binarySearch(items, target) {
        let lo = 0;
        let hi = items.length - 1;
        let steps = 0;
        while (lo <= hi) {
          const mid = Math.floor((lo + hi) / 2);
          steps += 1;
          if (items[mid] === target) {
            return [mid, steps];
          }
          if (items[mid] < target) {
            lo = mid + 1;
          } else {
            hi = mid - 1;
          }
        }
        return [-1, steps];
      }

      const items = prompt().split(" ").map(Number);
      const target = Number(prompt());
      const [index, steps] = binarySearch(items, target);
      console.log(index !== -1 ? \`Found at \${index}\` : "Not found");
      console.log(\`Steps: \${steps}\`);
      `,
    ),
    tests: [
      { name: 'the last item', input: '2 5 8 12 16 23\n23', expectedOutput: 'Found at 5\nSteps: 3' },
      { name: 'the middle item', input: '2 5 8 12 16 23\n8', expectedOutput: 'Found at 2\nSteps: 1' },
      { name: 'one item', input: '4\n4', expectedOutput: 'Found at 0\nSteps: 1', hidden: true },
      { name: 'missing, below everything', input: '2 5 8 12 16 23\n1', expectedOutput: 'Not found\nSteps: 2', hidden: true },
    ],
    takeaway: 'Off-by-one bugs love binary search. The invariant to keep in your head: "the answer, if it exists, is somewhere in `lo..hi` **inclusive**". Then `lo <= hi` is the only correct loop condition, and `mid + 1` / `mid - 1` are the only correct moves.',
  },
  {
    id: 'binary-search-3',
    conceptId: 'binary-search',
    title: 'Smallest Shelf That Fits',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: `A warehouse has shelves of sizes in **sorted order** (first input line, like \`3 5 10 20\`). Then come package sizes until \`done\`. For each, print the **smallest shelf that fits** (size ≥ package):\n\n\`\`\`\nneed 7: shelf 10 (index 2)\nneed 50: none\n\`\`\`\n\nWrite ${lang('`first_fit(sizes, need)`', '`firstFit(sizes, need)`')} as a binary search that **returns** the index of the first size ≥ \`need\`, or -1. Halve the range every step: when the middle shelf fits, remember it and look **left** for a smaller one; otherwise look right. No scanning loops.`,
    reinforces: ['functions', 'return-values', 'while-loops', 'conditionals', 'collections', 'input', 'type-conversion', 'string-formatting'],
    hints: [
      lang('Keep `answer = -1`. In the loop: `if sizes[mid] >= need: answer = mid; hi = mid - 1` else `lo = mid + 1`.', 'Keep `let answer = -1`. In the loop: `if (sizes[mid] >= need) { answer = mid; hi = mid - 1; } else { lo = mid + 1; }`.'),
      'The loop condition is `lo <= hi`, exactly like a normal binary search.',
      lang('The main loop: `while True:` read a line, `break` on done, then `int()` it and print.', 'The main loop: `while (true)` read a line, `break` on done, then `Number()` it and print.'),
    ],
    requirements: {
      python: [
        { pattern: '^\\s*for\\b|\\.index\\(|bisect', forbid: true, message: 'Halve the range with a while loop: no for loops, .index() or bisect.' },
        { pattern: '//\\s*2|>>\\s*1', message: 'Halve the range: mid = (lo + hi) // 2.' },
      ],
      javascript: [
        { pattern: 'for\\s*\\(|indexOf\\(|findIndex\\(|\\.find\\(|\\.filter\\(', forbid: true, message: 'Halve the range with a while loop: no for loops or array searches.' },
        { pattern: '/\\s*2|>>\\s*1', message: 'Halve the range: mid = Math.floor((lo + hi) / 2).' },
      ],
    },
    starterCode: code(
      `
      def first_fit(sizes, need):
          # Binary search: index of the first size >= need, or -1.
          pass

      sizes = list(map(int, input().split()))
      # Read package sizes until "done" and report each.
      `,
      `
      function firstFit(sizes, need) {
        // Binary search: index of the first size >= need, or -1.
      }

      const sizes = prompt().split(" ").map(Number);
      // Read package sizes until "done" and report each.
      `,
    ),
    solution: code(
      `
      def first_fit(sizes, need):
          lo = 0
          hi = len(sizes) - 1
          answer = -1
          while lo <= hi:
              mid = (lo + hi) // 2
              if sizes[mid] >= need:
                  answer = mid
                  hi = mid - 1
              else:
                  lo = mid + 1
          return answer

      sizes = list(map(int, input().split()))
      while True:
          line = input()
          if line == "done":
              break
          need = int(line)
          index = first_fit(sizes, need)
          if index == -1:
              print(f"need {need}: none")
          else:
              print(f"need {need}: shelf {sizes[index]} (index {index})")
      `,
      `
      function firstFit(sizes, need) {
        let lo = 0;
        let hi = sizes.length - 1;
        let answer = -1;
        while (lo <= hi) {
          const mid = Math.floor((lo + hi) / 2);
          if (sizes[mid] >= need) {
            answer = mid;
            hi = mid - 1;
          } else {
            lo = mid + 1;
          }
        }
        return answer;
      }

      const sizes = prompt().split(" ").map(Number);
      while (true) {
        const line = prompt();
        if (line === "done") {
          break;
        }
        const need = Number(line);
        const index = firstFit(sizes, need);
        if (index === -1) {
          console.log(\`need \${need}: none\`);
        } else {
          console.log(\`need \${need}: shelf \${sizes[index]} (index \${index})\`);
        }
      }
      `,
    ),
    tests: [
      { name: 'fits, too big, exact', input: '3 5 10 20\n7\n50\n3\ndone', expectedOutput: 'need 7: shelf 10 (index 2)\nneed 50: none\nneed 3: shelf 3 (index 0)' },
      { name: 'duplicates: the first of them', input: '2 4 4 4 9\n4\n1\ndone', expectedOutput: 'need 4: shelf 4 (index 1)\nneed 1: shelf 2 (index 0)', hidden: true },
      {
        name: 'first_fit on its own',
        input: '1\ndone',
        hidden: true,
        expectedOutput: '1 -1 0 3',
        harness: code('print(first_fit([1, 4, 9], 4), first_fit([1, 4, 9], 10), first_fit([1, 4, 9], 0), first_fit([1, 2, 3, 8], 5))', 'console.log(firstFit([1, 4, 9], 4), firstFit([1, 4, 9], 10), firstFit([1, 4, 9], 0), firstFit([1, 2, 3, 8], 5));'),
      },
    ],
    takeaway: 'This is the **lower bound** search: instead of "is it here?", it answers "where is the first thing that satisfies the condition?". The trick is to remember the last good `mid` and keep halving toward the left. The same shape finds the first bad software version, the earliest free time slot, or where to insert a new value and keep a list sorted (you will use that in the boss).',
  },
];
