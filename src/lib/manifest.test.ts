import { describe, expect, it } from 'vitest';
import { buildProcessedIcon } from './iconPipeline';
import { generateManifest } from './manifest';

describe('manifest generation', () => {
  it('contains required fields and is stable', () => {
    const b = buildProcessedIcon(
      'B.svg',
      '<svg width="10" height="20"><path d="M0 0h1"/></svg>',
      'b',
    );
    const a = buildProcessedIcon('A.svg', '<svg><path d="M0 0h1"/></svg>', 'a');
    const first = generateManifest([b, a]);
    const second = generateManifest([a, b]);
    expect(first).toBe(second);

    const parsed = JSON.parse(first);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toMatchObject({
      id: 'a',
      fileName: 'A.svg',
      viewBox: '0 0 24 24',
    });
    expect(Array.isArray(parsed[0].warnings)).toBe(true);
    expect(parsed[0].warnings[0]).toContain('viewBox');
  });
});
