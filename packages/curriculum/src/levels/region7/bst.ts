import type { Level } from '@codegames/shared';
import { code } from '../../helpers';
import { lang } from '../../localize';

const NODE = code(
  `
  class Node:
      def __init__(self, value):
          self.value = value
          self.left = None
          self.right = None
  `,
  `
  class Node {
    constructor(value) {
      this.value = value;
      this.left = null;
      this.right = null;
    }
  }
  `,
);

/** Like `code()`, with the given `Node` class above each language's program. */
function withNode(python: string, javascript: string) {
  const c = code(python, javascript);
  return { python: `${NODE.python}\n\n${c.python}`, javascript: `${NODE.javascript}\n\n${c.javascript}` };
}

const INSERT_WRONG = withNode(
  `
  def insert(node, value):
      if node is None:
          return Node(value)
      if value < node.value:
          node.right = insert(node.right, value)
      else:
          node.left = insert(node.left, value)
      return node

  def in_order(node, out):
      if node is None:
          return
      in_order(node.left, out)
      out.append(node.value)
      in_order(node.right, out)

  def smallest(node):
      while node.left is not None:
          node = node.left
      return node.value

  root = None
  for value in map(int, input().split()):
      root = insert(root, value)
  out = []
  in_order(root, out)
  print(" ".join(map(str, out)))
  print("Smallest:", smallest(root))
  `,
  `
  function insert(node, value) {
    if (node === null) {
      return new Node(value);
    }
    if (value < node.value) {
      node.right = insert(node.right, value);
    } else {
      node.left = insert(node.left, value);
    }
    return node;
  }

  function inOrder(node, out) {
    if (node === null) {
      return;
    }
    inOrder(node.left, out);
    out.push(node.value);
    inOrder(node.right, out);
  }

  function smallest(node) {
    while (node.left !== null) {
      node = node.left;
    }
    return node.value;
  }

  let root = null;
  for (const value of prompt().split(" ").map(Number)) {
    root = insert(root, value);
  }
  const out = [];
  inOrder(root, out);
  console.log(out.join(" "));
  console.log("Smallest:", smallest(root));
  `,
);

const INSERT_RIGHT = {
  python: INSERT_WRONG.python.replace('node.right = insert(node.right, value)\n    else:\n        node.left = insert(node.left, value)', 'node.left = insert(node.left, value)\n    else:\n        node.right = insert(node.right, value)'),
  javascript: INSERT_WRONG.javascript.replace('node.right = insert(node.right, value);\n  } else {\n    node.left = insert(node.left, value);', 'node.left = insert(node.left, value);\n  } else {\n    node.right = insert(node.right, value);'),
};

/** bst levels, in play order. */
export const bstLevels: Level[] = [
  {
    id: 'bst-1',
    conceptId: 'bst',
    title: 'Smaller Left, Bigger Right',
    role: 'intro',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: 'A **binary search tree** keeps smaller values to the left of each node and bigger ones to the right. Inserting `5 3 8 1 4`, then walking it **in order** (left, self, right), then searching. Which output is right?',
    reinforces: ['recursion', 'classes', 'binary-search', 'while-loops'],
    choices: {
      python: ['1 3 4 5 8\n4: found after 3 steps\n7: not found after 2 steps', '5 3 8 1 4\n4: found after 3 steps\n7: not found after 2 steps', '1 3 4 5 8\n4: found after 4 steps\n7: not found after 5 steps', '1 3 4 5 8\n4: found after 2 steps\n7: not found after 3 steps'],
      javascript: ['1 3 4 5 8\n4: found after 3 steps\n7: not found after 2 steps', '5 3 8 1 4\n4: found after 3 steps\n7: not found after 2 steps', '1 3 4 5 8\n4: found after 4 steps\n7: not found after 5 steps', '1 3 4 5 8\n4: found after 2 steps\n7: not found after 3 steps'],
    },
    hints: [
      '5 is the root. 3 goes left of 5, 8 right of 5, 1 left of 3, 4 right of 3.',
      'In-order visits the left subtree, then the node, then the right subtree, so it comes out **sorted**.',
      'Searching 4: look at 5 (go left), 3 (go right), 4: three steps. Searching 7: 5 (right), 8 (left: nothing): two steps.',
    ],
    code: withNode(
      `
      def insert(node, value):
          if node is None:
              return Node(value)
          if value < node.value:
              node.left = insert(node.left, value)
          else:
              node.right = insert(node.right, value)
          return node

      def in_order(node, out):
          if node is None:
              return
          in_order(node.left, out)
          out.append(node.value)
          in_order(node.right, out)

      def search(node, target):
          steps = 0
          while node is not None:
              steps += 1
              if target == node.value:
                  return f"found after {steps} steps"
              if target < node.value:
                  node = node.left
              else:
                  node = node.right
          return f"not found after {steps} steps"

      root = None
      for value in [5, 3, 8, 1, 4]:
          root = insert(root, value)
      out = []
      in_order(root, out)
      print(" ".join(map(str, out)))
      print("4:", search(root, 4))
      print("7:", search(root, 7))
      `,
      `
      function insert(node, value) {
        if (node === null) {
          return new Node(value);
        }
        if (value < node.value) {
          node.left = insert(node.left, value);
        } else {
          node.right = insert(node.right, value);
        }
        return node;
      }

      function inOrder(node, out) {
        if (node === null) {
          return;
        }
        inOrder(node.left, out);
        out.push(node.value);
        inOrder(node.right, out);
      }

      function search(node, target) {
        let steps = 0;
        while (node !== null) {
          steps += 1;
          if (target === node.value) {
            return \`found after \${steps} steps\`;
          }
          if (target < node.value) {
            node = node.left;
          } else {
            node = node.right;
          }
        }
        return \`not found after \${steps} steps\`;
      }

      let root = null;
      for (const value of [5, 3, 8, 1, 4]) {
        root = insert(root, value);
      }
      const out = [];
      inOrder(root, out);
      console.log(out.join(" "));
      console.log("4:", search(root, 4));
      console.log("7:", search(root, 7));
      `,
    ),
    investigate: [
      { question: 'Why does `insert` return the node?', choices: ['So the parent (or `root`) can store the possibly new subtree: inserting into an empty spot creates a node', 'To print it', 'It does not matter; the return value is ignored'], answer: 0 },
      { question: 'Searching a balanced BST with a million values takes about:', choices: ['20 steps: each step halves the remaining tree, like binary search', 'A million steps', '1,000 steps'], answer: 0 },
    ],
    takeaway: 'A BST is **binary search as a data structure**: each node splits what is left in two, so search, insert and "walk in sorted order" are all simple recursions. Unlike a sorted array, inserting is O(log n) with no shifting, as long as the tree stays roughly balanced (insert sorted input and it degenerates into a linked list).',
  },
  {
    id: 'bst-2',
    conceptId: 'bst',
    title: 'Mirror Tree',
    role: 'combine',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: 'Build a BST from the input numbers, print them in order and the smallest: `5 3 8 1 4` → `1 3 4 5 8` and `Smallest: 1`.\n\nIt prints `8 5 4 3 1` and `Smallest: 8`: the whole tree is mirrored. Find the one place where left and right got swapped.',
    reinforces: ['recursion', 'classes', 'conditionals', 'while-loops', 'input', 'type-conversion', 'value-vs-reference'],
    hints: [
      '`in_order` and `smallest` are correct: left, then self, then right; smallest is the leftmost node.',
      'Look at `insert`: where do smaller values go?',
      'Smaller values must go **left**: `if value < node.value: node.left = insert(node.left, value)`, and bigger ones right.',
    ],
    starterCode: INSERT_WRONG,
    solution: INSERT_RIGHT,
    tests: [
      { name: 'five values', input: '5 3 8 1 4', expectedOutput: '1 3 4 5 8\nSmallest: 1' },
      { name: 'already ascending', input: '10 20 30', expectedOutput: '10 20 30\nSmallest: 10', hidden: true },
      { name: 'one value', input: '7', expectedOutput: '7\nSmallest: 7', hidden: true },
      { name: 'descending input', input: '9 7 5 3', expectedOutput: '3 5 7 9\nSmallest: 3', hidden: true },
    ],
    takeaway: 'Every BST operation relies on the same **invariant**: left < node ≤ right. Break it in one place and every other function that trusts it goes wrong together, which is what makes the bug look bigger than it is. When a tree misbehaves, check the code that *builds* it before the code that *reads* it.',
  },
  {
    id: 'bst-3',
    conceptId: 'bst',
    title: 'Range Finder',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: `The first line is a set of distinct numbers; build a BST from them in that order. Then answer queries until \`done\`:\n\n- \`has X\` → \`X: yes\` or \`X: no\`\n- \`height\` → \`Height: H\` (a single node has height 1)\n- \`between LO HI\` → \`Between LO and HI: a b c\` in ascending order (or \`Between LO and HI: none\`)\n\nWrite \`insert(node, value)\` (returns the subtree), \`contains(node, value)\`, \`height(node)\` and ${lang('`between(node, lo, hi, out)`', '`between(node, lo, hi, out)`')}, which appends the values in range to \`out\` **without visiting subtrees that cannot contain them**: skip the left subtree when \`node.value < lo\`, the right one when \`node.value > hi\`. No sorting and no searching the input list.`,
    reinforces: ['recursion', 'classes', 'functions', 'return-values', 'collections', 'conditionals', 'strings', 'input', 'type-conversion', 'string-formatting', 'while-loops'],
    hints: [
      lang('`contains`: `if node is None: return False`; equal → True; otherwise recurse left or right.', '`contains`: `if (node === null) return false;` equal → true; otherwise recurse left or right.'),
      lang('`height`: `0` for `None`, else `1 + max(height(node.left), height(node.right))`.', '`height`: `0` for `null`, else `1 + Math.max(height(node.left), height(node.right))`.'),
      lang('`between`: `if node is None: return`; `if node.value > lo: between(node.left, ...)`; `if lo <= node.value <= hi: out.append(node.value)`; `if node.value < hi: between(node.right, ...)`.', '`between`: `if (node === null) return;` `if (node.value > lo) between(node.left, ...)`; `if (lo <= node.value && node.value <= hi) out.push(node.value)`; `if (node.value < hi) between(node.right, ...)`.'),
    ],
    requirements: {
      python: [{ pattern: 'sorted\\(|\\.sort\\(|\\.count\\(', forbid: true, message: 'Answer from the tree: no sorting or searching the input list.' }],
      javascript: [{ pattern: '\\.sort\\(|toSorted\\(|\\.includes\\(', forbid: true, message: 'Answer from the tree: no sorting or searching the input list.' }],
    },
    starterCode: withNode(
      `
      def insert(node, value):
          pass

      def contains(node, value):
          pass

      def height(node):
          pass

      def between(node, lo, hi, out):
          # Append every value in lo..hi (inclusive) to out, in ascending order.
          pass

      root = None
      for value in map(int, input().split()):
          root = insert(root, value)
      # Answer queries until "done".
      `,
      `
      function insert(node, value) {
      }

      function contains(node, value) {
      }

      function height(node) {
      }

      function between(node, lo, hi, out) {
        // Push every value in lo..hi (inclusive) to out, in ascending order.
      }

      let root = null;
      for (const value of prompt().split(" ").map(Number)) {
        root = insert(root, value);
      }
      // Answer queries until "done".
      `,
    ),
    solution: withNode(
      `
      def insert(node, value):
          if node is None:
              return Node(value)
          if value < node.value:
              node.left = insert(node.left, value)
          else:
              node.right = insert(node.right, value)
          return node

      def contains(node, value):
          if node is None:
              return False
          if value == node.value:
              return True
          if value < node.value:
              return contains(node.left, value)
          return contains(node.right, value)

      def height(node):
          if node is None:
              return 0
          return 1 + max(height(node.left), height(node.right))

      def between(node, lo, hi, out):
          if node is None:
              return
          if node.value > lo:
              between(node.left, lo, hi, out)
          if lo <= node.value <= hi:
              out.append(node.value)
          if node.value < hi:
              between(node.right, lo, hi, out)

      root = None
      for value in map(int, input().split()):
          root = insert(root, value)

      while True:
          words = input().split()
          if words[0] == "done":
              break
          if words[0] == "has":
              x = int(words[1])
              print(f"{x}: {'yes' if contains(root, x) else 'no'}")
          elif words[0] == "height":
              print(f"Height: {height(root)}")
          elif words[0] == "between":
              lo = int(words[1])
              hi = int(words[2])
              out = []
              between(root, lo, hi, out)
              found = " ".join(map(str, out)) if out else "none"
              print(f"Between {lo} and {hi}: {found}")
      `,
      `
      function insert(node, value) {
        if (node === null) {
          return new Node(value);
        }
        if (value < node.value) {
          node.left = insert(node.left, value);
        } else {
          node.right = insert(node.right, value);
        }
        return node;
      }

      function contains(node, value) {
        if (node === null) {
          return false;
        }
        if (value === node.value) {
          return true;
        }
        if (value < node.value) {
          return contains(node.left, value);
        }
        return contains(node.right, value);
      }

      function height(node) {
        if (node === null) {
          return 0;
        }
        return 1 + Math.max(height(node.left), height(node.right));
      }

      function between(node, lo, hi, out) {
        if (node === null) {
          return;
        }
        if (node.value > lo) {
          between(node.left, lo, hi, out);
        }
        if (lo <= node.value && node.value <= hi) {
          out.push(node.value);
        }
        if (node.value < hi) {
          between(node.right, lo, hi, out);
        }
      }

      let root = null;
      for (const value of prompt().split(" ").map(Number)) {
        root = insert(root, value);
      }

      while (true) {
        const words = prompt().split(" ");
        if (words[0] === "done") {
          break;
        }
        if (words[0] === "has") {
          const x = Number(words[1]);
          console.log(\`\${x}: \${contains(root, x) ? "yes" : "no"}\`);
        } else if (words[0] === "height") {
          console.log(\`Height: \${height(root)}\`);
        } else if (words[0] === "between") {
          const lo = Number(words[1]);
          const hi = Number(words[2]);
          const out = [];
          between(root, lo, hi, out);
          const found = out.length > 0 ? out.join(" ") : "none";
          console.log(\`Between \${lo} and \${hi}: \${found}\`);
        }
      }
      `,
    ),
    tests: [
      { name: 'all three queries', input: '50 30 70 20 40 60 80\nhas 40\nhas 45\nheight\nbetween 35 65\ndone', expectedOutput: '40: yes\n45: no\nHeight: 3\nBetween 35 and 65: 40 50 60' },
      { name: 'a lopsided tree', input: '1 2 3 4\nheight\nbetween 10 20\nbetween 2 3\ndone', expectedOutput: 'Height: 4\nBetween 10 and 20: none\nBetween 2 and 3: 2 3', hidden: true },
      { name: 'edges included', input: '8 4 12\nbetween 4 12\nhas 8\ndone', expectedOutput: 'Between 4 and 12: 4 8 12\n8: yes', hidden: true },
      {
        name: 'functions on their own',
        input: '1\ndone',
        hidden: true,
        expectedOutput: { python: 'True False 3 [6, 7]', javascript: 'true false 3 6,7' },
        harness: code(
          '_r = None\nfor _v in [5, 3, 8, 7, 6]:\n    _r = insert(_r, _v)\n_o = []\nbetween(_r, 6, 7, _o)\nprint(contains(_r, 7), contains(_r, 4), height(_r) - 1, _o)',
          'let _r = null;\nfor (const _v of [5, 3, 8, 7, 6]) {\n  _r = insert(_r, _v);\n}\nconst _o = [];\nbetween(_r, 6, 7, _o);\nconsole.log(contains(_r, 7), contains(_r, 4), height(_r) - 1, String(_o));',
        ),
      },
    ],
    takeaway: 'The range query shows why trees beat hash sets for some questions: a set answers "is 40 here?" in O(1) but has no idea what is *near* 40. A BST answers "everything between 35 and 65" by **pruning** whole subtrees it can skip, in O(log n + results). Databases index columns with exactly this kind of tree.',
  },
];
