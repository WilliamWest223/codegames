import { describe, expect, it, vi } from 'vitest';
import { EditorState } from '@codemirror/state';
import { MAX_EDITOR_CHARS, sizeLimit } from '../CodeEditor';

const stateWith = (doc: string, refused = () => undefined) => EditorState.create({ doc, extensions: [sizeLimit(refused)] });

describe('editor size limit (50 KB)', () => {
  it('allows ordinary edits', () => {
    const s = stateWith('print(1)').update({ changes: { from: 8, insert: '\nprint(2)' } }).state;
    expect(s.doc.toString()).toBe('print(1)\nprint(2)');
  });

  it('allows a document of exactly the maximum', () => {
    const s = stateWith('').update({ changes: { from: 0, insert: 'a'.repeat(MAX_EDITOR_CHARS) } }).state;
    expect(s.doc.length).toBe(MAX_EDITOR_CHARS);
  });

  it('refuses a paste that would pass the maximum, and says so', () => {
    const refused = vi.fn();
    const s = stateWith('x'.repeat(MAX_EDITOR_CHARS - 5), refused).update({ changes: { from: 0, insert: 'y'.repeat(100) } }).state;
    expect(s.doc.length).toBe(MAX_EDITOR_CHARS - 5);
    expect(refused).toHaveBeenCalledTimes(1);
  });

  it('refuses a single huge paste into an empty editor', () => {
    const s = stateWith('').update({ changes: { from: 0, insert: 'z'.repeat(5_000_000) } }).state;
    expect(s.doc.length).toBe(0);
  });

  it('still lets a too-long document shrink', () => {
    const s = stateWith('q'.repeat(MAX_EDITOR_CHARS + 10)).update({ changes: { from: 0, to: 5 } }).state;
    expect(s.doc.length).toBe(MAX_EDITOR_CHARS + 5);
  });
});
