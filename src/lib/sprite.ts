import type { ProcessedIcon } from '../types';
import { parseSvgDocument } from './svgParser';

type SpriteIcon = Pick<ProcessedIcon, 'id' | 'cleanedSvg' | 'viewBox'>;

export interface SpriteGenerationResult {
  svg: string;
  includedIds: string[];
  skipped: Array<{ id: string; reason: string }>;
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const ROOT_ATTRIBUTES_TO_SKIP = new Set([
  'id',
  'viewbox',
  'width',
  'height',
  'x',
  'y',
  'xmlns',
  'xmlns:xlink',
]);

function compareIds(a: SpriteIcon, b: SpriteIcon): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

function buildSymbol(icon: SpriteIcon): string {
  const document = parseSvgDocument(icon.cleanedSvg);
  const root = document.documentElement;
  const serializer = new XMLSerializer();
  const rootAttributes = Array.from(root.attributes)
    .filter((attribute) => !ROOT_ATTRIBUTES_TO_SKIP.has(attribute.name.toLowerCase()))
    .map((attribute) => `${attribute.name}="${escapeXml(attribute.value)}"`);
  const attributes = [
    `id="${escapeXml(icon.id)}"`,
    `viewBox="${escapeXml(icon.viewBox)}"`,
    ...rootAttributes,
  ];
  const serializedChildren = Array.from(root.childNodes)
    .map((node) => serializer.serializeToString(node))
    .join('');
  const rootId = root.getAttribute('id');
  const children = rootId
    ? `<g id="${escapeXml(rootId)}">${serializedChildren}</g>`
    : serializedChildren;

  return `<symbol ${attributes.join(' ')}>${children}</symbol>`;
}

export function generateSymbol(icon: SpriteIcon): string {
  return buildSymbol(icon);
}

export function generateSpriteDetailed(icons: SpriteIcon[]): SpriteGenerationResult {
  const symbols: string[] = [];
  const includedIds: string[] = [];
  const skipped: Array<{ id: string; reason: string }> = [];

  for (const icon of [...icons].sort(compareIds)) {
    try {
      symbols.push(buildSymbol(icon));
      includedIds.push(icon.id);
    } catch (error) {
      skipped.push({
        id: icon.id,
        reason: error instanceof Error ? error.message : '未知错误',
      });
    }
  }

  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs>${symbols.join('')}</defs></svg>`,
    includedIds,
    skipped,
  };
}

export function generateSprite(icons: SpriteIcon[]): string {
  return generateSpriteDetailed(icons).svg;
}
