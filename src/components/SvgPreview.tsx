import { useMemo } from 'react';
import { parseSvgDocument } from '../lib/svgParser';

interface SvgPreviewProps {
  svg: string;
  fileName: string;
  dark: boolean;
  size: number;
  className?: string;
}

function tintCurrentColor(svg: string, color: string): string {
  const document = parseSvgDocument(svg);
  const root = document.documentElement;
  const elements = [root, ...Array.from(root.querySelectorAll('*'))];

  for (const element of elements) {
    for (const attribute of Array.from(element.attributes)) {
      if (attribute.value.includes('currentColor')) {
        attribute.value = attribute.value.replace(/currentColor/g, color);
      }
    }
  }

  return new XMLSerializer().serializeToString(root);
}

export function SvgPreview({
  svg,
  fileName,
  dark,
  size,
  className = '',
}: SvgPreviewProps) {
  const dataUrl = useMemo(() => {
    const color = dark ? '#f8fafc' : '#111827';
    const previewSvg = tintCurrentColor(svg, color);
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(previewSvg)}`;
  }, [dark, svg]);

  return (
    <img
      alt={`${fileName} 预览`}
      className={`svg-preview ${className}`}
      draggable={false}
      src={dataUrl}
      style={{ width: size, height: size }}
    />
  );
}
