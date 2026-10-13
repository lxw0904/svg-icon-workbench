import { describe, expect, it } from 'vitest';
import { parseSvg } from './parseSvg';

describe('parseSvg', () => {
  it('parses a normal SVG', () => {
    const parsed = parseSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" /></svg>');
    expect(parsed.root.localName).toBe('svg');
    expect(parsed.hadXmlDeclaration).toBe(false);
  });

  it('reports malformed XML', () => {
    expect(() => parseSvg('<svg><path></svg>')).toThrow(/XML 解析失败/);
  });

  it('reports a non-svg root', () => {
    expect(() => parseSvg('<div><span /></div>')).toThrow(/根节点不是 svg/);
  });
});
