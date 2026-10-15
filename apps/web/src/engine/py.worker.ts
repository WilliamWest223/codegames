/// <reference lib="webworker" />
import type { PyodideInterface } from 'pyodide';
import { runPython } from '@codegames/runtime/python';
import { lockDown } from './lockdown';
import type { HostMessage, WorkerMessage } from './protocol';

/** Pyodide is served from /pyodide/ (copied from node_modules by scripts/copy-pyodide.mjs). */
async function load(): Promise<PyodideInterface> {
  const indexURL = new URL(`${import.meta.env.BASE_URL}pyodide/`, self.location.origin).href;
  const module = (await import(/* @vite-ignore */ `${indexURL}pyodide.mjs`)) as typeof import('pyodide');
  return module.loadPyodide({ indexURL });
}

// Until Pyodide has loaded (it needs fetch), only this worker's own code runs. Then the worker
// is locked down before the first learner run (round-8 P1-1/P1-2): learner Python that reaches
// the JS global (`import js`) finds no postMessage and no network.
let post: (msg: WorkerMessage) => void = (msg) => self.postMessage(msg);
const pyodide = load().then((py) => {
  post = lockDown();
  return py;
});
pyodide.then(
  () => post({ type: 'ready' }),
  (e: unknown) => post({ type: 'load-error', message: e instanceof Error ? e.message : String(e) }),
);

self.addEventListener('message', async (event: MessageEvent<HostMessage>) => {
  const message = event.data;
  if (message.type === 'interrupt-buffer') {
    // Python checks this flag while it runs: the host sets it to 2 (SIGINT) to stop a runaway loop.
    (await pyodide).setInterruptBuffer(message.buffer);
    return;
  }
  const { id, nonce, code, options } = message;
  const result = await runPython(await pyodide, code, options);
  post({ type: 'result', id, nonce, result });
});
