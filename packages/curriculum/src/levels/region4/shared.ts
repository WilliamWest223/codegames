import type { LangCode } from '@codegames/shared';
import { code, dedent } from '../../helpers';

/** Helpers shared by this region's level files. */
/**
 * Region 4, part 1 (the data track): dictionaries/objects, the everyday map patterns, sets,
 * and nested records. Spec: docs/audits/round-5/teacher.md Part B (B1–B6).
 *
 * Content rules (B1): never print a bare Python object or an unsorted set; keep
 * `constructor` / `toString` / `__proto__` out of JS test data; harness stdin must let the
 * main program finish. JS uses plain objects, `obj[key]`, `key in obj`, `for...in` for
 * object keys, `Object.entries`, and `?? 0`.
 */

export const TURN_ROUTE = {
  python: 'route = [["ahead", 2], ["left", 2], ["right", 3], ["right", 2]]',
  javascript: 'const route = [["ahead", 2], ["left", 2], ["right", 3], ["right", 2]];',
};

/**
 * Region 4, model track: classes, methods, encapsulation, and the Text Adventure boss.
 * Spec: docs/audits/round-5/teacher.md Part B (B7–B10).
 *
 * Content rules (B1): never print a bare Python object (its address changes between runs),
 * so objects report through `describe()` / `status()` methods that return strings. JS
 * harnesses are wrapped in a block by the grader; Python harness variables are named `_x`.
 * A harness's stdin always lets the main program finish first.
 */

/** JavaScript's Number() never throws, so JS levels about exceptions use this helper. */
export const JS_TO_INT = dedent(`
  // Number("seven") gives NaN instead of throwing, so this helper throws for you.
  function toInt(text) {
    const n = Number(text);
    if (text.trim() === "" || !Number.isInteger(n)) {
      throw new Error("not a number");
    }
    return n;
  }
`);

/** Like `code()`, with the JavaScript \`toInt\` helper placed above the JS program. */
export function codeWithToInt(python: string, javascript: string) {
  const c = code(python, javascript);
  return { ...c, javascript: `${JS_TO_INT}\n${c.javascript}` };
}

// ── shared code ────────────────────────────────────────────────

export const ENCAPSULATION_2_START = code(
  `
  class Wallet:
      def __init__(self, coins):
          self._coins = coins

      def pay(self, price):
          if price > self._coins:
              raise ValueError("not enough coins")
          self._coins -= price

      def coins(self):
          return self._coins

  wallet = Wallet(int(input()))
  for price in [4, 9, 3]:
      wallet._coins -= price
      print(f"Bought for {price}")
  print(f"Coins left: {wallet.coins()}")
  `,
  `
  class Wallet {
    #coins;

    constructor(coins) {
      this.#coins = coins;
    }

    pay(price) {
      if (price > this.#coins) {
        throw new Error("not enough coins");
      }
      this.#coins -= price;
    }

    coins() {
      return this.#coins;
    }
  }

  const wallet = new Wallet(Number(prompt()));
  for (const price of [4, 9, 3]) {
    wallet.#coins -= price;
    console.log(\`Bought for \${price}\`);
  }
  console.log(\`Coins left: \${wallet.coins()}\`);
  `,
);

export const MACHINE_SOLUTION = codeWithToInt(
  `
  class Machine:
      def __init__(self, stock, prices):
          self.stock = stock
          self.prices = prices
          self._credit = 0

      def insert(self, coins):
          if coins < 1:
              raise ValueError("Insert at least 1 coin")
          self._credit += coins

      def buy(self, item):
          if item not in self.stock:
              raise ValueError(f"No such item: {item}")
          if self.stock[item] == 0:
              raise ValueError(f"{item} is sold out")
          if self._credit < self.prices[item]:
              raise ValueError(f"{item} costs {self.prices[item]}")
          self.stock[item] -= 1
          self._credit -= self.prices[item]

      def credit(self):
          return self._credit

  machine = Machine({"chips": 2, "gum": 0}, {"chips": 3, "gum": 1})
  while True:
      words = input().split()
      if words[0] == "quit":
          break
      try:
          if words[0] == "insert":
              machine.insert(int(words[1]))
          elif words[0] == "buy":
              machine.buy(words[1])
              print(f"Enjoy your {words[1]}!")
          else:
              print("Commands: insert N, buy ITEM, quit")
      except ValueError as err:
          print(err)
  print(f"Change: {machine.credit()}")
  `,
  `
  class Machine {
    #credit = 0;

    constructor(stock, prices) {
      this.stock = stock;
      this.prices = prices;
    }

    insert(coins) {
      if (coins < 1) {
        throw new Error("Insert at least 1 coin");
      }
      this.#credit += coins;
    }

    buy(item) {
      if (!Object.hasOwn(this.stock, item)) {
        throw new Error(\`No such item: \${item}\`);
      }
      if (this.stock[item] === 0) {
        throw new Error(\`\${item} is sold out\`);
      }
      if (this.#credit < this.prices[item]) {
        throw new Error(\`\${item} costs \${this.prices[item]}\`);
      }
      this.stock[item] -= 1;
      this.#credit -= this.prices[item];
    }

    credit() {
      return this.#credit;
    }
  }

  const machine = new Machine({ chips: 2, gum: 0 }, { chips: 3, gum: 1 });
  while (true) {
    const words = prompt().split(" ");
    if (words[0] === "quit") {
      break;
    }
    try {
      if (words[0] === "insert") {
        machine.insert(toInt(words[1]));
      } else if (words[0] === "buy") {
        machine.buy(words[1]);
        console.log(\`Enjoy your \${words[1]}!\`);
      } else {
        console.log("Commands: insert N, buy ITEM, quit");
      }
    } catch (err) {
      console.log(err.message);
    }
  }
  console.log(\`Change: \${machine.credit()}\`);
  `,
);

export const ROOMS = code(
  `
  rooms = {
      "hall": {"exits": {"north": "library", "east": "kitchen"}, "items": ["lamp"]},
      "kitchen": {"exits": {"west": "hall"}, "items": ["key"]},
      "library": {"exits": {"south": "hall", "north": "vault"}, "items": []},
      "vault": {"exits": {"south": "library"}, "items": ["crown"], "locked": "key"},
  }
  `,
  `
  const rooms = {
    hall: { exits: { north: "library", east: "kitchen" }, items: ["lamp"] },
    kitchen: { exits: { west: "hall" }, items: ["key"] },
    library: { exits: { south: "hall", north: "vault" }, items: [] },
    vault: { exits: { south: "library" }, items: ["crown"], locked: "key" },
  };
  `,
);

/** Put the boss's `rooms` data above each language's program. */
export function withRooms(python: string, javascript: string) {
  const c = code(python, javascript);
  return { python: `${ROOMS.python}\n${c.python}`, javascript: `${ROOMS.javascript}\n${c.javascript}` };
}

export const ADVENTURE_WORLD = ROOMS;

const ADVENTURE_BODY = code(
  `
  class Player:
      def __init__(self, rooms, start):
          self.rooms = rooms
          self.location = start
          self.inventory = []
          self.visited = {start}

      def describe(self):
          room = self.rooms[self.location]
          exits = ", ".join(room["exits"])
          if room["items"]:
              items = ", ".join(room["items"])
          else:
              items = "none"
          return f"You are in the {self.location}. Exits: {exits}. Items: {items}"

      def move(self, direction):
          exits = self.rooms[self.location]["exits"]
          if direction not in exits:
              raise ValueError("You can't go that way.")
          target = exits[direction]
          room = self.rooms[target]
          if "locked" in room and room["locked"] not in self.inventory:
              raise ValueError(f"The {target} is locked.")
          self.location = target
          self.visited.add(target)

      def take(self, item):
          items = self.rooms[self.location]["items"]
          if item not in items:
              raise ValueError(f"There is no {item} here.")
          items.remove(item)
          self.inventory.append(item)

  player = Player(rooms, "hall")
  print(player.describe())
  while True:
      command = input().lower()
      words = command.split()
      if command == "quit":
          print("Bye!")
          break
      elif command == "look":
          print(player.describe())
      elif command == "inventory":
          if player.inventory:
              print("You carry: " + ", ".join(player.inventory))
          else:
              print("You carry: nothing")
      elif len(words) == 2 and words[0] == "go":
          try:
              player.move(words[1])
              print(player.describe())
          except ValueError as err:
              print(err)
      elif len(words) == 2 and words[0] == "take":
          try:
              player.take(words[1])
              print(f"Taken: {words[1]}")
          except ValueError as err:
              print(err)
      else:
          print("I don't understand.")
      if "crown" in player.inventory:
          print(f"You win! Rooms explored: {len(player.visited)}")
          break
  `,
  `
  class Player {
    constructor(rooms, start) {
      this.rooms = rooms;
      this.location = start;
      this.inventory = [];
      this.visited = new Set([start]);
    }

    describe() {
      const room = this.rooms[this.location];
      const exits = Object.keys(room.exits).join(", ");
      let items = "none";
      if (room.items.length > 0) {
        items = room.items.join(", ");
      }
      return \`You are in the \${this.location}. Exits: \${exits}. Items: \${items}\`;
    }

    move(direction) {
      const exits = this.rooms[this.location].exits;
      if (!Object.hasOwn(exits, direction)) {
        throw new Error("You can't go that way.");
      }
      const target = exits[direction];
      const room = this.rooms[target];
      if (Object.hasOwn(room, "locked") && !this.inventory.includes(room.locked)) {
        throw new Error(\`The \${target} is locked.\`);
      }
      this.location = target;
      this.visited.add(target);
    }

    take(item) {
      const items = this.rooms[this.location].items;
      if (!items.includes(item)) {
        throw new Error(\`There is no \${item} here.\`);
      }
      items.splice(items.indexOf(item), 1);
      this.inventory.push(item);
    }
  }

  const player = new Player(rooms, "hall");
  console.log(player.describe());
  while (true) {
    const command = prompt().toLowerCase();
    const words = command.split(" ");
    if (command === "quit") {
      console.log("Bye!");
      break;
    } else if (command === "look") {
      console.log(player.describe());
    } else if (command === "inventory") {
      if (player.inventory.length > 0) {
        console.log("You carry: " + player.inventory.join(", "));
      } else {
        console.log("You carry: nothing");
      }
    } else if (words.length === 2 && words[0] === "go") {
      try {
        player.move(words[1]);
        console.log(player.describe());
      } catch (err) {
        console.log(err.message);
      }
    } else if (words.length === 2 && words[0] === "take") {
      try {
        player.take(words[1]);
        console.log(\`Taken: \${words[1]}\`);
      } catch (err) {
        console.log(err.message);
      }
    } else {
      console.log("I don't understand.");
    }
    if (player.inventory.includes("crown")) {
      console.log(\`You win! Rooms explored: \${player.visited.size}\`);
      break;
    }
  }
  `,
);

/**
 * The world builder's program: the learner's `rooms` data above the fixed engine. The world
 * is never trimmed, so error line numbers match the lines in the learner's editor. The engine
 * starts the player in `hall` and ends the game when the `crown` is taken.
 */
export function adventureWithWorld(world: LangCode): LangCode {
  return {
    python: `${world.python ?? ''}\n${ADVENTURE_BODY.python ?? ''}`,
    javascript: `${world.javascript ?? ''}\n${ADVENTURE_BODY.javascript ?? ''}`,
  };
}

export const ADVENTURE = adventureWithWorld(ADVENTURE_WORLD);

/** The boss harnesses' hidden two-room map, so `Player` must use its `rooms` parameter. */
export const MINI = {
  python: '_mini = {"a": {"exits": {"up": "b"}, "items": ["gem"]}, "b": {"exits": {"down": "a"}, "items": [], "locked": "gem"}}\n_p = Player(_mini, "a")\n',
  javascript: 'const _mini = { a: { exits: { up: "b" }, items: ["gem"] }, b: { exits: { down: "a" }, items: [], locked: "gem" } };\nconst _p = new Player(_mini, "a");\n',
};

/** A boss harness: the mini map and a fresh player, then the given calls. */
export function miniHarness(python: string, javascript: string) {
  const c = code(python, javascript);
  return { python: MINI.python + c.python, javascript: MINI.javascript + c.javascript };
}

export const HALL = 'You are in the hall. Exits: north, east. Items: lamp';
export const KITCHEN = 'You are in the kitchen. Exits: west. Items: key';
export const LIBRARY = 'You are in the library. Exits: south, north. Items: none';
