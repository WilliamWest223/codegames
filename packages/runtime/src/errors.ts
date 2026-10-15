import type { ExecErrorKind } from './types';

type Lang = 'python' | 'javascript';

const RECURSION_PY = 'A function kept calling itself and never reached a **base case**. Check that every call gets closer to a case that returns without calling again. If a step can jump by 2, the base case must catch both 0 and 1 (`<= 1`).';
const RECURSION_JS = 'A function kept calling itself and never reached a **base case**. The waiting calls filled the call stack. Check that every call gets closer to a case that returns without calling again. If a step can jump by 2, the base case must catch both 0 and 1 (`<= 1`).';

/** What common errors mean, in plain words, per language. */
const PYTHON: Record<string, string> = {
  SyntaxError: "Python couldn't understand this line. Look for a missing colon `:` at the end of `if`/`for`/`while`/`def` lines, a missing quote, or a missing bracket.",
  IndentationError: 'The spaces at the start of a line are off. Lines inside an `if`, loop, or function must all be indented by the same amount (4 spaces).',
  TabError: 'This line mixes tabs and spaces. Use spaces only.',
  NameError: "You used a name Python doesn't know. Check the spelling and capital letters, and make sure a variable gets a value before you use it.",
  TypeError: "You combined values of types that don't work together, like adding a number to text. Convert one first with `int()`, `float()`, or `str()`.",
  ValueError: "A value had the right type but the wrong content, like `int(\"hello\")`: \"hello\" isn't a number.",
  ZeroDivisionError: "You divided by zero, which isn't allowed.",
  IndexError: 'You asked for a position past the end of the list or string. Remember positions start at 0.',
  KeyError: "You looked up a key that isn't in the dictionary.",
  AttributeError: "That value doesn't have the method or property you asked for. Check the spelling.",
  EOFError: 'The program asked for more input than the test gives. If you didn\'t add extra `input()` calls, check that your loop has a way to stop (a `break`, or a condition that becomes false).',
  RecursionError: RECURSION_PY,
  UnboundLocalError: 'A function changes a variable from outside it. Pass the value in as a parameter and `return` the new value.',
  SystemExit: 'The program ended itself with `sys.exit()` and a non-zero code, which means "something went wrong".',
};

const JAVASCRIPT: Record<string, string> = {
  SyntaxError: "JavaScript couldn't understand this code. Look for a missing quote, a bracket `( )` or brace `{ }` that isn't closed, or a typo in a keyword.",
  ReferenceError: "You used a name JavaScript doesn't know. Check the spelling and capital letters, and declare variables with `let` or `const` before using them.",
  TypeError: "A value was used in a way its type doesn't allow, for example calling something that isn't a function, or reading a property of `undefined`.",
  RangeError: 'A number was out of the allowed range, or a function called itself too many times.',
  InputError: 'The program asked for more input than the test gives. If you didn\'t add extra `prompt()` calls, check that your loop has a way to stop (a `break`, or a condition that becomes false).',
  SecurityError: "This program tried to reach outside CodeGames (the page, the network, or code built from a string). That isn't allowed: write the code directly.",
  Error: 'An error was thrown and nothing caught it. If your own code throws it, wrap the call in `try { } catch (err) { }`.',
};

const SHARED: Record<string, string> = {
  GridError: 'The robot was asked to do something impossible.',
  OutputLimitError: 'The program printed far too much. A loop is probably running forever.',
  MemoryError: 'Your program used too much memory, so it was stopped. Usually a loop keeps adding to a list (or making new ones) forever: check that the loop can end.',
  TimeoutError: 'Your program took too long and was stopped. A loop is probably running forever: check that its condition eventually becomes false.',
  LoadError: "The code engine couldn't start. Try again; if it keeps failing, reload the page.",
};

/**
 * Text from an error message or the learner's code, as a Markdown code span that can't break
 * out: a longer backtick fence than any run inside it, so `<tags>` stay literal (round-8 P2).
 */
export function codeSpan(text: string): string {
  const longest = Math.max(0, ...(text.match(/`+/g) ?? []).map((run) => run.length));
  const fence = '`'.repeat(longest + 1);
  const pad = text.startsWith('`') || text.endsWith('`') ? ' ' : '';
  return `${fence}${pad}${text}${pad}${fence}`;
}

/** Sharper explanations recognized from the error message itself. */
const MESSAGE_RULES: { lang?: Lang; test: RegExp; explain: (m: RegExpMatchArray) => string }[] = [
  // Region 4 loops over dictionaries and sets (checked before the generic rules below)
  { lang: 'python', test: /not enough values to unpack \(expected 2|too many values to unpack \(expected 2/, explain: () => 'You unpacked into two names, but each item isn\'t a pair. Looping over a dictionary gives only its **keys**: for key-value pairs write `for k, v in d.items():`.' },
  { lang: 'python', test: /'(builtin_function_or_method|method)' object is not (iterable|subscriptable)/, explain: () => 'You used a method without calling it. Add `()`, e.g. `d.items()` or `text.split()`.' },
  { lang: 'python', test: /'set' object is not subscriptable/, explain: () => 'Sets have no order, so they have no positions: `s[0]` doesn\'t work. Check `x in s`, loop over it, or use `sorted(s)` to get a list.' },
  { lang: 'python', test: /'set' object has no attribute '(append|push|insert)'/, explain: () => 'Sets use `.add(x)` (`append` is for lists).' },
  { lang: 'javascript', test: /is not iterable/, explain: () => '`for...of` works on arrays, strings and sets. To loop over an object, use `for (const key in obj)` for its keys, or `Object.entries(obj)` for key-value pairs.' },
  // Region 5: functions as values, recursion, classes
  { lang: 'python', test: /maximum recursion depth exceeded/, explain: () => RECURSION_PY },
  { lang: 'javascript', test: /Maximum call stack size exceeded/, explain: () => RECURSION_JS },
  { lang: 'python', test: /'<' not supported between instances of '(\w+)' and '\1'/, explain: (m) => `Python can't put two \`${m[1]}\`s in order by itself. Tell \`sorted\` what to compare: \`sorted(items, key=lambda x: x["hp"])\`.` },
  { lang: 'javascript', test: /Must call super constructor in derived class/, explain: () => 'A subclass constructor must call `super(...)` (the parent\'s constructor) before it uses `this`.' },
  { lang: 'python', test: /'NoneType' object is not callable/, explain: () => 'You put `( )` after `None`, as if it were a function. Did a variable reuse the name of a function, or did you store a function\'s **result** (`move()`) where you meant the function itself (`move`)?' },
  { lang: 'python', test: /'(map|filter)' object is not subscriptable/, explain: () => '`map(...)` and `filter(...)` give a lazy object, not a list. Wrap it in `list(...)`, or use a list comprehension.' },
  { lang: 'python', test: /invalid literal for int\(\) with base 2/, explain: () => 'In base 2 only the digits 0 and 1 are allowed.' },
  // Round-8 P1-1: the browser is out of reach from learner Python.
  { lang: 'python', test: /No module named '(js|pyodide_js|pyodide|_pyodide|micropip)\b/, explain: () => "CodeGames programs run in a closed sandbox: modules that reach the browser (`js`, `pyodide`) aren't available. Plain Python only." },
  // Side quest: character codes
  { lang: 'python', test: /ord\(\) expected a character, but string of length (\d+) found/, explain: () => '`ord` takes exactly **one** character. Loop over the text and call `ord(ch)` for each.' },
  { lang: 'python', test: /ord\(\) expected string of length 1, but (\w+) found/, explain: () => '`ord` turns a character into a number. For the other direction (number → character), use `chr(n)`.' },
  { lang: 'python', test: /chr\(\) arg not in range/, explain: () => '`chr` needs a code from 0 to 1114111. Shifting letters? Wrap with `% 26` and add back `ord("a")`.' },
  // Mixing up the two languages
  { lang: 'javascript', test: /^print is not defined/, explain: () => '`print` is Python. In JavaScript, show output with `console.log(...)`.' },
  { lang: 'python', test: /name 'console' is not defined/, explain: () => '`console.log` is JavaScript. In Python, show output with `print(...)`.' },
  { lang: 'python', test: /name '(true|false|null)' is not defined/, explain: (m) => `\`${m[1]}\` is JavaScript spelling. Python writes \`${m[1] === 'null' ? 'None' : m[1]![0]!.toUpperCase() + m[1]!.slice(1)}\` with a capital letter.` },
  // Python syntax specifics (checked before the generic rules below)
  { lang: 'python', test: /Maybe you meant '==' or ':=' instead of '='/, explain: () => 'Inside an `if` or `while`, use `==` to **compare**. A single `=` **stores** a value and isn\'t allowed there.' },
  { lang: 'python', test: /Missing parentheses in call to 'print'/, explain: () => '`print` needs brackets in Python 3: write `print("text")`.' },
  { lang: 'python', test: /^(move|turn_left|collect|is_blocked|on_gem|at_flag|turn_right)\(\) takes 0 positional arguments/, explain: () => 'This command doesn\'t take anything inside its brackets. To do it several times, call it several times or use a loop.' },
  { lang: 'python', test: /cannot be interpreted as an integer/, explain: () => '`range()` needs a whole number, not a list. To visit every item write `for item in items:`, or `range(len(items))` for the positions.' },
  { lang: 'python', test: /indices must be integers or slices, not float/, explain: () => 'A position must be a whole number, not a decimal. `/` always gives a decimal: use `//` (whole-number division) or `int()`.' },
  { lang: 'python', test: /list indices must be integers or slices, not str/, explain: () => '`for x in items` gives you the **items**, not their positions, so `items[x]` uses an item as a position. Use `x` directly, or loop over `range(len(items))` if you need positions. (If the position came from `input()`, convert it with `int()`.)' },
  { lang: 'python', test: /string indices must be integers/, explain: () => 'A position in a string must be a whole number. `for ch in text` gives you the **characters** themselves: use `ch` directly, or loop over `range(len(text))` for positions.' },
  { lang: 'python', test: /object of type '(\w+)' has no len\(\)/, explain: (m) => (m[1] === 'builtin_function_or_method' || m[1] === 'method' ? 'You used a method without calling it. Add `()`, e.g. `text.split()`.' : `\`len()\` counts the items in a list or string, but this value is a single ${m[1]}.`) },
  { lang: 'python', test: /'return' outside function/, explain: () => 'This `return` isn\'t inside a function. Indent it under the `def` line, or remove it.' },
  { lang: 'python', test: /'str' object has no attribute '(toUpperCase|toLowerCase|length|includes|trim)'/, explain: (m) => `\`.${m[1]}\` is JavaScript. Python writes ${({ toUpperCase: '`.upper()`', toLowerCase: '`.lower()`', length: '`len(text)`', includes: '`"x" in text`', trim: '`.strip()`' } as Record<string, string>)[m[1]!]}.` },
  { lang: 'javascript', test: /\.(upper|lower|strip|capitalize) is not a function/, explain: (m) => `\`.${m[1]}()\` is Python. JavaScript writes ${({ upper: '`.toUpperCase()`', lower: '`.toLowerCase()`', strip: '`.trim()`', capitalize: '`text[0].toUpperCase() + text.slice(1)`' } as Record<string, string>)[m[1]!]}.` },
  { lang: 'javascript', test: /\.length is not a function/, explain: () => '`.length` has no brackets in JavaScript: write `items.length`, not `items.length()`.' },
  { lang: 'javascript', test: /comparison function must be either a function or undefined/, explain: () => 'Pass the compare function itself, without brackets: `sort(byNumber)`. `sort` calls it for you.' },
  { lang: 'python', test: /'(\w+)' object is not callable/, explain: (m) => `You put \`( )\` after a ${m[1]} value, as if it were a function. Did a variable reuse the name of a function (like \`sum = 0\` and later \`sum(...)\`)?` },
  // Region 4: dictionaries, sets, classes
  { lang: 'python', test: /'dict' object has no attribute 'add'/, explain: () => '`{}` makes an empty **dictionary**. For an empty set, write `set()`.' },
  { lang: 'python', test: /'dict' object has no attribute '(append|extend|insert|remove|sort|push|length|count|index)'/, explain: (m) => `A dictionary has no \`.${m[1]}\`. To add or change a key, write \`d[key] = value\`. If a value is a list, change that list: \`d[key].${m[1] === 'push' ? 'append' : m[1]}(...)\`.` },
  { lang: 'python', test: /'dict' object has no attribute '(\w+)'/, explain: (m) => `Dictionaries use brackets: \`d["${m[1]}"]\`, not \`d.${m[1]}\` (that's JavaScript).` },
  { lang: 'python', test: /'(?!NoneType'|str'|list'|dict'|set'|int'|float')([A-Z]\w*|\w+)' object is not subscriptable/, explain: (m) => `A \`${m[1]}\` is an object, not a dictionary: read its data with a dot, like \`thing.name\`, not \`thing["name"]\`.` },
  // Your own class (capitalised, not NoneType). Python's "Did you mean" points at a typo'd method.
  { lang: 'python', test: /'(?!NoneType')([A-Z]\w*)' object has no attribute '(\w+)'(?:\. Did you mean: '(\w+)')?/, explain: (m) => (m[3] ? `This \`${m[1]}\` has no \`${m[2]}\`. Did you mean \`${m[3]}\`?` : `This \`${m[1]}\` has no \`${m[2]}\`. In \`__init__\`, store it with \`self.${m[2]} = ...\`. Without \`self.\` it's just a local variable that disappears when \`__init__\` ends.`) },
  { lang: 'python', test: /^(\w+)\.(\w+)\(\) takes (\d+) positional arguments? but (\d+) (?:was|were) given/, explain: (m) => (Number(m[4]) === Number(m[3]) + 1 ? `Every method needs \`self\` as its first parameter: \`def ${m[2]}(self, ...):\`. Python passes the object in for you.` : `\`${m[2]}()\` was given ${Number(m[4]) - 1} value${Number(m[4]) === 2 ? '' : 's'} but takes ${Number(m[3]) - 1} (not counting \`self\`). Make the call match the \`def\` line.`) },
  { lang: 'python', test: /^(\w+)\(\) takes no arguments/, explain: () => 'Your class has no working `__init__`. Check the spelling: two underscores on each side, `__init__`.' },
  { lang: 'python', test: /(\w+)\.__init__\(\) missing \d+ required positional arguments?: (.+)$/, explain: (m) => `Creating a \`${m[1]}\` needs ${m[2]}: put them in the brackets, \`${m[1]}(...)\`.` },
  { lang: 'python', test: /(\w+)\.(\w+)\(\) missing 1 required positional argument: 'self'/, explain: (m) => `Call methods on an object, not on the class: make one first (\`thing = ${m[1]}(...)\`), then \`thing.${m[2]}()\`.` },
  { lang: 'python', test: /dictionary changed size during iteration/, explain: () => 'You added or removed keys while looping over the dictionary. Loop over a copy instead: `for k in list(d):`.' },
  { lang: 'python', test: /unhashable type: '(\w+)'/, explain: (m) => `Keys (and set items) must be values that can't change, like strings or numbers. A ${m[1]} can change, so it can't be one.` },
  { lang: 'python', test: /^'(.+)'$/, explain: (m) => `There's no key ${codeSpan(`'${m[1]}'`)} in the dictionary. Check with \`if key in d:\` first, or use \`d.get(key, default)\`.` },
  { lang: 'javascript', test: /Class constructor (\w+) cannot be invoked without 'new'/, explain: (m) => `Create objects with \`new\`: \`new ${m[1]}(...)\`.` },
  { lang: 'javascript', test: /Private field '#(\w+)' must be declared in an enclosing class/, explain: (m) => `\`#${m[1]}\` is private: only the class's own methods can touch it. Call one of its methods instead.` },
  { lang: 'python', test: /^([\w.]+)\(\) takes (\d+) positional arguments? but (\d+) (?:was|were) given/, explain: (m) => `\`${m[1]}()\` was defined with ${m[2]} parameter${m[2] === '1' ? '' : 's'}, but you passed ${m[3]} value${m[3] === '1' ? '' : 's'}. Make the call match the \`def\` line.` },
  { lang: 'python', test: /^([\w.]+)\(\) missing (\d+) required positional arguments?: (.+)$/, explain: (m) => `\`${m[1]}()\` needs a value for ${m[3]}. Put it inside the brackets when you call it, like \`${m[1]}(...)\`.` },
  { lang: 'python', test: /cannot access local variable '(\w+)'|local variable '(\w+)' referenced before assignment/, explain: (m) => `Because the function **changes** \`${m[1] ?? m[2]}\`, Python treats it as a brand-new local variable, which has no value yet. Pass the value in as a parameter and \`return\` the new value instead.` },
  { lang: 'python', test: /'NoneType' object|NoneType/, explain: () => 'A value is `None`: "nothing". This usually means a function **printed** its answer instead of **returning** it, or a method like `.sort()` changed a list in place and returned nothing.' },
  { lang: 'python', test: /'list' object has no attribute '(push|length|size)'/, explain: (m) => (m[1] === 'push' ? 'Python lists use `.append(x)` to add an item (`push` is JavaScript).' : 'Python uses `len(my_list)` for the length of a list.') },
  { lang: 'python', test: /'str' object does not support item assignment/, explain: () => 'Strings can\'t be changed in place. Build a new string instead, e.g. `"B" + word[1:]`, and store it.' },
  { lang: 'python', test: /'(\w+)' object is not iterable/, explain: (m) => `You can only loop over things with several items (a list, a string, a \`range\`), not a single ${m[1]}.` },
  { lang: 'python', test: /list index out of range|string index out of range/, explain: () => 'That position is past the end. Positions run from 0 to `len(...) - 1`; use `[-1]` for the last item.' },
  { lang: 'javascript', test: /\.(append) is not a function/, explain: () => 'JavaScript arrays use `.push(x)` to add an item (`append` is Python).' },
  { lang: 'javascript', test: /^len is not defined/, explain: () => 'JavaScript uses `.length` (no brackets) for the length of an array or string, e.g. `items.length`.' },
  { lang: 'javascript', test: /Cannot assign to read only property '\d+' of string/, explain: () => 'Strings can\'t be changed in place. Build a new string instead, e.g. `"B" + word.slice(1)`, and store it.' },
  { lang: 'javascript', test: /Cannot read properties of undefined \(reading '(\w+)'\)/, explain: (m) => `You used \`.${m[1]}\` on \`undefined\`. Often a function didn't \`return\` anything, an array position was past the end (positions go from 0 to \`length - 1\`), or a key isn't in the object.` },
  { lang: 'javascript', test: /Invalid or unexpected token/, explain: () => 'There\'s a character JavaScript doesn\'t understand here. Often it\'s a string missing its closing quote, or a `#` comment (JavaScript comments start with `//`).' },
  { lang: 'javascript', test: /^([\w$.]+) is not a function/, explain: (m) => `\`${m[1]}\` isn't a function. Check the spelling and capital letters: JavaScript is case-sensitive (\`console.log\`, not \`console.Log\`).` },
  { lang: 'javascript', test: /^([\w$]+) is not defined/, explain: (m) => `JavaScript doesn't know the name \`${m[1]}\`. Check the spelling and capitals (\`console\`, not \`Console\`). If you meant **text**, put it in quotes: \`"${m[1]}"\`.` },
  { lang: 'javascript', test: /Cannot read properties of (undefined|null)/, explain: (m) => `You used \`.\` on a value that is \`${m[1]}\`, so there's nothing to read from. Check the variable has a value, and that functions \`return\` what you need.` },
  { lang: 'javascript', test: /Assignment to constant variable/, explain: () => 'You tried to change a `const`. Use `let` for variables whose value changes.' },
  { lang: 'javascript', test: /Unterminated string/, explain: () => 'A string is missing its closing quote. Every `"` needs a partner on the same line.' },
  { lang: 'python', test: /name '([A-Z]\w*)' is not defined/, explain: (m) => `Python doesn't know \`${m[1]}\`. If you meant the **text** ${m[1]}, put it in quotes: \`"${m[1]}"\`. If it's a command, check the capitals: Python commands are lowercase (\`print\`, not \`Print\`).` },
  { lang: 'python', test: /name '(\w+)' is not defined/, explain: (m) => `Python doesn't know the name \`${m[1]}\`. Check the spelling. If you meant **text**, put it in quotes: \`"${m[1]}"\`. If it's a variable, give it a value first.` },
  { lang: 'python', test: /unterminated string literal/, explain: () => 'A string is missing its closing quote. Every `"` needs a partner on the same line.' },
  { lang: 'python', test: /expected ':'/, explain: () => 'A line that starts a block (`if`, `else`, `for`, `while`, `def`) must end with a colon `:`.' },
  { lang: 'python', test: /can only concatenate str \(not "(\w+)"\) to str/, explain: (m) => `You tried to join text with a ${m[1]}. Convert the number with \`str()\`, or use an f-string.` },
  { lang: 'python', test: /unsupported operand type\(s\) for .*: '(\w+)' and '(\w+)'/, explain: (m) => `Python can't combine a \`${m[1]}\` and a \`${m[2]}\` with that operator. Convert one of them first (\`int()\` or \`str()\`).` },
  { lang: 'python', test: /invalid literal for int\(\) with base 10: '(.*)'/, explain: (m) => `\`int()\` can't turn ${codeSpan(`"${m[1]}"`)} into a whole number.` },
];

export function explainError(name: string, message = '', language: Lang = 'python'): string {
  for (const rule of MESSAGE_RULES) {
    // A bare quoted message is only a missing key for KeyError.
    if (rule.test.source === "^'(.+)'$" && name !== 'KeyError') continue;
    if (rule.lang && rule.lang !== language) continue;
    const m = message.match(rule.test);
    if (m) return rule.explain(m);
  }
  const table = language === 'python' ? PYTHON : JAVASCRIPT;
  return table[name] ?? SHARED[name] ?? 'Something went wrong while running your code. Read the message and check the line it points to.';
}

export function kindForError(name: string): ExecErrorKind {
  if (name === 'SyntaxError' || name === 'IndentationError' || name === 'TabError') return 'syntax';
  if (name === 'GridError') return 'robot';
  if (name === 'OutputLimitError') return 'output-limit';
  if (name === 'TimeoutError') return 'timeout';
  if (name === 'LoadError') return 'internal';
  return 'runtime';
}

const indentOf = (line: string) => line.match(/^\s*/)![0].length;

/** The lines of a Python class body, and the parent class named in its `class` line. */
function pythonClass(code: string, name: string): { parent?: string; body: string } | undefined {
  const lines = code.split('\n');
  const start = lines.findIndex((l) => new RegExp(`^\\s*class\\s+${name}\\b`).test(l));
  if (start < 0) return undefined;
  const indent = indentOf(lines[start]!);
  const body: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (line.trim() && indentOf(line) <= indent) break;
    body.push(line);
  }
  return { parent: lines[start]!.match(/class\s+\w+\s*\(\s*(\w+)\s*\)/)?.[1], body: body.join('\n') };
}

/** Region 5 mistakes that the message alone can't tell apart (spec E3: context rules). */
function refinePythonRegion5(message: string, code: string): string | undefined {
  // sorted(items, key=hp_of()): the function was called instead of passed.
  const called = message.match(/^(\w+)\(\) missing 1 required positional argument/)?.[1];
  if (called && new RegExp(`key\\s*=\\s*${called}\\s*\\(\\s*\\)`).test(code)) {
    return `You **called** \`${called}()\` with empty brackets where a function was expected. Pass the function itself: \`key=${called}\`.`;
  }
  // A closure assigning to the outer function's variable without `nonlocal`.
  const unbound = message.match(/cannot access local variable '(\w+)'|local variable '(\w+)' referenced before assignment/);
  if (unbound) {
    const name = unbound[1] ?? unbound[2]!;
    const lines = code.split('\n');
    const indents = (re: RegExp) => lines.filter((l) => re.test(l)).map(indentOf);
    const outer = indents(new RegExp(`^\\s+${name}\\s*=(?!=)`));
    const innerDefs = indents(/^\s+def\s+\w+/);
    const changes = indents(new RegExp(`^\\s+${name}\\s*(?:[-+*/%]|//)?=(?!=)`));
    if (outer.some((a) => innerDefs.some((d) => d >= a && changes.some((c) => c > d)))) {
      return `Assigning to \`${name}\` inside the inner function makes a brand-new local \`${name}\`. To change the outer one, put \`nonlocal ${name}\` as the first line of the inner function.`;
    }
  }
  // A subclass __init__ that never runs the parent's.
  const missing = message.match(/'(\w+)' object has no attribute '(\w+)'/);
  if (missing) {
    const [, cls, attr] = missing;
    const child = pythonClass(code, cls!);
    if (child?.parent && /def\s+__init__\s*\(/.test(child.body) && !new RegExp(`super\\(\\s*\\)\\s*\\.\\s*__init__|\\b${child.parent}\\.__init__`).test(child.body)) {
      const parent = pythonClass(code, child.parent);
      if (parent && new RegExp(`self\\.${attr}\\s*=`).test(parent.body)) {
        return `\`${cls}\` has its own \`__init__\`, which replaces the parent's. Call \`super().__init__(...)\` first so the parent sets \`${attr}\`.`;
      }
    }
  }
  return undefined;
}

function refineJavaScriptRegion5(message: string, code: string): string | undefined {
  if (/Cannot read properties of undefined/.test(message)) {
    // [...xs].sort(byPoints()): the compare function ran with no arguments.
    const call = code.match(/\.(sort|map|filter|reduce|forEach)\(\s*(\w+)\s*\(\s*\)\s*\)/);
    if (call) return `You called the function inside \`.${call[1]}( )\`. Pass the function itself, without brackets: \`.${call[1]}(${call[2]})\`.`;
    // { reveal: board.reveal }: a method taken off its object loses `this`.
    for (const m of code.matchAll(/:\s*(\w+)\.(\w+)\s*[,}]/g)) {
      const def = code.match(new RegExp(`^\\s*(?:async\\s+)?${m[2]}\\s*\\(([^)]*)\\)\\s*\\{`, 'm'));
      if (def) {
        const params = def[1]!.trim();
        return `A method taken off its object (\`${m[1]}.${m[2]}\`) forgets its \`this\`. Wrap it: \`(${params}) => ${m[1]}.${m[2]}(${params})\`.`;
      }
    }
  }
  // actions[letter]() where the table stored move() (its result) or lacks the key.
  if (/^.+\[.+\] is not a function/.test(message) && /\w+\[\w+\]\(\)/.test(code)) {
    return 'The table holds `undefined` there. Did you store `move()` (its result) instead of `move`, or is the key missing from the table?';
  }
  return undefined;
}

/**
 * Sharpen an explanation using the learner's code (the plain message isn't enough):
 * undefined commands vs. missing quotes, Python/JS spelling mix-ups like `else if` / `elif`.
 */
export function refineExplanation(
  error: { name: string; message: string; line?: number; friendly: string },
  code: string,
  language: Lang,
  /** A "did you mean" candidate found by the caller (e.g. by edit distance). */
  suggested?: string,
): string {
  const lineText = error.line ? (code.split('\n')[error.line - 1] ?? '') : '';
  if (language === 'python' && /\belse\s+if\b/.test(lineText)) return 'Python spells "else if" as one word: `elif`.';
  // Two commands glued together, e.g. from tapping command buttons: move()move()
  if (error.name === 'SyntaxError' && /\)\s*[A-Za-z_]\w*\s*\(/.test(lineText)) {
    return 'Two commands are stuck together on one line. Put each command on its own line.';
  }
  if (language === 'javascript' && /\belif\b/.test(lineText)) return 'JavaScript writes `else if`, not `elif`.';
  const region5 = language === 'python' ? refinePythonRegion5(error.message, code) : refineJavaScriptRegion5(error.message, code);
  if (region5) return region5;
  // An error the learner's own code raised on purpose (error-handling levels) isn't a mistake
  // in itself: what's missing is the try/except around the call.
  const raisedHere =
    language === 'python'
      ? new RegExp(`\\braise\\s+${error.name}\\b`).test(lineText)
      : /\bthrow\b/.test(lineText);
  if (raisedHere) {
    return language === 'python'
      ? `Your code raised this \`${error.name}\` on purpose, and nothing caught it. Call the function inside \`try:\` and handle it in \`except ${error.name}:\`.`
      : `Your code threw this error on purpose, and nothing caught it. Call the function inside \`try { }\` and handle it in \`catch (err) { }\`.`;
  }
  if (error.name === 'KeyError' && /\+=\s*1/.test(lineText)) {
    return 'The first time you count something, it isn\'t in the dictionary yet, so there\'s nothing to add 1 to. Use `d[k] = d.get(k, 0) + 1`.';
  }
  if (language === 'javascript' && /\.push is not a function/.test(error.message) && /new\s+Set\b/.test(code)) {
    return 'Sets use `.add(x)` (`push` is for arrays).';
  }
  if (language === 'javascript' && /\.add is not a function/.test(error.message) && /=\s*\{\s*\}/.test(code)) {
    return '`{}` is an empty **object**. For a set, write `new Set()`.';
  }
  const missing = error.message.match(language === 'python' ? /name '(\w+)' is not defined/ : /^([\w$]+) is not defined/)?.[1];
  const owner = language === 'python' ? 'self' : 'this';
  if (missing && new RegExp(`\\b${owner}\\.${missing}\\b`).test(code)) {
    return `Inside a method, the object's data is \`${owner}.${missing}\`, not just \`${missing}\`.`;
  }
  const missingMethod = language === 'python' ? error.message.match(/'([A-Z]\w*)' object has no attribute '(\w+)'$/) : null;
  if (missingMethod && new RegExp(`\\.${missingMethod[2]}\\s*\\(`).test(code) && new RegExp(`^def\\s+${missingMethod[2]}\\b`, 'm').test(code)) {
    return `\`${missingMethod[2]}\` is defined, but not **inside** the class: its \`def\` line isn't indented under \`class ${missingMethod[1]}:\`. Indent it (and its body) so it becomes a method.`;
  }
  const unbound = language === 'python' && error.message.match(/cannot access local variable '(\w+)'|local variable '(\w+)' referenced before assignment/);
  if (unbound) {
    const name = unbound[1] ?? unbound[2]!;
    // No outer variable with that name: it was only given a value on some paths (if/try).
    if (!new RegExp(`^${name}\\s*[-+*/]?=`, 'm').test(code)) {
      return `\`${name}\` only gets a value on some paths through the function (inside an \`if\`, a loop, or a \`try\`), and this run took a path that skipped it. Give \`${name}\` a value first, before the \`if\`/\`try\`.`;
    }
  }
  const undefinedName =
    language === 'python'
      ? error.message.match(/name '(\w+)' is not defined/)?.[1]
      : error.message.match(/^([\w$]+) is not defined/)?.[1];
  if (!undefinedName) return error.friendly;
  // Language mix-ups (print/console/true/false/null) already have specific advice.
  if (/^(print|console|true|false|null)$/.test(undefinedName)) return error.friendly;
  if (language === 'javascript' && /^(True|False|None)$/.test(undefinedName)) {
    return `JavaScript writes \`${undefinedName === 'None' ? 'null' : undefinedName.toLowerCase()}\` in lowercase.`;
  }
  if (/^turn_?[rR]ight$/.test(undefinedName)) {
    const def = language === 'python' ? '`def turn_right():`' : '`function turnRight() { ... }`';
    return `The robot only knows how to turn left. Every program starts fresh, so define your right turn first with ${def} (three left turns) before using it.`;
  }
  const suggestion = suggested ?? (language === 'python' ? error.message.match(/Did you mean: '(\w+)'/)?.[1] : undefined);
  const called = new RegExp(`\\b${undefinedName}\\s*\\(`).test(code);
  if (called) {
    return `There's no command called \`${undefinedName}\`.${suggestion ? ` Did you mean \`${suggestion}\`?` : ''} Check the spelling and capitals, or define it first with ${language === 'python' ? '`def`' : '`function`'}.`;
  }
  if (suggestion) return `${language === 'python' ? 'Python' : 'JavaScript'} doesn't know \`${undefinedName}\`. Did you mean \`${suggestion}\`?`;
  return error.friendly;
}
