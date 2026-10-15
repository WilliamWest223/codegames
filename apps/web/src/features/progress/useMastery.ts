import { useMemo, useState } from 'react';
import { computeMastery, conceptsFor, levelsFor, pickReview, REVIEW_MIN_CONCEPTS, type MasteryLevel } from '@codegames/curriculum';
import { PLAYABLE_LANGUAGES, type PlayableLanguage } from '@codegames/shared';
import { useProgress } from './store';
import { useAuth } from '../auth/useAuth';

/** Mastery of every concept for one language, recomputed when progress changes. */
export function useMastery(language: PlayableLanguage): Record<string, MasteryLevel> {
  const completed = useProgress((s) => s.completed[language]);
  const reviews = useProgress((s) => s.reviews[language]);
  const transfer = useTransfer(language);
  const isAdmin = useAuth((s) => s.isAdmin);
  const simulatePlayer = useAuth((s) => s.simulatePlayer);
  const isMasterUnlocked = (isAdmin && !simulatePlayer) || (useAuth.getState().isAdmin && !useAuth.getState().simulatePlayer);
  return useMemo(() => {
    if (isMasterUnlocked) {
      const allConcepts = conceptsFor(language);
      const full: Record<string, MasteryLevel> = {};
      for (const c of allConcepts) {
        full[c.id] = 'proficient';
      }
      return full;
    }
    return computeMastery(conceptsFor(language), levelsFor(language), new Set(Object.keys(completed)), reviewCounts(reviews), transfer, weakLevels(completed));
  }, [completed, reviews, transfer, language, isMasterUnlocked]);
}

/** Concepts practiced in the *other* language(s), which unlock prerequisites here too. */
export function useTransfer(language: PlayableLanguage): Set<string> {
  const completed = useProgress((s) => s.completed);
  return useMemo(() => {
    const out = new Set<string>();
    for (const other of PLAYABLE_LANGUAGES) {
      if (other === language) continue;
      const m = computeMastery(conceptsFor(other), levelsFor(other), new Set(Object.keys(completed[other])));
      for (const [id, level] of Object.entries(m)) if (level === 'practiced' || level === 'proficient') out.add(id);
    }
    return out;
  }, [completed, language]);
}

/** Only spaced reviews count toward Proficient (a back-to-back replay isn't retrieval practice). */
export function reviewCounts(reviews: Record<string, { spaced?: number }>): Record<string, number> {
  return Object.fromEntries(Object.entries(reviews).map(([id, r]) => [id, r?.spaced ?? 0]));
}

/** Warm-up picks for the learner right now (empty until enough concepts are practiced). */
export function useReviewPicks(language: PlayableLanguage) {
  const completed = useProgress((s) => s.completed[language]);
  const reviews = useProgress((s) => s.reviews[language]);
  const mastery = useMastery(language);
  // "Now" is taken when the screen mounts; that's precise enough for day-scale spacing.
  const [now] = useState(() => Date.now());
  return useMemo(() => {
    const completedAt = Object.fromEntries(Object.entries(completed).map(([id, c]) => [id, c.at]));
    const picks = pickReview(conceptsFor(language), levelsFor(language), mastery, completedAt, reviews, now, 3, weakLevels(completed));
    return picks.length >= REVIEW_MIN_CONCEPTS ? picks : [];
  }, [completed, reviews, mastery, now, language]);
}

/** The level a learner should play next: first unfinished level of the first open concept. */
export function useNextLevel(language: PlayableLanguage) {
  const completed = useProgress((s) => s.completed[language]);
  const mastery = useMastery(language);
  return useMemo(() => {
    const concepts = conceptsFor(language);
    const levels = levelsFor(language);
    const open = (l: (typeof levels)[number]) => !completed[l.id] && !!mastery[l.conceptId] && mastery[l.conceptId] !== 'locked';
    // Pick up where the learner left off: the concept of their latest completion first.
    const latest = Object.entries(completed).reduce<[string, number] | undefined>(
      (best, [id, c]) => (!best || c.at > best[1] ? [id, c.at] : best),
      undefined,
    );
    const latestConcept = latest && levels.find((l) => l.id === latest[0])?.conceptId;
    const core = (l: (typeof levels)[number]) => open(l) && l.role !== 'challenge';
    return (
      levels.find((l) => l.conceptId === latestConcept && core(l)) ??
      // Then the first core level on the map; side quests and optional challenges come last.
      [...concepts.filter((c) => !c.sideQuest), ...concepts.filter((c) => c.sideQuest)]
        .map((c) => levels.find((l) => l.conceptId === c.id && core(l)))
        .find(Boolean) ??
      levels.find(open)
    );
  }, [completed, mastery, language]);
}

/** Concepts currently due for a warm-up review (for the map's "due" markers). */
export function useDueConcepts(language: PlayableLanguage): Set<string> {
  const completed = useProgress((s) => s.completed[language]);
  const reviews = useProgress((s) => s.reviews[language]);
  const mastery = useMastery(language);
  const [now] = useState(() => Date.now());
  return useMemo(() => {
    const completedAt = Object.fromEntries(Object.entries(completed).map(([id, c]) => [id, c.at]));
    return new Set(pickReview(conceptsFor(language), levelsFor(language), mastery, completedAt, reviews, now, Infinity, weakLevels(completed)).map((p) => p.concept.id));
  }, [completed, reviews, mastery, now, language]);
}

/**
 * Levels finished with help (fewer than 3 stars): they come back sooner in warm-ups and
 * don't count toward Proficient.
 */
export function weakLevels(completed: Record<string, { stars?: number }>): Set<string> {
  return new Set(Object.entries(completed).filter(([, c]) => (c.stars ?? 3) < 3).map(([id]) => id));
}
