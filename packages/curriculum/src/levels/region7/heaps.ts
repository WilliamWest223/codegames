import type { Level } from '@codegames/shared';
import { code } from '../../helpers';
import { lang } from '../../localize';
import { pair } from './shared';

const POP_WRONG = pair(
  `
  def push(heap, value):
      heap.append(value)
      i = len(heap) - 1
      while i > 0 and heap[(i - 1) // 2] > heap[i]:
          heap[(i - 1) // 2], heap[i] = heap[i], heap[(i - 1) // 2]
          i = (i - 1) // 2

  def pop(heap):
      top = heap[0]
      last = heap.pop()
      if heap:
          heap[0] = last
          i = 0
          while True:
              left = 2 * i + 1
              right = 2 * i + 2
              smallest = i
              if left < len(heap) and heap[left] < heap[smallest]:
                  smallest = left
              if smallest == i:
                  break
              heap[i], heap[smallest] = heap[smallest], heap[i]
              i = smallest
      return top

  heap = []
  for value in map(int, input().split()):
      push(heap, value)
  out = []
  while heap:
      out.append(str(pop(heap)))
  print(" ".join(out))
  `,
  `
  function push(heap, value) {
    heap.push(value);
    let i = heap.length - 1;
    while (i > 0 && heap[Math.floor((i - 1) / 2)] > heap[i]) {
      const parent = Math.floor((i - 1) / 2);
      [heap[parent], heap[i]] = [heap[i], heap[parent]];
      i = parent;
    }
  }

  function pop(heap) {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length > 0) {
      heap[0] = last;
      let i = 0;
      while (true) {
        const left = 2 * i + 1;
        const right = 2 * i + 2;
        let smallest = i;
        if (left < heap.length && heap[left] < heap[smallest]) {
          smallest = left;
        }
        if (smallest === i) {
          break;
        }
        [heap[i], heap[smallest]] = [heap[smallest], heap[i]];
        i = smallest;
      }
    }
    return top;
  }

  const heap = [];
  for (const value of prompt().split(" ").map(Number)) {
    push(heap, value);
  }
  const out = [];
  while (heap.length > 0) {
    out.push(String(pop(heap)));
  }
  console.log(out.join(" "));
  `,
);

const POP_RIGHT = {
  python: POP_WRONG.python.replace(
    '                smallest = left\n',
    '                smallest = left\n            if right < len(heap) and heap[right] < heap[smallest]:\n                smallest = right\n',
  ),
  javascript: POP_WRONG.javascript.replace(
    '        smallest = left;\n      }\n',
    '        smallest = left;\n      }\n      if (right < heap.length && heap[right] < heap[smallest]) {\n        smallest = right;\n      }\n',
  ),
};

/** heaps levels, in play order. */
export const heapsLevels: Level[] = [
  {
    id: 'heaps-1',
    conceptId: 'heaps',
    title: 'Smallest on Top',
    role: 'intro',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: 'A **min-heap** is a tree stored in a plain list: the children of index `i` live at `2i + 1` and `2i + 2`, and every parent is ≤ its children. After each push the new value **sifts up** past bigger parents. The list is printed after every push. Which output is right?',
    reinforces: ['collections', 'while-loops', 'operators', 'trees'],
    choices: {
      python: ['5\n3 5\n3 5 8\n1 3 8 5\nTop: 1', '5\n3 5\n3 5 8\n1 3 5 8\nTop: 1', '5\n5 3\n5 3 8\n1 3 8 5\nTop: 1', '5\n3 5\n3 5 8\n1 5 8 3\nTop: 1'],
      javascript: ['5\n3 5\n3 5 8\n1 3 8 5\nTop: 1', '5\n3 5\n3 5 8\n1 3 5 8\nTop: 1', '5\n5 3\n5 3 8\n1 3 8 5\nTop: 1', '5\n3 5\n3 5 8\n1 5 8 3\nTop: 1'],
    },
    hints: [
      'Pushing 3: it lands at index 1, whose parent is index 0 (the 5). 5 > 3, so they swap.',
      'Pushing 8: it lands at index 2, parent index 0 (the 3). 3 > 8 is false, so it stays.',
      'Pushing 1: index 3, parent index 1 (the 5): swap. Now at index 1, parent index 0 (the 3): swap again. The 5 is left at index 3.',
    ],
    code: code(
      `
      def push(heap, value):
          heap.append(value)
          i = len(heap) - 1
          while i > 0 and heap[(i - 1) // 2] > heap[i]:
              heap[(i - 1) // 2], heap[i] = heap[i], heap[(i - 1) // 2]
              i = (i - 1) // 2

      heap = []
      for value in [5, 3, 8, 1]:
          push(heap, value)
          print(" ".join(map(str, heap)))
      print("Top:", heap[0])
      `,
      `
      function push(heap, value) {
        heap.push(value);
        let i = heap.length - 1;
        while (i > 0 && heap[Math.floor((i - 1) / 2)] > heap[i]) {
          const parent = Math.floor((i - 1) / 2);
          [heap[parent], heap[i]] = [heap[i], heap[parent]];
          i = parent;
        }
      }

      const heap = [];
      for (const value of [5, 3, 8, 1]) {
        push(heap, value);
        console.log(heap.join(" "));
      }
      console.log("Top:", heap[0]);
      `,
    ),
    investigate: [
      { question: 'Is the heap list sorted?', choices: ['No: only each parent ≤ its children is guaranteed, which is enough to keep the smallest at index 0', 'Yes, always', 'Only after an even number of pushes'], answer: 0 },
      { question: 'How many swaps can one push take at most, with n items?', choices: ['About log₂ n: one per level of the tree', 'n', '1'], answer: 0 },
    ],
    takeaway: 'A **heap** gives you the smallest (or biggest) item in O(1) and lets you add or remove one in **O(log n)**, without keeping everything sorted. It is a tree, but the parent/child links are arithmetic on indexes, so there are no node objects at all. Priority queues, schedulers and Dijkstra\'s algorithm (next concept) are all built on it.',
  },
  {
    id: 'heaps-2',
    conceptId: 'heaps',
    title: 'The Forgotten Child',
    role: 'combine',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: 'Push every input number onto a min-heap, then pop until empty: the numbers should come out sorted. `1 9 2 8 3` → `1 2 3 8 9`.\n\nInstead it prints `1 3 8 2 9`. `push` is fine; `pop` moves the last item to the top and **sifts it down**, but it only ever looks at one child. Fix it.',
    reinforces: ['collections', 'while-loops', 'conditionals', 'input', 'type-conversion', 'trees'],
    hints: [
      'A node has up to **two** children. The sift-down must swap with the **smaller** of the two, or a smaller right child gets stuck below a bigger parent.',
      '`right` is computed but never used. Compare it the same way `left` is compared, after the `left` check, so `smallest` ends up as the smallest of all three.',
      lang('Add: `if right < len(heap) and heap[right] < heap[smallest]: smallest = right`.', 'Add: `if (right < heap.length && heap[right] < heap[smallest]) { smallest = right; }`.'),
    ],
    starterCode: POP_WRONG,
    solution: POP_RIGHT,
    tests: [
      { name: 'right child matters', input: '1 9 2 8 3', expectedOutput: '1 2 3 8 9' },
      { name: 'reversed', input: '9 7 5 3 1', expectedOutput: '1 3 5 7 9', hidden: true },
      { name: 'repeats', input: '3 3 1 2 1', expectedOutput: '1 1 2 3 3', hidden: true },
      { name: 'one value', input: '7', expectedOutput: '7', hidden: true },
    ],
    takeaway: 'Popping from a heap is "move the last item to the root, then sift it down toward the **smaller child**" until both children are bigger. Test data that happens to work is the trap here: the bug only shows when the right child is the smaller one. Heap sort (push all, pop all) is O(n log n), and you just wrote it.',
  },
  {
    id: 'heaps-3',
    conceptId: 'heaps',
    title: 'Priority Inbox',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: `A to-do inbox where the lowest priority number is the most urgent. Read commands until \`done\`:\n\n- \`add P NAME\` (P is a whole number; priorities are distinct)\n- \`next\` → \`Next: NAME (P)\` and removes it, or \`Nothing to do\`\n- \`peek\` → \`Peek: NAME (P)\` without removing, or \`Nothing to do\`\n\nStore tasks as \`[priority, name]\` pairs in a list that you keep as a **min-heap** with your own ${lang('`push(heap, task)`', '`push(heap, task)`')} and ${lang('`pop(heap)`', '`pop(heap)`')}, comparing \`task[0]\`. No sorting and no scanning for the minimum.`,
    reinforces: ['collections', 'nested-data', 'functions', 'return-values', 'while-loops', 'conditionals', 'strings', 'input', 'type-conversion', 'string-formatting'],
    hints: [
      'Same `push` as before, but compare `heap[parent][0] > heap[i][0]`.',
      '`pop`: remember `heap[0]`, move the last item to index 0 (if any are left), sift down toward the smaller child by `[0]`, return the remembered task.',
      lang('`add`: `push(heap, [int(words[1]), words[2]])`. `peek` is just `heap[0]` when the heap is not empty.', '`add`: `push(heap, [Number(words[1]), words[2]])`. `peek` is just `heap[0]` when the heap is not empty.'),
    ],
    requirements: {
      python: [{ pattern: 'sorted\\(|\\.sort\\(|heapq|\\bmin\\(', forbid: true, message: 'Keep the heap property yourself: no sorting, heapq or min().' }],
      javascript: [{ pattern: '\\.sort\\(|toSorted\\(|Math\\.min\\(', forbid: true, message: 'Keep the heap property yourself: no sorting or Math.min().' }],
    },
    starterCode: code(
      `
      def push(heap, task):
          # Append, then sift up while the parent's priority is bigger.
          pass

      def pop(heap):
          # Remove and return the most urgent task; sift the moved item down.
          pass

      heap = []
      # Read commands until "done": add P NAME, next, peek.
      `,
      `
      function push(heap, task) {
        // Append, then sift up while the parent's priority is bigger.
      }

      function pop(heap) {
        // Remove and return the most urgent task; sift the moved item down.
      }

      const heap = [];
      // Read commands until "done": add P NAME, next, peek.
      `,
    ),
    solution: code(
      `
      def push(heap, task):
          heap.append(task)
          i = len(heap) - 1
          while i > 0 and heap[(i - 1) // 2][0] > heap[i][0]:
              heap[(i - 1) // 2], heap[i] = heap[i], heap[(i - 1) // 2]
              i = (i - 1) // 2

      def pop(heap):
          top = heap[0]
          last = heap.pop()
          if heap:
              heap[0] = last
              i = 0
              while True:
                  smallest = i
                  for child in (2 * i + 1, 2 * i + 2):
                      if child < len(heap) and heap[child][0] < heap[smallest][0]:
                          smallest = child
                  if smallest == i:
                      break
                  heap[i], heap[smallest] = heap[smallest], heap[i]
                  i = smallest
          return top

      heap = []
      while True:
          words = input().split()
          if words[0] == "done":
              break
          if words[0] == "add":
              push(heap, [int(words[1]), words[2]])
          elif not heap:
              print("Nothing to do")
          elif words[0] == "next":
              task = pop(heap)
              print(f"Next: {task[1]} ({task[0]})")
          elif words[0] == "peek":
              print(f"Peek: {heap[0][1]} ({heap[0][0]})")
      `,
      `
      function push(heap, task) {
        heap.push(task);
        let i = heap.length - 1;
        while (i > 0 && heap[Math.floor((i - 1) / 2)][0] > heap[i][0]) {
          const parent = Math.floor((i - 1) / 2);
          [heap[parent], heap[i]] = [heap[i], heap[parent]];
          i = parent;
        }
      }

      function pop(heap) {
        const top = heap[0];
        const last = heap.pop();
        if (heap.length > 0) {
          heap[0] = last;
          let i = 0;
          while (true) {
            let smallest = i;
            for (const child of [2 * i + 1, 2 * i + 2]) {
              if (child < heap.length && heap[child][0] < heap[smallest][0]) {
                smallest = child;
              }
            }
            if (smallest === i) {
              break;
            }
            [heap[i], heap[smallest]] = [heap[smallest], heap[i]];
            i = smallest;
          }
        }
        return top;
      }

      const heap = [];
      while (true) {
        const words = prompt().split(" ");
        if (words[0] === "done") {
          break;
        }
        if (words[0] === "add") {
          push(heap, [Number(words[1]), words[2]]);
        } else if (heap.length === 0) {
          console.log("Nothing to do");
        } else if (words[0] === "next") {
          const task = pop(heap);
          console.log(\`Next: \${task[1]} (\${task[0]})\`);
        } else if (words[0] === "peek") {
          console.log(\`Peek: \${heap[0][1]} (\${heap[0][0]})\`);
        }
      }
      `,
    ),
    tests: [
      { name: 'urgent first', input: 'add 5 laundry\nadd 1 deadline\nadd 3 call\npeek\nnext\nnext\nadd 2 email\nnext\nnext\nnext\ndone', expectedOutput: 'Peek: deadline (1)\nNext: deadline (1)\nNext: call (3)\nNext: email (2)\nNext: laundry (5)\nNothing to do' },
      { name: 'empty inbox', input: 'peek\nnext\ndone', expectedOutput: 'Nothing to do\nNothing to do', hidden: true },
      { name: 'many tasks', input: 'add 9 i\nadd 4 d\nadd 7 g\nadd 1 a\nadd 8 h\nadd 2 b\nnext\nnext\nnext\nnext\nnext\nnext\ndone', expectedOutput: 'Next: a (1)\nNext: b (2)\nNext: d (4)\nNext: g (7)\nNext: h (8)\nNext: i (9)', hidden: true },
      {
        name: 'push and pop on their own',
        input: 'done',
        hidden: true,
        expectedOutput: 'a b 1',
        harness: code(
          '_h = []\nfor _t in [[3, "c"], [1, "a"], [2, "b"]]:\n    push(_h, _t)\nprint(pop(_h)[1], pop(_h)[1], len(_h))',
          'const _h = [];\nfor (const _t of [[3, "c"], [1, "a"], [2, "b"]]) {\n  push(_h, _t);\n}\nconsole.log(pop(_h)[1], pop(_h)[1], _h.length);',
        ),
      },
    ],
    takeaway: 'A **priority queue** is the heap\'s job description: things arrive in any order and leave in priority order, each operation O(log n). Keeping the list sorted instead would cost O(n) per insert; scanning for the minimum would cost O(n) per removal. Store whatever you like in the items; only the comparison needs to know where the priority lives.',
  },
];
