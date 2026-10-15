import { beforeAll, describe, expect, it } from 'vitest';
import { PLAYABLE_LANGUAGES } from '@codegames/shared';
import type { Executor } from '@codegames/runtime';
import { nodeExecutors } from '@codegames/runtime/node';
import { HANGMAN, HANGMAN_WORDS, hangmanWithWords } from '../src/levels/region3/shared';
import { levels } from '../src';

let executors: Record<'python' | 'javascript', Executor>;

beforeAll(async () => {
  executors = await nodeExecutors();
}, 60_000);

/** A one-word list, so the "random" pick is known: what a learner might write to test their game. */
const ONE_WORD = {
  python: 'words = ["cat"]\nstart_lives = 2',
  javascript: 'const words = ["cat"];\nconst startLives = 2;',
};

/** Line 2 holds the mistake, so the error must report line 2 of the learner's list. */
const BROKEN = {
  python: 'start_lives = 6\nwords = ["moon", "star"\n',
  javascript: 'const startLives = 6;\nconst words = ["moon", "star";\n',
};

describe('Hangman word composition', () => {
  it("puts the learner's word list before the fixed Hangman engine", () => {
    const source = hangmanWithWords(ONE_WORD);
    expect(source.python!.startsWith(ONE_WORD.python)).toBe(true);
    expect(source.javascript!.startsWith(ONE_WORD.javascript)).toBe(true);
    expect(source.python).toContain('def mask(word, guessed):');
    expect(source.javascript).toContain('function mask(word, guessed) {');
  });

  it('shares the boss reference engine', () => {
    const boss = levels.find((l) => l.id === 'boss-3');
    expect(boss && 'solution' in boss ? boss.solution : undefined).toEqual(HANGMAN);
    for (const language of ['python', 'javascript'] as const) {
      expect(hangmanWithWords(HANGMAN_WORDS)[language]).toContain(HANGMAN[language]!.split('\n').slice(-6).join('\n'));
    }
  });
});

describe.each(['python', 'javascript'] as const)('word workshop (%s)', (language) => {
  it("plays a learner's own word and lives", async () => {
    const run = await executors[language](hangmanWithWords(ONE_WORD)[language]!, { stdin: 'c\nx\na\nt\n', seed: 1 });
    expect(run.error).toBeUndefined();
    expect(run.stdout).toContain('_ _ _\nLives: 2');
    expect(run.stdout).toContain('c _ _\nLives: 1');
    expect(run.stdout).toContain('You win! The word was cat');
  });

  it('picks the secret from the starter list', async () => {
    const words = ['python', 'robot', 'galaxy', 'puzzle', 'wizard'];
    // Six letters none of the words contain, so every game ends in a loss that names the secret.
    for (const seed of [1, 2, 3]) {
      const run = await executors[language](hangmanWithWords(HANGMAN_WORDS)[language]!, { stdin: 'c\nf\nj\nk\nm\nq\n', seed });
      expect(run.error).toBeUndefined();
      const secret = run.stdout.match(/The word was (\w+)/)?.[1];
      expect(words).toContain(secret);
    }
  });

  it('reports a broken list on the line the learner wrote it', async () => {
    const run = await executors[language](hangmanWithWords(BROKEN)[language]!, { stdin: '' });
    expect(run.error).toBeDefined();
    expect(run.error!.line).toBe(2);
  });
});
