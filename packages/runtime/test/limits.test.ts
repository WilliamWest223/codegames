import { beforeAll, describe, expect, it } from 'vitest';
import type { PyodideInterface } from 'pyodide';
import { runJavaScript } from '../src/javascript';
import { runPython, parseTraceRecord } from '../src/python';
import { MAX_ERROR_MESSAGE, STDIN_LIMITS, clampStdin } from '../src/limits';
import type { DomEvent } from '../src/dom';
import { getPyodide } from './pyodide';

describe('clampStdin', () => {
  it('keeps normal input as is', () => {
    expect(clampStdin('a\nb\r\nc\n')).toEqual(['a', 'b', 'c']);
    expect(clampStdin(undefined)).toEqual([]);
    expect(clampStdin(42)).toEqual([]);
  });
  it('cuts each line to 500 characters', () => {
    expect(clampStdin('x'.repeat(5000))[0]).toHaveLength(STDIN_LIMITS.maxLine);
  });
  it('keeps at most 200 lines', () => {
    expect(clampStdin('a\n'.repeat(1000))).toHaveLength(STDIN_LIMITS.maxLines);
  });
  it('keeps at most 10 KB in total', () => {
    const lines = clampStdin(('y'.repeat(400) + '\n').repeat(100));
    expect(lines.join('').length).toBeLessThanOrEqual(STDIN_LIMITS.maxTotal);
    expect(lines.length).toBeLessThan(100);
  });
  it('survives a huge string', () => {
    expect(clampStdin('z'.repeat(5e7)).join('').length).toBeLessThanOrEqual(STDIN_LIMITS.maxTotal);
  });
});

describe('runJavaScript input and output caps', () => {
  it('clamps stdin lines inside the runner', () => {
    const r = runJavaScript('console.log(prompt().length)', { stdin: 'q'.repeat(100_000) });
    expect(r.stdout).toBe(`${STDIN_LIMITS.maxLine}\n`);
  });
  it('gives up after 200 input lines', () => {
    const r = runJavaScript('let n = 0; while (true) { prompt(); n++; if (n > 500) break; }', { stdin: 'a\n'.repeat(1000) });
    expect(r.error?.name).toBe('InputError');
  });
  it('caps an error message of 1e8 characters', () => {
    const r = runJavaScript('throw new Error("m".repeat(1e8))');
    expect(r.error?.message.length).toBeLessThan(MAX_ERROR_MESSAGE + 50);
  });
  it('caps a huge error name', () => {
    const r = runJavaScript('const e = new Error("x"); e.name = "N".repeat(1e6); throw e');
    expect(r.error?.name.length).toBeLessThanOrEqual(110);
  });
  it('caps stderr and stdout at maxOutput', () => {
    const r = runJavaScript('console.error("e".repeat(1e6)); console.log("o".repeat(100))', { maxOutput: 500 });
    expect(r.stderr?.length).toBeLessThanOrEqual(500);
    const big = runJavaScript('console.log("o".repeat(1e6))', { maxOutput: 500 });
    expect(big.stdout.length).toBeLessThanOrEqual(500);
  });
});

const PAGE = '<ul id="list"></ul><input id="name">';
const page = (code: string, events?: DomEvent[]) => runJavaScript(code, { page: PAGE, events });

describe('mini DOM limits', () => {
  it('refuses more than 2000 nodes with a friendly message', () => {
    const r = page('const ul = document.getElementById("list"); for (let i = 0; i < 5000; i++) ul.appendChild(document.createElement("li"));');
    expect(r.error?.name).toBe('DomError');
    expect(r.error?.message).toMatch(/more than 2000 elements/);
  });
  it('allows a page right at the limit', () => {
    const r = page('const ul = document.getElementById("list"); for (let i = 0; i < 1990; i++) ul.appendChild(document.createElement("li")); console.log(ul.children.length)');
    expect(r.error).toBeUndefined();
    expect(r.stdout).toBe('1990\n');
  });
  it('refuses nesting deeper than 50', () => {
    const r = page('let p = document.body; for (let i = 0; i < 60; i++) { const d = document.createElement("div"); p.appendChild(d); p = d; }');
    expect(r.error?.name).toBe('DomError');
    expect(r.error?.message).toMatch(/50 levels/);
  });
  it('refuses deep or huge innerHTML', () => {
    expect(page('document.body.innerHTML = "<div>".repeat(100)').error?.message).toMatch(/50 levels/);
    expect(page('document.body.innerHTML = "<li>x</li>".repeat(3000)').error?.message).toMatch(/2000/);
    expect(page('document.body.innerHTML = "a".repeat(1e6)').error?.name).toBe('DomError');
  });
  it('rejects bad attribute names', () => {
    for (const bad of ['"><script>', 'on click', '1a', '_x', '', 'a=b']) {
      const r = page(`document.getElementById("list").setAttribute(${JSON.stringify(bad)}, "v")`);
      expect(r.error?.name, bad).toBe('DomError');
    }
    expect(page('document.getElementById("list").setAttribute("data-x-1", "v"); console.log(render())').error).toBeUndefined();
  });
  it('caps attribute values at 1000 characters', () => {
    expect(page('document.getElementById("list").setAttribute("title", "t".repeat(1001))').error?.name).toBe('DomError');
    expect(page('document.getElementById("list").setAttribute("title", "t".repeat(1000))').error).toBeUndefined();
  });
  it('caps text nodes at 10 KB', () => {
    expect(page('document.createTextNode("t".repeat(10001))').error?.name).toBe('DomError');
    expect(page('document.getElementById("list").textContent = "t".repeat(10001)').error?.name).toBe('DomError');
    expect(page('document.getElementById("list").append("t".repeat(10001))').error?.name).toBe('DomError');
    expect(page('document.getElementById("list").textContent = "t".repeat(10000)').error).toBeUndefined();
  });
  it('maps unknown tags to span and skips invalid attributes in parsed HTML', () => {
    const r = page('document.body.innerHTML = \'<script src="x" _a="1" 9b="2" ok="3">alert(1)</script><iframe></iframe>\'; console.log(render())');
    expect(r.error).toBeUndefined();
    expect(r.stdout).not.toMatch(/<script|<iframe/);
    expect(r.stdout).toContain('<span ok="3" src="x">');
    expect(r.stdout).not.toMatch(/_a|9b/);
  });
  it('stops a loop that makes endless detached elements', () => {
    const r = page('for (let i = 0; i < 1e6; i++) document.createElement("div");');
    expect(r.error?.name).toBe('DomError');
  });
  it('clamps replayed events: 500 events, 1000 characters per value', () => {
    const events: DomEvent[] = Array.from({ length: 800 }, () => ({ type: 'input', target: '#name', value: 'v'.repeat(5000) }));
    const again = runJavaScript(
      'let n = 0; let longest = 0; const el = document.getElementById("name"); el.addEventListener("input", () => { n++; longest = Math.max(longest, el.value.length); }); el.addEventListener("change", () => console.log(n, longest));',
      { page: PAGE, events },
    );
    // `change` fires once per event after its `input`; the last one reports 500 events of 1000 characters.
    const last = again.stdout.trim().split('\n').at(-1);
    expect(last).toBe('500 1000');
  });
  it('ignores malformed events', () => {
    const bad = [null, { type: 'click' }, { type: 'nope', target: '#name' }, { type: 'click', target: 'x'.repeat(5000) }, { type: 'click', target: '[[[' }] as unknown as DomEvent[];
    expect(page('console.log("ok")', bad).error).toBeUndefined();
  });
});

describe('runPython caps', () => {
  let py: PyodideInterface;
  beforeAll(async () => {
    py = await getPyodide();
  }, 60_000);

  it('clamps stdin lines inside the runner', async () => {
    const r = await runPython(py, 'print(len(input()))', { stdin: 'q'.repeat(100_000) });
    expect(r.stdout).toBe(`${STDIN_LIMITS.maxLine}\n`);
  });
  it('caps a huge error message', async () => {
    const r = await runPython(py, 'raise ValueError("m" * 10_000_000)');
    expect(r.error?.message.length).toBeLessThan(MAX_ERROR_MESSAGE + 50);
  });
});

describe('parseTraceRecord', () => {
  const good = JSON.stringify([3, [['', 0, [['x', '1']]]], 1]);
  it('accepts the tracer shape', () => {
    expect(parseTraceRecord(good, 7)).toEqual({ line: 3, scope: '', vars: [['x', '1']], stack: [{ name: '', id: 0, vars: [['x', '1']] }], depth: 1, out: 7 });
  });
  it.each([
    ['not json', '{{'],
    ['not an array', '{"a":1}'],
    ['wrong length', '[1,2]'],
    ['string line', '["3",[["",0,[]]],1]'],
    ['empty stack', '[3,[],1]'],
    ['frame not array', '[3,["x"],1]'],
    ['var not strings', '[3,[["",0,[[1,2]]]],1]'],
    ['null', 'null'],
    ['number input', 5],
  ])('rejects %s', (_n, input) => {
    expect(parseTraceRecord(input, 0)).toBeUndefined();
  });
  it('rejects a stack longer than the frame cap', () => {
    const frames = Array.from({ length: 51 }, (_, i) => ['f', i, []]);
    expect(parseTraceRecord(JSON.stringify([1, frames, 51]), 0)).toBeUndefined();
  });
});
