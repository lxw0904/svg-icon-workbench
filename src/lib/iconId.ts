export function normalizeIconId(value: string): string {
  const withoutExtension = value.replace(/\.svg$/i, '');
  const normalized = withoutExtension
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized || 'icon-1';
}

export function resolveUniqueIconId(preferredId: string, takenIds: Iterable<string>): string {
  const base = normalizeIconId(preferredId);
  const taken = new Set(takenIds);

  if (!taken.has(base)) {
    return base;
  }

  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) {
    suffix += 1;
  }
  return `${base}-${suffix}`;
}
