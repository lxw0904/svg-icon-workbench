import type { SvgWarning } from '../types';

const NUMBER_WITH_OPTIONAL_UNIT = /^\d+(?:\.\d+)?(?:px)?$/i;

function normalizeDimension(value: string | null): string | null {
  if (!value || !NUMBER_WITH_OPTIONAL_UNIT.test(value.trim())) {
    return null;
  }
  return value.trim().replace(/px$/i, '');
}

export interface ViewBoxResult {
  viewBox: string;
  warnings: SvgWarning[];
}

export function normalizeViewBox(root: Element): ViewBoxResult {
  const existing = root.getAttribute('viewBox');
  let viewBox: string;
  const warnings: SvgWarning[] = [];

  if (existing?.trim()) {
    viewBox = existing.trim().replace(/\s+/g, ' ');
  } else {
    const width = normalizeDimension(root.getAttribute('width'));
    const height = normalizeDimension(root.getAttribute('height'));

    if (width && height) {
      viewBox = `0 0 ${width} ${height}`;
    } else {
      viewBox = '0 0 24 24';
      warnings.push({
        code: 'viewbox-fallback',
        message: '缺少 viewBox 和数字 width/height，已使用 0 0 24 24',
      });
    }
  }

  root.setAttribute('viewBox', viewBox);
  root.removeAttribute('width');
  root.removeAttribute('height');
  root.removeAttribute('x');
  root.removeAttribute('y');

  return { viewBox, warnings };
}
