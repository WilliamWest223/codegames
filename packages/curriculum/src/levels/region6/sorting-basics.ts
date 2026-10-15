import type { Level } from '@codegames/shared';
import { code } from '../../helpers';
import { lang } from '../../localize';

/** sorting-basics levels, in play order. */
export const sortingBasicsLevels: Level[] = [
  {
    id: 'sorting-basics-1',
    conceptId: 'sorting-basics',
    title: 'Insert One by One',
    role: 'intro',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: '**Insertion sort** works like sorting cards in your hand: take the next card and slide it left past every bigger card. This version prints the list after each card is placed. Which output is right?',
    reinforces: ['nested-loops', 'collections', 'while-loops'],
    choices: {
      python: ['3 4 1 2\n1 3 4 2\n1 2 3 4', '1 4 3 2\n1 2 3 4\n1 2 3 4', '3 4 1 2\n3 1 4 2\n1 2 3 4', '4 3 1 2\n3 4 1 2\n1 3 4 2'],
      javascript: ['3 4 1 2\n1 3 4 2\n1 2 3 4', '1 4 3 2\n1 2 3 4\n1 2 3 4', '3 4 1 2\n3 1 4 2\n1 2 3 4', '4 3 1 2\n3 4 1 2\n1 3 4 2'],
    },
    hints: [
      'Round 1 takes the `3`. The `4` before it is bigger, so the 4 shifts right and the 3 drops in at the front: `3 4 1 2`.',
      'Round 2 takes the `1`: both 3 and 4 shift right, so it lands at the front.',
      'Round 3 takes the `2`: 4 and 3 shift, 1 stays, so the 2 lands at index 1.',
    ],
    code: code(
      `
      def insertion_sort(items):
          for i in range(1, len(items)):
              value = items[i]
              j = i - 1
              while j >= 0 and items[j] > value:
                  items[j + 1] = items[j]
                  j -= 1
              items[j + 1] = value
              print(" ".join(map(str, items)))

      insertion_sort([4, 3, 1, 2])
      `,
      `
      function insertionSort(items) {
        for (let i = 1; i < items.length; i++) {
          const value = items[i];
          let j = i - 1;
          while (j >= 0 && items[j] > value) {
            items[j + 1] = items[j];
            j -= 1;
          }
          items[j + 1] = value;
          console.log(items.join(" "));
        }
      }

      insertionSort([4, 3, 1, 2]);
      `,
    ),
    investigate: [
      { question: 'What does the inner `while` loop do?', choices: ['Shifts every bigger item one slot to the right to make room', 'Swaps the two ends of the list', 'Finds the smallest item'], answer: 0 },
      { question: 'If the list is **already sorted**, how many shifts does the inner loop make in total?', choices: ['None: each item stops immediately', 'One per item', 'n² shifts'], answer: 0 },
    ],
    takeaway: 'Insertion sort is **O(n²)** in the worst case (reversed input) but fast on nearly-sorted data, and it is what you do by hand with cards. Knowing one simple sort inside out matters more than memorizing ten: every sort is "compare, then move", and the comparison is the part you will customize.',
  },
  {
    id: 'sorting-basics-2',
    conceptId: 'sorting-basics',
    title: 'The Vanishing Swap',
    role: 'combine',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: 'This **bubble sort** should sort the words and count its swaps: `pear apple fig` → `apple fig pear` and `Swaps: 2`.\n\nInstead it prints `apple apple fig` and `Swaps: 1`. One word gets copied and another vanishes. Look closely at how two items are swapped.',
    reinforces: ['nested-loops', 'collections', 'variables', 'input', 'strings'],
    hints: [
      'Trace the first swap of `pear` and `apple` by hand: what is in `items[j]` after the first swap line runs, and what does the second line copy?',
      lang('Swap with a tuple: `items[j], items[j + 1] = items[j + 1], items[j]`, or keep the first value in a temporary variable.', 'Keep the first value in a temporary variable first: `const temp = items[j]; items[j] = items[j + 1]; items[j + 1] = temp;` (or swap with `[items[j], items[j + 1]] = [items[j + 1], items[j]]`).'),
      'After `items[j] = items[j + 1]`, the old `items[j]` is **gone**. The next line copies the new value back over itself. The swap counter is fine.',
    ],
    starterCode: code(
      `
      def bubble_sort(items):
          swaps = 0
          n = len(items)
          for i in range(n - 1):
              for j in range(n - 1 - i):
                  if items[j] > items[j + 1]:
                      items[j] = items[j + 1]
                      items[j + 1] = items[j]
                      swaps += 1
          return swaps

      words = input().split()
      swaps = bubble_sort(words)
      print(" ".join(words))
      print(f"Swaps: {swaps}")
      `,
      `
      function bubbleSort(items) {
        let swaps = 0;
        const n = items.length;
        for (let i = 0; i < n - 1; i++) {
          for (let j = 0; j < n - 1 - i; j++) {
            if (items[j] > items[j + 1]) {
              items[j] = items[j + 1];
              items[j + 1] = items[j];
              swaps += 1;
            }
          }
        }
        return swaps;
      }

      const words = prompt().split(" ");
      const swaps = bubbleSort(words);
      console.log(words.join(" "));
      console.log(\`Swaps: \${swaps}\`);
      `,
    ),
    solution: code(
      `
      def bubble_sort(items):
          swaps = 0
          n = len(items)
          for i in range(n - 1):
              for j in range(n - 1 - i):
                  if items[j] > items[j + 1]:
                      items[j], items[j + 1] = items[j + 1], items[j]
                      swaps += 1
          return swaps

      words = input().split()
      swaps = bubble_sort(words)
      print(" ".join(words))
      print(f"Swaps: {swaps}")
      `,
      `
      function bubbleSort(items) {
        let swaps = 0;
        const n = items.length;
        for (let i = 0; i < n - 1; i++) {
          for (let j = 0; j < n - 1 - i; j++) {
            if (items[j] > items[j + 1]) {
              const temp = items[j];
              items[j] = items[j + 1];
              items[j + 1] = temp;
              swaps += 1;
            }
          }
        }
        return swaps;
      }

      const words = prompt().split(" ");
      const swaps = bubbleSort(words);
      console.log(words.join(" "));
      console.log(\`Swaps: \${swaps}\`);
      `,
    ),
    tests: [
      { name: 'three words', input: 'pear apple fig', expectedOutput: 'apple fig pear\nSwaps: 2' },
      { name: 'reversed: every pair swaps', input: 'd c b a', expectedOutput: 'a b c d\nSwaps: 6', hidden: true },
      { name: 'two words', input: 'b a', expectedOutput: 'a b\nSwaps: 1', hidden: true },
    ],
    takeaway: 'A swap needs a **third place** to hold one value while the other moves, or the first value is overwritten and lost. That is the whole bug, and it is one of the most common bugs in any sort. Bubble sort itself is O(n²) and rarely used for real, but its "compare neighbours, swap, repeat" loop is the clearest sort to read.',
  },
  {
    id: 'sorting-basics-3',
    conceptId: 'sorting-basics',
    title: 'Ranking Table',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: `Read players as \`name score\` lines until \`done\` and print a ranking:\n\n\`\`\`\n1. Bo 30\n2. Cy 30\n3. Di 21\n4. Ada 12\n\`\`\`\n\nHigher score first; on a tie, the name that comes first alphabetically. Keep each player as a two-item list \`[name, score]\`.\n\nWrite ${lang('`comes_before(a, b)`', '`comesBefore(a, b)`')}, which **returns** whether player \`a\` should be ranked above player \`b\`, and ${lang('`insertion_sort(rows)`', '`insertionSort(rows)`')}, which sorts the list in place using it. Write the sort yourself: no built-in sort.`,
    reinforces: ['functions', 'return-values', 'nested-data', 'while-loops', 'booleans', 'strings', 'input', 'type-conversion', 'string-formatting'],
    hints: [
      lang('`comes_before`: `if a[1] != b[1]: return a[1] > b[1]` then `return a[0] < b[0]`.', '`comesBefore`: `if (a[1] !== b[1]) return a[1] > b[1];` then `return a[0] < b[0];`.'),
      'Insertion sort as in the first level, but the shift condition becomes "while the item on the left should come **after** `value`": `comes_before(value, rows[j])`.',
      lang('Print with `enumerate(rows, start=1)` or a counter: `print(f"{i}. {name} {score}")`.', 'Print with a counter: `for (let i = 0; i < rows.length; i++)`, printing `i + 1`, the name and the score.'),
    ],
    requirements: {
      python: [{ pattern: '\\bsorted\\(|\\.sort\\(', forbid: true, message: 'Write the sort yourself: no sorted() or .sort().' }],
      javascript: [{ pattern: '\\.sort\\(|toSorted\\(', forbid: true, message: 'Write the sort yourself: no .sort().' }],
    },
    starterCode: code(
      `
      def comes_before(a, b):
          # True when player a ranks above player b.
          pass

      def insertion_sort(rows):
          # Sort rows in place, using comes_before.
          pass

      rows = []
      # 1. Read "name score" lines until "done" into rows as [name, score].
      # 2. Sort, then print the ranking.
      `,
      `
      function comesBefore(a, b) {
        // true when player a ranks above player b.
      }

      function insertionSort(rows) {
        // Sort rows in place, using comesBefore.
      }

      const rows = [];
      // 1. Read "name score" lines until "done" into rows as [name, score].
      // 2. Sort, then print the ranking.
      `,
    ),
    solution: code(
      `
      def comes_before(a, b):
          if a[1] != b[1]:
              return a[1] > b[1]
          return a[0] < b[0]

      def insertion_sort(rows):
          for i in range(1, len(rows)):
              value = rows[i]
              j = i - 1
              while j >= 0 and comes_before(value, rows[j]):
                  rows[j + 1] = rows[j]
                  j -= 1
              rows[j + 1] = value

      rows = []
      while True:
          line = input()
          if line == "done":
              break
          name, score = line.split()
          rows.append([name, int(score)])

      insertion_sort(rows)
      for i in range(len(rows)):
          print(f"{i + 1}. {rows[i][0]} {rows[i][1]}")
      `,
      `
      function comesBefore(a, b) {
        if (a[1] !== b[1]) {
          return a[1] > b[1];
        }
        return a[0] < b[0];
      }

      function insertionSort(rows) {
        for (let i = 1; i < rows.length; i++) {
          const value = rows[i];
          let j = i - 1;
          while (j >= 0 && comesBefore(value, rows[j])) {
            rows[j + 1] = rows[j];
            j -= 1;
          }
          rows[j + 1] = value;
        }
      }

      const rows = [];
      while (true) {
        const line = prompt();
        if (line === "done") {
          break;
        }
        const [name, score] = line.split(" ");
        rows.push([name, Number(score)]);
      }

      insertionSort(rows);
      for (let i = 0; i < rows.length; i++) {
        console.log(\`\${i + 1}. \${rows[i][0]} \${rows[i][1]}\`);
      }
      `,
    ),
    tests: [
      { name: 'four players with a tie', input: 'Bo 30\nAda 12\nCy 30\nDi 21\ndone', expectedOutput: '1. Bo 30\n2. Cy 30\n3. Di 21\n4. Ada 12' },
      { name: 'ties broken by name', input: 'Zed 5\nAmy 5\nMo 5\ndone', expectedOutput: '1. Amy 5\n2. Mo 5\n3. Zed 5', hidden: true },
      { name: 'already in order', input: 'A 3\nB 2\nC 1\ndone', expectedOutput: '1. A 3\n2. B 2\n3. C 1', hidden: true },
      {
        name: 'comes_before on its own',
        input: 'done',
        hidden: true,
        expectedOutput: { python: 'True True False', javascript: 'true true false' },
        harness: code(
          'print(comes_before(["Al", 5], ["Bo", 5]), comes_before(["Bo", 9], ["Al", 5]), comes_before(["Al", 1], ["Bo", 2]))',
          'console.log(comesBefore(["Al", 5], ["Bo", 5]), comesBefore(["Bo", 9], ["Al", 5]), comesBefore(["Al", 1], ["Bo", 2]));',
        ),
      },
    ],
    takeaway: `Separating the **comparison** from the **sort** is the big idea: the sort never changes, only the rule for "who comes first". That is exactly what you pass to a built-in sort as its key or compare function (${lang('`sorted(rows, key=...)`', '`rows.sort((a, b) => ...)`')}), which is what you should use in real code now that you know what it does inside.`,
  },
];
