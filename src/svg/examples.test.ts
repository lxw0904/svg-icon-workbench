import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseSvg } from './parseSvg';

describe('example icon set', () => {
  const directory = join(process.cwd(), 'examples', '10-icon-set');
  const files = readdirSync(directory).filter((file) => file.endsWith('.svg'));

  it('contains ten SVG files with one intentionally broken file', () => {
    expect(files).toHaveLength(10);
    const validFiles = files.filter((file) => file !== 'broken.svg');
    expect(validFiles).toHaveLength(9);

    for (const file of validFiles) {
      expect(() => parseSvg(readFileSync(join(directory, file), 'utf8'))).not.toThrow();
    }

    expect(() => parseSvg(readFileSync(join(directory, 'broken.svg'), 'utf8'))).toThrow();
  });
});
