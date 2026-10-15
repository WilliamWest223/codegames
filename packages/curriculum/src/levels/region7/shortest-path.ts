import type { Level } from '@codegames/shared';
import { code } from '../../helpers';
import { lang } from '../../localize';
import { pair, withHeap } from './shared';

const ROADS = pair(
  `
  roads = {"A": [["B", 4], ["C", 1]], "B": [["D", 1]], "C": [["B", 2], ["D", 5]], "D": []}
  `,
  `
  const roads = { A: [["B", 4], ["C", 1]], B: [["D", 1]], C: [["B", 2], ["D", 5]], D: [] };
  `,
);

const DIJKSTRA_WRONG = withHeap(
  `
  ${ROADS.python.trim()}

  start = input()
  dist = {start: 0}
  heap = [[0, start]]
  while heap:
      d, node = heap_pop(heap)
      if d > dist[node]:
          continue
      for nxt, w in roads[node]:
          if d + w < dist.get(nxt, 0):
              dist[nxt] = d + w
              heap_push(heap, [d + w, nxt])
  for place in roads:
      print(f"{place}: {dist[place] if place in dist else 'unreachable'}")
  `,
  `
  ${ROADS.javascript.trim()}

  const start = prompt();
  const dist = { [start]: 0 };
  const heap = [[0, start]];
  while (heap.length > 0) {
    const [d, node] = heapPop(heap);
    if (d > dist[node]) {
      continue;
    }
    for (const [nxt, w] of roads[node]) {
      if (d + w < (dist[nxt] ?? 0)) {
        dist[nxt] = d + w;
        heapPush(heap, [d + w, nxt]);
      }
    }
  }
  for (const place in roads) {
    console.log(\`\${place}: \${Object.hasOwn(dist, place) ? dist[place] : "unreachable"}\`);
  }
  `,
);

const DIJKSTRA_RIGHT = {
  python: DIJKSTRA_WRONG.python.replace('dist.get(nxt, 0)', 'dist.get(nxt, float("inf"))'),
  javascript: DIJKSTRA_WRONG.javascript.replace('(dist[nxt] ?? 0)', '(dist[nxt] ?? Infinity)'),
};

/** shortest-path levels, in play order. */
export const shortestPathLevels: Level[] = [
  {
    id: 'shortest-path-1',
    conceptId: 'shortest-path',
    title: 'Cheapest First',
    role: 'intro',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: 'Roads have **costs** now, so fewest hops is not cheapest. **Dijkstra\'s algorithm** is BFS with a min-heap instead of a queue: always settle the cheapest unsettled place next. `heap_push` / `heap_pop` are the heap from the last concept, holding `[cost, place]` pairs. The program prints each place as it is settled. Which output is right?',
    reinforces: ['heaps', 'graphs', 'maps', 'while-loops', 'loop-control'],
    choices: {
      python: ['A 0\nC 1\nB 3\nD 4', 'A 0\nB 4\nC 1\nD 5', 'A 0\nC 1\nB 4\nD 5', 'A 0\nC 1\nB 3\nD 6'],
      javascript: ['A 0\nC 1\nB 3\nD 4', 'A 0\nB 4\nC 1\nD 5', 'A 0\nC 1\nB 4\nD 5', 'A 0\nC 1\nB 3\nD 6'],
    },
    hints: [
      'From A the heap holds B at 4 and C at 1. The heap pops the cheapest: C.',
      'Through C, B now costs 1 + 2 = 3, cheaper than 4, so B at 3 is pushed. D through C costs 6.',
      'B at 3 pops next and offers D at 3 + 1 = 4, beating 6. Stale entries (B at 4, D at 6) are skipped by the `if d > dist[node]: continue` line.',
    ],
    code: withHeap(
      `
      ${ROADS.python.trim()}

      dist = {"A": 0}
      heap = [[0, "A"]]
      while heap:
          d, node = heap_pop(heap)
          if d > dist[node]:
              continue
          print(node, d)
          for nxt, w in roads[node]:
              if d + w < dist.get(nxt, float("inf")):
                  dist[nxt] = d + w
                  heap_push(heap, [d + w, nxt])
      `,
      `
      ${ROADS.javascript.trim()}

      const dist = { A: 0 };
      const heap = [[0, "A"]];
      while (heap.length > 0) {
        const [d, node] = heapPop(heap);
        if (d > dist[node]) {
          continue;
        }
        console.log(node, d);
        for (const [nxt, w] of roads[node]) {
          if (d + w < (dist[nxt] ?? Infinity)) {
            dist[nxt] = d + w;
            heapPush(heap, [d + w, nxt]);
          }
        }
      }
      `,
    ),
    investigate: [
      { question: 'Why can a place appear in the heap more than once?', choices: ['A cheaper route may be found after it was first pushed; the old entry stays and is skipped when it pops', 'The heap has a bug', 'It cannot'], answer: 0 },
      { question: 'Why is it safe to print a place the moment it pops?', choices: ['Everything still in the heap costs at least as much, so no cheaper route to it can appear later (as long as costs are not negative)', 'Because the dictionary is sorted', 'It is not safe; the output may be wrong'], answer: 0 },
    ],
    takeaway: '**Dijkstra** = BFS where the queue is a min-heap keyed by total cost. Three rules: push a place whenever you find a cheaper way to it, skip stale pops, and trust the first pop of each place as its final cost. It runs in O((nodes + edges) log nodes) and is behind every map app\'s route finder.',
  },
  {
    id: 'shortest-path-2',
    conceptId: 'shortest-path',
    title: 'Nothing Is Ever Cheaper',
    role: 'combine',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: 'Type a start place; this should print the cheapest cost to every place: from `A` → `A: 0`, `B: 3`, `C: 1`, `D: 4`.\n\nIt prints `unreachable` for everything except the start. The relax step compares against the wrong **default** for a place that has no cost yet. Fix it.',
    reinforces: ['heaps', 'graphs', 'maps', 'map-patterns', 'while-loops', 'input', 'loop-control'],
    hints: [
      'A place that has never been reached should count as **infinitely** far, so that *any* real route beats it.',
      lang('`dist.get(nxt, 0)` says "unknown places cost 0", so `d + w < 0` is never true.', '`dist[nxt] ?? 0` says "unknown places cost 0", so `d + w < 0` is never true.'),
      lang('Use `float("inf")` as the default.', 'Use `Infinity` as the default.'),
    ],
    starterCode: DIJKSTRA_WRONG,
    solution: DIJKSTRA_RIGHT,
    tests: [
      { name: 'from A', input: 'A', expectedOutput: 'A: 0\nB: 3\nC: 1\nD: 4' },
      { name: 'from C', input: 'C', expectedOutput: 'A: unreachable\nB: 2\nC: 0\nD: 3', hidden: true },
      { name: 'from a dead end', input: 'D', expectedOutput: 'A: unreachable\nB: unreachable\nC: unreachable\nD: 0', hidden: true },
    ],
    takeaway: 'Every "find the best" loop needs a starting value that any real candidate beats: **infinity** for a minimum, minus infinity for a maximum. Zero is the most common wrong default, and it fails silently: no crash, just nothing ever improving. When a search "finds nothing", check its starting value first.',
  },
  {
    id: 'shortest-path-3',
    conceptId: 'shortest-path',
    title: 'Route Planner',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: `Plan deliveries over a road map. Read commands until \`quit\`:\n\n- \`road A B COST\`: a two-way road\n- \`route A B\` → \`A -> C -> B (3)\`: the cheapest route and its total cost, or \`No route from A to B\`\n\nKeep \`roads\` as a dictionary from place to a list of \`[neighbour, cost]\` pairs. Write ${lang('`dijkstra(start)`', '`dijkstra(start)`')}, which **returns** two dictionaries \`[dist, came_from]\`, and ${lang('`route(a, b)`', '`route(a, b)`')}, which returns \`[places, cost]\` or ${lang('`None`', '`null`')}. The heap helpers are given.`,
    reinforces: ['heaps', 'graphs', 'maps', 'map-patterns', 'nested-data', 'functions', 'return-values', 'while-loops', 'strings', 'input', 'type-conversion', 'string-formatting', 'loop-control'],
    hints: [
      lang('`dijkstra`: `dist = {start: 0}`, `came_from = {start: None}`, `heap = [[0, start]]`. Pop; skip if stale; for each `[nxt, w]`: if cheaper, update `dist`, set `came_from[nxt] = node`, push.', '`dijkstra`: `dist = { [start]: 0 }`, `cameFrom = { [start]: null }`, `heap = [[0, start]]`. Pop; skip if stale; for each `[nxt, w]`: if cheaper, update `dist`, set `cameFrom[nxt] = node`, push.'),
      lang('`route`: unknown places or `b not in dist` → `None`. Otherwise walk `came_from` back from `b`, reverse, and return `[places, dist[b]]`.', '`route`: unknown places or `b` missing from `dist` → `null`. Otherwise walk `cameFrom` back from `b`, reverse, and return `[places, dist[b]]`.'),
      lang('`road`: make sure both places exist in `roads`, then append `[B, cost]` to A\'s list and `[A, cost]` to B\'s.', '`road`: make sure both places exist in `roads`, then push `[B, cost]` to A\'s list and `[A, cost]` to B\'s.'),
    ],
    starterCode: withHeap(
      `
      roads = {}

      def dijkstra(start):
          # Returns [dist, came_from].
          pass

      def route(a, b):
          # Returns [places, cost] or None.
          pass

      # Read commands until "quit": road A B COST, route A B.
      `,
      `
      const roads = {};

      function dijkstra(start) {
        // Returns [dist, cameFrom].
      }

      function route(a, b) {
        // Returns [places, cost] or null.
      }

      // Read commands until "quit": road A B COST, route A B.
      `,
    ),
    solution: withHeap(
      `
      roads = {}

      def dijkstra(start):
          dist = {start: 0}
          came_from = {start: None}
          heap = [[0, start]]
          while heap:
              d, node = heap_pop(heap)
              if d > dist[node]:
                  continue
              for nxt, w in roads[node]:
                  if d + w < dist.get(nxt, float("inf")):
                      dist[nxt] = d + w
                      came_from[nxt] = node
                      heap_push(heap, [d + w, nxt])
          return [dist, came_from]

      def route(a, b):
          if a not in roads or b not in roads:
              return None
          dist, came_from = dijkstra(a)
          if b not in dist:
              return None
          places = []
          node = b
          while node is not None:
              places.append(node)
              node = came_from[node]
          places.reverse()
          return [places, dist[b]]

      while True:
          words = input().split()
          if words[0] == "quit":
              break
          if words[0] == "road":
              a, b, cost = words[1], words[2], int(words[3])
              for place in (a, b):
                  if place not in roads:
                      roads[place] = []
              roads[a].append([b, cost])
              roads[b].append([a, cost])
          elif words[0] == "route":
              found = route(words[1], words[2])
              if found is None:
                  print(f"No route from {words[1]} to {words[2]}")
              else:
                  print(f"{' -> '.join(found[0])} ({found[1]})")
      `,
      `
      const roads = {};

      function dijkstra(start) {
        const dist = { [start]: 0 };
        const cameFrom = { [start]: null };
        const heap = [[0, start]];
        while (heap.length > 0) {
          const [d, node] = heapPop(heap);
          if (d > dist[node]) {
            continue;
          }
          for (const [nxt, w] of roads[node]) {
            if (d + w < (dist[nxt] ?? Infinity)) {
              dist[nxt] = d + w;
              cameFrom[nxt] = node;
              heapPush(heap, [d + w, nxt]);
            }
          }
        }
        return [dist, cameFrom];
      }

      function route(a, b) {
        if (!Object.hasOwn(roads, a) || !Object.hasOwn(roads, b)) {
          return null;
        }
        const [dist, cameFrom] = dijkstra(a);
        if (!Object.hasOwn(dist, b)) {
          return null;
        }
        const places = [];
        let node = b;
        while (node !== null) {
          places.push(node);
          node = cameFrom[node];
        }
        places.reverse();
        return [places, dist[b]];
      }

      while (true) {
        const words = prompt().split(" ");
        if (words[0] === "quit") {
          break;
        }
        if (words[0] === "road") {
          const [a, b] = [words[1], words[2]];
          const cost = Number(words[3]);
          for (const place of [a, b]) {
            if (!Object.hasOwn(roads, place)) {
              roads[place] = [];
            }
          }
          roads[a].push([b, cost]);
          roads[b].push([a, cost]);
        } else if (words[0] === "route") {
          const found = route(words[1], words[2]);
          if (found === null) {
            console.log(\`No route from \${words[1]} to \${words[2]}\`);
          } else {
            console.log(\`\${found[0].join(" -> ")} (\${found[1]})\`);
          }
        }
      }
      `,
    ),
    tests: [
      { name: 'the long way is cheaper', input: 'road A B 10\nroad A C 1\nroad C B 2\nroute A B\nroute B A\nquit', expectedOutput: 'A -> C -> B (3)\nB -> C -> A (3)' },
      { name: 'no route and the same place', input: 'road A B 5\nroad X Y 1\nroute A Y\nroute A A\nroute A Q\nquit', expectedOutput: 'No route from A to Y\nA (0)\nNo route from A to Q', hidden: true },
      { name: 'a bigger map', input: 'road H M 7\nroad H P 2\nroad P M 3\nroad M S 1\nroad P S 9\nroute H S\nroute S P\nquit', expectedOutput: 'H -> P -> M -> S (6)\nS -> M -> P (4)', hidden: true },
      {
        name: 'dijkstra on its own',
        input: 'road A B 1\nroad B C 1\nroad A C 5\nquit',
        hidden: true,
        expectedOutput: { python: '0 1 2 B\nNone', javascript: '0 1 2 B\nnull' },
        harness: code(
          '_d, _c = dijkstra("A")\nprint(_d["A"], _d["B"], _d["C"], _c["C"])\nprint(route("A", "Z"))',
          'const [_d, _c] = dijkstra("A");\nconsole.log(_d.A, _d.B, _d.C, _c.C);\nconsole.log(route("A", "Z"));',
        ),
      },
    ],
    takeaway: 'Dijkstra plus a `came_from` map is the complete route planner: costs *and* turn-by-turn directions, built from a heap (Region 7), a graph (Region 7), dictionaries (Region 4) and the same "walk back and reverse" trick as BFS. Real maps add one more idea on top (A* guesses which way to look first), but the engine is this.',
  },
];
