import { describe, expect, it } from 'vitest';
import { normalizeIconId, resolveUniqueIconId } from './iconId';

describe('icon IDs', () => {
  it('normalizes a file name to a safe ID', () => {
    expect(normalizeIconId('  My Icon__01.SVG')).toBe('my-icon-01');
    expect(normalizeIconId('中文名称.svg')).toBe('icon-1');
  });

  it('numbers duplicate icon names automatically', () => {
    const taken: string[] = [];
    const first = resolveUniqueIconId('home', taken);
    taken.push(first);
    const second = resolveUniqueIconId('home', taken);
    taken.push(second);
    const third = resolveUniqueIconId('home', taken);

    expect([first, second, third]).toEqual(['home', 'home-2', 'home-3']);
  });

  it('deduplicates manual renames while excluding the current icon', () => {
    const others = ['home', 'home-2', 'user'];
    expect(resolveUniqueIconId('home', others)).toBe('home-3');
    expect(resolveUniqueIconId('user', ['home'])).toBe('user');
    expect(resolveUniqueIconId('User Profile', ['home'])).toBe('user-profile');
  });
});
