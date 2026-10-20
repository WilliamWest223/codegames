import { useProgress } from './store';

/** Daily goals the learner can choose from (a commitment they set themselves). */
export const GOAL_CHOICES = [1, 3, 5] as const;
export const DEFAULT_GOAL = 3;
/** At most this many streak freezes can be banked. */
export const MAX_FREEZES = 2;

/** Local calendar day, e.g. "2026-10-13". */
export function dayKey(t: number): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export interface ActivitySummary {
  /** Consecutive days kept (active days, plus missed days covered by a freeze). */
  streak: number;
  /** Levels and warm-ups done today. */
  today: number;
  /** Freezes banked for future missed days. */
  freezes: number;
}

/**
 * A forgiving streak (docs/PEDAGOGY_PLAN.md): every day you meet your goal banks a freeze
 * (up to MAX_FREEZES), and a missed day spends one instead of breaking the streak. Today
 * never counts as missed while it's still open. Days are stepped with the calendar, not by
 * subtracting 24 hours, so daylight-saving changes can't skip or repeat a day.
 */
export function computeActivity(
  activity: Record<string, number>,
  now = Date.now(),
  goal = DEFAULT_GOAL,
  /** Goals that were in effect from a day on (`dayKey` → goal), so changing it isn't retroactive. */
  goalHistory: Record<string, number> = {},
): ActivitySummary {
  const changes = Object.keys(goalHistory).sort();
  // The goal on a given day: the latest change on or before it; before the first change, the
  // goal that change replaced (stored under the empty key), else the current goal.
  const goalOn = (key: string): number => {
    let g = goalHistory[''] ?? goal;
    for (const c of changes) if (c && c <= key) g = goalHistory[c]!;
    return g;
  };
  const todayKey = dayKey(now);
  const today = activity[todayKey] ?? 0;
  const days = Object.keys(activity).filter((k) => k >= '2020-01-01' && (activity[k] ?? 0) > 0).sort();
  let streak = 0;
  let freezes = 0;
  if (!days.length) return { streak, today, freezes };
  const [y, m, d] = days[0]!.split('-').map(Number) as [number, number, number];
  const cursor = new Date(y, m - 1, d, 12); // noon: safely inside the day even across DST shifts
  for (let key = dayKey(cursor.getTime()); key <= todayKey; cursor.setDate(cursor.getDate() + 1), key = dayKey(cursor.getTime())) {
    const done = activity[key] ?? 0;
    if (done > 0) {
      streak++;
      if (done >= goalOn(key)) freezes = Math.min(MAX_FREEZES, freezes + 1);
    } else if (key !== todayKey) {
      if (freezes > 0) freezes--;
      else streak = 0;
    }
  }
  return { streak, today, freezes };
}

export function useActivity() {
  const activity = useProgress((s) => s.activity);
  const goal = useProgress((s) => s.dailyGoal);
  const goalHistory = useProgress((s) => s.goalHistory);
  return { ...computeActivity(activity, Date.now(), goal, goalHistory), goal };
}
