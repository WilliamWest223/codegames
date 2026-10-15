import type { Level } from '@codegames/shared';
import { CREATE_RULE, SHOW_PAGE, html, js } from './shared';

/** dom-elements levels (JavaScript only), in play order. */
export const domElementsLevels: Level[] = [
  {
    id: 'dom-elements-1',
    conceptId: 'dom-elements',
    title: 'Change the Page',
    role: 'intro',
    game: 'build-it',
    mode: 'fill-blanks',
    prompt:
      'A web page is a tree of **elements**, and JavaScript can reach any of them. `document.getElementById("title")` finds the element whose `id` is `title`; setting its `textContent` changes what the page shows.\n\nThe first two lines already rename the heading. Fill in the blanks so the paragraph with id `greeting` says `Hello, world!`.\n\nPress **Run** to see the page as an outline, exactly as the tests do.',
    reinforces: ['variables', 'methods'],
    hints: [
      'The two blanks follow the same pattern as the heading lines above them.',
      '`getElementById` wants the id as a string: `"greeting"`, with the quotes.',
      '`greeting.textContent = "Hello, world!";` replaces whatever text the paragraph had.',
    ],
    page: html(`
      <h1 id="title">My Page</h1>
      <p id="greeting">...</p>
    `),
    starterCode: js(`
      const title = document.getElementById("title");
      title.textContent = "Robot Diary";

      const greeting = document.getElementById(___);
      greeting.textContent = ___;
    `),
    solution: js(`
      const title = document.getElementById("title");
      title.textContent = "Robot Diary";

      const greeting = document.getElementById("greeting");
      greeting.textContent = "Hello, world!";
    `),
    tests: [
      {
        name: 'the heading and the greeting change',
        harness: SHOW_PAGE,
        expectedOutput: '<h1 id="title">Robot Diary</h1>\n<p id="greeting">Hello, world!</p>',
      },
    ],
    play: { intro: 'Your page, drawn from the outline. Nothing to click yet; that comes next level.', renderer: 'page' },
    takeaway:
      'The browser turns HTML into a tree of element objects (the **DOM**) and hands it to JavaScript as `document`. `getElementById` finds one node; `textContent` reads or replaces its text. Everything on the web that reacts to you (menus, feeds, games) is JavaScript changing this tree. The outline you see is how CodeGames shows that tree; a browser would draw it as a page.',
  },
  {
    id: 'dom-elements-2',
    conceptId: 'dom-elements',
    title: 'Scoreboard',
    role: 'combine',
    game: 'build-it',
    mode: 'guided',
    prompt:
      'Read two whole numbers from the user: the red score, then the blue score. Then update the page:\n\n1. Set the `#red` paragraph to `Red: N` and `#blue` to `Blue: N`.\n2. Add the class `leader` to the paragraph of whichever team is ahead (keep its `score` class). On a tie, neither gets it.\n3. Set `#status` to `Red leads`, `Blue leads` or `Tie`.\n\nUse `element.classList.add("leader")` to add a class without losing the ones already there.',
    reinforces: ['input', 'type-conversion', 'conditionals', 'string-formatting'],
    hints: [
      '`prompt()` gives text; wrap it in `Number(...)` before comparing scores.',
      'Join text and a number with `+`: `"Red: " + red`.',
      'An `if / else if / else` chain covers the three cases. `classList.add` goes inside the two winning branches.',
    ],
    page: html(`
      <h2>Scoreboard</h2>
      <p class="score" id="red">Red: 0</p>
      <p class="score" id="blue">Blue: 0</p>
      <p id="status">Waiting</p>
    `),
    starterCode: js(`
      const red = Number(prompt("Red score?"));
      const blue = Number(prompt("Blue score?"));

      // 1. Show the scores in the two paragraphs.
      // 2. Add the class "leader" to the winning paragraph.
      // 3. Set #status to "Red leads", "Blue leads" or "Tie".
    `),
    solution: js(`
      const red = Number(prompt("Red score?"));
      const blue = Number(prompt("Blue score?"));

      const redBox = document.getElementById("red");
      const blueBox = document.getElementById("blue");
      redBox.textContent = "Red: " + red;
      blueBox.textContent = "Blue: " + blue;

      const status = document.getElementById("status");
      if (red > blue) {
        redBox.classList.add("leader");
        status.textContent = "Red leads";
      } else if (blue > red) {
        blueBox.classList.add("leader");
        status.textContent = "Blue leads";
      } else {
        status.textContent = "Tie";
      }
    `),
    tests: [
      {
        name: 'red leads',
        input: '3\n1\n',
        harness: SHOW_PAGE,
        expectedOutput: '<h2>Scoreboard</h2>\n<p id="red" class="score leader">Red: 3</p>\n<p id="blue" class="score">Blue: 1</p>\n<p id="status">Red leads</p>',
      },
      {
        name: 'blue leads',
        input: '2\n5\n',
        harness: SHOW_PAGE,
        expectedOutput: '<h2>Scoreboard</h2>\n<p id="red" class="score">Red: 2</p>\n<p id="blue" class="score leader">Blue: 5</p>\n<p id="status">Blue leads</p>',
      },
      {
        name: 'tie',
        input: '4\n4\n',
        hidden: true,
        harness: SHOW_PAGE,
        expectedOutput: '<h2>Scoreboard</h2>\n<p id="red" class="score">Red: 4</p>\n<p id="blue" class="score">Blue: 4</p>\n<p id="status">Tie</p>',
      },
    ],
    play: { intro: 'Type two scores and watch the board update.', renderer: 'page' },
  },
  {
    id: 'dom-elements-3',
    conceptId: 'dom-elements',
    title: 'Profile Card',
    role: 'integrate',
    game: 'build-it',
    mode: 'freeform',
    prompt:
      'Build a profile card from two input lines: a name, then a comma-separated list of tags (which may have spaces around them).\n\n- Put the name in `#name`.\n- For every tag, create a `<span class="tag">` with the trimmed tag text and append it to `#tags`, in order.\n- If the name is longer than 12 characters, add the class `long` to `#name` and show the `#warning` paragraph by setting `hidden` to `false`.\n\nNew elements come from `document.createElement("span")`; `parent.appendChild(child)` puts them on the page.',
    reinforces: ['input', 'strings', 'loops', 'conditionals', 'methods'],
    hints: [
      '`prompt().split(",")` gives the tags; `.trim()` cleans each one inside the loop.',
      'Three steps per tag: create the span, set `className` and `textContent`, append it to `#tags`.',
      '`document.getElementById("warning").hidden = false;` removes the `hidden` attribute.',
      '`name.length > 12` decides both the class and the warning.',
    ],
    page: html(`
      <div id="card">
        <h2 id="name">?</h2>
        <p id="tags"></p>
        <p id="warning" hidden>Name too long</p>
      </div>
    `),
    starterCode: js(`
      const name = prompt("Name?");
      const tags = prompt("Tags?").split(",");

    `),
    solution: js(`
      const name = prompt("Name?");
      const tags = prompt("Tags?").split(",");

      const heading = document.getElementById("name");
      heading.textContent = name;
      if (name.length > 12) {
        heading.classList.add("long");
        document.getElementById("warning").hidden = false;
      }

      const tagBox = document.getElementById("tags");
      for (const tag of tags) {
        const span = document.createElement("span");
        span.className = "tag";
        span.textContent = tag.trim();
        tagBox.appendChild(span);
      }
    `),
    requirements: { javascript: [CREATE_RULE] },
    tests: [
      {
        name: 'short name, two tags',
        input: 'Ada\nmath, code\n',
        harness: SHOW_PAGE,
        expectedOutput:
          '<div id="card">\n  <h2 id="name">Ada</h2>\n  <p id="tags">\n    <span class="tag">math</span>\n    <span class="tag">code</span>\n  </p>\n  <p id="warning" hidden>Name too long</p>\n</div>',
      },
      {
        name: 'long name shows the warning',
        input: 'Bartholomew Jones\nchess\n',
        harness: SHOW_PAGE,
        expectedOutput:
          '<div id="card">\n  <h2 id="name" class="long">Bartholomew Jones</h2>\n  <p id="tags">\n    <span class="tag">chess</span>\n  </p>\n  <p id="warning">Name too long</p>\n</div>',
      },
      {
        name: 'exactly 12 characters is not long',
        input: 'Grace Hopper\nnavy, compilers, cobol\n',
        hidden: true,
        harness: SHOW_PAGE,
        expectedOutput:
          '<div id="card">\n  <h2 id="name">Grace Hopper</h2>\n  <p id="tags">\n    <span class="tag">navy</span>\n    <span class="tag">compilers</span>\n    <span class="tag">cobol</span>\n  </p>\n  <p id="warning" hidden>Name too long</p>\n</div>',
      },
    ],
    play: { intro: 'Enter a name and some tags to build your card.', renderer: 'page' },
  },
];
