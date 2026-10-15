import type { Level } from '@codegames/shared';
import { EVENT_RULE, html, js, page } from './shared';

/** dom-events levels (JavaScript only), in play order. */
export const domEventsLevels: Level[] = [
  {
    id: 'dom-events-1',
    conceptId: 'dom-events',
    title: 'Click Counter',
    role: 'intro',
    game: 'build-it',
    mode: 'guided',
    prompt:
      'So far your programs ran top to bottom and stopped. A page keeps living: it waits for the user. `button.addEventListener("click", someFunction)` tells the browser "when this is clicked, run this function".\n\nMake the counter work:\n\n- Clicking `#plus` adds one and shows `Clicks: N` in `#count`.\n- Clicking `#reset` sets it back to `0` and shows `Clicks: 0`.\n\nThe tests click the buttons for you after your program has run, then read the page.',
    reinforces: ['variables', 'functions', 'scope'],
    hints: [
      'The second argument of `addEventListener` is a function: `() => { ... }`. Don\'t call it yourself; the browser does when the click happens.',
      'Both handlers change the same `clicks` variable declared outside them (`let`, not `const`), then rewrite `count.textContent`.',
      '`document.getElementById("plus").addEventListener("click", () => { clicks = clicks + 1; count.textContent = "Clicks: " + clicks; });`',
    ],
    page: html(`
      <p id="count">Clicks: 0</p>
      <button id="plus">+1</button>
      <button id="reset">Reset</button>
    `),
    starterCode: js(`
      let clicks = 0;
      const count = document.getElementById("count");

      // When #plus is clicked: add one and show "Clicks: N".
      // When #reset is clicked: back to 0 and show "Clicks: 0".
    `),
    solution: js(`
      let clicks = 0;
      const count = document.getElementById("count");

      document.getElementById("plus").addEventListener("click", () => {
        clicks = clicks + 1;
        count.textContent = "Clicks: " + clicks;
      });

      document.getElementById("reset").addEventListener("click", () => {
        clicks = 0;
        count.textContent = "Clicks: 0";
      });
    `),
    requirements: { javascript: [EVENT_RULE] },
    tests: [
      {
        name: 'three clicks on +1',
        harness: page(`
          document.getElementById("plus").click();
          document.getElementById("plus").click();
          document.getElementById("plus").click();
        `),
        expectedOutput: '<p id="count">Clicks: 3</p>\n<button id="plus">+1</button>\n<button id="reset">Reset</button>',
      },
      {
        name: 'reset, then one more',
        harness: page(`
          document.getElementById("plus").click();
          document.getElementById("plus").click();
          document.getElementById("reset").click();
          document.getElementById("plus").click();
        `),
        expectedOutput: '<p id="count">Clicks: 1</p>\n<button id="plus">+1</button>\n<button id="reset">Reset</button>',
      },
      {
        name: 'nothing clicked yet',
        hidden: true,
        harness: page(''),
        expectedOutput: '<p id="count">Clicks: 0</p>\n<button id="plus">+1</button>\n<button id="reset">Reset</button>',
      },
    ],
    play: { intro: 'Click the buttons on your page.', renderer: 'page' },
    takeaway:
      'This is **event-driven** programming: your program sets up handlers and then waits; the browser calls them when things happen. The handler functions share `clicks` through scope, so the count survives between clicks. Almost every app you use (phone apps, games, editors) is built this way: a loop of "wait for an event, run its handler, redraw".',
  },
  {
    id: 'dom-events-2',
    conceptId: 'dom-events',
    title: 'Live Greeting',
    role: 'combine',
    game: 'bug-hunt',
    mode: 'guided',
    prompt:
      'Typing a name in `#who` should update `#hello` to `Hello, <name>` as you type (`Hello, stranger` while the box is blank, spaces trimmed). Clicking `#shout` should turn the greeting into capitals.\n\nThe program crashes before anything works, and after you fix that the greeting never changes. Two bugs. Find both.',
    reinforces: ['functions', 'strings', 'conditionals'],
    hints: [
      'Read the error: `addEventListener` was given something that isn\'t a function. `greet()` *calls* `greet` right now and passes along what it returned. Pass `greet` itself.',
      'What is typed into an `<input>` lives in `.value`, not `.textContent`. Inputs have no text inside them.',
      'With `who.addEventListener("input", greet);` and `const name = who.value.trim();` everything works.',
    ],
    page: html(`
      <input id="who" placeholder="Your name">
      <p id="hello">Hello, stranger</p>
      <button id="shout">SHOUT</button>
    `),
    starterCode: js(`
      const who = document.getElementById("who");
      const hello = document.getElementById("hello");

      function greet() {
        const name = who.textContent.trim();
        if (name === "") {
          hello.textContent = "Hello, stranger";
        } else {
          hello.textContent = "Hello, " + name;
        }
      }

      who.addEventListener("input", greet());
      document.getElementById("shout").addEventListener("click", () => {
        hello.textContent = hello.textContent.toUpperCase();
      });
    `),
    solution: js(`
      const who = document.getElementById("who");
      const hello = document.getElementById("hello");

      function greet() {
        const name = who.value.trim();
        if (name === "") {
          hello.textContent = "Hello, stranger";
        } else {
          hello.textContent = "Hello, " + name;
        }
      }

      who.addEventListener("input", greet);
      document.getElementById("shout").addEventListener("click", () => {
        hello.textContent = hello.textContent.toUpperCase();
      });
    `),
    tests: [
      {
        name: 'typing a name',
        harness: page(`
          const who = document.getElementById("who");
          who.value = "Ada";
          who.dispatchEvent(new Event("input"));
        `),
        expectedOutput: '<input id="who" placeholder="Your name" value="Ada">\n<p id="hello">Hello, Ada</p>\n<button id="shout">SHOUT</button>',
      },
      {
        name: 'spaces are trimmed, then shout',
        harness: page(`
          const who = document.getElementById("who");
          who.value = "  bob ";
          who.dispatchEvent(new Event("input"));
          document.getElementById("shout").click();
        `),
        expectedOutput: '<input id="who" placeholder="Your name" value="  bob ">\n<p id="hello">HELLO, BOB</p>\n<button id="shout">SHOUT</button>',
      },
      {
        name: 'clearing the box brings back stranger',
        hidden: true,
        harness: page(`
          const who = document.getElementById("who");
          who.value = "Zed";
          who.dispatchEvent(new Event("input"));
          who.value = "";
          who.dispatchEvent(new Event("input"));
        `),
        expectedOutput: '<input id="who" placeholder="Your name" value="">\n<p id="hello">Hello, stranger</p>\n<button id="shout">SHOUT</button>',
      },
    ],
    play: { intro: 'Type in the box, then press SHOUT.', renderer: 'page' },
  },
  {
    id: 'dom-events-3',
    conceptId: 'dom-events',
    title: 'Color Picker',
    role: 'integrate',
    game: 'build-it',
    mode: 'freeform',
    prompt:
      'Three buttons live inside `#colors`, each with a `data-color` attribute. Use **one** listener on `#colors` instead of one per button: when the user clicks inside it, `event.target` is the button they hit, and `event.target.dataset.color` reads its `data-color`.\n\nOn each click:\n\n- Set `#picked` to `Picked: <color>`.\n- Give the clicked button the class `active` and remove `active` from the other buttons.\n- Remember every pick in an array and show the **last three** in `#history`, joined with `, `.\n\nIgnore clicks where `dataset.color` is missing (for example on the gaps between buttons).',
    reinforces: ['collections', 'iterating-collections', 'functions', 'conditionals', 'maps'],
    hints: [
      'A handler receives the event: `(event) => { const button = event.target; ... }`.',
      '`document.querySelectorAll("#colors button")` gives all three buttons; loop over them with `classList.remove("active")` before adding it to the clicked one.',
      '`picks.push(color)` then `picks.slice(-3).join(", ")` shows the last three.',
      'The requirement forbids a second `addEventListener`: one listener on the parent handles every button. That is called **event delegation**.',
    ],
    page: html(`
      <div id="colors">
        <button data-color="red">Red</button>
        <button data-color="green">Green</button>
        <button data-color="blue">Blue</button>
      </div>
      <p id="picked">Picked: none</p>
      <p id="history"></p>
    `),
    starterCode: js(`
      const picked = document.getElementById("picked");
      const history = document.getElementById("history");
      const picks = [];

    `),
    solution: js(`
      const picked = document.getElementById("picked");
      const history = document.getElementById("history");
      const picks = [];

      document.getElementById("colors").addEventListener("click", (event) => {
        const button = event.target;
        const color = button.dataset.color;
        if (!color) {
          return;
        }
        for (const other of document.querySelectorAll("#colors button")) {
          other.classList.remove("active");
        }
        button.classList.add("active");
        picked.textContent = "Picked: " + color;
        picks.push(color);
        history.textContent = picks.slice(-3).join(", ");
      });
    `),
    requirements: {
      javascript: [
        EVENT_RULE,
        { pattern: 'addEventListener[\\s\\S]*addEventListener', forbid: true, message: 'Use a single listener on #colors and read event.target, instead of one listener per button.' },
      ],
    },
    tests: [
      {
        name: 'one pick',
        harness: page(`
          document.querySelectorAll("#colors button")[0].click();
        `),
        expectedOutput:
          '<div id="colors">\n  <button class="active" data-color="red">Red</button>\n  <button data-color="green">Green</button>\n  <button data-color="blue">Blue</button>\n</div>\n<p id="picked">Picked: red</p>\n<p id="history">red</p>',
      },
      {
        name: 'four picks keep the last three',
        harness: page(`
          const buttons = document.querySelectorAll("#colors button");
          buttons[0].click();
          buttons[2].click();
          buttons[1].click();
          buttons[2].click();
        `),
        expectedOutput:
          '<div id="colors">\n  <button data-color="red">Red</button>\n  <button data-color="green">Green</button>\n  <button class="active" data-color="blue">Blue</button>\n</div>\n<p id="picked">Picked: blue</p>\n<p id="history">blue, green, blue</p>',
      },
      {
        name: 'clicking the container itself does nothing',
        hidden: true,
        harness: page(`
          const buttons = document.querySelectorAll("#colors button");
          buttons[1].click();
          document.getElementById("colors").click();
          buttons[1].click();
        `),
        expectedOutput:
          '<div id="colors">\n  <button data-color="red">Red</button>\n  <button class="active" data-color="green">Green</button>\n  <button data-color="blue">Blue</button>\n</div>\n<p id="picked">Picked: green</p>\n<p id="history">green, green</p>',
      },
    ],
    play: { intro: 'Click the colour buttons.', renderer: 'page' },
  },
];
