import type { Level } from '@codegames/shared';
import { code } from '../../helpers';
import { lang } from '../../localize';

/** hashing levels, in play order. */
export const hashingLevels: Level[] = [
  {
    id: 'hashing-1',
    conceptId: 'hashing',
    title: 'Seen It Before?',
    role: 'intro',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: 'Two ways to find the first repeated number. The first compares every pair; the second remembers what it has **seen** in a set. Both count how many times they look at a number. Which output is right?',
    reinforces: ['sets', 'nested-loops', 'loop-control'],
    choices: {
      python: ['Pairs: 7 after 9 checks\nSet: 7 after 5 checks', 'Pairs: 7 after 5 checks\nSet: 7 after 9 checks', 'Pairs: 7 after 10 checks\nSet: 7 after 10 checks', 'Pairs: 7 after 9 checks\nSet: 7 after 4 checks'],
      javascript: ['Pairs: 7 after 9 checks\nSet: 7 after 5 checks', 'Pairs: 7 after 5 checks\nSet: 7 after 9 checks', 'Pairs: 7 after 10 checks\nSet: 7 after 10 checks', 'Pairs: 7 after 9 checks\nSet: 7 after 4 checks'],
    },
    hints: [
      'Pairs: index 0 (the 3) is compared with the 4 numbers after it, index 1 (the 1) with the 3 after it. That is 7 checks with no match yet.',
      'Then index 2 (the first 7) is compared with 5 (check 8) and with the last 7 (check 9): a match, so both loops stop at 9.',
      'The set version counts one check per number: 3, 1, 7, 5 are new; the fifth number is the repeat, so it stops at 5.',
    ],
    code: code(
      `
      numbers = [3, 1, 7, 5, 7]

      checks = 0
      found = None
      for i in range(len(numbers)):
          for j in range(i + 1, len(numbers)):
              checks += 1
              if numbers[i] == numbers[j]:
                  found = numbers[i]
                  break
          if found is not None:
              break
      print(f"Pairs: {found} after {checks} checks")

      checks = 0
      seen = set()
      for n in numbers:
          checks += 1
          if n in seen:
              found = n
              break
          seen.add(n)
      print(f"Set: {found} after {checks} checks")
      `,
      `
      const numbers = [3, 1, 7, 5, 7];

      let checks = 0;
      let found = null;
      for (let i = 0; i < numbers.length; i++) {
        for (let j = i + 1; j < numbers.length; j++) {
          checks += 1;
          if (numbers[i] === numbers[j]) {
            found = numbers[i];
            break;
          }
        }
        if (found !== null) {
          break;
        }
      }
      console.log(\`Pairs: \${found} after \${checks} checks\`);

      checks = 0;
      const seen = new Set();
      for (const n of numbers) {
        checks += 1;
        if (seen.has(n)) {
          found = n;
          break;
        }
        seen.add(n);
      }
      console.log(\`Set: \${found} after \${checks} checks\`);
      `,
    ),
    investigate: [
      { question: 'Why is `n in seen` fast even when the set is huge?', choices: ['A set hashes the value to find its slot directly, instead of scanning', 'The set is always sorted', 'Sets can only hold a few items'], answer: 0 },
      { question: 'With 1,000 numbers and no repeat, roughly how many checks does each version make?', choices: ['Pairs: about 500,000; Set: 1,000', 'Both about 1,000', 'Pairs: 1,000; Set: 500,000'], answer: 0 },
    ],
    takeaway: 'A **hash set** (and a dictionary/map) answers "have I seen this?" in **O(1)** on average, by turning the value into a number (its *hash*) that says where to look. Trading a little memory for a set turns many O(n²) "compare everything to everything" loops into O(n). It is the single most useful speed-up you will ever learn.',
  },
  {
    id: 'hashing-2',
    conceptId: 'hashing',
    title: 'Pair That Sums',
    role: 'combine',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: 'Given numbers and a target, this should print the **first** pair of two *different* entries that adds up to the target, remembering earlier numbers in a set: `2 7 11 15` with target `9` → `2 + 7 = 9`, and `4 1 5` with target `8` → `No pair`.\n\nInstead, `4 1 5` prints `4 + 4 = 8`: it used the same 4 twice. Two lines are in the wrong order. Fix it.',
    reinforces: ['sets', 'loops', 'conditionals', 'input', 'type-conversion', 'string-formatting'],
    hints: [
      'For each `n`, the partner we want is `target - n`. Is it checked **before** or **after** `n` itself is added to `seen`?',
      'Adding `n` first means `n` is already in the set when its own partner is looked up, so any `n` equal to half the target pairs with itself.',
      'Check `partner in seen` first, then add `n`. Two equal entries (`3 3`, target 6) still pair up, because the first 3 is in the set by the time the second arrives.',
    ],
    starterCode: code(
      `
      numbers = list(map(int, input().split()))
      target = int(input())

      seen = set()
      found = False
      for n in numbers:
          partner = target - n
          seen.add(n)
          if partner in seen and not found:
              print(f"{partner} + {n} = {target}")
              found = True
      if not found:
          print("No pair")
      `,
      `
      const numbers = prompt().split(" ").map(Number);
      const target = Number(prompt());

      const seen = new Set();
      let found = false;
      for (const n of numbers) {
        const partner = target - n;
        seen.add(n);
        if (seen.has(partner) && !found) {
          console.log(\`\${partner} + \${n} = \${target}\`);
          found = true;
        }
      }
      if (!found) {
        console.log("No pair");
      }
      `,
    ),
    solution: code(
      `
      numbers = list(map(int, input().split()))
      target = int(input())

      seen = set()
      found = False
      for n in numbers:
          partner = target - n
          if partner in seen and not found:
              print(f"{partner} + {n} = {target}")
              found = True
          seen.add(n)
      if not found:
          print("No pair")
      `,
      `
      const numbers = prompt().split(" ").map(Number);
      const target = Number(prompt());

      const seen = new Set();
      let found = false;
      for (const n of numbers) {
        const partner = target - n;
        if (seen.has(partner) && !found) {
          console.log(\`\${partner} + \${n} = \${target}\`);
          found = true;
        }
        seen.add(n);
      }
      if (!found) {
        console.log("No pair");
      }
      `,
    ),
    tests: [
      { name: 'classic', input: '2 7 11 15\n9', expectedOutput: '2 + 7 = 9' },
      { name: 'a number must not pair with itself', input: '4 1 5\n8', expectedOutput: 'No pair' },
      { name: 'two equal numbers may pair', input: '3 3\n6', expectedOutput: '3 + 3 = 6', hidden: true },
      { name: 'later pair', input: '1 2 3 4 5\n9', expectedOutput: '4 + 5 = 9', hidden: true },
    ],
    takeaway: 'The "two sum" pattern: for each item, ask the set for its **complement**, then add the item. The order matters because the set must hold only items that came *before*. With a dictionary instead of a set you can also remember a value for each key, like each player\'s score in the boss.',
  },
  {
    id: 'hashing-3',
    conceptId: 'hashing',
    title: 'Anagram Groups',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: `Read words until \`done\` and group the **anagrams** (same letters, any order). Print each group on one line in the order its first word appeared, words in input order:\n\n\`\`\`\neat tea ate\ntan nat\nbat\n\`\`\`\n\nWrite ${lang('`signature(word)`', '`signature(word)`')}, which **returns** a key that is the same for all anagrams of a word (hint: the letters in sorted order, joined into a string), and use a dictionary from signature to list of words. Comparing every word against every other word is not allowed: no nested loops over the words.`,
    reinforces: ['maps', 'map-patterns', 'functions', 'return-values', 'strings', 'collections', 'iterating-collections', 'input', 'loop-control'],
    hints: [
      lang('`signature`: `return "".join(sorted(word))`. Sorting the letters is fine here; it is the words we must not compare pairwise.', '`signature`: `return word.split("").sort().join("")`. Sorting the letters is fine here; it is the words we must not compare pairwise.'),
      lang('Use `groups = {}`; for each word, `key = signature(word)`; `if key not in groups: groups[key] = []`; then append.', 'Use `const groups = {}`; for each word, `const key = signature(word)`; `if (!Object.hasOwn(groups, key)) groups[key] = []`; then push.'),
      lang('Dictionaries keep insertion order, so `for words in groups.values(): print(" ".join(words))` prints groups in first-seen order.', 'Objects keep insertion order for text keys, so `for (const words of Object.values(groups)) console.log(words.join(" "))` prints groups in first-seen order.'),
    ],
    requirements: {
      python: [{ pattern: 'for\\s+\\w+\\s+in\\s+(\\w+)\\s*:\\s*\\n\\s+for\\s+\\w+\\s+in\\s+\\1\\b', forbid: true, message: 'Do not compare every word with every other word: group them by signature.' }],
      javascript: [{ pattern: 'for\\s*\\([^)]*\\bof\\s+(\\w+)\\)\\s*\\{\\s*for\\s*\\([^)]*\\bof\\s+\\1\\)', forbid: true, message: 'Do not compare every word with every other word: group them by signature.' }],
    },
    starterCode: code(
      `
      def signature(word):
          # The same key for every anagram of word.
          pass

      groups = {}
      # Read words until "done", add each to its group, then print the groups.
      `,
      `
      function signature(word) {
        // The same key for every anagram of word.
      }

      const groups = {};
      // Read words until "done", add each to its group, then print the groups.
      `,
    ),
    solution: code(
      `
      def signature(word):
          return "".join(sorted(word))

      groups = {}
      while True:
          word = input()
          if word == "done":
              break
          key = signature(word)
          if key not in groups:
              groups[key] = []
          groups[key].append(word)

      for words in groups.values():
          print(" ".join(words))
      `,
      `
      function signature(word) {
        return word.split("").sort().join("");
      }

      const groups = {};
      while (true) {
        const word = prompt();
        if (word === "done") {
          break;
        }
        const key = signature(word);
        if (!Object.hasOwn(groups, key)) {
          groups[key] = [];
        }
        groups[key].push(word);
      }

      for (const words of Object.values(groups)) {
        console.log(words.join(" "));
      }
      `,
    ),
    tests: [
      { name: 'classic groups', input: 'eat\ntea\ntan\nate\nnat\nbat\ndone', expectedOutput: 'eat tea ate\ntan nat\nbat' },
      { name: 'no anagrams at all', input: 'sun\nmoon\ndone', expectedOutput: 'sun\nmoon', hidden: true },
      { name: 'repeated word stays in its group', input: 'abc\ncab\nabc\ndone', expectedOutput: 'abc cab abc', hidden: true },
      {
        name: 'signature on its own',
        input: 'done',
        hidden: true,
        expectedOutput: 'aelpp aelpp',
        harness: code('print(signature("apple"), signature("papel"))', 'console.log(signature("apple"), signature("papel"));'),
      },
    ],
    takeaway: 'Grouping by a **signature** is hashing at its best: compute a key that is equal exactly when two things "count as the same", then let the dictionary do the matching. The work is O(n · k log k) for n words of length k, instead of O(n²) pairwise comparisons. Picking the right key is the design decision; the dictionary does the rest.',
  },
];
