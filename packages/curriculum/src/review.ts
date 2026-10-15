import type { Concept, Level } from '@codegames/shared';
import { atLeast, type MasteryLevel } from './mastery';

/** Quick game types suited to warm-up review (a minute or two each). */
const QUICK_GAMES: Level['game'][] = ['predict-output', 'parsons'];

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

/**
 * Spaced-review schedule: after the Nth review, a concept is due again after
 * REVIEW_INTERVALS[N] (the last interval repeats). The first review is due shortly
 * after the concept was practiced, so new learners meet warm-ups in their first session.
 */
export const REVIEW_INTERVALS = [10 * MINUTE, 1 * DAY, 3 * DAY, 7 * DAY, 14 * DAY];

export interface ReviewRecord {
  /** All completed reviews (drives the schedule and puzzle rotation). */
  count: number;
  at: number;
  /** Reviews done at least SPACED_GAP after the previous touch: only these count toward Proficient. */
  spaced?: number;
}

/** A review only counts as retrieval practice after a real gap. */
export const SPACED_GAP = 20 * 60 * MINUTE;

export interface ReviewPick {
  concept: Concept;
  level: Level;
}

export function reviewInterval(count: number): number {
  return REVIEW_INTERVALS[Math.min(count, REVIEW_INTERVALS.length - 1)]!;
}

/** Puzzles a concept can be reviewed with: quick games first, then its other core levels. */
export function reviewPool(conceptId: string, levels: Level[]): Level[] {
  const own = levels.filter((l) => l.conceptId === conceptId && l.role !== 'challenge');
  const quick = own.filter((l) => QUICK_GAMES.includes(l.game));
  return [...quick, ...own.filter((l) => !quick.includes(l))];
}

/**
 * Choose warm-up levels: one per concept, from practiced concepts that are **due** for
 * review (spaced retrieval practice, docs/concept-ideas.md §8.5), most overdue first.
 * Each review of a concept rotates to the next puzzle in its pool.
 */
export function pickReview(
  concepts: Concept[],
  levels: Level[],
  mastery: Record<string, MasteryLevel>,
  /** Completion timestamps by level id. */
  completedAt: Record<string, number>,
  /** Reviews done so far, by concept id. */
  reviews: Record<string, ReviewRecord>,
  now: number,
  count = 3,
  /**
   * Levels finished with help (answer hint, reveal, many tries). Spending help costs mastery
   * credit, not points (docs/PEDAGOGY_PLAN.md): their concepts come due twice as soon, and
   * the warm-up resurfaces that exact level on alternate reviews.
   */
  weak: ReadonlySet<string> = new Set(),
): ReviewPick[] {
  const lastTouched = (conceptId: string) =>
    Math.max(
      reviews[conceptId]?.at ?? 0,
      ...levels.filter((l) => l.conceptId === conceptId).map((l) => completedAt[l.id] ?? 0),
    );
  const hasWeak = (conceptId: string) => levels.some((l) => l.conceptId === conceptId && weak.has(l.id));
  const overdueBy = (conceptId: string) =>
    now - lastTouched(conceptId) - reviewInterval(reviews[conceptId]?.count ?? 0) * (hasWeak(conceptId) ? 0.5 : 1);
  return concepts
    .filter((c) => !c.boss && !c.comingSoon && atLeast(mastery[c.id] ?? 'locked', 'practiced'))
    .filter((c) => overdueBy(c.id) >= 0)
    .sort((a, b) => overdueBy(b.id) - overdueBy(a.id))
    .slice(0, count)
    .map((concept) => {
      const pool = reviewPool(concept.id, levels);
      const done = reviews[concept.id]?.count ?? 0;
      const weakOne = pool.find((l) => weak.has(l.id));
      const level = weakOne && done % 2 === 0 ? weakOne : pool[done % pool.length]!;
      return { concept, level };
    });
}

/** Minimum due concepts before a warm-up is offered. */
export const REVIEW_MIN_CONCEPTS = 2;
