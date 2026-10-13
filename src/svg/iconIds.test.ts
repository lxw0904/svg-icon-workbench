import { describe, expect, it } from 'vitest';
import { dedupeIconIds, iconIdFromFileName, makeUniqueIconId, sanitizeIconId } from './iconIds';

describe('icon ID handling', () => {
  it('derives lowercase, safe IDs from file names', () => {
    expect(iconIdFromFileName('My Icon_01.SVG')).toBe('my-icon-01');
    expect(sanitizeIconId('  __  ')).toBe('icon-1');
  });

  it('numbers duplicate icon names automatically', () => {
    const input = [
      { id: 'home' },
      { id: 'home' },
      { id: 'home' },
    ];
    expect(dedupeIconIds(input).map((icon) => icon.id)).toEqual(['home', 'home-2', 'home-3']);
  });

  it('rechecks duplicates after a manual rename', () => {
    const renamed = dedupeIconIds([
      { id: 'home' },
      { id: 'account' },
      { id: 'home' },
    ]);
    expect(renamed.map((icon) => icon.id)).toEqual(['home', 'account', 'home-2']);
  });

  it('uses the next free suffix for a conflicting preferred ID', () => {
    const used = new Set(['icon-1', 'icon-1-2']);
    expect(makeUniqueIconId('icon-1', used)).toBe('icon-1-3');
  });
});
