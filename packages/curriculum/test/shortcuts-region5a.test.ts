import { beforeAll, describe, expect, it } from 'vitest';
import { gradeSubmission, type Executor } from '@codegames/runtime';
import { nodeExecutors } from '@codegames/runtime/node';
import { levels } from '../src';

/**
 * Region 5 functional/recursive track (higher-order-functions, map-filter-reduce, closures,
 * recursion): wrong answers from the spec's misconception notes that must be rejected.
 * Same pattern as shortcuts.test.ts.
 */
const SHORTCUTS: { id: string; language: 'python' | 'javascript'; code: string; why: string }[] = [
  {
    id: 'higher-order-functions-6',
    language: 'python',
    code: 'route = "MMGRMMLMG"\n\ndef turn_right():\n    for i in range(3):\n        turn_left()\n\nactions = {"M": move(), "L": turn_left, "R": turn_right, "G": collect}\n\nfor letter in route:\n    actions[letter]()',
    why: 'move() stored in the table',
  },
  {
    id: 'higher-order-functions-6',
    language: 'javascript',
    code: 'const route = "MMGRMMLMG";\n\nfunction turnRight() {\n  for (let i = 0; i < 3; i++) {\n    turnLeft();\n  }\n}\n\nconst actions = { M: move(), L: turnLeft, R: turnRight, G: collect };\n\nfor (const letter of route) {\n  actions[letter]();\n}',
    why: 'move() stored in the table',
  },
];

let executors: Record<'python' | 'javascript', Executor>;
beforeAll(async () => {
  executors = await nodeExecutors();
}, 60_000);

describe('region 5 (functions, recursion): known shortcuts are rejected', () => {
  it.each(SHORTCUTS.map((s) => [`${s.id} (${s.language}): ${s.why}`, s] as const))('%s', async (_name, s) => {
    const level = levels.find((l) => l.id === s.id);
    expect(level, s.id).toBeDefined();
    const result = await gradeSubmission(level!, s.language, s.code + '\n', executors[s.language]);
    expect(result.passed, JSON.stringify(result.blocked ?? result.tests.filter((t) => !t.passed).map((t) => t.name))).toBe(false);
  });
});
