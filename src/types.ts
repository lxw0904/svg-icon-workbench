export interface IconSource {
  key: string;
  id: string;
  fileName: string;
  raw: string;
}

export interface ProcessedIcon extends IconSource {
  viewBox: string;
  warnings: string[];
  cleanSvg: string;
  symbolContent: string;
  symbolAttributes: Record<string, string>;
}

export interface ImportError {
  id: string;
  fileName: string;
  reason: string;
}

export interface IconProcessError {
  fileName: string;
  reason: string;
}

export interface SpriteIcon {
  id: string;
  viewBox: string;
  content: string;
  attributes?: Record<string, string>;
}
