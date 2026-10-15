import { describe, expect, it } from 'vitest';
import { readAdventure } from '../adventure';

describe('readAdventure', () => {
  it('tracks the room, exits, items, backpack and explored rooms', () => {
    const out = [
      'You are in the hall. Exits: north, east. Items: lamp',
      'Taken: lamp',
      'You are in the kitchen. Exits: west. Items: key',
      "You can't go that way.",
    ].join('\n');
    const view = readAdventure(out);
    expect(view.room).toBe('kitchen');
    expect(view.exits).toEqual(['west']);
    expect(view.items).toEqual(['key']);
    expect(view.inventory).toEqual(['lamp']);
    expect(view.explored).toEqual(['hall', 'kitchen']);
    expect(view.message).toBe("You can't go that way.");
    expect(view.won).toBe(false);
  });

  it('reads the inventory line, empty rooms and the win', () => {
    const view = readAdventure('You are in the vault. Exits: south. Items: none\nYou carry: lamp, key, crown\nYou win! Rooms explored: 4\n');
    expect(view.items).toEqual([]);
    expect(view.inventory).toEqual(['lamp', 'key', 'crown']);
    expect(view.won).toBe(true);
  });

  it('shows nothing before the first room', () => {
    expect(readAdventure('Welcome!\n').room).toBeUndefined();
  });
});
