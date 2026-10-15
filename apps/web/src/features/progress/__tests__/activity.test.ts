import { describe, expect, it } from 'vitest';
import { computeActivity, dayKey } from '../activity';

const at = (y: number, m: number, d: number, h = 15) => new Date(y, m - 1, d, h).getTime();
const log = (...times: number[]) => Object.fromEntries(times.map((t) => [dayKey(t), 1]));

describe('computeActivity', () => {
  it('counts consecutive days ending today', () => {
    const now = at(2026, 10, 13);
    expect(computeActivity(log(now, at(2026, 10, 12), at(2026, 10, 11), at(2026, 10, 9)), now)).toEqual({ streak: 3, today: 1, freezes: 0 });
  });
  it('keeps a streak alive until the end of today if yesterday was active', () => {
    const now = at(2026, 10, 13);
    expect(computeActivity(log(at(2026, 10, 12), at(2026, 10, 11)), now).streak).toBe(2);
  });
  it('is zero after a missed day', () => {
    const now = at(2026, 10, 13);
    expect(computeActivity(log(at(2026, 10, 11)), now)).toEqual({ streak: 0, today: 0, freezes: 0 });
  });
  it('steps calendar days across daylight-saving changes', () => {
    // Spring forward (US: 8 Mar 2026) and fall back (1 Nov 2026), early-morning activity.
    const spring = at(2026, 3, 9, 0);
    expect(computeActivity(log(spring, at(2026, 3, 8, 0), at(2026, 3, 7, 0)), spring).streak).toBe(3);
    const fall = at(2026, 11, 2, 23);
    expect(computeActivity(log(fall, at(2026, 10, 31, 23)), fall).streak).toBe(1);
  });
  it('banks a freeze on goal days and spends it on a missed day (forgiving streak)', () => {
    const now = at(2026, 10, 13);
    // Goal met on the 10th (3 levels), missed the 11th, active the 12th and 13th.
    const activity = { [dayKey(at(2026, 10, 10))]: 3, [dayKey(at(2026, 10, 12))]: 1, [dayKey(now)]: 1 };
    expect(computeActivity(activity, now, 3)).toEqual({ streak: 3, today: 1, freezes: 0 });
    // Without a freeze, the same gap starts a new streak.
    expect(computeActivity({ ...activity, [dayKey(at(2026, 10, 10))]: 1 }, now, 3).streak).toBe(2);
  });
  it('caps banked freezes and respects a smaller self-set goal', () => {
    const now = at(2026, 10, 13);
    const activity = Object.fromEntries([9, 10, 11, 12].map((d) => [dayKey(at(2026, 10, d)), 1]));
    expect(computeActivity(activity, now, 1)).toEqual({ streak: 4, today: 0, freezes: 2 });
  });
  it('applies a new goal only from the day it was set (round-7 dev P2-2)', () => {
    const now = at(2026, 10, 13);
    // Goal 1 met on the 10th, missed the 11th (freeze spent), active the 12th; goal raised to 5 today.
    const activity = { [dayKey(at(2026, 10, 10))]: 1, [dayKey(at(2026, 10, 12))]: 1, [dayKey(now)]: 1 };
    const history = { '': 1, [dayKey(now)]: 5 };
    expect(computeActivity(activity, now, 5, history).streak).toBe(3);
    // Applying 5 to every day (the old behaviour) would have broken the streak.
    expect(computeActivity(activity, now, 5).streak).toBe(2);
  });
});
