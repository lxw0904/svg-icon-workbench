import type { ProcessedIcon, SvgWarning } from '../types';
import { prefixInternalIds } from './prefixInternalIds';
import { normalizeSvg, sanitizeSvg } from './sanitizeSvg';

export interface BuildIconOptions {
  preserveColors?: boolean;
}

export function buildProcessedIcon(
  fileName: string,
  originalSvg: string,
  id: string,
  options: BuildIconOptions = {},
): ProcessedIcon {
  const sanitized = sanitizeSvg(originalSvg);
  const normalized = normalizeSvg(sanitized.document, options);
  const prefixed = prefixInternalIds(normalized.svg, id);
  const warnings: SvgWarning[] = [
    ...sanitized.warnings,
    ...normalized.warnings,
    ...prefixed.warnings,
  ];

  return {
    id,
    fileName,
    originalSvg,
    sanitizedSvg: normalized.svg,
    cleanedSvg: prefixed.svg,
    viewBox: normalized.viewBox,
    warnings,
  };
}
