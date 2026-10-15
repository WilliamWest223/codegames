import type { Level } from '@codegames/shared';
import { lang } from '../../localize';
import { withRooms, ADVENTURE, miniHarness, HALL, KITCHEN, LIBRARY } from './shared';

/** boss-4 levels, in play order. */
export const boss4Levels: Level[] = [
  {
    id: 'boss-4',
    conceptId: 'boss-4',
    title: 'Text Adventure',
    role: 'boss',
    game: 'build-it',
    mode: 'freeform',
    prompt: `**Boss level!** Build a text adventure, in three phases (the health bar follows them). The world is given to you as nested data: each room has \`exits\` (direction → room), \`items\`, and maybe \`"locked"\` (the item you need to get in).\n\n**1 · Build the player.** A \`Player\` class whose ${lang('`__init__(self, rooms, start)`', '`constructor(rooms, start)`')} stores the rooms and sets \`location\`, \`inventory\` (${lang('a list', 'an array')}) and \`visited\` (a set of room names). Keep these three as plain ${lang('attributes', 'properties (no `#`)')}: the tests read them. \`describe()\` **returns** \`You are in the hall. Exits: north, east. Items: lamp\` (\`Items: none\` when the room is empty).\n\n**2 · Rules.** Refusals ${lang('raise a `ValueError`', 'throw an `Error`')} with the message. \`move(direction)\` refuses with \`You can't go that way.\`, or \`The ROOM is locked.\` (with the room's name) when it's locked and you don't carry its key. \`take(item)\` refuses with \`There is no ITEM here.\` (with the item's name), and otherwise moves the item from the room into the inventory. A successful move adds the room to \`visited\`. They change the player and **never print**.\n\n**3 · Adventure.** The main loop prints the room, then reads commands (ignore capitals): \`go DIR\` prints the new room; \`take ITEM\` prints \`Taken: ITEM\`; \`look\` prints the room again; \`inventory\` prints \`You carry: lamp, key\` or \`You carry: nothing\`; \`quit\` prints \`Bye!\` and stops; anything else (including \`go\` with no direction) prints \`I don't understand.\` Print every refusal's message, and the moment you carry the crown: \`You win! Rooms explored: 4\``,
    reinforces: ['maps', 'map-patterns', 'sets', 'nested-data', 'classes', 'methods', 'encapsulation', 'functions', 'error-handling', 'strings', 'collections', 'while-loops', 'loop-control', 'else-if-chains', 'booleans', 'input', 'string-formatting'],
    hints: [
      lang('`describe` builds a string from `self.rooms[self.location]`; `", ".join(...)` the exit names (looping over a dictionary gives its keys).', '`describe` builds a string from `this.rooms[this.location]`; join the exit names with `Object.keys(room.exits).join(", ")`.'),
      `\`move\`: look up the exits, refuse if the direction isn't there, refuse if the target room is locked and its key isn't in your inventory, otherwise change \`location\` and add it to \`visited\`.`,
      'Split the command into words. `go` and `take` need exactly two words.',
      lang('Put each `move`/`take` call in `try:` and print the error\'s message in `except ValueError as err:`.', 'Put each `move`/`take` call in `try { }` and print `err.message` in `catch (err)`.'),
    ],
    starterCode: withRooms(
      `
      class Player:
          def __init__(self, rooms, start):
              pass

          def describe(self):
              return ""

          def move(self, direction):
              pass

          def take(self, item):
              pass

      # 1. make the player in the hall and show the room
      # 2. loop: read a command (ignore capitals) and split it into words
      # 3. dispatch with if/elif: go, take, look, inventory, quit, anything else
      # 4. put move/take in try, and print each refusal's message
      # 5. after each command: carrying the crown? You win!
      `,
      `
      class Player {
        constructor(rooms, start) {
        }

        describe() {
          return "";
        }

        move(direction) {
        }

        take(item) {
        }
      }

      // 1. make the player in the hall and show the room
      // 2. loop: read a command (ignore capitals) and split it into words
      // 3. dispatch with if/else: go, take, look, inventory, quit, anything else
      // 4. put move/take in try, and print each refusal's message
      // 5. after each command: carrying the crown? You win!
      `,
    ),
    solution: ADVENTURE,
    tests: [
      {
        name: 'describe a fresh player',
        phase: '1 · Build the player',
        input: 'quit',
        expectedOutput: 'a []\nYou are in the a. Exits: up. Items: gem',
        harness: miniHarness('print(_p.location, _p.inventory)\nprint(_p.describe())', 'console.log(_p.location, _p.inventory);\nconsole.log(_p.describe());'),
      },
      {
        name: 'take, then unlock and move',
        phase: '1 · Build the player',
        input: 'quit',
        expectedOutput: { python: "b ['gem'] []", javascript: "b [ 'gem' ] []" },
        harness: miniHarness(
          '_p.take("gem")\n_p.move("up")\nprint(_p.location, _p.inventory, _mini["a"]["items"])',
          '_p.take("gem");\n_p.move("up");\nconsole.log(_p.location, _p.inventory, _mini.a.items);',
        ),
      },
      // "moved"/"taken" after each call: a move() that prints its refusal instead of raising
      // would otherwise produce exactly the same output (spec B10 fix).
      {
        name: 'visited remembers every room; take empties the room',
        phase: '2 · Rules',
        input: 'quit',
        expectedOutput: 'a, b\n0',
        hidden: true,
        harness: miniHarness(
          `
          _p.take("gem")
          _p.move("up")
          _p.move("down")
          print(", ".join(sorted(_p.visited)))
          print(len(_mini["a"]["items"]))
          `,
          `
          _p.take("gem");
          _p.move("up");
          _p.move("down");
          console.log([..._p.visited].sort().join(", "));
          console.log(_mini.a.items.length);
          `,
        ),
      },
      {
        name: 'refusals don\'t move you',
        phase: '2 · Rules',
        input: 'quit',
        expectedOutput: 'You can\'t go that way.\nThe b is locked.\nThere is no sword here.\na',
        harness: miniHarness(
          `
          for _d in ["left", "up"]:
              try:
                  _p.move(_d)
                  print("moved")
              except ValueError as _e:
                  print(_e)
          try:
              _p.take("sword")
              print("taken")
          except ValueError as _e:
              print(_e)
          print(_p.location)
          `,
          `
          for (const _d of ["left", "up"]) {
            try {
              _p.move(_d);
              console.log("moved");
            } catch (_e) {
              console.log(_e.message);
            }
          }
          try {
            _p.take("sword");
            console.log("taken");
          } catch (_e) {
            console.log(_e.message);
          }
          console.log(_p.location);
          `,
        ),
      },
      {
        name: 'the winning walk',
        phase: '3 · Adventure',
        input: 'go east\ntake key\ngo west\ngo north\ngo north\ntake crown',
        expectedOutput: [HALL, KITCHEN, 'Taken: key', HALL, LIBRARY, 'You are in the vault. Exits: south. Items: crown', 'Taken: crown', 'You win! Rooms explored: 4'].join('\n'),
      },
      {
        name: 'a locked door',
        phase: '3 · Adventure',
        input: 'go north\ngo north\nquit',
        expectedOutput: [HALL, LIBRARY, 'The vault is locked.', 'Bye!'].join('\n'),
      },
      {
        name: 'bad commands never crash',
        phase: '3 · Adventure',
        input: 'dance\ngo west\ntake sword\ninventory\ntake lamp\ninventory\ntake lamp\nlook\nquit',
        expectedOutput: [
          HALL,
          'I don\'t understand.',
          'You can\'t go that way.',
          'There is no sword here.',
          'You carry: nothing',
          'Taken: lamp',
          'You carry: lamp',
          'There is no lamp here.',
          'You are in the hall. Exits: north, east. Items: none',
          'Bye!',
        ].join('\n'),
        hidden: true,
      },
      {
        name: 'capitals and half commands',
        phase: '3 · Adventure',
        input: 'GO EAST\nTake Key\ngo\nquit',
        expectedOutput: [HALL, KITCHEN, 'Taken: key', 'I don\'t understand.', 'Bye!'].join('\n'),
        hidden: true,
      },
    ],
    requirements: {
      python: [
        { pattern: 'class\\s+Player', message: 'Write a `Player` class.' },
        { pattern: '\\btry\\s*:[\\s\\S]*\\.(move|take)\\(', message: 'Call `move` and `take` inside `try:`, and print the refusal in `except ValueError as err:`.' },
        { pattern: '\\bglobal\\b', forbid: true, message: 'No `global` needed: keep the game\'s state on the player object.' },
      ],
      javascript: [
        { pattern: 'class\\s+Player', message: 'Write a `Player` class.' },
        { pattern: '\\btry\\s*\\{[\\s\\S]*\\.(move|take)\\(', message: 'Call `move` and `take` inside `try { }`, and print the refusal in `catch (err)`.' },
      ],
    },
    play: {
      intro: 'Find the crown! Try `go north`, `take lamp`, `look` and `inventory`.',
      renderer: 'adventure',
    },
    takeaway: 'You modeled a world as nested data, gave the player a class that guards its own rules, and kept the game loop crash-proof. That\'s how real games and apps are structured: data, objects with rules, and a loop that talks to the user.',
  },
];
