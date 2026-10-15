import type { GridSpec } from '@codegames/shared';
import type { GridOutcome } from './grid';
import type { DomEvent, PageNode } from './dom';

export interface ExecOptions {
  /** stdin, one value per line. */
  stdin?: string;
  /** If set, robot commands are available and the outcome is reported. */
  grid?: GridSpec;
  /** Max characters of output before the program is stopped. */
  maxOutput?: number;
  /**
   * Seed for random numbers. Same seed → same "random" values, which tests and the
   * Play-it console (it re-runs the program) rely on. Omit for real randomness.
   */
  seed?: number;
  /** Record a step-through trace (line, variables, output so far) for the visualizer. */
  trace?: boolean;
  /**
   * Web Pages levels: the page's starting HTML. The program gets a `document` for it (see
   * dom.ts) and the result carries a snapshot of the page afterwards.
   */
  page?: string;
  /** With `page`: interactions replayed after the program has run (Play it). */
  events?: DomEvent[];
}

/** One active call in a traced run's call stack. */
export interface TraceFrame {
  /** Function name, '' for the top level. Python class bodies are `class Name`. */
  name: string;
  /** Identifies this call within the run, so the visualizer compares a frame with itself. */
  id: number;
  /** The call's own variables, formatted like the language prints them (strings quoted). */
  vars: [string, string][];
}

/** One step of a traced run: the line about to run and the variables at that moment. */
export interface TraceStep {
  /** 1-based learner line about to run; -1 for the final state after the program ends. */
  line: number;
  /** Enclosing function name, or '' at the top level (= `stack[0].name`). */
  scope: string;
  /** Variables of the current call (= `stack[0].vars`). */
  vars: [string, string][];
  /**
   * Active calls, newest first; the last one is the top level. Holds at most
   * MAX_TRACE_FRAMES frames (the newest ones); `depth` counts them all.
   */
  stack: TraceFrame[];
  /** How many calls were active, including any left out of `stack`. */
  depth: number;
  /** How much of stdout had been printed at this step. */
  out: number;
}

/**
 * A traced run stops after this many steps. It is a visualisation, not a grade, so an
 * endless loop shows its first steps instead of timing out.
 */
export const MAX_TRACE_STEPS = 1000;
/** Most call-stack frames recorded per step, so runaway recursion stays readable. */
export const MAX_TRACE_FRAMES = 50;

/** When the program read a line of input: output length at that moment, and its prompt text. */
export interface InputEvent {
  offset: number;
  prompt: string;
}

export type ExecErrorKind = 'syntax' | 'runtime' | 'timeout' | 'output-limit' | 'robot' | 'internal';

export interface ExecError {
  kind: ExecErrorKind;
  /** Error class name, e.g. NameError, ReferenceError. */
  name: string;
  message: string;
  /** 1-based line in the learner's code, when known. */
  line?: number;
  /** Beginner-friendly explanation of what this error usually means. */
  friendly: string;
}

export interface ExecResult {
  stdout: string;
  /** Warnings and console.error output: shown to the learner, never graded. */
  stderr?: string;
  /** Each input read, for building an interactive transcript. */
  inputs?: InputEvent[];
  error?: ExecError;
  grid?: GridOutcome;
  durationMs: number;
  /** With `trace`: the steps, and whether the run was stopped at MAX_TRACE_STEPS. */
  trace?: TraceStep[];
  traceTruncated?: boolean;
  /** With `page`: the page after the program and any replayed events. */
  page?: PageNode;
}

export const DEFAULT_MAX_OUTPUT = 20_000;

/** Thrown internally when a program prints too much. */
export class OutputLimitError extends Error {
  constructor() {
    super('Your program printed too much output. Is there an infinite loop?');
    this.name = 'OutputLimitError';
  }
}
