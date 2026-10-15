import type { Level } from '@codegames/shared';
import { code } from '../../helpers';
import { lang } from '../../localize';
import { CAESAR, compose } from './shared';

const COMMON = code(
  `
  COMMON = ["the", "and", "is", "to", "a", "of", "at", "you", "it", "in", "me", "so"]
  `,
  `
  const COMMON = ["the", "and", "is", "to", "a", "of", "at", "you", "it", "in", "me", "so"];
  `,
);

/** ciphers levels, in play order. */
export const ciphersLevels: Level[] = [
  {
    id: 'ciphers-1',
    conceptId: 'ciphers',
    title: 'Caesar Shift',
    role: 'intro',
    game: 'parsons',
    mode: 'parsons',
    prompt: 'Julius Caesar hid messages by shifting each letter along the alphabet: with key 3, `a` → `d`, and `x` wraps round to `a`. Arrange the lines so the program prints `daa`. **Two lines are traps.**',
    reinforces: ['encoding'],
    hints: [
      lang('Turn the letter into a position 0–25 first: `ord(letter) - ord("a")`.', 'Turn the letter into a position 0–25 first: `letter.charCodeAt(0) - 97`.'),
      '`% 26` wraps positions past 25 back to the start, so `x` + 3 lands on `a`.',
      lang('Turn the position back into a letter with `chr(ord("a") + new_position)`, not `chr(new_position)` (code 3 isn\'t a letter).', 'Turn the position back into a letter with `String.fromCharCode(97 + newPosition)`, not `String.fromCharCode(newPosition)` (code 3 isn\'t a letter).'),
    ],
    solution: code(
      `
      def shift_letter(letter, key):
          position = ord(letter) - ord("a")
          new_position = (position + key) % 26
          return chr(ord("a") + new_position)

      print(shift_letter("a", 3) + shift_letter("x", 3) + shift_letter("z", 1))
      `,
      `
      function shiftLetter(letter, key) {
        const position = letter.charCodeAt(0) - 97;
        const newPosition = (position + key) % 26;
        return String.fromCharCode(97 + newPosition);
      }

      console.log(shiftLetter("a", 3) + shiftLetter("x", 3) + shiftLetter("z", 1));
      `,
    ),
    distractors: {
      python: ['new_position = position + key', 'return chr(new_position)'],
      javascript: ['const newPosition = position + key;', 'return String.fromCharCode(newPosition);'],
    },
    tests: [
      { name: 'a, x and z', expectedOutput: 'daa' },
      {
        name: 'ROT13',
        expectedOutput: 'zn',
        harness: { python: 'print(shift_letter("m", 13) + shift_letter("a", 13))', javascript: 'console.log(shiftLetter("m", 13) + shiftLetter("a", 13));' },
        hidden: true,
      },
    ],
    takeaway: 'A **cipher** turns readable text into secret text using a **key**; here the key is the shift. Letter → number → shift with wrap-around (`% 26`) → letter. This protects **confidentiality**, the "C" in the CIA triad, but only a little: it is NOT real security, and you\'ll break it yourself in two levels.',
  },
  {
    id: 'ciphers-2',
    conceptId: 'ciphers',
    title: 'Off the Alphabet',
    role: 'combine',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: `The first input line is the key, the second the text. \`caesar(text, key)\` should shift **only the letters a–z** and leave everything else alone, so decrypting is just a negative key:\n\n- key \`3\`, \`meet at noon\` → \`phhw dw qrrq\`\n- key \`-3\`, \`phhw dw qrrq\` → \`meet at noon\`\n\nBut spaces and punctuation get scrambled${lang('', ', and negative keys give junk')}. Fix it.`,
    reinforces: ['encoding'],
    hints: [
      'A space has its own code (32). Shifting it like a letter turns it into something else. Only shift when `ch` is between `"a"` and `"z"`; otherwise add it unchanged.',
      lang('Characters compare by their codes, so `ch >= "a" and ch <= "z"` means "a small letter".', 'Characters compare by their codes, so `ch >= "a" && ch <= "z"` means "a small letter".'),
      lang('Python\'s `%` always gives 0–25 here, even for negative numbers, so the wrap-around already works both ways.', 'JavaScript\'s `%` keeps the sign: `-3 % 26` is `-3`, not `23`. Wrap safely with `((n % 26) + 26) % 26`.'),
    ],
    starterCode: code(
      `
      def caesar(text, key):
          result = ""
          for ch in text:
              position = (ord(ch) - ord("a") + key) % 26
              result += chr(ord("a") + position)
          return result

      key = int(input())
      print(caesar(input(), key))
      `,
      `
      function caesar(text, key) {
        let result = "";
        for (const ch of text) {
          const position = (ch.charCodeAt(0) - 97 + key) % 26;
          result += String.fromCharCode(97 + position);
        }
        return result;
      }

      const key = Number(prompt());
      console.log(caesar(prompt(), key));
      `,
    ),
    solution: compose(
      CAESAR,
      code(
        `
        key = int(input())
        print(caesar(input(), key))
        `,
        `
        const key = Number(prompt());
        console.log(caesar(prompt(), key));
        `,
      ),
    ),
    tests: [
      { name: 'encrypt', input: '3\nmeet at noon', expectedOutput: 'phhw dw qrrq' },
      { name: 'decrypt', input: '-3\nphhw dw qrrq', expectedOutput: 'meet at noon' },
      { name: 'punctuation and digits stay', input: '1\nzoo, 2 go!', expectedOutput: 'app, 2 hp!', hidden: true },
      {
        name: 'big keys wrap',
        input: '0\nx',
        expectedOutput: 'def yza',
        harness: { python: 'print(caesar("abc", 29), caesar("bcd", -29))', javascript: 'console.log(caesar("abc", 29), caesar("bcd", -29));' },
        hidden: true,
      },
    ],
    takeaway: lang(
      'Not every character is a letter: check before you shift. Python\'s `%` wraps negative numbers for you, so decrypting is just `caesar(text, -key)`. (Caesar is still NOT real security: real systems use AES.)',
      'Not every character is a letter: check before you shift. JavaScript\'s `%` keeps the sign (`-3 % 26 === -3`), so wrap with `((n % 26) + 26) % 26` and decrypting is just `caesar(text, -key)`. (Caesar is still NOT real security: real systems use AES.)',
    ),
  },
  {
    id: 'ciphers-3',
    conceptId: 'ciphers',
    title: 'Codebreaker',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: 'You\'re the ship\'s analyst checking whether **your own** old Caesar cipher is safe. (Only ever test codes and systems you own or have permission to test.) You intercepted `tlla tl ha aol vsk tpss` but you don\'t know the key. There are only 26 keys, so **try them all**!\n\nFor each key 0–25, decrypt with `caesar(text, -key)` and **score** the result: how many of its words are in the `COMMON` list. Keep the best key (the first one, if two tie). Print:\n\n```\nKey: 7\nMessage: meet me at the old mill\n```',
    reinforces: ['encoding'],
    hints: [
      lang('`score(text)`: split into words and count those `in COMMON`.', '`score(text)`: split into words and count those where `COMMON.includes(word)`.'),
      `Best-so-far pattern: start with ${lang('`best_key = 0` and `best_score = -1`', '`bestKey = 0` and `bestScore = -1`')}; for each key, if the score **beats** the best, remember both.`,
      'Use `>` (not `>=`) so that on a tie the earlier key stays.',
    ],
    starterCode: compose(
      CAESAR,
      COMMON,
      code(
        `
        def score(text):
            # How many words of text are in COMMON?
            return 0

        secret = input()
        # Try every key from 0 to 25 and keep the best one.
        `,
        `
        function score(text) {
          // How many words of text are in COMMON?
          return 0;
        }

        const secret = prompt();
        // Try every key from 0 to 25 and keep the best one.
        `,
      ),
    ),
    solution: compose(
      CAESAR,
      COMMON,
      code(
        `
        def score(text):
            count = 0
            for word in text.split():
                if word in COMMON:
                    count += 1
            return count

        secret = input()
        best_key = 0
        best_score = -1
        for key in range(26):
            points = score(caesar(secret, -key))
            if points > best_score:
                best_key = key
                best_score = points
        print(f"Key: {best_key}")
        print(f"Message: {caesar(secret, -best_key)}")
        `,
        `
        function score(text) {
          let count = 0;
          for (const word of text.split(" ")) {
            if (COMMON.includes(word)) {
              count += 1;
            }
          }
          return count;
        }

        const secret = prompt();
        let bestKey = 0;
        let bestScore = -1;
        for (let key = 0; key < 26; key++) {
          const points = score(caesar(secret, -key));
          if (points > bestScore) {
            bestKey = key;
            bestScore = points;
          }
        }
        console.log(\`Key: \${bestKey}\`);
        console.log(\`Message: \${caesar(secret, -bestKey)}\`);
        `,
      ),
    ),
    tests: [
      { name: 'the intercepted message', input: 'tlla tl ha aol vsk tpss', expectedOutput: 'Key: 7\nMessage: meet me at the old mill' },
      { name: 'another message', input: 'bm bl t mkti lh kng mh max uhtm', expectedOutput: 'Key: 19\nMessage: it is a trap so run to the boat', hidden: true },
      { name: 'not encrypted at all', input: 'the cat is in the box', expectedOutput: 'Key: 0\nMessage: the cat is in the box', hidden: true },
      {
        name: 'score counts common words',
        input: 'x',
        expectedOutput: '3 0',
        harness: { python: 'print(score("you and the cat"), score("zzz qqq"))', javascript: 'console.log(score("you and the cat"), score("zzz qqq"));' },
        hidden: true,
      },
    ],
    takeaway: 'Trying every key is a **brute-force attack**, and against 26 keys it takes microseconds. Caesar is NOT real security. Real ciphers like AES have about 3.4 × 10³⁸ keys, far too many to try. Two defender lessons: a cipher is only as strong as its number of possible keys, and **never invent your own crypto**: use tested libraries.',
  },
];
