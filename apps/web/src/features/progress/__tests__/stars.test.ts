import { describe, expect, it } from 'vitest';
import { starsFor } from '../store';

describe('starsFor', () => {
  it('gives 3 stars for solving with at most one slip, nudge hints are free', () => {
    expect(starsFor(0, 0, 3, false)).toBe(3);
    expect(starsFor(1, 0, 3, false)).toBe(3);
    expect(starsFor(0, 2, 3, false)).toBe(3);
  });
  it('gives 2 stars after the answer hint or a few tries', () => {
    expect(starsFor(0, 3, 3, false)).toBe(2);
    expect(starsFor(4, 0, 3, false)).toBe(2);
  });
  it('gives 1 star after many tries or a reveal', () => {
    expect(starsFor(9, 0, 3, false)).toBe(1);
    expect(starsFor(0, 0, 3, true)).toBe(1);
  });
});
