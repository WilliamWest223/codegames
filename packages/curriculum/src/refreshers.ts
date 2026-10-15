import { lang } from './localize';

/**
 * Micro-lessons for repeated errors (docs/PEDAGOGY_PLAN.md, research brief §6): when the same
 * kind of error shows up a third time, the learner gets a short, targeted refresher. Keys are
 * error names; text may use `lang()` tokens. `practice` names a bug-hunt level that trains
 * exactly this kind of fix; the app links to it once that level's concept is unlocked.
 */
export const REFRESHERS: Record<string, { title: string; text: string; practice?: string }> = {
  SyntaxError: {
    title: 'Grammar check',
    practice: 'first-errors-1',
    text: lang(
      'Python reads your code before running it. Check the line it points to (and the one above): every `(` `[` `{` and quote needs a partner, and lines that start a block (`if`, `for`, `while`, `def`) end with `:`.',
      'JavaScript reads your code before running it. Check the line it points to (and the one above): every `(` `[` `{` and quote needs a partner. A missing `}` is often reported at the very end of the file.',
    ),
  },
  IndentationError: {
    title: 'Indentation is grammar in Python',
    practice: 'loops-7',
    text: 'Only lines *inside* an `if`, loop or `def` are indented (usually 4 spaces), and every line in the block by the same amount. "Unexpected indent" means a line is pushed in where no block started: move it back to the left. The first line *after* a block goes back to the left too. Mixing tabs and spaces also causes this.',
  },
  NameError: {
    title: 'Python only knows names you\'ve created',
    practice: 'first-errors-2',
    text: 'A name has to get a value (`x = ...`) or be defined (`def x():`) **before** the line that uses it, with exactly the same spelling and capitals. Text you want to print goes in quotes.',
  },
  ReferenceError: {
    title: 'JavaScript only knows names you\'ve declared',
    practice: 'first-errors-2',
    text: 'Declare a name with `let`/`const` (or `function`) **before** using it, with exactly the same spelling and capitals. Names made inside `{ }` only exist inside them. Text you want to print goes in quotes.',
  },
  TypeError: {
    title: 'Check what type each value is',
    practice: 'types-3',
    text: lang(
      'Text and numbers don\'t mix: convert with `int()` or `str()`, or use an f-string. Brackets `()` call functions; `[]` read positions. `None` usually means a function printed instead of returning.',
      'Check that the thing before `(` is really a function, and that a value isn\'t `undefined` before you read `.something` from it (often a missing `return` or a position past the end).',
    ),
  },
  ValueError: {
    title: 'Right type, wrong content',
    practice: 'error-handling-3',
    text: '`int("hello")` can\'t work: the text isn\'t a number. Check what the input really contains (spaces, words, a decimal point for `int`). Later you\'ll learn to catch bad input with `try`/`except`.',
  },
  IndexError: {
    title: 'Positions start at 0',
    practice: 'collections-2',
    text: 'A list of 3 items has positions 0, 1 and 2. The last one is `len(items) - 1`, or `items[-1]`. Loops over `range(len(items))` never go past the end.',
  },
  KeyError: {
    title: 'Look before you look up',
    practice: 'map-patterns-2',
    text: 'Check a key is there with `if key in d:` first, or use `d.get(key, default)`. When counting, the first time you see something it isn\'t in the dictionary yet.',
  },
  AttributeError: {
    title: 'That value doesn\'t have that method',
    text: 'Check the spelling, and check what type the value really is: lists have `.append`, strings have `.upper`, dictionaries use `d[key]`. A value that is `None` has no methods at all.',
  },
  UnboundLocalError: {
    title: 'Functions get their own variables',
    practice: 'scope-2',
    text: 'Assigning to a name inside a function makes a new local variable. Pass values in as parameters and `return` the result, and give variables a value before any `if`/`try` that might skip it.',
  },
  ZeroDivisionError: {
    title: 'Guard your division',
    text: 'Dividing by zero is undefined. Check the divisor first (`if count > 0:`), especially for averages of empty lists.',
  },
  EOFError: {
    title: 'Count your inputs',
    text: 'The program asked for more input than the test gives. Match each `input()` to one line of input, and make sure a `while` loop that reads input can stop.',
  },
  InputError: {
    title: 'Count your inputs',
    text: 'The program asked for more input than the test gives. Match each `prompt()` to one line of input, and make sure a `while` loop that reads input can stop.',
  },
  TimeoutError: {
    title: 'Every loop needs a way out',
    practice: 'while-loops-4',
    text: 'A loop that never stops freezes the program. Something inside the loop must change so the condition eventually becomes false, or a `break` must run. Try 👣 Step through to watch the loop variable.',
  },
};

/** Repeats of the same error kind before the refresher appears. */
export const REFRESHER_AFTER = 3;
