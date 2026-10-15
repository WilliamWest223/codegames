import type { Level } from '@codegames/shared';
import { code } from '../../helpers';
import { lang } from '../../localize';
import { TOY_HASH, compose } from './shared';

/** passwords levels, in play order. */
export const passwordsLevels: Level[] = [
  {
    id: 'passwords-1',
    conceptId: 'passwords',
    title: 'How Strong?',
    role: 'intro',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: 'A simple password checker gives one point each for: 12+ characters, a digit, a capital letter. Trace it on three passwords. Which output is right?',
    reinforces: ['encoding'],
    choices: {
      python: ['0\n2\n1', '0\n3\n1', '1\n2\n1', '0\n2\n0'],
      javascript: ['0\n2\n1', '0\n3\n1', '1\n2\n1', '0\n2\n0'],
    },
    hints: [
      '`password` has 8 characters, no digit and no capital: no points.',
      '`Password1` is only 9 characters long, but it has a digit and a capital.',
      '`correcthorsebattery` is long (19 characters) but has no digit or capital.',
    ],
    code: code(
      `
      def strength(pw):
          score = 0
          if len(pw) >= 12:
              score += 1
          has_digit = False
          has_upper = False
          for ch in pw:
              if ch.isdigit():
                  has_digit = True
              if ch.isupper():
                  has_upper = True
          if has_digit:
              score += 1
          if has_upper:
              score += 1
          return score

      print(strength("password"))
      print(strength("Password1"))
      print(strength("correcthorsebattery"))
      `,
      `
      function strength(pw) {
        let score = 0;
        if (pw.length >= 12) {
          score += 1;
        }
        let hasDigit = false;
        let hasUpper = false;
        for (const ch of pw) {
          if (ch >= "0" && ch <= "9") {
            hasDigit = true;
          }
          if (ch >= "A" && ch <= "Z") {
            hasUpper = true;
          }
        }
        if (hasDigit) {
          score += 1;
        }
        if (hasUpper) {
          score += 1;
        }
        return score;
      }

      console.log(strength("password"));
      console.log(strength("Password1"));
      console.log(strength("correcthorsebattery"));
      `,
    ),
    takeaway: 'Simple rule-counting meters can mislead: `Password1` scores higher, yet it is one of the first passwords attackers try, while a long passphrase like `correcthorsebattery` takes vastly longer to guess. Modern advice (NIST): **length beats complexity**, block known common passwords, and use a password manager plus multi-factor login.',
  },
  {
    id: 'passwords-2',
    conceptId: 'passwords',
    title: 'Fingerprints',
    role: 'combine',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: 'Websites shouldn\'t store your password, only a **fingerprint** of it (a *hash*): a number computed from the text. At login they hash what you typed and compare fingerprints. Here are two toy hash functions (**NOT real security**!). Which output is right?',
    reinforces: ['encoding'],
    choices: {
      python: ['True\nTrue\nFalse\n98262', 'True\nFalse\nFalse\n98262', 'True\nTrue\nTrue\n98262', 'True\nTrue\nFalse\n312'],
      javascript: ['true\ntrue\nfalse\n98262', 'true\nfalse\nfalse\n98262', 'true\ntrue\ntrue\n98262', 'true\ntrue\nfalse\n312'],
    },
    hints: [
      lang('`sum_hash` just adds the character codes. Does the **order** of the letters change a sum?', '`sumHash` just adds the character codes. Does the **order** of the letters change a sum?'),
      lang('`toy_hash` multiplies the running total by 31 before adding each code, so the same letters in a different order give a different number.', '`toyHash` multiplies the running total by 31 before adding each code, so the same letters in a different order give a different number.'),
      'For `cat`: 99 → 99 × 31 + 97 = 3166 → 3166 × 31 + 116 = 98262.',
    ],
    code: compose(
      code(
        `
        def sum_hash(text):
            total = 0
            for ch in text:
                total += ord(ch)
            return total
        `,
        `
        function sumHash(text) {
          let total = 0;
          for (const ch of text) {
            total += ch.charCodeAt(0);
          }
          return total;
        }
        `,
      ),
      TOY_HASH,
      code(
        `
        print(sum_hash("cat") == sum_hash("cat"))
        print(sum_hash("cat") == sum_hash("act"))
        print(toy_hash("cat") == toy_hash("act"))
        print(toy_hash("cat"))
        `,
        `
        console.log(sumHash("cat") === sumHash("cat"));
        console.log(sumHash("cat") === sumHash("act"));
        console.log(toyHash("cat") === toyHash("act"));
        console.log(toyHash("cat"));
        `,
      ),
    ),
    takeaway: `A hash maps text to a fingerprint: the same text always gives the same fingerprint, and you can't easily work backwards. Two inputs with the same fingerprint are a **collision**, and ${lang('`sum_hash`', '`sumHash`')} collides on every anagram, so it's useless. These are toys, NOT real security: real password hashing (bcrypt, scrypt, Argon2) is deliberately **slow** and mixes in a random **salt**, so stolen fingerprints are very hard to crack.`,
  },
  {
    id: 'passwords-3',
    conceptId: 'passwords',
    title: 'Sign Up, Log In',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: `Build the account system of a tiny site. Accounts are stored like a real password file: one \`name:fingerprint\` string per user, made with ${lang('`toy_hash(password)`', '`toyHash(password)`')}. The password itself is **never** stored.\n\nCommands until \`done\`:\n- \`signup NAME PASSWORD\`: \`Too weak: use 8+ characters and a digit\`, \`Name taken\`, or store it and print \`Welcome, NAME\`\n- \`login NAME PASSWORD\`: \`Logged in\`, or \`Wrong name or password\` (the **same** message for an unknown name)\n- \`leak\`: print every stored line (pretend an attacker stole the file)\n\nWrite ${lang('`strong_enough(pw)`', '`strongEnough(pw)`')} and \`check(users, name, pw)\`, which **return** ${lang('`True`/`False`', '`true`/`false`')}.`,
    reinforces: ['encoding'],
    hints: [
      lang('A stored line splits back into its parts: `stored_name, fingerprint = line.split(":")`. The fingerprint is text, so compare it with `str(toy_hash(pw))`.', 'A stored line splits back into its parts: `const [storedName, fingerprint] = line.split(":");`. The fingerprint is text, so compare it with `String(toyHash(pw))`.'),
      lang('"Name taken" means some stored line starts with `name + ":"`: loop and check `line.split(":")[0] == name`.', '"Name taken" means some stored line starts with `name + ":"`: loop and check `line.split(":")[0] === name`.'),
      'Why the same message for both login failures? If "no such user" and "wrong password" looked different, an attacker could find out who has an account.',
    ],
    starterCode: compose(
      TOY_HASH,
      code(
        `
        def strong_enough(pw):
            return False

        def check(users, name, pw):
            return False

        users = []
        # Read commands until "done": signup, login, leak.
        `,
        `
        function strongEnough(pw) {
          return false;
        }

        function check(users, name, pw) {
          return false;
        }

        const users = [];
        // Read commands until "done": signup, login, leak.
        `,
      ),
    ),
    solution: compose(
      TOY_HASH,
      code(
        `
        def strong_enough(pw):
            if len(pw) < 8:
                return False
            for ch in pw:
                if ch.isdigit():
                    return True
            return False

        def check(users, name, pw):
            for line in users:
                stored_name, fingerprint = line.split(":")
                if stored_name == name and fingerprint == str(toy_hash(pw)):
                    return True
            return False

        def taken(users, name):
            for line in users:
                if line.split(":")[0] == name:
                    return True
            return False

        users = []
        while True:
            words = input().split()
            if words[0] == "done":
                break
            elif words[0] == "signup":
                if not strong_enough(words[2]):
                    print("Too weak: use 8+ characters and a digit")
                elif taken(users, words[1]):
                    print("Name taken")
                else:
                    users.append(f"{words[1]}:{toy_hash(words[2])}")
                    print(f"Welcome, {words[1]}")
            elif words[0] == "login":
                if check(users, words[1], words[2]):
                    print("Logged in")
                else:
                    print("Wrong name or password")
            elif words[0] == "leak":
                for line in users:
                    print(line)
        `,
        `
        function strongEnough(pw) {
          if (pw.length < 8) {
            return false;
          }
          for (const ch of pw) {
            if (ch >= "0" && ch <= "9") {
              return true;
            }
          }
          return false;
        }

        function check(users, name, pw) {
          for (const line of users) {
            const [storedName, fingerprint] = line.split(":");
            if (storedName === name && fingerprint === String(toyHash(pw))) {
              return true;
            }
          }
          return false;
        }

        function taken(users, name) {
          for (const line of users) {
            if (line.split(":")[0] === name) {
              return true;
            }
          }
          return false;
        }

        const users = [];
        while (true) {
          const words = prompt().split(" ");
          if (words[0] === "done") {
            break;
          } else if (words[0] === "signup") {
            if (!strongEnough(words[2])) {
              console.log("Too weak: use 8+ characters and a digit");
            } else if (taken(users, words[1])) {
              console.log("Name taken");
            } else {
              users.push(\`\${words[1]}:\${toyHash(words[2])}\`);
              console.log(\`Welcome, \${words[1]}\`);
            }
          } else if (words[0] === "login") {
            if (check(users, words[1], words[2])) {
              console.log("Logged in");
            } else {
              console.log("Wrong name or password");
            }
          } else if (words[0] === "leak") {
            for (const line of users) {
              console.log(line);
            }
          }
        }
        `,
      ),
    ),
    tests: [
      {
        name: 'sign up and log in',
        input: 'signup ana pass1234\nsignup bo hunter\nsignup bo hunter22\nsignup ana other123\nlogin ana pass1234\nlogin ana pass9999\nlogin zed pass1234\nleak\ndone',
        expectedOutput: 'Welcome, ana\nToo weak: use 8+ characters and a digit\nWelcome, bo\nName taken\nLogged in\nWrong name or password\nWrong name or password\nana:191538\nbo:348112',
      },
      {
        name: 'the helpers',
        input: 'done',
        expectedOutput: { python: 'True False False\nTrue False False', javascript: 'true false false\ntrue false false' },
        harness: {
          python: '_u = ["ana:191538"]\nprint(strong_enough("abc12345"), strong_enough("abcdefgh"), strong_enough("a1"))\nprint(check(_u, "ana", "pass1234"), check(_u, "ana", "nope"), check(_u, "bo", "pass1234"))',
          javascript: 'const _u = ["ana:191538"];\nconsole.log(strongEnough("abc12345"), strongEnough("abcdefgh"), strongEnough("a1"));\nconsole.log(check(_u, "ana", "pass1234"), check(_u, "ana", "nope"), check(_u, "bo", "pass1234"));',
        },
        hidden: true,
      },
      {
        name: 'a plain-text password file is refused',
        input: 'done',
        expectedOutput: { python: 'False', javascript: 'false' },
        harness: { python: 'print(check(["ana:pass1234"], "ana", "pass1234"))', javascript: 'console.log(check(["ana:pass1234"], "ana", "pass1234"));' },
        hidden: true,
      },
    ],
    takeaway: 'When the file leaked, the attacker got fingerprints, not passwords: that\'s **confidentiality** by design. The toy hash is NOT real security, though. Two real-world upgrades: a per-user random **salt** (otherwise two people with the same password get the same fingerprint, and the attacker can see it), and a slow hash like bcrypt so guessing is expensive. And notice the identical failure message: never tell an attacker which half was wrong.',
  },
];
