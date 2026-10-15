import type { Level } from '@codegames/shared';
import { code } from '../../helpers';
import { lang } from '../../localize';

/** linked-lists levels, in play order. */
export const linkedListsLevels: Level[] = [
  {
    id: 'linked-lists-1',
    conceptId: 'linked-lists',
    title: 'A Chain of Boxes',
    role: 'intro',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: 'A **linked list** is not an array: each `Node` holds a value and a reference to the **next** node, or nothing at the end. This builds a list by always putting the new node at the **front**, then walks it. Which output is right?',
    reinforces: ['classes', 'value-vs-reference', 'while-loops'],
    choices: {
      python: ['3 -> 2 -> 1\nlength 3', '1 -> 2 -> 3\nlength 3', '3 -> 2 -> 1\nlength 2', '1 -> 2 -> 3\nlength 4'],
      javascript: ['3 -> 2 -> 1\nlength 3', '1 -> 2 -> 3\nlength 3', '3 -> 2 -> 1\nlength 2', '1 -> 2 -> 3\nlength 4'],
    },
    hints: [
      'Each new node is created with `next` pointing at the **old** head, then becomes the new head. So 1 is the deepest node and 3 is at the front.',
      'The walk starts at `head` and follows `.next` until it is empty, collecting values as it goes.',
      'Three nodes were created, so three values are collected.',
    ],
    code: code(
      `
      class Node:
          def __init__(self, value, next_node):
              self.value = value
              self.next = next_node

      head = None
      for value in [1, 2, 3]:
          head = Node(value, head)

      parts = []
      count = 0
      node = head
      while node is not None:
          parts.append(str(node.value))
          count += 1
          node = node.next
      print(" -> ".join(parts))
      print("length", count)
      `,
      `
      class Node {
        constructor(value, next) {
          this.value = value;
          this.next = next;
        }
      }

      let head = null;
      for (const value of [1, 2, 3]) {
        head = new Node(value, head);
      }

      const parts = [];
      let count = 0;
      let node = head;
      while (node !== null) {
        parts.push(String(node.value));
        count += 1;
        node = node.next;
      }
      console.log(parts.join(" -> "));
      console.log("length", count);
      `,
    ),
    investigate: [
      { question: 'Adding at the front of a linked list costs:', choices: ['O(1): make a node and point it at the old head', 'O(n): every node must move', 'O(log n)'], answer: 0 },
      { question: 'Getting the 500th item of a linked list costs:', choices: ['O(n): follow `.next` 499 times; there is no index', 'O(1), like an array', 'It is impossible'], answer: 0 },
    ],
    takeaway: 'A linked list trades the array\'s instant indexing for instant **insertion and removal anywhere you already stand**: no shifting. The `next` references are the whole structure, which is why *reference vs value* (Region 5) matters here: two variables can point at the same node, and reassigning `.next` rewires the chain for everyone.',
  },
  {
    id: 'linked-lists-2',
    conceptId: 'linked-lists',
    title: 'Reverse Without Losing It',
    role: 'combine',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: 'This builds a linked list from the input numbers (in order), **reverses** it in place by flipping every `next` pointer, and prints it: `1 2 3` → `3 -> 2 -> 1`.\n\nIt prints just `1`. The reversing loop flips the first pointer and then loses the rest of the list. Fix the loop (one extra variable is all it takes).',
    reinforces: ['classes', 'value-vs-reference', 'while-loops', 'variables', 'input', 'type-conversion'],
    hints: [
      'In the loop, `node.next = prev` runs **before** `node = node.next`. By then, `node.next` is `prev`, not the rest of the list.',
      'Order inside the loop: save next, flip pointer, advance `prev`, advance `node`.',
      'Save the rest first: `after = node.next`, then `node.next = prev`, then `prev = node` and `node = after`.',
    ],
    starterCode: code(
      `
      class Node:
          def __init__(self, value, next_node):
              self.value = value
              self.next = next_node

      def build(values):
          head = None
          for value in reversed(values):
              head = Node(value, head)
          return head

      def reverse(head):
          prev = None
          node = head
          while node is not None:
              node.next = prev
              prev = node
              node = node.next
          return prev

      def show(head):
          parts = []
          node = head
          while node is not None:
              parts.append(str(node.value))
              node = node.next
          return " -> ".join(parts)

      head = build(list(map(int, input().split())))
      head = reverse(head)
      print(show(head))
      `,
      `
      class Node {
        constructor(value, next) {
          this.value = value;
          this.next = next;
        }
      }

      function build(values) {
        let head = null;
        for (let i = values.length - 1; i >= 0; i--) {
          head = new Node(values[i], head);
        }
        return head;
      }

      function reverse(head) {
        let prev = null;
        let node = head;
        while (node !== null) {
          node.next = prev;
          prev = node;
          node = node.next;
        }
        return prev;
      }

      function show(head) {
        const parts = [];
        let node = head;
        while (node !== null) {
          parts.push(String(node.value));
          node = node.next;
        }
        return parts.join(" -> ");
      }

      let head = build(prompt().split(" ").map(Number));
      head = reverse(head);
      console.log(show(head));
      `,
    ),
    solution: code(
      `
      class Node:
          def __init__(self, value, next_node):
              self.value = value
              self.next = next_node

      def build(values):
          head = None
          for value in reversed(values):
              head = Node(value, head)
          return head

      def reverse(head):
          prev = None
          node = head
          while node is not None:
              after = node.next
              node.next = prev
              prev = node
              node = after
          return prev

      def show(head):
          parts = []
          node = head
          while node is not None:
              parts.append(str(node.value))
              node = node.next
          return " -> ".join(parts)

      head = build(list(map(int, input().split())))
      head = reverse(head)
      print(show(head))
      `,
      `
      class Node {
        constructor(value, next) {
          this.value = value;
          this.next = next;
        }
      }

      function build(values) {
        let head = null;
        for (let i = values.length - 1; i >= 0; i--) {
          head = new Node(values[i], head);
        }
        return head;
      }

      function reverse(head) {
        let prev = null;
        let node = head;
        while (node !== null) {
          const after = node.next;
          node.next = prev;
          prev = node;
          node = after;
        }
        return prev;
      }

      function show(head) {
        const parts = [];
        let node = head;
        while (node !== null) {
          parts.push(String(node.value));
          node = node.next;
        }
        return parts.join(" -> ");
      }

      let head = build(prompt().split(" ").map(Number));
      head = reverse(head);
      console.log(show(head));
      `,
    ),
    tests: [
      { name: 'three nodes', input: '1 2 3', expectedOutput: '3 -> 2 -> 1' },
      { name: 'five nodes', input: '5 10 15 20 25', expectedOutput: '25 -> 20 -> 15 -> 10 -> 5', hidden: true },
      { name: 'one node', input: '7', expectedOutput: '7', hidden: true },
    ],
    takeaway: 'Pointer surgery has one rule: **never overwrite a reference you still need**. Reversing a list, inserting in the middle, deleting a node: every one of them saves the "next" link before changing it. This is the same lesson as the swap bug in sorting, with references instead of values.',
  },
  {
    id: 'linked-lists-3',
    conceptId: 'linked-lists',
    title: 'Playlist Chain',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: `A playlist stored as a linked list of \`Node(title, next)\`, with **no arrays or lists** for the songs. Read commands until \`done\`:\n\n- \`add TITLE\`: append to the **end**\n- \`remove TITLE\`: remove the first node with that title (if any)\n- \`show\`: print \`a -> b -> c\`, or \`(empty)\`\n\nWrite three functions that take the current \`head\`: ${lang('`add(head, title)` and `remove(head, title)` each **return** the new head; `show(head)` returns the text.', '`add(head, title)` and `remove(head, title)` each **return** the new head; `show(head)` returns the text.')} Walk the chain with a \`while\` loop; the head itself can change when the list is empty or when the first song is removed.`,
    reinforces: ['classes', 'functions', 'return-values', 'value-vs-reference', 'while-loops', 'conditionals', 'strings', 'input'],
    hints: [
      lang('`add`: if `head is None` return `Node(title, None)`. Otherwise walk to the last node (`while node.next is not None`), set its `next`, and return `head`.', '`add`: if `head === null` return `new Node(title, null)`. Otherwise walk to the last node (`while (node.next !== null)`), set its `next`, and return `head`.'),
      lang('`remove`: if `head` holds the title, return `head.next`. Otherwise walk with `node` while `node.next is not None`; when `node.next.value == title`, set `node.next = node.next.next` and stop.', '`remove`: if `head` holds the title, return `head.next`. Otherwise walk with `node` while `node.next !== null`; when `node.next.value === title`, set `node.next = node.next.next` and stop.'),
      lang('`show`: build the text with string concatenation: start with `text = ""`, append `" -> "` between titles. Return `"(empty)"` when `head is None`.', '`show`: build the text with string concatenation: start with `let text = ""`, append `" -> "` between titles. Return `"(empty)"` when `head === null`.'),
    ],
    requirements: {
      python: [{ pattern: '\\.append\\(|\\.insert\\(|\\.pop\\(|\\.remove\\(|\\[\\s*\\]', forbid: true, message: 'Store the songs only in Node links: no list building.' }],
      javascript: [{ pattern: '\\.push\\(|\\.unshift\\(|\\.pop\\(|\\.shift\\(|\\.splice\\(|\\[\\s*\\]', forbid: true, message: 'Store the songs only in Node links: no array building.' }],
    },
    starterCode: code(
      `
      class Node:
          def __init__(self, value, next_node):
              self.value = value
              self.next = next_node

      def add(head, title):
          # Append a node at the end; return the (possibly new) head.
          pass

      def remove(head, title):
          # Remove the first node with this title; return the (possibly new) head.
          pass

      def show(head):
          # "a -> b -> c", or "(empty)".
          pass

      head = None
      # Read commands until "done": add TITLE, remove TITLE, show.
      `,
      `
      class Node {
        constructor(value, next) {
          this.value = value;
          this.next = next;
        }
      }

      function add(head, title) {
        // Append a node at the end; return the (possibly new) head.
      }

      function remove(head, title) {
        // Remove the first node with this title; return the (possibly new) head.
      }

      function show(head) {
        // "a -> b -> c", or "(empty)".
      }

      let head = null;
      // Read commands until "done": add TITLE, remove TITLE, show.
      `,
    ),
    solution: code(
      `
      class Node:
          def __init__(self, value, next_node):
              self.value = value
              self.next = next_node

      def add(head, title):
          if head is None:
              return Node(title, None)
          node = head
          while node.next is not None:
              node = node.next
          node.next = Node(title, None)
          return head

      def remove(head, title):
          if head is None:
              return None
          if head.value == title:
              return head.next
          node = head
          while node.next is not None:
              if node.next.value == title:
                  node.next = node.next.next
                  break
              node = node.next
          return head

      def show(head):
          if head is None:
              return "(empty)"
          text = head.value
          node = head.next
          while node is not None:
              text = text + " -> " + node.value
              node = node.next
          return text

      head = None
      while True:
          command = input()
          if command == "done":
              break
          if command == "show":
              print(show(head))
          else:
              action, title = command.split(" ", 1)
              if action == "add":
                  head = add(head, title)
              else:
                  head = remove(head, title)
      `,
      `
      class Node {
        constructor(value, next) {
          this.value = value;
          this.next = next;
        }
      }

      function add(head, title) {
        if (head === null) {
          return new Node(title, null);
        }
        let node = head;
        while (node.next !== null) {
          node = node.next;
        }
        node.next = new Node(title, null);
        return head;
      }

      function remove(head, title) {
        if (head === null) {
          return null;
        }
        if (head.value === title) {
          return head.next;
        }
        let node = head;
        while (node.next !== null) {
          if (node.next.value === title) {
            node.next = node.next.next;
            break;
          }
          node = node.next;
        }
        return head;
      }

      function show(head) {
        if (head === null) {
          return "(empty)";
        }
        let text = head.value;
        let node = head.next;
        while (node !== null) {
          text = text + " -> " + node.value;
          node = node.next;
        }
        return text;
      }

      let head = null;
      while (true) {
        const command = prompt();
        if (command === "done") {
          break;
        }
        if (command === "show") {
          console.log(show(head));
        } else {
          const space = command.indexOf(" ");
          const action = command.slice(0, space);
          const title = command.slice(space + 1);
          if (action === "add") {
            head = add(head, title);
          } else {
            head = remove(head, title);
          }
        }
      }
      `,
    ),
    tests: [
      { name: 'add, remove the middle, show', input: 'add Intro\nadd Verse\nadd Chorus\nshow\nremove Verse\nshow\ndone', expectedOutput: 'Intro -> Verse -> Chorus\nIntro -> Chorus' },
      { name: 'remove the head and the last', input: 'add A\nadd B\nadd C\nremove A\nremove C\nshow\nremove B\nshow\ndone', expectedOutput: 'B\n(empty)', hidden: true },
      { name: 'remove something missing', input: 'show\nremove X\nadd Solo\nremove Nope\nshow\ndone', expectedOutput: '(empty)\nSolo', hidden: true },
      {
        name: 'add really builds Node links',
        input: 'done',
        hidden: true,
        expectedOutput: { python: 'Node None', javascript: 'true null' },
        harness: code('_n = add(None, "a")\nprint(type(_n).__name__, _n.next)', 'const _n = add(null, "a");\nconsole.log(_n instanceof Node, _n.next);'),
      },
      {
        name: 'functions on their own',
        input: 'done',
        hidden: true,
        expectedOutput: 'b -> c\n(empty)',
        harness: code(
          'print(show(remove(add(add(add(None, "a"), "b"), "c"), "a")))\nprint(show(remove(add(None, "x"), "x")))',
          'console.log(show(remove(add(add(add(null, "a"), "b"), "c"), "a")));\nconsole.log(show(remove(add(null, "x"), "x")));',
        ),
      },
    ],
    takeaway: 'Three operations, each a `while` walk plus one pointer change, and the **head may change** so every operation returns it. Appending at the end is O(n) here (real lists keep a `tail` reference); removal once you are at the right node is O(1), which is exactly what arrays cannot do. You now know both tools and when each wins.',
  },
];
