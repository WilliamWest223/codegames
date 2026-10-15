import { useCallback, useEffect, useRef, useState } from 'react';
import type { PlayableLanguage } from '@codegames/shared';
import { draftKey, MAX_DRAFT_CHARS, useProgress } from '../progress/store';

/** Saving rewrites all progress, so typing is saved after a short pause, not per keystroke. */
const SAVE_DELAY_MS = 400;

/** Editor contents for a level, saved locally so a refresh never loses work. */
export function useDraft(levelId: string, language: PlayableLanguage, starter: string) {
  const saved = useProgress((s) => s.drafts[draftKey(language, levelId)]);
  const saveDraft = useProgress((s) => s.saveDraft);
  const clearDraft = useProgress((s) => s.clearDraft);
  const [code, setCode] = useState(saved ?? starter);
  const pending = useRef<{ timer: ReturnType<typeof setTimeout>; save: () => void } | null>(null);

  const flush = useCallback(() => {
    if (!pending.current) return;
    clearTimeout(pending.current.timer);
    pending.current.save();
    pending.current = null;
  }, []);

  // Leaving the level or closing the tab saves whatever is pending.
  useEffect(() => {
    window.addEventListener('pagehide', flush);
    const handleFill = (e: Event) => {
      const custom = e as CustomEvent<{ solution: string; levelId: string; language: string }>;
      if (custom.detail?.solution && (custom.detail.levelId === levelId || levelId.endsWith(custom.detail.levelId))) {
        setCode(custom.detail.solution);
      }
    };
    window.addEventListener('codegames:fill-solution', handleFill);

    return () => {
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('codegames:fill-solution', handleFill);
      flush();
    };
  }, [flush, language, levelId]);

  const update = useCallback(
    (next: string) => {
      setCode(next);
      if (pending.current) clearTimeout(pending.current.timer);
      // Over the cap the draft is simply not saved (the store refuses it too); the editor keeps working.
      const save = () => {
        if (next.length <= MAX_DRAFT_CHARS) saveDraft(language, levelId, next);
      };
      pending.current = { save, timer: setTimeout(() => { pending.current = null; save(); }, SAVE_DELAY_MS) };
    },
    [language, levelId, saveDraft],
  );

  const reset = useCallback(() => {
    if (pending.current) clearTimeout(pending.current.timer);
    pending.current = null;
    setCode(starter);
    clearDraft(language, levelId);
  }, [starter, language, levelId, clearDraft]);

  return { code, setCode: update, reset };
}
