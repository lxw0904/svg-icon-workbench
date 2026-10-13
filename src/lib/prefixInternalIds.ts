import type { SvgWarning } from '../types';
import { parseSvgDocument } from './svgParser';

export interface PrefixInternalIdsResult {
  svg: string;
  warnings: SvgWarning[];
}

function replaceUrlReferences(value: string, idMap: Map<string, string>): string {
  return value.replace(
    /url\(\s*(['"]?)#([^)'"\s]+)\1\s*\)/g,
    (match, quote: string, id: string) => {
      const mapped = idMap.get(id);
      return mapped ? `url(${quote}#${mapped}${quote})` : match;
    },
  );
}

function replaceIdList(value: string, idMap: Map<string, string>): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((id) => idMap.get(id) ?? id)
    .join(' ');
}

export function prefixInternalIds(svgText: string, iconId: string): PrefixInternalIdsResult {
  const document = parseSvgDocument(svgText);
  const idMap = new Map<string, string>();
  const usedIds = new Set<string>();
  const warnings: SvgWarning[] = [];
  const root = document.documentElement;
  const elements = [root, ...Array.from(root.querySelectorAll('*'))];

  for (const element of elements) {
    const originalId = element.getAttribute('id')?.trim();
    if (!originalId) {
      continue;
    }

    const base = `${iconId}__${originalId}`;
    let uniqueId = base;
    let suffix = 2;
    while (usedIds.has(uniqueId)) {
      uniqueId = `${base}-${suffix}`;
      suffix += 1;
    }

    if (!idMap.has(originalId)) {
      idMap.set(originalId, uniqueId);
    } else {
      warnings.push({
        code: 'duplicate-internal-id',
        message: `内部重复 ID "${originalId}" 已自动区分`,
      });
    }

    usedIds.add(uniqueId);
    element.setAttribute('id', uniqueId);
  }

  for (const element of elements) {
    for (const attribute of Array.from(element.attributes)) {
      const localName = (attribute.localName || attribute.name).toLowerCase();
      const name = attribute.name.toLowerCase();
      const value = attribute.value;

      if (localName === 'href' || name === 'xlink:href') {
        const trimmed = value.trim();
        if (trimmed.startsWith('#')) {
          const referencedId = trimmed.slice(1);
          const mappedId = idMap.get(referencedId);
          if (mappedId) {
            attribute.value = `#${mappedId}`;
          }
        }
        continue;
      }

      if (value.includes('url(')) {
        attribute.value = replaceUrlReferences(value, idMap);
      }

      if (localName === 'aria-labelledby' || localName === 'aria-describedby') {
        attribute.value = replaceIdList(value, idMap);
      }
    }
  }

  return {
    svg: new XMLSerializer().serializeToString(document.documentElement),
    warnings,
  };
}


