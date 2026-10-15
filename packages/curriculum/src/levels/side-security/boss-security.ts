import type { Level } from '@codegames/shared';
import { code } from '../../helpers';
import { lang } from '../../localize';
import { CAESAR, TOY_HASH, VALID_USERNAME, compose } from './shared';

const VAULT_DATA = code(
  `
  SHADOW = ["ana:153950", "bob:310236"]
  SECRET = "esp ecpldfcp td fyopc esp zwo zlv"
  `,
  `
  const SHADOW = ["ana:153950", "bob:310236"];
  const SECRET = "esp ecpldfcp td fyopc esp zwo zlv";
  `,
);

const VAULT = code(
  `
  def check_login(shadow, name, pw):
      for line in shadow:
          stored_name, fingerprint = line.split(":")
          if stored_name == name and fingerprint == str(toy_hash(name + ":" + pw)):
              return True
      return False

  def tries_left(failures, name):
      return 3 - failures.count(name)

  failures = []
  while True:
      words = input().split()
      if words == ["quit"]:
          print("Vault sealed.")
          break
      if len(words) != 2 or valid_username(words[0]) != "OK":
          print("Invalid input.")
          continue
      name = words[0]
      if tries_left(failures, name) <= 0:
          print("Account locked.")
      elif check_login(SHADOW, name, words[1]):
          print(f"Welcome, {name}. The vault opens.")
          print(f"Secret: {caesar(SECRET, -11)}")
          break
      else:
          failures.append(name)
          left = tries_left(failures, name)
          if left == 0:
              print("Access denied. Account locked.")
          elif left == 1:
              print("Access denied (1 try left).")
          else:
              print(f"Access denied ({left} tries left).")
  `,
  `
  function checkLogin(shadow, name, pw) {
    for (const line of shadow) {
      const [storedName, fingerprint] = line.split(":");
      if (storedName === name && fingerprint === String(toyHash(name + ":" + pw))) {
        return true;
      }
    }
    return false;
  }

  function triesLeft(failures, name) {
    return 3 - failures.filter((f) => f === name).length;
  }

  const failures = [];
  while (true) {
    const words = prompt().split(" ");
    if (words.length === 1 && words[0] === "quit") {
      console.log("Vault sealed.");
      break;
    }
    if (words.length !== 2 || validUsername(words[0]) !== "OK") {
      console.log("Invalid input.");
      continue;
    }
    const name = words[0];
    if (triesLeft(failures, name) <= 0) {
      console.log("Account locked.");
    } else if (checkLogin(SHADOW, name, words[1])) {
      console.log(\`Welcome, \${name}. The vault opens.\`);
      console.log(\`Secret: \${caesar(SECRET, -11)}\`);
      break;
    } else {
      failures.push(name);
      const left = triesLeft(failures, name);
      if (left === 0) {
        console.log("Access denied. Account locked.");
      } else if (left === 1) {
        console.log("Access denied (1 try left).");
      } else {
        console.log(\`Access denied (\${left} tries left).\`);
      }
    }
  }
  `,
);

const SECRET_TEXT = 'Secret: the treasure is under the old oak';

/** boss-security levels, in play order. */
export const bossSecurityLevels: Level[] = [
  {
    id: 'boss-security',
    conceptId: 'boss-security',
    title: 'The Vault',
    role: 'boss',
    game: 'build-it',
    mode: 'freeform',
    prompt: `**Boss: The Vault.** The ship's vault guards a secret message.\n- \`SHADOW\` holds the accounts as \`name:fingerprint\`, where the fingerprint is ${lang('`toy_hash(name + ":" + password)`', '`toyHash(name + ":" + password)`')}. Mixing in the name is a **salt**: two users with the same password get different fingerprints.\n- \`SECRET\` is encrypted with a Caesar shift of **11**.\n\n**Phase 1 · Tools.** Bring \`caesar(text, key)\` and ${lang('`valid_username(name)`', '`validUsername(name)`')} from earlier levels, working exactly as before.\n\n**Phase 2 · Rules.**\n- ${lang('`check_login(shadow, name, pw)`', '`checkLogin(shadow, name, pw)`')} returns whether some line has this name **and** the fingerprint of \`name:pw\`.\n- ${lang('`tries_left(failures, name)`', '`triesLeft(failures, name)`')} returns 3 minus how often \`name\` appears in the \`failures\` list.\n\n**Phase 3 · The vault.** Read \`NAME PASSWORD\` lines until \`quit\` (print \`Vault sealed.\`):\n- not exactly two words, or a name that breaks the username rules: \`Invalid input.\` (it doesn't count as a try)\n- no tries left: \`Account locked.\`, even with the right password\n- right: \`Welcome, NAME. The vault opens.\`, then \`Secret: \` and the decrypted message, and stop\n- wrong, **including names that don't exist** (same message!): \`Access denied (2 tries left).\`, then \`(1 try left)\`, then \`Access denied. Account locked.\`\n\nNo passwords and no decrypted secret in your code.`,
    reinforces: ['encoding', 'ciphers', 'passwords', 'input-validation'],
    hints: [
      'Copy `caesar` and the username checker from your Codebreaker and Username Rules solutions: the tests call them directly.',
      lang('`check_login`: split each line at `":"` and compare the fingerprint with `str(toy_hash(name + ":" + pw))`.', '`checkLogin`: split each line at `":"` and compare the fingerprint with `String(toyHash(name + ":" + pw))`.'),
      `\`failures\` is a list of names, one entry per wrong try. ${lang('`failures.count(name)`', '`failures.filter((f) => f === name).length`')} counts one person's.`,
      'Check in this order: invalid input, then locked, then the right password, then wrong. Decrypt with `caesar(SECRET, -11)`.',
    ],
    starterCode: compose(
      TOY_HASH,
      VAULT_DATA,
      code(
        `
        # Phase 1: your tools. Bring caesar(text, key) and valid_username(name) from earlier levels.

        # Phase 2: the rules.
        #   check_login(shadow, name, pw): the stored fingerprint is toy_hash(name + ":" + pw).
        #   tries_left(failures, name): 3 minus this name's failures.

        # Phase 3: the vault. Read "NAME PASSWORD" lines until quit.
        `,
        `
        // Phase 1: your tools. Bring caesar(text, key) and validUsername(name) from earlier levels.

        // Phase 2: the rules.
        //   checkLogin(shadow, name, pw): the stored fingerprint is toyHash(name + ":" + pw).
        //   triesLeft(failures, name): 3 minus this name's failures.

        // Phase 3: the vault. Read "NAME PASSWORD" lines until quit.
        `,
      ),
    ),
    solution: compose(TOY_HASH, CAESAR, VALID_USERNAME, VAULT_DATA, VAULT),
    requirements: {
      python: [
        { pattern: 'open4sesame|tr0mbone', forbid: true, message: 'Never write a password into your code: check fingerprints instead.' },
        { pattern: 'the treasure', forbid: true, message: 'Decrypt the secret with `caesar`: don\'t type it in.' },
      ],
      javascript: [
        { pattern: 'open4sesame|tr0mbone', forbid: true, message: 'Never write a password into your code: check fingerprints instead.' },
        { pattern: 'the treasure', forbid: true, message: 'Decrypt the secret with `caesar`: don\'t type it in.' },
      ],
    },
    tests: [
      {
        name: 'hash, cipher, usernames',
        phase: '1 · Tools',
        input: 'quit',
        expectedOutput: '203360 khoor, zruog\nOK Must start with a letter Too short',
        harness: {
          python: 'print(toy_hash("ana:cat"), caesar("hello, world", 3))\nprint(valid_username("bo_2"), valid_username("Bob"), valid_username("b"))',
          javascript: 'console.log(toyHash("ana:cat"), caesar("hello, world", 3));\nconsole.log(validUsername("bo_2"), validUsername("Bob"), validUsername("b"));',
        },
      },
      {
        name: 'logins check salted fingerprints',
        phase: '2 · Rules',
        input: 'quit',
        expectedOutput: { python: 'True False False\nFalse False\n3 1', javascript: 'true false false\nfalse false\n3 1' },
        harness: {
          python: '_s = ["zed:125175"]\nprint(check_login(_s, "zed", "pw12345"), check_login(_s, "zed", "pw1234"), check_login(_s, "amy", "pw12345"))\nprint(check_login(["zed:765437"], "zed", "pw12345"), check_login(["zed:pw12345"], "zed", "pw12345"))\nprint(tries_left([], "zed"), tries_left(["zed", "amy", "zed"], "zed"))',
          javascript: 'const _s = ["zed:125175"];\nconsole.log(checkLogin(_s, "zed", "pw12345"), checkLogin(_s, "zed", "pw1234"), checkLogin(_s, "amy", "pw12345"));\nconsole.log(checkLogin(["zed:765437"], "zed", "pw12345"), checkLogin(["zed:pw12345"], "zed", "pw12345"));\nconsole.log(triesLeft([], "zed"), triesLeft(["zed", "amy", "zed"], "zed"));',
        },
      },
      {
        name: 'open on the second try',
        phase: '3 · The vault',
        input: 'ana sesame\nana open4sesame',
        expectedOutput: ['Access denied (2 tries left).', 'Welcome, ana. The vault opens.', SECRET_TEXT].join('\n'),
      },
      {
        name: 'lockout',
        phase: '3 · The vault',
        input: 'bob guess1\nbob guess2\nbob guess3\nbob tr0mbone!\nquit',
        expectedOutput: ['Access denied (2 tries left).', 'Access denied (1 try left).', 'Access denied. Account locked.', 'Account locked.', 'Vault sealed.'].join('\n'),
      },
      {
        name: 'bad input and strangers',
        phase: '3 · The vault',
        input: 'hello\nAna open4sesame\nana open4sesame extra\nzed pw12345\nana tr0mbone!\nbob tr0mbone!',
        expectedOutput: ['Invalid input.', 'Invalid input.', 'Invalid input.', 'Access denied (2 tries left).', 'Access denied (2 tries left).', 'Welcome, bob. The vault opens.', SECRET_TEXT].join('\n'),
        hidden: true,
      },
    ],
    play: { intro: 'Try logging in: type NAME PASSWORD, or quit. (The test account is `ana` with password `open4sesame`.)' },
    takeaway: 'Your vault covers the whole **CIA triad**. **Confidentiality:** salted fingerprints instead of passwords, an encrypted secret, and the same message for every failure. **Integrity:** only an exact match opens it, and input must pass an allow-list first. **Availability** is the trade-off: lockout stops guessing, but anyone can lock out `ana` just by typing her name three times. Real systems soften this with growing delays and multi-factor login. And remember: the toy hash and Caesar are NOT real security, for learning only. Real systems use vetted libraries.',
  },
];
