import type { Level } from '@codegames/shared';
import { code } from '../../helpers';
import { lang } from '../../localize';

/** nested-data levels, in play order. */
export const nestedDataLevels: Level[] = [
  {
    id: 'nested-data-1',
    conceptId: 'nested-data',
    title: 'Party Roster',
    role: 'intro',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: `Real data is nested: a ${lang('list', 'array')} of **records**, each record ${lang('a dictionary', 'an object')}, and some values are ${lang('lists', 'arrays')} themselves. Read each lookup from the outside in, and predict the output.`,
    reinforces: ['collections'],
    hints: [
      lang('`party[0]` is Ada\'s whole record; `party[0]["name"]` is just her name.', '`party[0]` is Ada\'s whole record; `party[0].name` is just her name.'),
      lang('`.remove("staff")` takes "staff" out of Ada\'s items, so only "map" is left.', '`indexOf("staff")` finds where "staff" is (0), and `splice(0, 1)` cuts that one item out, so only "map" is left.'),
      'Bo started with no items and got "rope". After the change, Ada\'s first item is "map".',
    ],
    code: code(
      `
      party = [
          {"name": "Ada", "hp": 12, "items": ["staff", "map"]},
          {"name": "Bo", "hp": 7, "items": []},
      ]
      print(party[0]["name"])
      print(party[1]["hp"])
      party[1]["items"].append("rope")
      party[0]["items"].remove("staff")
      print(party[0]["items"], party[1]["items"])
      for hero in party:
          print(hero["name"], hero["hp"])
      print(party[0]["items"][0])
      `,
      `
      const party = [
        { name: "Ada", hp: 12, items: ["staff", "map"] },
        { name: "Bo", hp: 7, items: [] },
      ];
      console.log(party[0].name);
      console.log(party[1]["hp"]);
      party[1].items.push("rope");
      const ada = party[0].items;
      ada.splice(ada.indexOf("staff"), 1);
      console.log(party[0].items, party[1].items);
      for (const hero of party) {
        console.log(hero.name, hero.hp);
      }
      console.log(party[0].items[0]);
      `,
    ),
    takeaway: lang(
      'Read nested data from the outside in: `party[0]` is a record, `["items"]` its list, `[0]` the first item. `.remove(x)` takes a value out of a list.',
      'Read nested data from the outside in: `party[0]` is a record, `.items` its array, `[0]` the first item. `indexOf` finds an item\'s position, and `splice(pos, 1)` cuts one item out.',
    ),
  },
  {
    id: 'nested-data-2',
    conceptId: 'nested-data',
    title: 'Silent Typo',
    role: 'combine',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: 'A trap hits the party: every hero takes 3 damage. But the HP never changes, and there\'s no error! Find the bug. (We\'ll test other HP values too.)',
    reinforces: ['iterating-collections', 'string-formatting'],
    hints: [
      'The second loop prints `hp`. Which key does the first loop write to?',
      'Look very closely at the spelling of each key.',
      lang('`hero["hpp"]` should be `hero["hp"]`. Writing to a misspelled key just makes a new key.', '`hero.hpp` should be `hero.hp`. Writing to a misspelled key just makes a new key.'),
    ],
    starterCode: code(
      `
      party = [{"name": "Ada", "hp": 12}, {"name": "Bo", "hp": 7}]
      for hero in party:
          hero["hpp"] = hero["hp"] - 3
      for hero in party:
          print(f"{hero['name']}: {hero['hp']}")
      `,
      `
      const party = [{ name: "Ada", hp: 12 }, { name: "Bo", hp: 7 }];
      for (const hero of party) {
        hero.hpp = hero.hp - 3;
      }
      for (const hero of party) {
        console.log(\`\${hero.name}: \${hero.hp}\`);
      }
      `,
    ),
    solution: code(
      `
      party = [{"name": "Ada", "hp": 12}, {"name": "Bo", "hp": 7}]
      for hero in party:
          hero["hp"] = hero["hp"] - 3
      for hero in party:
          print(f"{hero['name']}: {hero['hp']}")
      `,
      `
      const party = [{ name: "Ada", hp: 12 }, { name: "Bo", hp: 7 }];
      for (const hero of party) {
        hero.hp = hero.hp - 3;
      }
      for (const hero of party) {
        console.log(\`\${hero.name}: \${hero.hp}\`);
      }
      `,
    ),
    requirements: {
      python: [{ pattern: 'hpp', forbid: true, message: 'There is no `hpp` key in the records: fix the spelling.' }],
      javascript: [{ pattern: 'hpp', forbid: true, message: 'There is no `hpp` key in the records: fix the spelling.' }],
    },
    tests: [{ name: 'everyone takes 3 damage', expectedOutput: 'Ada: 9\nBo: 4' }],
    variants: [
      {
        name: 'other HP values',
        replace: {
          python: [['party = [{"name": "Ada", "hp": 12}, {"name": "Bo", "hp": 7}]', 'party = [{"name": "Ada", "hp": 20}, {"name": "Bo", "hp": 4}, {"name": "Cy", "hp": 10}]']],
          javascript: [['const party = [{ name: "Ada", hp: 12 }, { name: "Bo", hp: 7 }];', 'const party = [{ name: "Ada", hp: 20 }, { name: "Bo", hp: 4 }, { name: "Cy", hp: 10 }];']],
        },
        expectedOutput: 'Ada: 17\nBo: 1\nCy: 7',
      },
    ],
    takeaway: `A misspelled key is **not** an error: assigning to it silently creates a new field, and the real one never changes. Records don't know their own shape. Classes (coming up) let you define that shape once.`,
  },
  {
    id: 'nested-data-3',
    conceptId: 'nested-data',
    title: 'High Score',
    role: 'combine',
    game: 'parsons',
    mode: 'parsons',
    prompt: 'Arrange the lines to find the player with the best score and print `Winner: Bo (75)`. **One line is a trap.**',
    reinforces: ['iterating-collections', 'conditionals'],
    hints: [
      'This is Coldest Day again, one level deeper: keep the "best so far", and let each player challenge it.',
      'Keep the whole **record** as the best so far, not just its score: you need the name at the end.',
      lang('Start with `best = players[0]`, and compare `p["score"] > best["score"]`.', 'Start with `let best = players[0];`, and compare `p.score > best.score`.'),
    ],
    solution: code(
      `
      players = [{"name": "Ada", "score": 40}, {"name": "Bo", "score": 75}, {"name": "Cy", "score": 60}]
      best = players[0]
      for p in players:
          if p["score"] > best["score"]:
              best = p
      print(f"Winner: {best['name']} ({best['score']})")
      `,
      `
      const players = [{ name: "Ada", score: 40 }, { name: "Bo", score: 75 }, { name: "Cy", score: 60 }];
      let best = players[0];
      for (const p of players) {
        if (p.score > best.score) {
          best = p;
        }
      }
      console.log(\`Winner: \${best.name} (\${best.score})\`);
      `,
    ),
    distractors: { python: ['best = players[0]["score"]'], javascript: ['let best = players[0].score;'] },
    tests: [{ name: 'the winner', expectedOutput: 'Winner: Bo (75)' }],
    takeaway: 'Keep the whole record as your "best so far", not just one field from it. Then everything about the winner is still there when you need it.',
  },
  {
    id: 'nested-data-4',
    conceptId: 'nested-data',
    title: 'Room Map',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: `\`rooms\` maps each room to its exits, and each room's exits map a direction to the next room.\n\n1. Complete ${lang('`next_room(rooms, here, direction)`', '`nextRoom(rooms, here, direction)`')}: it **returns** the room you reach, or \`here\` if there's no exit that way.\n2. Start in the hall. Read directions until \`stop\`. Print \`You walk to the kitchen\`, or \`Bump!\` if you can't go that way. At the end print \`You end in the …\`.\n\nHidden tests call your function with a different map.`,
    reinforces: ['maps', 'functions', 'return-values', 'while-loops', 'loop-control', 'conditionals', 'input', 'string-formatting'],
    hints: [
      lang('`rooms[here]` is the exits of the room you\'re in, like `{"north": "library", "east": "kitchen"}`.', '`rooms[here]` is the exits of the room you\'re in, like `{ north: "library", east: "kitchen" }`.'),
      lang('If `direction in exits`, return `exits[direction]`; otherwise return `here`. Use the `rooms` **parameter**, not the outside variable.', 'If `direction in exits`, return `exits[direction]`; otherwise return `here`. Use the `rooms` **parameter**, not the outside variable.'),
      lang('Main loop: `here = "hall"`, then `while True:` read a direction, `break` on "stop", and compare `new = next_room(rooms, here, direction)` with `here`.', 'Main loop: `let here = "hall";`, then `while (true)` read a direction, `break` on "stop", and compare `const next = nextRoom(rooms, here, direction);` with `here`.'),
    ],
    starterCode: code(
      `
      rooms = {
          "hall": {"north": "library", "east": "kitchen"},
          "kitchen": {"west": "hall"},
          "library": {"south": "hall"},
      }

      def next_room(rooms, here, direction):
          # look up the exits of here; return where direction leads, or here
          return here

      # start in the hall
      # read directions until "stop"
      # print "You walk to the ..." or "Bump!"
      # at the end print "You end in the ..."
      `,
      `
      const rooms = {
        hall: { north: "library", east: "kitchen" },
        kitchen: { west: "hall" },
        library: { south: "hall" },
      };

      function nextRoom(rooms, here, direction) {
        // look up the exits of here; return where direction leads, or here
        return here;
      }

      // start in the hall
      // read directions until "stop"
      // print "You walk to the ..." or "Bump!"
      // at the end print "You end in the ..."
      `,
    ),
    solution: code(
      `
      rooms = {
          "hall": {"north": "library", "east": "kitchen"},
          "kitchen": {"west": "hall"},
          "library": {"south": "hall"},
      }

      def next_room(rooms, here, direction):
          exits = rooms[here]
          if direction in exits:
              return exits[direction]
          return here

      here = "hall"
      while True:
          direction = input()
          if direction == "stop":
              break
          new = next_room(rooms, here, direction)
          if new == here:
              print("Bump!")
          else:
              here = new
              print(f"You walk to the {here}")
      print(f"You end in the {here}")
      `,
      `
      const rooms = {
        hall: { north: "library", east: "kitchen" },
        kitchen: { west: "hall" },
        library: { south: "hall" },
      };

      function nextRoom(rooms, here, direction) {
        const exits = rooms[here];
        if (direction in exits) {
          return exits[direction];
        }
        return here;
      }

      let here = "hall";
      while (true) {
        const direction = prompt();
        if (direction === "stop") {
          break;
        }
        const next = nextRoom(rooms, here, direction);
        if (next === here) {
          console.log("Bump!");
        } else {
          here = next;
          console.log(\`You walk to the \${here}\`);
        }
      }
      console.log(\`You end in the \${here}\`);
      `,
    ),
    tests: [
      {
        name: 'a walk around',
        input: 'east\neast\nwest\nnorth\nstop',
        expectedOutput: 'You walk to the kitchen\nBump!\nYou walk to the hall\nYou walk to the library\nYou end in the library',
      },
      { name: 'stay put', input: 'stop', expectedOutput: 'You end in the hall', hidden: true },
      {
        name: 'a different map',
        input: 'stop',
        expectedOutput: 'b b',
        harness: {
          python: '_m = {"a": {"up": "b"}, "b": {}}\nprint(next_room(_m, "a", "up"), next_room(_m, "b", "up"))',
          javascript: 'const _m = { a: { up: "b" }, b: {} };\nconsole.log(nextRoom(_m, "a", "up"), nextRoom(_m, "b", "up"));',
        },
        hidden: true,
      },
    ],
    takeaway: `${lang('A dictionary', 'An object')} of ${lang('dictionaries', 'objects')} is a map of a whole world: \`rooms[here][direction]\` reads it from the outside in. The function uses its own \`rooms\` parameter, so it works on **any** map you hand it. (You'll need this for the boss!)`,
  },
  {
    id: 'nested-data-5',
    conceptId: 'nested-data',
    title: 'Gradebook',
    role: 'challenge',
    game: 'build-it',
    mode: 'freeform',
    prompt: `\`grades\` maps each student to a ${lang('list', 'array')} of marks. Write \`average(nums)\`, which **returns** the average (add up with a loop: no ${lang('`sum`', '`reduce`')}). Then print each student's average to 1 decimal place, and the top student (the first one wins a tie):\n\n\`\`\`\nAda: 84.0\nBo: 67.5\nCy: 89.0\nTop student: Cy\n\`\`\`\n\nWe'll test it with another gradebook too. *Optional challenge.*`,
    reinforces: ['map-patterns', 'functions', 'return-values', 'iterating-collections', 'conditionals', 'string-formatting'],
    hints: [
      'You wrote `average` back in Average Function: a total, a loop, then divide by how many.',
      lang('Loop with `for name, marks in grades.items():` and print `f"{name}: {average(marks):.1f}"`.', 'Loop with `for (const [name, marks] of Object.entries(grades))` and print `average(marks).toFixed(1)`.'),
      'Top student is "best so far" again: keep the name whose average beats the best average so far.',
    ],
    starterCode: code(
      `
      grades = {"Ada": [90, 85, 77], "Bo": [60, 75], "Cy": [88, 92, 95, 81]}
      `,
      `
      const grades = { Ada: [90, 85, 77], Bo: [60, 75], Cy: [88, 92, 95, 81] };
      `,
    ),
    solution: code(
      `
      grades = {"Ada": [90, 85, 77], "Bo": [60, 75], "Cy": [88, 92, 95, 81]}

      def average(nums):
          total = 0
          for n in nums:
              total += n
          return total / len(nums)

      top = ""
      for name, marks in grades.items():
          avg = average(marks)
          print(f"{name}: {avg:.1f}")
          if top == "" or avg > average(grades[top]):
              top = name
      print(f"Top student: {top}")
      `,
      `
      const grades = { Ada: [90, 85, 77], Bo: [60, 75], Cy: [88, 92, 95, 81] };

      function average(nums) {
        let total = 0;
        for (const n of nums) {
          total += n;
        }
        return total / nums.length;
      }

      let top = "";
      for (const [name, marks] of Object.entries(grades)) {
        const avg = average(marks);
        console.log(\`\${name}: \${avg.toFixed(1)}\`);
        if (top === "" || avg > average(grades[top])) {
          top = name;
        }
      }
      console.log(\`Top student: \${top}\`);
      `,
    ),
    requirements: {
      python: [{ pattern: '\\bsum\\(', forbid: true, message: 'Add the marks up with your own loop: no `sum` this time.' }],
      javascript: [{ pattern: '\\.reduce\\(', forbid: true, message: 'Add the marks up with your own loop: no `.reduce` this time.' }],
    },
    tests: [
      { name: 'the gradebook', expectedOutput: 'Ada: 84.0\nBo: 67.5\nCy: 89.0\nTop student: Cy' },
      {
        name: 'average([1, 2])',
        expectedOutput: '1.5',
        harness: { python: 'print(average([1, 2]))', javascript: 'console.log(average([1, 2]));' },
        hidden: true,
      },
    ],
    variants: [
      {
        name: 'another gradebook',
        replace: {
          python: [['grades = {"Ada": [90, 85, 77], "Bo": [60, 75], "Cy": [88, 92, 95, 81]}', 'grades = {"Dee": [50, 60], "Eli": [100, 90, 95], "Fay": [70], "Gus": [95, 95]}']],
          javascript: [['const grades = { Ada: [90, 85, 77], Bo: [60, 75], Cy: [88, 92, 95, 81] };', 'const grades = { Dee: [50, 60], Eli: [100, 90, 95], Fay: [70], Gus: [95, 95] };']],
        },
        expectedOutput: 'Dee: 55.0\nEli: 95.0\nFay: 70.0\nGus: 95.0\nTop student: Eli',
      },
    ],
    takeaway: `${lang('A dictionary of lists', 'An object of arrays')} is a tiny database. Old tools still work on the inside: \`average\` doesn't care that its ${lang('list', 'array')} came out of ${lang('a dictionary', 'an object')}.`,
  },
];
