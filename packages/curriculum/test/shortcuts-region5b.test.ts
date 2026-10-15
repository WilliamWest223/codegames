import { beforeAll, describe, expect, it } from 'vitest';
import { gradeSubmission, type Executor } from '@codegames/runtime';
import { nodeExecutors } from '@codegames/runtime/node';
import { levels } from '../src';

/**
 * Region 5, second half (recursive-data, inheritance, polymorphism, value-vs-reference,
 * boss-5): the shortcuts and alternatives listed in docs/specs/region5-and-security.md
 * (Part C, step 4). Same pattern as shortcuts.test.ts.
 */
type Probe = { id: string; language: 'python' | 'javascript'; code: string; why: string };

/** A probe written as edits to the reference solution, so it tracks the real code. */
function editedSolution(id: string, language: 'python' | 'javascript', edits: [string, string][], why: string): Probe {
  const level = levels.find((l) => l.id === id);
  if (!level || level.game === 'predict-output') throw new Error(`${id} has no solution`);
  let code = level.solution[language] ?? '';
  for (const [from, to] of edits) {
    if (!code.includes(from)) throw new Error(`${id}: edit target not found: ${from}`);
    code = code.replace(from, to);
  }
  return { id, language, code, why };
}

/** Each passes some visible output without the skill, so each must be rejected. */
const SHORTCUTS: Probe[] = [
  editedSolution(
    'inheritance-4',
    'python',
    [[
      '    except InsufficientFunds as err:\n        print(f"Declined: {err}")\n    except ValueError:\n        print("Not a valid amount")\n',
      '    except ValueError:\n        print("Not a valid amount")\n    except InsufficientFunds as err:\n        print(f"Declined: {err}")\n',
    ]],
    'general except ValueError first',
  ),
  editedSolution(
    'inheritance-4',
    'javascript',
    [[
      '    if (err instanceof InsufficientFunds) {\n      console.log(`Declined: ${err.message}`);\n    } else {\n      console.log("Not a valid amount");\n    }\n',
      '    console.log(`Declined: ${err.message}`);\n',
    ]],
    'no instanceof: every error handled the same way',
  ),
  editedSolution(
    'recursive-data-4',
    'python',
    [['            found = find(folder[key], name, here)\n            if found is not None:\n                return found\n', '            return find(folder[key], name, here)\n']],
    'return find(...) without the None check',
  ),
  editedSolution(
    'recursive-data-4',
    'javascript',
    [['      const found = find(folder[key], name, here);\n      if (found !== null) {\n        return found;\n      }\n', '      return find(folder[key], name, here);\n']],
    'return find(...) without the null check',
  ),
  editedSolution(
    'recursive-data-5',
    'python',
    [['    if grid[r][c] != words[2]:\n        fill(grid, r, c, grid[r][c], words[2])\n', '    fill(grid, r, c, grid[r][c], words[2])\n']],
    'no same-character guard',
  ),
  editedSolution(
    'recursive-data-5',
    'javascript',
    [['  if (grid[r][c] !== words[2]) {\n    fill(grid, r, c, grid[r][c], words[2]);\n  }\n', '  fill(grid, r, c, grid[r][c], words[2]);\n']],
    'no same-character guard',
  ),
  editedSolution(
    'boss-5',
    'python',
    [['        self.rows = [[Mine() if ch == "*" else Empty() for ch in line] for line in layout]\n', '        blank = Empty()\n        self.rows = [[Mine() if ch == "*" else blank for ch in line] for line in layout]\n']],
    'one shared Empty cell',
  ),
  editedSolution(
    'boss-5',
    'javascript',
    [['    this.rows = layout.map((line) => line.split("").map((ch) => (ch === "*" ? new Mine() : new Empty())));\n', '    const blank = new Empty();\n    this.rows = layout.map((line) => line.split("").map((ch) => (ch === "*" ? new Mine() : blank)));\n']],
    'one shared Empty cell',
  ),
  editedSolution(
    'boss-5',
    'javascript',
    [['{ reveal: (r, c) => board.reveal(r, c), flag: (r, c) => board.flag(r, c) }', '{ reveal: board.reveal, flag: board.flag }']],
    'bare method references in the table (JS loses this)',
  ),
  editedSolution(
    'boss-5',
    'python',
    [['                self.reveal(nr, nc)\n', '                self.rows[nr][nc].revealed = True\n']],
    'reveal without recursion (no flood fill)',
  ),
  editedSolution(
    'boss-5',
    'javascript',
    [['        this.reveal(nr, nc);\n', '        this.rows[nr][nc].revealed = true;\n']],
    'reveal without recursion (no flood fill)',
  ),
];

/** Correct answers written differently from the model solution: each must pass. */
const MUST_PASS: Probe[] = [
  editedSolution(
    'value-vs-reference-3',
    'python',
    [['board = [["."] * width for i in range(height)]\n', 'board = []\nfor i in range(height):\n    board.append(["."] * width)\n']],
    'build the rows with a loop',
  ),
  editedSolution(
    'value-vs-reference-3',
    'javascript',
    [['const board = Array.from({ length: height }, () => Array(width).fill("."));\n', 'const board = [];\nfor (let i = 0; i < height; i++) {\n  board.push(Array(width).fill("."));\n}\n']],
    'build the rows with a loop',
  ),
];

let executors: Record<'python' | 'javascript', Executor>;
beforeAll(async () => {
  executors = await nodeExecutors();
}, 60_000);

describe('region 5 (second half): known shortcuts are rejected', () => {
  it.each(SHORTCUTS.map((s) => [`${s.id} (${s.language}): ${s.why}`, s] as const))('%s', async (_name, s) => {
    const level = levels.find((l) => l.id === s.id)!;
    const result = await gradeSubmission(level, s.language, s.code + '\n', executors[s.language]);
    expect(result.passed, JSON.stringify(result.blocked ?? result.tests.filter((t) => !t.passed).map((t) => t.name))).toBe(false);
  });
});

describe('region 5 (second half): correct alternative answers are accepted', () => {
  it.each(MUST_PASS.map((s) => [`${s.id} (${s.language}): ${s.why}`, s] as const))('%s', async (_name, s) => {
    const level = levels.find((l) => l.id === s.id)!;
    const result = await gradeSubmission(level, s.language, s.code + '\n', executors[s.language]);
    expect(result.passed, JSON.stringify(result.blocked ?? result.tests.filter((t) => !t.passed).map((t) => [t.name, t.actual, t.error?.message]))).toBe(true);
  });
});
