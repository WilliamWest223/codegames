import { beforeEach, describe, expect, it } from 'vitest';
import { useProgress } from '../store';

describe('resetLevelHelp (try again from scratch)', () => {
  beforeEach(() => useProgress.getState().resetProgress());

  it('clears this level\'s help and draft but keeps the completion and best stars', () => {
    const s = useProgress.getState();
    s.recordAttempt('python', 'loops-2');
    s.recordHints('python', 'loops-2', 3);
    s.recordReveal('python', 'loops-2');
    s.saveDraft('python', 'loops-2', 'print(1)');
    s.completeLevel('python', 'loops-2', 10, { used: 3, total: 3, revealed: true });
    s.saveDraft('python', 'loops-2', 'print(2)');
    s.recordHints('python', 'loops-2', 2);
    s.recordAttempt('python', 'loops-2');
    // Another level and the other language are untouched.
    s.saveDraft('python', 'loops-3', 'keep');
    s.recordHints('javascript', 'loops-2', 1);

    useProgress.getState().resetLevelHelp('python', 'loops-2');
    const after = useProgress.getState();
    expect(after.completed.python['loops-2']?.stars).toBe(1);
    expect(after.drafts['python:loops-2']).toBeUndefined();
    expect(after.hints['python:loops-2']).toBeUndefined();
    expect(after.attempts['python:loops-2']).toBeUndefined();
    expect(after.reveals['python:loops-2']).toBeUndefined();
    expect(after.drafts['python:loops-3']).toBe('keep');
    expect(after.hints['javascript:loops-2']).toBe(1);
  });

  it('lets a clean replay raise the best stars to 3', () => {
    const s = useProgress.getState();
    s.completeLevel('python', 'loops-2', 10, { used: 3, total: 3, revealed: false });
    expect(useProgress.getState().completed.python['loops-2']?.stars).toBe(2);
    s.recordHints('python', 'loops-2', 3);
    useProgress.getState().resetLevelHelp('python', 'loops-2');
    const result = useProgress.getState().completeLevel('python', 'loops-2', 10, { used: 0, total: 3, revealed: false });
    expect(result).toEqual({ firstTime: false, stars: 3, improved: true });
    expect(useProgress.getState().completed.python['loops-2']?.stars).toBe(3);
  });
});
