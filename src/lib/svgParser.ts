export class SvgParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SvgParseError';
  }
}

export function parseSvgDocument(svgText: string): Document {
  if (!svgText.trim()) {
    throw new SvgParseError('文件内容为空');
  }

  // XML declarations are intentionally discarded before parsing. This also accepts
  // files that contain harmless leading whitespace before an otherwise valid declaration.
  const source = svgText.replace(/^\uFEFF?\s*<\?xml[\s\S]*?\?>/i, '');
  const document = new DOMParser().parseFromString(source, 'image/svg+xml');
  const parserError = document.getElementsByTagName('parsererror')[0];

  if (parserError) {
    const detail = parserError.textContent?.replace(/\s+/g, ' ').trim();
    throw new SvgParseError(detail ? `XML 解析失败：${detail}` : 'XML 格式损坏或不完整');
  }

  const root = document.documentElement;
  if (!root || root.localName.toLowerCase() !== 'svg') {
    throw new SvgParseError('根节点不是 <svg>');
  }

  return document;
}
