# CodeGames

Learn to code from the ground up by playing games.

CodeGames teaches **Python** and **JavaScript** from "Hello, World!" to classes and a
text-adventure engine, through games where **the code is the game**. Everything runs in your
browser, works offline, and keeps your progress on your own device: no account, no tracking.

> Status: Python and JavaScript, Regions 0–7: 238 levels per language (plus a JavaScript-only
> **Web Pages side quest**: 13 levels driving a real page with the DOM), from first commands
> through functions, lists, strings, errors, dictionaries, sets and classes, then functions as
> values, closures, recursion, inheritance and polymorphism, ending with a playable
> Minesweeper you build yourself. Plus an optional **Security side quest**
> (13 levels after Hangman). Java and C++ are planned (a local runner exists as a skeleton).

## Using CodeGames

**Start.** Open the app, pick Python or JavaScript, and press **Start here**. The world map
shows where you are; **Continue** always takes you back to where you left off.

**How each concept is taught** (grounded in learning-science research):
1. **Read before you write.** Predict what real code prints, first by picking from choices,
   later by typing it. Some levels then ask *why* it printed that (Investigate), and many ask
   you to *modify* the code (PRIMM: predict → run → investigate → modify → make).
2. **Arrange, fill in, then write.** Code puzzles (Parsons), fill-in-the-blanks, guided
   writing with tests, and finally open challenges.
3. **Every level builds on earlier ones**, so old skills keep getting practice.

**Games:** Robot Quest (program a robot through a maze), Predict the Output, Code Puzzle,
Bug Hunt, Build It, and a boss at the end of every region: Robot Rescue, Receipt Printer,
Guessing Game, Hangman, Text Adventure and Minesweeper. Bosses you build can be played with **🎮 Play it**.

**Make your own.** After beating Hangman you can write your own word list, and after the Text
Adventure your own world, then play them with the engine you built. Both can be downloaded as a
`.py`/`.js` file and opened again later. Nothing there is graded.

**Security side quest (optional).** After Hangman, a side branch teaches defensive basics:
encoding, toy ciphers, password fingerprints with salt, input validation, and a boss called The
Vault. Every target is fictional and local, and every toy is labelled *not real security*.
Beating it earns a Security patch next to your belt.

**When you're stuck:**
- **💡 Hints** go from a gentle nudge to the answer.
- **👣 Step through** runs your program one line at a time and shows every variable.
- After two failed checks, **🧩 Try it as a puzzle** gives you the lines to arrange. If the
  puzzle is still tricky, some levels show **a similar problem, worked out**.
- Errors are explained in plain words. If the same kind keeps coming back, you get a short
  refresher on it, often with a link to a bug-hunt level that practices that fix.
- Finished with help? **↺ Try it again from scratch** for full stars.

**Progress that means something:**
- **Belts** (White → Yellow → Orange) are earned only by beating bosses, which you write on
  your own.
- Each concept climbs **Learned → Practiced → Proficient**. Proficient comes from using a
  concept again later *on your own* (or recalling it in warm-ups).
- **Warm-ups** bring back earlier concepts on a spaced schedule, and things you needed help
  with come back sooner.
- **Your journal** (click your belt) shows what you can do now, your own words about your
  programs, the programs you built, and honest numbers.

**Habits, your way.** Choose a daily goal (1, 3 or 5 levels). Meeting it earns a **streak
freeze**, so a missed day doesn't break your streak.

**Shortcuts:** `Ctrl/⌘ + Enter` checks your code · `?` opens the glossary · `Esc` closes dialogs.

**Your data.** Progress lives in your browser (localStorage). Use **⋯ → Export progress** to
back it up or move it to another browser, and **Import progress…** to restore it. Clearing the
browser's site data erases it.

**Install / offline.** In a production build (`npm run build && npm run preview`), the
browser offers to install CodeGames as an app. After Python has loaded once, everything works
offline.

**For parents and teachers.** The journal shows the share of levels solved without help and
the error kinds a learner meets most. There are no leaderboards, ads or accounts, and nothing
leaves the device.

## Getting started

Requirements: **Node.js 20+**. For Java and C++ levels, also install a **JDK** (`javac`) and
**g++**.

```bash
npm install
npm run dev          # web app → http://localhost:5173
npm run dev:runner   # (optional, future) Java/C++ runner → http://127.0.0.1:4317
```

Python runs in your browser through Pyodide, served from `node_modules`, so no internet
connection is needed after `npm install`. Progress is saved in your browser's localStorage.

## Project structure

```
apps/
  web/          React + TypeScript + Vite front end
  runner/       Local server that compiles and runs Java & C++ (future)
packages/
  shared/       Shared TypeScript types
  runtime/      Runs learner code (JS, Python via Pyodide, robot world) and grades it
  curriculum/   World-map concepts, levels, and mastery logic
e2e/            Playwright end-to-end tests
```


## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Start the web app |
| `npm run dev:runner` | Start the Java/C++ runner |
| `npm run dev:all` | Start both |
| `npm run typecheck` | Typecheck all workspaces |
| `npm run build` | Production build |
| `npm test` | Unit + curriculum tests (runs every level's solution in both languages) |
| `npm run test:e2e` | End-to-end browser tests |
