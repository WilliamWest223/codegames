import { describe, expect, it } from 'vitest';
import { explainOutput } from '../src';
import { runJavaScript } from '../src/javascript';
import { runPython } from '../src/python';
import { getPyodide } from './pyodide';

describe('explainOutput', () => {
  it('explains printed objects and JavaScript silent failures', () => {
    expect(explainOutput('<__main__.Pet object at 0x10>', 'Rex', 'python')[0]).toMatch(/object \(or method\) itself/);
    expect(explainOutput('Total: NaN', 'Total: 5', 'javascript')[0]).toMatch(/fails quietly/);
    expect(explainOutput('Hello [object Object]', 'Hello Rex', 'javascript')[0]).toMatch(/\[object Object\]/);
    expect(explainOutput('None', '5', 'python')[0]).toMatch(/None/);
  });

  it('stays quiet when the expected output has the same thing', () => {
    expect(explainOutput('undefined', 'undefined', 'javascript')).toEqual([]);
    expect(explainOutput('6', '5', 'python')).toEqual([]);
  });
});

describe('explainOutput (Region 5, spec E3)', () => {
  it('explains lazy objects, anonymous functions and odd characters', async () => {
    const py = await getPyodide();
    const lazy = (await runPython(py, 'print(map(str, [1]))\nprint(filter(None, [1]))\nprint(x for x in [1])')).stdout;
    const notes = explainOutput(lazy, "['1']", 'python');
    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatch(/lazy object/);
    const lambda = (await runPython(py, 'print(lambda x: x)')).stdout;
    expect(explainOutput(lambda, '1', 'python')[0]).toMatch(/lambda/);
    const anon = runJavaScript('console.log((x) => x);\nconsole.log([function () {}]);').stdout;
    expect(anon).toBe('[Function (anonymous)]\n[ [Function (anonymous)] ]\n');
    expect(explainOutput(anon, '1', 'javascript')[0]).toMatch(/printed a function/);
    // Like Node (E5): named functions keep the colon; classes print as classes.
    expect(runJavaScript('function go() {}\nclass Pet {}\nclass Dog extends Pet {}\nconsole.log(go, Pet, Dog);').stdout).toBe('[Function: go] [class Pet] [class Dog extends Pet]\n');
    const shifted = runJavaScript('console.log(String.fromCharCode("z".charCodeAt(0) + 30));').stdout;
    expect(explainOutput(shifted, 'x', 'javascript')[0]).toMatch(/keeps the minus sign/);
    expect(explainOutput('héllo', 'héllo', 'javascript')).toEqual([]);
  }, 60_000);
});

describe('the "strange characters" note (round-8 P2)', () => {
  const strange = (actual: string, expected: string) => explainOutput(actual, expected, 'javascript').some((n) => n.startsWith('Strange characters'));

  it('fires for characters the expected output does not have', () => {
    expect(strange('Khoor\u0000', 'Khoor')).toBe(true);
    expect(strange('abc\u0080', 'abd')).toBe(true);
  });

  it('stays quiet for emoji, accents and curly quotes the level itself uses', () => {
    expect(strange('🎉 Café “hi”\nscore: 3', '🎉 Café “hi”\nscore: 4')).toBe(false);
    expect(strange('Olé!', 'Olé!!')).toBe(false);
  });
});
