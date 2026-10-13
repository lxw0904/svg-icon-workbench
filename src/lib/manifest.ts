import type { ManifestEntry, ProcessedIcon } from '../types';

export function generateManifest(icons: ProcessedIcon[]): string {
  const entries: ManifestEntry[] = [...icons]
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map((icon) => ({
      id: icon.id,
      fileName: icon.fileName,
      viewBox: icon.viewBox,
      warnings: icon.warnings.map((warning) => warning.message),
    }));

  return `${JSON.stringify(entries, null, 2)}\n`;
}
