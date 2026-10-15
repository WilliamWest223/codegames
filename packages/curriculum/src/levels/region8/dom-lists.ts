import type { Level } from '@codegames/shared';
import { CREATE_RULE, SHOW_PAGE, html, js, page } from './shared';

/** dom-lists levels (JavaScript only), in play order. */
export const domListsLevels: Level[] = [
  {
    id: 'dom-lists-1',
    conceptId: 'dom-lists',
    title: 'Shopping List',
    role: 'intro',
    game: 'build-it',
    mode: 'guided',
    prompt:
      'Pages are drawn **from data**: you keep an array, and build one element per item.\n\nRead one line of comma-separated items (trim the spaces around each). For every item, create an `<li>` with that text and append it to `#items`. Then set `#total` to `Items: N`.',
    reinforces: ['loops', 'collections', 'strings'],
    hints: [
      '`prompt("Items?").split(",")` gives an array of strings, spaces included.',
      'Inside the loop: `const li = document.createElement("li"); li.textContent = item.trim(); list.appendChild(li);`',
      '`items.length` is the count for `#total`.',
    ],
    page: html(`
      <h2>Shopping</h2>
      <ul id="items"></ul>
      <p id="total">Items: 0</p>
    `),
    starterCode: js(`
      const items = prompt("Items?").split(",");
      const list = document.getElementById("items");

    `),
    solution: js(`
      const items = prompt("Items?").split(",");
      const list = document.getElementById("items");

      for (const item of items) {
        const li = document.createElement("li");
        li.textContent = item.trim();
        list.appendChild(li);
      }
      document.getElementById("total").textContent = "Items: " + items.length;
    `),
    requirements: { javascript: [CREATE_RULE] },
    tests: [
      {
        name: 'three items',
        input: 'milk, eggs, bread\n',
        harness: SHOW_PAGE,
        expectedOutput: '<h2>Shopping</h2>\n<ul id="items">\n  <li>milk</li>\n  <li>eggs</li>\n  <li>bread</li>\n</ul>\n<p id="total">Items: 3</p>',
      },
      {
        name: 'one item',
        input: 'tea\n',
        harness: SHOW_PAGE,
        expectedOutput: '<h2>Shopping</h2>\n<ul id="items">\n  <li>tea</li>\n</ul>\n<p id="total">Items: 1</p>',
      },
      {
        name: 'four items',
        input: 'a, b,c ,  d\n',
        hidden: true,
        harness: SHOW_PAGE,
        expectedOutput: '<h2>Shopping</h2>\n<ul id="items">\n  <li>a</li>\n  <li>b</li>\n  <li>c</li>\n  <li>d</li>\n</ul>\n<p id="total">Items: 4</p>',
      },
    ],
    play: { intro: 'Type a comma-separated list and see it drawn.', renderer: 'page' },
    takeaway:
      'The loop is the whole trick: **data in an array, one element per item**. When the data changes, you run the same loop again rather than editing elements one by one. Frameworks like React automate exactly this idea (they call it rendering), but underneath it is `createElement` in a loop.',
  },
  {
    id: 'dom-lists-2',
    conceptId: 'dom-lists',
    title: 'Redraw Bug',
    role: 'combine',
    game: 'bug-hunt',
    mode: 'guided',
    prompt:
      'This to-do page keeps its tasks in an array and has one `draw()` function that rebuilds the list from it. Clicking `#add` should add `Task 1`, then `Task 2`, and so on, and `#left` should show `Left: N`.\n\nClick **Add** a couple of times in Play it: the list doubles up and every new task has the same name. Two bugs.',
    reinforces: ['functions', 'collections', 'loops'],
    hints: [
      '`draw()` appends every task again on top of what is already there. Empty the list first: `list.replaceChildren();` (or `list.innerHTML = "";`).',
      'The task number never grows because nothing changes `next` after a task is added.',
      'Add `next = next + 1;` after the `push` and clear the list at the top of `draw()`.',
    ],
    page: html(`
      <ul id="todo"></ul>
      <button id="add">Add</button>
      <p id="left">Left: 0</p>
    `),
    starterCode: js(`
      const tasks = ["Water plants"];
      const list = document.getElementById("todo");
      const left = document.getElementById("left");
      let next = 1;

      function draw() {
        for (const task of tasks) {
          const li = document.createElement("li");
          li.textContent = task;
          list.appendChild(li);
        }
        left.textContent = "Left: " + tasks.length;
      }

      document.getElementById("add").addEventListener("click", () => {
        tasks.push("Task " + next);
        draw();
      });

      draw();
    `),
    solution: js(`
      const tasks = ["Water plants"];
      const list = document.getElementById("todo");
      const left = document.getElementById("left");
      let next = 1;

      function draw() {
        list.replaceChildren();
        for (const task of tasks) {
          const li = document.createElement("li");
          li.textContent = task;
          list.appendChild(li);
        }
        left.textContent = "Left: " + tasks.length;
      }

      document.getElementById("add").addEventListener("click", () => {
        tasks.push("Task " + next);
        next = next + 1;
        draw();
      });

      draw();
    `),
    tests: [
      {
        name: 'two adds',
        harness: page(`
          document.getElementById("add").click();
          document.getElementById("add").click();
        `),
        expectedOutput: '<ul id="todo">\n  <li>Water plants</li>\n  <li>Task 1</li>\n  <li>Task 2</li>\n</ul>\n<button id="add">Add</button>\n<p id="left">Left: 3</p>',
      },
      {
        name: 'the first draw',
        harness: page(''),
        expectedOutput: '<ul id="todo">\n  <li>Water plants</li>\n</ul>\n<button id="add">Add</button>\n<p id="left">Left: 1</p>',
      },
      {
        name: 'three adds',
        hidden: true,
        harness: page(`
          document.getElementById("add").click();
          document.getElementById("add").click();
          document.getElementById("add").click();
        `),
        expectedOutput: '<ul id="todo">\n  <li>Water plants</li>\n  <li>Task 1</li>\n  <li>Task 2</li>\n  <li>Task 3</li>\n</ul>\n<button id="add">Add</button>\n<p id="left">Left: 4</p>',
      },
    ],
    play: { intro: 'Press Add a few times.', renderer: 'page' },
  },
  {
    id: 'dom-lists-3',
    conceptId: 'dom-lists',
    title: 'Searchable Roster',
    role: 'integrate',
    game: 'build-it',
    mode: 'freeform',
    prompt:
      'Read one line of comma-separated names (trim each). Write a `draw()` function and call it once at the end; call it again whenever anything changes.\n\n`draw()` clears `#people` and, for every name that contains the text in `#search` (case-insensitive; an empty search matches everyone), appends an `<li>` holding a `<span>` with the name and a `<button class="remove">Remove</button>`. Clicking a Remove button deletes that name from the array and redraws. Typing in `#search` (the `input` event) redraws.\n\n`#shown` reads `Showing K of N`: K names drawn, N names in the array.',
    reinforces: ['input', 'functions', 'collections', 'strings', 'loop-control', 'conditionals', 'iterating-collections'],
    hints: [
      'Lower-case both sides before `includes`: `name.toLowerCase().includes(search.value.toLowerCase())`.',
      'Each Remove button gets its own listener inside the loop; it can use the loop\'s `name`: `people.splice(people.indexOf(name), 1); draw();`',
      '`search.addEventListener("input", draw);` then `draw();` at the very end.',
      'Count the drawn names in a variable while looping so `#shown` can report `K of N`.',
    ],
    page: html(`
      <input id="search" placeholder="Search">
      <ul id="people"></ul>
      <p id="shown">Showing 0 of 0</p>
    `),
    starterCode: js(`
      const people = prompt("Names?").split(",");
      for (let i = 0; i < people.length; i++) {
        people[i] = people[i].trim();
      }
      const list = document.getElementById("people");
      const search = document.getElementById("search");
      const shown = document.getElementById("shown");

      function draw() {

      }

      draw();
    `),
    solution: js(`
      const people = prompt("Names?").split(",");
      for (let i = 0; i < people.length; i++) {
        people[i] = people[i].trim();
      }
      const list = document.getElementById("people");
      const search = document.getElementById("search");
      const shown = document.getElementById("shown");

      function draw() {
        list.replaceChildren();
        const query = search.value.toLowerCase();
        let count = 0;
        for (const name of people) {
          if (!name.toLowerCase().includes(query)) {
            continue;
          }
          count = count + 1;
          const li = document.createElement("li");
          const label = document.createElement("span");
          label.textContent = name;
          const remove = document.createElement("button");
          remove.className = "remove";
          remove.textContent = "Remove";
          remove.addEventListener("click", () => {
            people.splice(people.indexOf(name), 1);
            draw();
          });
          li.appendChild(label);
          li.appendChild(remove);
          list.appendChild(li);
        }
        shown.textContent = "Showing " + count + " of " + people.length;
      }

      search.addEventListener("input", draw);
      draw();
    `),
    requirements: { javascript: [CREATE_RULE] },
    tests: [
      {
        name: 'everyone at the start',
        input: 'Ada, Grace, Alan\n',
        harness: SHOW_PAGE,
        expectedOutput:
          '<input id="search" placeholder="Search">\n<ul id="people">\n  <li>\n    <span>Ada</span>\n    <button class="remove">Remove</button>\n  </li>\n  <li>\n    <span>Grace</span>\n    <button class="remove">Remove</button>\n  </li>\n  <li>\n    <span>Alan</span>\n    <button class="remove">Remove</button>\n  </li>\n</ul>\n<p id="shown">Showing 3 of 3</p>',
      },
      {
        name: 'searching narrows the list',
        input: 'Ada, Grace, Alan\n',
        harness: page(`
          const search = document.getElementById("search");
          search.value = "gr";
          search.dispatchEvent(new Event("input"));
        `),
        expectedOutput:
          '<input id="search" placeholder="Search" value="gr">\n<ul id="people">\n  <li>\n    <span>Grace</span>\n    <button class="remove">Remove</button>\n  </li>\n</ul>\n<p id="shown">Showing 1 of 3</p>',
      },
      {
        name: 'remove, then a capital-letter search',
        input: 'Ada, Grace, Alan\n',
        hidden: true,
        harness: page(`
          document.querySelectorAll(".remove")[1].click();
          const search = document.getElementById("search");
          search.value = "A";
          search.dispatchEvent(new Event("input"));
        `),
        expectedOutput:
          '<input id="search" placeholder="Search" value="A">\n<ul id="people">\n  <li>\n    <span>Ada</span>\n    <button class="remove">Remove</button>\n  </li>\n  <li>\n    <span>Alan</span>\n    <button class="remove">Remove</button>\n  </li>\n</ul>\n<p id="shown">Showing 2 of 2</p>',
      },
    ],
    play: { intro: 'Enter some names, then search and remove.', renderer: 'page' },
  },
];
