import type { Level } from '@codegames/shared';
import { lang } from '../../localize';
import { codeWithToInt, HANGMAN } from './shared';

/** boss-3 levels, in play order. */
export const boss3Levels: Level[] = [
  {
    id: 'boss-3',
    conceptId: 'boss-3',
    title: 'Hangman',
    role: 'boss',
    game: 'build-it',
    mode: 'freeform',
    prompt: `**Boss level!** Build Hangman.\n\nInput: the secret **word**, then the number of **lives** (if that isn't a whole number, use 6), then one **guess** per line.\n\nWrite two functions:\n\n- \`mask(word, guessed)\` **returns** the word with unguessed letters as \`_\`, separated by spaces: \`mask("robot", ["o"])\` → \`_ o _ o _\`.\n- ${lang('`is_valid(guess, guessed)`', '`isValid(guess, guessed)`')} returns whether the guess is exactly one character that hasn't been guessed yet.\n\nEach turn, print the mask and \`Lives: N\`, then read a guess. An invalid guess prints \`Invalid guess\` and costs nothing; a wrong letter costs a life. Ignore capitals. A game (\`cat\`, \`2\`, \`x\`, \`z\`):\n\n\`\`\`\n_ _ _\nLives: 2\n_ _ _\nLives: 1\nYou lose! The word was cat\n\`\`\`\n\nWin with \`You win! The word was cat\`.`,
    reinforces: ['functions', 'return-values', 'scope', 'collections', 'iterating-collections', 'strings', 'error-handling', 'while-loops', 'loop-control', 'conditionals', 'booleans', 'input', 'string-formatting'],
    hints: [
      lang('In `mask`, loop over the word and check `if ch in guessed:`. Add a space after every symbol, then return `result[:-1]` to drop the last one.', 'In `mask`, loop over the word and check `guessed.includes(ch)`. Add a space after every symbol, then return `result.slice(0, -1)` to drop the last one.'),
      'Keep a list of guessed letters. The game goes on while you have lives AND the mask still has a `_` in it.',
      lang('Read lives inside `try:` / `except ValueError:` and fall back to 6.', 'Read lives with `try { lives = toInt(prompt()); } catch (err) { lives = 6; }`.'),
      'After the loop, the mask tells you who won: any `_` left means the player lost.',
    ],
    starterCode: codeWithToInt(
      `
      def mask(word, guessed):
          return ""

      def is_valid(guess, guessed):
          return False

      word = input().lower()
      # 1. read lives (not a whole number? use 6)
      # 2. keep a list of guessed letters
      # 3. loop while lives are left and the mask still has a _
      # 4. after the loop: win or lose message
      `,
      `
      function mask(word, guessed) {
        return "";
      }

      function isValid(guess, guessed) {
        return false;
      }

      const word = prompt().toLowerCase();
      // 1. read lives (not a whole number? use 6)
      // 2. keep an array of guessed letters
      // 3. loop while lives are left and the mask still has a _
      // 4. after the loop: win or lose message
      `,
    ),
    solution: HANGMAN,
    tests: [
      {
        name: 'mask("banana", ["a"])',
        phase: '1 · Make the mask',
        input: 'a\n1\na',
        expectedOutput: '_ a _ a _ a',
        harness: { python: 'print(mask("banana", ["a"]))', javascript: 'console.log(mask("banana", ["a"]));' },
      },
      {
        name: 'robot: a clean win',
        phase: '2 · Win and lose',
        input: 'robot\n6\nr\no\nb\nt',
        expectedOutput: '_ _ _ _ _\nLives: 6\nr _ _ _ _\nLives: 6\nr o _ o _\nLives: 6\nr o b o _\nLives: 6\nYou win! The word was robot',
      },
      { name: 'cat: out of lives', phase: '2 · Win and lose', input: 'cat\n2\nx\nz', expectedOutput: '_ _ _\nLives: 2\n_ _ _\nLives: 1\nYou lose! The word was cat' },
      { name: 'win on the last life', phase: '2 · Win and lose', input: 'hi\n2\nx\nh\ni', expectedOutput: '_ _\nLives: 2\n_ _\nLives: 1\nh _\nLives: 1\nYou win! The word was hi', hidden: true },
      {
        name: 'dog: bad and repeated guesses',
        phase: '3 · Bad guesses',
        input: 'dog\n6\nd\ndd\nd\no\nx\ng',
        expectedOutput: '_ _ _\nLives: 6\nd _ _\nLives: 6\nInvalid guess\nd _ _\nLives: 6\nInvalid guess\nd _ _\nLives: 6\nd o _\nLives: 6\nd o _\nLives: 5\nYou win! The word was dog',
      },
      { name: 'SUN in capitals', phase: '3 · Bad guesses', input: 'SUN\n6\nS\nu\nN', expectedOutput: '_ _ _\nLives: 6\ns _ _\nLives: 6\ns u _\nLives: 6\nYou win! The word was sun', hidden: true },
      { name: 'lives that aren\'t a number', phase: '3 · Bad guesses', input: 'ok\nlots\no\nk', expectedOutput: '_ _\nLives: 6\no _\nLives: 6\nYou win! The word was ok', hidden: true },
      {
        name: 'is_valid checks its guesses',
        phase: '3 · Bad guesses',
        input: 'a\n1\na',
        expectedOutput: { python: 'False False True False', javascript: 'false false true false' },
        harness: {
          python: 'print(is_valid("a", ["a"]), is_valid("ab", []), is_valid("b", ["a"]), is_valid("", []))',
          javascript: 'console.log(isValid("a", ["a"]), isValid("ab", []), isValid("b", ["a"]), isValid("", []));',
        },
      },
    ],
    requirements: {
      python: [{ pattern: '\\btry\\s*:', message: 'Read the lives inside `try:` / `except ValueError:`, so a bad number can\'t crash the game.' }],
      javascript: [{ pattern: '\\btry\\s*\\{', message: 'Read the lives inside `try { } catch (err) { }` with `toInt`, so a bad number can\'t crash the game.' }],
    },
    play: {
      randomWord: ['python', 'robot', 'galaxy', 'puzzle', 'wizard', 'jungle', 'rocket', 'castle', 'dragon', 'pixel'],
      fixedInputs: ['6'],
      intro: "I've secretly picked a word and given your program 6 lives. Type one letter per guess!",
      renderer: 'hangman',
    },
    takeaway: 'You split a whole game into small functions that **return** answers, kept the state in a list, and handled bad input without crashing. That is how real programs are built: small, tested pieces.',
  },
];
