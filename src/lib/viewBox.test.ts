import { describe, expect, it } from 'vitest';
import { parseSvgDocument } from './svgParser';
import { normalizeViewBox } from './viewBox';

describe('normalizeViewBox', () => {
  it('uses an existing viewBox and removes root dimensions', () => {
    const document = parseSvgDocument(
      '<svg viewBox=" 0  0 32 18 " width="32" height="18" x="1" y="2" />',
    );
    const result = normalizeViewBox(document.documentElement);
    expect(result.viewBox).toBe('0 0 32 18');
    expect(document.documentElement.getAttribute('viewBox')).toBe('0 0 32 18');
    expect(document.documentElement.hasAttribute('width')).toBe(false);
    expect(document.documentElement.hasAttribute('height')).toBe(false);
    expect(document.documentElement.hasAttribute('x')).toBe(false);
    expect(document.documentElement.hasAttribute('y')).toBe(false);
    expect(result.warnings).toEqual([]);
  });

  it('creates a viewBox from numeric width and height', () => {
    const document = parseSvgDocument('<svg width="48" height="32" />');
    const result = normalizeViewBox(document.documentElement);
    expect(result.viewBox).toBe('0 0 48 32');
    expect(result.warnings).toEqual([]);
  });

  it('falls back to 0 0 24 24 and warns when no dimensions exist', () => {
    const document = parseSvgDocument('<svg><path d="M0 0h1"/></svg>');
    const result = normalizeViewBox(document.documentElement);
    expect(result.viewBox).toBe('0 0 24 24');
    expect(result.warnings[0]?.code).toBe('viewbox-fallback');
  });
});
