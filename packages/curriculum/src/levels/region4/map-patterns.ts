import type { Level } from '@codegames/shared';
import { code } from '../../helpers';
import { lang } from '../../localize';

/** map-patterns levels, in play order. */
export const mapPatternsLevels: Level[] = [
  {
    id: 'map-patterns-1',
    conceptId: 'map-patterns',
    title: 'Vote Counter',
    role: 'intro',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: `The most useful thing ${lang('a dictionary', 'an object')} does: **counting**. Trace the votes, then predict the output. ${lang('', '(You can type object keys with or without quotes.)')}`,
    reinforces: ['iterating-collections'],
    hints: [
      'The first time an animal shows up it isn\'t a key yet, so it starts at 1. Every later vote adds 1.',
      'Keys stay in the order they were **first added**: cat, then dog, then fish.',
      lang('`for animal in counts:` hands you each **key**; `counts[animal]` is its count.', '`for (const animal in counts)` hands you each **key**; `counts[animal]` is its count.'),
    ],
    code: code(
      `
      votes = ["cat", "dog", "cat", "fish", "cat", "dog"]
      counts = {}
      for v in votes:
          if v in counts:
              counts[v] += 1
          else:
              counts[v] = 1
      print(counts)
      for animal in counts:
          print(animal, counts[animal])
      `,
      `
      const votes = ["cat", "dog", "cat", "fish", "cat", "dog"];
      const counts = {};
      for (const v of votes) {
        if (v in counts) {
          counts[v] += 1;
        } else {
          counts[v] = 1;
        }
      }
      console.log(counts);
      for (const animal in counts) {
        console.log(animal, counts[animal]);
      }
      `,
    ),
    takeaway: lang(
      'The counting pattern: the first time you see something → 1, after that → +1. Looping over a dictionary gives you its **keys**, in the order they were added.',
      'The counting pattern: the first time you see something → 1, after that → +1. Looping over an object with `for...in` gives you its **keys**, in the order they were added (except number-like keys such as `"2"`, which JavaScript puts first, in numeric order). `for...in` is made for objects; on arrays use `for...of`.',
    ),
  },
  {
    id: 'map-patterns-2',
    conceptId: 'map-patterns',
    title: 'Count Crash',
    role: 'combine',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: `This should count how many times each word appears in a line of text. ${lang('It crashes on the very first word.', 'It runs, but every count comes out as `NaN`.')} Fix the counting line.`,
    reinforces: ['strings', 'iterating-collections', 'input'],
    hints: [
      lang('The first time you see "the", there is no `counts["the"]` yet. What is there to add 1 to?', 'The first time you see "the", `counts["the"]` is `undefined`. What is `undefined + 1`?'),
      'Use the count so far if there is one, or 0 if there isn\'t, then add 1.',
      lang('`counts[w] = counts.get(w, 0) + 1`', '`counts[w] = (counts[w] ?? 0) + 1;`'),
    ],
    starterCode: code(
      `
      words = input().split()
      counts = {}
      for w in words:
          counts[w] += 1
      for w in counts:
          print(w, counts[w])
      `,
      `
      const words = prompt().split(" ");
      const counts = {};
      for (const w of words) {
        counts[w] += 1;
      }
      for (const w in counts) {
        console.log(w, counts[w]);
      }
      `,
    ),
    solution: code(
      `
      words = input().split()
      counts = {}
      for w in words:
          counts[w] = counts.get(w, 0) + 1
      for w in counts:
          print(w, counts[w])
      `,
      `
      const words = prompt().split(" ");
      const counts = {};
      for (const w of words) {
        counts[w] = (counts[w] ?? 0) + 1;
      }
      for (const w in counts) {
        console.log(w, counts[w]);
      }
      `,
    ),
    tests: [
      { name: 'the cat the hat the end', input: 'the cat the hat the end', expectedOutput: 'the 3\ncat 1\nhat 1\nend 1' },
      { name: 'one word, three times', input: 'go go go', expectedOutput: 'go 3', hidden: true },
    ],
    takeaway: lang(
      '`+= 1` only works on a key that already exists. `counts.get(w, 0) + 1` counts in one line: "what I had so far, or 0, plus one". (The if/else from Vote Counter works too.)',
      '`undefined + 1` is `NaN`, and JavaScript won\'t warn you. `(counts[w] ?? 0) + 1` counts in one line: "what I had so far, or 0, plus one". (The if/else from Vote Counter works too.) One trap: every object secretly inherits a few keys, so `"constructor" in {}` is `true`. When the keys come from a user, `Object.hasOwn(obj, key)` checks only the keys you added.',
    ),
  },
  {
    id: 'map-patterns-3',
    conceptId: 'map-patterns',
    title: 'Group by Letter',
    role: 'combine',
    game: 'build-it',
    mode: 'fill-blanks',
    prompt: `Counting stores a number under each key. **Grouping** stores a whole ${lang('list', 'array')}. Fill in the blanks so words are grouped by their first letter:\n\n\`\`\`\na: apple, avocado\nb: bear, banana\nc: cat\n\`\`\`\n\nNew: ${lang('`groups.items()` hands you each key **and** its value, like `enumerate` does.', '`Object.entries(groups)` hands you each `[key, value]` pair, so you can unpack both.')} We'll test another word list too.`,
    reinforces: ['collections', 'iterating-collections', 'strings-basics'],
    hints: [
      `The first blank: the first time a letter shows up, what should its group start as? An empty ${lang('list', 'array')}.`,
      `Make the empty ${lang('list', 'array')} only **inside** the \`if\`: if you made it every round, each group would only keep its last word.`,
      lang('`groups[first] = []` and `groups.items()`.', '`groups[first] = [];` and `Object.entries(groups)`.'),
    ],
    starterCode: code(
      `
      words = ["apple", "bear", "avocado", "cat", "banana"]
      groups = {}
      for w in words:
          first = w[0]
          if first not in groups:
              groups[first] = ___
          groups[first].append(w)
      for letter, group in groups.___():
          print(letter + ": " + ", ".join(group))
      `,
      `
      const words = ["apple", "bear", "avocado", "cat", "banana"];
      const groups = {};
      for (const w of words) {
        const first = w[0];
        if (!(first in groups)) {
          groups[first] = ___;
        }
        groups[first].push(w);
      }
      for (const [letter, group] of ___(groups)) {
        console.log(letter + ": " + group.join(", "));
      }
      `,
    ),
    solution: code(
      `
      words = ["apple", "bear", "avocado", "cat", "banana"]
      groups = {}
      for w in words:
          first = w[0]
          if first not in groups:
              groups[first] = []
          groups[first].append(w)
      for letter, group in groups.items():
          print(letter + ": " + ", ".join(group))
      `,
      `
      const words = ["apple", "bear", "avocado", "cat", "banana"];
      const groups = {};
      for (const w of words) {
        const first = w[0];
        if (!(first in groups)) {
          groups[first] = [];
        }
        groups[first].push(w);
      }
      for (const [letter, group] of Object.entries(groups)) {
        console.log(letter + ": " + group.join(", "));
      }
      `,
    ),
    tests: [{ name: 'grouped by first letter', expectedOutput: 'a: apple, avocado\nb: bear, banana\nc: cat' }],
    variants: [
      {
        name: 'another word list',
        replace: {
          python: [['words = ["apple", "bear", "avocado", "cat", "banana"]', 'words = ["kiwi", "lime", "kale", "lemon", "mango", "leek"]']],
          javascript: [['const words = ["apple", "bear", "avocado", "cat", "banana"];', 'const words = ["kiwi", "lime", "kale", "lemon", "mango", "leek"];']],
        },
        expectedOutput: 'k: kiwi, kale\nl: lime, lemon, leek\nm: mango',
      },
    ],
    takeaway: lang(
      'The grouping pattern: first time → an empty list, every time → append. `d.items()` gives you `key, value` pairs, and `", ".join(group)` glues a list of strings together.',
      'The grouping pattern: first time → an empty array, every time → push. `Object.entries(obj)` gives you `[key, value]` pairs, and `group.join(", ")` glues an array of strings together. Careful with `!(first in groups)`: without the brackets, `!first in groups` means `(!first) in groups`.',
    ),
  },
  {
    id: 'map-patterns-4',
    conceptId: 'map-patterns',
    title: 'Word Frequency',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: `Read one line of text. Write two functions:\n\n- \`clean(text)\` **returns** the text in lower case with no \`.\`, \`,\`, \`!\` or \`?\`.\n- ${lang('`count_words(text)`', '`countWords(text)`')} cleans the text and **returns** ${lang('a dictionary', 'an object')} of word counts.\n\nThen print how many different words there are and the most common one (the first one wins a tie). For \`The cat saw the dog. The dog ran!\`:\n\n\`\`\`\nDifferent words: 5\nMost common: the (3)\n\`\`\`\n\nHidden tests call your functions directly.`,
    reinforces: ['maps', 'functions', 'return-values', 'strings', 'iterating-collections', 'conditionals', 'string-formatting', 'input'],
    hints: [
      'Clean **before** you count, or `dog.` and `dog` count as two different words.',
      lang('`clean`: start with `""` and add each character of `text.lower()` that is `not in ".,!?"`.', '`clean`: start with `""` and add each character of `text.toLowerCase()` that `".,!?".includes(...)` says is **not** punctuation.'),
      lang('`count_words`: the Count Crash pattern, `counts[w] = counts.get(w, 0) + 1`, over `clean(text).split()`.', '`countWords`: the Count Crash pattern, `counts[w] = (counts[w] ?? 0) + 1;`, over `clean(text).split(" ")`. Skip empty words `""`.'),
      lang('Most common: "best so far". Loop over `counts.items()` and keep the word whose count beats `counts[top]`.', 'Most common: "best so far". Loop over `Object.entries(counts)` and keep the word whose count beats `counts[top]`.'),
    ],
    starterCode: code(
      `
      def clean(text):
          # lower case, and leave out . , ! ?
          return text

      def count_words(text):
          # return a dictionary: word -> how many times it appears
          return {}

      # read a line, count its words, then print:
      # Different words: 5
      # Most common: the (3)
      `,
      `
      function clean(text) {
        // lower case, and leave out . , ! ?
        return text;
      }

      function countWords(text) {
        // return an object: word -> how many times it appears
        return {};
      }

      // read a line, count its words, then print:
      // Different words: 5
      // Most common: the (3)
      `,
    ),
    solution: code(
      `
      def clean(text):
          result = ""
          for ch in text.lower():
              if ch not in ".,!?":
                  result += ch
          return result

      def count_words(text):
          counts = {}
          for w in clean(text).split():
              counts[w] = counts.get(w, 0) + 1
          return counts

      counts = count_words(input())
      top = ""
      for word, n in counts.items():
          if top == "" or n > counts[top]:
              top = word
      print(f"Different words: {len(counts)}")
      print(f"Most common: {top} ({counts[top]})")
      `,
      `
      function clean(text) {
        let result = "";
        for (const ch of text.toLowerCase()) {
          if (!".,!?".includes(ch)) {
            result += ch;
          }
        }
        return result;
      }

      function countWords(text) {
        const counts = {};
        for (const w of clean(text).split(" ")) {
          if (w !== "") {
            counts[w] = (counts[w] ?? 0) + 1;
          }
        }
        return counts;
      }

      const counts = countWords(prompt());
      let top = "";
      for (const [word, n] of Object.entries(counts)) {
        if (top === "" || n > counts[top]) {
          top = word;
        }
      }
      console.log(\`Different words: \${Object.keys(counts).length}\`);
      console.log(\`Most common: \${top} (\${counts[top]})\`);
      `,
    ),
    requirements: {
      python: [{ pattern: 'Counter|collections', forbid: true, message: 'Count the words yourself with a dictionary: no `Counter` this time.' }],
      javascript: [{ pattern: '\\.reduce\\(', forbid: true, message: 'Count the words yourself with a loop: no `.reduce` this time.' }],
    },
    tests: [
      { name: 'a short story', input: 'The cat saw the dog. The dog ran!', expectedOutput: 'Different words: 5\nMost common: the (3)' },
      { name: 'one word', input: 'Hi!', expectedOutput: 'Different words: 1\nMost common: hi (1)', hidden: true },
      {
        name: 'counts after cleaning',
        input: 'x',
        expectedOutput: '2',
        harness: { python: 'print(count_words("A a, b!")["a"])', javascript: 'console.log(countWords("A a, b!")["a"]);' },
        hidden: true,
      },
    ],
    takeaway: `Small functions, each with one job: \`clean\` fixes the text, ${lang('`count_words`', '`countWords`')} counts it, and the main program reports. Because they **return** their results, you can test each one on its own.`,
  },
  {
    id: 'map-patterns-5',
    conceptId: 'map-patterns',
    title: 'Anagram Groups',
    role: 'challenge',
    game: 'build-it',
    mode: 'freeform',
    prompt: `**Anagrams** use the same letters: \`listen\`, \`silent\`, \`enlist\`. Read a line of words and print every group of **2 or more** anagrams, one group per line, in the order the groups were first seen. If there are none, print \`none\`.\n\nFor \`listen silent cat enlist act tac dog\`:\n\n\`\`\`\nlisten silent enlist\ncat act tac\n\`\`\`\n\nWrite \`signature(word)\`, which **returns** the word's letters in sorted order (\`signature("tac")\` is \`"act"\`): anagrams share a signature. *Optional challenge.*`,
    reinforces: ['functions', 'strings', 'collections', 'iterating-collections', 'conditionals'],
    hints: [
      'Anagrams have the same letters once sorted. Use the sorted letters as a **key**.',
      lang('`"".join(sorted(word))` sorts the letters of a word.', '`word.split("").sort().join("")` sorts the letters of a word.'),
      'Then it\'s Group by Letter with `signature(w)` instead of the first letter. At the end, print only the groups with more than one word.',
    ],
    starterCode: code(
      `
      def signature(word):
          # return the letters of word in sorted order
          return word

      # read a line of words, group them by signature, print groups of 2 or more
      `,
      `
      function signature(word) {
        // return the letters of word in sorted order
        return word;
      }

      // read a line of words, group them by signature, print groups of 2 or more
      `,
    ),
    solution: code(
      `
      def signature(word):
          return "".join(sorted(word))

      groups = {}
      for w in input().split():
          key = signature(w)
          if key not in groups:
              groups[key] = []
          groups[key].append(w)

      found = False
      for key, group in groups.items():
          if len(group) > 1:
              print(" ".join(group))
              found = True
      if not found:
          print("none")
      `,
      `
      function signature(word) {
        return word.split("").sort().join("");
      }

      const groups = {};
      for (const w of prompt().split(" ")) {
        const key = signature(w);
        if (!(key in groups)) {
          groups[key] = [];
        }
        groups[key].push(w);
      }

      let found = false;
      for (const [key, group] of Object.entries(groups)) {
        if (group.length > 1) {
          console.log(group.join(" "));
          found = true;
        }
      }
      if (!found) {
        console.log("none");
      }
      `,
    ),
    requirements: {
      python: [{ pattern: '\\{\\s*\\}|dict\\(', message: 'Group the words in a dictionary: signature → list of words.' }],
      javascript: [{ pattern: '\\{\\s*\\}|new\\s+Map\\(', message: 'Group the words in an object: signature → array of words.' }],
    },
    tests: [
      { name: 'two groups', input: 'listen silent cat enlist act tac dog', expectedOutput: 'listen silent enlist\ncat act tac' },
      { name: 'no anagrams', input: 'one two three', expectedOutput: 'none', hidden: true },
      { name: 'one pair', input: 'stop ham pots', expectedOutput: 'stop pots', hidden: true },
      {
        name: 'signature("tac")',
        input: 'x',
        expectedOutput: 'act',
        harness: { python: 'print(signature("tac"))', javascript: 'console.log(signature("tac"));' },
        hidden: true,
      },
    ],
    takeaway: 'Choosing the right **key** is the whole trick: the sorted letters turn "are these anagrams?" into a simple lookup. (Later, in hashing, you\'ll see why lookups by key are so fast.)',
  },
];
