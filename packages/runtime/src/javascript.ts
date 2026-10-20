import { parse } from 'acorn';
import { JS_KNOWN, closest, findBracketProblem, identifiersIn } from './brackets';
import { GridError, GridWorld, gridBindings } from './grid';
import { MiniDocument, domBindings } from './dom';
import { MAX_ERROR_MESSAGE, clampStdin, clipText } from './limits';
import { MAX_ARRAY_ELEMENTS, withAllocationBudget } from './budget';
import { blockedFunction, noStringTimers, withClosedEscapes } from './sandbox';
import { explainError, kindForError, refineExplanation } from './errors';
import { PREVIEW_LIMIT, TrackedProxy, formatLogArgs, formatValue } from './format';
import { TRACE_NAMES, instrumentJavaScript } from './trace';
import {
  DEFAULT_MAX_OUTPUT,
  MAX_TRACE_FRAMES,
  MAX_TRACE_STEPS,
  OutputLimitError,
  type ExecError,
  type ExecOptions,
  type ExecResult,
  type InputEvent,
  type TraceFrame,
  type TraceStep,
} from './types';

/** Small deterministic PRNG (mulberry32) for seeded runs. */
function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Lines that `new Function` adds before the learner's code:
 * `function anonymous(args\n) {\n` plus our "use strict" line.
 */
const LINE_OFFSET = 3;

function lineFromStack(stack: string | undefined): number | undefined {
  const match = stack?.match(/<anonymous>:(\d+):\d+/);
  if (!match) return undefined;
  const line = Number(match[1]) - LINE_OFFSET;
  return line > 0 ? line : undefined;
}

/** V8 doesn't report where a syntax error is; a real parser does. */
function syntaxErrorLine(code: string): number | undefined {
  try {
    parse(code, { ecmaVersion: 'latest', sourceType: 'script', allowReturnOutsideFunction: true });
  } catch (e) {
    const loc = (e as { loc?: { line: number } }).loc;
    return loc?.line;
  }
  return undefined;
}

/** Thrown when the program reads more input than the test provides. */
class InputError extends Error {
  constructor() {
    super('No more input: prompt() was called more times than there are input lines.');
    this.name = 'InputError';
  }
}

/** Thrown by the tracer to stop a traced run at MAX_TRACE_STEPS; never reported as an error. */
class TraceLimit {}

type VarReader = () => [string, unknown][];
interface LiveFrame {
  id: number;
  name: string;
  /** Reads the call's variables; set by its most recent step (which sees its inner blocks). */
  read?: VarReader;
}

function formatVars(read: VarReader | undefined): [string, string][] {
  if (!read) return [];
  return read()
    .filter(([, v]) => typeof v !== 'function')
    .map(([n, v]): [string, string] => {
      let text: string;
      try {
        // Capped while formatting, so a huge list costs the same on every step (round-8 P1-6).
        text = formatValue(v, true, new Set(), PREVIEW_LIMIT);
      } catch {
        text = '?';
      }
      return [n, text.length > 80 ? `${text.slice(0, 77)}...` : text];
    });
}

/**
 * Run learner JavaScript synchronously. Callers are responsible for isolation
 * and timeouts (the web app runs this inside a Web Worker it can terminate).
 */
export function runJavaScript(code: string, options: ExecOptions = {}): ExecResult {
  const started = Date.now();
  const maxOutput = options.maxOutput ?? DEFAULT_MAX_OUTPUT;
  let stdout = '';
  let stderr = '';
  // Remembered here because the learner's own try/catch can swallow the OutputLimitError.
  let overflowed = false;
  const write = (text: string) => {
    stdout += text;
    if (stdout.length > maxOutput) {
      overflowed = true;
      throw new OutputLimitError();
    }
  };
  const log = (...args: unknown[]) => write(formatLogArgs(args) + '\n');
  // Like the real console: warnings and errors don't go to standard output.
  const logErr = (...args: unknown[]) => {
    if (stderr.length < maxOutput) stderr += formatLogArgs(args) + '\n';
  };
  const consoleShim = { log, info: log, debug: log, warn: logErr, error: logErr };

  const stdinLines = clampStdin(options.stdin);
  const inputs: InputEvent[] = [];
  /** `prompt()` returns the next line of input, like a browser prompt the test fills in. */
  const prompt = (message?: unknown) => {
    // Recorded even when no input is left, so a waiting program's question can be shown.
    inputs.push({ offset: stdout.length, prompt: message === undefined ? '' : String(message) });
    if (!stdinLines.length) throw new InputError();
    return stdinLines.shift()!;
  };
  // A Math whose random() is seeded when asked to be, so re-runs and tests are reproducible.
  const seededMath = options.seed === undefined ? Math : Object.assign(Object.create(Math) as Math, { random: seededRandom(options.seed) });

  const world = options.grid ? new GridWorld(options.grid) : undefined;
  const page = options.page !== undefined ? new MiniDocument(options.page) : undefined;
  const callerLine = () => lineFromStack(new Error().stack?.split('\n').slice(2).join('\n'));
  const bindings: Record<string, unknown> = {
    // Hide the worker's messaging and globals so learner code can't fake results.
    self: undefined,
    globalThis: undefined,
    postMessage: undefined,
    close: undefined,
    importScripts: undefined,
    // A string of code would run in the global scope; functions only (round-8 P1-1).
    setTimeout: noStringTimers(globalThis.setTimeout, 'setTimeout'),
    setInterval: noStringTimers(globalThis.setInterval, 'setInterval'),
    Function: blockedFunction,
    console: consoleShim,
    prompt,
    Math: seededMath,
    // Remembers proxies' targets so printing one never runs its traps (as in Node).
    Proxy: TrackedProxy,
    ...(world ? gridBindings(world, callerLine) : {}),
    ...(page ? domBindings(page, log) : {}),
  };
  // Step-through: record each statement's line, the call stack and its variables (see trace.ts).
  const trace: TraceStep[] = [];
  let traceTruncated = false;
  const runnable = options.trace ? (instrumentJavaScript(code) ?? code) : code;
  if (options.trace) {
    const topFrame: LiveFrame = { id: 0, name: '' };
    const frames: LiveFrame[] = [topFrame];
    let nextFrame = 1;
    // Formatting never calls learner code, but if anything ever does, it must not record steps.
    let inStep = false;
    bindings[TRACE_NAMES.top] = topFrame;
    // First thing in every catch block: once the trace is cut, keep stopping the program.
    bindings[TRACE_NAMES.check] = () => {
      if (traceTruncated) throw new TraceLimit();
    };
    bindings[TRACE_NAMES.enter] = (name: string): LiveFrame => {
      const frame = { id: nextFrame++, name };
      frames.push(frame);
      return frame;
    };
    bindings[TRACE_NAMES.leave] = (frame: LiveFrame) => {
      const at = frames.lastIndexOf(frame);
      if (at > 0) frames.length = at;
    };
    bindings[TRACE_NAMES.step] = (line: number, scope: string, read: VarReader, frame: LiveFrame | null) => {
      if (inStep) return;
      if (trace.length >= MAX_TRACE_STEPS) {
        // Stop the program: a trace is a visualisation, and an endless loop should show its first steps.
        traceTruncated = true;
        throw new TraceLimit();
      }
      inStep = true;
      try {
        let live: LiveFrame[];
        if (frame) {
          frame.read = read;
          live = frames.slice(0, frames.lastIndexOf(frame) + 1);
        } else {
          // A generator or async function: no frame of its own, so show one for this step.
          live = [...frames, { id: -line, name: scope, read }];
        }
        const stack: TraceFrame[] = live
          .slice(-MAX_TRACE_FRAMES)
          .reverse()
          .map((f) => ({ name: f.name, id: f.id, vars: formatVars(f.read) }));
        trace.push({ line, scope, vars: stack[0]!.vars, stack, depth: live.length, out: stdout.length });
      } finally {
        inStep = false;
      }
    };
  }
  const names = Object.keys(bindings);

  let error: ExecError | undefined;
  try {
    const fn = new Function(...names, 'Array', `"use strict";\n${runnable}`);
    // Array growth is budgeted so a runaway stops with a MemoryError instead of crashing the tab.
    // Function constructors and eval are closed while it runs, so it can't reach the real global.
    withClosedEscapes(() =>
      withAllocationBudget(MAX_ARRAY_ELEMENTS, (ArrayBinding) => {
        fn(...names.map((n) => bindings[n]), ArrayBinding);
        // Play it: the clicks and typing so far, handled by the listeners the program just set up.
        if (page && options.events?.length) page.replay(options.events);
      }),
    );
  } catch (e) {
    if (e instanceof TraceLimit) return finish(undefined);
    const err = e instanceof Error ? e : new Error(String(e));
    // The learner controls the message and the name: cap them before anything else reads them.
    const name = err instanceof GridError ? 'GridError' : clipText(String(err.name), 100);
    const message = clipText(String(err.message), MAX_ERROR_MESSAGE);
    let friendly = explainError(name, message, 'javascript');
    let line = err instanceof SyntaxError ? syntaxErrorLine(code) : lineFromStack(err.stack);
    if (err instanceof SyntaxError) {
      // A missing } is reported at the end of the file; point at the bracket instead.
      const bracket = findBracketProblem(code, 'javascript');
      if (bracket) {
        friendly = bracket.message;
        line = bracket.line;
      }
    }
    // "Did you mean …?" for misspelled names and methods.
    const unknown = message.match(/^([\w$]+) is not defined/)?.[1] ?? message.match(/\.([\w$]+) is not a function/)?.[1];
    const suggestion = unknown ? closest(unknown, new Set([...identifiersIn(code), ...JS_KNOWN])) : undefined;
    if (suggestion) friendly += ` Did you mean \`${suggestion}\`?`;
    const base = { kind: kindForError(name), name, message, line, friendly };
    // Keep "did you mean" suggestions found above unless the code gives a sharper answer.
    const refined = refineExplanation(base, code, 'javascript', suggestion);
    error = { ...base, friendly: refined === friendly ? friendly : refined };
  }
  return finish(error);

  function finish(caught: ExecError | undefined): ExecResult {
    let error = caught;
    if (overflowed && !error) {
      const limit = new OutputLimitError();
      error = { kind: kindForError(limit.name), name: limit.name, message: limit.message, friendly: explainError(limit.name, limit.message, 'javascript') };
    }
    // The last write may overshoot the limit; the result never carries more than `maxOutput`.
    return {
    stdout: stdout.length > maxOutput ? stdout.slice(0, maxOutput) : stdout,
    stderr: stderr ? stderr.slice(0, maxOutput) : undefined,
    inputs,
    error,
    grid: world?.outcome(error?.kind === 'robot' ? error.message : error ? 'Your program stopped with an error.' : undefined),
    durationMs: Date.now() - started,
    ...(options.trace ? { trace, traceTruncated } : {}),
    ...(page ? { page: page.snapshot() } : {}),
    };
  }
}
