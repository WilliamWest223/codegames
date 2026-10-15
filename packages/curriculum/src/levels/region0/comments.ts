import type { Level } from '@codegames/shared';
import { code, grid } from '../../helpers';
import { lang } from '../../localize';

/** comments levels, in play order. */
export const commentsLevels: Level[] = [
  {
    id: 'comments-1',
    conceptId: 'comments',
    title: 'Invisible Notes',
    role: 'intro',
    game: 'predict-output',
    mode: 'hybrid',
    choices: { python: ["You can see me\nComments are for humans", "You can see me\nBut not me\nComments are for humans", "You can see me\nComments are for humans  # this part is skipped too", "This line is a comment. Python skips it.\nYou can see me\nComments are for humans"], javascript: ["You can see me\nComments are for humans", "You can see me\nBut not me\nComments are for humans", "You can see me\nComments are for humans // this part is skipped too", "This line is a comment. JavaScript skips it.\nYou can see me\nComments are for humans"] },
    prompt: `Lines starting with ${lang('`#`', '`//`')} are **comments**: notes for humans that the computer skips. What does this print?`,
    reinforces: ['output'],
    hints: ['Ignore everything after the comment symbol on each line.', 'Line 3 is entirely a comment, even though it contains a print. Line 4 prints, then the comment after it is skipped.'],
    code: code(
      `
      # This line is a comment. Python skips it.
      print("You can see me")
      # print("But not me")
      print("Comments are for humans")  # this part is skipped too
      `,
      `
      // This line is a comment. JavaScript skips it.
      console.log("You can see me");
      // console.log("But not me");
      console.log("Comments are for humans"); // this part is skipped too
      `,
    ),
    takeaway: 'Comments explain *why* code does something. They are also handy for switching a line off while you experiment.',
  },
  {
    id: 'comments-2',
    conceptId: 'comments',
    title: 'Silence the Spoiler',
    role: 'combine',
    game: 'bug-hunt',
    mode: 'fill-blanks',
    prompt: `This story leaks a spoiler! **Comment out** the spoiler line (don't delete it) so the program prints:\n\n\`\`\`\nThe hero enters the cave...\nTo be continued!\n\`\`\``,
    reinforces: ['output'],
    hints: ['Which line gives away the ending?', `A comment marker makes the rest of the line invisible to the computer.`, `Put ${lang('`#`', '`//`')} at the very start of the spoiler line.`],
    starterCode: code(
      `
      print("The hero enters the cave...")
      print("SPOILER: the dragon is friendly")
      print("To be continued!")
      `,
      `
      console.log("The hero enters the cave...");
      console.log("SPOILER: the dragon is friendly");
      console.log("To be continued!");
      `,
    ),
    solution: code(
      `
      print("The hero enters the cave...")
      # print("SPOILER: the dragon is friendly")
      print("To be continued!")
      `,
      `
      console.log("The hero enters the cave...");
      // console.log("SPOILER: the dragon is friendly");
      console.log("To be continued!");
      `,
    ),
    tests: [{ name: 'no spoilers', expectedOutput: 'The hero enters the cave...\nTo be continued!' }],
    requirements: {
      python: [{ pattern: '#\\s*print\\("SPOILER', message: 'Comment the spoiler line out with # instead of deleting it.' }],
      javascript: [{ pattern: '//\\s*console\\.log\\("SPOILER', message: 'Comment the spoiler line out with // instead of deleting it.' }],
    },
  },
  {
    id: 'comments-3',
    conceptId: 'comments',
    title: 'Debug by Commenting',
    role: 'integrate',
    game: 'grid-quest',
    mode: 'fill-blanks',
    prompt: 'One command makes the robot crash into a wall. Find it and **comment it out** so the robot reaches the gem.\n\nCommenting code out is a handy debugging trick: you can switch lines off without losing them.',
    reinforces: ['sequencing'],
    hints: ['Run it and watch where the robot crashes. Use Step to go one command at a time.', 'The command that causes the crash is the one just before the robot hits the wall.', 'The turn sends the robot into the wall. Comment out that line.'],
    grid: grid(`
      ######
      #>..G#
      ######
    `),
    starterCode: code(
      `
      move()
      move()
      turn_left()
      move()
      collect()
      `,
      `
      move();
      move();
      turnLeft();
      move();
      collect();
      `,
    ),
    solution: code(
      `
      move()
      move()
      # turn_left()
      move()
      collect()
      `,
      `
      move();
      move();
      // turnLeft();
      move();
      collect();
      `,
    ),
    requirements: {
      python: [{ pattern: '#\\s*turn_left\\(\\)', message: 'Comment out the bad command with # instead of deleting it.' }],
      javascript: [{ pattern: '//\\s*turnLeft\\(\\)', message: 'Comment out the bad command with // instead of deleting it.' }],
    },
  },
];
