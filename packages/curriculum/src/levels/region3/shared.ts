import type { LangCode } from '@codegames/shared';
import { code, dedent } from '../../helpers';

/** Helpers shared by this region's level files. */
/** Region 3, part 1: functions with parameters, return values, scope. Design: docs/audits/round-3/teacher.md §5. */

/**
 * Region 3, part 2: lists, looping over lists, string skills, error handling, and the
 * Hangman boss. Design: docs/audits/round-3/teacher.md §5.
 */

/** JavaScript's Number() never throws, so JS levels about exceptions use this helper. */
export const JS_TO_INT = dedent(`
  // Number("seven") gives NaN instead of throwing, so this helper throws for you.
  function toInt(text) {
    const n = Number(text);
    if (text.trim() === "" || !Number.isInteger(n)) {
      throw new Error("not a number");
    }
    return n;
  }
`);

/** Like `code()`, with the JavaScript \`toInt\` helper placed above the JS program. */
export function codeWithToInt(python: string, javascript: string) {
  const c = code(python, javascript);
  return { ...c, javascript: `${JS_TO_INT}\n${c.javascript}` };
}

const HANGMAN_FUNCTIONS = code(
  `
  def mask(word, guessed):
      result = ""
      for ch in word:
          if ch in guessed:
              result += ch + " "
          else:
              result += "_ "
      return result[:-1]

  def is_valid(guess, guessed):
      return len(guess) == 1 and guess not in guessed
  `,
  `
  function mask(word, guessed) {
    let result = "";
    for (const ch of word) {
      if (guessed.includes(ch)) {
        result += ch + " ";
      } else {
        result += "_ ";
      }
    }
    return result.slice(0, -1);
  }

  function isValid(guess, guessed) {
    return guess.length === 1 && !guessed.includes(guess);
  }
  `,
);

/** The boss's setup: the secret word and the number of lives arrive as input. */
const HANGMAN_INPUT_SETUP = code(
  `
  word = input().lower()
  try:
      lives = int(input())
  except ValueError:
      lives = 6
  `,
  `
  const word = prompt().toLowerCase();
  let lives;
  try {
    lives = toInt(prompt());
  } catch (err) {
    lives = 6;
  }
  `,
);

const HANGMAN_ROUNDS = code(
  `
  guessed = []
  while lives > 0 and "_" in mask(word, guessed):
      print(mask(word, guessed))
      print(f"Lives: {lives}")
      guess = input().lower()
      if not is_valid(guess, guessed):
          print("Invalid guess")
          continue
      guessed.append(guess)
      if guess not in word:
          lives -= 1

  if "_" in mask(word, guessed):
      print(f"You lose! The word was {word}")
  else:
      print(f"You win! The word was {word}")
  `,
  `
  const guessed = [];
  while (lives > 0 && mask(word, guessed).includes("_")) {
    console.log(mask(word, guessed));
    console.log(\`Lives: \${lives}\`);
    const guess = prompt().toLowerCase();
    if (!isValid(guess, guessed)) {
      console.log("Invalid guess");
      continue;
    }
    guessed.push(guess);
    if (!word.includes(guess)) {
      lives -= 1;
    }
  }

  if (mask(word, guessed).includes("_")) {
    console.log(\`You lose! The word was \${word}\`);
  } else {
    console.log(\`You win! The word was \${word}\`);
  }
  `,
);

export const HANGMAN: LangCode = {
  python: `${HANGMAN_FUNCTIONS.python}\n${HANGMAN_INPUT_SETUP.python}\n${HANGMAN_ROUNDS.python}`,
  javascript: `${JS_TO_INT}\n${HANGMAN_FUNCTIONS.javascript}\n${HANGMAN_INPUT_SETUP.javascript}\n${HANGMAN_ROUNDS.javascript}`,
};

/** The word workshop's starter data: the words the game can pick, and how many lives to start with. */
export const HANGMAN_WORDS = code(
  `
  # Lowercase words, letters only. The game picks one at random.
  words = ["python", "robot", "galaxy", "puzzle", "wizard"]
  # Wrong guesses allowed before the player loses.
  start_lives = 6
  `,
  `
  // Lowercase words, letters only. The game picks one at random.
  const words = ["python", "robot", "galaxy", "puzzle", "wizard"];
  // Wrong guesses allowed before the player loses.
  const startLives = 6;
  `,
);

/** The word workshop's setup: pick a random word from the learner's list instead of reading input. */
const HANGMAN_LIST_SETUP = code(
  `
  import random

  word = random.choice(words).lower()
  lives = start_lives
  `,
  `
  const word = words[Math.floor(Math.random() * words.length)].toLowerCase();
  let lives = startLives;
  `,
);

/**
 * The word workshop's program: the learner's word list above the boss's fixed engine. The data
 * is never trimmed, so error line numbers match the learner's editor.
 */
export function hangmanWithWords(data: LangCode): LangCode {
  return {
    python: `${data.python ?? ''}\n${HANGMAN_FUNCTIONS.python}\n${HANGMAN_LIST_SETUP.python}\n${HANGMAN_ROUNDS.python}`,
    javascript: `${data.javascript ?? ''}\n${HANGMAN_FUNCTIONS.javascript}\n${HANGMAN_LIST_SETUP.javascript}\n${HANGMAN_ROUNDS.javascript}`,
  };
}
