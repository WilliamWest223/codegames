import { explainError, type ExecResult } from '@codegames/runtime';

/** A result for a run the worker could not complete (so the host need not wait for the timeout). */
export function internalFailure(e: unknown): ExecResult {
  const message = e instanceof Error ? e.message : String(e);
  return { stdout: '', durationMs: 0, error: { kind: 'internal', name: 'InternalError', message: message.slice(0, 500), friendly: explainError('InternalError') } };
}
