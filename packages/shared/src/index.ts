/** Languages CodeGames can teach. */
export type Language = 'python' | 'javascript' | 'cybersecurity' | 'java' | 'cpp';

/** Languages with playable content in the current version. */
export const PLAYABLE_LANGUAGES = ['python', 'javascript', 'cybersecurity'] as const satisfies readonly Language[];
export type PlayableLanguage = (typeof PLAYABLE_LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<Language, string> = {
  python: 'Python',
  javascript: 'JavaScript',
  cybersecurity: 'Cybersecurity',
  java: 'Java',
  cpp: 'C++',
};

/** Code written once per language. A missing language means "not available in that language". */
export type LangCode = Partial<Record<Language, string>>;

/**
 * The scaffolding ladder. Every concept is taught by climbing these rungs,
 * moving the learner from visual blocks to fully independent typed code.
 */
export type LearningMode =
  | 'blocks' //      drag-and-drop blocks only
  | 'hybrid' //      read real code (e.g. predict what it prints)
  | 'parsons' //     put scrambled lines of real code in order
  | 'fill-blanks' // real code with a few `___` gaps to complete
  | 'guided' //      write code from scratch with hints and visible tests
  | 'freeform'; //   open challenge, fewer hints

/** The mini-game a level is played as. */
export type GameType =
  | 'grid-quest' //     program a robot to move through a grid
  | 'predict-output' // read code, type exactly what it prints
  | 'parsons' //        reorder scrambled lines into a working program
  | 'bug-hunt' //       find and fix the bug
  | 'build-it' //       write code that passes the level's tests
  | 'speed-run'; //     timed challenge for mastery (not built yet)

/** Where a level sits in its concept's arc (see docs/concept-ideas.md §8.2). */
export type LevelRole = 'intro' | 'combine' | 'integrate' | 'challenge' | 'boss';

/** A node on the world map, shared across all languages. */
export interface Concept {
  id: string;
  title: string;
  summary: string;
  /**
   * An observable thing the learner can now do, shown in the journal instead of the topic
   * summary (e.g. "Use a loop to add up or count the numbers from 1 to n"). Keep the wording
   * language-neutral: say "lists (arrays)", not `append` or `push`.
   */
  canDo?: string;
  /** World-map region. Lower regions are unlocked first. */
  region: number;
  /** Concept ids that must be at least "practiced" before this unlocks. */
  requires: string[];
  /** Restrict to specific languages (e.g. pointers -> cpp). Omit for all. */
  languages?: Language[];
  /** Region finale. Its single boss level gates the next region. */
  boss?: boolean;
  /** Planned for a later version: shown on the map but not playable yet. */
  comingSoon?: boolean;
  /** Optional side quest: never required by a core concept or a core boss. */
  sideQuest?: boolean;
}

export interface TestCase {
  name: string;
  /** stdin fed to the program, one value per line. */
  input?: string;
  /** Same for every language, or per language when output differs (e.g. `True` vs `true`). */
  expectedOutput: string | LangCode;
  /** Hidden tests aren't shown before submitting (stop hard-coding answers). */
  hidden?: boolean;
  /** Boss levels: the phase of the fight this test belongs to (shown on the boss HP bar). */
  phase?: string;
  /**
   * Hidden code appended after the learner's program that calls their functions with fresh
   * arguments, e.g. `print(price_with_tax(19.99, 0.2))`. Only the harness's output is
   * compared, so this grades what functions *return*, not what the program prints.
   */
  harness?: LangCode;
}

/** A source-code check run before tests, e.g. "you must use a for loop". */
export interface CodeRequirement {
  /** JavaScript RegExp source, tested against the learner's code. */
  pattern: string;
  /** If true, the pattern must NOT appear. */
  forbid?: boolean;
  message: string;
}

/** Robot world for grid-quest. See packages/runtime/src/grid.ts for the legend. */
export interface GridSpec {
  rows: string[];
}

interface LevelBase {
  id: string;
  conceptId: string;
  title: string;
  role: LevelRole;
  mode: LearningMode;
  /** Instructions shown to the learner (Markdown). */
  prompt: string;
  /** Earlier concept ids this level actively exercises (mastery rules, §8.1). */
  reinforces: string[];
  /** Progressive hints: gentle first, specific last. */
  hints: string[];
  /** Optional one-paragraph explanation shown after completing the level. */
  takeaway?: string;
}

/**
 * Re-run the learner's code with some starting values changed (e.g. `pizzas = 3` →
 * `pizzas = 4`), so typed-in answers fail and only code that computes the answer passes.
 */
export interface CodeVariant {
  name: string;
  /** Exact text to find in the learner's code and what to replace it with, per language. */
  replace: Partial<Record<Language, [string, string][]>>;
  expectedOutput: string | LangCode;
}

/** Write or fix code until it passes the tests. */
export interface CodeLevel extends LevelBase {
  game: 'build-it' | 'bug-hunt';
  starterCode: LangCode;
  solution: LangCode;
  tests: TestCase[];
  requirements?: Partial<Record<Language, CodeRequirement[]>>;
  variants?: CodeVariant[];
  /**
   * A worked example of a *similar* problem (same pattern, different story), shown after the
   * puzzle version fails twice. It must not solve this level when pasted in.
   */
  parallelExample?: { prompt: string; code: LangCode };
  /**
   * Web Pages levels: the page's starting HTML (body contents). The program runs against an
   * in-memory `document` for it; tests read the page back with `render()` in a harness.
   */
  page?: string;
  /** Interactive "Play it" setup, e.g. the app secretly picks the first input. */
  play?: {
    /** Pick a random whole number in [min, max] as a hidden first input line. */
    randomFirstInput?: [number, number];
    /** Or pick a random word from this list as the hidden first input line. */
    randomWord?: string[];
    /** Hidden input lines given after the random first one (e.g. a number of lives). */
    fixedInputs?: string[];
    /** Shown when play starts (Markdown). */
    intro: string;
    /**
     * Draw a game screen from the program's own output (the console stays below it).
     * `hangman`: reads the mask line (`_ o _ o _`), `Lives: N`, and the win/lose line.
     * `adventure`: reads `You are in the X. Exits: ... Items: ...`, `Taken: X`, `You carry: ...`.
     * `page`: draws the level's `page` after the program ran; clicks and typing are replayed.
     */
    renderer?: 'hangman' | 'adventure' | 'page';
  };
}

/** Read code, predict its exact output. The real output is computed by running it. */
export interface PredictLevel extends LevelBase {
  game: 'predict-output';
  code: LangCode;
  stdin?: string;
  /** Warm-ups may change this level's numbers to make a fresh puzzle (safe for any values > 1). */
  remix?: boolean;
  /**
   * Multiple choice first (docs/PEDAGOGY_PLAN.md): full candidate outputs per language, one of
   * which is the real output (checked by the curriculum tests). The learner can still type.
   */
  choices?: Partial<Record<Language, string[]>>;
  /**
   * The code is meant to crash: the learner predicts the output and then the error's name
   * on the last line (e.g. `IndexError`), learning to read failures, not just successes.
   */
  expectError?: boolean;
  /**
   * Optional PRIMM "Investigate" step after a correct prediction: short multiple-choice
   * questions about *why* the code behaves that way. `answer` is the index of the right
   * choice. Runs before Modify; skipped in warm-ups.
   */
  investigate?: { question: string; choices: string[]; answer: number }[];
  /**
   * Optional PRIMM "Modify" step after a correct prediction: edit the same code
   * so it prints `expectedOutput`. The level completes when this passes.
   */
  modify?: {
    prompt: string;
    expectedOutput: string | LangCode;
    /** Reference answer, verified by the curriculum tests. */
    solution: LangCode;
    requirements?: Partial<Record<Language, CodeRequirement[]>>;
    variants?: CodeVariant[];
  };
}

/**
 * Order scrambled lines. Graded by running the assembled program, so any order
 * that works is accepted: against `tests`, or on `grid` when it drives the robot.
 */
export interface ParsonsLevel extends LevelBase {
  game: 'parsons';
  solution: LangCode;
  /** Extra wrong lines mixed in, per language. */
  distractors?: Partial<Record<Language, string[]>>;
  tests?: TestCase[];
  grid?: GridSpec;
}

/** Program the robot to collect every gem (and reach the flag, if there is one). */
export interface GridLevel extends LevelBase {
  game: 'grid-quest';
  grid: GridSpec;
  starterCode: LangCode;
  solution: LangCode;
  requirements?: Partial<Record<Language, CodeRequirement[]>>;
  /** More maps the same code must also solve, so a hard-coded path won't pass. */
  extraGrids?: GridSpec[];
  /**
   * Line budget: the program (ignoring blank lines and comments) must fit in this many
   * lines, so long hand-written paths fail even if disguised inside a command.
   */
  maxLines?: number;
  /** If set, the program must also print exactly this (e.g. boss levels). */
  expectedOutput?: string | LangCode;
  /**
   * The same program with its data changed (e.g. a different route list) must also solve
   * another map, so the code has to read the data instead of hard-coding the path.
   */
  routeVariants?: { name: string; replace: CodeVariant['replace']; grid: GridSpec }[];
}

export type Level = CodeLevel | PredictLevel | ParsonsLevel | GridLevel;

/** Resolve a per-language expected output. */
export function expectedFor(expected: string | LangCode, language: Language): string | undefined {
  return typeof expected === 'string' ? expected : expected[language];
}

/** Languages a level has content for. */
export function levelLanguages(level: Level): Language[] {
  const code = level.game === 'predict-output' ? level.code : level.solution;
  return (Object.keys(code) as Language[]).filter((l) => code[l] !== undefined);
}

/** XP awarded per role. */
export const ROLE_XP: Record<LevelRole, number> = {
  intro: 10,
  combine: 15,
  integrate: 20,
  challenge: 30,
  boss: 50,
};

/** Request/response contract between the web app and the local Java/C++ runner. */
export interface RunRequest {
  language: Language;
  code: string;
  stdin?: string;
  timeoutMs?: number;
}

export interface RunResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  /** Compile errors are reported separately so the UI can explain them. */
  compileError?: string;
  timedOut: boolean;
  durationMs: number;
}

/** Port the local runner listens on (127.0.0.1 only). */
export const RUNNER_PORT = 4317;
