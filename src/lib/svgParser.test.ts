import { describe, expect, it } from 'vitest';
import { parseSvgDocument, SvgParseError } from './svgParser';

describe('parseSvgDocument', () => {
  it('parses a normal SVG document', () => {
    const document = parseSvgDocument('<svg viewBox="0 0 24 24"><path d="M0 0h24"/></svg>');
    expect(document.documentElement.localName).toBe('svg');
    expect(document.querySelector('path')).not.toBeNull();
  });

  it('rejects damaged XML', () => {
    expect(() => parseSvgDocument('<svg><path d="M0 0"></svg>')).toThrow(SvgParseError);
  });

  it('rejects a non-SVG root node', () => {
    expect(() => parseSvgDocument('<html><body /></html>')).toThrow('根节点不是 <svg>');
  });
});
