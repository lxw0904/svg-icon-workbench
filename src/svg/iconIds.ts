function baseIconId(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/\.svg$/i, '')
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized || 'icon-1';
}

export function sanitizeIconId(value: string): string {
  return baseIconId(value);
}

export function iconIdFromFileName(fileName: string): string {
  return baseIconId(fileName.replace(/\.svg$/i, ''));
}

export function makeUniqueIconId(preferred: string, used: Set<string>): string {
  const base = sanitizeIconId(preferred);
  if (!used.has(base)) return base;

  let suffix = 2;
  while (used.has(`${base}-${suffix}`)) {
    suffix += 1;
  }
  return `${base}-${suffix}`;
}

export function dedupeIconIds<T extends { id: string }>(items: T[]): T[] {
  const used = new Set<string>();
  return items.map((item) => {
    const id = makeUniqueIconId(item.id, used);
    used.add(id);
    return id === item.id ? item : { ...item, id };
  });
}
