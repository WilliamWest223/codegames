/**
 * Errors learner JavaScript throws after its synchronous part has finished, from a rejected
 * Promise or a timer callback (round-8 P2). Without this they vanished: the result had already
 * been posted. The worker waits a moment after each run, collects them, and reports them on
 * stderr (shown to the learner, never graded). `preventDefault` keeps them from reaching the
 * host as a worker crash.
 */

/** How long the worker waits for asynchronous errors before posting a result. */
export const ASYNC_GRACE_MS = 50;

function describe(reason: unknown): string {
  if (reason instanceof Error) return `${reason.name}: ${reason.message}`;
  try {
    return String(reason);
  } catch {
    return 'an error';
  }
}

/** Start listening on `scope`; `take()` returns (and clears) what was caught since last time. */
export function collectAsyncErrors(scope: EventTarget): { take: () => string[] } {
  let caught: string[] = [];
  scope.addEventListener('unhandledrejection', (event) => {
    event.preventDefault();
    caught.push(`Uncaught (in promise) ${describe((event as Event & { reason?: unknown }).reason)}`);
  });
  scope.addEventListener('error', (event) => {
    event.preventDefault();
    const e = event as Event & { error?: unknown; message?: string };
    caught.push(`Uncaught ${e.error !== undefined ? describe(e.error) : (e.message ?? 'error')}`);
  });
  return {
    take() {
      const out = caught;
      caught = [];
      return out;
    },
  };
}
