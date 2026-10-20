import { expectedFor, type CodeRequirement, type CodeVariant, type GridSpec, type Language, type Level, type TestCase } from '@codegames/shared';
import { looseContainers, normalizeOutput, outputsMatch } from './compare';
import type { GridOutcome } from './grid';
import type { ExecOptions, ExecResult } from './types';

/** Runs code in some environment (a Web Worker in the browser, directly in tests). */
export type Executor = (code: string, options: ExecOptions) => Promise<ExecResult>;

export interface TestResult {
  name: string;
  passed: boolean;
  hidden: boolean;
  input?: string;
  expected: string;
  actual: string;
  error?: ExecResult['error'];
  /** Not run because an earlier test timed out. */
  skipped?: boolean;
  phase?: string;
  /** Harness tests: the hidden code that called the learner's functions (shown instead of the input). */
  call?: string;
  /** Harness tests: the main program stopped (crash, exit, missing input) before the call ran. */
  mainStopped?: boolean;
}

export interface GradeResult {
  passed: boolean;
  /** Why grading stopped before running anything (blanks, requirements). */
  blocked?: string[];
  tests: TestResult[];
  /** The run to animate for grid levels (on the main map). */
  gridRun?: ExecResult;
  /** If the main map passed but another map failed. */
  /** An extra map (or a route variant) the code didn't solve; `name` is set for route variants. */
  failedMap?: { index: number; outcome: GridOutcome; grid: GridSpec; name?: string };
  /** Wrong or missing printed output on levels that also check output. */
  outputMismatch?: { expected: string; actual: string };
  /** Likely-mistake warnings from a quick look at the code (e.g. a command without `()`). */
  warnings?: string[];
}

const GRID_COMMANDS = {
  python: ['move', 'turn_left', 'collect', 'is_blocked', 'on_gem', 'at_flag'],
  javascript: ['move', 'turnLeft', 'collect', 'isBlocked', 'onGem', 'atFlag'],
} as const;

function definedFunctions(code: string, language: Language): string[] {
  const re = language === 'python' ? /^\s*def\s+(\w+)\s*\(/gm : /function\s+([\w$]+)\s*\(/g;
  return [...code.matchAll(re)].map((m) => m[1]!);
}

interface StringLiteral {
  start: number;
  end: number;
  quote: string;
  /** Text between the quotes. */
  body: string;
  /** Placeholder expressions (`{…}` in Python f-strings, `${…}` in JS template literals). */
  placeholders: string[];
}

/** Find string literals (single-line quotes, triple quotes, JS backticks), honouring escapes. */
function stringLiterals(code: string, language: Language): StringLiteral[] {
  const found: StringLiteral[] = [];
  for (let i = 0; i < code.length; i++) {
    const ch = code[i]!;
    if (ch !== '"' && ch !== "'" && ch !== '`') continue;
    const triple = language === 'python' && code.startsWith(ch.repeat(3), i);
    const quote = triple ? ch.repeat(3) : ch;
    let j = i + quote.length;
    while (j < code.length && !code.startsWith(quote, j)) {
      if (code[j] === '\\') j++;
      else if (code[j] === '\n' && !triple && ch !== '`') break;
      j++;
    }
    const body = code.slice(i + quote.length, j);
    const fString = language === 'python' && /[fF][rRbB]?$|[rR][fF]$/.test(code.slice(Math.max(0, i - 2), i));
    const placeholders =
      ch === '`' && language !== 'python'
        ? [...body.matchAll(/\$\{([^}]*)\}/g)].map((m) => m[1]!)
        : fString
          ? [...body.matchAll(/\{([^{}]*)\}/g)].map((m) => m[1]!)
          : [];
    // An unclosed quote ends at the line break (kept, so line structure survives).
    const end = code.startsWith(quote, j) ? j + quote.length : j;
    found.push({ start: i, end, quote, body, placeholders });
    i = end - 1;
  }
  return found;
}

/**
 * Spot common silent mistakes before or after running:
 * - a command written without `()` (does nothing, no error)
 * - a sensor used without `()` in a condition (always true)
 * - a command that is defined but never used (called, or passed / stored as a value)
 */
export function lintCode(code: string, language: Language): string[] {
  const lang = language === 'python' ? 'python' : 'javascript';
  const raw = stripComments(code, language);
  const strings = stringLiterals(raw, language);
  // Ignore the inside of strings (e.g. print("Do not move")), but keep placeholder code:
  // f"{average(records):.1f}" and `${total(xs)}` really call those functions.
  let source = '';
  let from = 0;
  for (const s of strings) {
    source += raw.slice(from, s.start) + `""${s.placeholders.length ? ` ${s.placeholders.join(' ')} ` : ''}`;
    from = s.end;
  }
  source += raw.slice(from);
  const defined = definedFunctions(source, language);
  const names = [...new Set([...GRID_COMMANDS[lang], ...defined])];
  const warnings: string[] = [];
  for (const name of names) {
    const bare = new RegExp(`^\\s*${name}\\s*;?\\s*$`, 'm');
    if (bare.test(source)) warnings.push(`\`${name}\` is missing its brackets. Write \`${name}()\` to actually run it.`);
    const inCondition = new RegExp(`(if|while|elif|not|!|&&|\\|\\||and|or)[\\s(]*${name}\\b(?!\\s*\\()`);
    if (GRID_COMMANDS[lang].includes(name as never) && inCondition.test(source)) {
      warnings.push(`\`${name}\` needs brackets in a condition: \`${name}()\` asks the question; without them it is always true.`);
    }
  }
  // Placeholders in the wrong kind of string.
  if (language === 'javascript' && strings.some((s) => s.quote !== '`' && /\$\{[^}]*\}/.test(s.body))) {
    warnings.push('`${...}` placeholders only work inside **backticks** (`` ` ``), not regular quotes.');
  }
  if (language === 'python') {
    const variables = new Set([...raw.matchAll(/^\s*(\w+)\s*=(?!=)/gm)].map((m) => m[1]!));
    for (const s of strings) {
      if (s.quote.length > 1 || s.placeholders.length) continue;
      const placeholder = s.body.match(/\{(\w+)\}/g)?.map((p) => p.slice(1, -1)).find((p) => variables.has(p));
      const prefix = raw.slice(Math.max(0, s.start - 1), s.start);
      if (placeholder && !/[fF]/.test(prefix)) {
        warnings.push(`\`{${placeholder}}\` will print literally: add an \`f\` before the quote to make it an f-string, like \`f"..."\`.`);
        break;
      }
    }
  }
  for (const name of defined) {
    // Dunder methods (`__init__`) run without being called by name.
    if (/^__\w+__$/.test(name)) continue;
    // Any use counts: a call, or the function passed or stored as a value (`key=hp_of`, `.map(toRecord)`, `return add`).
    const escaped = name.replace(/\$/g, '\\$');
    const uses = source.match(new RegExp(`(?<![\\w$])${escaped}(?![\\w$])`, 'g'))?.length ?? 0;
    if (uses <= 1) warnings.push(`You defined \`${name}()\` but never called it. Defining a command only teaches it; call \`${name}()\` to use it.`);
  }
  return warnings;
}

export const BLANK = '___';

export function hasBlanks(code: string): boolean {
  return code.includes(BLANK);
}

/** Remove a line comment, ignoring comment markers inside single-line string literals. */
function stripLineComment(line: string, marker: '#' | '//'): string {
  let quote: string | null = null;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
    } else if (line.startsWith(marker, i)) {
      return line.slice(0, i);
    }
  }
  return line;
}

/** Strip comments so requirement checks can't be satisfied by a comment. Keeps line structure. */
export function stripComments(code: string, language: Language): string {
  const marker = language === 'python' ? '#' : '//';
  const source = language === 'python' ? code : code.replace(/\/\*[\s\S]*?\*\//g, '');
  return source
    .split('\n')
    .map((line) => stripLineComment(line, marker))
    .join('\n');
}

/** Replace the inside of every string literal with nothing (placeholder code stays), keeping the quotes. */
function blankStrings(code: string, language: Language): string {
  let out = '';
  let from = 0;
  for (const s of stringLiterals(code, language)) {
    const closed = code.startsWith(s.quote, s.end - s.quote.length) && s.end - s.quote.length >= s.start + s.quote.length;
    out += code.slice(from, s.start) + s.quote + (s.placeholders.length ? ` ${s.placeholders.join(' ')} ` : '') + (closed ? s.quote : '');
    from = s.end;
  }
  return out + code.slice(from);
}

/**
 * Does the pattern look for string syntax or string text (quotes, backticks, `%` formatting,
 * `{...}` placeholders, or plain words like a password)? Those must see string contents.
 */
function targetsStrings(pattern: string): boolean {
  if (/["'`%]|\\[{$]/.test(pattern)) return true;
  return !/[\\^$.*+?()[\]{}]/.test(pattern.replace(/\|/g, ''));
}

/**
 * Check regex requirements. Patterns that are about comments (they contain `#` or `//`)
 * see the raw code; patterns about strings see comment-free code; all others also have string
 * contents blanked, so `len(` inside a string or comment can't satisfy (or trip) a requirement.
 */
export function checkRequirements(code: string, requirements: CodeRequirement[] = [], language: Language = 'python'): string[] {
  const withoutComments = stripComments(code, language);
  const codeOnly = blankStrings(withoutComments, language);
  return requirements
    .filter((req) => {
      const aboutComments = req.pattern.includes('#') || req.pattern.includes('//');
      const source = aboutComments ? code : targetsStrings(req.pattern) ? withoutComments : codeOnly;
      const found = new RegExp(req.pattern, 'm').test(source);
      return req.forbid ? found : !found;
    })
    .map((req) => req.message);
}

function requirementsFor(level: Level, language: Language): CodeRequirement[] {
  return 'requirements' in level ? (level.requirements?.[language] ?? []) : [];
}

/** Printed between the learner's program and a test harness; only output after it is graded. */
export const HARNESS_MARKER = '@@codegames-harness@@';

/** A per-run marker, so learner code can't print it to fake the harness's output. */
function harnessMarker(): string {
  return `${HARNESS_MARKER}${Math.random().toString(36).slice(2, 10)}`;
}

function withHarness(code: string, harness: string, language: Language, marker: string): string {
  const mark = language === 'python' ? `print("${marker}")` : `console.log("${marker}");`;
  // JS: a block, so a harness `const p = ...` can't clash with the learner's own `p`.
  return `${code}\n${mark}\n${language === 'javascript' ? `{\n${harness}\n}` : harness}\n`;
}

/** The part of the output a harness test grades (everything after the marker), or null if it never ran. */
function harnessOutput(stdout: string, marker: string): string | null {
  const at = stdout.lastIndexOf(marker);
  return at === -1 ? null : stdout.slice(at + marker.length).replace(/^\n/, '');
}

async function runTests(tests: TestCase[], language: Language, code: string, execute: Executor, page?: string): Promise<TestResult[]> {
  const results: TestResult[] = [];
  let timedOut = false;
  for (const test of tests) {
    const expected = expectedFor(test.expectedOutput, language) ?? '';
    if (timedOut) {
      // One infinite loop is enough: don't make the learner wait for every test to time out.
      results.push({ name: test.name, hidden: !!test.hidden, input: test.input, expected: normalizeOutput(expected), actual: '', passed: false, skipped: true, phase: test.phase });
      continue;
    }
    const harness = test.harness?.[language];
    const marker = harnessMarker();
    // Fixed seed: tests must be reproducible even if a program uses randomness.
    const run = await execute(harness ? withHarness(code, harness, language, marker) : code, { stdin: test.input, seed: 1, ...(page !== undefined ? { page } : {}) });
    if (run.error?.kind === 'timeout' || run.error?.kind === 'internal') timedOut = true;
    const harnessed = harness ? harnessOutput(run.stdout, marker) : null;
    const graded = harness ? (harnessed ?? '') : run.stdout;
    let error = run.error;
    // A line past the learner's code is inside the hidden harness: don't point at it.
    if (error?.line && error.line > code.split('\n').length) error = { ...error, line: undefined };
    results.push({
      name: test.name,
      phase: test.phase,
      hidden: !!test.hidden,
      input: test.input,
      expected: normalizeOutput(expected),
      actual: normalizeOutput(graded),
      error,
      passed: !run.error && outputsMatch(graded, expected),
      ...(harness ? { call: harness, mainStopped: harnessed === null } : {}),
    });
  }
  return results;
}

/**
 * Run variants: the same program with different starting values. Returns test results,
 * or blocked messages if the learner changed a line the variants rely on.
 */
/** Match a starting line loosely: any spacing, optional trailing semicolon, not inside a longer name. */
function looseLine(from: string): RegExp {
  const body = from
    .replace(/;\s*$/, '')
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\s+/g, '\\s*')
    .replace(/(=)/g, '\\s*$1\\s*');
  const before = /^[\w$]/.test(from.trimStart()) ? '(?<![\\w$])' : '';
  return new RegExp(before + body + ';?', 'g');
}

/** Is the offset on a line that starts with a comment marker? */
function inCommentLine(code: string, offset: number): boolean {
  const start = code.lastIndexOf('\n', offset - 1) + 1;
  return /^\s*(#|\/\/|\/\*|\*)/.test(code.slice(start, offset + 1));
}

/** Swap starting lines in the learner's code (skipping commented-out copies); reports lines the learner changed. */
function applyReplacements(pairs: [string, string][], code: string): { missing: string[]; changed: string } {
  const firstLive = (from: string, source: string) => [...source.matchAll(looseLine(from))].find((m) => !inCommentLine(source, m.index));
  const missing = pairs.filter(([from]) => !firstLive(from, code)).map(([from]) => from);
  const changed = pairs.reduce((c, [from, to]) => {
    const m = firstLive(from, c);
    return m ? c.slice(0, m.index) + to + c.slice(m.index + m[0].length) : c;
  }, code);
  return { missing, changed };
}

function keepLines(missing: string[]): string[] {
  return missing.map((m) => `Keep the line \`${m}\` as it is: your program is also tested with different starting values.`);
}

async function runVariants(
  variants: CodeVariant[],
  language: Language,
  code: string,
  stdin: string | undefined,
  execute: Executor,
): Promise<{ blocked?: string[]; tests: TestResult[] }> {
  const tests: TestResult[] = [];
  for (const variant of variants) {
    const { missing, changed } = applyReplacements(variant.replace[language] ?? [], code);
    if (missing.length) return { blocked: keepLines(missing), tests };
    const expected = expectedFor(variant.expectedOutput, language) ?? '';
    const run = await execute(changed, { stdin, seed: 1 });
    tests.push({
      name: variant.name,
      hidden: true,
      expected: normalizeOutput(expected),
      actual: normalizeOutput(run.stdout),
      error: run.error,
      passed: !run.error && outputsMatch(run.stdout, expected),
    });
  }
  return { tests };
}

/**
 * Statements that count toward a line budget: lines, plus extra statements packed onto one
 * line with `;` (outside brackets and strings), so `move(); move(); move()` counts as 3.
 */
export function codeLines(code: string, language: Language): number {
  const source = stripComments(code, language).replace(/(["'`])(?:\\.|(?!\1).)*\1/g, '""');
  let count = 0;
  for (const line of source.split('\n')) {
    if (line.trim() === '') continue;
    let depth = 0;
    let segments = 1;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]!;
      if (ch === '(' || ch === '[') depth++;
      else if (ch === ')' || ch === ']') depth--;
      else if (ch === ';' && depth === 0 && line.slice(i + 1).trim() !== '') segments++;
    }
    count += segments;
  }
  return count;
}

/** Grade a learner's submission for any code-writing level (not predict-output). */
export async function gradeSubmission(level: Level, language: Language, code: string, execute: Executor): Promise<GradeResult> {
  if (level.game === 'predict-output') throw new Error('Use gradePrediction for predict-output levels');

  if (hasBlanks(code)) return { passed: false, blocked: ['Fill in every ___ blank first.'], tests: [] };
  const warnings = lintCode(code, language);
  const unmet = checkRequirements(code, requirementsFor(level, language), language);

  const grid = level.game === 'grid-quest' ? level.grid : level.game === 'parsons' ? level.grid : undefined;
  if (grid) {
    // Always run the robot first so the learner can watch what their code does;
    // "how you solved it" requirements only matter once the path works.
    const gridRun = await execute(code, { grid });
    if (!gridRun.grid?.success) return { passed: false, tests: [], gridRun, warnings };
    if (unmet.length) return { passed: false, blocked: unmet, tests: [], gridRun, warnings };
    if (level.game === 'grid-quest' && level.maxLines && codeLines(code, language) > level.maxLines) {
      return {
        passed: false,
        blocked: [`The robot made it, but your program has ${codeLines(code, language)} lines. It can be done in ${level.maxLines} or fewer: look for a repeating pattern to put in a loop.`],
        tests: [],
        gridRun,
        warnings,
      };
    }
    const extraGrids = level.game === 'grid-quest' ? (level.extraGrids ?? []) : [];
    for (const [index, extra] of extraGrids.entries()) {
      const run = await execute(code, { grid: extra });
      if (!run.grid?.success) return { passed: false, tests: [], gridRun, warnings, failedMap: { index: index + 1, outcome: run.grid!, grid: extra } };
    }
    const routeVariants = level.game === 'grid-quest' ? (level.routeVariants ?? []) : [];
    for (const [index, variant] of routeVariants.entries()) {
      const { missing, changed } = applyReplacements(variant.replace[language] ?? [], code);
      if (missing.length) return { passed: false, blocked: keepLines(missing), tests: [], gridRun, warnings };
      const run = await execute(changed, { grid: variant.grid });
      if (!run.grid?.success) {
        return { passed: false, tests: [], gridRun, warnings, failedMap: { index: extraGrids.length + index + 1, outcome: run.grid!, grid: variant.grid, name: variant.name } };
      }
    }
    const expectedOutput = level.game === 'grid-quest' && level.expectedOutput ? expectedFor(level.expectedOutput, language) : undefined;
    if (expectedOutput !== undefined && !outputsMatch(gridRun.stdout, expectedOutput)) {
      return {
        passed: false,
        tests: [],
        gridRun,
        outputMismatch: { expected: normalizeOutput(expectedOutput), actual: normalizeOutput(gridRun.stdout) },
      };
    }
    return { passed: true, tests: [], gridRun };
  }

  const tests = await runTests('tests' in level ? (level.tests ?? []) : [], language, code, execute, 'page' in level ? level.page : undefined);
  // Unmet requirements block a pass, but the test results still show, so a second bug
  // isn't hidden behind the first message (round-5 student).
  if (unmet.length) return { passed: false, blocked: unmet, tests, warnings };
  let passed = tests.length > 0 && tests.every((t) => t.passed);
  if (passed && 'variants' in level && level.variants?.length) {
    const v = await runVariants(level.variants, language, code, undefined, execute);
    if (v.blocked) return { passed: false, blocked: v.blocked, tests, warnings };
    tests.push(...v.tests);
    passed = v.tests.every((t) => t.passed);
  }
  return { passed, tests, warnings: passed ? undefined : warnings };
}

export interface PredictionResult {
  correct: boolean;
  actual: string;
  run: ExecResult;
}

/**
 * Compare a learner's predicted output with what the code really prints. With
 * `expectError`, the run is meant to crash and the expected answer ends with the error's
 * name on its own line (e.g. "IndexError").
 */
export async function gradePrediction(
  code: string,
  stdin: string | undefined,
  prediction: string,
  execute: Executor,
  expectError = false,
  /** For language-aware container comparison (JS object keys may be unquoted). */
  language?: Language,
): Promise<PredictionResult> {
  const run = await execute(code, { stdin, seed: 1 });
  const actual = expectError && run.error ? `${run.stdout}${run.stdout && !run.stdout.endsWith('\n') ? '\n' : ''}${run.error.name}` : run.stdout;
  // Crashes are part of the answer, but never timeouts or engine failures. (Some programs
  // crash in Python yet run in JavaScript, e.g. reading past the end of a list.)
  const clean = expectError ? !run.error || !['timeout', 'internal', 'output-limit'].includes(run.error.kind) : !run.error;
  // Typing what Python actually prints ("IndexError: list index out of range") is right too.
  const name = expectError && run.error ? run.error.name : undefined;
  const lines = prediction.replace(/\s+$/, '').split('\n');
  if (name && lines.at(-1)!.trim().startsWith(`${name}:`)) lines[lines.length - 1] = name;
  return { correct: clean && outputsMatch(looseContainers(lines.join('\n'), language), looseContainers(actual, language)), actual: normalizeOutput(actual), run };
}

/** Grade the PRIMM "Modify" step of a predict-output level. */
export async function gradeModify(level: Level, language: Language, code: string, execute: Executor): Promise<GradeResult> {
  if (level.game !== 'predict-output' || !level.modify) throw new Error('Level has no modify step');
  if (hasBlanks(code)) return { passed: false, blocked: ['Fill in every ___ blank first.'], tests: [] };
  const unmet = checkRequirements(code, level.modify.requirements?.[language] ?? [], language);
  if (unmet.length) return { passed: false, blocked: unmet, tests: [] };
  const tests = await runTests(
    [{ name: 'prints the new output', expectedOutput: level.modify.expectedOutput, input: level.stdin }],
    language,
    code,
    execute,
  );
  if (tests.every((t) => t.passed) && level.modify.variants?.length) {
    const v = await runVariants(level.modify.variants, language, code, level.stdin, execute);
    if (v.blocked) return { passed: false, blocked: v.blocked, tests };
    tests.push(...v.tests);
  }
  return { passed: tests.every((t) => t.passed), tests };
}

/** Build a Parsons program from the learner's chosen lines. */
export function assembleParsons(lines: string[]): string {
  return lines.join('\n') + '\n';
}

/** Lines a Parsons level presents (solution lines plus distractors), excluding blank lines. */
export function parsonsLines(solution: string, distractors: string[] = []): string[] {
  return [...solution.split('\n').filter((l) => l.trim() !== ''), ...distractors];
}
