import type { Level } from '@codegames/shared';
import { code } from '../../helpers';
import { lang } from '../../localize';
import { JS_TO_INT } from '../region4/shared';

/**
 * boss-5: Minesweeper. Phased harnesses on a hidden 3 × 4 board, then full games.
 * Spec: docs/specs/region5-and-security.md §A11 and §E9 (Play it layouts).
 * `Cell`, `neighbors` and `show` are given to keep the learner's share near 70 lines.
 */

const CELL = code(
  `
  class Cell:
      def __init__(self):
          self.revealed = False
          self.flagged = False

      def symbol(self):
          if self.flagged:
              return "F"
          if not self.revealed:
              return "#"
          return self.shown()
  `,
  `
  class Cell {
    constructor() {
      this.revealed = false;
      this.flagged = false;
    }

    symbol() {
      if (this.flagged) {
        return "F";
      }
      if (!this.revealed) {
        return "#";
      }
      return this.shown();
    }
  }
  `,
);

/** The JS `toInt` helper and the given `Cell` class above each language's program. */
function withCell(python: string, javascript: string) {
  const c = code(python, javascript);
  return {
    python: `${CELL.python}\n\n${c.python}`,
    javascript: `${JS_TO_INT}\n${CELL.javascript}\n\n${c.javascript}`,
  };
}

/** The hidden 3 × 4 board every phase-1/2 harness starts from. */
function boardHarness(python: string, javascript: string) {
  const c = code(python, javascript);
  return {
    python: `_b = Board(["*...", "....", "..*."])\n${c.python}`,
    javascript: `const _b = new Board(["*...", "....", "..*."]);\n${c.javascript}`,
  };
}

/** Phase 1–2 tests finish the main program with a tiny board and `quit`. */
const QUIT = '.../.../...\nquit';

/** boss-5 levels, in play order. */
export const boss5Levels: Level[] = [
  {
    id: 'boss-5',
    conceptId: 'boss-5',
    title: 'Minesweeper',
    role: 'boss',
    game: 'build-it',
    mode: 'freeform',
    prompt: `**Boss level!** Build Minesweeper on a text grid.\n\nThe first input line is the board: rows separated by \`/\`, \`*\` for a mine and \`.\` for empty (\`.*.../...../...*./.....\`). Coordinates are \`ROW COL\`, starting at 0.\n\n**Phase 1 · Build the board.** \`Cell\` is given (\`revealed\`, \`flagged\`, and \`symbol()\`: \`F\` if flagged, \`#\` if hidden, otherwise \`shown()\`).\n- \`Mine\` and \`Empty\` are subclasses of \`Cell\`. Both answer ${lang('`is_mine()`', '`isMine()`')}. \`shown()\` is \`*\` for a mine; for an empty cell it is its \`count\` of neighbouring mines, or \`.\` for 0.\n- Your own \`OutOfBoundsError\`.\n- ${lang('`Board(layout)`', '`new Board(layout)`')} keeps \`rows\` (a **new** cell object for every spot), \`width\`, \`height\`, and sets every empty cell's \`count\`.\n- \`neighbors(r, c)\` (the up to 8 spots around a cell, as \`[r, c]\` pairs) and \`show()\` are given. Write \`cell(r, c)\`, which returns a cell or raises/throws \`OutOfBoundsError\` with \`No cell at R, C.\`, and ${lang('`mine_count()`', '`mineCount()`')}.\n\n**Phase 2 · Reveal rules.**\n- \`reveal(r, c)\` **returns** whether it hit a mine. A revealed or flagged cell does nothing. Revealing a 0 reveals all its neighbours too, and theirs when they are 0 (a flood fill).\n- \`flag(r, c)\` toggles the flag on a hidden cell. \`won()\`: every cell that isn't a mine is revealed.\n\n**Phase 3 · Play.** Print \`Mines: N\` and the board. Then read commands (ignore capitals): \`reveal R C\`, \`flag R C\`, \`quit\` (\`Bye!\`). Run them through a **command table**. After a good command print the board, then \`BOOM! Game over.\` or \`You win!\` when the game ends. Off the board: print the error's message. Anything else: \`I don't understand.\`\n\nKeep \`rows\`, \`width\`, \`height\`, \`count\` and \`revealed\` as plain ${lang('attributes', 'properties')}: the tests read them.`,
    reinforces: [
      'higher-order-functions',
      'map-filter-reduce',
      'closures',
      'recursion',
      'recursive-data',
      'inheritance',
      'polymorphism',
      'value-vs-reference',
      'classes',
      'methods',
      'nested-data',
      'error-handling',
      'strings',
      'functions',
      'nested-loops',
      'while-loops',
      'loop-control',
      'input',
      'type-conversion',
      'string-formatting',
    ],
    hints: [
      `Phase 1: build each row so it makes a **new** cell per character (remember The Cloned Rows): ${lang('`[[Mine() if ch == "*" else Empty() for ch in line] for line in layout]`', '`layout.map((line) => line.split("").map((ch) => (ch === "*" ? new Mine() : new Empty())))`')}.`,
      `A cell's \`count\` is how many of the spots in ${lang('`self.neighbors(r, c)`', '`this.neighbors(r, c)`')} hold a mine: a filter, then the length. Set the counts **after** every cell exists.`,
      `\`reveal\`: base cases first (already revealed or flagged: return ${lang('`False`', '`false`')}). Then mark it revealed; a mine returns ${lang('`True`', '`true`')}; a 0 calls ${lang('`self.reveal`', '`this.reveal`')} on every neighbour. The \`revealed\` check is what stops the flood going round in circles.`,
      `Command table: ${lang('`{"reveal": board.reveal, "flag": board.flag}` (a method taken from an object remembers that object)', '`{ reveal: (r, c) => board.reveal(r, c), flag: (r, c) => board.flag(r, c) }`. A bare `board.reveal` forgets its `this`, and your `catch` would hide the crash behind "I don\'t understand."')}.`,
      `Catch \`OutOfBoundsError\` and print its message; any other failure (like ${lang('`int("one")`', '`toInt("one")`')}) is \`I don't understand.\``,
    ],
    starterCode: withCell(
      `
      # Phase 1: Mine and Empty (subclasses of Cell) and your own OutOfBoundsError go here.

      class Board:
          def __init__(self, layout):
              # Phase 1: rows (a NEW cell for every spot), width, height, then every Empty's count.
              pass

          def neighbors(self, r, c):
              spots = []
              for dr in [-1, 0, 1]:
                  for dc in [-1, 0, 1]:
                      nr = r + dr
                      nc = c + dc
                      if (dr != 0 or dc != 0) and 0 <= nr < self.height and 0 <= nc < self.width:
                          spots.append([nr, nc])
              return spots

          def show(self):
              return "\\n".join(" ".join(cell.symbol() for cell in row) for row in self.rows)

          # Phase 1: cell(r, c) and mine_count()
          # Phase 2: reveal(r, c) (a 0 floods its neighbours), flag(r, c), won()

      # Phase 3: read the layout, build the board, print "Mines: N" and the board.
      #   A command table: {"reveal": ..., "flag": ...}
      #   Read commands until quit; catch OutOfBoundsError and bad numbers.
      `,
      `
      // Phase 1: Mine and Empty (subclasses of Cell) and your own OutOfBoundsError go here.

      class Board {
        constructor(layout) {
          // Phase 1: rows (a NEW cell for every spot), width, height, then every Empty's count.
        }

        neighbors(r, c) {
          const spots = [];
          for (const dr of [-1, 0, 1]) {
            for (const dc of [-1, 0, 1]) {
              const nr = r + dr;
              const nc = c + dc;
              if ((dr !== 0 || dc !== 0) && nr >= 0 && nr < this.height && nc >= 0 && nc < this.width) {
                spots.push([nr, nc]);
              }
            }
          }
          return spots;
        }

        show() {
          return this.rows.map((row) => row.map((cell) => cell.symbol()).join(" ")).join("\\n");
        }

        // Phase 1: cell(r, c) and mineCount()
        // Phase 2: reveal(r, c) (a 0 floods its neighbours), flag(r, c), won()
      }

      // Phase 3: read the layout, build the board, print "Mines: N" and the board.
      //   A command table: { reveal: ..., flag: ... }  (wrap methods in arrow functions!)
      //   Read commands until quit; catch OutOfBoundsError and bad numbers.
      `,
    ),
    solution: withCell(
      `
      class Mine(Cell):
          def is_mine(self):
              return True

          def shown(self):
              return "*"

      class Empty(Cell):
          def __init__(self):
              super().__init__()
              self.count = 0

          def is_mine(self):
              return False

          def shown(self):
              return str(self.count) if self.count > 0 else "."

      class OutOfBoundsError(Exception):
          pass

      class Board:
          def __init__(self, layout):
              self.rows = [[Mine() if ch == "*" else Empty() for ch in line] for line in layout]
              self.height = len(self.rows)
              self.width = len(self.rows[0])
              for r in range(self.height):
                  for c in range(self.width):
                      cell = self.rows[r][c]
                      if not cell.is_mine():
                          cell.count = len([s for s in self.neighbors(r, c) if self.rows[s[0]][s[1]].is_mine()])

          def neighbors(self, r, c):
              spots = []
              for dr in [-1, 0, 1]:
                  for dc in [-1, 0, 1]:
                      nr = r + dr
                      nc = c + dc
                      if (dr != 0 or dc != 0) and 0 <= nr < self.height and 0 <= nc < self.width:
                          spots.append([nr, nc])
              return spots

          def cell(self, r, c):
              if r < 0 or r >= self.height or c < 0 or c >= self.width:
                  raise OutOfBoundsError(f"No cell at {r}, {c}.")
              return self.rows[r][c]

          def reveal(self, r, c):
              cell = self.cell(r, c)
              if cell.revealed or cell.flagged:
                  return False
              cell.revealed = True
              if cell.is_mine():
                  return True
              if cell.count == 0:
                  for nr, nc in self.neighbors(r, c):
                      self.reveal(nr, nc)
              return False

          def flag(self, r, c):
              cell = self.cell(r, c)
              if not cell.revealed:
                  cell.flagged = not cell.flagged
              return False

          def mine_count(self):
              return sum(len([cell for cell in row if cell.is_mine()]) for row in self.rows)

          def won(self):
              return all(cell.revealed or cell.is_mine() for row in self.rows for cell in row)

          def show(self):
              return "\\n".join(" ".join(cell.symbol() for cell in row) for row in self.rows)

      board = Board(input().split("/"))
      actions = {"reveal": board.reveal, "flag": board.flag}
      print(f"Mines: {board.mine_count()}")
      print(board.show())
      while True:
          words = input().lower().split()
          if words == ["quit"]:
              print("Bye!")
              break
          if len(words) != 3 or words[0] not in actions:
              print("I don't understand.")
              continue
          try:
              boom = actions[words[0]](int(words[1]), int(words[2]))
          except OutOfBoundsError as err:
              print(err)
              continue
          except ValueError:
              print("I don't understand.")
              continue
          print(board.show())
          if boom:
              print("BOOM! Game over.")
              break
          if board.won():
              print("You win!")
              break
      `,
      `
      class Mine extends Cell {
        isMine() {
          return true;
        }

        shown() {
          return "*";
        }
      }

      class Empty extends Cell {
        constructor() {
          super();
          this.count = 0;
        }

        isMine() {
          return false;
        }

        shown() {
          return this.count > 0 ? String(this.count) : ".";
        }
      }

      class OutOfBoundsError extends Error {}

      class Board {
        constructor(layout) {
          this.rows = layout.map((line) => line.split("").map((ch) => (ch === "*" ? new Mine() : new Empty())));
          this.height = this.rows.length;
          this.width = this.rows[0].length;
          for (let r = 0; r < this.height; r++) {
            for (let c = 0; c < this.width; c++) {
              const cell = this.rows[r][c];
              if (!cell.isMine()) {
                cell.count = this.neighbors(r, c).filter(([nr, nc]) => this.rows[nr][nc].isMine()).length;
              }
            }
          }
        }

        neighbors(r, c) {
          const spots = [];
          for (const dr of [-1, 0, 1]) {
            for (const dc of [-1, 0, 1]) {
              const nr = r + dr;
              const nc = c + dc;
              if ((dr !== 0 || dc !== 0) && nr >= 0 && nr < this.height && nc >= 0 && nc < this.width) {
                spots.push([nr, nc]);
              }
            }
          }
          return spots;
        }

        cell(r, c) {
          if (r < 0 || r >= this.height || c < 0 || c >= this.width) {
            throw new OutOfBoundsError(\`No cell at \${r}, \${c}.\`);
          }
          return this.rows[r][c];
        }

        reveal(r, c) {
          const cell = this.cell(r, c);
          if (cell.revealed || cell.flagged) {
            return false;
          }
          cell.revealed = true;
          if (cell.isMine()) {
            return true;
          }
          if (cell.count === 0) {
            for (const [nr, nc] of this.neighbors(r, c)) {
              this.reveal(nr, nc);
            }
          }
          return false;
        }

        flag(r, c) {
          const cell = this.cell(r, c);
          if (!cell.revealed) {
            cell.flagged = !cell.flagged;
          }
          return false;
        }

        mineCount() {
          return this.rows.reduce((total, row) => total + row.filter((cell) => cell.isMine()).length, 0);
        }

        won() {
          return this.rows.every((row) => row.every((cell) => cell.revealed || cell.isMine()));
        }

        show() {
          return this.rows.map((row) => row.map((cell) => cell.symbol()).join(" ")).join("\\n");
        }
      }

      const board = new Board(prompt().split("/"));
      const actions = { reveal: (r, c) => board.reveal(r, c), flag: (r, c) => board.flag(r, c) };
      console.log(\`Mines: \${board.mineCount()}\`);
      console.log(board.show());
      while (true) {
        const words = prompt().toLowerCase().split(" ");
        if (words.length === 1 && words[0] === "quit") {
          console.log("Bye!");
          break;
        }
        if (words.length !== 3 || !Object.hasOwn(actions, words[0])) {
          console.log("I don't understand.");
          continue;
        }
        let boom = false;
        try {
          boom = actions[words[0]](toInt(words[1]), toInt(words[2]));
        } catch (err) {
          if (err instanceof OutOfBoundsError) {
            console.log(err.message);
          } else {
            console.log("I don't understand.");
          }
          continue;
        }
        console.log(board.show());
        if (boom) {
          console.log("BOOM! Game over.");
          break;
        }
        if (board.won()) {
          console.log("You win!");
          break;
        }
      }
      `,
    ),
    tests: [
      {
        name: 'counts and size',
        phase: '1 · Build the board',
        input: QUIT,
        expectedOutput: { python: '2 4 3\n1 2 0 True False', javascript: '2 4 3\n1 2 0 true false' },
        harness: boardHarness(
          `
          print(_b.mine_count(), _b.width, _b.height)
          print(_b.cell(0, 1).count, _b.cell(1, 1).count, _b.cell(0, 3).count, _b.cell(0, 0).is_mine(), _b.cell(2, 3).is_mine())
          `,
          `
          console.log(_b.mineCount(), _b.width, _b.height);
          console.log(_b.cell(0, 1).count, _b.cell(1, 1).count, _b.cell(0, 3).count, _b.cell(0, 0).isMine(), _b.cell(2, 3).isMine());
          `,
        ),
      },
      {
        name: 'every cell is its own object',
        phase: '1 · Build the board',
        input: QUIT,
        expectedOutput: '# # # #\n# # # #\n# # # #\n# 1 # #\n# # # #\n# # # #',
        harness: boardHarness(
          `
          print(_b.show())
          _b.cell(0, 1).revealed = True
          print(_b.show())
          `,
          `
          console.log(_b.show());
          _b.cell(0, 1).revealed = true;
          console.log(_b.show());
          `,
        ),
      },
      {
        name: 'a 0 floods its area',
        phase: '2 · Reveal rules',
        input: QUIT,
        expectedOutput: { python: 'False\n# 1 . .\n# 2 1 1\n# # # #', javascript: 'false\n# 1 . .\n# 2 1 1\n# # # #' },
        harness: boardHarness(
          `
          print(_b.reveal(0, 3))
          print(_b.show())
          `,
          `
          console.log(_b.reveal(0, 3));
          console.log(_b.show());
          `,
        ),
      },
      {
        name: 'flags, mines and the edge',
        phase: '2 · Reveal rules',
        input: QUIT,
        expectedOutput: {
          python: 'False\nF # # #\nNo cell at 3, 0.\nTrue\nF # # #\n# # # #\n# # * #\nFalse',
          javascript: 'false\nF # # #\nNo cell at 3, 0.\ntrue\nF # # #\n# # # #\n# # * #\nfalse',
        },
        harness: boardHarness(
          `
          _b.flag(0, 0)
          print(_b.reveal(0, 0))
          print(_b.show().split("\\n")[0])
          try:
              _b.reveal(3, 0)
          except OutOfBoundsError as _e:
              print(_e)
          print(_b.reveal(2, 2))
          print(_b.show())
          print(_b.won())
          `,
          `
          _b.flag(0, 0);
          console.log(_b.reveal(0, 0));
          console.log(_b.show().split("\\n")[0]);
          try {
            _b.reveal(3, 0);
          } catch (_e) {
            console.log(_e.message);
          }
          console.log(_b.reveal(2, 2));
          console.log(_b.show());
          console.log(_b.won());
          `,
        ),
      },
      {
        name: 'a winning game',
        phase: '3 · Play',
        input: ['.*.../...../...*./.....', 'flag 0 1', 'reveal 3 0', 'reveal 0 4', 'reveal 0 0', 'reveal 3 3', 'reveal 2 4', 'reveal 3 4'].join('\n'),
        expectedOutput: [
          'Mines: 2',
          '# # # # #', '# # # # #', '# # # # #', '# # # # #',
          '# F # # #', '# # # # #', '# # # # #', '# # # # #',
          '# F # # #', '1 1 2 # #', '. . 1 # #', '. . 1 # #',
          '# F 1 . .', '1 1 2 1 1', '. . 1 # #', '. . 1 # #',
          '1 F 1 . .', '1 1 2 1 1', '. . 1 # #', '. . 1 # #',
          '1 F 1 . .', '1 1 2 1 1', '. . 1 # #', '. . 1 1 #',
          '1 F 1 . .', '1 1 2 1 1', '. . 1 # 1', '. . 1 1 #',
          '1 F 1 . .', '1 1 2 1 1', '. . 1 # 1', '. . 1 1 1',
          'You win!',
        ].join('\n'),
      },
      {
        name: 'BOOM',
        phase: '3 · Play',
        input: '..*./..../*...\nreveal 0 0\nreveal 2 3\nreveal 2 0',
        expectedOutput: [
          'Mines: 2',
          '# # # #', '# # # #', '# # # #',
          '. 1 # #', '1 2 # #', '# # # #',
          '. 1 # #', '1 2 1 1', '# 1 . .',
          '. 1 # #', '1 2 1 1', '* 1 . .',
          'BOOM! Game over.',
        ].join('\n'),
      },
      {
        name: 'bad commands never crash',
        phase: '3 · Play',
        input: ['*../.../...', 'dance', 'reveal 9 9', 'reveal one 2', 'reveal 1', 'FLAG 0 0', 'reveal 0 0', 'flag 0 0', 'quit'].join('\n'),
        expectedOutput: [
          'Mines: 1',
          '# # #', '# # #', '# # #',
          "I don't understand.",
          'No cell at 9, 9.',
          "I don't understand.",
          "I don't understand.",
          'F # #', '# # #', '# # #',
          'F # #', '# # #', '# # #',
          '# # #', '# # #', '# # #',
          'Bye!',
        ].join('\n'),
        hidden: true,
      },
    ],
    requirements: {
      python: [
        { pattern: 'class\\s+Mine\\s*\\(\\s*Cell\\s*\\)', message: 'Make `Mine` a subclass of `Cell`.' },
        { pattern: 'class\\s+Empty\\s*\\(\\s*Cell\\s*\\)', message: 'Make `Empty` a subclass of `Cell`.' },
        { pattern: 'class\\s+OutOfBoundsError\\s*\\(', message: 'Define your own `OutOfBoundsError`.' },
        { pattern: 'self\\.reveal\\(', message: '`reveal` should flood-fill by calling `self.reveal(...)` on the neighbours.' },
        { pattern: '\\{\\s*"reveal"\\s*:', message: 'Dispatch the commands with a table: `{"reveal": ..., "flag": ...}`.' },
        { pattern: 'isinstance\\(|type\\(', forbid: true, message: "Don't ask a cell what kind it is: ask it `is_mine()` or `symbol()` and let each class answer." },
      ],
      javascript: [
        { pattern: 'class\\s+Mine\\s+extends\\s+Cell', message: 'Make `Mine` a subclass of `Cell`.' },
        { pattern: 'class\\s+Empty\\s+extends\\s+Cell', message: 'Make `Empty` a subclass of `Cell`.' },
        { pattern: 'class\\s+OutOfBoundsError\\s+extends', message: 'Define your own `OutOfBoundsError`.' },
        { pattern: 'this\\.reveal\\(', message: '`reveal` should flood-fill by calling `this.reveal(...)` on the neighbours.' },
        { pattern: '\\{\\s*reveal\\s*:', message: 'Dispatch the commands with a table: `{ reveal: ..., flag: ... }`.' },
        { pattern: 'instanceof\\s+(Mine|Empty)|constructor\\.name', forbid: true, message: "Don't ask a cell what kind it is: ask it `isMine()` or `symbol()` and let each class answer." },
      ],
    },
    play: {
      randomWord: ['..*../...../*...*/...../..*..', '.*.../...../...*./....*/.....', '...../.*.*./...../.*.../.....', '*..../...../..*../...../....*', '....*/.*.../...../...*./.....'],
      intro: 'Clear the field without stepping on a mine. Try `reveal 4 4`, then `flag ROW COL` where you think a mine is.',
    },
    takeaway: 'You combined all of Region 5. Cells are a family of classes answering the same calls (inheritance and polymorphism). Every spot is its own object (references). The flood fill is recursion over the grid, with `revealed` as its visited marker. A filter counts the mines, and a table of functions runs the commands. Real games are built from exactly these patterns.',
  },
];
