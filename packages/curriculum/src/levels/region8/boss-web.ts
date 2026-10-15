import type { Level } from '@codegames/shared';
import { CREATE_RULE, EVENT_RULE, NO_HTML_STRINGS, PREVENT_RULE, html, js, page } from './shared';

const FORM_OUTLINE = '<form id="new-task">\n  <input id="task-text" placeholder="What needs doing?" value="">\n  <button>Add</button>\n</form>';
const FILTERS = (active: 'all' | 'open' | 'done') =>
  ['all', 'open', 'done']
    .map((f) => `  <button${f === active ? ' class="active"' : ''} data-filter="${f}">${f[0]!.toUpperCase()}${f.slice(1)}</button>`)
    .join('\n');
const filters = (active: 'all' | 'open' | 'done') => `<div id="filters">\n${FILTERS(active)}\n</div>`;
const task = (text: string, done: boolean) =>
  `  <li class="task${done ? ' done' : ''}">\n    <input${done ? ' checked' : ''} type="checkbox">\n    <span>${text}</span>\n    <button class="delete">Delete</button>\n  </li>`;
const board = (active: 'all' | 'open' | 'done', tasks: [string, boolean][], summary: string) =>
  [FORM_OUTLINE, filters(active), tasks.length ? `<ul id="tasks">\n${tasks.map(([t, d]) => task(t, d)).join('\n')}\n</ul>` : '<ul id="tasks"></ul>', `<p id="summary">${summary}</p>`].join('\n');

/** Adds tasks through the form, the way a user would. */
const add = (...texts: string[]) =>
  texts.map((t) => `document.getElementById("task-text").value = ${JSON.stringify(t)};\ndocument.querySelector("#new-task button").click();`).join('\n');

/** Boss: Task Board (JavaScript only). */
export const bossWebLevels: Level[] = [
  {
    id: 'boss-web',
    conceptId: 'boss-web',
    title: 'Boss: Task Board',
    role: 'boss',
    game: 'build-it',
    mode: 'freeform',
    prompt:
      'Build a working task board. Keep the tasks in an array of objects (`{ text, done }`) and a `filter` variable (`"all"`, `"open"` or `"done"`), and write one `draw()` function that rebuilds `#tasks` from them. Call `draw()` once at the end and after every change.\n\n**Adding.** Submitting `#new-task` (prevent the reload) adds the trimmed `#task-text` as an open task, then sets the box\'s value to `""`. Blank text adds nothing.\n\n**Drawing.** For each task that passes the filter (`open` = not done, `done` = done), append `<li class="task">` (or `class="task done"` when done) containing, in order: an `<input>` with `type` `checkbox` (checked when done), a `<span>` with the text, and `<button class="delete">Delete</button>`. Ticking the checkbox (its `change` event) flips `done`; Delete removes the task. Both redraw.\n\n**Filtering.** One listener on `#filters`: clicking a button sets `filter` from its `data-filter`, moves the class `active` to it, and redraws.\n\n**Summary.** `#summary` always counts every task, filtered or not: `N tasks, K done`.',
    reinforces: ['dom-elements', 'dom-events', 'dom-lists', 'dom-forms', 'collections', 'functions', 'conditionals', 'nested-data', 'booleans'],
    hints: [
      'Start with adding and drawing, with the filter fixed at `"all"`. Then make the checkbox and Delete work, then the filter buttons.',
      'Each task object is shared between the array and its row\'s listeners, so a checkbox handler can simply do `task.done = !task.done; draw();`.',
      'A checkbox is `document.createElement("input")` with `box.type = "checkbox"` and `box.checked = task.done`.',
      'Deleting: `tasks.splice(tasks.indexOf(task), 1); draw();`',
      'For the filter buttons, loop over `filters.children` removing `active`, then add it to `event.target`. Ignore clicks where `event.target.dataset.filter` is missing.',
    ],
    page: html(`
      <form id="new-task">
        <input id="task-text" placeholder="What needs doing?">
        <button>Add</button>
      </form>
      <div id="filters">
        <button data-filter="all" class="active">All</button>
        <button data-filter="open">Open</button>
        <button data-filter="done">Done</button>
      </div>
      <ul id="tasks"></ul>
      <p id="summary">0 tasks, 0 done</p>
    `),
    starterCode: js(`
      const tasks = [];
      let filter = "all";

      const form = document.getElementById("new-task");
      const input = document.getElementById("task-text");
      const list = document.getElementById("tasks");
      const summary = document.getElementById("summary");
      const filters = document.getElementById("filters");

      function draw() {

      }

      draw();
    `),
    solution: js(`
      const tasks = [];
      let filter = "all";

      const form = document.getElementById("new-task");
      const input = document.getElementById("task-text");
      const list = document.getElementById("tasks");
      const summary = document.getElementById("summary");
      const filters = document.getElementById("filters");

      function shows(task) {
        if (filter === "all") {
          return true;
        }
        if (filter === "done") {
          return task.done;
        }
        return !task.done;
      }

      function draw() {
        list.replaceChildren();
        let done = 0;
        for (const task of tasks) {
          if (task.done) {
            done = done + 1;
          }
          if (!shows(task)) {
            continue;
          }
          const li = document.createElement("li");
          li.className = "task";
          if (task.done) {
            li.className = "task done";
          }

          const box = document.createElement("input");
          box.type = "checkbox";
          box.checked = task.done;
          box.addEventListener("change", () => {
            task.done = !task.done;
            draw();
          });

          const label = document.createElement("span");
          label.textContent = task.text;

          const remove = document.createElement("button");
          remove.className = "delete";
          remove.textContent = "Delete";
          remove.addEventListener("click", () => {
            tasks.splice(tasks.indexOf(task), 1);
            draw();
          });

          li.appendChild(box);
          li.appendChild(label);
          li.appendChild(remove);
          list.appendChild(li);
        }
        summary.textContent = tasks.length + " tasks, " + done + " done";
      }

      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const text = input.value.trim();
        if (text !== "") {
          tasks.push({ text: text, done: false });
        }
        input.value = "";
        draw();
      });

      filters.addEventListener("click", (event) => {
        const choice = event.target.dataset.filter;
        if (!choice) {
          return;
        }
        filter = choice;
        for (const button of filters.children) {
          button.classList.remove("active");
        }
        event.target.classList.add("active");
        draw();
      });

      draw();
    `),
    requirements: { javascript: [PREVENT_RULE, EVENT_RULE, CREATE_RULE, NO_HTML_STRINGS] },
    tests: [
      {
        name: 'two tasks added, a blank one ignored',
        phase: 'Add',
        harness: page(`${add('Buy milk', 'Walk dog', '   ')}\n`),
        expectedOutput: board('all', [['Buy milk', false], ['Walk dog', false]], '2 tasks, 0 done'),
      },
      {
        name: 'ticking a task',
        phase: 'Finish',
        harness: page(`${add('Buy milk', 'Walk dog')}\ndocument.querySelector("#tasks input").click();\n`),
        expectedOutput: board('all', [['Buy milk', true], ['Walk dog', false]], '2 tasks, 1 done'),
      },
      {
        name: 'un-ticking a task',
        phase: 'Finish',
        hidden: true,
        harness: page(`${add('Buy milk', 'Walk dog')}\ndocument.querySelectorAll("#tasks input")[1].click();\ndocument.querySelectorAll("#tasks input")[1].click();\n`),
        expectedOutput: board('all', [['Buy milk', false], ['Walk dog', false]], '2 tasks, 0 done'),
      },
      {
        name: 'only finished tasks',
        phase: 'Filter',
        harness: page(`${add('Buy milk', 'Walk dog', 'Read')}\ndocument.querySelectorAll("#tasks input")[1].click();\ndocument.querySelectorAll("#filters button")[2].click();\n`),
        expectedOutput: board('done', [['Walk dog', true]], '3 tasks, 1 done'),
      },
      {
        name: 'finishing a task while viewing open ones',
        phase: 'Filter',
        hidden: true,
        harness: page(
          `${add('Buy milk', 'Walk dog', 'Read')}\ndocument.querySelectorAll("#tasks input")[1].click();\ndocument.querySelectorAll("#filters button")[1].click();\ndocument.querySelectorAll("#tasks input")[1].click();\n`,
        ),
        expectedOutput: board('open', [['Buy milk', false]], '3 tasks, 2 done'),
      },
      {
        name: 'deleting, then adding more',
        phase: 'Delete',
        harness: page(`${add('Buy milk', 'Walk dog')}\ndocument.querySelector("#tasks .delete").click();\n${add('Read')}\n`),
        expectedOutput: board('all', [['Walk dog', false], ['Read', false]], '2 tasks, 0 done'),
      },
      {
        name: 'deleting a finished task from the done view',
        phase: 'Delete',
        hidden: true,
        harness: page(
          `${add('Buy milk', 'Walk dog', 'Read')}\ndocument.querySelectorAll("#tasks input")[0].click();\ndocument.querySelectorAll("#tasks input")[2].click();\ndocument.querySelectorAll("#filters button")[2].click();\ndocument.querySelector("#tasks .delete").click();\n`,
        ),
        expectedOutput: board('done', [['Read', true]], '2 tasks, 1 done'),
      },
    ],
    play: { intro: 'Your task board. Add tasks, tick them off, filter and delete.', renderer: 'page' },
    takeaway:
      'You just built the shape of every web app: **state** (the array and the filter), a **render** function that redraws the page from the state, and **event handlers** that change the state and call render. React, Vue and friends are this loop with the redraw made automatic and fast. The Web Pages side quest is done: the JavaScript you learned on the world map drives real pages the same way.',
  },
];
