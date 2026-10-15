import type { Level } from '@codegames/shared';
import { code } from '../../helpers';
import { lang } from '../../localize';
import { VALID_USERNAME, compose } from './shared';

const NAME_LOOP = code(
  `
  while True:
      name = input()
      if name == "done":
          break
      print(f"{name}: {valid_username(name)}")
  `,
  `
  while (true) {
    const name = prompt();
    if (name === "done") {
      break;
    }
    console.log(\`\${name}: \${validUsername(name)}\`);
  }
  `,
);

/** input-validation levels, in play order. */
export const inputValidationLevels: Level[] = [
  {
    id: 'input-validation-1',
    conceptId: 'input-validation',
    title: 'Block-list or Allow-list?',
    role: 'intro',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: 'Two ways to keep dangerous input out. A **block-list** rejects known-bad text; an **allow-list** accepts only known-good characters and rejects everything else. Which output is right?',
    reinforces: ['encoding'],
    choices: {
      python: ['True\nFalse\nFalse\nTrue', 'True\nTrue\nFalse\nTrue', 'True\nFalse\nTrue\nTrue', 'False\nFalse\nFalse\nTrue'],
      javascript: ['true\nfalse\nfalse\ntrue', 'true\ntrue\nfalse\ntrue', 'true\nfalse\ntrue\ntrue', 'false\nfalse\nfalse\ntrue'],
    },
    hints: [
      lang('`"<script>" in text` is an exact, case-sensitive search.', '`text.includes("<script>")` is an exact, case-sensitive search.'),
      '`<SCRIPT>` is the same danger in capitals. Does the block-list notice?',
      'The allow-list rejects any character not in its string: `<` isn\'t there.',
    ],
    code: code(
      `
      def blocked(text):
          return "<script>" in text

      def allowed(text):
          for ch in text:
              if ch not in "abcdefghijklmnopqrstuvwxyz0123456789_":
                  return False
          return True

      print(blocked("<script>"))
      print(blocked("<SCRIPT>"))
      print(allowed("<SCRIPT>"))
      print(allowed("ada_99"))
      `,
      `
      function blocked(text) {
        return text.includes("<script>");
      }

      function allowed(text) {
        for (const ch of text) {
          if (!"abcdefghijklmnopqrstuvwxyz0123456789_".includes(ch)) {
            return false;
          }
        }
        return true;
      }

      console.log(blocked("<script>"));
      console.log(blocked("<SCRIPT>"));
      console.log(allowed("<SCRIPT>"));
      console.log(allowed("ada_99"));
      `,
    ),
    takeaway: 'Attackers are creative: capitals, extra spaces, odd encodings all slip past a block-list. An **allow-list** says exactly what is OK and rejects everything else, so a new trick fails by default. Treat **all** input as untrusted until it passes your allow-list.',
  },
  {
    id: 'input-validation-2',
    conceptId: 'input-validation',
    title: 'Username Rules',
    role: 'combine',
    game: 'build-it',
    mode: 'guided',
    prompt: `Write ${lang('`valid_username(name)`', '`validUsername(name)`')} that **returns** the first problem it finds, checking in this order:\n1. \`Too short\` (under 3 characters)\n2. \`Too long\` (over 12)\n3. \`Must start with a letter\` (a–z)\n4. \`Only a-z, 0-9 and _\` (the allow-list)\n\n...or \`OK\`. Read names until \`done\` and print \`NAME: RESULT\`.`,
    reinforces: ['encoding'],
    hints: [
      'Return as soon as you find a problem: the first `return` ends the function.',
      lang('"Starts with a letter": `name[0] >= "a" and name[0] <= "z"`.', '"Starts with a letter": `name[0] >= "a" && name[0] <= "z"`.'),
      'The allow-list check is the loop from the last level: any character not in the allowed string fails.',
    ],
    starterCode: compose(
      code(
        `
        def valid_username(name):
            # Check the four rules in order; return the first problem, or "OK".
            return "OK"
        `,
        `
        function validUsername(name) {
          // Check the four rules in order; return the first problem, or "OK".
          return "OK";
        }
        `,
      ),
      NAME_LOOP,
    ),
    solution: compose(VALID_USERNAME, NAME_LOOP),
    tests: [
      {
        name: 'six names',
        input: 'ada_99\nab\nthisnameiswaytoolong\n9lives\nbad-name\nAda\ndone',
        expectedOutput: 'ada_99: OK\nab: Too short\nthisnameiswaytoolong: Too long\n9lives: Must start with a letter\nbad-name: Only a-z, 0-9 and _\nAda: Must start with a letter',
      },
      {
        name: 'sneaky names',
        input: 'x<script>\nbo b\nok_\ndone',
        expectedOutput: 'x<script>: Only a-z, 0-9 and _\nbo b: Only a-z, 0-9 and _\nok_: OK',
        hidden: true,
      },
      {
        name: 'the edges',
        input: 'done',
        expectedOutput: 'OK Too long OK',
        harness: {
          python: 'print(valid_username("abc"), valid_username("a" * 13), valid_username("a" * 12))',
          javascript: 'console.log(validUsername("abc"), validUsername("a".repeat(13)), validUsername("a".repeat(12)));',
        },
        hidden: true,
      },
    ],
    takeaway: 'The order of checks matters: `Ada` reports the first-letter rule because rule 3 runs before the allow-list. Validate on an allow-list, and return the first problem so the message is clear.',
  },
  {
    id: 'input-validation-3',
    conceptId: 'input-validation',
    title: 'Link Inspector',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: `Phishing emails hide fake links that **look** like your bank. Read links until \`done\` (ignore capitals) and judge each one against the trusted list:\n\n- \`SAFE: DOMAIN\` if the real domain is trusted and the link starts with \`https://\`\n- \`UNSAFE: DOMAIN (no https)\` if the domain is trusted but the link isn't encrypted\n- \`PHISHY: DOMAIN\` otherwise\n\nWrite ${lang('`domain_of(url)`', '`domainOf(url)`')}: take the **host** (between \`://\` and the next \`/\`); if it contains \`@\`, only the part **after** the last \`@\` counts; drop any \`:port\`; the real domain is the **last two** dot-separated parts.\n\n\`https://paypal.com.secure-login.xyz/verify\` → \`secure-login.xyz\`, which is PHISHY.`,
    reinforces: ['encoding'],
    hints: [
      '`url.split("://")[1]` drops the scheme; then `.split("/")[0]` keeps the host.',
      lang('`host.split("@")[-1]` keeps what comes after the last `@`; `.split(":")[0]` drops a port.', '`host.split("@").at(-1)` keeps what comes after the last `@`; `.split(":")[0]` drops a port.'),
      lang('The last two parts: `".".join(host.split(".")[-2:])`.', 'The last two parts: `host.split(".").slice(-2).join(".")`.'),
    ],
    starterCode: code(
      `
      TRUSTED = ["paypal.com", "mybank.com", "school.edu"]

      def domain_of(url):
          # 1. The host: between "://" and the next "/".
          # 2. Only the part after the last "@" counts; drop any ":port".
          # 3. The last two dot-separated parts.
          return ""

      # Read links until "done" and judge each one.
      `,
      `
      const TRUSTED = ["paypal.com", "mybank.com", "school.edu"];

      function domainOf(url) {
        // 1. The host: between "://" and the next "/".
        // 2. Only the part after the last "@" counts; drop any ":port".
        // 3. The last two dot-separated parts.
        return "";
      }

      // Read links until "done" and judge each one.
      `,
    ),
    solution: code(
      `
      TRUSTED = ["paypal.com", "mybank.com", "school.edu"]

      def domain_of(url):
          host = url.split("://")[1].split("/")[0]
          host = host.split("@")[-1].split(":")[0]
          return ".".join(host.split(".")[-2:])

      while True:
          url = input().lower()
          if url == "done":
              break
          domain = domain_of(url)
          if domain in TRUSTED and url.startswith("https://"):
              print(f"SAFE: {domain}")
          elif domain in TRUSTED:
              print(f"UNSAFE: {domain} (no https)")
          else:
              print(f"PHISHY: {domain}")
      `,
      `
      const TRUSTED = ["paypal.com", "mybank.com", "school.edu"];

      function domainOf(url) {
        let host = url.split("://")[1].split("/")[0];
        host = host.split("@").at(-1).split(":")[0];
        return host.split(".").slice(-2).join(".");
      }

      while (true) {
        const url = prompt().toLowerCase();
        if (url === "done") {
          break;
        }
        const domain = domainOf(url);
        if (TRUSTED.includes(domain) && url.startsWith("https://")) {
          console.log(\`SAFE: \${domain}\`);
        } else if (TRUSTED.includes(domain)) {
          console.log(\`UNSAFE: \${domain} (no https)\`);
        } else {
          console.log(\`PHISHY: \${domain}\`);
        }
      }
      `,
    ),
    tests: [
      {
        name: 'five links',
        input: 'https://www.paypal.com/login\nhttps://paypal.com.secure-login.xyz/verify\nhttps://paypal.com@evil.io/pay\nhttp://mybank.com/\nhttps://school.edu:8443/grades\ndone',
        expectedOutput: 'SAFE: paypal.com\nPHISHY: secure-login.xyz\nPHISHY: evil.io\nUNSAFE: mybank.com (no https)\nSAFE: school.edu',
      },
      {
        name: 'look-alikes and capitals',
        input: 'https://paypa1.com/\nHTTPS://Login.MyBank.com/x\nhttps://mybank.com.evil.net\ndone',
        expectedOutput: 'PHISHY: paypa1.com\nSAFE: mybank.com\nPHISHY: evil.net',
        hidden: true,
      },
      {
        name: 'domain of a long link',
        input: 'done',
        expectedOutput: 'example.org',
        harness: { python: 'print(domain_of("https://a.b.example.org/x?y=1"))', javascript: 'console.log(domainOf("https://a.b.example.org/x?y=1"));' },
        hidden: true,
      },
    ],
    takeaway: 'Read a link\'s host **right to left**: the real owner is at the end, so `paypal.com.secure-login.xyz` belongs to `secure-login.xyz`, and everything before an `@` is decoration. Checking against an allow-list of trusted domains beats eyeballing. (Real tools use the Public Suffix List, because endings like `.co.uk` have three parts.)',
  },
];
