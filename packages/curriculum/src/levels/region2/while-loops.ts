import type { Level } from '@codegames/shared';
import { code, grid } from '../../helpers';
import { lang } from '../../localize';
import { NEEDS_WHILE } from './shared';

/** while-loops levels, in play order. */
export const whileLoopsLevels: Level[] = [
  {
    id: 'while-loops-1',
    conceptId: 'while-loops',
    title: 'Walk Until the Wall',
    role: 'intro',
    game: 'grid-quest',
    mode: 'fill-blanks',
    prompt: `A **while** loop repeats **as long as** its condition is true, which is perfect when you don't know how many steps you'll need.\n\nYour code must work on hallways of **any** length: walk until blocked, then collect the gem.`,
    reinforces: ['repeat', 'booleans'],
    hints: [lang('`is_blocked()` is True when there\'s a wall ahead.', '`isBlocked()` is true when there\'s a wall ahead.'), lang('Keep moving while `not is_blocked()`.', 'Keep moving while `!isBlocked()`.')],
    grid: grid(`
      ##########
      #>......G#
      ##########
    `),
    extraGrids: [grid(`
      #####
      #>.G#
      #####
    `)],
    starterCode: code(
      `
      while ___:
          move()
      collect()
      `,
      `
      while (___) {
        move();
      }
      collect();
      `,
    ),
    solution: code(
      `
      while not is_blocked():
          move()
      collect()
      `,
      `
      while (!isBlocked()) {
        move();
      }
      collect();
      `,
    ),
    requirements: NEEDS_WHILE,
    takeaway: 'Use **for** when you know how many times to repeat, and **while** when you repeat until something happens.',
  },
  {
    id: 'while-loops-5',
    conceptId: 'while-loops',
    title: 'Trace Table',
    role: 'combine',
    game: 'predict-output',
    remix: true,
    mode: 'hybrid',
    prompt: 'Programmers trace loops with a **table**: one column per variable, one row per round. Make one on paper, then predict what this prints.',
    reinforces: ['operators', 'variables'],
    hints: ['Start: x = 1, steps = 0. Is 1 < 20? Then run the body.', 'Rounds: x becomes 3, then 9, then 27. Is 27 < 20?'],
    code: code(
      `
      x = 1
      steps = 0
      while x < 20:
          x = x * 3
          steps += 1
      print(x, steps)
      `,
      `
      let x = 1;
      let steps = 0;
      while (x < 20) {
        x = x * 3;
        steps += 1;
      }
      console.log(x, steps);
      `,
    ),
    takeaway: 'The condition is only checked at the **start** of each round, so the last value can overshoot the limit (27 > 20).',
    investigate: [
      {
        question: 'Why can `x` end up bigger than the limit in the condition?',
        choices: ['The condition is only checked at the start of each round, before the body runs', 'The loop stops the moment `x` passes the limit, mid-line', 'The `<` sign lets `x` go a bit over'],
        answer: 0,
      },
      {
        question: 'What does `steps` count?',
        choices: ['How many times the loop body ran', 'How many times the condition was checked', 'The final value of `x`'],
        answer: 0,
      },
    ],
  },
  {
    id: 'while-loops-2',
    conceptId: 'while-loops',
    title: 'Countdown Scramble',
    role: 'combine',
    game: 'parsons',
    mode: 'parsons',
    prompt: 'Arrange the lines into a countdown that reads a number and counts down to 1, then prints `Liftoff!`. **Watch out**: one line doesn\'t belong!',
    reinforces: ['input', 'type-conversion', 'operators'],
    hints: ['The loop needs to make n smaller each time, or it never ends.', 'Liftoff is printed once, after the loop.'],
    solution: code(
      `
      n = int(input())
      while n > 0:
          print(n)
          n -= 1
      print("Liftoff!")
      `,
      `
      let n = Number(prompt());
      while (n > 0) {
        console.log(n);
        n -= 1;
      }
      console.log("Liftoff!");
      `,
    ),
    distractors: { python: ['    n += 1'], javascript: ['  n += 1;'] },
    tests: [
      { name: 'from 3', input: '3', expectedOutput: '3\n2\n1\nLiftoff!' },
      { name: 'from 1', input: '1', expectedOutput: '1\nLiftoff!' },
    ],
  },
  {
    id: 'while-loops-4',
    conceptId: 'while-loops',
    title: 'Forever and Ever',
    role: 'combine',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: 'This countdown never stops! Run it and see what happens, then fix it so it counts down from the input number to 1.\n\nEvery while loop needs something inside it that eventually makes the condition **false**.',
    reinforces: ['input', 'operators', 'first-errors'],
    hints: ['Run it: what does the error say?', 'Look at the loop condition `n > 0`. Does `n` ever change inside the loop?', 'Add a line inside the loop that makes `n` smaller: `n -= 1`.'],
    starterCode: code(
      `
      n = int(input())
      while n > 0:
          print(n)
      `,
      `
      let n = Number(prompt());
      while (n > 0) {
        console.log(n);
      }
      `,
    ),
    solution: code(
      `
      n = int(input())
      while n > 0:
          print(n)
          n -= 1
      `,
      `
      let n = Number(prompt());
      while (n > 0) {
        console.log(n);
        n -= 1;
      }
      `,
    ),
    tests: [
      { name: 'from 3', input: '3', expectedOutput: '3\n2\n1' },
      { name: 'from 5', input: '5', expectedOutput: '5\n4\n3\n2\n1', hidden: true },
    ],
    takeaway: 'An **infinite loop** happens when the condition never becomes false. When a program "hangs", check what changes inside the loop.',
  },
  {
    id: 'while-loops-3',
    conceptId: 'while-loops',
    title: 'Savings Goal',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: 'Read a **savings goal**, then how much you **save each week**. Starting from 0, count how many weeks it takes to reach the goal (or pass it). Print:\n\n```\nWeeks: 4\n```\n\n(goal 100, saving 30 per week → 30, 60, 90, 120).',
    reinforces: ['input', 'type-conversion', 'operators', 'booleans', 'string-formatting'],
    hints: ['Keep two variables: saved and weeks, both starting at 0.', 'Loop while saved < goal: add the weekly amount and count a week.'],
    starterCode: code(
      `
      # 1. SET UP: read the goal and the weekly amount,
      #    then start the amount saved and the week count at 0
      # 2. LOOP: keep going as long as the goal is not reached yet
      #    2a. UPDATE: add one week's savings
      #    2b. UPDATE: count one more week
      # 3. REPORT: after the loop, print Weeks: …
      `,
      `
      // 1. SET UP: read the goal and the weekly amount,
      //    then start the amount saved and the week count at 0
      // 2. LOOP: keep going as long as the goal is not reached yet
      //    2a. UPDATE: add one week's savings
      //    2b. UPDATE: count one more week
      // 3. REPORT: after the loop, print Weeks: …
      `,
    ),
    solution: code(
      `
      goal = int(input())
      weekly = int(input())
      saved = 0
      weeks = 0
      while saved < goal:
          saved += weekly
          weeks += 1
      print(f"Weeks: {weeks}")
      `,
      `
      const goal = Number(prompt());
      const weekly = Number(prompt());
      let saved = 0;
      let weeks = 0;
      while (saved < goal) {
        saved += weekly;
        weeks += 1;
      }
      console.log(\`Weeks: \${weeks}\`);
      `,
    ),
    tests: [
      { name: '100 by 30', input: '100\n30', expectedOutput: 'Weeks: 4' },
      { name: 'one week', input: '50\n50', expectedOutput: 'Weeks: 1' },
      { name: 'hidden', input: '10\n3', expectedOutput: 'Weeks: 4', hidden: true },
    ],
    requirements: NEEDS_WHILE,
    parallelExample: {
      prompt: '**Growing plant:** it starts 5 cm tall and grows 4 cm a day. How many days until it reaches 20 cm? Two variables change each round: the height and the day count.',
      code: code(
        `
        height = 5
        target = 20
        days = 0
        while height < target:
            height += 4
            days += 1
        print(f"Days: {days}")
        `,
        `
        let height = 5;
        const target = 20;
        let days = 0;
        while (height < target) {
          height += 4;
          days += 1;
        }
        console.log(\`Days: \${days}\`);
        `,
      ),
    },
  },
];
