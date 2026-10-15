import type { Level } from '@codegames/shared';
import { code } from '../../helpers';
import { lang } from '../../localize';

/** sets levels, in play order. */
export const setsLevels: Level[] = [
  {
    id: 'sets-1',
    conceptId: 'sets',
    title: 'Unique Visitors',
    role: 'intro',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: `A **set** is a bag of values where each value appears only **once**. Five visits, but how many different visitors? Predict the output.`,
    reinforces: ['iterating-collections'],
    hints: [
      'Adding a value that is already in the set does nothing at all.',
      'ana, bo, ana, cy, bo: only 3 different names.',
      lang('`sorted(seen)` turns the set into a sorted **list**, printed with `[ ]`.', '`[...seen]` turns the set into an array, and `.sort()` puts it in order.'),
    ],
    code: code(
      `
      visitors = ["ana", "bo", "ana", "cy", "bo"]
      seen = set()
      for v in visitors:
          seen.add(v)
      print(len(visitors), len(seen))
      print("cy" in seen)
      seen.add("ana")
      print(len(seen))
      print(sorted(seen))
      `,
      `
      const visitors = ["ana", "bo", "ana", "cy", "bo"];
      const seen = new Set();
      for (const v of visitors) {
        seen.add(v);
      }
      console.log(visitors.length, seen.size);
      console.log(seen.has("cy"));
      seen.add("ana");
      console.log(seen.size);
      console.log([...seen].sort());
      `,
    ),
    takeaway: lang(
      'A set keeps each value once and answers `in` instantly. `set()` makes an empty one and `.add(x)` adds to it. Sets have no order, so sort them to print: `sorted(s)`.',
      'A set keeps each value once and answers `.has(x)` instantly. `new Set()` makes an empty one, `.add(x)` adds to it, and `.size` counts it. `[...seen]` turns a set into an array.',
    ),
  },
  {
    id: 'sets-2',
    conceptId: 'sets',
    title: 'Empty Braces',
    role: 'combine',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: 'Count all the words in a line, and how many **different** words there are (capitals don\'t count as different). It crashes on the very first word. Fix it, and keep using a set.',
    reinforces: ['strings', 'iterating-collections', 'input', 'string-formatting'],
    hints: [
      lang('Read the error: `\'dict\' object has no attribute \'add\'`. What does `{}` make?', 'Read the error: `seen.add is not a function`. What does `{}` make?'),
      lang('`{}` is an empty **dictionary**, not an empty set.', '`{}` is an empty **object**, not an empty set.'),
      lang('Write `seen = set()`.', 'Write `const seen = new Set();`.'),
    ],
    starterCode: code(
      `
      words = input().lower().split()
      seen = {}
      for w in words:
          seen.add(w)
      print(f"Words: {len(words)}")
      print(f"Different: {len(seen)}")
      `,
      `
      const words = prompt().toLowerCase().split(" ");
      const seen = {};
      for (const w of words) {
        seen.add(w);
      }
      console.log(\`Words: \${words.length}\`);
      console.log(\`Different: \${seen.size}\`);
      `,
    ),
    solution: code(
      `
      words = input().lower().split()
      seen = set()
      for w in words:
          seen.add(w)
      print(f"Words: {len(words)}")
      print(f"Different: {len(seen)}")
      `,
      `
      const words = prompt().toLowerCase().split(" ");
      const seen = new Set();
      for (const w of words) {
        seen.add(w);
      }
      console.log(\`Words: \${words.length}\`);
      console.log(\`Different: \${seen.size}\`);
      `,
    ),
    requirements: {
      python: [
        { pattern: 'set\\(', message: 'Keep using a set: make it with `set()`.' },
        { pattern: '\\.add\\(|set\\(\\s*[a-z_]\\w*', message: 'Put the words into the set (`.add(word)`, or `set(words)`): the set ignores repeats for you.' },
      ],
      javascript: [
        { pattern: 'new\\s+Set\\(', message: 'Keep using a set: make it with `new Set()`.' },
        { pattern: '\\.add\\(|new\\s+Set\\(\\s*[a-z_$]\\w*', message: 'Put the words into the set (`.add(word)`, or `new Set(words)`): the set ignores repeats for you.' },
      ],
    },
    tests: [
      { name: 'eight words', input: 'the cat and the hat and the bat', expectedOutput: 'Words: 8\nDifferent: 5' },
      { name: 'capitals', input: 'The the THE', expectedOutput: 'Words: 3\nDifferent: 1', hidden: true },
    ],
    takeaway: lang(
      '`{}` is an empty **dictionary**. An empty set is written `set()`. (`{"a", "b"}` with values inside *is* a set; only the empty braces are a dictionary.)',
      '`{}` is an empty **object**, in every situation. A set is always `new Set()`.',
    ),
  },
  {
    id: 'sets-3',
    conceptId: 'sets',
    title: 'Common Ground',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: `Two lines of favourite games, comma-separated, any capitals. Write:\n\n- ${lang('`to_set(line)`', '`toSet(line)`')}: **returns** a set of the games, trimmed and lower-case.\n- \`common(a, b)\`: **returns** a sorted ${lang('list', 'array')} of the games in both sets.\n\nThen print \`Both like: …\` (or \`Nothing in common\`) and how many of the first person's games the second doesn't like. For \`chess, Minecraft, tag\` and \`minecraft, chess, uno\`:\n\n\`\`\`\nBoth like: chess, minecraft\nOnly me: 1\n\`\`\`\n\nHidden tests call your functions directly. Write the loop yourself!`,
    reinforces: ['functions', 'return-values', 'strings', 'iterating-collections', 'conditionals', 'input', 'string-formatting'],
    hints: [
      lang('`to_set`: split the line at `","`, and `.add(part.strip().lower())` each part to a `set()`.', '`toSet`: split the line at `","`, and `.add(part.trim().toLowerCase())` each part to a `new Set()`.'),
      lang('`common`: loop over `a`, and `append` every game that is `in b`. Return `sorted(both)`.', '`common`: loop over `a` with `for...of`, and `push` every game that `b.has(...)`. Return `both.sort()`.'),
      lang('Only me = `len(mine) - len(shared)`.', 'Only me = `mine.size - shared.length`.'),
    ],
    starterCode: code(
      `
      def to_set(line):
          # split at commas; add each game, trimmed and lower-case
          return set()

      def common(a, b):
          # return a sorted list of the games in both a and b
          return []

      # read two lines, then print "Both like: ..." (or "Nothing in common") and "Only me: N"
      `,
      `
      function toSet(line) {
        // split at commas; add each game, trimmed and lower-case
        return new Set();
      }

      function common(a, b) {
        // return a sorted array of the games in both a and b
        return [];
      }

      // read two lines, then print "Both like: ..." (or "Nothing in common") and "Only me: N"
      `,
    ),
    solution: code(
      `
      def to_set(line):
          result = set()
          for part in line.split(","):
              result.add(part.strip().lower())
          return result

      def common(a, b):
          both = []
          for x in a:
              if x in b:
                  both.append(x)
          return sorted(both)

      mine = to_set(input())
      yours = to_set(input())
      shared = common(mine, yours)
      if len(shared) == 0:
          print("Nothing in common")
      else:
          print("Both like: " + ", ".join(shared))
      print(f"Only me: {len(mine) - len(shared)}")
      `,
      `
      function toSet(line) {
        const result = new Set();
        for (const part of line.split(",")) {
          result.add(part.trim().toLowerCase());
        }
        return result;
      }

      function common(a, b) {
        const both = [];
        for (const x of a) {
          if (b.has(x)) {
            both.push(x);
          }
        }
        return both.sort();
      }

      const mine = toSet(prompt());
      const yours = toSet(prompt());
      const shared = common(mine, yours);
      if (shared.length === 0) {
        console.log("Nothing in common");
      } else {
        console.log("Both like: " + shared.join(", "));
      }
      console.log(\`Only me: \${mine.size - shared.length}\`);
      `,
    ),
    requirements: {
      python: [{ pattern: '&|\\.intersection\\(', forbid: true, message: 'Find the shared games with your own loop this time (no `&` or `.intersection`).' }],
      javascript: [{ pattern: '\\.intersection\\(', forbid: true, message: 'Find the shared games with your own loop this time (no `.intersection`).' }],
    },
    tests: [
      { name: 'two in common', input: 'chess, Minecraft, tag\nminecraft, chess, uno', expectedOutput: 'Both like: chess, minecraft\nOnly me: 1' },
      { name: 'nothing in common', input: 'tag\nuno', expectedOutput: 'Nothing in common\nOnly me: 1', hidden: true },
      {
        name: 'common() returns a sorted list',
        input: 'a\nb',
        expectedOutput: { python: "['b']", javascript: "[ 'b' ]" },
        harness: { python: 'print(common({"a", "b"}, {"b", "c"}))', javascript: 'console.log(common(new Set(["a", "b"]), new Set(["b", "c"])));' },
        hidden: true,
      },
      {
        name: 'to_set() trims and lowercases',
        input: 'a\nb',
        expectedOutput: { python: "['tag', 'uno']", javascript: "[ 'tag', 'uno' ]" },
        harness: { python: 'print(sorted(to_set(" Uno,TAG ")))', javascript: 'console.log([...toSet(" Uno,TAG ")].sort());' },
        hidden: true,
      },
    ],
    takeaway: lang(
      'Checking `x in b` on a set is instant, however big the set is. Python can do the whole job in one step: `a & b` gives the values in both sets. Now you know what it does inside.',
      'Checking `b.has(x)` on a set is instant, however big the set is. Newer JavaScript can do the whole job in one step with `a.intersection(b)`. Now you know what it does inside.',
    ),
  },
];
