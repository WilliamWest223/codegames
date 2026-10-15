import type { Level } from '@codegames/shared';
import { PREVENT_RULE, html, js, page } from './shared';

/** dom-forms levels (JavaScript only), in play order. */
export const domFormsLevels: Level[] = [
  {
    id: 'dom-forms-1',
    conceptId: 'dom-forms',
    title: 'Sign Up',
    role: 'intro',
    game: 'build-it',
    mode: 'guided',
    prompt:
      'Forms are how pages collect input. Pressing a form\'s button fires a `submit` event on the **form**, and a real browser then reloads the page, throwing your JavaScript away. The first line of every submit handler is `event.preventDefault()` to stop that.\n\nListen for `submit` on `#signup`. If `#email` contains an `@`, set `#message` to `Welcome, <email>` and give it the class `ok`; otherwise set it to `Please enter a valid email` with the class `error`. Set `className` so the class is **replaced**, not added.',
    reinforces: ['functions', 'conditionals', 'strings'],
    hints: [
      'The handler needs the event: `form.addEventListener("submit", (event) => { event.preventDefault(); ... });`',
      'Read the typed text with `email.value`; `email.value.includes("@")` is the check.',
      '`message.className = "ok";` replaces every class on the message; `classList.add` would pile them up.',
    ],
    page: html(`
      <form id="signup">
        <input id="email" placeholder="Email">
        <button>Join</button>
      </form>
      <p id="message"></p>
    `),
    starterCode: js(`
      const form = document.getElementById("signup");
      const email = document.getElementById("email");
      const message = document.getElementById("message");

    `),
    solution: js(`
      const form = document.getElementById("signup");
      const email = document.getElementById("email");
      const message = document.getElementById("message");

      form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (email.value.includes("@")) {
          message.textContent = "Welcome, " + email.value;
          message.className = "ok";
        } else {
          message.textContent = "Please enter a valid email";
          message.className = "error";
        }
      });
    `),
    requirements: { javascript: [PREVENT_RULE] },
    tests: [
      {
        name: 'a valid email',
        harness: page(`
          document.getElementById("email").value = "ada@example.com";
          document.querySelector("#signup button").click();
        `),
        expectedOutput: '<form id="signup">\n  <input id="email" placeholder="Email" value="ada@example.com">\n  <button>Join</button>\n</form>\n<p id="message" class="ok">Welcome, ada@example.com</p>',
      },
      {
        name: 'no @ sign',
        harness: page(`
          document.getElementById("email").value = "nope";
          document.querySelector("#signup button").click();
        `),
        expectedOutput: '<form id="signup">\n  <input id="email" placeholder="Email" value="nope">\n  <button>Join</button>\n</form>\n<p id="message" class="error">Please enter a valid email</p>',
      },
      {
        name: 'fixing a mistake replaces the class',
        hidden: true,
        harness: page(`
          const email = document.getElementById("email");
          email.value = "bad";
          document.querySelector("#signup button").click();
          email.value = "good@site.org";
          document.querySelector("#signup button").click();
        `),
        expectedOutput: '<form id="signup">\n  <input id="email" placeholder="Email" value="good@site.org">\n  <button>Join</button>\n</form>\n<p id="message" class="ok">Welcome, good@site.org</p>',
      },
    ],
    play: { intro: 'Type an email and press Join.', renderer: 'page' },
    takeaway:
      'A form\'s default action is to send its fields to a server and load the reply as a new page; that is how the web worked before JavaScript. `preventDefault()` keeps you in control so you can check the input and update the page in place. Validation on the page is for a friendly experience only: a server must check everything again, because anyone can bypass page-side code.',
  },
  {
    id: 'dom-forms-2',
    conceptId: 'dom-forms',
    title: 'Stale Order',
    role: 'combine',
    game: 'bug-hunt',
    mode: 'guided',
    prompt:
      'A coffee order form: `#qty` cups at $4 each, plus $2 if the `#gift` checkbox is ticked. Submitting should write `N cups: $P` into `#summary` without reloading the page.\n\nWhatever you type, the summary says 1 cup, and the page would reload in a real browser. Two bugs.',
    reinforces: ['type-conversion', 'booleans', 'conditionals'],
    hints: [
      'The quantity and checkbox are read **once, when the program starts**, before the user has typed anything. Move those reads inside the submit handler so they happen on each submit.',
      'A submit handler without `event.preventDefault()` lets the browser reload. Add it as the first line.',
      'Inside the handler: `const qty = Number(qtyBox.value); const gift = giftBox.checked;`',
    ],
    page: html(`
      <form id="order">
        <input id="qty" type="number" value="1">
        <input id="gift" type="checkbox">
        <button>Order</button>
      </form>
      <p id="summary"></p>
    `),
    starterCode: js(`
      const form = document.getElementById("order");
      const qtyBox = document.getElementById("qty");
      const giftBox = document.getElementById("gift");
      const summary = document.getElementById("summary");

      const qty = Number(qtyBox.value);
      const gift = giftBox.checked;

      form.addEventListener("submit", (event) => {
        let price = qty * 4;
        if (gift) {
          price = price + 2;
        }
        summary.textContent = qty + " cups: $" + price;
      });
    `),
    solution: js(`
      const form = document.getElementById("order");
      const qtyBox = document.getElementById("qty");
      const giftBox = document.getElementById("gift");
      const summary = document.getElementById("summary");

      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const qty = Number(qtyBox.value);
        const gift = giftBox.checked;
        let price = qty * 4;
        if (gift) {
          price = price + 2;
        }
        summary.textContent = qty + " cups: $" + price;
      });
    `),
    requirements: { javascript: [PREVENT_RULE] },
    tests: [
      {
        name: 'three cups',
        harness: page(`
          document.getElementById("qty").value = "3";
          document.querySelector("#order button").click();
        `),
        expectedOutput: '<form id="order">\n  <input id="qty" type="number" value="3">\n  <input id="gift" type="checkbox">\n  <button>Order</button>\n</form>\n<p id="summary">3 cups: $12</p>',
      },
      {
        name: 'two cups, gift wrapped',
        harness: page(`
          document.getElementById("qty").value = "2";
          document.getElementById("gift").click();
          document.querySelector("#order button").click();
        `),
        expectedOutput: '<form id="order">\n  <input id="qty" type="number" value="2">\n  <input id="gift" checked type="checkbox">\n  <button>Order</button>\n</form>\n<p id="summary">2 cups: $10</p>',
      },
      {
        name: 'changing your mind',
        hidden: true,
        harness: page(`
          const qty = document.getElementById("qty");
          qty.value = "5";
          document.getElementById("gift").click();
          document.querySelector("#order button").click();
          qty.value = "1";
          document.getElementById("gift").click();
          document.querySelector("#order button").click();
        `),
        expectedOutput: '<form id="order">\n  <input id="qty" type="number" value="1">\n  <input id="gift" type="checkbox">\n  <button>Order</button>\n</form>\n<p id="summary">1 cups: $4</p>',
      },
    ],
    play: { intro: 'Change the quantity, tick the gift box, press Order.', renderer: 'page' },
  },
  {
    id: 'dom-forms-3',
    conceptId: 'dom-forms',
    title: 'Registration Desk',
    role: 'integrate',
    game: 'build-it',
    mode: 'freeform',
    prompt:
      'Validate a registration form on submit (prevent the reload first):\n\n- The trimmed `#user` must be at least 3 characters, else the problem `Username needs 3+ characters`.\n- `#age` as a number must be 13 to 120 inclusive, else `Age must be 13 to 120`.\n- Each failing field gets the class `invalid`; a field that passes must have `invalid` removed again.\n- Clear `#errors`, then add one `<li>` per problem, in the order above.\n- With no problems, set `#result` to `Registered <user> (<age>) on <plan>`, where `<plan>` is the `#plan` select\'s `value`. With problems, `#result` must be empty.',
    reinforces: ['functions', 'conditionals', 'collections', 'loops', 'strings', 'type-conversion', 'booleans'],
    hints: [
      'Collect problems in an array first (`problems.push("...")`), then draw them. That keeps checking and drawing separate.',
      '`user.classList.add("invalid")` in the failing branch and `user.classList.remove("invalid")` in the passing one, so a second, correct submit cleans up.',
      '`errors.replaceChildren();` before the loop that appends an `<li>` per problem.',
      'A `<select>`\'s chosen option is its `.value`, just like an input.',
    ],
    page: html(`
      <form id="register">
        <input id="user" placeholder="Username">
        <input id="age" type="number" placeholder="Age">
        <select id="plan">
          <option value="free">Free</option>
          <option value="pro">Pro</option>
        </select>
        <button>Register</button>
      </form>
      <ul id="errors"></ul>
      <p id="result"></p>
    `),
    starterCode: js(`
      const form = document.getElementById("register");
      const user = document.getElementById("user");
      const age = document.getElementById("age");
      const plan = document.getElementById("plan");
      const errors = document.getElementById("errors");
      const result = document.getElementById("result");

    `),
    solution: js(`
      const form = document.getElementById("register");
      const user = document.getElementById("user");
      const age = document.getElementById("age");
      const plan = document.getElementById("plan");
      const errors = document.getElementById("errors");
      const result = document.getElementById("result");

      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const problems = [];
        const name = user.value.trim();
        const years = Number(age.value);

        if (name.length < 3) {
          problems.push("Username needs 3+ characters");
          user.classList.add("invalid");
        } else {
          user.classList.remove("invalid");
        }
        if (years < 13 || years > 120) {
          problems.push("Age must be 13 to 120");
          age.classList.add("invalid");
        } else {
          age.classList.remove("invalid");
        }

        errors.replaceChildren();
        for (const problem of problems) {
          const li = document.createElement("li");
          li.textContent = problem;
          errors.appendChild(li);
        }
        if (problems.length === 0) {
          result.textContent = "Registered " + name + " (" + years + ") on " + plan.value;
        } else {
          result.textContent = "";
        }
      });
    `),
    requirements: { javascript: [PREVENT_RULE] },
    tests: [
      {
        name: 'both fields wrong',
        harness: page(`
          document.getElementById("user").value = "ab";
          document.getElementById("age").value = "10";
          document.querySelector("#register button").click();
        `),
        expectedOutput:
          '<form id="register">\n  <input id="user" class="invalid" placeholder="Username" value="ab">\n  <input id="age" class="invalid" placeholder="Age" type="number" value="10">\n  <select id="plan">\n    <option value="free">Free</option>\n    <option value="pro">Pro</option>\n  </select>\n  <button>Register</button>\n</form>\n<ul id="errors">\n  <li>Username needs 3+ characters</li>\n  <li>Age must be 13 to 120</li>\n</ul>\n<p id="result"></p>',
      },
      {
        name: 'a good registration on the pro plan',
        harness: page(`
          document.getElementById("user").value = "ada";
          document.getElementById("age").value = "36";
          document.getElementById("plan").value = "pro";
          document.querySelector("#register button").click();
        `),
        expectedOutput:
          '<form id="register">\n  <input id="user" placeholder="Username" value="ada">\n  <input id="age" placeholder="Age" type="number" value="36">\n  <select id="plan">\n    <option value="free">Free</option>\n    <option value="pro">Pro</option>\n  </select>\n  <button>Register</button>\n</form>\n<ul id="errors"></ul>\n<p id="result">Registered ada (36) on pro</p>',
      },
      {
        name: 'second try clears the errors',
        hidden: true,
        harness: page(`
          const user = document.getElementById("user");
          const age = document.getElementById("age");
          user.value = "x";
          age.value = "200";
          document.querySelector("#register button").click();
          user.value = "  Grace ";
          age.value = "85";
          document.querySelector("#register button").click();
        `),
        expectedOutput:
          '<form id="register">\n  <input id="user" placeholder="Username" value="  Grace ">\n  <input id="age" placeholder="Age" type="number" value="85">\n  <select id="plan">\n    <option value="free">Free</option>\n    <option value="pro">Pro</option>\n  </select>\n  <button>Register</button>\n</form>\n<ul id="errors"></ul>\n<p id="result">Registered Grace (85) on free</p>',
      },
    ],
    play: { intro: 'Fill in the form and press Register. Try breaking the rules first.', renderer: 'page' },
  },
];
