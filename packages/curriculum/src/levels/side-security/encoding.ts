import type { Level } from '@codegames/shared';
import { code } from '../../helpers';
import { lang } from '../../localize';

/** encoding levels, in play order. */
export const encodingLevels: Level[] = [
  {
    id: 'encoding-1',
    conceptId: 'encoding',
    title: 'Letters Are Numbers',
    role: 'intro',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: `Computers only store numbers, so every character has a number code: \`A\` is 65, \`a\` is 97. ${lang('`ord(ch)` gives a character\'s code; `chr(n)` gives the character for a code.', '`ch.charCodeAt(0)` gives a character\'s code; `String.fromCharCode(n)` gives the character for a code.')} Which output is right?`,
    reinforces: ['strings-basics'],
    choices: {
      python: ['65\n97\nHi\n1\nd', '1\n1\nHi\n1\nd', '65\n65\nHi\n1\nd', '65\n97\n177\n1\nd'],
      javascript: ['65\n97\nHi\n1\nd', '1\n1\nHi\n1\nd', '65\n65\nHi\n1\nd', '65\n97\n177\n1\nd'],
    },
    hints: [
      'Capital letters and small letters have **different** codes: `A` is 65 and `a` is 97, exactly 32 apart.',
      'Letters are numbered in alphabet order, so `b` is one more than `a`.',
      lang('`chr(72) + chr(105)` joins two characters into a string; it doesn\'t add numbers.', '`String.fromCharCode(72) + String.fromCharCode(105)` joins two characters into a string; it doesn\'t add numbers.'),
    ],
    code: code(
      `
      print(ord("A"))
      print(ord("a"))
      print(chr(72) + chr(105))
      print(ord("b") - ord("a"))
      print(chr(ord("c") + 1))
      `,
      `
      console.log("A".charCodeAt(0));
      console.log("a".charCodeAt(0));
      console.log(String.fromCharCode(72) + String.fromCharCode(105));
      console.log("b".charCodeAt(0) - "a".charCodeAt(0));
      console.log(String.fromCharCode("c".charCodeAt(0) + 1));
      `,
    ),
    takeaway: 'Text is stored as numbers (the **Unicode** code points; the first 128 are the old **ASCII** table). Turning text into numbers and back is **encoding**. Security lesson #1: encoding is **not** encryption. Anyone can decode it, so it never hides a secret.',
  },
  {
    id: 'encoding-2',
    conceptId: 'encoding',
    title: 'Decode the Signal',
    role: 'combine',
    game: 'build-it',
    mode: 'fill-blanks',
    prompt: `A signal arrives as groups of 8 **bits** (binary digits), one group per character: \`01001000 01101001 00100001\`. Each group is a character code written in base 2. ${lang('`int("01001000", 2)`', '`parseInt("01001000", 2)`')} reads it as a number (72), and 72 is \`H\`. Decode the whole signal: \`Hi!\`.`,
    reinforces: ['type-conversion', 'iterating-collections', 'strings', 'input'],
    hints: [
      lang('`signal.split()` gives the groups. The base goes second: `int(group, 2)`.', '`signal.split(" ")` gives the groups. The base goes second: `parseInt(group, 2)`.'),
      lang('Add `chr(code)` to the message each time round.', 'Add `String.fromCharCode(code)` to the message each time round.'),
    ],
    starterCode: code(
      `
      signal = input()
      message = ""
      for group in signal.split():
          code = int(group, ___)
          message += ___
      print(message)
      `,
      `
      const signal = prompt();
      let message = "";
      for (const group of signal.split(" ")) {
        const code = parseInt(group, ___);
        message += ___;
      }
      console.log(message);
      `,
    ),
    solution: code(
      `
      signal = input()
      message = ""
      for group in signal.split():
          code = int(group, 2)
          message += chr(code)
      print(message)
      `,
      `
      const signal = prompt();
      let message = "";
      for (const group of signal.split(" ")) {
        const code = parseInt(group, 2);
        message += String.fromCharCode(code);
      }
      console.log(message);
      `,
    ),
    tests: [
      { name: 'Hi!', input: '01001000 01101001 00100001', expectedOutput: 'Hi!' },
      { name: 'another signal', input: '01000011 01101111 01100100 01100101', expectedOutput: 'Code', hidden: true },
    ],
    takeaway: lang(
      'Without the base, `int("01001000")` reads a **decimal** number (1001000). Binary is just another way to write the same codes, and it is still encoding: public, reversible, never secret.',
      'Without the base, `parseInt("01001000")` reads a **decimal** number (1001000). Binary is just another way to write the same codes, and it is still encoding: public, reversible, never secret.',
    ),
  },
  {
    id: 'encoding-3',
    conceptId: 'encoding',
    title: 'Tamper Check',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: 'Messages arrive with a **checksum**: `pay bob 10|825`. The sender computed a number from the text; if the text changed on the way, the number won\'t match.\n\n`checksum(text)`: add up (position + 1) × character code for every character (positions start at 0), then take the remainder after dividing by 997.\n\nRead lines until `done`. Print `OK: TEXT` or `TAMPERED: TEXT`, or `Bad line` when there\'s no `|`. Finish with `Checked N, tampered M` (bad lines don\'t count as checked).',
    reinforces: ['functions', 'return-values', 'strings', 'while-loops', 'else-if-chains', 'input', 'type-conversion', 'string-formatting'],
    hints: [
      lang('`for i in range(len(text)):` gives each position; the character is `text[i]` and its code is `ord(text[i])`.', '`for (let i = 0; i < text.length; i++)` gives each position; the code is `text.charCodeAt(i)`.'),
      `\`line.split("|")\` splits a line in two: ${lang('`text, number = line.split(...)`', '`const [text, number] = line.split(...);`')}. The number is still text: ${lang('`int(number)`', '`Number(number)`')}.`,
      'Multiplying by the position makes the order matter: swapping two letters changes the checksum.',
    ],
    starterCode: code(
      `
      def checksum(text):
          # Add (position + 1) * character code for each character, then % 997.
          return 0

      # Read lines until "done": check each one and count what you see.
      `,
      `
      function checksum(text) {
        // Add (position + 1) * character code for each character, then % 997.
        return 0;
      }

      // Read lines until "done": check each one and count what you see.
      `,
    ),
    solution: code(
      `
      def checksum(text):
          total = 0
          for i in range(len(text)):
              total += (i + 1) * ord(text[i])
          return total % 997

      checked = 0
      tampered = 0
      while True:
          line = input()
          if line == "done":
              break
          elif "|" not in line:
              print("Bad line")
          else:
              text, number = line.split("|")
              checked += 1
              if checksum(text) == int(number):
                  print(f"OK: {text}")
              else:
                  tampered += 1
                  print(f"TAMPERED: {text}")
      print(f"Checked {checked}, tampered {tampered}")
      `,
      `
      function checksum(text) {
        let total = 0;
        for (let i = 0; i < text.length; i++) {
          total += (i + 1) * text.charCodeAt(i);
        }
        return total % 997;
      }

      let checked = 0;
      let tampered = 0;
      while (true) {
        const line = prompt();
        if (line === "done") {
          break;
        } else if (!line.includes("|")) {
          console.log("Bad line");
        } else {
          const [text, number] = line.split("|");
          checked += 1;
          if (checksum(text) === Number(number)) {
            console.log(\`OK: \${text}\`);
          } else {
            tampered += 1;
            console.log(\`TAMPERED: \${text}\`);
          }
        }
      }
      console.log(\`Checked \${checked}, tampered \${tampered}\`);
      `,
    ),
    tests: [
      {
        name: 'one changed on the way',
        input: 'pay bob 10|825\npay bob 90|825\nhello|620\ndone',
        expectedOutput: 'OK: pay bob 10\nTAMPERED: pay bob 90\nOK: hello\nChecked 3, tampered 1',
      },
      {
        name: 'a bad line',
        input: 'send 5 coins|201\nsend 500 coins|201\nno bar here\ndone',
        expectedOutput: 'OK: send 5 coins\nTAMPERED: send 500 coins\nBad line\nChecked 2, tampered 1',
        hidden: true,
      },
      {
        name: 'checksum itself',
        input: 'done',
        expectedOutput: '550 0 97',
        harness: { python: 'print(checksum("meet at noon"), checksum(""), checksum("a"))', javascript: 'console.log(checksum("meet at noon"), checksum(""), checksum("a"));' },
        hidden: true,
      },
    ],
    takeaway: 'This is **integrity**, the "I" in the **CIA triad** (Confidentiality, Integrity, Availability): knowing data wasn\'t changed. A checksum catches accidents, but it is NOT real security: an attacker who changes the text can just recompute the number. Real systems use a secret key (an HMAC) or a digital signature, so only the real sender can make a matching number.',
  },
];
