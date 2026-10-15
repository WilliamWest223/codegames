import type { Concept } from '@codegames/shared';

/**
 * The world map. `requires` builds the unlock graph; every region's boss gates the next.
 * Regions 0–7 and the Security and Web Pages side quests are playable.
 * See docs/concept-ideas.md for the full planned index.
 */
export const concepts: Concept[] = [
  // Region 0: First Steps (logic before syntax)
  { id: 'sequencing', title: 'Step by Step', summary: 'Programs run one instruction at a time, in order.', canDo: 'Put commands in the right order to guide the robot to its goal', region: 0, requires: [] },
  { id: 'output', title: 'Say Hello', summary: 'Printing text to the screen.', canDo: 'Write a program that prints messages on the screen', region: 0, requires: ['sequencing'] },
  { id: 'comments', title: 'Comments', summary: 'Notes for humans that the computer skips.', canDo: 'Add notes for humans to code, and switch a line off by commenting it out', region: 0, requires: ['output'] },
  { id: 'custom-commands', title: 'Your Own Commands', summary: 'Give a group of steps a name and reuse it.', canDo: 'Give a group of steps a name as your own command, and reuse it', region: 0, requires: ['sequencing'] },
  { id: 'repeat', title: 'Repeat', summary: 'Run the same steps several times.', canDo: 'Use a loop to run the same steps many times instead of copying them', region: 0, requires: ['custom-commands'] },
  { id: 'first-errors', title: 'Reading Errors', summary: 'Error messages tell you what went wrong and where.', canDo: 'Read an error message to find the line and the kind of mistake, then fix it', region: 0, requires: ['output', 'custom-commands'] },
  { id: 'boss-0', title: 'Boss: Robot Rescue', summary: 'Guide the robot through the canyon using everything so far.', region: 0, requires: ['comments', 'repeat', 'first-errors'], boss: true },

  // Region 1: Data
  { id: 'variables', title: 'Variables', summary: 'Naming and storing values.', canDo: 'Store values in named variables and update them as the program runs', region: 1, requires: ['boss-0'] },
  { id: 'types', title: 'Types', summary: 'Numbers, text, and true/false are different kinds of values.', canDo: 'Tell numbers, text and true/false values apart, and predict what each one does', region: 1, requires: ['variables'] },
  { id: 'operators', title: 'Operators', summary: 'Math with + - * / and friends.', canDo: 'Do math in code, including whole-number division and remainders', region: 1, requires: ['types'] },
  { id: 'strings-basics', title: 'Text', summary: 'Working with strings: length, letters, upper case.', canDo: 'Find how long a word is, pick out its letters by position, and change its case', region: 1, requires: ['operators'] },
  { id: 'string-formatting', title: 'Formatting', summary: 'Building sentences from values.', canDo: 'Build a sentence that mixes text with values from variables', region: 1, requires: ['strings-basics'] },
  { id: 'type-conversion', title: 'Converting Types', summary: 'Turning text into numbers and back.', canDo: 'Turn text into a number (and back) so you can do math with what was typed', region: 1, requires: ['strings-basics'] },
  { id: 'input', title: 'Input', summary: 'Reading what the user types.', canDo: 'Write a program that asks the user for values and uses their answers', region: 1, requires: ['type-conversion', 'string-formatting'] },
  { id: 'booleans', title: 'True or False', summary: 'Comparisons and logic: and, or, not.', canDo: 'Write comparisons and combine them with and, or and not', region: 1, requires: ['input'] },
  { id: 'boss-1', title: 'Boss: Receipt Printer', summary: 'Read an order and print a perfect receipt.', region: 1, requires: ['booleans'], boss: true },

  // Region 2: Control flow
  { id: 'conditionals', title: 'If / Else', summary: 'Making decisions.', canDo: 'Write an if/else that picks a message from a number the user types', region: 2, requires: ['boss-1'] },
  { id: 'else-if-chains', title: 'Else If', summary: 'Choosing between many options.', canDo: 'Sort a value into one of several groups with an else-if chain, in the right order', region: 2, requires: ['conditionals'] },
  { id: 'while-loops', title: 'While Loops', summary: 'Repeat until something changes.', canDo: 'Repeat steps until something changes, like counting the weeks to reach a savings goal', region: 2, requires: ['conditionals'] },
  { id: 'loops', title: 'For Loops', summary: 'Counting loops and ranges.', canDo: 'Use a for loop to add up or count things from 1 to n', region: 2, requires: ['while-loops', 'else-if-chains'] },
  { id: 'loop-control', title: 'Break & Continue', summary: 'Leaving a loop early or skipping ahead.', canDo: 'Stop a loop early with break, or skip one round with continue', region: 2, requires: ['loops'] },
  { id: 'nested-loops', title: 'Nested Loops', summary: 'Loops inside loops for grids and patterns.', canDo: 'Use a loop inside a loop to draw grids and patterns row by row', region: 2, requires: ['loops', 'else-if-chains'] },
  { id: 'boss-2', title: 'Boss: Guessing Game', summary: 'Build a complete number-guessing game.', region: 2, requires: ['loop-control', 'nested-loops'], boss: true },

  // Region 3: Structure (two branches, functions and lists, merge at iterating-collections)
  { id: 'functions', title: 'Functions with Inputs', summary: 'Commands that take parameters.', canDo: 'Write a function that takes parameters, and call it with different values', region: 3, requires: ['boss-2'] },
  { id: 'return-values', title: 'Return, Not Print', summary: 'Functions that answer with a value.', canDo: 'Write a function that returns an answer for the rest of the program to use', region: 3, requires: ['functions'] },
  { id: 'scope', title: 'Inside and Outside', summary: 'Variables inside functions are separate.', canDo: 'Explain why a variable made inside a function does not change one outside it', region: 3, requires: ['return-values'] },
  { id: 'collections', title: 'Lists & Arrays', summary: 'Storing many values in order.', canDo: 'Keep many values in a list (array), add to it, and read items by their index', region: 3, requires: ['boss-2'] },
  { id: 'iterating-collections', title: 'Looping Over Lists', summary: 'Visiting every item.', canDo: 'Loop over every item in a list (array) to total, count, find or filter', region: 3, requires: ['collections', 'return-values'] },
  { id: 'strings', title: 'String Skills', summary: 'Slicing, splitting, and building text.', canDo: 'Slice, split and join text to pull out or rebuild the parts you need', region: 3, requires: ['iterating-collections'] },
  { id: 'error-handling', title: 'Handling Errors', summary: 'Catching problems instead of crashing.', canDo: 'Catch an error, like bad input, so the program carries on instead of crashing', region: 3, requires: ['iterating-collections'] },
  { id: 'boss-3', title: 'Boss: Hangman', summary: 'Build the classic word-guessing game.', region: 3, requires: ['scope', 'strings', 'error-handling'], boss: true },

  // Region 4: Modeling (spec: docs/audits/round-5/teacher.md Part B). A two-concept trunk opens
  // three parallel tracks: data (sets, nested-data) and model (classes → methods → encapsulation).
  { id: 'maps', title: 'Dictionaries & Objects', summary: 'Looking values up by key.', canDo: 'Store values under keys in a dictionary (object), and look them up, add and change them', region: 4, requires: ['boss-3'] },
  { id: 'map-patterns', title: 'Count, Group, Look Up', summary: 'The everyday dictionary patterns.', canDo: 'Count how often each word appears using a dictionary (object)', region: 4, requires: ['maps'] },
  { id: 'sets', title: 'Unique Things', summary: 'Collections without duplicates.', canDo: 'Use a set to drop duplicates and check quickly whether something is there', region: 4, requires: ['map-patterns'] },
  { id: 'nested-data', title: 'Records & Nesting', summary: 'Lists of records, the shape of real data.', canDo: 'Work with a list of records, reading and updating the fields inside each one', region: 4, requires: ['map-patterns'] },
  { id: 'classes', title: 'Objects & Classes', summary: 'Designing your own types.', canDo: 'Design a class and make objects from it, each with its own data', region: 4, requires: ['map-patterns'] },
  { id: 'methods', title: 'Methods', summary: 'Behavior that belongs to an object.', canDo: 'Give objects methods that use and change their own data', region: 4, requires: ['classes'] },
  { id: 'encapsulation', title: 'Guarding State', summary: 'Objects that protect their own rules.', canDo: 'Make an object guard its own rules so outside code cannot put it in a bad state', region: 4, requires: ['methods'] },
  { id: 'boss-4', title: 'Boss: Text Adventure', summary: 'Build an explorable text adventure.', region: 4, requires: ['sets', 'nested-data', 'encapsulation'], boss: true },

  // Region 5: Going Deeper (spec: docs/specs/region5-and-security.md Part A). Three tracks
  // under one boss: functional, recursive, objects.
  { id: 'higher-order-functions', title: 'Functions as Values', summary: 'Pass, store and return functions; sort by a key.', canDo: 'Pass a function to another function, for example to sort by a key you choose', region: 5, requires: ['boss-4'] },
  { id: 'map-filter-reduce', title: 'Transform, Keep, Combine', summary: 'One-line list jobs: comprehensions and array methods.', canDo: 'Transform, filter and total a list (array) with one short expression each', region: 5, requires: ['higher-order-functions'] },
  { id: 'closures', title: 'Functions That Remember', summary: 'Functions that build functions.', canDo: 'Write a function that builds and returns a new function that remembers a value', region: 5, requires: ['higher-order-functions'] },
  { id: 'recursion', title: 'Recursion', summary: 'Functions that call themselves.', canDo: 'Solve a problem with a function that calls itself on a smaller piece, with a base case that stops it', region: 5, requires: ['boss-4'] },
  { id: 'recursive-data', title: 'Trees in Your Data', summary: 'Walk nested lists, trees and grids.', canDo: 'Use recursion to walk nested lists (arrays), trees and grids', region: 5, requires: ['recursion'] },
  { id: 'inheritance', title: 'Families of Classes', summary: 'Subclasses, super and overriding.', canDo: 'Make a subclass that reuses its parent class and overrides one behavior', region: 5, requires: ['boss-4'] },
  { id: 'polymorphism', title: 'Same Call, Different Behavior', summary: 'One call, many classes.', canDo: 'Call the same method on objects of different classes and get the right behavior from each', region: 5, requires: ['inheritance'] },
  { id: 'value-vs-reference', title: 'Copies and Shared Data', summary: 'Two names, one list: aliases and copies.', canDo: 'Predict when two names share one list (array), and make a real copy when you need one', region: 5, requires: ['map-filter-reduce'] },
  { id: 'boss-5', title: 'Boss: Minesweeper', summary: 'Clear a minefield with classes, recursion and a command table.', region: 5, requires: ['value-vs-reference', 'closures', 'recursive-data', 'polymorphism'], boss: true },

  // Side quest (optional, after Region 3): Security. Nothing core may require these.
  { id: 'encoding', title: 'Letters Are Numbers', summary: 'Characters are stored as numbers.', canDo: 'Turn letters into the numbers the computer stores, and back again', region: 10, requires: ['boss-3'], sideQuest: true },
  { id: 'ciphers', title: 'Secret Codes', summary: 'Hide a message with a key, then test how strong it is.', canDo: 'Encrypt and decrypt a message with a key, and test how easily it can be cracked', region: 10, requires: ['encoding'], sideQuest: true },
  { id: 'passwords', title: 'Strong Passwords', summary: 'Measure strength, and store fingerprints, never passwords.', canDo: 'Score how strong a password is, and store a fingerprint (hash) instead of the password', region: 10, requires: ['encoding'], sideQuest: true },
  { id: 'input-validation', title: 'Trust No Input', summary: 'Allow-lists, username rules and fake links.', canDo: 'Check input against an allow-list and clear rules, and reject anything that does not fit', region: 10, requires: ['boss-3'], sideQuest: true },
  { id: 'boss-security', title: 'Boss: The Vault', summary: 'A login vault with lockout and a hidden secret.', region: 10, requires: ['ciphers', 'passwords', 'input-validation'], boss: true, sideQuest: true },

  // Region 6: Algorithms (docs/specs/regions6-8.md Part A). Counting steps first, then the
  // classic searching, sorting and lookup patterns, and the first linked structure.
  { id: 'big-o', title: 'Counting Steps', summary: 'How work grows with input size: n, n² and log n.', canDo: 'Count the steps a loop or nested loop takes, and say how the count grows when the input doubles', region: 6, requires: ['boss-5'] },
  { id: 'linear-search', title: 'Scan the List', summary: 'Look at each item until you find it.', canDo: 'Search a list (array) from the front and stop at the first match, reporting where it was', region: 6, requires: ['big-o'] },
  { id: 'binary-search', title: 'Halve It', summary: 'Find things in a sorted list by halving.', canDo: 'Find a value in a sorted list (array) by halving the search range each step', region: 6, requires: ['linear-search'] },
  { id: 'sorting-basics', title: 'Sort It Yourself', summary: 'Insertion and bubble sort, by hand and in code.', canDo: 'Sort a list (array) with your own loops instead of a built-in sort, and compare two records to decide which comes first', region: 6, requires: ['linear-search'] },
  { id: 'hashing', title: 'Instant Lookups', summary: 'Sets and dictionaries make checks take one step.', canDo: 'Use a set or dictionary (object) to replace a nested loop with a single-step lookup', region: 6, requires: ['big-o'] },
  { id: 'two-pointers', title: 'Two Pointers & Windows', summary: 'Walk a list from both ends, or slide a window.', canDo: 'Solve pair and run problems with two moving indexes or a sliding window instead of nested loops', region: 6, requires: ['sorting-basics'] },
  { id: 'stacks-queues', title: 'Stacks & Queues', summary: 'Last in first out, first in first out.', canDo: 'Use a stack to undo or match brackets, and a queue to serve things in arrival order', region: 6, requires: ['big-o'] },
  { id: 'linked-lists', title: 'Linked Lists', summary: 'Nodes that point to the next node.', canDo: 'Build, walk and change a chain of nodes that each point to the next one', region: 6, requires: ['stacks-queues', 'value-vs-reference'] },
  { id: 'boss-6', title: 'Boss: Leaderboard Engine', summary: 'Rank, look up and undo scores fast.', region: 6, requires: ['binary-search', 'hashing', 'two-pointers', 'linked-lists'], boss: true },

  // Region 7: Data Structures (docs/specs/regions6-8.md Part B). Trees, graphs and the three
  // big problem-solving strategies: try everything, remember answers, take the best now.
  { id: 'trees', title: 'Binary Trees', summary: 'Nodes with a left and a right child.', canDo: 'Build a binary tree from nodes and walk it depth-first and level by level', region: 7, requires: ['boss-6'] },
  { id: 'bst', title: 'Search Trees', summary: 'Smaller to the left, larger to the right.', canDo: 'Insert into and search a binary search tree, and read it back in sorted order', region: 7, requires: ['trees'] },
  { id: 'heaps', title: 'Priority Queues', summary: 'Always hand out the smallest (or biggest) next.', canDo: 'Keep a priority queue with a heap so the smallest item is always one step away', region: 7, requires: ['trees'] },
  { id: 'graphs', title: 'Graphs & BFS', summary: 'Connections, neighbours and shortest hops.', canDo: 'Store connections as neighbour lists and find the fewest hops between two points with breadth-first search', region: 7, requires: ['boss-6'] },
  { id: 'shortest-path', title: 'Weighted Paths', summary: "Dijkstra: cheapest route when roads have costs.", canDo: 'Find the cheapest route through a weighted graph with Dijkstra and a priority queue', region: 7, requires: ['graphs', 'heaps'] },
  { id: 'backtracking', title: 'Try & Undo', summary: 'Explore every choice, step back when stuck.', canDo: 'Generate every combination or arrangement by choosing, recursing and undoing the choice', region: 7, requires: ['boss-6'] },
  { id: 'dynamic-programming', title: 'Remember Answers', summary: 'Memoization and tables turn slow recursion fast.', canDo: 'Speed up a recursive solution by remembering sub-answers in a dictionary or table', region: 7, requires: ['backtracking'] },
  { id: 'greedy-intervals', title: 'Greedy Choices', summary: 'Sort, then take the best option each time.', canDo: 'Sort ranges and merge or schedule them by always taking the next best choice', region: 7, requires: ['boss-6'] },
  { id: 'boss-7', title: 'Boss: Pathfinder', summary: 'Plot the cheapest route across a map with costs and gates.', region: 7, requires: ['bst', 'shortest-path', 'dynamic-programming', 'greedy-intervals'], boss: true },

  // Side quest: Web Pages (region 8, JavaScript only). The same JavaScript the learner knows,
  // now driving a real page: find elements, react to clicks and typing, redraw lists, read forms.
  { id: 'dom-elements', title: 'Pages Are Trees', summary: 'Find elements by id and change their text and style.', canDo: 'Find an element on a page by its id or selector and change its text, classes or style', region: 8, requires: ['boss-4'], sideQuest: true, languages: ['javascript'] },
  { id: 'dom-events', title: 'Listening for Clicks', summary: 'Run a function when the user clicks or types.', canDo: 'Attach a function to a button or input so the page reacts when the user clicks or types', region: 8, requires: ['dom-elements'], sideQuest: true, languages: ['javascript'] },
  { id: 'dom-lists', title: 'Drawing Lists', summary: 'Build elements from an array and redraw them when data changes.', canDo: 'Keep data in an array and redraw a list of elements from it whenever the array changes', region: 8, requires: ['dom-events'], sideQuest: true, languages: ['javascript'] },
  { id: 'dom-forms', title: 'Reading Forms', summary: 'Read inputs, check them, and stop the page from reloading.', canDo: 'Read and validate what the user typed in a form, and show a message instead of reloading', region: 8, requires: ['dom-lists'], sideQuest: true, languages: ['javascript'] },
  { id: 'boss-web', title: 'Boss: Task Board', summary: 'A working to-do page: add, finish, filter and count tasks.', region: 8, requires: ['dom-forms'], boss: true, sideQuest: true, languages: ['javascript'] },
];

export const REGION_NAMES: Record<number, string> = {
  0: 'First Steps',
  1: 'Data',
  2: 'Control Flow',
  3: 'Structure',
  4: 'Modeling',
  5: 'Going Deeper',
  6: 'Algorithms',
  7: 'Data Structures',
  8: 'Side Quest: Web Pages',
  10: 'Side Quest: Security',
};
