import type { Level } from '@codegames/shared';
import { code } from '../../helpers';
import { lang } from '../../localize';
import { pair } from './shared';

const PICK_WRONG = pair(
  `
  meetings = []
  while True:
      line = input()
      if line == "done":
          break
      name, start, end = line.split()
      meetings.append([name, int(start), int(end)])

  picked = []
  free_at = 0
  for name, start, end in sorted(meetings, key=lambda m: m[1]):
      if start >= free_at:
          picked.append(name)
          free_at = end
  print("Picked:", " ".join(picked))
  print("Count:", len(picked))
  `,
  `
  const meetings = [];
  while (true) {
    const line = prompt();
    if (line === "done") {
      break;
    }
    const [name, start, end] = line.split(" ");
    meetings.push([name, Number(start), Number(end)]);
  }

  const picked = [];
  let freeAt = 0;
  for (const [name, start, end] of [...meetings].sort((a, b) => a[1] - b[1])) {
    if (start >= freeAt) {
      picked.push(name);
      freeAt = end;
    }
  }
  console.log("Picked:", picked.join(" "));
  console.log("Count:", picked.length);
  `,
);

const PICK_RIGHT = {
  python: PICK_WRONG.python.replace('key=lambda m: m[1]', 'key=lambda m: m[2]'),
  javascript: PICK_WRONG.javascript.replace('a[1] - b[1]', 'a[2] - b[2]'),
};

/** greedy-intervals levels, in play order. */
export const greedyIntervalsLevels: Level[] = [
  {
    id: 'greedy-intervals-1',
    conceptId: 'greedy-intervals',
    title: 'Whichever Ends First',
    role: 'intro',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: 'One room, many meeting requests, each `[name, start, end]`. To fit the **most** meetings, a **greedy** rule works: sort by end time and always take the next meeting that starts after the room is free. Which output is right?',
    reinforces: ['higher-order-functions', 'sorting-basics', 'nested-data', 'loops'],
    choices: {
      python: ['Picked: A D E\nCount: 3', 'Picked: A B D E\nCount: 4', 'Picked: C E\nCount: 2', 'Picked: A D F\nCount: 3'],
      javascript: ['Picked: A D E\nCount: 3', 'Picked: A B D E\nCount: 4', 'Picked: C E\nCount: 2', 'Picked: A D F\nCount: 3'],
    },
    hints: [
      'Sorted by end: A (4), B (5), C (6), D (7), then E and F (both 9, E first because the sort keeps the input order for ties).',
      'A is taken; the room is free at 4. B starts at 3 and C at 0: too early. D starts at 5: taken, free at 7.',
      'E starts at 8 ≥ 7: taken, free at 9. F starts at 5: too early.',
    ],
    code: code(
      `
      meetings = [["A", 1, 4], ["B", 3, 5], ["C", 0, 6], ["D", 5, 7], ["E", 8, 9], ["F", 5, 9]]

      picked = []
      free_at = 0
      for name, start, end in sorted(meetings, key=lambda m: m[2]):
          if start >= free_at:
              picked.append(name)
              free_at = end
      print("Picked:", " ".join(picked))
      print("Count:", len(picked))
      `,
      `
      const meetings = [["A", 1, 4], ["B", 3, 5], ["C", 0, 6], ["D", 5, 7], ["E", 8, 9], ["F", 5, 9]];

      const picked = [];
      let freeAt = 0;
      for (const [name, start, end] of [...meetings].sort((a, b) => a[2] - b[2])) {
        if (start >= freeAt) {
          picked.push(name);
          freeAt = end;
        }
      }
      console.log("Picked:", picked.join(" "));
      console.log("Count:", picked.length);
      `,
    ),
    investigate: [
      { question: 'Why "earliest end" rather than "earliest start" or "shortest"?', choices: ['Finishing earliest leaves the most room for whatever comes next, and that can be proven never to lose', 'It is faster to sort', 'Any rule gives the same count'], answer: 0 },
      { question: 'What makes this a **greedy** algorithm?', choices: ['It makes the locally best choice at each step and never reconsiders', 'It tries every combination', 'It uses recursion'], answer: 0 },
    ],
    takeaway: 'A **greedy** algorithm commits to the best-looking choice each step and never backtracks: O(n log n) for the sort, then one pass. It only works when the local choice is provably safe, and interval scheduling by earliest end is the classic case where it is. (Making change with coins 1 3 4 was the classic case where it is not: that needed dynamic programming.)',
  },
  {
    id: 'greedy-intervals-2',
    conceptId: 'greedy-intervals',
    title: 'Sorted by the Wrong Thing',
    role: 'combine',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: 'Read `name start end` lines until `done` and print the most meetings one room can host. For the six meetings from the last level it should print `Picked: A D E` and `Count: 3`.\n\nIt prints `Picked: C E` and `Count: 2`: it keeps grabbing the long early meeting. The greedy rule is right; the **sort key** is wrong.',
    reinforces: ['higher-order-functions', 'sorting-basics', 'nested-data', 'loops', 'input', 'type-conversion'],
    hints: [
      'Each meeting is `[name, start, end]`: index 0, 1, 2.',
      'The sort uses index 1, the start time. Earliest-start greedy picks C (0–6) first and blocks A, B and D.',
      'Sort by index 2, the end time.',
    ],
    starterCode: PICK_WRONG,
    solution: PICK_RIGHT,
    tests: [
      { name: 'six meetings', input: 'A 1 4\nB 3 5\nC 0 6\nD 5 7\nE 8 9\nF 5 9\ndone', expectedOutput: 'Picked: A D E\nCount: 3' },
      { name: 'one long one blocks two short ones', input: 'X 1 10\nY 2 3\nZ 4 5\ndone', expectedOutput: 'Picked: Y Z\nCount: 2', hidden: true },
      { name: 'no overlap at all', input: 'P 1 2\nQ 2 3\nR 3 4\ndone', expectedOutput: 'Picked: P Q R\nCount: 3', hidden: true },
    ],
    takeaway: 'Greedy algorithms live or die by the rule, and the rule lives in the **sort key**. Sorting by start, by length, or by end are all plausible; only end time is correct here, and the only way to know is a counter-example (one long early meeting) or a proof. Test greedy code against the case that tempts the wrong rule.',
  },
  {
    id: 'greedy-intervals-3',
    conceptId: 'greedy-intervals',
    title: 'Room Planner',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: `Read \`name start end\` meetings until \`done\` and print two lines:\n\n\`\`\`\nSchedule: A D E\nRooms needed: 3\n\`\`\`\n\nWrite ${lang('`pick(meetings)`', '`pick(meetings)`')}, which **returns** the names of the most meetings one room can host (earliest end first; for equal ends keep input order), and ${lang('`rooms(meetings)`', '`rooms(meetings)`')}, which returns the fewest rooms needed to host **all** of them: sort the start times and the end times separately, then walk both lists with **two pointers**: a start that is before the next end needs a new room; a start at or after it reuses one. Track the maximum rooms in use.`,
    reinforces: ['higher-order-functions', 'sorting-basics', 'two-pointers', 'nested-data', 'functions', 'return-values', 'while-loops', 'loops', 'input', 'type-conversion', 'string-formatting', 'strings'],
    hints: [
      lang('`pick`: `for name, start, end in sorted(meetings, key=lambda m: m[2])`, keep `free_at`.', '`pick`: `for (const [name, start, end] of [...meetings].sort((a, b) => a[2] - b[2]))`, keep `freeAt`.'),
      lang('`rooms`: `starts = sorted(m[1] for m in meetings)`, `ends = sorted(m[2] for m in meetings)`. `j = 0`, `used = 0`, `best = 0`. For each start: `while ends[j] <= start: used -= 1; j += 1`, then `used += 1` and update `best`.', '`rooms`: `starts = meetings.map((m) => m[1]).sort((a, b) => a - b)`, likewise `ends`. `j = 0`, `used = 0`, `best = 0`. For each start: `while (ends[j] <= start) { used -= 1; j += 1; }`, then `used += 1` and update `best`.'),
      'A meeting that ends at 5 and one that starts at 5 can share a room.',
    ],
    starterCode: code(
      `
      def pick(meetings):
          # Names of the most meetings one room can host.
          pass

      def rooms(meetings):
          # Fewest rooms to host all meetings.
          pass

      meetings = []
      # Read "name start end" until "done", then print Schedule and Rooms needed.
      `,
      `
      function pick(meetings) {
        // Names of the most meetings one room can host.
      }

      function rooms(meetings) {
        // Fewest rooms to host all meetings.
      }

      const meetings = [];
      // Read "name start end" until "done", then print Schedule and Rooms needed.
      `,
    ),
    solution: code(
      `
      def pick(meetings):
          picked = []
          free_at = 0
          for name, start, end in sorted(meetings, key=lambda m: m[2]):
              if start >= free_at:
                  picked.append(name)
                  free_at = end
          return picked

      def rooms(meetings):
          starts = sorted(m[1] for m in meetings)
          ends = sorted(m[2] for m in meetings)
          j = 0
          used = 0
          best = 0
          for start in starts:
              while ends[j] <= start:
                  used -= 1
                  j += 1
              used += 1
              if used > best:
                  best = used
          return best

      meetings = []
      while True:
          line = input()
          if line == "done":
              break
          name, start, end = line.split()
          meetings.append([name, int(start), int(end)])

      print("Schedule:", " ".join(pick(meetings)))
      print("Rooms needed:", rooms(meetings))
      `,
      `
      function pick(meetings) {
        const picked = [];
        let freeAt = 0;
        for (const [name, start, end] of [...meetings].sort((a, b) => a[2] - b[2])) {
          if (start >= freeAt) {
            picked.push(name);
            freeAt = end;
          }
        }
        return picked;
      }

      function rooms(meetings) {
        const starts = meetings.map((m) => m[1]).sort((a, b) => a - b);
        const ends = meetings.map((m) => m[2]).sort((a, b) => a - b);
        let j = 0;
        let used = 0;
        let best = 0;
        for (const start of starts) {
          while (ends[j] <= start) {
            used -= 1;
            j += 1;
          }
          used += 1;
          if (used > best) {
            best = used;
          }
        }
        return best;
      }

      const meetings = [];
      while (true) {
        const line = prompt();
        if (line === "done") {
          break;
        }
        const [name, start, end] = line.split(" ");
        meetings.push([name, Number(start), Number(end)]);
      }

      console.log("Schedule:", pick(meetings).join(" "));
      console.log("Rooms needed:", rooms(meetings));
      `,
    ),
    tests: [
      { name: 'six meetings, three rooms', input: 'A 1 4\nB 3 5\nC 0 6\nD 5 7\nE 8 9\nF 5 9\ndone', expectedOutput: 'Schedule: A D E\nRooms needed: 3' },
      { name: 'back to back needs one room', input: 'P 1 2\nQ 2 3\nR 3 4\ndone', expectedOutput: 'Schedule: P Q R\nRooms needed: 1', hidden: true },
      { name: 'all at once', input: 'X 1 10\nY 2 3\nZ 2 9\ndone', expectedOutput: 'Schedule: Y\nRooms needed: 3', hidden: true },
      {
        name: 'functions on their own',
        input: 'Q 0 1\ndone',
        hidden: true,
        expectedOutput: 'a c 2',
        harness: code(
          '_m = [["a", 0, 2], ["b", 1, 3], ["c", 2, 4]]\nprint(" ".join(pick(_m)), rooms(_m))',
          'const _m = [["a", 0, 2], ["b", 1, 3], ["c", 2, 4]];\nconsole.log(pick(_m).join(" "), rooms(_m));',
        ),
      },
    ],
    takeaway: 'Two interval problems, two tools: "most meetings in one room" is greedy by earliest end; "fewest rooms for all" is a **sweep** with two pointers over sorted starts and ends, the same shape as the two-pointer scans in Region 6. Interval problems fill calendars, CPU schedulers and video editors, and nearly all of them start with "sort by one endpoint".',
  },
];
