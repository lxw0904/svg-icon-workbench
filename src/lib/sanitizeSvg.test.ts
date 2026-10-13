import { describe, expect, it } from 'vitest';
import { normalizeSvg, sanitizeSvg } from './sanitizeSvg';

const unsafeSvg = `
  <?xml version="1.0"?>
  <!-- exported by a tool -->
  <svg xmlns="http://www.w3.org/2000/svg"
       xmlns:xlink="http://www.w3.org/1999/xlink"
       xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
       width="24" height="24" onload="alert(1)">
    <script>alert('xss')</script>
    <metadata>private notes</metadata>
    <style>.icon { display:block }</style>
    <sodipodi:namedview id="namedview" />
    <defs>
      <clipPath id="okClip"><rect width="10" height="10" /></clipPath>
    </defs>
    <rect id="safe" width="24" height="24" style="fill:red" onclick="run()" />
    <rect width="4" height="4" fill="url(http://evil.example/fill.svg#x)" />
    <a href="https://evil.example/track"><text>bad link</text></a>
    <a xlink:href="javascript:alert(1)"><text>bad script</text></a>
    <use href="#okClip" />
  </svg>
`;

describe('sanitizeSvg', () => {
  it('removes scripts, event attributes, styles and tool metadata', () => {
    const result = sanitizeSvg(unsafeSvg);
    const output = new XMLSerializer().serializeToString(result.document);
    expect(output).not.toMatch(/<script/i);
    expect(output).not.toContain('onload');
    expect(output).not.toContain('onclick');
    expect(output).not.toMatch(/<style/i);
    expect(output).not.toMatch(/<metadata/i);
    expect(output).not.toContain('sodipodi:');
    expect(output).not.toContain('style=');
    expect(output).toContain('<use href="#okClip"');
    expect(result.warnings.length).toBeGreaterThan(5);
  });

  it('removes external and javascript references but preserves fragment links', () => {
    const result = sanitizeSvg(unsafeSvg);
    const output = new XMLSerializer().serializeToString(result.document);
    expect(output).not.toContain('http://evil.example/fill.svg');
    expect(output).not.toContain('https://evil.example/track');
    expect(output).not.toContain('javascript:');
    expect(output).toContain('href="#okClip"');
  });

  it('adds currentColor by default and allows preserving original colors', () => {
    const source = '<svg viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>';
    const normalized = normalizeSvg(sanitizeSvg(source).document);
    expect(normalized.svg).toContain('fill="currentColor"');

    const preserved = normalizeSvg(sanitizeSvg(source).document, { preserveColors: true });
    expect(preserved.svg).not.toContain('fill="currentColor"');
  });
});
