import type { Level } from '@codegames/shared';
import { code, grid } from '../../helpers';
import { lang } from '../../localize';

/** strings levels, in play order. */
export const stringsLevels: Level[] = [
  {
    id: 'strings-1',
    conceptId: 'strings',
    title: 'Slice It',
    role: 'intro',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: `A string is a lot like a list of characters. A **slice** cuts out a piece: ${lang('`word[0:4]`', '`word.slice(0, 4)`')} takes the characters from index 0 **up to, but not including,** index 4. You can also ask whether a piece is **in** a string, and loop over its characters. Predict the output.`,
    reinforces: ['strings-basics', 'output'],
    hints: [
      'Write out the indexes: c=0, o=1, d=2, e=3, g=4, a=5, m=6, e=7, s=8.',
      lang('Leaving out the end, `word[4:]`, means "to the end of the string".', 'Leaving out the end, `word.slice(4)`, means "to the end of the string".'),
      `${lang('`"game" in word`', '`word.includes("game")`')} asks whether that text appears anywhere inside. And a loop over a string visits it one **character** at a time.`,
    ],
    code: code(
      `
      word = "codegames"
      print(word[0:4])
      print(word[4:])
      print(word[-1])
      print("game" in word)
      for ch in word[0:3]:
          print(ch.upper())
      `,
      `
      const word = "codegames";
      console.log(word.slice(0, 4));
      console.log(word.slice(4));
      console.log(word[word.length - 1]);
      console.log(word.includes("game"));
      for (const ch of word.slice(0, 3)) {
        console.log(ch.toUpperCase());
      }
      `,
    ),
    takeaway: lang(
      '`text[start:end]` slices from `start` up to (not including) `end`. Leave out either side to go from the beginning or to the end. `text[-1]` is the last character. `"x" in text` checks membership, and `for ch in text:` visits each character, just like a list.',
      '`text.slice(start, end)` cuts from `start` up to (not including) `end`. Leave out `end` to go to the end. `text[text.length - 1]` is the last character. `text.includes("x")` checks membership, and `for (const ch of text)` visits each character, just like an array.',
    ),
  },
  {
    id: 'strings-5',
    conceptId: 'strings',
    title: 'Secret Directions',
    role: 'combine',
    game: 'grid-quest',
    mode: 'guided',
    prompt: `The route is now squeezed into one **string**: \`M\` = move, \`L\` = turn left, \`G\` = grab. Loop over the string's characters and decode each one. Only one \`move()\` allowed, and we'll test another code on another map!`,
    reinforces: ['iterating-collections', 'else-if-chains', 'collections'],
    hints: [
      lang('A string loops just like a list: `for ch in code:` gives one character at a time.', 'A string loops just like an array: `for (const ch of code)` gives one character at a time.'),
      lang('`if ch == "M": move()`, `elif ch == "L": turn_left()`, `elif ch == "G": collect()`.', '`if (ch === "M") { move(); } else if (ch === "L") { turnLeft(); } else if (ch === "G") { collect(); }`'),
    ],
    grid: grid(`
      #######
      #v#####
      #.#####
      #G..G##
      #######
    `),
    starterCode: code(
      `
      code = "MMGLMMMG"

      # decode each character of code
      `,
      `
      const code = "MMGLMMMG";

      // decode each character of code
      `,
    ),
    solution: code(
      `
      code = "MMGLMMMG"

      for ch in code:
          if ch == "M":
              move()
          elif ch == "L":
              turn_left()
          elif ch == "G":
              collect()
      `,
      `
      const code = "MMGLMMMG";

      for (const ch of code) {
        if (ch === "M") {
          move();
        } else if (ch === "L") {
          turnLeft();
        } else if (ch === "G") {
          collect();
        }
      }
      `,
    ),
    routeVariants: [
      {
        name: 'a different code',
        replace: { python: [['code = "MMGLMMMG"', 'code = "MGLMMG"']], javascript: [['const code = "MMGLMMMG";', 'const code = "MGLMMG";']] },
        grid: grid(`
          #####
          #v###
          #G.G#
          #####
        `),
      },
    ],
    requirements: {
      python: [
        { pattern: '(move\\(\\)[\\s\\S]*){2}', forbid: true, message: 'Write `move()` only once: let the loop read the code and do each step.' },
        { pattern: '(collect\\(\\)[\\s\\S]*){2}', forbid: true, message: 'Write `collect()` only once: let the loop read the code and do each step.' },
      ],
      javascript: [
        { pattern: '(move\\(\\)[\\s\\S]*){2}', forbid: true, message: 'Write `move()` only once: let the loop read the code and do each step.' },
        { pattern: '(collect\\(\\)[\\s\\S]*){2}', forbid: true, message: 'Write `collect()` only once: let the loop read the code and do each step.' },
      ],
    },
  },
  {
    id: 'strings-2',
    conceptId: 'strings',
    title: 'Upper Doesn\'t Stick',
    role: 'combine',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: 'This should print `ADA` and then `Bat`, but it prints the names unchanged. Fix it without typing the answers.',
    reinforces: ['strings-basics', 'variables'],
    hints: [
      `${lang('`name.upper()`', '`name.toUpperCase()`')} **gives you back** a new string. It doesn't change \`name\`.`,
      'Strings can never be changed in place. Keep the new string by assigning it.',
      lang('`name = name.upper()`, and the same idea for `first`.', '`name = name.toUpperCase();`, and the same idea for `first`.'),
    ],
    starterCode: code(
      `
      name = "ada"
      name.upper()
      print(name)

      animal = "bat"
      first = animal[0]
      first.upper()
      print(first + animal[1:])
      `,
      `
      let name = "ada";
      name.toUpperCase();
      console.log(name);

      const animal = "bat";
      let first = animal[0];
      first.toUpperCase();
      console.log(first + animal.slice(1));
      `,
    ),
    solution: code(
      `
      name = "ada"
      name = name.upper()
      print(name)

      animal = "bat"
      first = animal[0]
      first = first.upper()
      print(first + animal[1:])
      `,
      `
      let name = "ada";
      name = name.toUpperCase();
      console.log(name);

      const animal = "bat";
      let first = animal[0];
      first = first.toUpperCase();
      console.log(first + animal.slice(1));
      `,
    ),
    requirements: {
      python: [
        { pattern: '"ADA"|"Bat"|"B"', forbid: true, message: 'Don\'t type the answer: make the code change the text.' },
        { pattern: 'name\\s*=\\s*name\\.upper\\(\\)', message: 'Keep the new string: `name = name.upper()`, so `name` itself holds the capitals.' },
      ],
      javascript: [
        { pattern: '"ADA"|"Bat"|"B"', forbid: true, message: 'Don\'t type the answer: make the code change the text.' },
        { pattern: 'name\\s*=\\s*name\\.toUpperCase\\(\\)', message: 'Keep the new string: `name = name.toUpperCase()`, so `name` itself holds the capitals.' },
      ],
    },
    tests: [{ name: 'shout and capitalise', expectedOutput: 'ADA\nBat' }],
    variants: [
      {
        name: 'other words',
        replace: { python: [['"ada"', '"zed"'], ['"bat"', '"owl"']], javascript: [['"ada"', '"zed"'], ['"bat"', '"owl"']] },
        expectedOutput: 'ZED\nOwl',
      },
    ],
    takeaway: `Strings are **immutable**: they can never change. Methods like ${lang('`.upper()`', '`.toUpperCase()`')} give you a **new** string, so store it. That's also why ${lang('`word[0] = "B"`', '`word[0] = "B"`')} doesn't work: build a new string instead, like ${lang('`"B" + word[1:]`', '`"B" + word.slice(1)`')}.`,
  },
  {
    id: 'strings-3',
    conceptId: 'strings',
    title: 'Word Counter',
    role: 'combine',
    game: 'build-it',
    mode: 'fill-blanks',
    prompt: `${lang('`.split()`', '`.split(" ")`')} chops a sentence into a ${lang('list', 'array')} of words. Fill in the blanks so it counts the words and finds the longest one ("best so far", like Coldest Day):\n\n\`\`\`\nWords: 4\nLongest: quick\n\`\`\``,
    reinforces: ['input', 'string-formatting', 'iterating-collections'],
    hints: [
      'The first blank is the name of the method that chops text into pieces. The second: which word is each `w` competing against?',
      lang('`sentence.split()` splits on spaces, and the comparison is with `longest`.', '`sentence.split(" ")` splits on spaces, and the comparison is with `longest`.'),
    ],
    starterCode: code(
      `
      sentence = input()
      words = sentence.___()
      print(f"Words: {len(words)}")
      longest = ""
      for w in words:
          if len(w) > len(___):
              longest = w
      print(f"Longest: {longest}")
      `,
      `
      const sentence = prompt();
      const words = sentence.___(" ");
      console.log(\`Words: \${words.length}\`);
      let longest = "";
      for (const w of words) {
        if (w.length > ___.length) {
          longest = w;
        }
      }
      console.log(\`Longest: \${longest}\`);
      `,
    ),
    solution: code(
      `
      sentence = input()
      words = sentence.split()
      print(f"Words: {len(words)}")
      longest = ""
      for w in words:
          if len(w) > len(longest):
              longest = w
      print(f"Longest: {longest}")
      `,
      `
      const sentence = prompt();
      const words = sentence.split(" ");
      console.log(\`Words: \${words.length}\`);
      let longest = "";
      for (const w of words) {
        if (w.length > longest.length) {
          longest = w;
        }
      }
      console.log(\`Longest: \${longest}\`);
      `,
    ),
    tests: [
      { name: 'the quick brown fox', input: 'the quick brown fox', expectedOutput: 'Words: 4\nLongest: quick' },
      { name: 'one word', input: 'hello', expectedOutput: 'Words: 1\nLongest: hello', hidden: true },
    ],
    takeaway: lang(
      '`text.split()` chops text at every run of spaces and gives you a list of words. `text.split(",")` chops at commas instead.',
      '`text.split(" ")` chops text at every space and gives you an array of words. Careful: two spaces in a row make an empty word `""`. `text.split(",")` chops at commas instead.',
    ),
  },
  {
    id: 'strings-4',
    conceptId: 'strings',
    title: 'Palindrome Checker',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: `A **palindrome** reads the same backwards: \`racecar\`, \`Never odd or even\`. Complete the two functions:\n\n- \`reverse(text)\` builds the reversed text **one character at a time** with a loop.\n- ${lang('`is_palindrome(text)`', '`isPalindrome(text)`')} ignores capitals and spaces, then compares the text with its reverse.\n\nThen write the main loop: read words until \`quit\`, printing:\n\n\`\`\`\nracecar: yes\nhello: no\n\`\`\``,
    reinforces: ['functions', 'return-values', 'iterating-collections', 'while-loops', 'loop-control', 'conditionals', 'input', 'string-formatting'],
    hints: [
      'To reverse, start with `""` and put each new character in **front**: `result = ch + result`.',
      lang('`text.lower().replace(" ", "")` gives you a clean version to compare.', '`text.toLowerCase().replaceAll(" ", "")` gives you a clean version to compare. (Not `replace`: in JavaScript it only changes the **first** space.)'),
      lang('`return clean == reverse(clean)`', '`return clean === reverse(clean);`'),
      'The main loop is like Ask Again: loop forever, read a word, `break` on "quit", otherwise print the verdict.',
    ],
    starterCode: code(
      `
      def reverse(text):
          # build the reversed text one character at a time
          return ""

      def is_palindrome(text):
          # ignore capitals and spaces, then compare with reverse()
          return False

      # keep reading words until "quit"; for each one print "word: yes" or "word: no"
      `,
      `
      function reverse(text) {
        // build the reversed text one character at a time
        return "";
      }

      function isPalindrome(text) {
        // ignore capitals and spaces, then compare with reverse()
        return false;
      }

      // keep reading words until "quit"; for each one print "word: yes" or "word: no"
      `,
    ),
    solution: code(
      `
      def reverse(text):
          result = ""
          for ch in text:
              result = ch + result
          return result

      def is_palindrome(text):
          clean = text.lower().replace(" ", "")
          return clean == reverse(clean)

      while True:
          word = input()
          if word == "quit":
              break
          if is_palindrome(word):
              print(f"{word}: yes")
          else:
              print(f"{word}: no")
      `,
      `
      function reverse(text) {
        let result = "";
        for (const ch of text) {
          result = ch + result;
        }
        return result;
      }

      function isPalindrome(text) {
        const clean = text.toLowerCase().replaceAll(" ", "");
        return clean === reverse(clean);
      }

      while (true) {
        const word = prompt();
        if (word === "quit") {
          break;
        }
        if (isPalindrome(word)) {
          console.log(\`\${word}: yes\`);
        } else {
          console.log(\`\${word}: no\`);
        }
      }
      `,
    ),
    requirements: {
      python: [{ pattern: '\\[\\s*:\\s*:\\s*-1\\s*\\]|reversed\\(', forbid: true, message: 'Build the reverse with your own loop (no `[::-1]` or `reversed()`).' }],
      javascript: [{ pattern: '\\.reverse\\(', forbid: true, message: 'Build the reverse with your own loop (no `.reverse()`).' }],
    },
    tests: [
      { name: 'racecar and hello', input: 'racecar\nhello\nquit', expectedOutput: 'racecar: yes\nhello: no' },
      { name: 'Level and Noon', input: 'Level\nNoon\ncode\nquit', expectedOutput: 'Level: yes\nNoon: yes\ncode: no' },
      { name: 'reverse("abc")', input: 'quit', expectedOutput: 'cba', harness: { python: 'print(reverse("abc"))', javascript: 'console.log(reverse("abc"));' }, hidden: true },
      { name: '"Never odd or even"', input: 'quit', expectedOutput: { python: 'True', javascript: 'true' }, harness: { python: 'print(is_palindrome("Never odd or even"))', javascript: 'console.log(isPalindrome("Never odd or even"));' }, hidden: true },
    ],
    takeaway: lang(
      'Building a string in a loop (`result = ch + result`) is a pattern you\'ll use again and again. Python also has a shortcut, `text[::-1]`, now you know how it works inside.',
      'Building a string in a loop (`result = ch + result`) is a pattern you\'ll use again and again. Remember: `replace` changes only the **first** match in JavaScript; `replaceAll` changes every one.',
    ),
  },
];
