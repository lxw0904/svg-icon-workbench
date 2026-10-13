import type { SpriteIcon } from '../types';

export function escapeXmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderAttributes(attributes: Record<string, string> | undefined): string {
  if (!attributes) return '';
  return Object.entries(attributes)
    .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
    .map(([name, value]) => ` ${name}="${escapeXmlAttribute(value)}"`)
    .join('');
}

export function generateSymbol(icon: SpriteIcon): string {
  const id = escapeXmlAttribute(icon.id);
  const viewBox = escapeXmlAttribute(icon.viewBox);
  const attributes = renderAttributes(icon.attributes);
  return `  <symbol id="${id}" viewBox="${viewBox}"${attributes}>${icon.content}</symbol>`;
}

export function generateSprite(icons: SpriteIcon[]): string {
  const symbols = icons.map(generateSymbol).join('\n');
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">',
    '  <defs>',
    symbols,
    '  </defs>',
    '</svg>',
  ].join('\n');
}

