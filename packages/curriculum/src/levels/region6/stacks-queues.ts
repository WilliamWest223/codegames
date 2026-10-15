import type { Level } from '@codegames/shared';
import { code } from '../../helpers';
import { lang } from '../../localize';

/** stacks-queues levels, in play order. */
export const stacksQueuesLevels: Level[] = [
  {
    id: 'stacks-queues-1',
    conceptId: 'stacks-queues',
    title: 'Last In, First In',
    role: 'intro',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: `The same three jobs go into a **stack** (take from the end: last in, first out) and a **queue** (take from the front: first in, first out). Both are ordinary lists; only *where you take from* differs. Which output is right?`,
    reinforces: ['collections', 'while-loops', 'iterating-collections'],
    choices: {
      python: ['Stack: wash dry fold\nQueue: fold dry wash', 'Stack: fold dry wash\nQueue: fold dry wash', 'Stack: fold dry wash\nQueue: wash dry fold', 'Stack: wash dry fold\nQueue: wash dry fold'],
      javascript: ['Stack: wash dry fold\nQueue: fold dry wash', 'Stack: fold dry wash\nQueue: fold dry wash', 'Stack: fold dry wash\nQueue: wash dry fold', 'Stack: wash dry fold\nQueue: wash dry fold'],
    },
    hints: [
      lang('`pop()` with no index removes the **last** item: the most recently added job comes out first.', '`pop()` removes the **last** item: the most recently added job comes out first.'),
      lang('`pop(0)` removes the **first** item: the oldest job comes out first.', '`shift()` removes the **first** item: the oldest job comes out first.'),
      'Jobs were added in the order wash, dry, fold. The stack reverses that; the queue keeps it.',
    ],
    code: code(
      `
      jobs = ["wash", "dry", "fold"]

      stack = []
      for job in jobs:
          stack.append(job)
      done = []
      while stack:
          done.append(stack.pop())
      print("Stack:", " ".join(done))

      queue = []
      for job in jobs:
          queue.append(job)
      done = []
      while queue:
          done.append(queue.pop(0))
      print("Queue:", " ".join(done))
      `,
      `
      const jobs = ["wash", "dry", "fold"];

      const stack = [];
      for (const job of jobs) {
        stack.push(job);
      }
      let done = [];
      while (stack.length > 0) {
        done.push(stack.pop());
      }
      console.log("Stack:", done.join(" "));

      const queue = [];
      for (const job of jobs) {
        queue.push(job);
      }
      done = [];
      while (queue.length > 0) {
        done.push(queue.shift());
      }
      console.log("Queue:", done.join(" "));
      `,
    ),
    investigate: [
      { question: 'Which structure is the browser Back button?', choices: ['A stack: the page you visited most recently comes back first', 'A queue: the first page you ever visited comes back first', 'Neither'], answer: 0 },
      { question: lang('Why do real programs use `collections.deque` instead of `list.pop(0)` for queues?', 'Why do real programs avoid `shift()` on long arrays for queues?'), choices: ['Removing from the front shifts every other item over: O(n) per removal', 'Lists cannot hold strings', 'It is purely a style preference'], answer: 0 },
    ],
    takeaway: 'A **stack** is "undo", "back", "call stack": the newest thing is handled first. A **queue** is "print queue", "waiting line": the oldest thing is handled first. Both are just a list plus a rule about which end you use, and the rule is what makes algorithms correct.',
  },
  {
    id: 'stacks-queues-2',
    conceptId: 'stacks-queues',
    title: 'Open and Shut',
    role: 'combine',
    game: 'bug-hunt',
    mode: 'guided',
    prompt: 'This checks whether brackets in a line are **balanced**, using a stack of the openers seen so far: `([]{})` → `balanced`, `(]` → `unbalanced`.\n\nIt gets those right, but says `balanced` for `((` and `[`, where openers are never closed. Something is missing after the loop. Fix it.',
    reinforces: ['collections', 'maps', 'loops', 'conditionals', 'strings', 'input'],
    hints: [
      'Every closer pops its opener. What is left on the stack after the loop if some opener was never closed?',
      'The loop can only *prove* a line is unbalanced. Being balanced also needs the stack to be **empty** at the end.',
      lang('Change the final line to print `balanced` only when `ok and not stack`.', 'Change the final line to print `balanced` only when `ok && stack.length === 0`.'),
    ],
    starterCode: code(
      `
      pairs = {")": "(", "]": "[", "}": "{"}

      line = input()
      stack = []
      ok = True
      for ch in line:
          if ch in "([{":
              stack.append(ch)
          elif ch in pairs:
              if not stack or stack.pop() != pairs[ch]:
                  ok = False
                  break
      print("balanced" if ok else "unbalanced")
      `,
      `
      const pairs = { ")": "(", "]": "[", "}": "{" };

      const line = prompt();
      const stack = [];
      let ok = true;
      for (const ch of line) {
        if ("([{".includes(ch)) {
          stack.push(ch);
        } else if (ch in pairs) {
          if (stack.length === 0 || stack.pop() !== pairs[ch]) {
            ok = false;
            break;
          }
        }
      }
      console.log(ok ? "balanced" : "unbalanced");
      `,
    ),
    solution: code(
      `
      pairs = {")": "(", "]": "[", "}": "{"}

      line = input()
      stack = []
      ok = True
      for ch in line:
          if ch in "([{":
              stack.append(ch)
          elif ch in pairs:
              if not stack or stack.pop() != pairs[ch]:
                  ok = False
                  break
      print("balanced" if ok and not stack else "unbalanced")
      `,
      `
      const pairs = { ")": "(", "]": "[", "}": "{" };

      const line = prompt();
      const stack = [];
      let ok = true;
      for (const ch of line) {
        if ("([{".includes(ch)) {
          stack.push(ch);
        } else if (ch in pairs) {
          if (stack.length === 0 || stack.pop() !== pairs[ch]) {
            ok = false;
            break;
          }
        }
      }
      console.log(ok && stack.length === 0 ? "balanced" : "unbalanced");
      `,
    ),
    tests: [
      { name: 'never closed', input: '((', expectedOutput: 'unbalanced' },
      { name: 'balanced with text', input: 'f(a[0], {b: 1})', expectedOutput: 'balanced' },
      { name: 'wrong closer', input: '(]', expectedOutput: 'unbalanced', hidden: true },
      { name: 'one opener', input: 'x[', expectedOutput: 'unbalanced', hidden: true },
      { name: 'closer first', input: ')(', expectedOutput: 'unbalanced', hidden: true },
    ],
    takeaway: 'Bracket matching is the classic stack problem, and the classic bug is forgetting the **end condition**: everything pushed must also have been popped. Your editor, your compiler and the JSON parser in every browser all run this exact loop.',
  },
  {
    id: 'stacks-queues-3',
    conceptId: 'stacks-queues',
    title: 'Ticket Line',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: `Run a help-desk line. Read commands until \`done\`:\n\n- \`join NAME\`: NAME goes to the **back** of the line\n- \`serve\`: the person at the **front** is served → \`Serving Ada\` (or \`Nobody waiting\`)\n- \`undo\`: the most recently served person is put back at the **front** → \`Ada is back\` (or \`Nothing to undo\`)\n- \`line\`: → \`Line: Bo, Cy\` (or \`Line: empty\`)\n\nUse a list as the **queue** for the line and a second list as the **stack** of people served, so that \`undo\` always returns the most recent one.`,
    reinforces: ['collections', 'while-loops', 'conditionals', 'else-if-chains', 'strings', 'input', 'string-formatting'],
    hints: [
      lang('`join`: `waiting.append(name)`. `serve`: if the line is not empty, `name = waiting.pop(0)`, push it on `served`, print.', '`join`: `waiting.push(name)`. `serve`: if the line is not empty, `const name = waiting.shift()`, push it on `served`, print.'),
      lang('`undo`: if `served` is not empty, `name = served.pop()` and `waiting.insert(0, name)`.', '`undo`: if `served` is not empty, `const name = served.pop()` and `waiting.unshift(name)`.'),
      lang('`line`: `", ".join(waiting)` when it has people, else `empty`.', '`line`: `waiting.join(", ")` when it has people, else `empty`.'),
    ],
    starterCode: code(
      `
      waiting = []
      served = []
      # Read commands until "done": join NAME, serve, undo, line.
      `,
      `
      const waiting = [];
      const served = [];
      // Read commands until "done": join NAME, serve, undo, line.
      `,
    ),
    solution: code(
      `
      waiting = []
      served = []
      while True:
          command = input()
          if command == "done":
              break
          parts = command.split()
          if parts[0] == "join":
              waiting.append(parts[1])
          elif parts[0] == "serve":
              if waiting:
                  name = waiting.pop(0)
                  served.append(name)
                  print(f"Serving {name}")
              else:
                  print("Nobody waiting")
          elif parts[0] == "undo":
              if served:
                  name = served.pop()
                  waiting.insert(0, name)
                  print(f"{name} is back")
              else:
                  print("Nothing to undo")
          elif parts[0] == "line":
              if waiting:
                  print("Line: " + ", ".join(waiting))
              else:
                  print("Line: empty")
      `,
      `
      const waiting = [];
      const served = [];
      while (true) {
        const command = prompt();
        if (command === "done") {
          break;
        }
        const parts = command.split(" ");
        if (parts[0] === "join") {
          waiting.push(parts[1]);
        } else if (parts[0] === "serve") {
          if (waiting.length > 0) {
            const name = waiting.shift();
            served.push(name);
            console.log(\`Serving \${name}\`);
          } else {
            console.log("Nobody waiting");
          }
        } else if (parts[0] === "undo") {
          if (served.length > 0) {
            const name = served.pop();
            waiting.unshift(name);
            console.log(\`\${name} is back\`);
          } else {
            console.log("Nothing to undo");
          }
        } else if (parts[0] === "line") {
          if (waiting.length > 0) {
            console.log("Line: " + waiting.join(", "));
          } else {
            console.log("Line: empty");
          }
        }
      }
      `,
    ),
    tests: [
      { name: 'a busy morning', input: 'join Ada\njoin Bo\njoin Cy\nserve\nline\nundo\nline\ndone', expectedOutput: 'Serving Ada\nLine: Bo, Cy\nAda is back\nLine: Ada, Bo, Cy' },
      { name: 'empty cases', input: 'serve\nundo\nline\ndone', expectedOutput: 'Nobody waiting\nNothing to undo\nLine: empty' },
      { name: 'undo returns the most recent', input: 'join A\njoin B\nserve\nserve\nundo\nundo\nline\nundo\ndone', expectedOutput: 'Serving A\nServing B\nB is back\nA is back\nLine: A, B\nNothing to undo', hidden: true },
    ],
    takeaway: 'Real systems mix the two: a **queue** for fairness (first come, first served) and a **stack** for history (undo the latest thing first). Naming which list is which, and only ever touching the right end of each, is what keeps the logic obvious.',
  },
];
