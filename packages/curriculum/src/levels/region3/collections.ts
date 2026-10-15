import type { Level } from '@codegames/shared';
import { code } from '../../helpers';
import { lang } from '../../localize';

/** collections levels, in play order. */
export const collectionsLevels: Level[] = [
  {
    id: 'collections-1',
    conceptId: 'collections',
    title: 'Item Shelf',
    role: 'intro',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: `${lang('A **list**', 'An **array**')} stores many values in order, inside \`[ ]\`. Each item has an **index**, starting at **0**, just like the letters of a string.\n\nPredict every line. The last line asks for an item that isn't there: ${lang('if the program crashes, write the **error name** (like `IndexError`) as your last line.', 'what does JavaScript give you instead of crashing?')}`,
    reinforces: ['strings-basics', 'output'],
    hints: [
      'Count from 0: index 0 is the first item, index 2 is the third.',
      `${lang('`append`', '`push`')} adds an item to the **end**, so the length grows by one. ${lang('`"map" in items`', '`items.includes("map")`')} asks *is it in there?* and gives ${lang('`True` or `False`', '`true` or `false`')}.`,
      lang('After the append there are 4 items, at indexes 0 to 3. Index 4 is past the end: Python stops with `IndexError`.', 'After the push there are 4 items, at indexes 0 to 3. Index 4 is past the end: JavaScript quietly gives `undefined`.'),
    ],
    code: code(
      `
      items = ["sword", "shield", "potion"]
      print(items[0])
      print(items[2])
      print(len(items))
      items.append("map")
      print(len(items))
      print(items[-1])
      print("map" in items)
      print(items[4])
      `,
      `
      const items = ["sword", "shield", "potion"];
      console.log(items[0]);
      console.log(items[2]);
      console.log(items.length);
      items.push("map");
      console.log(items.length);
      console.log(items[items.length - 1]);
      console.log(items.includes("map"));
      console.log(items[4]);
      `,
    ),
    expectError: true,
    takeaway: lang(
      'A list keeps items in order. `items[0]` is the first, `items[-1]` the last, `len(items)` counts them, and `.append(x)` adds to the end. `x in items` asks whether `x` is in there (True/False). Reading past the end crashes with **IndexError**.',
      'An array keeps items in order. `items[0]` is the first, `items[items.length - 1]` the last, `.length` counts them, and `.push(x)` adds to the end. `items.includes(x)` asks whether `x` is in there (true/false). Reading past the end gives `undefined` instead of an error, so watch out: the bug shows up later.',
    ),
  },
  {
    id: 'collections-2',
    conceptId: 'collections',
    title: 'Off the End',
    role: 'combine',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: 'This should print the **last** score, `Last score: 30`. Fix it so it still works when the list has a different number of scores (we\'ll test that).',
    reinforces: ['variables', 'operators'],
    hints: [
      'There are 3 scores. What are their indexes?',
      'The last index is always one less than the length.',
      lang('Use `scores[len(scores) - 1]`, or Python\'s shortcut `scores[-1]`.', 'Use `scores[scores.length - 1]`.'),
    ],
    starterCode: code(
      `
      scores = [12, 7, 30]
      print("Last score:", scores[3])
      `,
      `
      const scores = [12, 7, 30];
      console.log("Last score:", scores[3]);
      `,
    ),
    solution: code(
      `
      scores = [12, 7, 30]
      print("Last score:", scores[len(scores) - 1])
      `,
      `
      const scores = [12, 7, 30];
      console.log("Last score:", scores[scores.length - 1]);
      `,
    ),
    tests: [{ name: 'last of three', expectedOutput: 'Last score: 30' }],
    variants: [
      {
        name: 'a longer list',
        replace: { python: [['[12, 7, 30]', '[5, 9, 2, 8, 41]']], javascript: [['[12, 7, 30]', '[5, 9, 2, 8, 41]']] },
        expectedOutput: 'Last score: 41',
      },
    ],
  },
  {
    id: 'collections-3',
    conceptId: 'collections',
    title: 'Two Tags, One List',
    role: 'combine',
    game: 'predict-output',
    mode: 'hybrid',
    choices: { python: ["5 6\n[1, 2, 3, 4]\n[1, 2, 3, 4]", "5 6\n[1, 2, 3]\n[1, 2, 3, 4]", "6 6\n[1, 2, 3, 4]\n[1, 2, 3, 4]"], javascript: ["5 6\n[ 1, 2, 3, 4 ]\n[ 1, 2, 3, 4 ]", "5 6\n[ 1, 2, 3 ]\n[ 1, 2, 3, 4 ]", "6 6\n[ 1, 2, 3, 4 ]\n[ 1, 2, 3, 4 ]"] },
    prompt: `Remember: a variable is a **name tag** on a value. What happens when two tags point at the same ${lang('list', 'array')}? Predict the output.${lang('', ' (JavaScript prints arrays with spaces inside the brackets, `[ 1, 2 ]`, but you can type them either way.)')}`,
    reinforces: ['variables', 'operators'],
    hints: [
      'Numbers: `b = b + 1` makes a new number and moves the `b` tag. `a` is untouched.',
      `Lists: \`copy = team\` doesn't copy anything. Both names now point at **the same** ${lang('list', 'array')}, so ${lang('`append`', '`push`')} through either name changes it.`,
    ],
    code: code(
      `
      a = 5
      b = a
      b = b + 1
      print(a, b)
      team = [1, 2, 3]
      copy = team
      copy.append(4)
      print(team)
      print(copy)
      `,
      `
      let a = 5;
      let b = a;
      b = b + 1;
      console.log(a, b);
      const team = [1, 2, 3];
      const copy = team;
      copy.push(4);
      console.log(team);
      console.log(copy);
      `,
    ),
    modify: {
      prompt: `Now **modify** it so \`copy\` is a real copy: \`team\` should stay \`[1, 2, 3]\`. Change only the line that creates \`copy\`. (Hint: ${lang('`team.copy()`', '`[...team]` or `team.slice()`')}.)`,
      expectedOutput: { python: '5 6\n[1, 2, 3]\n[1, 2, 3, 4]', javascript: '5 6\n[ 1, 2, 3 ]\n[ 1, 2, 3, 4 ]' },
      solution: code(
        `
        a = 5
        b = a
        b = b + 1
        print(a, b)
        team = [1, 2, 3]
        copy = team.copy()
        copy.append(4)
        print(team)
        print(copy)
        `,
        `
        let a = 5;
        let b = a;
        b = b + 1;
        console.log(a, b);
        const team = [1, 2, 3];
        const copy = [...team];
        copy.push(4);
        console.log(team);
        console.log(copy);
        `,
      ),
      requirements: {
        python: [
          { pattern: 'copy\\.append\\(4\\)', message: 'Keep the `copy.append(4)` line.' },
          { pattern: 'print\\(team\\)', message: 'Keep `print(team)`: make the copy real instead.' },
          { pattern: 'copy\\s*=\\s*\\[', forbid: true, message: 'Copy `team`, don\'t type out a new list.' },
        ],
        javascript: [
          { pattern: 'copy\\.push\\(4\\)', message: 'Keep the `copy.push(4)` line.' },
          { pattern: 'console\\.log\\(team\\)', message: 'Keep `console.log(team)`: make the copy real instead.' },
          { pattern: 'copy\\s*=\\s*\\[\\s*\\d', forbid: true, message: 'Copy `team`, don\'t type out a new array.' },
        ],
      },
    },
    takeaway: lang(
      'Assigning a list to a new name doesn\'t copy it: both names are **aliases** for one list. Make a real copy when you want them separate.',
      'Assigning an array to a new name doesn\'t copy it: both names are **aliases** for one array. Make a real copy when you want them separate. (And `const` only stops you **re-pointing** the name; the array it points at can still change.)',
    ),
  },
  {
    id: 'collections-4',
    conceptId: 'collections',
    title: 'Inventory',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: `The first input is how many items you're carrying; then each item is on its own line. Store them in a ${lang('list', 'array')}, then print:\n\n\`\`\`\nItems: 3\nFirst: rope\nLast: torch\n\`\`\`\n\n(for \`3\`, \`rope\`, \`apple\`, \`torch\`). A hidden test carries just one item.`,
    reinforces: ['input', 'type-conversion', 'loops', 'string-formatting'],
    hints: [
      'Start with an empty list and add to it inside a loop that runs n times.',
      lang('`items.append(input())` reads one item and stores it.', '`items.push(prompt())` reads one item and stores it.'),
      lang('The last item is `items[-1]`.', 'The last item is `items[items.length - 1]`.'),
    ],
    starterCode: code(
      `
      n = int(input())
      items = []
      # read n items into the list

      print(f"Items: {len(items)}")
      `,
      `
      const n = Number(prompt());
      const items = [];
      // read n items into the array

      console.log(\`Items: \${items.length}\`);
      `,
    ),
    solution: code(
      `
      n = int(input())
      items = []
      for i in range(n):
          items.append(input())

      print(f"Items: {len(items)}")
      print(f"First: {items[0]}")
      print(f"Last: {items[-1]}")
      `,
      `
      const n = Number(prompt());
      const items = [];
      for (let i = 0; i < n; i++) {
        items.push(prompt());
      }

      console.log(\`Items: \${items.length}\`);
      console.log(\`First: \${items[0]}\`);
      console.log(\`Last: \${items[items.length - 1]}\`);
      `,
    ),
    requirements: {
      python: [{ pattern: '\\.append\\(', message: 'Store the items with `.append()`.' }],
      javascript: [{ pattern: '\\.push\\(', message: 'Store the items with `.push()`.' }],
    },
    tests: [
      { name: 'three items', input: '3\nrope\napple\ntorch', expectedOutput: 'Items: 3\nFirst: rope\nLast: torch' },
      { name: 'four items', input: '4\nmap\nkey\ncoin\nlamp', expectedOutput: 'Items: 4\nFirst: map\nLast: lamp' },
      { name: 'just one item', input: '1\ncompass', expectedOutput: 'Items: 1\nFirst: compass\nLast: compass', hidden: true },
    ],
  },
];
