import type { Level } from '@codegames/shared';
import { code } from '../../helpers';
import { lang } from '../../localize';

const FILES = code(
  `
  tree = {"name": "home", "size": 1, "children": [
      {"name": "docs", "size": 2, "children": [
          {"name": "cv.txt", "size": 5, "children": []},
          {"name": "notes.txt", "size": 3, "children": []}]},
      {"name": "pics", "size": 1, "children": [
          {"name": "cat.png", "size": 20, "children": []}]}]}
  `,
  `
  const tree = { name: "home", size: 1, children: [
    { name: "docs", size: 2, children: [
      { name: "cv.txt", size: 5, children: [] },
      { name: "notes.txt", size: 3, children: [] }] },
    { name: "pics", size: 1, children: [
      { name: "cat.png", size: 20, children: [] }] }] };
  `,
);

/** trees levels, in play order. */
export const treesLevels: Level[] = [
  {
    id: 'trees-1',
    conceptId: 'trees',
    title: 'Folders All the Way Down',
    role: 'intro',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: 'A folder holds files and other folders: a **tree**. Each node is a dictionary with a `name`, a `size` and a list of `children`. Three recursive functions walk it. Which output is right?',
    reinforces: ['recursion', 'recursive-data', 'nested-data', 'maps'],
    choices: {
      python: ['Items: 6\nDepth: 3\nSize: 32', 'Items: 5\nDepth: 2\nSize: 32', 'Items: 6\nDepth: 4\nSize: 32', 'Items: 6\nDepth: 3\nSize: 28'],
      javascript: ['Items: 6\nDepth: 3\nSize: 32', 'Items: 5\nDepth: 2\nSize: 32', 'Items: 6\nDepth: 4\nSize: 32', 'Items: 6\nDepth: 3\nSize: 28'],
    },
    hints: [
      '`count` is 1 for the node itself plus the counts of its children: home, docs, cv.txt, notes.txt, pics, cat.png.',
      '`depth` of a file (no children) is 1; a folder is 1 more than its deepest child. home → docs → cv.txt is three levels.',
      'Size adds every node\'s own size, folders included: 1 + 2 + 5 + 3 + 1 + 20.',
    ],
    code: {
      python: `${FILES.python}
def count(node):
    total = 1
    for child in node["children"]:
        total += count(child)
    return total

def depth(node):
    deepest = 0
    for child in node["children"]:
        deepest = max(deepest, depth(child))
    return deepest + 1

def total_size(node):
    total = node["size"]
    for child in node["children"]:
        total += total_size(child)
    return total

print("Items:", count(tree))
print("Depth:", depth(tree))
print("Size:", total_size(tree))
`,
      javascript: `${FILES.javascript}
function count(node) {
  let total = 1;
  for (const child of node.children) {
    total += count(child);
  }
  return total;
}

function depth(node) {
  let deepest = 0;
  for (const child of node.children) {
    deepest = Math.max(deepest, depth(child));
  }
  return deepest + 1;
}

function totalSize(node) {
  let total = node.size;
  for (const child of node.children) {
    total += totalSize(child);
  }
  return total;
}

console.log("Items:", count(tree));
console.log("Depth:", depth(tree));
console.log("Size:", totalSize(tree));
`,
    },
    investigate: [
      { question: 'What is the base case of `count`?', choices: ['A node with no children: the loop does nothing and it returns 1', 'The root node', 'There is none; it loops forever'], answer: 0 },
      { question: 'Walking a tree with n nodes this way costs:', choices: ['O(n): every node is visited exactly once', 'O(n²)', 'O(log n)'], answer: 0 },
    ],
    takeaway: 'A **tree** is nested data with one rule: every node has exactly one parent, and there are no loops. That rule is what makes recursion safe: "handle this node, then recurse into each child" visits every node once and always terminates. Folders, HTML pages, family trees and the code you write (the compiler parses it into a tree) all have this shape.',
  },
  {
    id: 'trees-2',
    conceptId: 'trees',
    title: 'Where Did the Size Go?',
    role: 'combine',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: 'Type a name and this should print the total size of that item including everything inside it: `docs` → `Size of docs: 10`, `cv.txt` → `Size of cv.txt: 5`.\n\nIt prints `Size of cv.txt: 0` and `Size of docs: 8`. The recursion adds up the children but forgets something. Fix it.',
    reinforces: ['recursion', 'recursive-data', 'nested-data', 'maps', 'input', 'conditionals'],
    hints: [
      'A file has no children, so the loop adds nothing and the function returns 0. What should a file\'s total be?',
      'The total must start at the node\'s **own** size, then add each child\'s total.',
      lang('Change `total = 0` to `total = node["size"]`.', 'Change `let total = 0` to `let total = node.size`.'),
    ],
    starterCode: {
      python: `${FILES.python}
def find(node, name):
    if node["name"] == name:
        return node
    for child in node["children"]:
        hit = find(child, name)
        if hit is not None:
            return hit
    return None

def total_size(node):
    total = 0
    for child in node["children"]:
        total += total_size(child)
    return total

name = input()
node = find(tree, name)
if node is None:
    print("No such item")
else:
    print(f"Size of {name}: {total_size(node)}")
`,
      javascript: `${FILES.javascript}
function find(node, name) {
  if (node.name === name) {
    return node;
  }
  for (const child of node.children) {
    const hit = find(child, name);
    if (hit !== null) {
      return hit;
    }
  }
  return null;
}

function totalSize(node) {
  let total = 0;
  for (const child of node.children) {
    total += totalSize(child);
  }
  return total;
}

const name = prompt();
const node = find(tree, name);
if (node === null) {
  console.log("No such item");
} else {
  console.log(\`Size of \${name}: \${totalSize(node)}\`);
}
`,
    },
    solution: {
      python: `${FILES.python}
def find(node, name):
    if node["name"] == name:
        return node
    for child in node["children"]:
        hit = find(child, name)
        if hit is not None:
            return hit
    return None

def total_size(node):
    total = node["size"]
    for child in node["children"]:
        total += total_size(child)
    return total

name = input()
node = find(tree, name)
if node is None:
    print("No such item")
else:
    print(f"Size of {name}: {total_size(node)}")
`,
      javascript: `${FILES.javascript}
function find(node, name) {
  if (node.name === name) {
    return node;
  }
  for (const child of node.children) {
    const hit = find(child, name);
    if (hit !== null) {
      return hit;
    }
  }
  return null;
}

function totalSize(node) {
  let total = node.size;
  for (const child of node.children) {
    total += totalSize(child);
  }
  return total;
}

const name = prompt();
const node = find(tree, name);
if (node === null) {
  console.log("No such item");
} else {
  console.log(\`Size of \${name}: \${totalSize(node)}\`);
}
`,
    },
    tests: [
      { name: 'a file', input: 'cv.txt', expectedOutput: 'Size of cv.txt: 5' },
      { name: 'a folder', input: 'docs', expectedOutput: 'Size of docs: 10' },
      { name: 'the root', input: 'home', expectedOutput: 'Size of home: 32', hidden: true },
      { name: 'missing', input: 'music', expectedOutput: 'No such item', hidden: true },
    ],
    takeaway: 'Every tree recursion has two parts: what this node contributes, and what its children contribute. Forgetting the node itself is the classic slip, and it shows up most clearly at the leaves. `find` is the other pattern worth remembering: return the first child that reports a hit, otherwise report "not here".',
  },
  {
    id: 'trees-3',
    conceptId: 'trees',
    title: 'Org Chart',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: `Read \`manager employee\` lines until \`done\`; the first line's manager is the boss. Print the chart with two spaces per level, direct reports in input order, then one line \`NAME leads N\` for every manager (chart order), where N counts **everyone** under them:\n\n\`\`\`\nAda\n  Bo\n    Di\n  Cy\nAda leads 3\nBo leads 1\n\`\`\`\n\nKeep the chart in a dictionary \`reports\` from manager to list of direct reports. Write ${lang('`show(name, level)`', '`show(name, level)`')}, which prints a person and then recurses into their reports, and ${lang('`team_size(name)`', '`teamSize(name)`')}, which **returns** how many people are under them.`,
    reinforces: ['recursion', 'maps', 'map-patterns', 'functions', 'return-values', 'strings', 'input', 'string-formatting', 'collections', 'iterating-collections'],
    hints: [
      lang('People with no reports may be missing from `reports`, so read with `reports.get(name, [])`.', 'People with no reports may be missing from `reports`, so read with `reports[name] ?? []`.'),
      lang('`show`: `print("  " * level + name)`, then `show(child, level + 1)` for each report.', '`show`: `console.log("  ".repeat(level) + name)`, then `show(child, level + 1)` for each report.'),
      lang('`team_size`: `total = 0`; for each report, `total += 1 + team_size(report)`.', '`teamSize`: `let total = 0`; for each report, `total += 1 + teamSize(report)`.'),
      'Print the "leads" lines with a second recursive walk in the same order, skipping people with no reports.',
    ],
    starterCode: code(
      `
      reports = {}

      def show(name, level):
          # Print name indented by level, then each report one level deeper.
          pass

      def team_size(name):
          # Everyone under name, at any depth.
          pass

      boss = None
      # Read "manager employee" lines until "done"; the first manager is the boss.
      # Then: show the chart and print "NAME leads N" for every manager.
      `,
      `
      const reports = {};

      function show(name, level) {
        // Print name indented by level, then each report one level deeper.
      }

      function teamSize(name) {
        // Everyone under name, at any depth.
      }

      let boss = null;
      // Read "manager employee" lines until "done"; the first manager is the boss.
      // Then: show the chart and print "NAME leads N" for every manager.
      `,
    ),
    solution: code(
      `
      reports = {}

      def show(name, level):
          print("  " * level + name)
          for child in reports.get(name, []):
              show(child, level + 1)

      def team_size(name):
          total = 0
          for child in reports.get(name, []):
              total += 1 + team_size(child)
          return total

      def leads(name):
          if name in reports:
              print(f"{name} leads {team_size(name)}")
              for child in reports[name]:
                  leads(child)

      boss = None
      while True:
          line = input()
          if line == "done":
              break
          manager, employee = line.split()
          if boss is None:
              boss = manager
          if manager not in reports:
              reports[manager] = []
          reports[manager].append(employee)

      show(boss, 0)
      leads(boss)
      `,
      `
      const reports = {};

      function show(name, level) {
        console.log("  ".repeat(level) + name);
        for (const child of reports[name] ?? []) {
          show(child, level + 1);
        }
      }

      function teamSize(name) {
        let total = 0;
        for (const child of reports[name] ?? []) {
          total += 1 + teamSize(child);
        }
        return total;
      }

      function leads(name) {
        if (Object.hasOwn(reports, name)) {
          console.log(\`\${name} leads \${teamSize(name)}\`);
          for (const child of reports[name]) {
            leads(child);
          }
        }
      }

      let boss = null;
      while (true) {
        const line = prompt();
        if (line === "done") {
          break;
        }
        const [manager, employee] = line.split(" ");
        if (boss === null) {
          boss = manager;
        }
        if (!Object.hasOwn(reports, manager)) {
          reports[manager] = [];
        }
        reports[manager].push(employee);
      }

      show(boss, 0);
      leads(boss);
      `,
    ),
    tests: [
      { name: 'three levels', input: 'Ada Bo\nAda Cy\nBo Di\nBo Eve\nCy Fay\ndone', expectedOutput: 'Ada\n  Bo\n    Di\n    Eve\n  Cy\n    Fay\nAda leads 5\nBo leads 2\nCy leads 1' },
      { name: 'a flat team', input: 'Mo Al\nMo Bea\ndone', expectedOutput: 'Mo\n  Al\n  Bea\nMo leads 2', hidden: true },
      { name: 'a long chain', input: 'A B\nB C\nC D\ndone', expectedOutput: 'A\n  B\n    C\n      D\nA leads 3\nB leads 2\nC leads 1', hidden: true },
      {
        name: 'team_size on its own',
        input: 'Q R\ndone',
        hidden: true,
        expectedOutput: '3 1 0',
        harness: code(
          'reports["x"] = ["y", "z"]\nreports["y"] = ["w"]\nprint(team_size("x"), team_size("y"), team_size("w"))',
          'reports["x"] = ["y", "z"];\nreports["y"] = ["w"];\nconsole.log(teamSize("x"), teamSize("y"), teamSize("w"));',
        ),
      },
    ],
    takeaway: 'A tree does not need node objects: a dictionary from parent to children *is* a tree, and recursion walks it the same way. "Print me, then my children" is a **pre-order** walk; "count my children\'s totals, then add mine" is **post-order**. Most tree algorithms are one of those two with a different job at each node.',
  },
];
