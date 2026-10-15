/** What the Hangman screen shows, read from the learner's own program output. */
export interface HangmanView {
  /** Letters of the word, `null` for a hidden one. Empty until the program prints a mask. */
  tiles: (string | null)[];
  lives?: number;
  startLives?: number;
  guesses: { letter: string; hit: boolean }[];
  outcome?: 'win' | 'lose';
}

/** One character per slot, separated by single spaces, with at least one hidden `_`. */
const MASK = /^(?:\S )*_(?: \S)*$/;

/** `finished`: the program has ended, so a win/lose line is final (not "You lose a life!"). */
export function readHangman(stdout: string, typed: string[], finished = true): HangmanView {
  const lines = stdout.split('\n').map((l) => l.trim());
  const masks = lines.filter((l) => MASK.test(l));
  const lives = lines.map((l) => l.match(/^Lives:\s*(\d+)/)?.[1]).filter((n): n is string => !!n).map(Number);
  const last = [...lines].reverse().find((l) => l.length > 0) ?? '';
  const outcome = !finished ? undefined : /^You win/i.test(last) ? 'win' : /^You lose/i.test(last) ? 'lose' : undefined;
  const word = outcome ? last.match(/The word was (\S+)/i)?.[1] : undefined;
  let tiles: (string | null)[] = masks.length ? masks.at(-1)!.split(' ').map((c) => (c === '_' ? null : c)) : [];
  // The final mask is printed before the last guess; the end line reveals the whole word.
  if (word && outcome && (tiles.length === 0 || tiles.length === word.length)) tiles = [...word];
  const known = new Set(word ? [...word.toLowerCase()] : tiles.filter((t): t is string => !!t).map((t) => t.toLowerCase()));
  const seen = new Set<string>();
  const guesses = typed
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length === 1 && !seen.has(t) && (seen.add(t), true))
    .map((letter) => ({ letter, hit: known.has(letter) }));
  return { tiles, lives: lives.at(-1), startLives: lives[0], guesses, outcome };
}
