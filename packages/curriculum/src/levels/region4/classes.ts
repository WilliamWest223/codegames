import type { Level } from '@codegames/shared';
import { code } from '../../helpers';
import { lang } from '../../localize';

/** classes levels, in play order. */
export const classesLevels: Level[] = [
  {
    id: 'classes-1',
    conceptId: 'classes',
    title: 'Pet Factory',
    role: 'intro',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: `A **class** is a blueprint for making objects. \`class Pet\` describes what every pet has; ${lang('`Pet("Rex", "woof")`', '`new Pet("Rex", "woof")`')} builds one real pet. ${lang('`__init__`', 'The `constructor`')} runs once for each new pet and stores its data on ${lang('`self`', '`this`')}.\n\nTwo pets are made here, and one gets a second name tag. Predict every line.`,
    reinforces: ['collections'],
    hints: [
      `Each ${lang('`Pet(...)`', '`new Pet(...)`')} builds a **separate** pet with its own name, sound and hunger. Changing \`tom.hunger\` changes only Tom.`,
      `Every pet starts with \`hunger\` 5, because ${lang('`__init__`', 'the constructor')} sets it.`,
      `Remember Two Tags, One List: \`twin = rex\` doesn't copy the pet. \`twin\` and \`rex\` are two names for **the same** object, so changing \`twin.hunger\` changes Rex.`,
    ],
    code: code(
      `
      class Pet:
          def __init__(self, name, sound):
              self.name = name
              self.sound = sound
              self.hunger = 5

      rex = Pet("Rex", "woof")
      tom = Pet("Tom", "meow")
      tom.hunger = 2
      print(rex.name, rex.sound)
      print(rex.hunger, tom.hunger)
      twin = rex
      twin.hunger = 0
      print(rex.hunger)
      `,
      `
      class Pet {
        constructor(name, sound) {
          this.name = name;
          this.sound = sound;
          this.hunger = 5;
        }
      }

      const rex = new Pet("Rex", "woof");
      const tom = new Pet("Tom", "meow");
      tom.hunger = 2;
      console.log(rex.name, rex.sound);
      console.log(rex.hunger, tom.hunger);
      const twin = rex;
      twin.hunger = 0;
      console.log(rex.hunger);
      `,
    ),
    takeaway: lang(
      'A class is a **blueprint**; each `Pet(...)` builds a separate object with its own data. `__init__` runs once per object and stores the data on `self` (`self.name = name`). Read it back with a dot: `rex.name`. And like lists, `twin = rex` makes a second name for the same object, not a copy.',
      'A class is a **blueprint**; each `new Pet(...)` builds a separate object with its own data. The `constructor` runs once per object and stores the data on `this` (`this.name = name`). Read it back with a dot: `rex.name`. And like arrays, `twin = rex` makes a second name for the same object, not a copy.',
    ),
  },
  {
    id: 'classes-2',
    conceptId: 'classes',
    title: 'Forgot the Tag',
    role: 'combine',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: `Read a hero's **name** and **HP**, build a \`Hero\`, and print \`Ada (HP 12)\`. ${lang('Python crashes: the hero has no `name`.', 'JavaScript prints `undefined (HP undefined)`.')} The bug is inside the ${lang('`__init__`', 'constructor')}. Fix it.`,
    reinforces: ['scope', 'input', 'type-conversion', 'string-formatting'],
    hints: [
      `Remember Inside and Outside: a plain \`name = name\` inside a function makes a **local** variable that disappears when the function ends.`,
      `To store data **on the object**, put it on ${lang('`self`', '`this`')}.`,
      lang('Write `self.name = name` and `self.hp = hp`.', 'Write `this.name = name;` and `this.hp = hp;`.'),
    ],
    starterCode: code(
      `
      class Hero:
          def __init__(self, name, hp):
              name = name
              hp = hp

      name = input()
      hp = int(input())
      hero = Hero(name, hp)
      print(f"{hero.name} (HP {hero.hp})")
      `,
      `
      class Hero {
        constructor(name, hp) {
          name = name;
          hp = hp;
        }
      }

      const name = prompt();
      const hp = Number(prompt());
      const hero = new Hero(name, hp);
      console.log(\`\${hero.name} (HP \${hero.hp})\`);
      `,
    ),
    solution: code(
      `
      class Hero:
          def __init__(self, name, hp):
              self.name = name
              self.hp = hp

      name = input()
      hp = int(input())
      hero = Hero(name, hp)
      print(f"{hero.name} (HP {hero.hp})")
      `,
      `
      class Hero {
        constructor(name, hp) {
          this.name = name;
          this.hp = hp;
        }
      }

      const name = prompt();
      const hp = Number(prompt());
      const hero = new Hero(name, hp);
      console.log(\`\${hero.name} (HP \${hero.hp})\`);
      `,
    ),
    tests: [
      { name: 'Ada with 12 HP', input: 'Ada\n12', expectedOutput: 'Ada (HP 12)' },
      {
        name: 'a hero built by hidden code keeps its data',
        input: 'Ada\n12',
        expectedOutput: 'Bo 3',
        hidden: true,
        harness: { python: '_h = Hero("Bo", 3)\nprint(_h.name, _h.hp)', javascript: 'const _h = new Hero("Bo", 3);\nconsole.log(_h.name, _h.hp);' },
      },
    ],
    takeaway: `Inside ${lang('`__init__`', 'the constructor')}, \`name = name\` only makes a local variable. ${lang('`self.name = name`', '`this.name = name`')} stores it on the object, where it lives as long as the object does.`,
  },
  {
    id: 'classes-3',
    conceptId: 'classes',
    title: 'New Recruit',
    role: 'combine',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: `Build a team of recruits, promote the second one, and print:\n\n\`\`\`\nAda: rank 1\nBo: rank 2\n\`\`\`\n\n${lang('Python says `Recruit() takes no arguments`, even though `Recruit` clearly takes a name and a rank. Look very closely at the spelling.', 'JavaScript says `Class constructor Recruit cannot be invoked without \'new\'`. A class isn\'t called like a plain function.')}`,
    reinforces: ['functions', 'iterating-collections'],
    hints: [
      lang('Python only runs `__init__` if it is spelled **exactly** right. Otherwise the class has no setup, so it takes no arguments.', 'Look at the line that builds each recruit. How did Pet Factory make a pet?'),
      lang('Count the underscores: it needs **two** on each side, `__init__`.', 'Every object is made with `new`: `new Recruit(name, 1)`.'),
    ],
    starterCode: code(
      `
      class Recruit:
          def _init_(self, name, rank):
              self.name = name
              self.rank = rank

      team = []
      for name in ["Ada", "Bo"]:
          team.append(Recruit(name, 1))
      team[1].rank = 2
      for r in team:
          print(f"{r.name}: rank {r.rank}")
      `,
      `
      class Recruit {
        constructor(name, rank) {
          this.name = name;
          this.rank = rank;
        }
      }

      const team = [];
      for (const name of ["Ada", "Bo"]) {
        team.push(Recruit(name, 1));
      }
      team[1].rank = 2;
      for (const r of team) {
        console.log(\`\${r.name}: rank \${r.rank}\`);
      }
      `,
    ),
    solution: code(
      `
      class Recruit:
          def __init__(self, name, rank):
              self.name = name
              self.rank = rank

      team = []
      for name in ["Ada", "Bo"]:
          team.append(Recruit(name, 1))
      team[1].rank = 2
      for r in team:
          print(f"{r.name}: rank {r.rank}")
      `,
      `
      class Recruit {
        constructor(name, rank) {
          this.name = name;
          this.rank = rank;
        }
      }

      const team = [];
      for (const name of ["Ada", "Bo"]) {
        team.push(new Recruit(name, 1));
      }
      team[1].rank = 2;
      for (const r of team) {
        console.log(\`\${r.name}: rank \${r.rank}\`);
      }
      `,
    ),
    tests: [
      { name: 'the team roll call', expectedOutput: 'Ada: rank 1\nBo: rank 2' },
      {
        name: 'a recruit built by hidden code',
        expectedOutput: 'Cy 3',
        hidden: true,
        harness: { python: '_r = Recruit("Cy", 3)\nprint(_r.name, _r.rank)', javascript: 'const _r = new Recruit("Cy", 3);\nconsole.log(_r.name, _r.rank);' },
      },
    ],
    takeaway: lang(
      'Python\'s special names are exact: `__init__` has two underscores on each side. Spell it any other way and it\'s just an ordinary method that never runs.',
      'A class isn\'t a function: build objects with `new ClassName(...)`. Without `new`, JavaScript refuses to run the constructor.',
    ),
  },
  {
    id: 'classes-4',
    conceptId: 'classes',
    title: 'Card Collection',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: `Line 1 is **n**, then n lines \`NAME POWER\`. Make a \`Card\` class that stores a \`name\` and a \`power\` (a number), store a Card object for each line in a ${lang('list', 'array')}, then print the count, the total power and the strongest card:\n\n\`\`\`\nCards: 3\nTotal power: 17\nStrongest: Dragon (9)\n\`\`\`\n\n(for \`3\`, \`Imp 3\`, \`Dragon 9\`, \`Elf 5\`). Hidden tests build Cards of their own.`,
    reinforces: ['collections', 'iterating-collections', 'strings', 'loops', 'input', 'type-conversion', 'conditionals', 'string-formatting'],
    hints: [
      `Start with the class: ${lang('`__init__(self, name, power)`', '`constructor(name, power)`')} stores both on ${lang('`self`', '`this`')}.`,
      lang('In a loop that runs n times: `parts = input().split()`, then `cards.append(Card(parts[0], int(parts[1])))`.', 'In a loop that runs n times: `const parts = prompt().split(" ");`, then `cards.push(new Card(parts[0], Number(parts[1])));`.'),
      'For the strongest, use "best so far" with whole cards: start with `best = cards[0]`, and swap it when `card.power > best.power`.',
    ],
    starterCode: code(
      `
      class Card:
          def __init__(self, name, power):
              # store the name and the power on the object
              pass

      n = int(input())
      cards = []
      # read n lines "NAME POWER" and add a Card for each

      # then print the count, the total power and the strongest card
      `,
      `
      class Card {
        constructor(name, power) {
          // store the name and the power on the object
        }
      }

      const n = Number(prompt());
      const cards = [];
      // read n lines "NAME POWER" and add a Card for each

      // then print the count, the total power and the strongest card
      `,
    ),
    solution: code(
      `
      class Card:
          def __init__(self, name, power):
              self.name = name
              self.power = power

      n = int(input())
      cards = []
      for i in range(n):
          parts = input().split()
          cards.append(Card(parts[0], int(parts[1])))

      total = 0
      best = cards[0]
      for card in cards:
          total += card.power
          if card.power > best.power:
              best = card
      print(f"Cards: {len(cards)}")
      print(f"Total power: {total}")
      print(f"Strongest: {best.name} ({best.power})")
      `,
      `
      class Card {
        constructor(name, power) {
          this.name = name;
          this.power = power;
        }
      }

      const n = Number(prompt());
      const cards = [];
      for (let i = 0; i < n; i++) {
        const parts = prompt().split(" ");
        cards.push(new Card(parts[0], Number(parts[1])));
      }

      let total = 0;
      let best = cards[0];
      for (const card of cards) {
        total += card.power;
        if (card.power > best.power) {
          best = card;
        }
      }
      console.log(\`Cards: \${cards.length}\`);
      console.log(\`Total power: \${total}\`);
      console.log(\`Strongest: \${best.name} (\${best.power})\`);
      `,
    ),
    requirements: {
      python: [
        { pattern: 'class\\s+Card', message: 'Make a `Card` class.' },
      ],
      javascript: [
        { pattern: 'class\\s+Card', message: 'Make a `Card` class.' },
      ],
    },
    tests: [
      { name: 'three cards', input: '3\nImp 3\nDragon 9\nElf 5', expectedOutput: 'Cards: 3\nTotal power: 17\nStrongest: Dragon (9)' },
      { name: 'strongest comes last', input: '4\nBat 2\nOrc 4\nAnt 1\nTroll 8', expectedOutput: 'Cards: 4\nTotal power: 15\nStrongest: Troll (8)' },
      { name: 'a single card', input: '1\nElf 5', expectedOutput: 'Cards: 1\nTotal power: 5\nStrongest: Elf (5)', hidden: true },
      {
        name: 'a new Card keeps its data',
        input: '1\nOrc 4',
        expectedOutput: 'Imp 3',
        hidden: true,
        harness: { python: '_c = Card("Imp", 3)\nprint(_c.name, _c.power)', javascript: 'const _c = new Card("Imp", 3);\nconsole.log(_c.name, _c.power);' },
      },
      {
        name: 'cards holds Card objects',
        input: '2\nImp 3\nElf 5',
        expectedOutput: 'Imp 5',
        hidden: true,
        harness: { python: 'print(cards[0].name, cards[1].power)', javascript: 'console.log(cards[0].name, cards[1].power);' },
      },
    ],
    takeaway: 'A list of objects is a list of records with a shape you designed: each `Card` carries its own name and power, so "best so far" can keep the **whole card**, not two separate numbers.',
  },
];
