const DANGEROUS_ELEMENTS = new Set([
  'script',
  'foreignobject',
  'iframe',
  'object',
  'embed',
  'style',
  'metadata',
]);

const DANGEROUS_PREFIXES = new Set(['sodipodi', 'inkscape']);
const TEXT_CONTAINERS = new Set(['text', 'tspan', 'textpath']);

export interface SanitizeOptions {
  hadXmlDeclaration: boolean;
  preserveColor: boolean;
}

export interface SanitizeResult {
  root: Element;
  warnings: string[];
  viewBox: string;
}

function localName(element: Element): string {
  return (element.localName || element.tagName).toLowerCase();
}

function attributeByLocalName(element: Element, name: string): Attr | undefined {
  const lowerName = name.toLowerCase();
  return Array.from(element.attributes).find(
    (attribute) => attribute.localName.toLowerCase() === lowerName,
  );
}

function isDangerousElement(element: Element): boolean {
  const name = localName(element);
  const prefix = element.prefix?.toLowerCase() ?? '';
  return DANGEROUS_ELEMENTS.has(name) || DANGEROUS_PREFIXES.has(prefix);
}

function normalizeAttributeValue(value: string): string {
  return value.replace(/[\t\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

function removeDangerousElements(root: Element, warnings: string[]): void {
  const elements = Array.from(root.querySelectorAll('*'));
  for (const element of elements) {
    if (!isDangerousElement(element)) continue;
    const label = element.prefix ? `${element.prefix}:${element.localName}` : element.localName;
    warnings.push(`移除了危险元素 <${label}>`);
    element.parentNode?.removeChild(element);
  }
}

function removeComments(root: Element, warnings: string[]): void {
  const document = root.ownerDocument;
  const walker = document.createTreeWalker(root, 128);
  const comments: Comment[] = [];
  let current = walker.nextNode();
  while (current) {
    comments.push(current as Comment);
    current = walker.nextNode();
  }

  for (const comment of comments) {
    comment.parentNode?.removeChild(comment);
    warnings.push('移除了 XML 注释');
  }
}

function shouldPreserveWhitespace(node: Text): boolean {
  let current = node.parentElement;
  while (current) {
    if (TEXT_CONTAINERS.has(localName(current))) return true;
    const space = attributeByLocalName(current, 'xml:space');
    if (space?.value === 'preserve') return true;
    current = current.parentElement;
  }
  return false;
}

function removeWhitespaceOnlyText(root: Element): void {
  const document = root.ownerDocument;
  const walker = document.createTreeWalker(root, 4);
  const nodes: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    const text = current as Text;
    if (!text.data.trim() && !shouldPreserveWhitespace(text)) nodes.push(text);
    current = walker.nextNode();
  }

  for (const node of nodes) {
    node.parentNode?.removeChild(node);
  }
}

function removeAttribute(
  element: Element,
  attribute: Attr,
  reason: string,
  warnings: string[],
): void {
  warnings.push(`移除了 <${localName(element)}> 的 ${attribute.name}（${reason}）`);
  element.removeAttributeNode(attribute);
}

function sanitizeAttributes(root: Element, warnings: string[]): void {
  const elements = [root, ...Array.from(root.querySelectorAll('*'))];

  for (const element of elements) {
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      const attrLocalName = attribute.localName.toLowerCase();
      const prefix = attribute.prefix?.toLowerCase() ?? '';
      const compactValue = attribute.value
        .replace(/[\u0000-\u0020]/g, '')
        .toLowerCase();

      if (prefix && DANGEROUS_PREFIXES.has(prefix)) {
        removeAttribute(element, attribute, '命名空间已禁用', warnings);
        continue;
      }

      if (name === 'xmlns:sodipodi' || name === 'xmlns:inkscape') {
        removeAttribute(element, attribute, '命名空间已禁用', warnings);
        continue;
      }

      if (attrLocalName === 'style') {
        removeAttribute(element, attribute, '内联样式已禁用', warnings);
        continue;
      }

      if (attrLocalName.startsWith('on')) {
        removeAttribute(element, attribute, '事件属性已禁用', warnings);
        continue;
      }

      const isLinkAttribute = attrLocalName === 'href' || attrLocalName === 'src';
      const isJavascript = compactValue.includes('javascript:');
      const isExternal = /^(?:https?:)?\/\//i.test(compactValue);

      if (isLinkAttribute && (isJavascript || isExternal)) {
        removeAttribute(element, attribute, '外部或脚本链接已禁用', warnings);
        continue;
      }

      if (isJavascript || /url\(\s*['\"]?\s*(?:javascript:|(?:https?:)?\/\/)/i.test(attribute.value)) {
        removeAttribute(element, attribute, '发现外部或脚本 URL', warnings);
        continue;
      }

      attribute.value = normalizeAttributeValue(attribute.value);
      if (!attribute.value) {
        removeAttribute(element, attribute, '空属性已清理', warnings);
      }
    }
  }
}

function parseNumber(value: string | null): number | null {
  if (value === null || !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim())) {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatNumber(value: number): string {
  return Object.is(value, -0) ? '0' : String(value);
}

function normalizeViewBox(root: Element, warnings: string[]): string {
  const existingViewBox = attributeByLocalName(root, 'viewBox');
  let selectedViewBox: string | null = null;

  if (existingViewBox) {
    const parts = existingViewBox.value.trim().split(/[\s,]+/).filter(Boolean);
    const numbers = parts.map((part) => parseNumber(part));
    if (parts.length === 4 && numbers.every((number) => number !== null)) {
      selectedViewBox = numbers.map((number) => formatNumber(number as number)).join(' ');
    } else {
      warnings.push(`viewBox="${existingViewBox.value}" 无效，将尝试使用数字 width/height`);
    }
  }

  if (!selectedViewBox) {
    const width = parseNumber(attributeByLocalName(root, 'width')?.value ?? null);
    const height = parseNumber(attributeByLocalName(root, 'height')?.value ?? null);
    if (width !== null && height !== null && width > 0 && height > 0) {
      selectedViewBox = `0 0 ${formatNumber(width)} ${formatNumber(height)}`;
    } else {
      selectedViewBox = '0 0 24 24';
      if (existingViewBox) {
        warnings.push('无法从无效 viewBox 或 width/height 中得到尺寸，使用 0 0 24 24');
      } else if (width === null && height === null) {
        warnings.push('未找到 viewBox 或数字 width/height，使用 0 0 24 24');
      } else {
        warnings.push('width/height 不完整或不是纯数字，使用 0 0 24 24');
      }
    }
  }

  for (const attribute of Array.from(root.attributes)) {
    const name = attribute.localName.toLowerCase();
    if (name === 'viewbox' || name === 'width' || name === 'height' || name === 'x' || name === 'y') {
      root.removeAttributeNode(attribute);
    }
  }

  root.setAttribute('viewBox', selectedViewBox);
  return selectedViewBox;
}

function hasUsableColor(root: Element): boolean {
  const elements = [root, ...Array.from(root.querySelectorAll('*'))];
  const colorAttributes = ['fill', 'stroke', 'color'];

  for (const element of elements) {
    for (const name of colorAttributes) {
      const attribute = attributeByLocalName(element, name);
      if (!attribute) continue;
      const value = attribute.value.trim().toLowerCase();
      if (value && value !== 'none' && value !== 'transparent') {
        return true;
      }
    }
  }

  return false;
}

function normalizeColor(root: Element, preserveColor: boolean): void {
  if (!preserveColor && !hasUsableColor(root)) {
    root.setAttribute('fill', 'currentColor');
  }
}

export function sanitizeSvg(root: SVGSVGElement, options: SanitizeOptions): SanitizeResult {
  const cleanRoot = root.cloneNode(true) as Element;
  const warnings: string[] = [];

  if (options.hadXmlDeclaration) {
    warnings.push('移除了 XML 声明');
  }

  removeDangerousElements(cleanRoot, warnings);
  removeComments(cleanRoot, warnings);
  removeWhitespaceOnlyText(cleanRoot);
  sanitizeAttributes(cleanRoot, warnings);
  normalizeColor(cleanRoot, options.preserveColor);
  const viewBox = normalizeViewBox(cleanRoot, warnings);

  return { root: cleanRoot, warnings, viewBox };
}
