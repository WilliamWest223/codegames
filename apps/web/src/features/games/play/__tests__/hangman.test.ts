import { describe, expect, it } from 'vitest';
import { readHangman } from '../hangman';

describe('readHangman', () => {
  it('reads the latest mask, lives and guesses mid-game', () => {
    const out = '_ _ _\nLives: 6\nd _ _\nLives: 6\nInvalid guess\nd _ _\nLives: 6\nd _ _\nLives: 5\n';
    const view = readHangman(out, ['d', 'dd', 'x']);
    expect(view.tiles).toEqual(['d', null, null]);
    expect(view.lives).toBe(5);
    expect(view.startLives).toBe(6);
    expect(view.guesses).toEqual([
      { letter: 'd', hit: true },
      { letter: 'x', hit: false },
    ]);
    expect(view.outcome).toBeUndefined();
  });

  it('reveals the word at the end', () => {
    const win = readHangman('_ _\nLives: 2\nh _\nLives: 2\nYou win! The word was hi\n', ['h', 'i']);
    expect(win.tiles).toEqual(['h', 'i']);
    expect(win.outcome).toBe('win');
    const lose = readHangman('_ _ _\nLives: 1\nYou lose! The word was cat\n', ['z']);
    expect(lose.tiles).toEqual(['c', 'a', 't']);
    expect(lose.outcome).toBe('lose');
  });

  it('only ends the game when the program has finished on a win/lose line', () => {
    expect(readHangman('_ _\nLives: 3\nYou lose a life!\n_ _\nLives: 2\n', ['x'], false).outcome).toBeUndefined();
    expect(readHangman('You win prizes in this game!\n_ _\nLives: 6\n', [], false).outcome).toBeUndefined();
    expect(readHangman('_ _\nLives: 1\nYou lose! The word was hi\n', ['x'], true).outcome).toBe('lose');
  });

  it('shows nothing until the program prints a mask', () => {
    expect(readHangman('Welcome!\n', []).tiles).toEqual([]);
  });
});
