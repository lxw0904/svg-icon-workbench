import { describe, expect, it } from 'vitest';
import { createManifest, generateManifest } from './manifest';
import { processIcon } from './processIcon';

describe('manifest generation', () => {
  it('contains stable metadata and no timestamp', () => {
    const icon = processIcon(
      {
        key: 'home',
        id: 'home',
        fileName: 'home.svg',
        raw: '<svg viewBox="0 0 24 24"><path d="M0 0" /></svg>',
      },
      { preserveColor: false },
    );
    const manifest = createManifest([icon]);
    const json = generateManifest([icon]);

    expect(manifest.icons[0]).toMatchObject({ id: 'home', fileName: 'home.svg', viewBox: '0 0 24 24' });
    expect(json).not.toMatch(/timestamp|generatedAt|date/i);
    expect(generateManifest([icon])).toBe(json);
  });
});
