import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { loadPyodide, type PyodideInterface } from 'pyodide';
import { runJavaScript } from './javascript';
import { runPython } from './python';
import type { Executor } from './grade';

let instance: Promise<PyodideInterface> | undefined;

/** One shared Pyodide per Node process (loading takes a couple of seconds). */
export function getNodePyodide(): Promise<PyodideInterface> {
  // Pyodide's own path detection breaks under Vitest's transforms, so point it at the package.
  const indexURL = dirname(createRequire(import.meta.url).resolve('pyodide/package.json')) + '/';
  instance ??= loadPyodide({ indexURL });
  return instance;
}

/** Executors for Node (tests and tooling). In the browser, the web app uses Web Workers instead. */
export async function nodeExecutors(): Promise<{ javascript: Executor; python: Executor }> {
  const pyodide = await getNodePyodide();
  return {
    javascript: async (code, options) => runJavaScript(code, options),
    python: (code, options) => runPython(pyodide, code, options),
  };
}
