import { describe, expect, it } from 'vitest';
import { processIcon } from './processIcon';
import type { IconSource } from '../types';

function source(raw: string, id = 'demo'): IconSource {
  return { key: id, id, fileName: `${id}.svg`, raw };
}

describe('SVG cleaning', () => {
  it('removes script, event attributes, style and dangerous nodes', () => {
    const processed = processIcon(
      source(
        '<svg viewBox="0 0 24 24"><script>alert(1)</script><style>path{display:none}</style><path id="p" onclick="alert(1)" style="fill:red" d="M0 0" /></svg>',
      ),
      { preserveColor: false },
    );

    expect(processed.cleanSvg).not.toMatch(/<script/i);
    expect(processed.cleanSvg).not.toMatch(/onclick/i);
    expect(processed.cleanSvg).not.toMatch(/style=/i);
    expect(processed.cleanSvg).not.toMatch(/<style/i);
    expect(processed.cleanSvg).toContain('id="demo__p"');
    expect(processed.warnings.join(' ')).toMatch(/危险元素/);
    expect(processed.warnings.join(' ')).toMatch(/事件属性/);
  });

  it('removes external links but keeps internal references', () => {
    const processed = processIcon(
      source(
        '<svg xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24"><defs><path id="shape" d="M0 0" /></defs><use href="#shape" /><use href="https://example.com/icon.svg" /><image xlink:href="http://example.com/a.png" /></svg>',
      ),
      { preserveColor: false },
    );

    expect(processed.cleanSvg).toContain('href="#demo__shape"');
    expect(processed.cleanSvg).not.toMatch(/(?:href|src)="https?:\/\//i);
    expect(processed.warnings.join(' ')).toMatch(/外部或脚本链接|外部/);
  });

  it('uses an existing viewBox and removes root dimensions', () => {
    const processed = processIcon(
      source('<svg width="48" height="48" x="4" y="5" viewBox=" 0 0 48 48 "><path d="M0 0" /></svg>'),
      { preserveColor: false },
    );

    expect(processed.viewBox).toBe('0 0 48 48');
    expect(processed.cleanSvg).toContain('viewBox="0 0 48 48"');
    expect(processed.cleanSvg).not.toMatch(/\swidth="48"/);
    expect(processed.cleanSvg).not.toMatch(/\sheight="48"/);
    expect(processed.cleanSvg).not.toMatch(/\sx="4"/);
  });

  it('creates a viewBox from numeric width and height', () => {
    const processed = processIcon(
      source('<svg width="32" height="16"><rect width="32" height="16" /></svg>'),
      { preserveColor: false },
    );

    expect(processed.viewBox).toBe('0 0 32 16');
    expect(processed.cleanSvg).toContain('viewBox="0 0 32 16"');
  });

  it('warns and falls back to 24x24 when no dimensions exist', () => {
    const processed = processIcon(source('<svg><path d="M0 0" /></svg>'), { preserveColor: false });

    expect(processed.viewBox).toBe('0 0 24 24');
    expect(processed.warnings.join(' ')).toMatch(/0 0 24 24/);
  });

  it('normalizes missing colors to currentColor and can preserve original colors', () => {
    const currentColorIcon = processIcon(
      source('<svg viewBox="0 0 24 24"><path d="M0 0" /></svg>'),
      { preserveColor: false },
    );
    const coloredIcon = processIcon(
      source('<svg viewBox="0 0 24 24"><path fill="#ff0000" d="M0 0" /></svg>'),
      { preserveColor: true },
    );

    expect(currentColorIcon.cleanSvg).toContain('fill="currentColor"');
    expect(coloredIcon.cleanSvg).toContain('fill="#ff0000"');
  });
});
