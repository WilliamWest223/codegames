import type { Level } from '@codegames/shared';
import { code, grid } from '../../helpers';
import { lang } from '../../localize';
import { PRINT, NO_LITERAL_PRINT } from './shared';

/** variables levels, in play order. */
export const variablesLevels: Level[] = [
  {
    id: 'variables-1',
    conceptId: 'variables',
    title: 'Name Tags',
    role: 'intro',
    game: 'predict-output',
    mode: 'hybrid',
    choices: { python: ["Robo\n3\nRobo-2", "name\nage\nname", "Robo-2\n3\nRobo-2", "Robo\n3\nRobo"], javascript: ["Robo\n3\nRobo-2", "name\nage\nname", "Robo-2\n3\nRobo-2", "Robo\n3\nRobo"] },
    prompt: 'A **variable** is a name tag stuck on a value. The `=` sign means "store this value under this name". Predict the output, and watch what happens when a variable gets a new value.',
    reinforces: ['output'],
    hints: ['A variable always holds its most recent value.', 'Printing a variable prints its value, not its name.'],
    code: code(
      `
      name = "Robo"
      age = 3
      print(name)
      print(age)
      name = "Robo-2"
      print(name)
      `,
      `
      let name = "Robo";
      let age = 3;
      console.log(name);
      console.log(age);
      name = "Robo-2";
      console.log(name);
      `,
    ),
    takeaway: lang(
      'In Python you create a variable just by assigning to it: `score = 0`.',
      'In JavaScript you declare a variable with `let` (can be reassigned) or `const` (can\'t be reassigned), then assign with `=`.',
    ),
  },
  {
    id: 'variables-2',
    conceptId: 'variables',
    title: 'Hero Card',
    role: 'combine',
    game: 'build-it',
    mode: 'fill-blanks',
    prompt: 'Fill in the blanks so the hero card prints:\n\n```\nHero: Ari\nLevel: 7\n```\n\nThe text `"Ari"` needs quotes; the number `7` does not.',
    reinforces: ['output', 'sequencing'],
    hints: ['Replace each ___ with a value.', lang('`hero = "Ari"`', '`const hero = "Ari";`')],
    starterCode: code(
      `
      hero = ___
      level = ___
      print("Hero:", hero)
      print("Level:", level)
      `,
      `
      const hero = ___;
      const level = ___;
      console.log("Hero:", hero);
      console.log("Level:", level);
      `,
    ),
    solution: code(
      `
      hero = "Ari"
      level = 7
      print("Hero:", hero)
      print("Level:", level)
      `,
      `
      const hero = "Ari";
      const level = 7;
      console.log("Hero:", hero);
      console.log("Level:", level);
      `,
    ),
    tests: [{ name: 'prints the card', expectedOutput: 'Hero: Ari\nLevel: 7' }],
    parallelExample: {
      prompt: 'A **pet card** works the same way: one variable holds text (in quotes), the other a number (no quotes), and each print line uses one of them.',
      code: code(
        `
        pet = "Milo"
        age = 3
        print("Pet:", pet)
        print("Age:", age)
        `,
        `
        const pet = "Milo";
        const age = 3;
        console.log("Pet:", pet);
        console.log("Age:", age);
        `,
      ),
    },
    takeaway: `${PRINT} can show several values at once: separate them with commas and it adds a space between them.`,
  },
  {
    id: 'variables-6',
    conceptId: 'variables',
    title: 'Lost Value',
    role: 'combine',
    game: 'parsons',
    mode: 'parsons',
    prompt: 'Put the lines in order to **swap** `a` and `b` so the program prints `dogs` then `cats`. One line is a trap that would lose a value forever.',
    reinforces: ['output', 'sequencing'],
    hints: ['Before you overwrite `a`, save its value somewhere.', 'Order: save a in temp, copy b into a, copy temp into b, then print.', 'The trap is `b = a`: by then, `a` already holds "dogs".'],
    solution: code(
      `
      a = "cats"
      b = "dogs"
      temp = a
      a = b
      b = temp
      print(a)
      print(b)
      `,
      `
      let a = "cats";
      let b = "dogs";
      const temp = a;
      a = b;
      b = temp;
      console.log(a);
      console.log(b);
      `,
    ),
    distractors: { python: ['b = a'], javascript: ['b = a;'] },
    tests: [{ name: 'swapped', expectedOutput: 'dogs\ncats' }],
  },
  {
    id: 'variables-4',
    conceptId: 'variables',
    title: 'Follow the Tags',
    role: 'combine',
    game: 'predict-output',
    mode: 'hybrid',
    prompt: 'Two tricky ideas: what happens when one variable is set from another, and what `score = score + 10` means. Remember: a variable is a name tag pointing at a value. Predict the output.',
    reinforces: ['output', 'sequencing'],
    hints: ['`b = a` makes b point at the value a has **right now**. Changing a later does not change b.', '`score = score + 10` is an instruction, not an equation: work out the right side using the old value, then store it.'],
    code: code(
      `
      a = 5
      b = a
      a = 7
      print(a, b)
      score = 0
      score = score + 10
      score = score + 10
      print(score)
      `,
      `
      let a = 5;
      const b = a;
      a = 7;
      console.log(a, b);
      let score = 0;
      score = score + 10;
      score = score + 10;
      console.log(score);
      `,
    ),
    takeaway: '`=` is an instruction ("store this"), not a math equation. The right side is worked out first, using the values variables have at that moment.',
    investigate: [
      {
        question: 'Why does `b` keep its old value after `a` changes?',
        choices: ['`b = a` stored the value `a` had at that moment; changing `a` later doesn\'t touch `b`', '`b` is linked to `a`, so the output is a mistake', 'A variable can only be changed once'],
        answer: 0,
      },
      {
        question: 'What does `score = score + 10` do?',
        choices: ['Works out the old score plus 10, then stores the result back in `score`', 'Checks whether `score` equals `score + 10`', 'Creates a second variable called `score`'],
        answer: 0,
      },
    ],
  },
  {
    id: 'variables-5',
    conceptId: 'variables',
    title: 'Step Counter',
    role: 'combine',
    game: 'grid-quest',
    mode: 'fill-blanks',
    prompt: 'Variables work with the robot too! Set `steps` to the number of steps to the gem. The loop uses `steps`, and the robot reports the distance when it\'s done.',
    reinforces: ['repeat', 'output'],
    hints: ['Count the floor tiles between the robot and the gem, including the gem tile.', 'The gem is 6 steps away.'],
    grid: grid(`
      #########
      #>.....G#
      #########
    `),
    starterCode: code(
      `
      steps = ___
      for i in range(steps):
          move()
      collect()
      print("Moved", steps, "steps")
      `,
      `
      const steps = ___;
      for (let i = 0; i < steps; i++) {
        move();
      }
      collect();
      console.log("Moved", steps, "steps");
      `,
    ),
    solution: code(
      `
      steps = 6
      for i in range(steps):
          move()
      collect()
      print("Moved", steps, "steps")
      `,
      `
      const steps = 6;
      for (let i = 0; i < steps; i++) {
        move();
      }
      collect();
      console.log("Moved", steps, "steps");
      `,
    ),
    expectedOutput: 'Moved 6 steps',
    requirements: {
      python: [
        { pattern: 'range\\(\\s*steps\\s*\\)', message: 'Keep the loop using steps.' },
        { pattern: '(move\\(\\)[\\s\\S]*){2}', forbid: true, message: 'Let the loop do the walking: write move() only once.' },
      ],
      javascript: [
        { pattern: 'i\\s*<\\s*steps', message: 'Keep the loop using steps.' },
        { pattern: '(move\\(\\)[\\s\\S]*){2}', forbid: true, message: 'Let the loop do the walking: write move() only once.' },
      ],
    },
  },
  {
    id: 'variables-3',
    conceptId: 'variables',
    title: 'Swap Places',
    role: 'integrate',
    game: 'build-it',
    mode: 'guided',
    prompt: 'Swap the values of `a` and `b`, so the program prints `dogs` then `cats`.\n\nDon\'t retype the words. Use a third name to hold on to the first value while you re-point `a` to the second one.',
    reinforces: ['output', 'sequencing'],
    hints: ['Save a in a temporary variable first.', 'Then copy b into a, and the temporary value into b.'],
    starterCode: code(
      `
      a = "cats"
      b = "dogs"
      # Swap a and b here

      print(a)
      print(b)
      `,
      `
      let a = "cats";
      let b = "dogs";
      // Swap a and b here

      console.log(a);
      console.log(b);
      `,
    ),
    solution: code(
      `
      a = "cats"
      b = "dogs"
      temp = a
      a = b
      b = temp
      print(a)
      print(b)
      `,
      `
      let a = "cats";
      let b = "dogs";
      const temp = a;
      a = b;
      b = temp;
      console.log(a);
      console.log(b);
      `,
    ),
    tests: [{ name: 'swapped', expectedOutput: 'dogs\ncats' }],
    requirements: {
      python: [...NO_LITERAL_PRINT.python, { pattern: 'print\\(a\\)[\\s\\S]*print\\(b\\)', message: 'Keep print(a) before print(b): swap the values, not the print lines.' }, { pattern: '(dogs[\\s\\S]*){2}|(cats[\\s\\S]*){2}', forbid: true, message: "Don't retype the words: move the values between variables." }],
      javascript: [...NO_LITERAL_PRINT.javascript, { pattern: 'console\\.log\\(a\\)[\\s\\S]*console\\.log\\(b\\)', message: 'Keep console.log(a) before console.log(b): swap the values, not the log lines.' }, { pattern: '(dogs[\\s\\S]*){2}|(cats[\\s\\S]*){2}', forbid: true, message: "Don't retype the words: move the values between variables." }],
    },
    takeaway: lang('Python also has a shortcut: `a, b = b, a` swaps in one line. Knowing the three-step way helps you understand what it does.', 'JavaScript also has a shortcut: `[a, b] = [b, a]` swaps in one line. Knowing the three-step way helps you understand what it does.'),
    variants: [
      {
        name: 'different animals',
        replace: {
          python: [['a = "cats"', 'a = "owls"'], ['b = "dogs"', 'b = "bats"']],
          javascript: [['let a = "cats";', 'let a = "owls";'], ['let b = "dogs";', 'let b = "bats";']],
        },
        expectedOutput: 'bats\nowls',
      },
    ],
  },
];
