import { beforeAll, describe, expect, it } from 'vitest';
import { PLAYABLE_LANGUAGES } from '@codegames/shared';
import type { Executor } from '@codegames/runtime';
import { nodeExecutors } from '@codegames/runtime/node';
import { ADVENTURE, ADVENTURE_WORLD, adventureWithWorld } from '../src/levels/region4/shared';
import { levels } from '../src';

let executors: Record<'python' | 'javascript', Executor>;

beforeAll(async () => {
  executors = await nodeExecutors();
}, 60_000);

/** A two-room world a learner might write: a new room, an item, and the crown. */
const CUSTOM = {
  python: 'rooms = {\n    "hall": {"exits": {"down": "cellar"}, "items": ["torch"]},\n    "cellar": {"exits": {"up": "hall"}, "items": ["crown"]},\n}',
  javascript: 'const rooms = {\n  hall: { exits: { down: "cellar" }, items: ["torch"] },\n  cellar: { exits: { up: "hall" }, items: ["crown"] },\n};',
};

/** Line 3 holds the mistake, so the error must report line 3 of the learner's world. */
const BROKEN = {
  python: '\nrooms = {\n    "hall": {"exits": {}, "items": [}\n}',
  javascript: '\nconst rooms = {\n  hall: { exits: {}, items: [ },\n};',
};

describe('Text Adventure world composition', () => {
  it('puts each editable world before the fixed adventure engine', () => {
    const source = adventureWithWorld(CUSTOM);
    expect(source.python!.startsWith(CUSTOM.python)).toBe(true);
    expect(source.javascript!.startsWith(CUSTOM.javascript)).toBe(true);
    expect(source.python).toContain('class Player:');
    expect(source.javascript).toContain('class Player {');
  });

  it('keeps the boss reference program as the default world plus engine', () => {
    expect(ADVENTURE).toEqual(adventureWithWorld(ADVENTURE_WORLD));
    for (const language of ['python', 'javascript'] as const) {
      expect(ADVENTURE[language]!.startsWith(`${ADVENTURE_WORLD[language]}\n`)).toBe(true);
    }
  });

  it('still uses the default adventure as the boss reference solution', () => {
    const boss = levels.find((l) => l.id === 'boss-4');
    expect(boss && 'solution' in boss ? boss.solution : undefined).toEqual(ADVENTURE);
  });
});

describe.each(['python', 'javascript'] as const)('world builder (%s)', (language) => {
  it('plays the starter world through to the crown', async () => {
    const run = await executors[language](adventureWithWorld(ADVENTURE_WORLD)[language]!, {
      stdin: 'go east\ntake key\ngo west\ngo north\ngo north\ntake crown\n',
    });
    expect(run.error).toBeUndefined();
    expect(run.stdout).toContain('You are in the hall. Exits: north, east. Items: lamp');
    expect(run.stdout).toContain('You win! Rooms explored: 4');
  });

  it("plays a learner's own rooms with the same engine", async () => {
    const run = await executors[language](adventureWithWorld(CUSTOM)[language]!, {
      stdin: 'take torch\ngo down\ntake crown\n',
    });
    expect(run.error).toBeUndefined();
    expect(run.stdout).toContain('You are in the hall. Exits: down. Items: torch');
    expect(run.stdout).toContain('Taken: torch');
    expect(run.stdout).toContain('You are in the cellar. Exits: up. Items: crown');
    expect(run.stdout).toContain('You win! Rooms explored: 2');
  });

  it('reports a broken world on the line the learner wrote it', async () => {
    const run = await executors[language](adventureWithWorld(BROKEN)[language]!, { stdin: 'quit\n' });
    expect(run.error).toBeDefined();
    expect(run.error!.line).toBe(3);
  });
});
