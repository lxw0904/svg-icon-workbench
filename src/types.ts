export interface SvgWarning {
  code: string;
  message: string;
}

export interface ProcessedIcon {
  id: string;
  fileName: string;
  originalSvg: string;
  sanitizedSvg: string;
  cleanedSvg: string;
  viewBox: string;
  warnings: SvgWarning[];
}

export interface ImportError {
  fileName: string;
  reason: string;
}

export interface ManifestEntry {
  id: string;
  fileName: string;
  viewBox: string;
  warnings: string[];
}

export interface GeneratedBundle {
  sprite: string;
  manifest: string;
  includedIds: string[];
  skipped: Array<{ id: string; reason: string }>;
}
