import type { Level } from '@codegames/shared';
import { code } from '../../helpers';
import { lang } from '../../localize';
import { codeWithToInt } from '../region4/shared';

/**
 * boss-6: Leaderboard Engine. Every Region 6 tool in one program: a ranking kept sorted by
 * binary-search insertion, a dictionary for O(1) lookups, a sliding window over the ranking,
 * and an undo history stored as a linked list. Spec: docs/specs/regions6-8.md Part A.
 */

/** Phase 1–2 harnesses build their own board; stdin just ends the main loop. */
const QUIT = 'quit';

/** Phase 1 boards are filled with `put` (phase 2's `score` does not exist yet); phase 2 uses `score` to build history. */
function boardHarness(python: string, javascript: string, method: 'put' | 'score' = 'put') {
  const c = code(python, javascript);
  const players: [string, number][] = [['Ada', 10], ['Bo', 30], ['Cy', 20], ['Di', 20]];
  const fill = (sep: string) => players.map(([name, points]) => `_b.${method}("${name}", ${points})${sep}`).join('\n');
  return {
    python: `_b = Board()\n${fill('')}\n${c.python}`,
    javascript: `const _b = new Board();\n${fill(';')}\n${c.javascript}`,
  };
}

/** boss-6 levels, in play order. */
export const boss6Levels: Level[] = [
  {
    id: 'boss-6',
    conceptId: 'boss-6',
    title: 'Leaderboard Engine',
    role: 'boss',
    game: 'build-it',
    mode: 'freeform',
    prompt: `**Boss level!** Build the ranking engine behind a game's leaderboard. Each player has one score; higher is better; equal scores rank alphabetically by name. The engine must stay fast with thousands of players, so **no built-in sort** and no scanning for a player when a dictionary or binary search will do.\n\n**Phase 1 · Sorted board.**\n- ${lang('`comes_before(a, b)`', '`comesBefore(a, b)`')}: entries are \`[name, score]\` pairs; **returns** whether \`a\` ranks above \`b\`.\n- ${lang('`insert_index(ranked, entry)`', '`insertIndex(ranked, entry)`')}: a **binary search** over the ranked list that returns the first index whose entry does **not** come before \`entry\`. That is both where a new entry belongs and where an existing identical entry sits.\n- \`Board\` keeps \`scores\` (a ${lang('dictionary', 'plain object')} from name to score), \`ranked\` (the sorted list of entries) and \`history\` (phase 2). \`put(name, points)\` removes the player's old entry if there is one, then inserts the new one at its ${lang('`insert_index`', '`insertIndex`')} (${lang('`None`', '`null`')} points means remove only). \`rank(name)\` **returns** the 0-based position, or -1 when unknown. \`top(k)\` returns the first \`k\` entries.\n\n**Phase 2 · History & windows.**\n- Every \`score(name, points)\` call first pushes a \`Change(name, previous, next)\` node onto \`history\`, a **linked list** whose head is the most recent change (\`previous\` is the player's old score, or ${lang('`None`', '`null`')} for a new player), then calls \`put\`. \`undo()\` pops the head, puts the previous score back, and **returns** the name (or ${lang('`None`', '`null`')} when there is nothing to undo).\n- \`closest(k)\`: a **sliding window** over \`ranked\` that finds the \`k\` consecutive players with the smallest gap between their top and bottom scores; returns \`[names, gap]\` for the first such window, or ${lang('`None`', '`null`')} when there are fewer than \`k\` players.\n\n**Phase 3 · Play.** Read commands until \`quit\` (\`Bye!\`):\n- \`score NAME POINTS\` → \`NAME: POINTS (#RANK)\` (1-based)\n- \`rank NAME\` → \`NAME is #RANK with POINTS\` or \`NAME has no score\`\n- \`top K\` (K ≥ 1) → lines \`1. NAME POINTS\`… or \`Board is empty\`\n- \`close K\` (K ≥ 1) → \`Closest K: A, B, C (gap G)\` or \`Not enough players\`\n- \`undo\` → \`Undid NAME\` or \`Nothing to undo\`\n- anything else, including bad numbers → \`Unknown command\`\n\nKeep \`scores\`, \`ranked\`, \`history\`, \`name\`, \`previous\` and \`next\` as plain ${lang('attributes', 'properties')}: the tests read them.`,
    reinforces: [
      'binary-search',
      'hashing',
      'two-pointers',
      'linked-lists',
      'sorting-basics',
      'stacks-queues',
      'big-o',
      'classes',
      'methods',
      'maps',
      'error-handling',
      'value-vs-reference',
      'functions',
      'return-values',
      'while-loops',
      'conditionals',
      'input',
      'type-conversion',
      'string-formatting',
    ],
    hints: [
      `${lang('`insert_index`', '`insertIndex`')} is Smallest Shelf That Fits with ${lang('`comes_before`', '`comesBefore`')} as the test: \`answer = len\`; while \`lo <= hi\`: if the middle entry comes before \`entry\`, \`lo = mid + 1\`, else remember \`mid\` and \`hi = mid - 1\`.`,
      `\`put\`: if the name is in \`scores\`, find its old entry with ${lang('`insert_index(self.ranked, [name, self.scores[name]])`', '`insertIndex(this.ranked, [name, this.scores[name]])`')} and delete that index (${lang('`del self.ranked[i]`', '`this.ranked.splice(i, 1)`')}). Then, unless points is ${lang('`None`', '`null`')}, record the score and ${lang('`self.ranked.insert(i, entry)`', '`this.ranked.splice(i, 0, entry)`')} at the new index.`,
      `\`score\`: ${lang('`self.history = Change(name, self.scores.get(name), self.history)`', '`this.history = new Change(name, Object.hasOwn(this.scores, name) ? this.scores[name] : null, this.history)`')} then \`put\`. \`undo\` reads the head, moves \`history\` to \`.next\`, then \`put(change.name, change.previous)\`.`,
      `\`closest\`: for every start index up to \`len - k\`, the gap is \`ranked[start][1] - ranked[start + k - 1][1]\`; keep the first smallest. The names are the window's entries' names.`,
      `Phase 3: split the line, dispatch on \`words[0]\`, and wrap the number conversion in ${lang('`try/except ValueError`', '`try/catch` using `toInt`')} together with the length check, so every malformed command prints \`Unknown command\`.`,
    ],
    requirements: {
      python: [
        { pattern: '\\bsorted\\(|\\.sort\\(', forbid: true, message: 'Keep the list sorted yourself: binary-search insertion, no sorted() or .sort().' },
        { pattern: '\\.index\\(|bisect', forbid: true, message: 'Find positions with your own binary search, not .index() or bisect.' },
        { pattern: 'class\\s+Change\\b', message: 'Store the history as a linked list of Change nodes.' },
      ],
      javascript: [
        { pattern: '\\.sort\\(|toSorted\\(', forbid: true, message: 'Keep the list sorted yourself: binary-search insertion, no .sort().' },
        { pattern: 'indexOf\\(|findIndex\\(|\\.find\\(', forbid: true, message: 'Find positions with your own binary search, not indexOf or find.' },
        { pattern: 'class\\s+Change\\b', message: 'Store the history as a linked list of Change nodes.' },
      ],
    },
    starterCode: codeWithToInt(
      `
      def comes_before(a, b):
          # Does entry a rank above entry b?
          pass

      def insert_index(ranked, entry):
          # Binary search: the first index whose entry does not come before entry.
          pass

      class Change:
          def __init__(self, name, previous, next_change):
              self.name = name
              self.previous = previous
              self.next = next_change

      class Board:
          def __init__(self):
              self.scores = {}
              self.ranked = []
              self.history = None

          # Phase 1: put, rank, top
          # Phase 2: score, undo, closest

      board = Board()
      # Phase 3: the command loop.
      `,
      `
      function comesBefore(a, b) {
        // Does entry a rank above entry b?
      }

      function insertIndex(ranked, entry) {
        // Binary search: the first index whose entry does not come before entry.
      }

      class Change {
        constructor(name, previous, next) {
          this.name = name;
          this.previous = previous;
          this.next = next;
        }
      }

      class Board {
        constructor() {
          this.scores = {};
          this.ranked = [];
          this.history = null;
        }

        // Phase 1: put, rank, top
        // Phase 2: score, undo, closest
      }

      const board = new Board();
      // Phase 3: the command loop.
      `,
    ),
    solution: codeWithToInt(
      `
      def comes_before(a, b):
          if a[1] != b[1]:
              return a[1] > b[1]
          return a[0] < b[0]

      def insert_index(ranked, entry):
          lo = 0
          hi = len(ranked) - 1
          answer = len(ranked)
          while lo <= hi:
              mid = (lo + hi) // 2
              if comes_before(ranked[mid], entry):
                  lo = mid + 1
              else:
                  answer = mid
                  hi = mid - 1
          return answer

      class Change:
          def __init__(self, name, previous, next_change):
              self.name = name
              self.previous = previous
              self.next = next_change

      class Board:
          def __init__(self):
              self.scores = {}
              self.ranked = []
              self.history = None

          def put(self, name, points):
              if name in self.scores:
                  old = insert_index(self.ranked, [name, self.scores[name]])
                  del self.ranked[old]
                  del self.scores[name]
              if points is not None:
                  entry = [name, points]
                  self.scores[name] = points
                  self.ranked.insert(insert_index(self.ranked, entry), entry)

          def rank(self, name):
              if name not in self.scores:
                  return -1
              return insert_index(self.ranked, [name, self.scores[name]])

          def top(self, k):
              return self.ranked[:k]

          def score(self, name, points):
              self.history = Change(name, self.scores.get(name), self.history)
              self.put(name, points)

          def undo(self):
              if self.history is None:
                  return None
              change = self.history
              self.history = change.next
              self.put(change.name, change.previous)
              return change.name

          def closest(self, k):
              if k < 1 or k > len(self.ranked):
                  return None
              best_start = 0
              best_gap = self.ranked[0][1] - self.ranked[k - 1][1]
              for start in range(1, len(self.ranked) - k + 1):
                  gap = self.ranked[start][1] - self.ranked[start + k - 1][1]
                  if gap < best_gap:
                      best_gap = gap
                      best_start = start
              names = []
              for entry in self.ranked[best_start:best_start + k]:
                  names.append(entry[0])
              return [names, best_gap]

      board = Board()
      while True:
          words = input().split()
          if words == ["quit"]:
              print("Bye!")
              break
          try:
              if words[0] == "score" and len(words) == 3:
                  board.score(words[1], int(words[2]))
                  print(f"{words[1]}: {words[2]} (#{board.rank(words[1]) + 1})")
              elif words[0] == "rank" and len(words) == 2:
                  position = board.rank(words[1])
                  if position == -1:
                      print(f"{words[1]} has no score")
                  else:
                      print(f"{words[1]} is #{position + 1} with {board.scores[words[1]]}")
              elif words[0] == "top" and len(words) == 2:
                  rows = board.top(int(words[1]))
                  if not rows:
                      print("Board is empty")
                  for i in range(len(rows)):
                      print(f"{i + 1}. {rows[i][0]} {rows[i][1]}")
              elif words[0] == "close" and len(words) == 2:
                  result = board.closest(int(words[1]))
                  if result is None:
                      print("Not enough players")
                  else:
                      print(f"Closest {words[1]}: {', '.join(result[0])} (gap {result[1]})")
              elif words[0] == "undo" and len(words) == 1:
                  name = board.undo()
                  print(f"Undid {name}" if name is not None else "Nothing to undo")
              else:
                  print("Unknown command")
          except (ValueError, IndexError):
              print("Unknown command")
      `,
      `
      function comesBefore(a, b) {
        if (a[1] !== b[1]) {
          return a[1] > b[1];
        }
        return a[0] < b[0];
      }

      function insertIndex(ranked, entry) {
        let lo = 0;
        let hi = ranked.length - 1;
        let answer = ranked.length;
        while (lo <= hi) {
          const mid = Math.floor((lo + hi) / 2);
          if (comesBefore(ranked[mid], entry)) {
            lo = mid + 1;
          } else {
            answer = mid;
            hi = mid - 1;
          }
        }
        return answer;
      }

      class Change {
        constructor(name, previous, next) {
          this.name = name;
          this.previous = previous;
          this.next = next;
        }
      }

      class Board {
        constructor() {
          this.scores = {};
          this.ranked = [];
          this.history = null;
        }

        put(name, points) {
          if (Object.hasOwn(this.scores, name)) {
            const old = insertIndex(this.ranked, [name, this.scores[name]]);
            this.ranked.splice(old, 1);
            delete this.scores[name];
          }
          if (points !== null) {
            const entry = [name, points];
            this.scores[name] = points;
            this.ranked.splice(insertIndex(this.ranked, entry), 0, entry);
          }
        }

        rank(name) {
          if (!Object.hasOwn(this.scores, name)) {
            return -1;
          }
          return insertIndex(this.ranked, [name, this.scores[name]]);
        }

        top(k) {
          return this.ranked.slice(0, k);
        }

        score(name, points) {
          const previous = Object.hasOwn(this.scores, name) ? this.scores[name] : null;
          this.history = new Change(name, previous, this.history);
          this.put(name, points);
        }

        undo() {
          if (this.history === null) {
            return null;
          }
          const change = this.history;
          this.history = change.next;
          this.put(change.name, change.previous);
          return change.name;
        }

        closest(k) {
          if (k < 1 || k > this.ranked.length) {
            return null;
          }
          let bestStart = 0;
          let bestGap = this.ranked[0][1] - this.ranked[k - 1][1];
          for (let start = 1; start <= this.ranked.length - k; start++) {
            const gap = this.ranked[start][1] - this.ranked[start + k - 1][1];
            if (gap < bestGap) {
              bestGap = gap;
              bestStart = start;
            }
          }
          const names = [];
          for (const entry of this.ranked.slice(bestStart, bestStart + k)) {
            names.push(entry[0]);
          }
          return [names, bestGap];
        }
      }

      const board = new Board();
      while (true) {
        const words = prompt().split(" ");
        if (words.length === 1 && words[0] === "quit") {
          console.log("Bye!");
          break;
        }
        try {
          if (words[0] === "score" && words.length === 3) {
            board.score(words[1], toInt(words[2]));
            console.log(\`\${words[1]}: \${words[2]} (#\${board.rank(words[1]) + 1})\`);
          } else if (words[0] === "rank" && words.length === 2) {
            const position = board.rank(words[1]);
            if (position === -1) {
              console.log(\`\${words[1]} has no score\`);
            } else {
              console.log(\`\${words[1]} is #\${position + 1} with \${board.scores[words[1]]}\`);
            }
          } else if (words[0] === "top" && words.length === 2) {
            const rows = board.top(toInt(words[1]));
            if (rows.length === 0) {
              console.log("Board is empty");
            }
            for (let i = 0; i < rows.length; i++) {
              console.log(\`\${i + 1}. \${rows[i][0]} \${rows[i][1]}\`);
            }
          } else if (words[0] === "close" && words.length === 2) {
            const result = board.closest(toInt(words[1]));
            if (result === null) {
              console.log("Not enough players");
            } else {
              console.log(\`Closest \${words[1]}: \${result[0].join(", ")} (gap \${result[1]})\`);
            }
          } else if (words[0] === "undo" && words.length === 1) {
            const name = board.undo();
            console.log(name !== null ? \`Undid \${name}\` : "Nothing to undo");
          } else {
            console.log("Unknown command");
          }
        } catch (err) {
          console.log("Unknown command");
        }
      }
      `,
    ),
    tests: [
      {
        name: 'ordering, ranks and the insert index',
        phase: '1 · Sorted board',
        input: QUIT,
        expectedOutput: { python: 'Bo Cy Di Ada\n1 -1 1 4\nTrue False True', javascript: 'Bo Cy Di Ada\n1 -1 1 4\ntrue false true' },
        harness: boardHarness(
          `
          print(" ".join(e[0] for e in _b.ranked))
          print(_b.rank("Cy"), _b.rank("Zed"), insert_index(_b.ranked, ["Aa", 20]), insert_index(_b.ranked, ["Zed", 1]))
          print(comes_before(["Al", 5], ["Bo", 5]), comes_before(["Bo", 5], ["Al", 5]), comes_before(["Zed", 9], ["Al", 8]))
          `,
          `
          console.log(_b.ranked.map((e) => e[0]).join(" "));
          console.log(_b.rank("Cy"), _b.rank("Zed"), insertIndex(_b.ranked, ["Aa", 20]), insertIndex(_b.ranked, ["Zed", 1]));
          console.log(comesBefore(["Al", 5], ["Bo", 5]), comesBefore(["Bo", 5], ["Al", 5]), comesBefore(["Zed", 9], ["Al", 8]));
          `,
        ),
      },
      {
        name: 'put replaces and removes',
        phase: '1 · Sorted board',
        input: QUIT,
        expectedOutput: 'Bo Ada Cy Di 4\nBo Cy Di 3\nBo Cy',
        harness: boardHarness(
          `
          _b.put("Ada", 25)
          print(" ".join(e[0] for e in _b.ranked), len(_b.scores))
          _b.put("Ada", None)
          print(" ".join(e[0] for e in _b.ranked), len(_b.scores))
          print(" ".join(e[0] for e in _b.top(2)))
          `,
          `
          _b.put("Ada", 25);
          console.log(_b.ranked.map((e) => e[0]).join(" "), Object.keys(_b.scores).length);
          _b.put("Ada", null);
          console.log(_b.ranked.map((e) => e[0]).join(" "), Object.keys(_b.scores).length);
          console.log(_b.top(2).map((e) => e[0]).join(" "));
          `,
        ),
      },
      {
        name: 'history is a chain of changes',
        phase: '2 · History & windows',
        input: QUIT,
        expectedOutput: {
          python: 'Ada 10 Bo None\nAda\n40 True\nAda 30 True\nTrue\nTrue\nTrue\nAda\n0 None',
          javascript: 'Ada 10 Bo null\nAda\n40 true\nAda 30 true\ntrue\ntrue\ntrue\nAda\n0 null',
        },
        harness: boardHarness(
          `
          _b.score("Ada", 40)
          print(_b.history.name, _b.history.previous, _b.history.next.next.next.name, _b.history.next.next.next.next.previous)
          print(_b.ranked[0][0])
          print(_b.scores["Ada"], _b.history.next.next.next.next.next is None)
          print(_b.undo(), _b.ranked[0][1], _b.scores["Ada"] == 10)
          print(_b.undo() == "Di", _b.undo() == "Cy", _b.undo() == "Bo", _b.undo(), sep="\\n")
          print(len(_b.ranked), _b.undo())
          `,
          `
          _b.score("Ada", 40);
          console.log(_b.history.name, _b.history.previous, _b.history.next.next.next.name, _b.history.next.next.next.next.previous);
          console.log(_b.ranked[0][0]);
          console.log(_b.scores["Ada"], _b.history.next.next.next.next.next === null);
          console.log(_b.undo(), _b.ranked[0][1], _b.scores["Ada"] === 10);
          console.log([_b.undo() === "Di", _b.undo() === "Cy", _b.undo() === "Bo", _b.undo()].join("\\n"));
          console.log(_b.ranked.length, _b.undo());
          `,
          'score',
        ),
      },
      {
        name: 'closest windows',
        phase: '2 · History & windows',
        input: QUIT,
        expectedOutput: { python: 'Cy,Di 0\nBo,Cy,Di 10\nBo,Cy,Di,Ada 20\nNone True', javascript: 'Cy,Di 0\nBo,Cy,Di 10\nBo,Cy,Di,Ada 20\nnull true' },
        harness: boardHarness(
          `
          for _k in [2, 3, 4]:
              _r = _b.closest(_k)
              print(",".join(_r[0]), _r[1])
          print(_b.closest(5), _b.closest(1)[1] == 0)
          `,
          `
          for (const _k of [2, 3, 4]) {
            const _r = _b.closest(_k);
            console.log(_r[0].join(","), _r[1]);
          }
          console.log(_b.closest(5), _b.closest(1)[1] === 0);
          `,
        ),
      },
      {
        name: 'a full session',
        phase: '3 · Play',
        input: ['score Ada 10', 'score Bo 30', 'score Cy 20', 'top 2', 'rank Cy', 'score Ada 25', 'rank Ada', 'close 2', 'undo', 'rank Ada', 'top 5', 'rank Zed', 'undo', 'undo', 'undo', 'undo', 'close 1', 'top 1', 'quit'].join('\n'),
        expectedOutput: [
          'Ada: 10 (#1)',
          'Bo: 30 (#1)',
          'Cy: 20 (#2)',
          '1. Bo 30',
          '2. Cy 20',
          'Cy is #2 with 20',
          'Ada: 25 (#2)',
          'Ada is #2 with 25',
          'Closest 2: Bo, Ada (gap 5)',
          'Undid Ada',
          'Ada is #3 with 10',
          '1. Bo 30',
          '2. Cy 20',
          '3. Ada 10',
          'Zed has no score',
          'Undid Cy',
          'Undid Bo',
          'Undid Ada',
          'Nothing to undo',
          'Not enough players',
          'Board is empty',
          'Bye!',
        ].join('\n'),
      },
      {
        name: 'ties rank alphabetically',
        phase: '3 · Play',
        input: ['score Di 20', 'score Bo 20', 'score Cy 20', 'top 3', 'close 3', 'score Bo 21', 'close 2', 'rank Di', 'quit'].join('\n'),
        expectedOutput: ['Di: 20 (#1)', 'Bo: 20 (#1)', 'Cy: 20 (#2)', '1. Bo 20', '2. Cy 20', '3. Di 20', 'Closest 3: Bo, Cy, Di (gap 0)', 'Bo: 21 (#1)', 'Closest 2: Cy, Di (gap 0)', 'Di is #3 with 20', 'Bye!'].join('\n'),
        hidden: true,
      },
      {
        name: 'bad commands never crash',
        phase: '3 · Play',
        input: ['score Ada', 'score Ada ten', 'rank', 'top', 'top x', 'close', 'dance now', 'undo extra', 'score Ada 5', 'score Ada 5', 'undo', 'rank Ada', 'quit'].join('\n'),
        expectedOutput: ['Unknown command', 'Unknown command', 'Unknown command', 'Unknown command', 'Unknown command', 'Unknown command', 'Unknown command', 'Unknown command', 'Ada: 5 (#1)', 'Ada: 5 (#1)', 'Undid Ada', 'Ada is #1 with 5', 'Bye!'].join('\n'),
        hidden: true,
      },
    ],
    takeaway: 'Every Region 6 tool did one job: **binary search** kept the ranking sorted in O(log n) per lookup, the **dictionary** made "what is Ada\'s score?" O(1), the **sliding window** found the closest group in one pass, and the **linked list** gave you a stack of changes with O(1) push and pop. Picking the structure to fit each question is the whole craft of algorithms; from here on, Region 7 builds structures that answer harder questions.',
  },
];
