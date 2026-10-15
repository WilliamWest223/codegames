/// <reference lib="webworker" />
import { runJavaScript } from '@codegames/runtime/javascript';
import { ASYNC_GRACE_MS, collectAsyncErrors } from './asyncErrors';
import { lockDown } from './lockdown';
import type { RunMessage } from './protocol';

// Before any learner code: take the only copy of postMessage and remove the network
// (round-8 P1-1/P1-2). Results carry the run's nonce, which learner code can't see.
const post = lockDown();
const asyncErrors = collectAsyncErrors(self);

self.addEventListener('message', async (event: MessageEvent<RunMessage>) => {
  const { id, nonce, code, options } = event.data;
  const result = runJavaScript(code, options);
  // Give rejected promises and quick timers a moment to fail, and report them (round-8 P2).
  await new Promise((resolve) => setTimeout(resolve, ASYNC_GRACE_MS));
  const late = asyncErrors.take();
  post({ type: 'result', id, nonce, result: late.length ? { ...result, stderr: (result.stderr ?? '') + late.map((m) => `${m}\n`).join('') } : result });
});

post({ type: 'ready' });
