export class SvgParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SvgParseError';
  }
}

export interface ParsedSvg {
  root: SVGSVGElement;
  hadXmlDeclaration: boolean;
}

function getParserError(document: Document): Element | null {
  const root = document.documentElement;
  if (!root) return null;

  if (root.localName.toLowerCase() === 'parsererror') {
    return root;
  }

  return document.getElementsByTagName('parsererror')[0] ?? null;
}

export function parseSvg(content: string): ParsedSvg {
  if (!content.trim()) {
    throw new SvgParseError('SVG 内容为空');
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(content, 'image/svg+xml');
  const parserError = getParserError(document);

  if (parserError) {
    const detail = parserError.textContent?.replace(/\s+/g, ' ').trim();
    throw new SvgParseError(detail ? `XML 解析失败：${detail}` : 'XML 解析失败');
  }

  const root = document.documentElement;
  if (!root || root.localName.toLowerCase() !== 'svg') {
    throw new SvgParseError('根节点不是 svg');
  }

  return {
    root: root as unknown as SVGSVGElement,
    hadXmlDeclaration: /^\s*<\?xml\b/i.test(content),
  };
}
