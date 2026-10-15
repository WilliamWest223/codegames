import type { Level } from '@codegames/shared';
import { code, same } from '../../helpers';
import { lang } from '../../localize';

/** map-filter-reduce levels, in play order. */
export const mapFilterReduceLevels: Level[] = [
  {
    id: 'map-filter-reduce-1',
    conceptId: 'map-filter-reduce',
    title: 'Transform and Keep',
    role: 'intro',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: `Two of the most common list jobs, each in one line: **transform** every item, and **keep** only some items. ${lang('Python writes both as *list comprehensions*: `[expression for item in list if test]`.', 'JavaScript arrays have methods for both: `.map(f)` transforms and `.filter(f)` keeps.')} Which output is right?`,
    reinforces: ['iterating-collections'],
    choices: {
      python: [
        '[8, 20, 14, 4]\n[4, 2]\n[4, 10, 7, 2]',
        '[8, 20, 14, 4]\n[4, 2]\n[8, 20, 14, 4]',
        '[8, 20, 14, 4]\n[10, 7]\n[4, 10, 7, 2]',
        '[8, 20, 14, 4]\n[True, False, False, True]\n[4, 10, 7, 2]',
      ],
      javascript: [
        '[ 8, 20, 14, 4 ]\n[ 4, 2 ]\n[ 4, 10, 7, 2 ]',
        '[ 8, 20, 14, 4 ]\n[ 4, 2 ]\n[ 8, 20, 14, 4 ]',
        '[ 8, 20, 14, 4 ]\n[ 10, 7 ]\n[ 4, 10, 7, 2 ]',
        '[ 8, 20, 14, 4 ]\n[ true, false, false, true ]\n[ 4, 10, 7, 2 ]',
      ],
    },
    hints: [
      lang('`[p * 2 for p in prices]` builds a **new** list with each price doubled.', '`prices.map((p) => p * 2)` builds a **new** array with each price doubled.'),
      lang('`[p for p in prices if p < 5]` keeps the prices where the test is true.', '`prices.filter((p) => p < 5)` keeps the prices where the arrow function returns true.'),
      'Did anything change `prices` itself?',
    ],
    code: code(
      `
      prices = [4, 10, 7, 2]
      doubled = [p * 2 for p in prices]
      cheap = [p for p in prices if p < 5]
      print(doubled)
      print(cheap)
      print(prices)
      `,
      `
      const prices = [4, 10, 7, 2];
      const doubled = prices.map((p) => p * 2);
      const cheap = prices.filter((p) => p < 5);
      console.log(doubled);
      console.log(cheap);
      console.log(prices);
      `,
    ),
    takeaway: lang(
      'A list comprehension builds a **new** list: `[f(x) for x in items]` transforms, `[x for x in items if test]` keeps. The original list is untouched. It\'s the same loop you\'ve written many times (make an empty list, loop, `append`), in one line.',
      '`.map(f)` makes a **new** array of `f(item)` for every item; `.filter(f)` makes a new array of the items where `f(item)` is true. The original array is untouched. It\'s the same loop you\'ve written many times (make an empty array, loop, `push`), in one line.',
    ),
  },
  {
    id: 'map-filter-reduce-2',
    conceptId: 'map-filter-reduce',
    title: 'Who Passed?',
    role: 'combine',
    game: 'parsons',
    mode: 'parsons',
    prompt: 'Arrange the lines so the program prints the names of everyone who scored **50 or more**: `Ana, Cy, Di`. Keep first, then transform. **Two lines are traps.**',
    reinforces: ['nested-data', 'functions', 'strings'],
    hints: [
      'First keep the students who passed, **then** turn those records into names.',
      '`passed` comes from `students`; `names` comes from `passed`.',
      lang('`", ".join(names)` glues the names together. Lists don\'t have a `.join` method.', '`names.join(", ")` glues the names together.'),
    ],
    solution: code(
      `
      def passing_names(students):
          passed = [s for s in students if s["score"] >= 50]
          names = [s["name"] for s in passed]
          return ", ".join(names)

      students = [{"name": "Ana", "score": 72}, {"name": "Bo", "score": 45}, {"name": "Cy", "score": 90}, {"name": "Di", "score": 50}]
      print(passing_names(students))
      `,
      `
      function passingNames(students) {
        const passed = students.filter((s) => s.score >= 50);
        const names = passed.map((s) => s.name);
        return names.join(", ");
      }

      const students = [{ name: "Ana", score: 72 }, { name: "Bo", score: 45 }, { name: "Cy", score: 90 }, { name: "Di", score: 50 }];
      console.log(passingNames(students));
      `,
    ),
    distractors: {
      python: ['    passed = [s for s in students if s["score"] > 50]', '    return names.join(", ")'],
      javascript: ['  const passed = students.filter((s) => s.score > 50);', '  return ", ".join(names);'],
    },
    tests: [
      { name: 'the class', expectedOutput: 'Ana, Cy, Di' },
      {
        name: 'another class',
        hidden: true,
        expectedOutput: 'Max',
        harness: code(
          'print(passing_names([{"name": "Zed", "score": 49}, {"name": "Max", "score": 100}]))',
          'console.log(passingNames([{ name: "Zed", score: 49 }, { name: "Max", score: 100 }]));',
        ),
      },
    ],
    takeaway: lang(
      'Chaining steps (keep, then transform, then join) is called a **pipeline**. Each step makes a new list from the one before, so you can read it top to bottom like a recipe.',
      'Chaining steps (`.filter`, then `.map`, then `.join`) is called a **pipeline**. Each step makes a new array from the one before. You can even write it as one chain: `students.filter(...).map(...).join(", ")`.',
    ),
  },
  {
    id: 'map-filter-reduce-3',
    conceptId: 'map-filter-reduce',
    title: 'Add It All Up',
    role: 'combine',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: `The third big list job is **combining** all the items into one answer: a total, a best item, a yes/no. ${lang('Python has ready-made combiners: `sum`, `max(..., key=...)`, `any` and `all`.', 'JavaScript\'s general combiner is `.reduce`: it walks the array carrying one value along. `.some` asks "is any item true?".')} Predict every line.`,
    reinforces: ['nested-data', 'iterating-collections', 'higher-order-functions'],
    hints: [
      'Each line costs `price * qty`. Add both lines up.',
      lang(
        '`max(cart, key=...)` returns the **whole record** with the biggest `qty`; print its `"item"`.',
        '`.reduce((best, line) => ...)` keeps whichever line has more `qty` so far, starting from the first line.',
      ),
      lang('`any(...)` is True if at least one line passes the test.', '`.some(...)` is true if at least one line passes the test.'),
    ],
    code: code(
      `
      cart = [{"item": "pen", "price": 2, "qty": 3}, {"item": "pad", "price": 5, "qty": 1}]
      total = sum(line["price"] * line["qty"] for line in cart)
      print(total)
      most = max(cart, key=lambda line: line["qty"])
      print(most["item"])
      print(any(line["price"] > 4 for line in cart))
      `,
      `
      const cart = [{ item: "pen", price: 2, qty: 3 }, { item: "pad", price: 5, qty: 1 }];
      const total = cart.reduce((sum, line) => sum + line.price * line.qty, 0);
      console.log(total);
      const most = cart.reduce((best, line) => (line.qty > best.qty ? line : best));
      console.log(most.item);
      console.log(cart.some((line) => line.price > 4));
      `,
    ),
    modify: {
      prompt: lang(
        'Change only the last line so it asks whether **every** line has a `qty` above 1 (use `all`).',
        'Change only the last line so it asks whether **every** line has a `qty` above 1 (use `.every`).',
      ),
      expectedOutput: { python: '11\npen\nFalse', javascript: '11\npen\nfalse' },
      solution: code(
        `
        cart = [{"item": "pen", "price": 2, "qty": 3}, {"item": "pad", "price": 5, "qty": 1}]
        total = sum(line["price"] * line["qty"] for line in cart)
        print(total)
        most = max(cart, key=lambda line: line["qty"])
        print(most["item"])
        print(all(line["qty"] > 1 for line in cart))
        `,
        `
        const cart = [{ item: "pen", price: 2, qty: 3 }, { item: "pad", price: 5, qty: 1 }];
        const total = cart.reduce((sum, line) => sum + line.price * line.qty, 0);
        console.log(total);
        const most = cart.reduce((best, line) => (line.qty > best.qty ? line : best));
        console.log(most.item);
        console.log(cart.every((line) => line.qty > 1));
        `,
      ),
      requirements: {
        python: [{ pattern: '\\ball\\(', message: 'Ask about **every** line with `all(...)`.' }],
        javascript: [{ pattern: '\\.every\\(', message: 'Ask about **every** line with `.every(...)`.' }],
      },
    },
    takeaway: lang(
      '`sum(...)`, `max(..., key=...)`, `min`, `any` and `all` each squash a whole list into one answer. Inside the brackets, `line["price"] * line["qty"] for line in cart` is a comprehension without the `[ ]`: it hands the values over one at a time. (Python also has `functools.reduce`, but these built-ins cover almost every real case.)',
      '`.reduce((acc, item) => ..., start)` walks the array carrying one value (`acc`) along: each step returns the new `acc`. With no start value, it starts from the first item. `.some` and `.every` are ready-made yes/no reducers.',
    ),
  },
  {
    id: 'map-filter-reduce-4',
    conceptId: 'map-filter-reduce',
    title: 'Gradebook',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: `The first input line holds the whole class: \`Ada:91,Bo:78,Cy:45,Di:88\`. The second is the honor-roll cutoff. Print:\n\n\`\`\`\nClass average: 75.5\nHonor roll: Ada, Di\nCurved: Ada 96, Bo 83, Cy 50, Di 93\n\`\`\`\n\nWrite these functions, **without any loop statements** (${lang('use comprehensions', 'use `.map`, `.filter` and `.reduce`')}):\n- \`parse(line)\` returns a list of records \`{name, score}\`\n- \`average(records)\` returns the mean score\n- ${lang('`honor_roll(records, cutoff)`', '`honorRoll(records, cutoff)`')} returns the **names** scoring at least the cutoff, in alphabetical order\n- \`curve(records, bonus)\` returns **new** records with the bonus added (never above 100), leaving the originals unchanged`,
    reinforces: ['strings', 'type-conversion', 'nested-data', 'return-values', 'string-formatting', 'input', 'higher-order-functions'],
    hints: [
      lang(
        '`parse`: `line.split(",")` gives `"Ada:91"` pieces. A helper `to_record(piece)` can split one piece at `":"`; then `[to_record(p) for p in line.split(",")]`.',
        '`parse`: `line.split(",")` gives `"Ada:91"` pieces. A helper `toRecord(piece)` can split one piece at `":"`; then `line.split(",").map(toRecord)`.',
      ),
      lang(
        '`honor_roll`: keep with `if r["score"] >= cutoff`, take the names, then `sorted(...)`.',
        '`honorRoll`: `.filter` the records, `.map` to names, then `.sort()`.',
      ),
      lang(
        '`curve`: make a new dict per record: `{"name": r["name"], "score": min(100, r["score"] + bonus)}`.',
        '`curve`: make a new object per record: `({ name: r.name, score: Math.min(100, r.score + bonus) })`. The `( )` around `{ }` tells JS it\'s an object, not a function body.',
      ),
      lang(
        '`average`: `sum(r["score"] for r in records) / len(records)`. Print with `:.1f`.',
        '`average`: `records.reduce((total, r) => total + r.score, 0) / records.length`. Print with `.toFixed(1)`.',
      ),
    ],
    starterCode: code(
      `
      def parse(line):
          # Split the line into "name:score" pieces, and turn each into a record.
          return []

      def average(records):
          return 0

      def honor_roll(records, cutoff):
          # Keep the high scores, take their names, sort them.
          return []

      def curve(records, bonus):
          # Build NEW records: don't change the old ones.
          return []

      records = parse(input())
      cutoff = int(input())
      print(f"Class average: {average(records):.1f}")
      print("Honor roll: " + ", ".join(honor_roll(records, cutoff)))
      curved = curve(records, 5)
      print("Curved: " + ", ".join(f"{r['name']} {r['score']}" for r in curved))
      `,
      `
      function parse(line) {
        // Split the line into "name:score" pieces, and turn each into a record.
        return [];
      }

      function average(records) {
        return 0;
      }

      function honorRoll(records, cutoff) {
        // Keep the high scores, take their names, sort them.
        return [];
      }

      function curve(records, bonus) {
        // Build NEW records: don't change the old ones.
        return [];
      }

      const records = parse(prompt());
      const cutoff = Number(prompt());
      console.log(\`Class average: \${average(records).toFixed(1)}\`);
      console.log("Honor roll: " + honorRoll(records, cutoff).join(", "));
      const curved = curve(records, 5);
      console.log("Curved: " + curved.map((r) => \`\${r.name} \${r.score}\`).join(", "));
      `,
    ),
    solution: code(
      `
      def to_record(piece):
          name, score = piece.split(":")
          return {"name": name, "score": int(score)}

      def parse(line):
          return [to_record(piece) for piece in line.split(",")]

      def average(records):
          return sum(r["score"] for r in records) / len(records)

      def honor_roll(records, cutoff):
          return sorted([r["name"] for r in records if r["score"] >= cutoff])

      def curve(records, bonus):
          return [{"name": r["name"], "score": min(100, r["score"] + bonus)} for r in records]

      records = parse(input())
      cutoff = int(input())
      print(f"Class average: {average(records):.1f}")
      print("Honor roll: " + ", ".join(honor_roll(records, cutoff)))
      curved = curve(records, 5)
      print("Curved: " + ", ".join(f"{r['name']} {r['score']}" for r in curved))
      `,
      `
      function toRecord(piece) {
        const [name, score] = piece.split(":");
        return { name: name, score: Number(score) };
      }

      function parse(line) {
        return line.split(",").map(toRecord);
      }

      function average(records) {
        return records.reduce((total, r) => total + r.score, 0) / records.length;
      }

      function honorRoll(records, cutoff) {
        return records.filter((r) => r.score >= cutoff).map((r) => r.name).sort();
      }

      function curve(records, bonus) {
        return records.map((r) => ({ name: r.name, score: Math.min(100, r.score + bonus) }));
      }

      const records = parse(prompt());
      const cutoff = Number(prompt());
      console.log(\`Class average: \${average(records).toFixed(1)}\`);
      console.log("Honor roll: " + honorRoll(records, cutoff).join(", "));
      const curved = curve(records, 5);
      console.log("Curved: " + curved.map((r) => \`\${r.name} \${r.score}\`).join(", "));
      `,
    ),
    tests: [
      { name: 'the class', input: 'Ada:91,Bo:78,Cy:45,Di:88\n80', expectedOutput: 'Class average: 75.5\nHonor roll: Ada, Di\nCurved: Ada 96, Bo 83, Cy 50, Di 93' },
      { name: 'a perfect score stays at 100', input: 'Zoe:98,Al:60\n90', expectedOutput: 'Class average: 79.0\nHonor roll: Zoe\nCurved: Zoe 100, Al 65' },
      {
        name: 'honor roll is alphabetical',
        input: 'Ada:1\n1',
        hidden: true,
        expectedOutput: { python: "['Bea', 'Zoe']", javascript: "[ 'Bea', 'Zoe' ]" },
        harness: code('print(honor_roll(parse("Zoe:80,Al:79,Bea:100"), 80))', 'console.log(honorRoll(parse("Zoe:80,Al:79,Bea:100"), 80));'),
      },
      {
        name: 'curve leaves the originals alone',
        input: 'Ada:1\n1',
        hidden: true,
        expectedOutput: '98 100',
        harness: code(
          `
          _r = parse("A:98")
          _c = curve(_r, 5)
          print(_r[0]["score"], _c[0]["score"])
          `,
          `
          const _r = parse("A:98");
          const _c = curve(_r, 5);
          console.log(_r[0].score, _c[0].score);
          `,
        ),
      },
    ],
    requirements: {
      python: [
        { pattern: '^\\s*(for|while)\\b', forbid: true, message: 'No loop statements this time: use comprehensions like `[... for r in records if ...]`.' },
        { pattern: '\\.append\\(', forbid: true, message: 'No `append` this time: build each list with a comprehension.' },
        { pattern: '\\[.*\\bfor\\b.*\\bif\\b', message: 'Use a comprehension with a filter: `[... for r in records if ...]`.' },
      ],
      javascript: [
        { pattern: '\\b(for|while)\\s*\\(', forbid: true, message: 'No loop statements this time: use `.map`, `.filter` and `.reduce`.' },
        { pattern: '\\.push\\(', forbid: true, message: 'No `push` this time: `.map` and `.filter` build the arrays for you.' },
        { pattern: '\\.filter\\(', message: 'Keep the high scores with `.filter`.' },
        { pattern: '\\.reduce\\(', message: 'Add up the scores with `.reduce`.' },
      ],
    },
  },
  {
    id: 'map-filter-reduce-5',
    conceptId: 'map-filter-reduce',
    title: 'Season Leaderboard',
    role: 'challenge',
    game: 'build-it',
    mode: 'freeform',
    prompt: 'Match results arrive as `NAME POINTS` lines (the same player appears many times; points can be negative) until `done`. Print how many different players there were, then the **top 3** by total points: most points first, and **alphabetical** when totals tie. Players whose total is 0 or less don\'t make the board.\n\n```\nPlayers: 4\n1. Ana 7\n2. Bo 7\n3. Cy 7\n```\n\nUse any tools you like. The neat solutions combine a counting dictionary, a filter, and a sort with a smart key.',
    reinforces: ['map-patterns', 'input', 'while-loops', 'loop-control', 'strings', 'string-formatting', 'higher-order-functions'],
    hints: [
      lang(
        'Total the points with the Count pattern: `totals[name] = totals.get(name, 0) + points`.',
        'Total the points with the Count pattern: `totals[name] = (totals[name] ?? 0) + points`.',
      ),
      lang(
        'A key can return a **tuple**: `key=lambda name: (-totals[name], name)` sorts by most points first (the minus flips it), then by name.',
        'A compare function can break ties: `totals[b] - totals[a] || (a < b ? -1 : 1)`. When the first part is 0 (a tie), `||` moves on to the names.',
      ),
      lang(
        'Slice the top three with `ranked[:3]`; `enumerate` gives the place numbers.',
        'Slice the top three with `.slice(0, 3)`; `forEach((name, i) => ...)` gives the place numbers.',
      ),
    ],
    starterCode: same(''),
    solution: code(
      `
      totals = {}
      while True:
          line = input()
          if line == "done":
              break
          name, points = line.split()
          totals[name] = totals.get(name, 0) + int(points)

      scored = [name for name in totals if totals[name] > 0]
      ranked = sorted(scored, key=lambda name: (-totals[name], name))
      print(f"Players: {len(totals)}")
      for i, name in enumerate(ranked[:3]):
          print(f"{i + 1}. {name} {totals[name]}")
      `,
      `
      const totals = {};
      while (true) {
        const line = prompt();
        if (line === "done") {
          break;
        }
        const [name, points] = line.split(" ");
        totals[name] = (totals[name] ?? 0) + Number(points);
      }

      const scored = Object.keys(totals).filter((name) => totals[name] > 0);
      const ranked = scored.sort((a, b) => totals[b] - totals[a] || (a < b ? -1 : 1));
      console.log(\`Players: \${Object.keys(totals).length}\`);
      ranked.slice(0, 3).forEach((name, i) => {
        console.log(\`\${i + 1}. \${name} \${totals[name]}\`);
      });
      `,
    ),
    tests: [
      { name: 'a three-way tie', input: 'Ana 3\nBo 5\nAna 4\nCy 7\nDi 0\nBo 2\ndone', expectedOutput: 'Players: 4\n1. Ana 7\n2. Bo 7\n3. Cy 7' },
      { name: 'a comeback', input: 'Max 10\nLu 3\nMax -4\nZed 6\ndone', expectedOutput: 'Players: 3\n1. Max 6\n2. Zed 6\n3. Lu 3' },
      { name: 'below zero is off the board', input: 'Neg -2\nPos 1\ndone', expectedOutput: 'Players: 2\n1. Pos 1', hidden: true },
      { name: 'more than three', input: 'A 1\nB 2\nC 3\nD 4\nE 5\ndone', expectedOutput: 'Players: 5\n1. E 5\n2. D 4\n3. C 3', hidden: true },
    ],
  },
];
