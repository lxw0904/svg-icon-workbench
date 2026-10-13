import { processIcon, type ProcessIconOptions } from './processIcon';
import type { IconProcessError, IconSource, ProcessedIcon } from '../types';

export interface ProcessIconsResult {
  icons: ProcessedIcon[];
  errors: IconProcessError[];
}

export function processIcons(
  sources: IconSource[],
  options: ProcessIconOptions,
): ProcessIconsResult {
  const icons: ProcessedIcon[] = [];
  const errors: IconProcessError[] = [];

  for (const source of sources) {
    try {
      icons.push(processIcon(source, options));
    } catch (error) {
      errors.push({
        fileName: source.fileName,
        reason: error instanceof Error ? error.message : '处理失败',
      });
    }
  }

  return { icons, errors };
}
