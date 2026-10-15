import type { Level } from '@codegames/shared';
import { code, grid } from '../../helpers';
import { lang } from '../../localize';
import { PARTY, compose } from './shared-a';

/** higher-order-functions levels, in play order. */
export const higherOrderFunctionsLevels: Level[] = [
  {
    id: 'higher-order-functions-1',
    conceptId: 'higher-order-functions',
    title: 'Pick One',
    role: 'intro',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: `A **conditional expression** picks one of two values in a single line: ${lang('`"yes" if ok else "no"`', '`ok ? "yes" : "no"`')}. Which output is right?`,
    reinforces: ['conditionals'],
    choices: {
      python: ['down\nHP 7: ok\n1 life', 'up\nHP 7: low\n1 lives', 'down\nHP 7: low\n1 life', 'down\nHP 7: ok\n1 lives'],
      javascript: ['down\nHP 7: ok\n1 life', 'up\nHP 7: low\n1 lives', 'down\nHP 7: low\n1 life', 'down\nHP 7: ok\n1 lives'],
    },
    hints: [
      lang('Read `A if test else B` as: "A, if the test is true; otherwise B".', 'Read `test ? A : B` as: "is the test true? then A, otherwise B".'),
      'Work out the test first (`hp == 0`, `hp < 5`, `lives == 1`), then pick the matching value.',
    ],
    code: code(
      `
      hp = 0
      status = "down" if hp == 0 else "up"
      print(status)
      hp = 7
      label = "low" if hp < 5 else "ok"
      print(f"HP {hp}: {label}")
      lives = 1
      print(f"{lives} " + ("life" if lives == 1 else "lives"))
      `,
      `
      let hp = 0;
      const status = hp === 0 ? "down" : "up";
      console.log(status);
      hp = 7;
      const label = hp < 5 ? "low" : "ok";
      console.log(\`HP \${hp}: \${label}\`);
      const lives = 1;
      console.log(\`\${lives} \` + (lives === 1 ? "life" : "lives"));
      `,
    ),
    modify: {
      prompt: 'Change **one number** so the last line prints `3 lives`.',
      expectedOutput: 'down\nHP 7: ok\n3 lives',
      solution: code(
        `
        hp = 0
        status = "down" if hp == 0 else "up"
        print(status)
        hp = 7
        label = "low" if hp < 5 else "ok"
        print(f"HP {hp}: {label}")
        lives = 3
        print(f"{lives} " + ("life" if lives == 1 else "lives"))
        `,
        `
        let hp = 0;
        const status = hp === 0 ? "down" : "up";
        console.log(status);
        hp = 7;
        const label = hp < 5 ? "low" : "ok";
        console.log(\`HP \${hp}: \${label}\`);
        const lives = 3;
        console.log(\`\${lives} \` + (lives === 1 ? "life" : "lives"));
        `,
      ),
      requirements: {
        python: [{ pattern: '"life" if lives == 1 else "lives"', message: 'Keep the conditional expression: change only the number of lives.' }],
        javascript: [{ pattern: 'lives === 1 \\? "life" : "lives"', message: 'Keep the conditional expression: change only the number of lives.' }],
      },
    },
    takeaway: `A conditional expression is an if/else that **gives back a value**: ${lang('`A if test else B`', '`test ? A : B`')}. Use it for small either/or choices, like a word that depends on a number. Keep real decisions (several lines of work) in a normal if/else.`,
  },
  {
    id: 'higher-order-functions-2',
    conceptId: 'higher-order-functions',
    title: 'Line Up the Party',
    role: 'combine',
    game: 'build-it',
    mode: 'guided',
    prompt: `**Try it before you're shown how.** Complete ${lang('`strongest_first(party)`', '`strongestFirst(party)`')} so it **returns** the heroes' names, highest HP first: \`Bo, Di, Ada, Cy\`.\n\nYou already know everything you need: loops, lists, records, comparing. There's no hidden trick. Struggling a bit here is the point: the next levels show a shortcut, and it will make more sense after this.`,
    reinforces: ['nested-data', 'iterating-collections', 'while-loops', 'return-values'],
    hints: [
      'Idea: find the strongest hero left, put their name in the answer, take them out of the running, and repeat until nobody is left.',
      lang(
        'Work on a copy (`left = list(party)`) so the original list stays whole. `left.remove(best)` takes a hero out.',
        'Work on a copy (`const left = [...party];`) so the original stays whole. `left.splice(left.indexOf(best), 1)` takes a hero out.',
      ),
      lang(
        'Finding the strongest is the "best so far" pattern: `best = left[0]`, then `if hero["hp"] > best["hp"]: best = hero`.',
        'Finding the strongest is the "best so far" pattern: `let best = left[0];`, then `if (hero.hp > best.hp) { best = hero; }`.',
      ),
    ],
    starterCode: compose(
      PARTY,
      code(
        `
        def strongest_first(party):
            # Return a list of names, strongest first.
            return []

        print(strongest_first(party))
        `,
        `
        function strongestFirst(party) {
          // Return an array of names, strongest first.
          return [];
        }

        console.log(strongestFirst(party));
        `,
      ),
    ),
    solution: compose(
      PARTY,
      code(
        `
        def strongest_first(party):
            left = list(party)
            names = []
            while left:
                best = left[0]
                for hero in left:
                    if hero["hp"] > best["hp"]:
                        best = hero
                names.append(best["name"])
                left.remove(best)
            return names

        print(strongest_first(party))
        `,
        `
        function strongestFirst(party) {
          const left = [...party];
          const names = [];
          while (left.length > 0) {
            let best = left[0];
            for (const hero of left) {
              if (hero.hp > best.hp) {
                best = hero;
              }
            }
            names.push(best.name);
            left.splice(left.indexOf(best), 1);
          }
          return names;
        }

        console.log(strongestFirst(party));
        `,
      ),
    ),
    tests: [
      { name: 'the party', expectedOutput: { python: "['Bo', 'Di', 'Ada', 'Cy']", javascript: "[ 'Bo', 'Di', 'Ada', 'Cy' ]" } },
      {
        name: 'another party',
        hidden: true,
        expectedOutput: { python: "['Max', 'Lu', 'Zed']", javascript: "[ 'Max', 'Lu', 'Zed' ]" },
        harness: code(
          'print(strongest_first([{"name": "Zed", "hp": 1}, {"name": "Max", "hp": 99}, {"name": "Lu", "hp": 50}]))',
          'console.log(strongestFirst([{ name: "Zed", hp: 1 }, { name: "Max", hp: 99 }, { name: "Lu", hp: 50 }]));',
        ),
      },
      { name: 'nobody', hidden: true, expectedOutput: '[]', harness: code('print(strongest_first([]))', 'console.log(strongestFirst([]));') },
    ],
    takeaway: `You just wrote a real sorting algorithm (it's called **selection sort**; Region 6 studies it). Most of the work was telling the computer *which field to compare*. ${lang('If you tried `sorted(party)`, Python refused: it can\'t compare two dictionaries.', 'If you tried `party.sort()`, nothing useful happened: JavaScript can\'t compare two objects.')} Next: hand the "which field?" question to a function.`,
  },
  {
    id: 'higher-order-functions-3',
    conceptId: 'higher-order-functions',
    title: 'Functions Are Values',
    role: 'combine',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: 'A function\'s name **without** brackets is the function itself: a value you can store in a variable or pass to another function. With brackets, you call it. Which output is right?',
    reinforces: ['functions', 'return-values'],
    choices: {
      python: [
        "10\n12\nHI!!\n['fig', 'kiwi', 'banana']",
        "10\n6\nHI!\n['fig', 'kiwi', 'banana']",
        "10\n12\nHI!!\n['banana', 'fig', 'kiwi']",
        "double\n12\nHI!!\n['fig', 'kiwi', 'banana']",
      ],
      javascript: [
        "10\n12\nHI!!\n[ 'fig', 'kiwi', 'banana' ]",
        "10\n6\nHI!\n[ 'fig', 'kiwi', 'banana' ]",
        "10\n12\nHI!!\n[ 'banana', 'fig', 'kiwi' ]",
        "double\n12\nHI!!\n[ 'fig', 'kiwi', 'banana' ]",
      ],
    },
    hints: [
      '`action = double` doesn\'t call anything: now `action` is another name for `double`.',
      lang('`apply_twice(f, x)` returns `f(f(x))`: the function runs on its own answer.', '`applyTwice(f, x)` returns `f(f(x))`: the function runs on its own answer.'),
      lang(
        '`key=len` tells `sorted` to compare `len(word)` instead of the words themselves.',
        '`.sort(byLength)` calls `byLength(a, b)` to compare two words: a negative answer puts `a` first.',
      ),
    ],
    code: code(
      `
      def double(n):
          return n * 2

      def shout(text):
          return text.upper() + "!"

      def apply_twice(f, x):
          return f(f(x))

      action = double
      print(action(5))
      print(apply_twice(double, 3))
      print(apply_twice(shout, "hi"))
      print(sorted(["kiwi", "fig", "banana"], key=len))
      `,
      `
      function double(n) {
        return n * 2;
      }

      function shout(text) {
        return text.toUpperCase() + "!";
      }

      function applyTwice(f, x) {
        return f(f(x));
      }

      function byLength(a, b) {
        return a.length - b.length;
      }

      const action = double;
      console.log(action(5));
      console.log(applyTwice(double, 3));
      console.log(applyTwice(shout, "hi"));
      console.log(["kiwi", "fig", "banana"].sort(byLength));
      `,
    ),
    takeaway: `\`double\` is the function; \`double(3)\` is its answer. Functions that take other functions (like ${lang('`apply_twice` and `sorted(..., key=len)`', '`applyTwice` and `.sort(byLength)`')}) are called **higher-order functions**. You hand them the function **without brackets**, and they call it for you, as many times as they need.`,
  },
  {
    id: 'higher-order-functions-4',
    conceptId: 'higher-order-functions',
    title: 'Sort by Field',
    role: 'combine',
    game: 'build-it',
    mode: 'fill-blanks',
    prompt: `Remember the long loop from **Line Up the Party**? Here it is in one line. Fill the blanks so the party is ranked highest HP first, then the weakest hero is found with a tiny unnamed function: ${lang('a `lambda`', 'an arrow function `=>`')}.\n\n\`\`\`\n1. Bo (30)\n2. Di (21)\n3. Ada (12)\n4. Cy (7)\nWeakest: Cy\n\`\`\``,
    reinforces: ['nested-data', 'iterating-collections', 'string-formatting', 'functions'],
    hints: [
      lang(
        '`hp_of(hero)` returns the thing to sort by: the hero\'s `"hp"`.',
        '`byHpDown(a, b)` returns a negative number when `a` should come first. For "highest first", that\'s `b.hp - a.hp`.',
      ),
      lang(
        'Pass the function itself: `key=hp_of` (no brackets: `sorted` calls it for each hero).',
        'Pass the function itself: `.sort(byHpDown)` (no brackets: `sort` calls it for each pair).',
      ),
      lang(
        '`lambda hero: hero["hp"]` is the same as `hp_of`, written in place without a name.',
        '`(a, b) => a.hp - b.hp` is a compare function written in place without a name: lowest first.',
      ),
    ],
    starterCode: compose(
      PARTY,
      code(
        `
        def hp_of(hero):
            return ___

        ranked = sorted(party, key=___, reverse=True)
        for i, hero in enumerate(ranked):
            print(f"{i + 1}. {hero['name']} ({hero['hp']})")

        weakest = sorted(party, key=lambda hero: ___)[0]
        print(f"Weakest: {weakest['name']}")
        `,
        `
        function byHpDown(a, b) {
          return ___;
        }

        const ranked = [...party].sort(___);
        for (let i = 0; i < ranked.length; i++) {
          console.log(\`\${i + 1}. \${ranked[i].name} (\${ranked[i].hp})\`);
        }

        const weakest = [...party].sort((a, b) => ___)[0];
        console.log(\`Weakest: \${weakest.name}\`);
        `,
      ),
    ),
    solution: compose(
      PARTY,
      code(
        `
        def hp_of(hero):
            return hero["hp"]

        ranked = sorted(party, key=hp_of, reverse=True)
        for i, hero in enumerate(ranked):
            print(f"{i + 1}. {hero['name']} ({hero['hp']})")

        weakest = sorted(party, key=lambda hero: hero["hp"])[0]
        print(f"Weakest: {weakest['name']}")
        `,
        `
        function byHpDown(a, b) {
          return b.hp - a.hp;
        }

        const ranked = [...party].sort(byHpDown);
        for (let i = 0; i < ranked.length; i++) {
          console.log(\`\${i + 1}. \${ranked[i].name} (\${ranked[i].hp})\`);
        }

        const weakest = [...party].sort((a, b) => a.hp - b.hp)[0];
        console.log(\`Weakest: \${weakest.name}\`);
        `,
      ),
    ),
    tests: [{ name: 'the party', expectedOutput: '1. Bo (30)\n2. Di (21)\n3. Ada (12)\n4. Cy (7)\nWeakest: Cy' }],
    variants: [
      {
        name: 'Cy trains hard (hp 70)',
        replace: {
          python: [['{"name": "Cy", "hp": 7},', '{"name": "Cy", "hp": 70},']],
          javascript: [['{ name: "Cy", hp: 7 },', '{ name: "Cy", hp: 70 },']],
        },
        expectedOutput: '1. Cy (70)\n2. Bo (30)\n3. Di (21)\n4. Ada (12)\nWeakest: Ada',
      },
    ],
    requirements: {
      python: [
        { pattern: 'key\\s*=\\s*hp_of\\b(?!\\s*\\()', message: 'Rank with `key=hp_of`: the function itself, no brackets.' },
        { pattern: 'lambda', message: 'Find the weakest with a `lambda`.' },
      ],
      javascript: [
        { pattern: '\\.sort\\(\\s*byHpDown\\s*\\)', message: 'Rank with `.sort(byHpDown)`: the function itself, no brackets.' },
        { pattern: '=>', message: 'Find the weakest with an arrow function `(a, b) => ...`.' },
      ],
    },
    takeaway: lang(
      '`sorted(items, key=f)` calls `f` on every item and sorts by the answers; `reverse=True` flips the order. `lambda hero: hero["hp"]` is a one-line function with no name, handy when you need it only once. `sorted` returns a **new** list; the party is untouched.',
      '`.sort(compare)` calls `compare(a, b)` on pairs: negative puts `a` first, positive puts `b` first. `(a, b) => a.hp - b.hp` is an **arrow function**: a short function with no name. `.sort` changes the array **in place**, so copy first with `[...party]` when you want to keep the original order.',
    ),
  },
  {
    id: 'higher-order-functions-5',
    conceptId: 'higher-order-functions',
    title: 'Key, Not Key()',
    role: 'integrate',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: 'Scores come in as `NAME POINTS` lines until `done`. The board should show the **top 3**, most points first:\n\n```\nBo: 75\nDi: 60\nAna: 40\n```\n\nIt crashes before printing anything. Read the error carefully: which line, and what was called?',
    reinforces: ['functions', 'nested-data', 'while-loops', 'input', 'strings'],
    hints: [
      lang(
        'The error says `by_points()` is missing an argument. Who called `by_points` with empty brackets?',
        'The error says it can\'t read `points` of `undefined`. `byPoints` ran with nothing in `a` and `b`: who called it with empty brackets?',
      ),
      lang(
        '`key=by_points()` calls the function **right now**, with no player, and hands `sorted` its answer.',
        '`.sort(byPoints())` calls the function **right now**, with no players, and hands `sort` its answer.',
      ),
      lang('Hand `sorted` the function itself: `key=by_points`.', 'Hand `sort` the function itself: `.sort(byPoints)`.'),
    ],
    starterCode: code(
      `
      def by_points(player):
          return player["points"]

      players = []
      while True:
          line = input()
          if line == "done":
              break
          name, points = line.split()
          players.append({"name": name, "points": int(points)})

      ranked = sorted(players, key=by_points(), reverse=True)
      for player in ranked[:3]:
          print(f"{player['name']}: {player['points']}")
      `,
      `
      function byPoints(a, b) {
        return b.points - a.points;
      }

      const players = [];
      while (true) {
        const line = prompt();
        if (line === "done") {
          break;
        }
        const [name, points] = line.split(" ");
        players.push({ name: name, points: Number(points) });
      }

      const ranked = [...players].sort(byPoints());
      for (const player of ranked.slice(0, 3)) {
        console.log(\`\${player.name}: \${player.points}\`);
      }
      `,
    ),
    solution: code(
      `
      def by_points(player):
          return player["points"]

      players = []
      while True:
          line = input()
          if line == "done":
              break
          name, points = line.split()
          players.append({"name": name, "points": int(points)})

      ranked = sorted(players, key=by_points, reverse=True)
      for player in ranked[:3]:
          print(f"{player['name']}: {player['points']}")
      `,
      `
      function byPoints(a, b) {
        return b.points - a.points;
      }

      const players = [];
      while (true) {
        const line = prompt();
        if (line === "done") {
          break;
        }
        const [name, points] = line.split(" ");
        players.push({ name: name, points: Number(points) });
      }

      const ranked = [...players].sort(byPoints);
      for (const player of ranked.slice(0, 3)) {
        console.log(\`\${player.name}: \${player.points}\`);
      }
      `,
    ),
    tests: [
      { name: 'four players', input: 'Ana 40\nBo 75\nCy 12\nDi 60\ndone', expectedOutput: 'Bo: 75\nDi: 60\nAna: 40' },
      { name: 'only two players', input: 'Zed 5\nMax 9\ndone', expectedOutput: 'Max: 9\nZed: 5', hidden: true },
    ],
    takeaway: 'This is the most common higher-order-function bug. `f` is the function; `f()` runs it **now** and gives you its answer. When another function will do the calling (`sorted`, `sort`, a button, a timer), hand it `f`.',
  },
  {
    id: 'higher-order-functions-6',
    conceptId: 'higher-order-functions',
    title: 'Command Table',
    role: 'integrate',
    game: 'grid-quest',
    mode: 'guided',
    prompt: `Back in **Secret Directions** you decoded a route string with an if/else-if chain. Now build a **command table**: a ${lang('dictionary', 'object')} whose values are robot functions, \`M\` → move, \`L\` → turn left, \`R\` → turn right, \`G\` → collect. Then look up each letter and call what you find.\n\nNo \`if\` allowed, and you may not call \`move()\` yourself: the table does it. We'll test another route on another map.`,
    reinforces: ['maps', 'strings', 'iterating-collections', 'custom-commands', 'loops'],
    hints: [
      lang('Store functions without brackets: `actions = {"M": move, "L": turn_left, ...}`.', 'Store functions without brackets: `const actions = { M: move, L: turnLeft, ... };`.'),
      lang('`actions[letter]` is a function. Add `()` to call it: `actions[letter]()`.', '`actions[letter]` is a function. Add `()` to call it: `actions[letter]();`.'),
      lang(
        '`R` needs your own `turn_right()`: three left turns in a loop. Define it **above** the table.',
        '`R` needs your own `turnRight()`: three left turns in a loop. Define it **above** the table.',
      ),
    ],
    grid: grid(`
      #######
      #>.G###
      ###.###
      ###.G##
      #######
    `),
    starterCode: code(
      `
      route = "MMGRMMLMG"

      # 1. Teach the robot to turn right (three lefts).

      # 2. Build the command table: each letter maps to a function.
      #    Store the function itself: write move, not move().

      # 3. Loop over the route: look up each letter and call what you find.
      `,
      `
      const route = "MMGRMMLMG";

      // 1. Teach the robot to turn right (three lefts).

      // 2. Build the command table: each letter maps to a function.
      //    Store the function itself: write move, not move().

      // 3. Loop over the route: look up each letter and call what you find.
      `,
    ),
    solution: code(
      `
      route = "MMGRMMLMG"

      def turn_right():
          for i in range(3):
              turn_left()

      actions = {"M": move, "L": turn_left, "R": turn_right, "G": collect}

      for letter in route:
          actions[letter]()
      `,
      `
      const route = "MMGRMMLMG";

      function turnRight() {
        for (let i = 0; i < 3; i++) {
          turnLeft();
        }
      }

      const actions = { M: move, L: turnLeft, R: turnRight, G: collect };

      for (const letter of route) {
        actions[letter]();
      }
      `,
    ),
    routeVariants: [
      {
        name: 'route MLMMRMG',
        replace: {
          python: [['route = "MMGRMMLMG"', 'route = "MLMMRMG"']],
          javascript: [['const route = "MMGRMMLMG";', 'const route = "MLMMRMG";']],
        },
        grid: grid(`
          ######
          ##.G##
          ##.###
          #>.###
          ######
        `),
      },
    ],
    requirements: {
      python: [
        { pattern: '\\b(if|elif|match)\\b', forbid: true, message: 'No `if` this time: let the table choose.' },
        { pattern: '\\bmove\\s*\\(', forbid: true, message: 'Don\'t call `move()` yourself: put `move` in the table.' },
        { pattern: '\\[\\s*\\w+\\s*\\]\\s*\\(\\s*\\)', message: 'Look up the letter in your table and call it: `actions[letter]()`.' },
      ],
      javascript: [
        { pattern: '\\b(if|switch)\\b', forbid: true, message: 'No `if` this time: let the table choose.' },
        { pattern: '\\bmove\\s*\\(', forbid: true, message: 'Don\'t call `move()` yourself: put `move` in the table.' },
        { pattern: '\\[\\s*\\w+\\s*\\]\\s*\\(\\s*\\)', message: 'Look up the letter in your table and call it: `actions[letter]()`.' },
      ],
    },
    takeaway: 'A **dispatch table** maps names to functions. It replaces a long if/else-if chain, and a new command is one more entry instead of one more branch. The boss uses one for its commands.',
  },
];
