import type { ProcessedIcon } from '../types';

export interface ManifestIcon {
  id: string;
  fileName: string;
  viewBox: string;
  warnings: string[];
}

export interface IconManifest {
  icons: ManifestIcon[];
}

export function createManifest(icons: ProcessedIcon[]): IconManifest {
  return {
    icons: icons.map((icon) => ({
      id: icon.id,
      fileName: icon.fileName,
      viewBox: icon.viewBox,
      warnings: [...icon.warnings],
    })),
  };
}

export function generateManifest(icons: ProcessedIcon[]): string {
  return `${JSON.stringify(createManifest(icons), null, 2)}\n`;
}
