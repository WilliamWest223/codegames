import type { Level } from '@codegames/shared';
import { code } from '../../helpers';
import { lang } from '../../localize';
import { JS_TO_INT } from '../region4/shared';
import { HEAP } from './shared';

/**
 * boss-7: Star Courier. Dijkstra over star lanes (graphs + heaps + shortest-path), a 0/1
 * knapsack for the cargo hold (dynamic programming) and earliest-end docking windows (greedy
 * intervals), behind one command loop. Spec: docs/specs/regions6-8.md Part B.
 */

/** The given heap helpers (and the JS `toInt`) above each language's program. */
function withGiven(python: string, javascript: string) {
  const c = code(python, javascript);
  return { python: `${HEAP.python}\n\n${c.python}`, javascript: `${JS_TO_INT}\n${HEAP.javascript}\n\n${c.javascript}` };
}

const QUIT = 'quit';

/** Phase 1 harnesses: a four-system chart where the direct lane is the expensive one. */
function chartHarness(python: string, javascript: string) {
  const c = code(python, javascript);
  return {
    python: `_c = Chart()\n_c.lane("A", "B", 10)\n_c.lane("A", "C", 1)\n_c.lane("C", "B", 2)\n_c.lane("B", "D", 3)\n${c.python}`,
    javascript: `const _c = new Chart();\n_c.lane("A", "B", 10);\n_c.lane("A", "C", 1);\n_c.lane("C", "B", 2);\n_c.lane("B", "D", 3);\n${c.javascript}`,
  };
}

const OFFERS = {
  python: '_offers = [["gems", 3, 50], ["ore", 4, 40], ["fuel", 2, 30], ["art", 5, 70]]',
  javascript: 'const _offers = [["gems", 3, 50], ["ore", 4, 40], ["fuel", 2, 30], ["art", 5, 70]];',
};

const WINDOWS = {
  python: '_windows = [["Ax", 1, 4], ["Bo", 3, 5], ["Cy", 0, 6], ["Dz", 5, 7], ["Ev", 8, 9]]',
  javascript: 'const _windows = [["Ax", 1, 4], ["Bo", 3, 5], ["Cy", 0, 6], ["Dz", 5, 7], ["Ev", 8, 9]];',
};

/** boss-7 levels, in play order. */
export const boss7Levels: Level[] = [
  {
    id: 'boss-7',
    conceptId: 'boss-7',
    title: 'Star Courier',
    role: 'boss',
    game: 'build-it',
    mode: 'freeform',
    prompt: `**Boss level!** Run a courier ship between star systems: plan the cheapest route, pack the most valuable cargo, and book the most docking windows. The heap helpers (${lang('`heap_push` / `heap_pop`', '`heapPush` / `heapPop`')}) are given.\n\n**Phase 1 · Star lanes.** A \`Chart\` class with \`lanes\`: a dictionary from system to a list of \`[neighbour, cost]\` pairs.\n- \`lane(a, b, cost)\` adds a two-way lane (new systems appear in \`lanes\` as needed).\n- \`shortest(start)\` runs **Dijkstra** with the heap and **returns** \`[dist, came_from]\`.\n- \`route(a, b)\` returns \`[systems, cost]\` for the cheapest route, or ${lang('`None`', '`null`')} if either system is unknown or unreachable.\n\n**Phase 2 · Cargo & docking.**\n- ${lang('`best_load(offers, capacity)`', '`bestLoad(offers, capacity)`')}: offers are \`[name, weight, value]\`; return \`[names, value]\` for the most valuable set of offers whose weights fit in the capacity (each offer at most once), names in offer order. Fill a **dynamic programming** table \`best[i][c]\` = best value using the first \`i\` offers with capacity \`c\`, then walk it back to recover the names.\n- ${lang('`dock_plan(windows)`', '`dockPlan(windows)`')}: windows are \`[name, start, end]\`; return the names of the most windows one landing pad can serve, **earliest end first**.\n\n**Phase 3 · Play.** Read commands until \`quit\` (\`Bye!\`):\n- \`lane A B COST\`, \`offer NAME WEIGHT VALUE\`, \`window NAME START END\` record data and print nothing\n- \`route A B\` → \`A -> C -> B (cost 3)\` or \`No route from A to B\`\n- \`load CAPACITY\` → \`Load: fuel, art (value 100)\` or \`Load: nothing (value 0)\`\n- \`dock\` → \`Dock: Ax, Dz, Ev\` or \`Dock: nothing\`\n- anything else, including bad numbers → \`Unknown command\`\n\nKeep \`lanes\` a plain ${lang('attribute', 'property')}: the tests read it.`,
    reinforces: [
      'shortest-path',
      'graphs',
      'heaps',
      'dynamic-programming',
      'greedy-intervals',
      'higher-order-functions',
      'classes',
      'methods',
      'maps',
      'nested-data',
      'error-handling',
      'functions',
      'return-values',
      'nested-loops',
      'while-loops',
      'loop-control',
      'conditionals',
      'input',
      'type-conversion',
      'string-formatting',
    ],
    hints: [
      `\`shortest\` is Route Planner's \`dijkstra\` as a method: \`dist = {start: 0}\`, \`came_from = {start: None}\`, heap of \`[cost, system]\`; skip stale pops; relax each lane. \`route\` walks \`came_from\` back from \`b\` and reverses.`,
      `${lang('`best_load`', '`bestLoad`')}: \`best\` is \`(n + 1)\` rows of \`(capacity + 1)\` zeros. For offer \`i\` (1-based) with weight \`w\`, value \`v\`: \`best[i][c] = best[i - 1][c]\`, and if \`w <= c\`, the max of that and \`best[i - 1][c - w] + v\`.`,
      `Walk back: \`c = capacity\`; for \`i\` from \`n\` down to 1: if \`best[i][c] != best[i - 1][c]\`, offer \`i - 1\` was taken, so record it and \`c -= w\`. Reverse the names at the end.`,
      `${lang('`dock_plan`', '`dockPlan`')} is Whichever Ends First: sort a copy by end (${lang('`sorted(windows, key=lambda w: w[2])`', '`[...windows].sort((a, b) => a[2] - b[2])`')}), take each window whose start is at or after the pad is free.`,
      `Phase 3: split the line, check the word count for each command, convert numbers inside ${lang('`try/except ValueError`', '`try/catch` with `toInt`')}, and print \`Unknown command\` for anything that does not fit.`,
    ],
    requirements: {
      python: [
        { pattern: 'class\\s+Chart\\b', message: 'Put the star chart in a Chart class.' },
        { pattern: 'heap_pop\\(', message: 'Run Dijkstra with the given heap (heap_push / heap_pop).' },
      ],
      javascript: [
        { pattern: 'class\\s+Chart\\b', message: 'Put the star chart in a Chart class.' },
        { pattern: 'heapPop\\(', message: 'Run Dijkstra with the given heap (heapPush / heapPop).' },
      ],
    },
    starterCode: withGiven(
      `
      class Chart:
          def __init__(self):
              self.lanes = {}

          # Phase 1: lane, shortest, route

      def best_load(offers, capacity):
          # Phase 2: returns [names, value].
          pass

      def dock_plan(windows):
          # Phase 2: returns names.
          pass

      chart = Chart()
      offers = []
      windows = []
      # Phase 3: the command loop.
      `,
      `
      class Chart {
        constructor() {
          this.lanes = {};
        }

        // Phase 1: lane, shortest, route
      }

      function bestLoad(offers, capacity) {
        // Phase 2: returns [names, value].
      }

      function dockPlan(windows) {
        // Phase 2: returns names.
      }

      const chart = new Chart();
      const offers = [];
      const windows = [];
      // Phase 3: the command loop.
      `,
    ),
    solution: withGiven(
      `
      class Chart:
          def __init__(self):
              self.lanes = {}

          def lane(self, a, b, cost):
              for system in (a, b):
                  if system not in self.lanes:
                      self.lanes[system] = []
              self.lanes[a].append([b, cost])
              self.lanes[b].append([a, cost])

          def shortest(self, start):
              dist = {start: 0}
              came_from = {start: None}
              heap = [[0, start]]
              while heap:
                  d, system = heap_pop(heap)
                  if d > dist[system]:
                      continue
                  for nxt, cost in self.lanes[system]:
                      if d + cost < dist.get(nxt, float("inf")):
                          dist[nxt] = d + cost
                          came_from[nxt] = system
                          heap_push(heap, [d + cost, nxt])
              return [dist, came_from]

          def route(self, a, b):
              if a not in self.lanes or b not in self.lanes:
                  return None
              dist, came_from = self.shortest(a)
              if b not in dist:
                  return None
              systems = []
              system = b
              while system is not None:
                  systems.append(system)
                  system = came_from[system]
              systems.reverse()
              return [systems, dist[b]]

      def best_load(offers, capacity):
          n = len(offers)
          best = [[0] * (capacity + 1) for _ in range(n + 1)]
          for i in range(1, n + 1):
              name, weight, value = offers[i - 1]
              for c in range(capacity + 1):
                  best[i][c] = best[i - 1][c]
                  if weight <= c and best[i - 1][c - weight] + value > best[i][c]:
                      best[i][c] = best[i - 1][c - weight] + value
          names = []
          c = capacity
          for i in range(n, 0, -1):
              if best[i][c] != best[i - 1][c]:
                  names.append(offers[i - 1][0])
                  c -= offers[i - 1][1]
          names.reverse()
          return [names, best[n][capacity]]

      def dock_plan(windows):
          plan = []
          free_at = 0
          for name, start, end in sorted(windows, key=lambda w: w[2]):
              if start >= free_at:
                  plan.append(name)
                  free_at = end
          return plan

      chart = Chart()
      offers = []
      windows = []
      while True:
          words = input().split()
          if words == ["quit"]:
              print("Bye!")
              break
          try:
              if words[0] == "lane" and len(words) == 4:
                  chart.lane(words[1], words[2], int(words[3]))
              elif words[0] == "offer" and len(words) == 4:
                  offers.append([words[1], int(words[2]), int(words[3])])
              elif words[0] == "window" and len(words) == 4:
                  windows.append([words[1], int(words[2]), int(words[3])])
              elif words[0] == "route" and len(words) == 3:
                  found = chart.route(words[1], words[2])
                  if found is None:
                      print(f"No route from {words[1]} to {words[2]}")
                  else:
                      print(f"{' -> '.join(found[0])} (cost {found[1]})")
              elif words[0] == "load" and len(words) == 2:
                  names, value = best_load(offers, int(words[1]))
                  print(f"Load: {', '.join(names) if names else 'nothing'} (value {value})")
              elif words[0] == "dock" and len(words) == 1:
                  plan = dock_plan(windows)
                  print(f"Dock: {', '.join(plan) if plan else 'nothing'}")
              else:
                  print("Unknown command")
          except (ValueError, IndexError):
              print("Unknown command")
      `,
      `
      class Chart {
        constructor() {
          this.lanes = {};
        }

        lane(a, b, cost) {
          for (const system of [a, b]) {
            if (!Object.hasOwn(this.lanes, system)) {
              this.lanes[system] = [];
            }
          }
          this.lanes[a].push([b, cost]);
          this.lanes[b].push([a, cost]);
        }

        shortest(start) {
          const dist = { [start]: 0 };
          const cameFrom = { [start]: null };
          const heap = [[0, start]];
          while (heap.length > 0) {
            const [d, system] = heapPop(heap);
            if (d > dist[system]) {
              continue;
            }
            for (const [nxt, cost] of this.lanes[system]) {
              if (d + cost < (dist[nxt] ?? Infinity)) {
                dist[nxt] = d + cost;
                cameFrom[nxt] = system;
                heapPush(heap, [d + cost, nxt]);
              }
            }
          }
          return [dist, cameFrom];
        }

        route(a, b) {
          if (!Object.hasOwn(this.lanes, a) || !Object.hasOwn(this.lanes, b)) {
            return null;
          }
          const [dist, cameFrom] = this.shortest(a);
          if (!Object.hasOwn(dist, b)) {
            return null;
          }
          const systems = [];
          let system = b;
          while (system !== null) {
            systems.push(system);
            system = cameFrom[system];
          }
          systems.reverse();
          return [systems, dist[b]];
        }
      }

      function bestLoad(offers, capacity) {
        const n = offers.length;
        const best = [];
        for (let i = 0; i <= n; i++) {
          best.push(new Array(capacity + 1).fill(0));
        }
        for (let i = 1; i <= n; i++) {
          const [, weight, value] = offers[i - 1];
          for (let c = 0; c <= capacity; c++) {
            best[i][c] = best[i - 1][c];
            if (weight <= c && best[i - 1][c - weight] + value > best[i][c]) {
              best[i][c] = best[i - 1][c - weight] + value;
            }
          }
        }
        const names = [];
        let c = capacity;
        for (let i = n; i >= 1; i--) {
          if (best[i][c] !== best[i - 1][c]) {
            names.push(offers[i - 1][0]);
            c -= offers[i - 1][1];
          }
        }
        names.reverse();
        return [names, best[n][capacity]];
      }

      function dockPlan(windows) {
        const plan = [];
        let freeAt = 0;
        for (const [name, start, end] of [...windows].sort((a, b) => a[2] - b[2])) {
          if (start >= freeAt) {
            plan.push(name);
            freeAt = end;
          }
        }
        return plan;
      }

      const chart = new Chart();
      const offers = [];
      const windows = [];
      while (true) {
        const words = prompt().split(" ");
        if (words.length === 1 && words[0] === "quit") {
          console.log("Bye!");
          break;
        }
        try {
          if (words[0] === "lane" && words.length === 4) {
            chart.lane(words[1], words[2], toInt(words[3]));
          } else if (words[0] === "offer" && words.length === 4) {
            offers.push([words[1], toInt(words[2]), toInt(words[3])]);
          } else if (words[0] === "window" && words.length === 4) {
            windows.push([words[1], toInt(words[2]), toInt(words[3])]);
          } else if (words[0] === "route" && words.length === 3) {
            const found = chart.route(words[1], words[2]);
            if (found === null) {
              console.log(\`No route from \${words[1]} to \${words[2]}\`);
            } else {
              console.log(\`\${found[0].join(" -> ")} (cost \${found[1]})\`);
            }
          } else if (words[0] === "load" && words.length === 2) {
            const [names, value] = bestLoad(offers, toInt(words[1]));
            console.log(\`Load: \${names.length > 0 ? names.join(", ") : "nothing"} (value \${value})\`);
          } else if (words[0] === "dock" && words.length === 1) {
            const plan = dockPlan(windows);
            console.log(\`Dock: \${plan.length > 0 ? plan.join(", ") : "nothing"}\`);
          } else {
            console.log("Unknown command");
          }
        } catch (err) {
          console.log("Unknown command");
        }
      }
      `,
    ),
    tests: [
      {
        name: 'lanes and the cheapest route',
        phase: '1 · Star lanes',
        input: QUIT,
        expectedOutput: { python: '2 2\nA C B D 6\n5 C\nNone None', javascript: '2 2\nA C B D 6\n5 C\nnull null' },
        harness: chartHarness(
          `
          print(len(_c.lanes["A"]), len(_c.lanes["B"]) - 1)
          _r = _c.route("A", "D")
          print(" ".join(_r[0]), _r[1])
          _d, _f = _c.shortest("C")
          print(_d["D"], _f["B"])
          print(_c.route("A", "Z"), _c.route("Q", "A"))
          `,
          `
          console.log(_c.lanes.A.length, _c.lanes.B.length - 1);
          const _r = _c.route("A", "D");
          console.log(_r[0].join(" "), _r[1]);
          const [_d, _f] = _c.shortest("C");
          console.log(_d.D, _f.B);
          console.log(_c.route("A", "Z"), _c.route("Q", "A"));
          `,
        ),
      },
      {
        name: 'unreachable systems',
        phase: '1 · Star lanes',
        input: QUIT,
        expectedOutput: { python: 'None\nX Y 4\nA 0', javascript: 'null\nX Y 4\nA 0' },
        harness: chartHarness(
          `
          _c.lane("X", "Y", 4)
          print(_c.route("A", "X"))
          _r = _c.route("X", "Y")
          print(" ".join(_r[0]), _r[1])
          _r = _c.route("A", "A")
          print(" ".join(_r[0]), _r[1])
          `,
          `
          _c.lane("X", "Y", 4);
          console.log(_c.route("A", "X"));
          let _r = _c.route("X", "Y");
          console.log(_r[0].join(" "), _r[1]);
          _r = _c.route("A", "A");
          console.log(_r[0].join(" "), _r[1]);
          `,
        ),
      },
      {
        name: 'the most valuable load',
        phase: '2 · Cargo & docking',
        input: QUIT,
        expectedOutput: 'fuel,art 100\ngems,fuel 80\n 0\ngems,ore,fuel,art 190',
        harness: {
          python: `${OFFERS.python}\nfor _cap in [7, 5, 1, 14]:\n    _n, _v = best_load(_offers, _cap)\n    print(",".join(_n), _v)`,
          javascript: `${OFFERS.javascript}\nfor (const _cap of [7, 5, 1, 14]) {\n  const [_n, _v] = bestLoad(_offers, _cap);\n  console.log(_n.join(","), _v);\n}`,
        },
      },
      {
        name: 'docking windows',
        phase: '2 · Cargo & docking',
        input: QUIT,
        expectedOutput: 'Ax,Dz,Ev\n0',
        harness: {
          python: `${WINDOWS.python}\nprint(",".join(dock_plan(_windows)))\nprint(len(dock_plan([])))`,
          javascript: `${WINDOWS.javascript}\nconsole.log(dockPlan(_windows).join(","));\nconsole.log(dockPlan([]).length);`,
        },
      },
      {
        name: 'a delivery run',
        phase: '3 · Play',
        input: [
          'lane Sol Vega 10', 'lane Sol Rigel 1', 'lane Rigel Vega 2', 'lane Vega Deneb 3',
          'route Sol Deneb', 'route Deneb Sol', 'route Sol Altair',
          'offer gems 3 50', 'offer ore 4 40', 'offer fuel 2 30', 'offer art 5 70',
          'load 7', 'load 1',
          'dock',
          'window Ax 1 4', 'window Bo 3 5', 'window Cy 0 6', 'window Dz 5 7', 'window Ev 8 9',
          'dock',
          'quit',
        ].join('\n'),
        expectedOutput: [
          'Sol -> Rigel -> Vega -> Deneb (cost 6)',
          'Deneb -> Vega -> Rigel -> Sol (cost 6)',
          'No route from Sol to Altair',
          'Load: fuel, art (value 100)',
          'Load: nothing (value 0)',
          'Dock: nothing',
          'Dock: Ax, Dz, Ev',
          'Bye!',
        ].join('\n'),
      },
      {
        name: 'bad commands never crash',
        phase: '3 · Play',
        input: ['lane Sol Vega', 'lane Sol Vega far', 'route Sol', 'load', 'load heavy', 'dock now', 'warp 9', 'offer gems 3', 'lane Sol Vega 4', 'route Sol Vega', 'load 0', 'quit'].join('\n'),
        expectedOutput: ['Unknown command', 'Unknown command', 'Unknown command', 'Unknown command', 'Unknown command', 'Unknown command', 'Unknown command', 'Unknown command', 'Sol -> Vega (cost 4)', 'Load: nothing (value 0)', 'Bye!'].join('\n'),
        hidden: true,
      },
    ],
    takeaway: 'Three hard problems, three Region 7 tools: **Dijkstra** on a graph for the route, a **dynamic programming** table for the cargo (greedy by value would have packed art + gems and lost), and a **greedy** sort for the docking windows (where greedy is provably right). Knowing *which* tool fits *which* question is what this region was for. Welcome to the Blue belt.',
  },
];
