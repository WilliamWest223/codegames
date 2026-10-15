import type { Executor } from '@codegames/runtime';
import type { PlayableLanguage } from '@codegames/shared';
import { WorkerHost } from './host';

export type { EngineStatus } from './host';

/** One worker per playable language, created lazily. Java/C++ go through `runner.ts` (later). */
export const engines: Record<PlayableLanguage, WorkerHost> = {
  javascript: new WorkerHost(() => new Worker(new URL('./js.worker.ts', import.meta.url), { type: 'module' }), {
    timeoutMs: 3000,
    freshWorkerPerRun: true,
  }),
  python: new WorkerHost(() => new Worker(new URL('./py.worker.ts', import.meta.url), { type: 'module' }), { timeoutMs: 6000, interruptible: true }),
};

export function executorFor(language: PlayableLanguage): Executor {
  const host = engines[language];
  return (code, options) => host.run(code, options);
}
