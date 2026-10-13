import { describe, expect, it } from 'vitest';
import { processIcon } from './processIcon';
import { generateSprite } from './sprite';
import type { IconSource } from '../types';

function source(raw: string, id: string, fileName = `${id}.svg`): IconSource {
  return { key: id, id, fileName, raw };
}

describe('internal ID conflict handling', () => {
  it('prefixes IDs and synchronizes url/href/xlink references', () => {
    const processed = processIcon(
      source(
        '<svg xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24"><defs><linearGradient id="grad"><stop offset="0" /></linearGradient><clipPath id="clip0"><rect width="4" height="4" /></clipPath></defs><path fill="url(#grad)" clip-path="url(#clip0)" d="M0 0" /><use xlink:href="#clip0" /></svg>',
        'home',
      ),
      { preserveColor: false },
    );

    expect(processed.cleanSvg).toContain('id="home__grad"');
    expect(processed.cleanSvg).toContain('id="home__clip0"');
    expect(processed.cleanSvg).toContain('fill="url(#home__grad)"');
    expect(processed.cleanSvg).toContain('clip-path="url(#home__clip0)"');
    expect(processed.cleanSvg).toContain('href="#home__clip0"');
  });

  it('prevents cross-icon ID references in the generated sprite', () => {
    const first = processIcon(
      source('<svg viewBox="0 0 24 24"><defs><clipPath id="clip0"><rect width="4" height="4" /></clipPath></defs><use href="#clip0" /></svg>', 'one'),
      { preserveColor: false },
    );
    const second = processIcon(
      source('<svg viewBox="0 0 24 24"><defs><clipPath id="clip0"><rect width="5" height="5" /></clipPath></defs><use href="#clip0" /></svg>', 'two'),
      { preserveColor: false },
    );
    const sprite = generateSprite([first, second].map((icon) => ({ id: icon.id, viewBox: icon.viewBox, content: icon.symbolContent })));

    expect(sprite).toContain('id="one__clip0"');
    expect(sprite).toContain('id="two__clip0"');
    expect(sprite).toContain('href="#one__clip0"');
    expect(sprite).toContain('href="#two__clip0"');
    expect(sprite).not.toContain('href="#clip0"');
  });
});

