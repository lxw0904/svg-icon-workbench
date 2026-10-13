import { describe, expect, it } from 'vitest';
import { prefixInternalIds } from './prefixInternalIds';

const source = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <clipPath id="clip0"><rect width="10" height="10" /></clipPath>
    <linearGradient id="grad0"><stop offset="0" /></linearGradient>
  </defs>
  <rect clip-path="url(#clip0)" fill="url( #grad0 )" />
  <use href="#clip0" />
  <use xlink:href="#grad0" />
  <rect filter="url(#notDefined)" />
</svg>`;

describe('prefixInternalIds', () => {
  it('prefixes every internal ID and synchronizes url, href and xlink:href references', () => {
    const result = prefixInternalIds(source, 'home');
    expect(result.svg).toContain('id="home__clip0"');
    expect(result.svg).toContain('id="home__grad0"');
    expect(result.svg).toContain('clip-path="url(#home__clip0)"');
    expect(result.svg).toContain('fill="url(#home__grad0)"');
    expect(result.svg).toContain('href="#home__clip0"');
    expect(result.svg).toContain('xlink:href="#home__grad0"');
    expect(result.svg).toContain('filter="url(#notDefined)"');
  });

  it('does not point references at an unrelated generated ID', () => {
    const result = prefixInternalIds(source, 'account');
    expect(result.svg).toContain('id="account__grad0"');
    expect(result.svg).not.toContain('href="#home__grad0"');
    expect(result.svg).not.toContain('url(#home__clip0)');
  });
});
