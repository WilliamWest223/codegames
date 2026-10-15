import { RUNNER_PORT, type RunRequest, type RunResult } from '@codegames/shared';

/** Sends code to the local runner server (apps/runner) for compiled languages. Not used by V1 levels yet. */
export async function runOnRunner(request: RunRequest): Promise<RunResult> {
  const res = await fetch(`http://127.0.0.1:${RUNNER_PORT}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error(`Runner error: ${res.status} ${await res.text()}`);
  return (await res.json()) as RunResult;
}
