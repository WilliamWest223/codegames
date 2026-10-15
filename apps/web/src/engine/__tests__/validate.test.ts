import { describe, expect, it } from 'vitest';
import type { PageNode } from '@codegames/runtime';
import { validateExecResult } from '../host';

const ok = { stdout: 'hi\n', durationMs: 3 };
const node = (children: (PageNode | string)[] = [], path = '@'): PageNode => ({ tag: 'div', attrs: {}, children, path });
const isInternal = (r: ReturnType<typeof validateExecResult>) => r.error?.name === 'InternalError' && r.error.kind === 'internal';

describe('validateExecResult', () => {
  it('passes a good result through unchanged', () => {
    const good = {
      stdout: 'a',
      stderr: 'b',
      durationMs: 5,
      inputs: [{ offset: 1, prompt: 'Name?' }],
      error: { kind: 'runtime', name: 'NameError', message: 'x', line: 2, friendly: 'f' },
      trace: [{ line: 1, scope: '', vars: [['x', '1']], stack: [{ name: '', id: 0, vars: [['x', '1']] }], depth: 1, out: 0 }],
      traceTruncated: false,
      page: node([node(['text'], '@0')]),
      grid: { actions: [{ type: 'move', robot: { x: 1, y: 1, dir: 'E' }, line: 1 }, { type: 'collect', robot: { x: 1, y: 1, dir: 'E' }, gem: [2, 1] }], success: true, gemsCollected: 1, totalGems: 1 },
    };
    expect(validateExecResult(good)).toEqual(good);
  });

  it('drops unknown fields', () => {
    expect(validateExecResult({ ...ok, evil: '<img onerror=x>' })).toEqual(ok);
  });

  it.each([null, undefined, 'text', 5, [], [ok]])('rejects a non-object result (%j)', (bad) => {
    expect(isInternal(validateExecResult(bad))).toBe(true);
  });

  it.each([
    ['stdout missing', { durationMs: 1 }],
    ['stdout a number', { stdout: 5, durationMs: 1 }],
    ['durationMs a string', { stdout: '', durationMs: '1' }],
    ['durationMs NaN', { stdout: '', durationMs: NaN }],
    ['stderr an object', { ...ok, stderr: {} }],
    ['inputs not a list', { ...ok, inputs: 'x' }],
    ['input prompt not text', { ...ok, inputs: [{ offset: 1, prompt: 2 }] }],
    ['error a string', { ...ok, error: 'boom' }],
    ['error kind unknown', { ...ok, error: { kind: 'evil', name: 'x', message: 'x', friendly: 'x' } }],
    ['error message missing', { ...ok, error: { kind: 'runtime', name: 'x', friendly: 'x' } }],
    ['error line a string', { ...ok, error: { kind: 'runtime', name: 'x', message: 'm', friendly: 'x', line: '3' } }],
    ['trace not a list', { ...ok, trace: {} }],
    ['trace step bad', { ...ok, trace: [null] }],
    ['trace stack bad', { ...ok, trace: [{ line: 1, scope: '', vars: [], stack: 'x', depth: 1, out: 0 }] }],
    ['traceTruncated a string', { ...ok, traceTruncated: 'yes' }],
    ['grid not an object', { ...ok, grid: 1 }],
    ['grid action unknown', { ...ok, grid: { actions: [{ type: 'teleport', robot: { x: 0, y: 0, dir: 'N' } }], success: true, gemsCollected: 0, totalGems: 0 } }],
    ['grid dir bad', { ...ok, grid: { actions: [{ type: 'move', robot: { x: 0, y: 0, dir: 'Q' } }], success: true, gemsCollected: 0, totalGems: 0 } }],
    ['page not a node', { ...ok, page: 'x' }],
    ['page tag evil', { ...ok, page: { tag: 'img src=x', attrs: {}, children: [], path: '@' } }],
    ['page attr name evil', { ...ok, page: { tag: 'div', attrs: { '"onload': 'x' }, children: [], path: '@' } }],
    ['page attr value not text', { ...ok, page: { tag: 'div', attrs: { id: 5 }, children: [], path: '@' } }],
    ['page child a number', { ...ok, page: node([5 as unknown as string]) }],
    ['page path evil', { ...ok, page: node([], 'javascript:1') }],
  ])('rejects %s', (_name, bad) => {
    expect(isInternal(validateExecResult(bad))).toBe(true);
  });

  it('cuts stdout and stderr to the output limit', () => {
    const r = validateExecResult({ stdout: 'o'.repeat(1e6), stderr: 'e'.repeat(1e6), durationMs: 1 }, 500);
    expect(r.stdout).toHaveLength(500);
    expect(r.stderr).toHaveLength(500);
  });

  it('defaults the output limit to the runtime default', () => {
    expect(validateExecResult({ stdout: 'o'.repeat(1e6), durationMs: 1 }).stdout).toHaveLength(20_000);
  });

  it('cuts error.message to 2000 characters', () => {
    const r = validateExecResult({ ...ok, error: { kind: 'runtime', name: 'Error', message: 'm'.repeat(1e8), friendly: 'f' } });
    expect(r.error?.message).toHaveLength(2000);
  });

  it('keeps no more trace steps than the runtime records', () => {
    const step = { line: 1, scope: '', vars: [], stack: [{ name: '', id: 0, vars: [] }], depth: 1, out: 0 };
    expect(validateExecResult({ ...ok, trace: Array(1500).fill(step) }).trace).toHaveLength(1001);
  });

  it('rejects a trace beyond 5000 steps', () => {
    const step = { line: 1, scope: '', vars: [], stack: [{ name: '', id: 0, vars: [] }], depth: 1, out: 0 };
    expect(isInternal(validateExecResult({ ...ok, trace: Array(5001).fill(step) }))).toBe(true);
  });

  it('accepts a page of exactly 2000 nodes and rejects 2001', () => {
    const page = (n: number) => node(Array.from({ length: n - 1 }, (_, i) => node([], `@${i}`)));
    expect(validateExecResult({ ...ok, page: page(2000) }).page).toBeDefined();
    expect(isInternal(validateExecResult({ ...ok, page: page(2001) }))).toBe(true);
  });

  it('counts text children as nodes', () => {
    const page = node(Array.from({ length: 2000 }, () => 'x'));
    expect(isInternal(validateExecResult({ ...ok, page }))).toBe(true);
  });

  it('accepts a page 50 levels deep and rejects 51 (without overflowing the stack)', () => {
    const deep = (levels: number): PageNode => {
      let n = node();
      for (let i = 1; i < levels; i++) n = node([n]);
      return n;
    };
    expect(validateExecResult({ ...ok, page: deep(51) }).page).toBeDefined(); // body + 50 levels
    expect(isInternal(validateExecResult({ ...ok, page: deep(52) }))).toBe(true);
    expect(isInternal(validateExecResult({ ...ok, page: deep(100_000) }))).toBe(true);
  });
});
