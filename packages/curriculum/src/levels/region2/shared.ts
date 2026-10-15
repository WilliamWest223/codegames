import { lang } from '../../localize';

/** Helpers shared by this region's level files. */
export const INPUT = lang('`input()`', '`prompt()`');
export const TURN_RIGHT_TXT = lang('`turn_right()`', '`turnRight()`');
export const NEEDS_FOR = {
  python: [{ pattern: 'for\\s+\\w+\\s+in\\s+', message: 'Use a for loop.' }],
  javascript: [{ pattern: 'for\\s*\\(', message: 'Use a for loop.' }],
};
export const NEEDS_WHILE = {
  python: [{ pattern: 'while\\s', message: 'Use a while loop.' }],
  javascript: [{ pattern: 'while\\s*\\(', message: 'Use a while loop.' }],
};
