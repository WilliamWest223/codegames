import type { Level } from '@codegames/shared';
import { code } from '../../helpers';
import { lang } from '../../localize';

/** linear-search levels, in play order. */
export const linearSearchLevels: Level[] = [
  {
    id: 'linear-search-1',
    conceptId: 'linear-search',
    title: 'Stop at the First Match',
    role: 'intro',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: 'A **linear search** looks at items from the front and stops at the first match. `find` returns the index and how many items it checked. Which output is right?',
    reinforces: ['iterating-collections', 'return-values', 'functions'],
    choices: {
      python: ['3: found at 1 after 2 checks\n8: found at 4 after 5 checks\n5: not found after 5 checks', '3: found at 3 after 4 checks\n8: found at 4 after 5 checks\n5: not found after 5 checks', '3: found at 1 after 2 checks\n8: found at 4 after 4 checks\n5: not found after 4 checks', '3: found at 1 after 1 checks\n8: found at 4 after 4 checks\n5: not found after 5 checks'],
      javascript: ['3: found at 1 after 2 checks\n8: found at 4 after 5 checks\n5: not found after 5 checks', '3: found at 3 after 4 checks\n8: found at 4 after 5 checks\n5: not found after 5 checks', '3: found at 1 after 2 checks\n8: found at 4 after 4 checks\n5: not found after 4 checks', '3: found at 1 after 1 checks\n8: found at 4 after 4 checks\n5: not found after 5 checks'],
    },
    hints: [
      '`checks` goes up **before** the comparison, so finding the item at index 1 means 2 checks.',
      '`return` leaves the function at the first match: the second `3` is never looked at.',
      'A missing item means every one of the 5 items was checked.',
    ],
    code: code(
      `
      def find(items, target):
          checks = 0
          for i in range(len(items)):
              checks += 1
              if items[i] == target:
                  return i, checks
          return -1, checks

      items = [7, 3, 9, 3, 8]
      for target in [3, 8, 5]:
          index, checks = find(items, target)
          if index == -1:
              print(f"{target}: not found after {checks} checks")
          else:
              print(f"{target}: found at {index} after {checks} checks")
      `,
      `
      function find(items, target) {
        let checks = 0;
        for (let i = 0; i < items.length; i++) {
          checks += 1;
          if (items[i] === target) {
            return [i, checks];
          }
        }
        return [-1, checks];
      }

      const items = [7, 3, 9, 3, 8];
      for (const target of [3, 8, 5]) {
        const [index, checks] = find(items, target);
        if (index === -1) {
          console.log(\`\${target}: not found after \${checks} checks\`);
        } else {
          console.log(\`\${target}: found at \${index} after \${checks} checks\`);
        }
      }
      `,
    ),
    investigate: [
      { question: 'In the worst case (item missing or last), how many checks does a linear search of `n` items make?', choices: ['1', 'n', 'n²'], answer: 1 },
      { question: 'Why is the first `3` found, not the second?', choices: ['The loop returns as soon as it sees a match', 'Lists only keep the first copy', 'The second 3 is skipped by `range`'], answer: 0 },
    ],
    takeaway: 'Linear search is **O(n)**: in the worst case it checks every item. It needs no preparation and works on any list, sorted or not, which is why it is the right tool for short lists and the baseline the faster searches are measured against.',
  },
  {
    id: 'linear-search-2',
    conceptId: 'linear-search',
    title: 'Warmest Day',
    role: 'combine',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: 'The weather log should print the highest temperature and the index where it **first** appears: `3 9 2 9` → `Warmest: 9 at index 1`.\n\nFor a cold week, `-5 -2 -8`, it prints `Warmest: 0 at index -1`: a temperature that never happened. Find the bad starting value and fix it.',
    reinforces: ['iterating-collections', 'conditionals', 'functions', 'input', 'type-conversion'],
    hints: [
      'Starting `best` at 0 assumes some temperature is above 0. When none is, 0 "wins".',
      lang('Start from the real first item: `best = temps[0]` and `best_at = 0`, then scan from index 1.', 'Start from the real first item: `let best = temps[0]` and `let bestAt = 0`, then scan from index 1.'),
      'Keep `>` (not `>=`) so a tie keeps the **first** index.',
    ],
    starterCode: code(
      `
      def warmest(temps):
          best = 0
          best_at = -1
          for i in range(len(temps)):
              if temps[i] > best:
                  best = temps[i]
                  best_at = i
          return best, best_at

      temps = list(map(int, input().split()))
      best, at = warmest(temps)
      print(f"Warmest: {best} at index {at}")
      `,
      `
      function warmest(temps) {
        let best = 0;
        let bestAt = -1;
        for (let i = 0; i < temps.length; i++) {
          if (temps[i] > best) {
            best = temps[i];
            bestAt = i;
          }
        }
        return [best, bestAt];
      }

      const temps = prompt().split(" ").map(Number);
      const [best, at] = warmest(temps);
      console.log(\`Warmest: \${best} at index \${at}\`);
      `,
    ),
    solution: code(
      `
      def warmest(temps):
          best = temps[0]
          best_at = 0
          for i in range(1, len(temps)):
              if temps[i] > best:
                  best = temps[i]
                  best_at = i
          return best, best_at

      temps = list(map(int, input().split()))
      best, at = warmest(temps)
      print(f"Warmest: {best} at index {at}")
      `,
      `
      function warmest(temps) {
        let best = temps[0];
        let bestAt = 0;
        for (let i = 1; i < temps.length; i++) {
          if (temps[i] > best) {
            best = temps[i];
            bestAt = i;
          }
        }
        return [best, bestAt];
      }

      const temps = prompt().split(" ").map(Number);
      const [best, at] = warmest(temps);
      console.log(\`Warmest: \${best} at index \${at}\`);
      `,
    ),
    tests: [
      { name: 'a tie keeps the first', input: '3 9 2 9', expectedOutput: 'Warmest: 9 at index 1' },
      { name: 'a cold week', input: '-5 -2 -8', expectedOutput: 'Warmest: -2 at index 1' },
      { name: 'one day', input: '4', expectedOutput: 'Warmest: 4 at index 0', hidden: true },
      { name: 'all the same', input: '0 0 0', expectedOutput: 'Warmest: 0 at index 0', hidden: true },
    ],
    takeaway: 'A "find the best" scan is a linear search with a running winner. The starting value must be a **real candidate** (the first item), never a made-up 0 or -1: made-up starters are a classic source of wrong answers on negative numbers and empty-looking data.',
  },
  {
    id: 'linear-search-3',
    conceptId: 'linear-search',
    title: 'Lost and Found',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: `The lost-and-found desk keeps items in numbered slots. The first input line is the items, separated by commas (\`lamp,rope,map,torch\`). Then come names to look up, until \`done\`.\n\nFor each name print \`map: slot 2 (3 checks)\` or \`gold: not here (4 checks)\`, and at the end \`Total checks: N\`.\n\nWrite ${lang('`find(items, name)`', '`find(items, name)`')} as a linear search that **returns** the index (or -1) and the number of checks. Do it with your own loop, not a built-in search.`,
    reinforces: ['functions', 'return-values', 'collections', 'strings', 'while-loops', 'input', 'string-formatting', 'iterating-collections'],
    hints: [
      lang('Split the first line on commas: `items = input().split(",")`.', 'Split the first line on commas: `const items = prompt().split(",");`.'),
      lang('`find` returns two values: `return i, checks` on a match and `return -1, checks` after the loop.', '`find` returns two values in an array: `return [i, checks]` on a match and `return [-1, checks]` after the loop.'),
      'Add every query\'s checks to a running total for the last line.',
    ],
    requirements: {
      python: [{ pattern: '\\.index\\(|(?<!\\bfor\\b[^\\n]*)\\bin\\s+items\\b', forbid: true, message: 'Write the search loop yourself: no .index() or "in items" shortcut.' }],
      javascript: [{ pattern: 'indexOf\\(|findIndex\\(|\\.includes\\(|\\.find\\(', forbid: true, message: 'Write the search loop yourself: no indexOf, findIndex, includes or find.' }],
    },
    starterCode: code(
      `
      def find(items, name):
          # Return the index (or -1) and how many items were checked.
          pass

      items = input().split(",")
      total = 0
      # Read names until "done", report each one, then the total.
      `,
      `
      function find(items, name) {
        // Return [index (or -1), how many items were checked].
      }

      const items = prompt().split(",");
      let total = 0;
      // Read names until "done", report each one, then the total.
      `,
    ),
    solution: code(
      `
      def find(items, name):
          checks = 0
          for i in range(len(items)):
              checks += 1
              if items[i] == name:
                  return i, checks
          return -1, checks

      items = input().split(",")
      total = 0
      while True:
          name = input()
          if name == "done":
              break
          index, checks = find(items, name)
          total += checks
          if index == -1:
              print(f"{name}: not here ({checks} checks)")
          else:
              print(f"{name}: slot {index} ({checks} checks)")
      print(f"Total checks: {total}")
      `,
      `
      function find(items, name) {
        let checks = 0;
        for (let i = 0; i < items.length; i++) {
          checks += 1;
          if (items[i] === name) {
            return [i, checks];
          }
        }
        return [-1, checks];
      }

      const items = prompt().split(",");
      let total = 0;
      while (true) {
        const name = prompt();
        if (name === "done") {
          break;
        }
        const [index, checks] = find(items, name);
        total += checks;
        if (index === -1) {
          console.log(\`\${name}: not here (\${checks} checks)\`);
        } else {
          console.log(\`\${name}: slot \${index} (\${checks} checks)\`);
        }
      }
      console.log(\`Total checks: \${total}\`);
      `,
    ),
    tests: [
      { name: 'two lookups', input: 'lamp,rope,map,torch\nmap\ngold\ndone', expectedOutput: 'map: slot 2 (3 checks)\ngold: not here (4 checks)\nTotal checks: 7' },
      { name: 'first slot, duplicate name', input: 'key,key,bag\nkey\nbag\ndone', expectedOutput: 'key: slot 0 (1 checks)\nbag: slot 2 (3 checks)\nTotal checks: 4', hidden: true },
      { name: 'no lookups', input: 'lamp\ndone', expectedOutput: 'Total checks: 0', hidden: true },
      {
        name: 'find on its own',
        input: 'lamp\ndone',
        hidden: true,
        expectedOutput: '2 3\n-1 3',
        harness: code(
          `
          _i, _c = find(["a", "b", "c"], "c")
          print(_i, _c)
          _i, _c = find(["a", "b", "c"], "z")
          print(_i, _c)
          `,
          `
          let [_i, _c] = find(["a", "b", "c"], "c");
          console.log(_i, _c);
          [_i, _c] = find(["a", "b", "c"], "z");
          console.log(_i, _c);
          `,
        ),
      },
    ],
    takeaway: 'Counting checks makes the cost visible: every miss costs a full scan. When the same list is searched over and over, that is the signal to sort it (binary search) or index it (a dictionary). Both come next.',
  },
];
