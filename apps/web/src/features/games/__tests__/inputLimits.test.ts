import { describe, expect, it } from 'vitest';
import { INPUT_LIMITS, clampEventValue, clampInputText, whyRefuse } from '../inputLimits';
import { clip } from '../Output';

describe('clampInputText', () => {
  it('leaves normal input alone', () => {
    expect(clampInputText('3\n4\n')).toEqual({ text: '3\n4\n', clamped: false });
  });
  it('cuts a line to 500 characters', () => {
    const r = clampInputText('a'.repeat(900));
    expect(r.text).toHaveLength(INPUT_LIMITS.maxLine);
    expect(r.clamped).toBe(true);
  });
  it('keeps 200 lines at most', () => {
    const r = clampInputText('x\n'.repeat(500));
    expect(r.text.split('\n')).toHaveLength(INPUT_LIMITS.maxLines);
    expect(r.clamped).toBe(true);
  });
  it('keeps 10 KB at most in total', () => {
    const r = clampInputText(('y'.repeat(499) + '\n').repeat(100));
    expect(r.text.length).toBeLessThanOrEqual(INPUT_LIMITS.maxTotal);
    expect(r.clamped).toBe(true);
  });
});

describe('whyRefuse', () => {
  it('accepts a normal answer', () => {
    expect(whyRefuse(['1', '2'], '3')).toBeNull();
  });
  it('refuses an answer over 500 characters', () => {
    expect(whyRefuse([], 'a'.repeat(501))).toMatch(/500/);
    expect(whyRefuse([], 'a'.repeat(500))).toBeNull();
  });
  it('refuses the 201st answer', () => {
    expect(whyRefuse(Array(199).fill('x'), 'y')).toBeNull();
    expect(whyRefuse(Array(200).fill('x'), 'y')).toMatch(/200/);
  });
  it('refuses an answer that would pass 10 KB in total', () => {
    const answers = Array(20).fill('a'.repeat(499));
    expect(whyRefuse(answers, 'a')).toMatch(/all the input/);
  });
});

describe('clampEventValue', () => {
  it('cuts a value to 1000 characters and leaves others alone', () => {
    expect(clampEventValue({ type: 'input' as const, target: '#a', value: 'v'.repeat(5000) }).value).toHaveLength(1000);
    const small = { type: 'click' as const, target: '#a' };
    expect(clampEventValue(small)).toBe(small);
  });
});

describe('clip', () => {
  it('cuts a huge message cheaply', () => {
    const out = clip('m'.repeat(1e8));
    expect(out.length).toBeLessThan(4100);
  });
  it('keeps short text', () => {
    expect(clip('hello')).toBe('hello');
  });
});
