import type { Level, PlayableLanguage } from '@codegames/shared';

/** Robot levels: lines used vs. the par (the reference solution's length). */
export interface ParResult {
  lines: number;
  target: number;
}

export interface GameProps<L extends Level = Level> {
  level: L;
  language: PlayableLanguage;
  /**
   * The learner solved the level. Progress is saved immediately. The celebration shows
   * at once, or, with `deferCelebration`, when the game calls the returned function
   * (e.g. when the robot replay actually reaches the end).
   */
  onPass: (options?: { deferCelebration?: boolean; par?: ParResult }) => () => void;
  /** A check failed (counts attempts; unlocks hint nudges). `run` = a free exploratory robot run. */
  onFail: (kind?: 'check' | 'run') => void;
  /** The learner used a "show me" reveal (counts like a hint). */
  onReveal?: () => void;
  /** The learner switched to a scaffold (e.g. the puzzle version): counts like the answer hint. */
  onScaffold?: () => void;
  /** Prefix for saved drafts, so e.g. warm-up reviews start fresh instead of from the old answer. */
  draftScope?: string;
}
