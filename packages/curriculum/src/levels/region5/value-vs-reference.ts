import type { Level } from '@codegames/shared';
import { code } from '../../helpers';
import { lang } from '../../localize';

/**
 * value-vs-reference: aliases, shallow copies and cloned rows; direct prep for the boss's
 * board. Spec: docs/specs/region5-and-security.md §A10.
 */

const BOARD_LOOP = code(
  `
  while True:
      line = input()
      if line == "done":
          break
      r, c = line.split()
      board[int(r)][int(c)] = "X"

  for row in board:
      print(" ".join(row))
  `,
  `
  while (true) {
    const line = prompt();
    if (line === "done") {
      break;
    }
    const [r, c] = line.split(" ");
    board[Number(r)][Number(c)] = "X";
  }

  for (const row of board) {
    console.log(row.join(" "));
  }
  `,
);

/** The Cloned Rows program around the given board-building line. */
function clonedRows(python: string, javascript: string) {
  return {
    python: `height = 3\nwidth = 4\n${python}\n\n${BOARD_LOOP.python}`,
    javascript: `const height = 3;\nconst width = 4;\n${javascript}\n\n${BOARD_LOOP.javascript}`,
  };
}

/** value-vs-reference levels, in play order. */
export const valueVsReferenceLevels: Level[] = [
  {
    id: 'value-vs-reference-1',
    conceptId: 'value-vs-reference',
    title: 'Two Names, One List',
    role: 'intro',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: `\`squad = team\` doesn't copy the list: it gives the **same** list a second name. ${lang('`list(team)`', '`[...team]`')} makes a real copy. Which output is right?`,
    reinforces: ['collections'],
    hints: [
      'Draw it: one list in memory with two labels, `team` and `squad`. Appending through either label changes the one list.',
      lang(
        '`list(team)` builds a new list with the same items. Changing `backup` leaves `team` alone.',
        '`[...team]` builds a new array with the same items. Changing `backup` leaves `team` alone.',
      ),
      lang('`is` asks "the very same object?", not "equal contents?".', '`===` on arrays asks "the very same array?", not "equal contents?".'),
    ],
    code: code(
      `
      team = ["Ada", "Bo"]
      squad = team
      squad.append("Cy")
      backup = list(team)
      backup.append("Di")
      print(team)
      print(backup)
      print(squad is team, backup is team)
      `,
      `
      const team = ["Ada", "Bo"];
      const squad = team;
      squad.push("Cy");
      const backup = [...team];
      backup.push("Di");
      console.log(team);
      console.log(backup);
      console.log(squad === team, backup === team);
      `,
    ),
    choices: {
      python: [
        "['Ada', 'Bo', 'Cy']\n['Ada', 'Bo', 'Cy', 'Di']\nTrue False",
        "['Ada', 'Bo']\n['Ada', 'Bo', 'Di']\nFalse False",
        "['Ada', 'Bo', 'Cy', 'Di']\n['Ada', 'Bo', 'Cy', 'Di']\nTrue True",
        "['Ada', 'Bo', 'Cy']\n['Ada', 'Bo', 'Cy', 'Di']\nTrue True",
      ],
      javascript: [
        "[ 'Ada', 'Bo', 'Cy' ]\n[ 'Ada', 'Bo', 'Cy', 'Di' ]\ntrue false",
        "[ 'Ada', 'Bo' ]\n[ 'Ada', 'Bo', 'Di' ]\nfalse false",
        "[ 'Ada', 'Bo', 'Cy', 'Di' ]\n[ 'Ada', 'Bo', 'Cy', 'Di' ]\ntrue true",
        "[ 'Ada', 'Bo', 'Cy' ]\n[ 'Ada', 'Bo', 'Cy', 'Di' ]\ntrue true",
      ],
    },
    takeaway: lang(
      'A variable holds a **reference** to a list, not the list itself. `b = a` copies the reference, so both names share one list (they are **aliases**). `list(a)` or `a.copy()` makes a new list. Numbers and strings can\'t be changed in place, so for them sharing never matters.',
      'A variable holds a **reference** to an array, not the array itself. `b = a` copies the reference, so both names share one array (they are **aliases**). `[...a]` makes a new array. Numbers and strings can\'t be changed in place, so for them sharing never matters. `const` only stops the *name* from pointing elsewhere: the array can still change.',
    ),
  },
  {
    id: 'value-vs-reference-2',
    conceptId: 'value-vs-reference',
    title: 'Why Did Both Change?',
    role: 'combine',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: `${lang('`after_battle`', '`afterBattle`')} should return the team **after** taking damage, leaving the original team as it was, so the program can show before and after. With damage 3:\n\n\`\`\`\nAda: 10 -> 7\nBo: 8 -> 5\n\`\`\`\n\nIt copies the list, so why did the "before" numbers change too?`,
    reinforces: ['nested-data', 'map-filter-reduce', 'functions', 'input', 'higher-order-functions'],
    hints: [
      'The copy is a new list, but what is **inside** it? The same hero records as the old list: two lists, sharing records.',
      'This is a **shallow** copy: only the outer list is new. Changing a hero through either list changes the one shared record.',
      lang(
        'Copy each record too: `result = [dict(hero) for hero in team]`.',
        'Copy each record too: `const result = team.map((hero) => ({ ...hero }));`.',
      ),
    ],
    starterCode: code(
      `
      team = [{"name": "Ada", "hp": 10}, {"name": "Bo", "hp": 8}]

      def after_battle(team, damage):
          result = list(team)
          for hero in result:
              hero["hp"] -= damage
          return result

      hurt = after_battle(team, int(input()))
      for i in range(len(team)):
          print(f"{team[i]['name']}: {team[i]['hp']} -> {hurt[i]['hp']}")
      `,
      `
      const team = [{ name: "Ada", hp: 10 }, { name: "Bo", hp: 8 }];

      function afterBattle(team, damage) {
        const result = [...team];
        for (const hero of result) {
          hero.hp -= damage;
        }
        return result;
      }

      const hurt = afterBattle(team, Number(prompt()));
      for (let i = 0; i < team.length; i++) {
        console.log(\`\${team[i].name}: \${team[i].hp} -> \${hurt[i].hp}\`);
      }
      `,
    ),
    solution: code(
      `
      team = [{"name": "Ada", "hp": 10}, {"name": "Bo", "hp": 8}]

      def after_battle(team, damage):
          result = [dict(hero) for hero in team]
          for hero in result:
              hero["hp"] -= damage
          return result

      hurt = after_battle(team, int(input()))
      for i in range(len(team)):
          print(f"{team[i]['name']}: {team[i]['hp']} -> {hurt[i]['hp']}")
      `,
      `
      const team = [{ name: "Ada", hp: 10 }, { name: "Bo", hp: 8 }];

      function afterBattle(team, damage) {
        const result = team.map((hero) => ({ ...hero }));
        for (const hero of result) {
          hero.hp -= damage;
        }
        return result;
      }

      const hurt = afterBattle(team, Number(prompt()));
      for (let i = 0; i < team.length; i++) {
        console.log(\`\${team[i].name}: \${team[i].hp} -> \${hurt[i].hp}\`);
      }
      `,
    ),
    tests: [
      { name: 'damage 3', input: '3', expectedOutput: 'Ada: 10 -> 7\nBo: 8 -> 5' },
      { name: 'damage 1', input: '1', expectedOutput: 'Ada: 10 -> 9\nBo: 8 -> 7', hidden: true },
      {
        name: 'the original team is untouched',
        input: '0',
        expectedOutput: '5 4',
        hidden: true,
        harness: code(
          `
          _t = [{"name": "Z", "hp": 5}]
          _h = after_battle(_t, 1)
          print(_t[0]["hp"], _h[0]["hp"])
          `,
          `
          const _t = [{ name: "Z", hp: 5 }];
          const _h = afterBattle(_t, 1);
          console.log(_t[0].hp, _h[0].hp);
          `,
        ),
      },
    ],
    takeaway: lang(
      'A **shallow copy** (`list(x)`, `x.copy()`, `x[:]`) makes a new outer list holding the **same** inner records. When the records will change, copy them too (`[dict(r) for r in x]`), or use `copy.deepcopy(x)` to copy every level.',
      'A **shallow copy** (`[...x]`, `x.slice()`) makes a new outer array holding the **same** inner objects. When the objects will change, copy them too (`x.map((r) => ({ ...r }))`), or use `structuredClone(x)` to copy every level.',
    ),
  },
  {
    id: 'value-vs-reference-3',
    conceptId: 'value-vs-reference',
    title: 'The Cloned Rows',
    role: 'integrate',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: 'A 3 × 4 board starts empty (`.`). Each input line `ROW COL` places an `X`, until `done`; then the board is printed. For `1 2` and `0 0` it should print:\n\n```\nX . . .\n. . X .\n. . . .\n```\n\nBut every `X` shows up in **every** row. The board-building line looks fine... or does it?',
    reinforces: ['nested-loops', 'collections', 'strings', 'while-loops', 'input', 'type-conversion', 'map-filter-reduce'],
    hints: [
      lang(
        '`[row] * 3` makes a list holding the **same** row 3 times, not 3 rows. Try `print(board[0] is board[1])`.',
        '`.fill(row)` puts the **same** row array in every slot, not 3 rows. Try `console.log(board[0] === board[1])`.',
      ),
      'You need a **new** row for each position, made fresh each time.',
      lang(
        '`board = [["."] * width for i in range(height)]`: the comprehension runs `["."] * width` again for every row.',
        '`const board = Array.from({ length: height }, () => Array(width).fill("."));`: the arrow function runs again for every row.',
      ),
    ],
    starterCode: clonedRows('board = [["."] * width] * height', 'const board = Array(height).fill(Array(width).fill("."));'),
    solution: clonedRows('board = [["."] * width for i in range(height)]', 'const board = Array.from({ length: height }, () => Array(width).fill("."));'),
    tests: [
      { name: 'two marks', input: '1 2\n0 0\ndone', expectedOutput: 'X . . .\n. . X .\n. . . .' },
      { name: 'a diagonal', input: '0 0\n1 1\n2 2\ndone', expectedOutput: 'X . . .\n. X . .\n. . X .', hidden: true },
      { name: 'nothing placed', input: 'done', expectedOutput: '. . . .\n. . . .\n. . . .', hidden: true },
    ],
    takeaway: lang(
      '`[x] * n` repeats the **reference**, so `[["."] * 4] * 3` is one row seen three times. That\'s harmless for numbers or strings, but a trap for lists. Build each row fresh: a comprehension or a loop runs the row-maker once per row. You\'ll need this for the boss\'s board.',
      '`.fill(x)` puts the same **reference** in every slot, so `Array(3).fill(Array(4).fill("."))` is one row seen three times. That\'s harmless for numbers or strings, but a trap for arrays. Build each row fresh: `Array.from` or a loop runs the row-maker once per row. You\'ll need this for the boss\'s board.',
    ),
  },
];
