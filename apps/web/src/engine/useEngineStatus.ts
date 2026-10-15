import { useCallback, useEffect, useState } from 'react';
import type { PlayableLanguage } from '@codegames/shared';
import { engines, type EngineStatus } from './index';

/** Live status of a language's engine (and a retry for load failures); also starts loading it. */
export function useEngineStatus(language: PlayableLanguage): { status: EngineStatus; retry: () => void } {
  const host = engines[language];
  const [status, setStatus] = useState<EngineStatus>(host.status);
  useEffect(() => {
    setStatus(host.status);
    const unsubscribe = host.subscribe(setStatus);
    void host.warmUp().catch(() => undefined);
    return () => {
      unsubscribe();
    };
  }, [host]);
  const retry = useCallback(() => void host.warmUp().catch(() => undefined), [host]);
  return { status, retry };
}
