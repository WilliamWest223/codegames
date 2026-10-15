import type { Level } from '@codegames/shared';
import { code, grid } from '../../helpers';
import { lang } from '../../localize';

/**
 * recursive-data: data with no fixed depth (family trees, nested lists, a branching cave,
 * folders, a flood fill). Spec: docs/specs/region5-and-security.md §A7.
 */

const DISK = code(
  `
  disk = {
      "notes.txt": 4,
      "games": {"chess.py": 12, "saves": {"slot1": 30, "slot2": 25}},
      "music": {"song.mp3": 90},
      "todo.txt": 1,
  }
  `,
  `
  const disk = {
    "notes.txt": 4,
    games: { "chess.py": 12, saves: { slot1: 30, slot2: 25 } },
    music: { "song.mp3": 90 },
    "todo.txt": 1,
  };
  `,
);

const DISK_LOOP = code(
  `
  while True:
      words = input().split()
      if words[0] == "done":
          break
      elif words[0] == "total":
          print(f"Total: {size(disk)}")
      elif words[0] == "find":
          found = find(disk, words[1], "")
          if found is None:
              print(f"Not found: {words[1]}")
          else:
              print(f"Found: {found}")
  `,
  `
  while (true) {
    const words = prompt().split(" ");
    if (words[0] === "done") {
      break;
    } else if (words[0] === "total") {
      console.log(\`Total: \${size(disk)}\`);
    } else if (words[0] === "find") {
      const found = find(disk, words[1], "");
      if (found === null) {
        console.log(\`Not found: \${words[1]}\`);
      } else {
        console.log(\`Found: \${found}\`);
      }
    }
  }
  `,
);

/** The disk data, the learner's functions, then the command loop. */
function withDisk(python: string, javascript: string) {
  const c = code(python, javascript);
  return {
    python: `${DISK.python}\n${c.python}\n${DISK_LOOP.python}`,
    javascript: `${DISK.javascript}\n${c.javascript}\n${DISK_LOOP.javascript}`,
  };
}

const PICTURE = code(
  `
  picture = [
      "..#.....",
      "..#.##..",
      "###.#...",
      "....#.#.",
  ]
  `,
  `
  const picture = [
    "..#.....",
    "..#.##..",
    "###.#...",
    "....#.#.",
  ];
  `,
);

function withPicture(python: string, javascript: string) {
  const c = code(python, javascript);
  return { python: `${PICTURE.python}\n${c.python}`, javascript: `${PICTURE.javascript}\n${c.javascript}` };
}

const ROBOT_HELPERS = code(
  `
  def turn_right():
      for i in range(3):
          turn_left()

  def turn_around():
      turn_left()
      turn_left()
  `,
  `
  function turnRight() {
    for (let i = 0; i < 3; i++) {
      turnLeft();
    }
  }

  function turnAround() {
    turnLeft();
    turnLeft();
  }
  `,
);

function withRobotHelpers(python: string, javascript: string) {
  const c = code(python, javascript);
  return {
    python: `${ROBOT_HELPERS.python}\n${c.python}`,
    javascript: `${ROBOT_HELPERS.javascript}\n${c.javascript}`,
  };
}

/** recursive-data levels, in play order. */
export const recursiveDataLevels: Level[] = [
  {
    id: 'recursive-data-1',
    conceptId: 'recursive-data',
    title: 'Family Tree',
    role: 'intro',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: 'A family tree is **recursive data**: each person is a record whose `kids` are more people, each with their own `kids`. The functions that walk it are recursive too. Predict the output.',
    reinforces: ['nested-data'],
    hints: [
      '`show` prints a person with one `-` per level of depth, then shows each kid one level deeper.',
      "Bo's whole branch (Bo, then Cy) is printed before Di: each call finishes its own kids first.",
      "`count` is 1 (the person) plus the count of each kid's tree.",
    ],
    code: code(
      `
      tree = {
          "name": "Ada",
          "kids": [
              {"name": "Bo", "kids": [{"name": "Cy", "kids": []}]},
              {"name": "Di", "kids": []},
          ],
      }

      def show(person, depth):
          print("-" * depth + person["name"])
          for kid in person["kids"]:
              show(kid, depth + 1)

      def count(person):
          total = 1
          for kid in person["kids"]:
              total += count(kid)
          return total

      show(tree, 0)
      print(count(tree))
      `,
      `
      const tree = {
        name: "Ada",
        kids: [
          { name: "Bo", kids: [{ name: "Cy", kids: [] }] },
          { name: "Di", kids: [] },
        ],
      };

      function show(person, depth) {
        console.log("-".repeat(depth) + person.name);
        for (const kid of person.kids) {
          show(kid, depth + 1);
        }
      }

      function count(person) {
        let total = 1;
        for (const kid of person.kids) {
          total += count(kid);
        }
        return total;
      }

      show(tree, 0);
      console.log(count(tree));
      `,
    ),
    takeaway: "Data shaped like a **tree** (folders, family trees, menus, comments with replies) has no fixed depth, so a fixed number of nested loops can't walk it. A recursive function can: it handles one node and calls itself for each child. Leaves (no kids) are the base case: the loop simply runs zero times.",
  },
  {
    id: 'recursive-data-2',
    conceptId: 'recursive-data',
    title: 'Nested Boxes',
    role: 'combine',
    game: 'build-it',
    mode: 'fill-blanks',
    prompt: `A box holds numbers **and smaller boxes**, which hold numbers and even smaller boxes... \`total(box)\` adds up every number at every depth: \`[1, [2, 3], [[4]], 5]\` → \`15\`.\n\nFor each item: if it's a list, add up **its** total (recursion!); otherwise it's a number, so add it. ${lang('`isinstance(item, list)` asks "is this a list?"', '`Array.isArray(item)` asks "is this an array?"')}`,
    reinforces: ['iterating-collections', 'collections', 'conditionals', 'recursion'],
    hints: [
      lang('The test is `isinstance(item, list)`.', 'The test is `Array.isArray(item)`.'),
      'For a box inside the box, call `total` on it: it will deal with whatever is inside, however deep.',
    ],
    starterCode: code(
      `
      def total(box):
          result = 0
          for item in box:
              if ___:
                  result += ___
              else:
                  result += item
          return result

      boxes = [1, [2, 3], [[4]], 5]
      print(total(boxes))
      `,
      `
      function total(box) {
        let result = 0;
        for (const item of box) {
          if (___) {
            result += ___;
          } else {
            result += item;
          }
        }
        return result;
      }

      const boxes = [1, [2, 3], [[4]], 5];
      console.log(total(boxes));
      `,
    ),
    solution: code(
      `
      def total(box):
          result = 0
          for item in box:
              if isinstance(item, list):
                  result += total(item)
              else:
                  result += item
          return result

      boxes = [1, [2, 3], [[4]], 5]
      print(total(boxes))
      `,
      `
      function total(box) {
        let result = 0;
        for (const item of box) {
          if (Array.isArray(item)) {
            result += total(item);
          } else {
            result += item;
          }
        }
        return result;
      }

      const boxes = [1, [2, 3], [[4]], 5];
      console.log(total(boxes));
      `,
    ),
    tests: [
      { name: 'the boxes', expectedOutput: '15' },
      {
        name: 'empty, deep and deeper',
        expectedOutput: '0 7 10',
        hidden: true,
        harness: {
          python: 'print(total([]), total([[[[7]]]]), total([1, [2, [3, [4]]]]))',
          javascript: 'console.log(total([]), total([[[[7]]]]), total([1, [2, [3, [4]]]]));',
        },
      },
    ],
    takeaway: 'Ask "what kind of thing is this?" and handle each kind: a plain value is the base case, a nested list means "recurse". Nested loops only reach as deep as you write them; recursion reaches any depth.',
  },
  {
    id: 'recursive-data-3',
    conceptId: 'recursive-data',
    title: 'Cave Explorer',
    role: 'integrate',
    game: 'grid-quest',
    mode: 'guided',
    prompt: "The cave **branches**, and every branch might hide a gem. A loop can't easily come back from a dead end, but recursion can: each call explores one spot, and returning takes the robot back.\n\nWrite `explore()`:\n1. collect a gem if you're on one;\n2. face left, then check **left, ahead, right** in turn: for each open way, step in, `explore()` from there, step back, and face the same way again;\n3. turn right to face the next way.\n\nWhen `explore()` finishes, the robot faces back the way it came. Three different caves, one program.",
    reinforces: ['custom-commands', 'loops', 'conditionals', 'booleans', 'functions', 'recursion'],
    hints: [
      `Step in, explore, step back: after the inner \`explore()\` the robot faces back toward where it came from, so one \`move()\` takes it back, and ${lang('`turn_around()`', '`turnAround()`')} faces the branch again.`,
      lang(
        'The three checks are a loop: `turn_left()` once, then `for i in range(3):` check `if not is_blocked():` and finish each round with `turn_right()`.',
        'The three checks are a loop: `turnLeft()` once, then `for (let i = 0; i < 3; i++)` check `if (!isBlocked())` and finish each round with `turnRight()`.',
      ),
      'The base case is hidden: in a dead end all three ways are blocked, so the function just turns and returns.',
    ],
    grid: grid(`
      #########
      #G..#..G#
      ###.#.###
      #G....#G#
      ###.###.#
      ###^....#
      #########
    `),
    extraGrids: [
      grid(`
        ########
        #G.....#
        ####.#.#
        #G...#G#
        ####^###
        ########
      `),
      grid(`
        #######
        ###v###
        #.....#
        #.#.#G#
        #G#.###
        ###G###
        #######
      `),
    ],
    starterCode: withRobotHelpers(
      `
      def explore():
          # 1. Grab a gem if you're standing on one.
          # 2. Face left, then check three ways: left, ahead, right.
          #    Open way? Step in, explore() from there, step back, face that way again.
          # 3. Turn right to face the next way.
          pass

      explore()
      `,
      `
      function explore() {
        // 1. Grab a gem if you're standing on one.
        // 2. Face left, then check three ways: left, ahead, right.
        //    Open way? Step in, explore() from there, step back, face that way again.
        // 3. Turn right to face the next way.
      }

      explore();
      `,
    ),
    solution: withRobotHelpers(
      `
      def explore():
          if on_gem():
              collect()
          turn_left()
          for i in range(3):
              if not is_blocked():
                  move()
                  explore()
                  move()
                  turn_around()
              turn_right()

      explore()
      `,
      `
      function explore() {
        if (onGem()) {
          collect();
        }
        turnLeft();
        for (let i = 0; i < 3; i++) {
          if (!isBlocked()) {
            move();
            explore();
            move();
            turnAround();
          }
          turnRight();
        }
      }

      explore();
      `,
    ),
    requirements: {
      python: [
        { pattern: '\\bwhile\\b', forbid: true, message: 'No `while` loops: let `explore()` call itself.' },
        { pattern: '(move\\(\\)[\\s\\S]*){3}', forbid: true, message: 'Two `move()`s are enough: one to step in, one to step back.' },
        { pattern: 'def\\s+explore\\(\\)[\\s\\S]*\\n\\s+explore\\(\\)', message: '`explore()` must call itself to explore each branch.' },
      ],
      javascript: [
        { pattern: '\\bwhile\\b', forbid: true, message: 'No `while` loops: let `explore()` call itself.' },
        { pattern: '(move\\(\\)[\\s\\S]*){3}', forbid: true, message: 'Two `move()`s are enough: one to step in, one to step back.' },
        { pattern: 'function\\s+explore\\(\\)[\\s\\S]*\\n\\s+explore\\(\\)', message: '`explore()` must call itself to explore each branch.' },
      ],
    },
    takeaway: "This is **depth-first search**: go as deep as you can down one branch, back up, try the next. The call stack remembers the way home: every waiting `explore()` is a junction you will come back to. It works here because the cave has no loops; on a map with loops you'd also need to mark visited spots, which is what the boss's `revealed` flag does.",
  },
  {
    id: 'recursive-data-4',
    conceptId: 'recursive-data',
    title: 'Folder Sizes',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: `A disk is a ${lang('dictionary', 'object')}: a **file** maps to its size, a **folder** maps to another ${lang('dictionary', 'object')}. Commands arrive until \`done\`:\n- \`total\` prints \`Total: 162\` (every file at every depth)\n- \`find NAME\` prints \`Found: /games/saves/slot2\` or \`Not found: NAME\`\n\nWrite \`size(folder)\` and \`find(folder, name, path)\`. \`find\` **returns** the path, or ${lang('`None`', '`null`')} when the name isn't there: a deliberate "no answer" value.`,
    reinforces: ['maps', 'iterating-collections', 'conditionals', 'while-loops', 'input', 'string-formatting', 'recursion'],
    hints: [
      lang(
        'A folder is a value that `isinstance(value, dict)`. For a folder, add `size(value)`; for a file, add the number.',
        'A folder is a value with `typeof value === "object"`. For a folder, add `size(value)`; for a file, add the number.',
      ),
      "In `find`, build each name's path as `path + \"/\" + key`. If the key is the name, return that path. If it's a folder, search inside it and return what you found, **if** you found something.",
      lang(
        'Check a result with `if found is not None:`. Return `None` only after the whole loop.',
        'Check a result with `if (found !== null)`. Return `null` only after the whole loop.',
      ),
    ],
    starterCode: withDisk(
      `
      def size(folder):
          # Files add their number; folders add the size of everything inside.
          return 0

      def find(folder, name, path):
          # Return the path to name, or None if it isn't anywhere inside.
          return None
      `,
      `
      function size(folder) {
        // Files add their number; folders add the size of everything inside.
        return 0;
      }

      function find(folder, name, path) {
        // Return the path to name, or null if it isn't anywhere inside.
        return null;
      }
      `,
    ),
    solution: withDisk(
      `
      def size(folder):
          total = 0
          for key in folder:
              value = folder[key]
              if isinstance(value, dict):
                  total += size(value)
              else:
                  total += value
          return total

      def find(folder, name, path):
          for key in folder:
              here = path + "/" + key
              if key == name:
                  return here
              if isinstance(folder[key], dict):
                  found = find(folder[key], name, here)
                  if found is not None:
                      return found
          return None
      `,
      `
      function size(folder) {
        let total = 0;
        for (const key in folder) {
          const value = folder[key];
          if (typeof value === "object") {
            total += size(value);
          } else {
            total += value;
          }
        }
        return total;
      }

      function find(folder, name, path) {
        for (const key in folder) {
          const here = path + "/" + key;
          if (key === name) {
            return here;
          }
          if (typeof folder[key] === "object") {
            const found = find(folder[key], name, here);
            if (found !== null) {
              return found;
            }
          }
        }
        return null;
      }
      `,
    ),
    tests: [
      {
        name: 'total and find',
        input: 'total\nfind slot2\nfind music\nfind cat.png\ndone',
        expectedOutput: 'Total: 162\nFound: /games/saves/slot2\nFound: /music\nNot found: cat.png',
      },
      {
        name: 'another disk',
        input: 'done',
        expectedOutput: { python: '7 /a/b/c True', javascript: '7 /a/b/c true' },
        hidden: true,
        harness: code(
          `
          _d = {"a": {"b": {"c": 5}}, "d": 2}
          print(size(_d), find(_d, "c", ""), find(_d, "zz", "") is None)
          `,
          `
          const _d = { a: { b: { c: 5 } }, d: 2 };
          console.log(size(_d), find(_d, "c", ""), find(_d, "zz", "") === null);
          `,
        ),
      },
      {
        name: 'empty folders',
        input: 'done',
        expectedOutput: '0 /x/y',
        hidden: true,
        harness: {
          python: 'print(size({"x": {"y": {}}}), find({"x": {"y": {}}}, "y", ""))',
          javascript: 'console.log(size({ x: { y: {} } }), find({ x: { y: {} } }, "y", ""));',
        },
      },
    ],
    takeaway: lang(
      '`None` means "no answer", on purpose. Return it when a search comes up empty, and check it with `is None` / `is not None`. Recursion fits folders because a folder is "files, plus more folders": the same shape at every depth.',
      '`null` means "no answer", on purpose (unlike `undefined`, which usually means you forgot something). Return it when a search comes up empty, and check it with `=== null`. Careful: `typeof null` is also `"object"`, so never store `null` inside the disk. Recursion fits folders because a folder is "files, plus more folders": the same shape at every depth.',
    ),
  },
  {
    id: 'recursive-data-5',
    conceptId: 'recursive-data',
    title: 'Paint Bucket',
    role: 'challenge',
    game: 'build-it',
    mode: 'freeform',
    prompt: 'The paint-bucket tool fills a whole area with a new character. Input: `ROW COL CHAR`. Fill every cell connected to (ROW, COL) **up, down, left or right** that has the same character as the starting cell, then print the picture.\n\nFor `0 0 o`:\n\n```\noo#.....\noo#.##..\n###.#...\n....#.#.\n```\n\nIf the spot is off the picture, print `Off the picture.` instead.',
    reinforces: ['nested-loops', 'collections', 'strings', 'conditionals', 'booleans', 'input', 'type-conversion', 'recursion'],
    hints: [
      lang(
        'Strings can\'t be changed, so first turn each row into a list: `grid.append(list(row))`. Print with `"".join(row)`.',
        'Strings can\'t be changed, so first turn each row into an array: `grid.push(row.split(""))`. Print with `row.join("")`.',
      ),
      '`fill(grid, r, c, old, new)`: if (r, c) is off the grid or isn\'t `old`, stop. Otherwise paint it `new` and call `fill` on the 4 neighbours.',
      'Careful: if `old` and `new` are the same character, painting never changes anything and the recursion never ends. Check for that first.',
    ],
    starterCode: PICTURE,
    solution: withPicture(
      `
        def fill(grid, r, c, old, new):
            if r < 0 or r >= len(grid) or c < 0 or c >= len(grid[0]):
                return
            if grid[r][c] != old:
                return
            grid[r][c] = new
            fill(grid, r + 1, c, old, new)
            fill(grid, r - 1, c, old, new)
            fill(grid, r, c + 1, old, new)
            fill(grid, r, c - 1, old, new)

        grid = []
        for row in picture:
            grid.append(list(row))

        words = input().split()
        r = int(words[0])
        c = int(words[1])
        if r < 0 or r >= len(grid) or c < 0 or c >= len(grid[0]):
            print("Off the picture.")
        else:
            if grid[r][c] != words[2]:
                fill(grid, r, c, grid[r][c], words[2])
            for row in grid:
                print("".join(row))
      `,
      `
        function fill(grid, r, c, old, paint) {
          if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length) {
            return;
          }
          if (grid[r][c] !== old) {
            return;
          }
          grid[r][c] = paint;
          fill(grid, r + 1, c, old, paint);
          fill(grid, r - 1, c, old, paint);
          fill(grid, r, c + 1, old, paint);
          fill(grid, r, c - 1, old, paint);
        }

        const grid = [];
        for (const row of picture) {
          grid.push(row.split(""));
        }

        const words = prompt().split(" ");
        const r = Number(words[0]);
        const c = Number(words[1]);
        if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length) {
          console.log("Off the picture.");
        } else {
          if (grid[r][c] !== words[2]) {
            fill(grid, r, c, grid[r][c], words[2]);
          }
          for (const row of grid) {
            console.log(row.join(""));
          }
        }
      `,
    ),
    tests: [
      { name: 'top-left corner', input: '0 0 o', expectedOutput: 'oo#.....\noo#.##..\n###.#...\n....#.#.' },
      { name: 'the big area', input: '0 3 ~', expectedOutput: '..#~~~~~\n..#~##~~\n###~#~~~\n~~~~#~#~' },
      { name: 'paint the walls', input: '2 0 =', expectedOutput: '..=.....\n..=.##..\n===.#...\n....#.#.', hidden: true },
      { name: 'same colour', input: '0 0 .', expectedOutput: '..#.....\n..#.##..\n###.#...\n....#.#.', hidden: true },
      { name: 'off the picture', input: '9 9 x', expectedOutput: 'Off the picture.', hidden: true },
    ],
  },
];
