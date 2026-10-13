export const MAX_FILE_BYTES = 1024 * 1024;
export const MAX_ICON_COUNT = 50;

export function validateSvgFile(file: File): void {
  const isSvgName = /\.svg$/i.test(file.name);
  const isSvgMime = file.type.toLowerCase() === 'image/svg+xml';
  if (!isSvgName && !isSvgMime) {
    throw new Error('不是 SVG 文件（需要 .svg 扩展名或 image/svg+xml 类型）');
  }

  if (file.size > MAX_FILE_BYTES) {
    throw new Error('文件超过 1MB 限制');
  }
}

export async function readSvgFile(file: File): Promise<string> {
  validateSvgFile(file);
  const content = await file.text();
  if (!content.trim()) {
    throw new Error('文件内容为空');
  }
  return content;
}
