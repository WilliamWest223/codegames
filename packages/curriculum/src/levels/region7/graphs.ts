import type { Level } from '@codegames/shared';
import { code } from '../../helpers';
import { lang } from '../../localize';

const ROUTES = code(
  `
  routes = {"A": ["B", "C"], "B": ["E"], "C": ["D"], "D": ["E"], "E": []}
  `,
  `
  const routes = { A: ["B", "C"], B: ["E"], C: ["D"], D: ["E"], E: [] };
  `,
);

const BFS_WRONG = {
  python: `${ROUTES.python}
start, target = input().split()
hops = {start: 0}
order = []
queue = [start]
while queue:
    node = queue.pop()
    order.append(node)
    for nxt in routes[node]:
        if nxt not in hops:
            hops[nxt] = hops[node] + 1
            queue.append(nxt)
print("Order:", " ".join(order))
if target in hops:
    print(f"Hops to {target}: {hops[target]}")
else:
    print(f"Hops to {target}: unreachable")
`,
  javascript: `${ROUTES.javascript}
const [start, target] = prompt().split(" ");
const hops = { [start]: 0 };
const order = [];
const queue = [start];
while (queue.length > 0) {
  const node = queue.pop();
  order.push(node);
  for (const nxt of routes[node]) {
    if (!Object.hasOwn(hops, nxt)) {
      hops[nxt] = hops[node] + 1;
      queue.push(nxt);
    }
  }
}
console.log("Order:", order.join(" "));
if (Object.hasOwn(hops, target)) {
  console.log(\`Hops to \${target}: \${hops[target]}\`);
} else {
  console.log(\`Hops to \${target}: unreachable\`);
}
`,
};

const BFS_RIGHT = {
  python: BFS_WRONG.python.replace('node = queue.pop()', 'node = queue.pop(0)'),
  javascript: BFS_WRONG.javascript.replace('const node = queue.pop();', 'const node = queue.shift();'),
};

/** graphs levels, in play order. */
export const graphsLevels: Level[] = [
  {
    id: 'graphs-1',
    conceptId: 'graphs',
    title: 'Ripples Outward',
    role: 'intro',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: 'A **graph** is nodes plus connections, here a dictionary from each stop to the stops it links to. **Breadth-first search** explores it in rings: everything 1 hop away, then 2 hops, then 3, using a queue. Which output is right?',
    reinforces: ['maps', 'stacks-queues', 'while-loops', 'iterating-collections'],
    choices: {
      python: ['Order: A B C D E F\nHops to F: 3', 'Order: A B D F C E\nHops to F: 3', 'Order: A B C D E F\nHops to F: 2', 'Order: A C B E D F\nHops to F: 4'],
      javascript: ['Order: A B C D E F\nHops to F: 3', 'Order: A B D F C E\nHops to F: 3', 'Order: A B C D E F\nHops to F: 2', 'Order: A C B E D F\nHops to F: 4'],
    },
    hints: [
      'The queue starts with A. Taking from the **front** and adding to the back means A\'s neighbours (B, C) are all handled before any of their neighbours.',
      'From B comes D; from C come D (already seen, skipped) and E. So after B and C come D and E, in that order.',
      'F is first reached from D, which is 2 hops out, so F is 3 hops.',
    ],
    code: code(
      `
      links = {"A": ["B", "C"], "B": ["D"], "C": ["D", "E"], "D": ["F"], "E": [], "F": []}

      hops = {"A": 0}
      order = []
      queue = ["A"]
      while queue:
          node = queue.pop(0)
          order.append(node)
          for nxt in links[node]:
              if nxt not in hops:
                  hops[nxt] = hops[node] + 1
                  queue.append(nxt)
      print("Order:", " ".join(order))
      print("Hops to F:", hops["F"])
      `,
      `
      const links = { A: ["B", "C"], B: ["D"], C: ["D", "E"], D: ["F"], E: [], F: [] };

      const hops = { A: 0 };
      const order = [];
      const queue = ["A"];
      while (queue.length > 0) {
        const node = queue.shift();
        order.push(node);
        for (const nxt of links[node]) {
          if (!Object.hasOwn(hops, nxt)) {
            hops[nxt] = hops[node] + 1;
            queue.push(nxt);
          }
        }
      }
      console.log("Order:", order.join(" "));
      console.log("Hops to F:", hops.F);
      `,
    ),
    investigate: [
      { question: 'What stops the search from visiting D twice?', choices: ['`hops` doubles as the "seen" set: a node is only queued the first time it is found', 'The queue removes duplicates', 'Nothing; D is visited twice but printed once'], answer: 0 },
      { question: 'Why is the first time BFS reaches a node also the **shortest** route to it?', choices: ['Nodes are handled in order of distance, so anything 2 hops away is found before anything 3 hops away', 'Because the dictionary is sorted', 'It is not; BFS finds some route, not the shortest'], answer: 0 },
    ],
    takeaway: 'Trees have one parent per node; **graphs** can have any connections, including loops, so the "seen" set is not optional. BFS = a queue + a seen set, and it finds the fewest-hops route to every node in O(nodes + edges). Swap the queue for a stack and you get depth-first search, which goes deep before wide.',
  },
  {
    id: 'graphs-2',
    conceptId: 'graphs',
    title: 'Queue, Not Stack',
    role: 'combine',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: 'Type a start and a target. This should print the breadth-first order from the start and the fewest hops to the target: `A E` → `Order: A B C E D` and `Hops to E: 2`.\n\nIt prints `Order: A C D E B` and `Hops to E: 3`: the search goes deep instead of wide, so the first route it finds is not the shortest. One method call is wrong.',
    reinforces: ['maps', 'stacks-queues', 'while-loops', 'input', 'conditionals', 'string-formatting'],
    hints: [
      'Look at how the next node is taken out of `queue`. Which end does it come from?',
      lang('`pop()` takes the **last** item: that is a stack. A queue takes the **first**.', '`pop()` takes the **last** item: that is a stack. A queue takes the **first**.'),
      lang('Change `queue.pop()` to `queue.pop(0)`.', 'Change `queue.pop()` to `queue.shift()`.'),
    ],
    starterCode: BFS_WRONG,
    solution: BFS_RIGHT,
    tests: [
      { name: 'from A', input: 'A E', expectedOutput: 'Order: A B C E D\nHops to E: 2' },
      { name: 'from C', input: 'C E', expectedOutput: 'Order: C D E\nHops to E: 2', hidden: true },
      { name: 'unreachable', input: 'B D', expectedOutput: 'Order: B E\nHops to D: unreachable', hidden: true },
    ],
    takeaway: 'The only difference between BFS and DFS is **which end of the list you take from**. A queue explores in rings and gives shortest hop counts; a stack dives down one branch first. Both are useful; mixing them up silently gives you the wrong distances, which is why the test printed the order too.',
  },
  {
    id: 'graphs-3',
    conceptId: 'graphs',
    title: 'Island Hopper',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: `A ferry network. Read commands until \`quit\`:\n\n- \`link A B\`: a two-way ferry between A and B\n- \`path A B\` → \`A -> C -> B (2 hops)\`, the fewest-hops route, or \`No path from A to B\`\n- \`islands\` → \`Islands: N\`, the number of separate groups of connected stops\n\nKeep \`links\` as a dictionary from stop to its list of neighbours (in link order). Write ${lang('`bfs(start)`', '`bfs(start)`')}, which **returns** a dictionary from every reachable stop to the stop it was reached from (the start maps to ${lang('`None`', '`null`')}); ${lang('`path(a, b)`', '`path(a, b)`')}, which returns the list of stops or ${lang('`None`', '`null`')}; and \`islands()\`.`,
    reinforces: ['maps', 'map-patterns', 'sets', 'stacks-queues', 'collections', 'functions', 'return-values', 'while-loops', 'strings', 'input', 'string-formatting', 'conditionals'],
    hints: [
      lang('`bfs`: `came_from = {start: None}`, `queue = [start]`; take from the front; for each neighbour not in `came_from`, record where it came from and queue it.', '`bfs`: `const cameFrom = { [start]: null }`, `queue = [start]`; `shift()` from the front; for each neighbour not in `cameFrom`, record where it came from and queue it.'),
      lang('`path`: if `a` or `b` is not in `links`, or `b` not in `bfs(a)`, return `None`. Otherwise walk back from `b` through `came_from` until `None`, then reverse the list.', '`path`: if `a` or `b` is not in `links`, or `b` not in `bfs(a)`, return `null`. Otherwise walk back from `b` through `cameFrom` until `null`, then reverse the list.'),
      'Hops = number of stops minus 1. `islands`: a `seen` set; for each stop not yet seen, count one island and add every stop in `bfs(stop)` to `seen`.',
    ],
    starterCode: code(
      `
      links = {}

      def bfs(start):
          # {stop: the stop it was reached from} for every reachable stop; start -> None.
          pass

      def path(a, b):
          # The fewest-hops route from a to b as a list, or None.
          pass

      def islands():
          pass

      # Read commands until "quit": link A B, path A B, islands.
      `,
      `
      const links = {};

      function bfs(start) {
        // { stop: the stop it was reached from } for every reachable stop; start -> null.
      }

      function path(a, b) {
        // The fewest-hops route from a to b as a list, or null.
      }

      function islands() {
      }

      // Read commands until "quit": link A B, path A B, islands.
      `,
    ),
    solution: code(
      `
      links = {}

      def bfs(start):
          came_from = {start: None}
          queue = [start]
          while queue:
              node = queue.pop(0)
              for nxt in links[node]:
                  if nxt not in came_from:
                      came_from[nxt] = node
                      queue.append(nxt)
          return came_from

      def path(a, b):
          if a not in links or b not in links:
              return None
          came_from = bfs(a)
          if b not in came_from:
              return None
          route = []
          node = b
          while node is not None:
              route.append(node)
              node = came_from[node]
          route.reverse()
          return route

      def islands():
          seen = set()
          count = 0
          for stop in links:
              if stop not in seen:
                  count += 1
                  for reached in bfs(stop):
                      seen.add(reached)
          return count

      while True:
          words = input().split()
          if words[0] == "quit":
              break
          if words[0] == "link":
              for stop in words[1:]:
                  if stop not in links:
                      links[stop] = []
              links[words[1]].append(words[2])
              links[words[2]].append(words[1])
          elif words[0] == "path":
              route = path(words[1], words[2])
              if route is None:
                  print(f"No path from {words[1]} to {words[2]}")
              else:
                  print(f"{' -> '.join(route)} ({len(route) - 1} hops)")
          elif words[0] == "islands":
              print(f"Islands: {islands()}")
      `,
      `
      const links = {};

      function bfs(start) {
        const cameFrom = { [start]: null };
        const queue = [start];
        while (queue.length > 0) {
          const node = queue.shift();
          for (const nxt of links[node]) {
            if (!Object.hasOwn(cameFrom, nxt)) {
              cameFrom[nxt] = node;
              queue.push(nxt);
            }
          }
        }
        return cameFrom;
      }

      function path(a, b) {
        if (!Object.hasOwn(links, a) || !Object.hasOwn(links, b)) {
          return null;
        }
        const cameFrom = bfs(a);
        if (!Object.hasOwn(cameFrom, b)) {
          return null;
        }
        const route = [];
        let node = b;
        while (node !== null) {
          route.push(node);
          node = cameFrom[node];
        }
        route.reverse();
        return route;
      }

      function islands() {
        const seen = new Set();
        let count = 0;
        for (const stop in links) {
          if (!seen.has(stop)) {
            count += 1;
            for (const reached in bfs(stop)) {
              seen.add(reached);
            }
          }
        }
        return count;
      }

      while (true) {
        const words = prompt().split(" ");
        if (words[0] === "quit") {
          break;
        }
        if (words[0] === "link") {
          for (const stop of words.slice(1)) {
            if (!Object.hasOwn(links, stop)) {
              links[stop] = [];
            }
          }
          links[words[1]].push(words[2]);
          links[words[2]].push(words[1]);
        } else if (words[0] === "path") {
          const route = path(words[1], words[2]);
          if (route === null) {
            console.log(\`No path from \${words[1]} to \${words[2]}\`);
          } else {
            console.log(\`\${route.join(" -> ")} (\${route.length - 1} hops)\`);
          }
        } else if (words[0] === "islands") {
          console.log(\`Islands: \${islands()}\`);
        }
      }
      `,
    ),
    tests: [
      { name: 'two islands', input: 'link A B\nlink B C\nlink A D\nlink D C\nlink X Y\npath A C\npath C A\npath A Y\nislands\nquit', expectedOutput: 'A -> B -> C (2 hops)\nC -> B -> A (2 hops)\nNo path from A to Y\nIslands: 2' },
      { name: 'a stop to itself and an unknown stop', input: 'link A B\npath A A\npath A Z\nislands\nquit', expectedOutput: 'A (0 hops)\nNo path from A to Z\nIslands: 1', hidden: true },
      { name: 'joining islands', input: 'link A B\nlink C D\nislands\nlink B C\nislands\npath A D\nquit', expectedOutput: 'Islands: 2\nIslands: 1\nA -> B -> C -> D (3 hops)', hidden: true },
      {
        name: 'bfs and path on their own',
        input: 'link P Q\nlink Q R\nquit',
        hidden: true,
        expectedOutput: { python: 'None P Q\n3 True', javascript: 'null P Q\n3 true' },
        harness: code(
          '_c = bfs("P")\nprint(_c["P"], _c["Q"], _c["R"])\nprint(len(path("P", "R")), path("R", "S") is None)',
          'const _c = bfs("P");\nconsole.log(_c.P, _c.Q, _c.R);\nconsole.log(path("P", "R").length, path("R", "S") === null);',
        ),
      },
    ],
    takeaway: 'Recording **where each node came from** turns BFS from "how far?" into "which way?": walk the `came_from` chain backwards and reverse it. Counting **connected components** is BFS run from every node you have not seen yet. Social networks, road maps, dependency graphs and puzzle states are all this same picture.',
  },
];
