import type { Level } from '@codegames/shared';
import { code } from '../../helpers';
import { lang } from '../../localize';
import { pair } from './shared';

const SUBSET_WRONG = pair(
  `
  numbers = list(map(int, input().split()))
  target = int(input())
  found = 0

  def search(start, remaining, chosen):
      global found
      if remaining == 0:
          print(" + ".join(map(str, chosen)))
          found += 1
          return
      for i in range(start, len(numbers)):
          if numbers[i] <= remaining:
              chosen.append(numbers[i])
              search(i + 1, remaining - numbers[i], chosen)

  search(0, target, [])
  print(f"Found: {found}")
  `,
  `
  const numbers = prompt().split(" ").map(Number);
  const target = Number(prompt());
  let found = 0;

  function search(start, remaining, chosen) {
    if (remaining === 0) {
      console.log(chosen.join(" + "));
      found += 1;
      return;
    }
    for (let i = start; i < numbers.length; i++) {
      if (numbers[i] <= remaining) {
        chosen.push(numbers[i]);
        search(i + 1, remaining - numbers[i], chosen);
      }
    }
  }

  search(0, target, []);
  console.log(\`Found: \${found}\`);
  `,
);

const SUBSET_RIGHT = {
  python: SUBSET_WRONG.python.replace('            search(i + 1, remaining - numbers[i], chosen)\n', '            search(i + 1, remaining - numbers[i], chosen)\n            chosen.pop()\n'),
  javascript: SUBSET_WRONG.javascript.replace('      search(i + 1, remaining - numbers[i], chosen);\n', '      search(i + 1, remaining - numbers[i], chosen);\n      chosen.pop();\n'),
};

/** backtracking levels, in play order. */
export const backtrackingLevels: Level[] = [
  {
    id: 'backtracking-1',
    conceptId: 'backtracking',
    title: 'Choose, Explore, Un-choose',
    role: 'intro',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: '**Backtracking** builds a solution one choice at a time: pick an option, explore what follows, then **undo** the pick and try the next option. This lists every ordering of three letters. Which output is right?',
    reinforces: ['recursion', 'collections', 'loops', 'strings'],
    choices: {
      python: ['abc\nacb\nbac\nbca\ncab\ncba\nTotal: 6', 'abc\nacb\nbca\nbac\ncab\ncba\nTotal: 6', 'abc\nbac\ncab\nTotal: 3', 'abc\nacb\nbac\nbca\ncab\ncba\nTotal: 3'],
      javascript: ['abc\nacb\nbac\nbca\ncab\ncba\nTotal: 6', 'abc\nacb\nbca\nbac\ncab\ncba\nTotal: 6', 'abc\nbac\ncab\nTotal: 3', 'abc\nacb\nbac\nbca\ncab\ncba\nTotal: 3'],
    },
    hints: [
      'The first letter is tried in order: a, then b, then c. Everything starting with `a` is printed before anything starting with `b`.',
      'With `a` chosen, the remaining letters `b c` are tried in order: `ab` then `c`, next `ac` then `b`.',
      'Three options for the first slot, two for the second, one for the last: 3 × 2 × 1 orderings.',
    ],
    code: code(
      `
      total = 0

      def permute(chosen, left):
          global total
          if not left:
              print("".join(chosen))
              total += 1
              return
          for i in range(len(left)):
              chosen.append(left[i])
              permute(chosen, left[:i] + left[i + 1:])
              chosen.pop()

      permute([], ["a", "b", "c"])
      print("Total:", total)
      `,
      `
      let total = 0;

      function permute(chosen, left) {
        if (left.length === 0) {
          console.log(chosen.join(""));
          total += 1;
          return;
        }
        for (let i = 0; i < left.length; i++) {
          chosen.push(left[i]);
          permute(chosen, [...left.slice(0, i), ...left.slice(i + 1)]);
          chosen.pop();
        }
      }

      permute([], ["a", "b", "c"]);
      console.log("Total:", total);
      `,
    ),
    investigate: [
      { question: 'What does `chosen.pop()` after the recursive call do?', choices: ['Undoes the choice so the next loop iteration starts from the same partial solution', 'Deletes the printed result', 'Nothing; it could be removed'], answer: 0 },
      { question: 'How many orderings of 10 letters would this print?', choices: ['10! = 3,628,800: backtracking explores everything unless you prune', '100', '1,024'], answer: 0 },
    ],
    takeaway: 'Backtracking is recursion over **choices**: choose, explore, un-choose. The un-choose step is what lets one shared `chosen` list serve every branch. It is exhaustive, so it is exponential, and the skill is **pruning**: stop a branch the moment it cannot lead to a solution (next level).',
  },
  {
    id: 'backtracking-2',
    conceptId: 'backtracking',
    title: 'The Choice That Stuck',
    role: 'combine',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: 'List every way to pick numbers from the first line that add up to the target, and count them: `2 3 5 7` and `10` → `2 + 3 + 5`, `3 + 7`, `Found: 2`.\n\nIt prints `2 + 3 + 5` and then a much longer line full of numbers that were never un-chosen: once a number is chosen it never leaves. One line is missing.',
    reinforces: ['recursion', 'collections', 'loops', 'conditionals', 'input', 'type-conversion', 'string-formatting'],
    hints: [
      'After exploring with `numbers[i]` chosen, the loop moves on to `i + 1`, but `chosen` still contains `numbers[i]`.',
      'Choose, explore, **un-choose**: remove the number again right after the recursive call returns.',
      lang('Add `chosen.pop()` after `search(...)`.', 'Add `chosen.pop();` after `search(...)`.'),
    ],
    starterCode: SUBSET_WRONG,
    solution: SUBSET_RIGHT,
    tests: [
      { name: 'two ways to make 10', input: '2 3 5 7\n10', expectedOutput: '2 + 3 + 5\n3 + 7\nFound: 2' },
      { name: 'two ways to make 5', input: '1 2 3 4\n5', expectedOutput: '1 + 4\n2 + 3\nFound: 2', hidden: true },
      { name: 'no way', input: '2 4 6\n7', expectedOutput: 'Found: 0', hidden: true },
    ],
    takeaway: 'The `if numbers[i] <= remaining` check is **pruning**: a branch that already overshoots is abandoned without exploring it. The missing `pop()` is the most common backtracking bug, and it is sneaky because the *first* answer is still right. Always test a search on an input with more than one solution.',
  },
  {
    id: 'backtracking-3',
    conceptId: 'backtracking',
    title: 'Queens on a Board',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: `Place N queens on an N×N board so none share a row, column or diagonal. Read N, print the **first** solution found (one queen per row, columns tried left to right), then \`Solutions: K\`. For N = 4:\n\n\`\`\`\n. Q . .\n. . . Q\nQ . . .\n. . Q .\nSolutions: 2\n\`\`\`\n\nIf there is none, print \`No solution\` then \`Solutions: 0\`. Keep the placed queens as a list \`cols\` where \`cols[r]\` is the column of the queen in row \`r\`. Write ${lang('`safe(cols, row, col)`', '`safe(cols, row, col)`')}, which **returns** whether a queen can go there given the rows already placed (same column, or same diagonal: the row difference equals the column difference), and ${lang('`solve(row)`', '`solve(row)`')}, which tries every column in the row, recursing on success and un-choosing after.`,
    reinforces: ['recursion', 'functions', 'return-values', 'collections', 'loops', 'conditionals', 'booleans', 'input', 'type-conversion', 'strings', 'string-formatting'],
    hints: [
      lang('`safe`: for each `r` in `range(row)`: `c = cols[r]`; if `c == col` or `abs(c - col) == row - r`: return False. Return True.', '`safe`: for each `r` below `row`: `const c = cols[r]`; if `c === col` or `Math.abs(c - col) === row - r`: return false. Return true.'),
      lang('`solve(row)`: if `row == n`, count a solution and remember a copy of `cols` the first time (`first = cols[:]`). Otherwise for each `col`: if safe, `cols.append(col)`, `solve(row + 1)`, `cols.pop()`.', '`solve(row)`: if `row === n`, count a solution and remember a copy of `cols` the first time (`first = [...cols]`). Otherwise for each `col`: if safe, `cols.push(col)`, `solve(row + 1)`, `cols.pop()`.'),
      lang('Print each row as `" ".join("Q" if c == col else "." for c in range(n))`.', 'Print each row by building an array of `"Q"` / `"."` and joining with spaces.'),
    ],
    starterCode: code(
      `
      n = int(input())
      cols = []
      solutions = 0
      first = None

      def safe(cols, row, col):
          # Can a queen go at (row, col) given the queens in rows 0..row-1?
          pass

      def solve(row):
          # Try every column in this row; count full boards; remember the first.
          pass

      solve(0)
      # Print the first board (or "No solution"), then "Solutions: K".
      `,
      `
      const n = Number(prompt());
      const cols = [];
      let solutions = 0;
      let first = null;

      function safe(cols, row, col) {
        // Can a queen go at (row, col) given the queens in rows 0..row-1?
      }

      function solve(row) {
        // Try every column in this row; count full boards; remember the first.
      }

      solve(0);
      // Print the first board (or "No solution"), then "Solutions: K".
      `,
    ),
    solution: code(
      `
      n = int(input())
      cols = []
      solutions = 0
      first = None

      def safe(cols, row, col):
          for r in range(row):
              c = cols[r]
              if c == col or abs(c - col) == row - r:
                  return False
          return True

      def solve(row):
          global solutions, first
          if row == n:
              solutions += 1
              if first is None:
                  first = cols[:]
              return
          for col in range(n):
              if safe(cols, row, col):
                  cols.append(col)
                  solve(row + 1)
                  cols.pop()

      solve(0)
      if first is None:
          print("No solution")
      else:
          for col in first:
              print(" ".join("Q" if c == col else "." for c in range(n)))
      print(f"Solutions: {solutions}")
      `,
      `
      const n = Number(prompt());
      const cols = [];
      let solutions = 0;
      let first = null;

      function safe(cols, row, col) {
        for (let r = 0; r < row; r++) {
          const c = cols[r];
          if (c === col || Math.abs(c - col) === row - r) {
            return false;
          }
        }
        return true;
      }

      function solve(row) {
        if (row === n) {
          solutions += 1;
          if (first === null) {
            first = [...cols];
          }
          return;
        }
        for (let col = 0; col < n; col++) {
          if (safe(cols, row, col)) {
            cols.push(col);
            solve(row + 1);
            cols.pop();
          }
        }
      }

      solve(0);
      if (first === null) {
        console.log("No solution");
      } else {
        for (const col of first) {
          const cells = [];
          for (let c = 0; c < n; c++) {
            cells.push(c === col ? "Q" : ".");
          }
          console.log(cells.join(" "));
        }
      }
      console.log(\`Solutions: \${solutions}\`);
      `,
    ),
    tests: [
      { name: 'four queens', input: '4', expectedOutput: '. Q . .\n. . . Q\nQ . . .\n. . Q .\nSolutions: 2' },
      { name: 'three queens', input: '3', expectedOutput: 'No solution\nSolutions: 0', hidden: true },
      { name: 'six queens', input: '6', expectedOutput: '. Q . . . .\n. . . Q . .\n. . . . . Q\nQ . . . . .\n. . Q . . .\n. . . . Q .\nSolutions: 4', hidden: true },
      { name: 'one queen', input: '1', expectedOutput: 'Q\nSolutions: 1', hidden: true },
      {
        name: 'safe on its own',
        input: '1',
        hidden: true,
        expectedOutput: { python: 'False False True', javascript: 'false false true' },
        harness: code('print(safe([0, 2], 2, 1), safe([0, 2], 2, 0), safe([0, 2], 2, 4))', 'console.log(safe([0, 2], 2, 1), safe([0, 2], 2, 0), safe([0, 2], 2, 4));'),
      },
    ],
    takeaway: 'N-Queens is the textbook backtracking problem because the pruning is so strong: `safe` rejects a square before any deeper work, so most of the N^N boards are never built. The shape is always the same: a partial solution, a check that it can still succeed, choose / recurse / un-choose. Sudoku solvers, crossword fillers and puzzle games are this loop.',
  },
];
