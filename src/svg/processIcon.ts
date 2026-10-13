import { prefixInternalIds } from './prefixInternalIds';
import { parseSvg } from './parseSvg';
import { sanitizeSvg } from './sanitizeSvg';
import { serializeSvgChildren, serializeSvgRoot } from './serializeSvg';
import type { IconSource, ProcessedIcon } from '../types';

export interface ProcessIconOptions {
  preserveColor: boolean;
}

const ROOT_ATTRIBUTES_TO_SKIP = new Set(['id', 'viewbox', 'width', 'height', 'x', 'y']);

function extractSymbolAttributes(root: Element): Record<string, string> {
  const attributes: Record<string, string> = {};

  for (const attribute of Array.from(root.attributes)) {
    const name = attribute.name;
    const local = attribute.localName.toLowerCase();
    if (attribute.prefix === 'xmlns' || name === 'xmlns' || ROOT_ATTRIBUTES_TO_SKIP.has(local)) {
      continue;
    }
    attributes[name] = attribute.value;
  }

  return attributes;
}

export function processIcon(source: IconSource, options: ProcessIconOptions): ProcessedIcon {
  const parsed = parseSvg(source.raw);
  const sanitized = sanitizeSvg(parsed.root, {
    hadXmlDeclaration: parsed.hadXmlDeclaration,
    preserveColor: options.preserveColor,
  });
  const idWarnings = prefixInternalIds(sanitized.root, source.id);

  return {
    ...source,
    viewBox: sanitized.viewBox,
    warnings: [...sanitized.warnings, ...idWarnings],
    cleanSvg: serializeSvgRoot(sanitized.root),
    symbolContent: serializeSvgChildren(sanitized.root),
    symbolAttributes: extractSymbolAttributes(sanitized.root),
  };
}
