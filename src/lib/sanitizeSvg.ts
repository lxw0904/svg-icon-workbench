import type { SvgWarning } from '../types';
import { parseSvgDocument } from './svgParser';
import { normalizeViewBox } from './viewBox';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const DANGEROUS_ELEMENTS = new Set([
  'script',
  'foreignobject',
  'iframe',
  'object',
  'embed',
  'style',
  'metadata',
]);

const TOOL_NAMESPACES = [
  'http://www.inkscape.org/namespaces/inkscape',
  'http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd',
];

function isToolElement(element: Element): boolean {
  const qualifiedName = element.nodeName.toLowerCase();
  return (
    qualifiedName.startsWith('inkscape:') ||
    qualifiedName.startsWith('sodipodi:') ||
    qualifiedName === 'xmlns:inkscape' ||
    qualifiedName === 'xmlns:sodipodi' ||
    TOOL_NAMESPACES.some((namespace) => element.namespaceURI === namespace)
  );
}

function isToolAttribute(attribute: Attr): boolean {
  const qualifiedName = attribute.name.toLowerCase();
  return (
    qualifiedName.startsWith('inkscape:') ||
    qualifiedName.startsWith('sodipodi:') ||
    qualifiedName === 'xmlns:inkscape' ||
    qualifiedName === 'xmlns:sodipodi' ||
    TOOL_NAMESPACES.some((namespace) => attribute.namespaceURI === namespace)
  );
}

function compactUrl(value: string): string {
  return value.replace(/[\u0000-\u0020]+/g, '').toLowerCase();
}

function isExternalOrDangerousHref(value: string): boolean {
  const compact = compactUrl(value);
  return (
    compact.startsWith('javascript:') ||
    compact.startsWith('vbscript:') ||
    compact.startsWith('http:') ||
    compact.startsWith('https:') ||
    compact.startsWith('//') ||
    compact.startsWith('data:text/html') ||
    compact.startsWith('data:image/svg+xml')
  );
}

function hasExternalCssUrl(value: string): boolean {
  return /url\(\s*['"]?(?:(?:https?:)?\/\/)/i.test(value);
}

function collectSpecialNodes(document: Document): Node[] {
  const nodes: Node[] = [];
  const walker = document.createTreeWalker(
    document,
    NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_PROCESSING_INSTRUCTION,
  );
  let current = walker.nextNode();
  while (current) {
    nodes.push(current);
    current = walker.nextNode();
  }
  return nodes;
}

export interface SanitizedSvg {
  document: Document;
  warnings: SvgWarning[];
}

export function sanitizeSvg(svgText: string): SanitizedSvg {
  const parsed = parseSvgDocument(svgText);
  const document = parsed.cloneNode(true) as Document;
  const warnings: SvgWarning[] = [];

  for (const node of collectSpecialNodes(document)) {
    const label = node.nodeType === Node.COMMENT_NODE ? '注释' : 'XML 处理指令';
    warnings.push({ code: 'removed-node', message: `已删除${label}` });
    node.parentNode?.removeChild(node);
  }

  for (const element of Array.from(document.querySelectorAll('*'))) {
    if (!element.isConnected) {
      continue;
    }

    const localName = element.localName.toLowerCase();
    if (DANGEROUS_ELEMENTS.has(localName) || isToolElement(element)) {
      warnings.push({
        code: 'removed-element',
        message: `已删除危险或工具专用节点 <${element.nodeName}>`,
      });
      element.remove();
      continue;
    }

    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      const localAttributeName = (attribute.localName || attribute.name).toLowerCase();
      const value = attribute.value;

      if (localAttributeName.startsWith('on') && localAttributeName.length > 2) {
        warnings.push({
          code: 'removed-event',
          message: `<${element.nodeName}> 的 ${attribute.name} 事件属性已删除`,
        });
        element.removeAttributeNode(attribute);
        continue;
      }

      if (localAttributeName === 'style') {
        warnings.push({
          code: 'removed-style',
          message: `<${element.nodeName}> 的内联 style 已删除`,
        });
        element.removeAttributeNode(attribute);
        continue;
      }

      if (isToolAttribute(attribute)) {
        warnings.push({
          code: 'removed-tool-attribute',
          message: `已删除工具专用属性 ${attribute.name}`,
        });
        element.removeAttributeNode(attribute);
        continue;
      }

      const isLinkAttribute =
        localAttributeName === 'href' ||
        localAttributeName === 'src' ||
        name === 'xlink:href';

      if (isLinkAttribute && isExternalOrDangerousHref(value)) {
        warnings.push({
          code: 'removed-external-reference',
          message: `<${element.nodeName}> 的外部或危险 ${attribute.name} 已删除`,
        });
        element.removeAttributeNode(attribute);
        continue;
      }

      if (hasExternalCssUrl(value)) {
        warnings.push({
          code: 'removed-external-reference',
          message: `<${element.nodeName}> 的 ${attribute.name} 外部 URL 已删除`,
        });
        element.removeAttributeNode(attribute);
      }
    }
  }

  return { document, warnings };
}

function removeFormattingWhitespace(root: Element): void {
  const elements = [root, ...Array.from(root.querySelectorAll('*'))];
  for (const element of elements) {
    if (['text', 'tspan', 'textpath'].includes(element.localName.toLowerCase())) {
      continue;
    }
    for (const child of Array.from(element.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE && !child.nodeValue?.trim()) {
        child.parentNode?.removeChild(child);
      }
    }
  }
}

function normalizeAttributes(root: Element): void {
  const elements = [root, ...Array.from(root.querySelectorAll('*'))];
  for (const element of elements) {
    for (const attribute of Array.from(element.attributes)) {
      const normalized = attribute.value.trim().replace(/\s+/g, ' ');
      if (!normalized) {
        element.removeAttributeNode(attribute);
      } else if (normalized !== attribute.value) {
        attribute.value = normalized;
      }
    }
  }
}

export interface NormalizeSvgOptions {
  preserveColors?: boolean;
}

export interface NormalizedSvg {
  svg: string;
  viewBox: string;
  warnings: SvgWarning[];
}

export function normalizeSvg(
  sanitizedDocument: Document,
  options: NormalizeSvgOptions = {},
): NormalizedSvg {
  const root = sanitizedDocument.documentElement;
  if (!root || root.localName.toLowerCase() !== 'svg') {
    throw new Error('清理后的文档根节点不是 <svg>');
  }

  if (!root.hasAttribute('xmlns') && root.namespaceURI !== SVG_NAMESPACE) {
    root.setAttribute('xmlns', SVG_NAMESPACE);
  }

  const viewBoxResult = normalizeViewBox(root);
  normalizeAttributes(root);
  removeFormattingWhitespace(root);

  if (!options.preserveColors && !root.hasAttribute('fill')) {
    root.setAttribute('fill', 'currentColor');
  }

  return {
    svg: new XMLSerializer().serializeToString(root),
    viewBox: viewBoxResult.viewBox,
    warnings: viewBoxResult.warnings,
  };
}




