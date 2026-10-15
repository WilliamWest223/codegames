import type { ExecOptions, ExecResult } from '@codegames/runtime';

export interface RunMessage {
  type: 'run';
  id: number;
  /** Per-run secret: the host only accepts a result that echoes it (learner code never sees it). */
  nonce: string;
  code: string;
  options: ExecOptions;
}

/** Python only: a shared flag the host sets to interrupt a runaway program (needs cross-origin isolation). */
export interface InterruptBufferMessage {
  type: 'interrupt-buffer';
  buffer: Int32Array;
}

export type HostMessage = RunMessage | InterruptBufferMessage;

export type WorkerMessage =
  | { type: 'ready' }
  | { type: 'load-error'; message: string }
  | { type: 'result'; id: number; nonce: string; result: ExecResult };
