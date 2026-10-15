import type { Level } from '@codegames/shared';
import { code } from '../../helpers';

/** boss-2 levels, in play order. */
export const boss2Levels: Level[] = [
  {
    id: 'boss-2',
    conceptId: 'boss-2',
    title: 'Guessing Game',
    role: 'boss',
    game: 'build-it',
    mode: 'freeform',
    prompt: `**Boss level!** Build a number-guessing game.\n\nThe first input line is the **secret number**. Each following line is a **guess**. For each guess print \`Too low\`, \`Too high\`, or, when correct, \`Correct! You got it in N tries.\` and stop.\n\nThe player has **5 tries**. Say \`1 try\` (not \`1 tries\`) when they get it first time.\n\nA winning game (secret 7):\n\n\`\`\`\nToo low\nToo high\nCorrect! You got it in 3 tries.\n\`\`\`\n\nA losing game (secret 10, five wrong guesses), with **no** full stop on the last line:\n\n\`\`\`\nToo low\nToo low\nToo low\nToo low\nToo low\nOut of tries! The number was 10\n\`\`\``,
    reinforces: ['while-loops', 'loop-control', 'else-if-chains', 'input', 'type-conversion', 'string-formatting', 'variables'],
    hints: ['Keep a counter of tries.', 'Loop while tries < 5; read a guess each round.', `On a correct guess, print and \`break\`. After the loop, how do you know if they ran out?`],
    starterCode: code('secret = int(input())\n', 'const secret = Number(prompt());\n'),
    solution: code(
      `
      secret = int(input())
      tries = 0
      won = False
      while tries < 5:
          guess = int(input())
          tries += 1
          if guess < secret:
              print("Too low")
          elif guess > secret:
              print("Too high")
          else:
              word = "try" if tries == 1 else "tries"
              print(f"Correct! You got it in {tries} {word}.")
              won = True
              break
      if not won:
          print(f"Out of tries! The number was {secret}")
      `,
      `
      const secret = Number(prompt());
      let tries = 0;
      let won = false;
      while (tries < 5) {
        const guess = Number(prompt());
        tries += 1;
        if (guess < secret) {
          console.log("Too low");
        } else if (guess > secret) {
          console.log("Too high");
        } else {
          const word = tries === 1 ? "try" : "tries";
          console.log(\`Correct! You got it in \${tries} \${word}.\`);
          won = true;
          break;
        }
      }
      if (!won) {
        console.log(\`Out of tries! The number was \${secret}\`);
      }
      `,
    ),
    tests: [
      { name: 'win in 3', phase: '1 · A quick win', input: '7\n3\n9\n7', expectedOutput: 'Too low\nToo high\nCorrect! You got it in 3 tries.' },
      { name: 'first try', phase: '1 · A quick win', input: '50\n50', expectedOutput: 'Correct! You got it in 1 try.' },
      { name: 'out of tries', phase: '2 · Out of luck', input: '10\n1\n2\n3\n4\n5', expectedOutput: 'Too low\nToo low\nToo low\nToo low\nToo low\nOut of tries! The number was 10' },
      { name: 'hidden game', phase: '3 · The rematch', input: '20\n30\n10\n20', expectedOutput: 'Too high\nToo low\nCorrect! You got it in 3 tries.', hidden: true },
      { name: 'win on the last try', phase: '3 · The rematch', input: '9\n1\n2\n3\n4\n9', expectedOutput: 'Too low\nToo low\nToo low\nToo low\nCorrect! You got it in 5 tries.', hidden: true },
    ],
    takeaway: 'You built a complete interactive game: a loop that reads input, decisions that react to it, a counter, and an early exit. Every game loop works like this.',
    play: {
      randomFirstInput: [1, 50],
      intro: "I've secretly picked a number between 1 and 50 and given it to your program as the first input. Can you guess it?",
    },
  },
];
