import { describe, expect, it } from 'vitest';
import { processIcon } from './processIcon';
import { processIcons } from './processIcons';
import { escapeXmlAttribute, generateSprite, generateSymbol } from './sprite';
import type { IconSource } from '../types';

function source(raw: string, id: string, fileName = `${id}.svg`): IconSource {
  return { key: id, id, fileName, raw };
}

describe('sprite generation', () => {
  it('is stable for the same processed input', () => {
    const icon = processIcon(source('<svg viewBox="0 0 24 24"><path d="M0 0h24v24H0z" /></svg>', 'home'), { preserveColor: false });
    const input = [{ id: icon.id, viewBox: icon.viewBox, content: icon.symbolContent, attributes: icon.symbolAttributes }];

    expect(generateSprite(input)).toBe(generateSprite(input));
    expect(generateSprite(input)).toContain('<symbol id="home" viewBox="0 0 24 24" fill="currentColor">');
  });

  it('escapes XML attribute values', () => {
    const sprite = generateSprite([
      { id: 'a&b<c', viewBox: '0 0 24 24', content: '<path d="M0 0" />' },
    ]);
    expect(sprite).toContain('id="a&amp;b&lt;c"');
    expect(escapeXmlAttribute('"<&>')).toBe('&quot;&lt;&amp;&gt;');
  });

  it('keeps valid icons when another icon is broken', () => {
    const result = processIcons(
      [
        source('<svg viewBox="0 0 24 24"><path d="M0 0" /></svg>', 'good'),
        source('<svg><path></svg>', 'broken'),
      ],
      { preserveColor: false },
    );

    expect(result.icons.map((icon) => icon.id)).toEqual(['good']);
    expect(result.errors).toHaveLength(1);
    expect(generateSprite(result.icons.map((icon) => ({ id: icon.id, viewBox: icon.viewBox, content: icon.symbolContent, attributes: icon.symbolAttributes })))).toContain('id="good"');
  });

  it('creates a symbol with the required wrapper and root attributes', () => {
    expect(generateSymbol({ id: 'x', viewBox: '0 0 1 1', content: '<path />', attributes: { fill: 'currentColor' } })).toBe(
      '  <symbol id="x" viewBox="0 0 1 1" fill="currentColor"><path /></symbol>',
    );
  });
});
