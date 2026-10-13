import { describe, expect, it } from 'vitest';
import { buildProcessedIcon } from './iconPipeline';
import { generateSprite, generateSpriteDetailed, escapeXml } from './sprite';

const icon = (id: string, body: string) =>
  buildProcessedIcon(`${id}.svg`, `<svg viewBox="0 0 24 24">${body}</svg>`, id);

describe('sprite generation', () => {
  it('is stable for the same input regardless of array order', () => {
    const home = icon('home', '<path d="M0 0h10"/>');
    const user = icon('user', '<path d="M2 2h4"/>');
    const first = generateSprite([home, user]);
    const second = generateSprite([user, home]);
    expect(first).toBe(second);
    expect(first).toContain('<symbol id="home"');
    expect(first).toContain('<symbol id="user"');
    expect(first).toContain('fill="currentColor"');
  });

  it('preserves a prefixed root id through an inner group', () => {
    const rooted = buildProcessedIcon(
      'rooted.svg',
      '<svg id="root" viewBox="0 0 24 24"><use href="#root"/></svg>',
      'rooted',
    );
    const sprite = generateSprite([rooted]);
    expect(rooted.cleanedSvg).toContain('id="rooted__root"');
    expect(rooted.cleanedSvg).toContain('href="#rooted__root"');
    expect(sprite).toContain('<g id="rooted__root">');
  });

  it('escapes XML text and attributes', () => {
    const escaped = escapeXml('A&B < C "quoted"');
    expect(escaped).toBe('A&amp;B &lt; C &quot;quoted&quot;');
    const special = icon('special', '<text>A &amp; B &lt; C</text>');
    const sprite = generateSprite([special]);
    expect(sprite).toContain('A &amp; B &lt; C');
  });

  it('does not let an invalid icon prevent valid icons from being generated', () => {
    const valid = icon('valid', '<circle cx="12" cy="12" r="8"/>');
    const result = generateSpriteDetailed([
      valid,
      { id: 'broken', cleanedSvg: '<svg><path></svg>', viewBox: '0 0 24 24' },
    ]);
    expect(result.svg).toContain('<symbol id="valid"');
    expect(result.svg).not.toContain('<symbol id="broken"');
    expect(result.skipped).toHaveLength(1);
    expect(result.includedIds).toEqual(['valid']);
  });

  it('does not emit dangerous content after the pipeline', () => {
    const safe = icon(
      'safe',
      '<script>alert(1)</script><rect onclick="x()" width="10" height="10"/><use href="https://example.com/icon.svg#x"/>',
    );
    const sprite = generateSprite([safe]);
    expect(sprite).not.toMatch(/<script/i);
    expect(sprite).not.toContain('onclick');
    expect(sprite).not.toContain('https://example.com');
    expect(sprite).not.toContain('javascript:');
  });
});
