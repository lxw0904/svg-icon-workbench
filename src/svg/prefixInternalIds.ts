function safeInternalId(value: string): string {
  const normalized = value
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^A-Za-z0-9_.:-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || 'id';
}

function collectIds(root: Element, iconId: string): Map<string, string> {
  const idMap = new Map<string, string>();
  const used = new Set<string>();
  const elements = [root, ...Array.from(root.querySelectorAll('*'))];

  for (const element of elements) {
    const idAttribute = Array.from(element.attributes).find(
      (attribute) => attribute.localName === 'id',
    );
    if (!idAttribute) continue;

    const originalId = idAttribute.value;
    const base = `${iconId}__${safeInternalId(originalId)}`;
    let nextId = base;
    let suffix = 2;
    while (used.has(nextId)) {
      nextId = `${base}-${suffix}`;
      suffix += 1;
    }

    used.add(nextId);
    idAttribute.value = nextId;
    if (!idMap.has(originalId)) {
      idMap.set(originalId, nextId);
    }
  }

  return idMap;
}

function mapReference(
  rawId: string,
  idMap: Map<string, string>,
  iconId: string,
): { id: string; unresolved: boolean } {
  const existing = idMap.get(rawId);
  if (existing) return { id: existing, unresolved: false };

  const fallback = `${iconId}__${safeInternalId(rawId)}`;
  idMap.set(rawId, fallback);
  return { id: fallback, unresolved: true };
}

export function prefixInternalIds(root: Element, iconId: string): string[] {
  const warnings: string[] = [];
  const idMap = collectIds(root, iconId);
  const elements = [root, ...Array.from(root.querySelectorAll('*'))];

  for (const element of elements) {
    for (const attribute of Array.from(element.attributes)) {
      const localName = attribute.localName.toLowerCase();

      if (localName === 'href' && attribute.value.trim().startsWith('#')) {
        const rawId = attribute.value.trim().slice(1);
        const mapped = mapReference(rawId, idMap, iconId);
        attribute.value = `#${mapped.id}`;
        if (mapped.unresolved) {
          warnings.push(`引用了未定义的内部 ID #${rawId}，已加上当前图标前缀`);
        }
        continue;
      }

      if (!/url\(/i.test(attribute.value)) continue;

      attribute.value = attribute.value.replace(
        /url\(\s*(['\"]?)#([^)'\"\s]+)\1\s*\)/gi,
        (_match, _quote: string, rawId: string) => {
          const mapped = mapReference(rawId, idMap, iconId);
          if (mapped.unresolved) {
            warnings.push(`url(#${rawId}) 未找到对应 ID，已加上当前图标前缀`);
          }
          return `url(#${mapped.id})`;
        },
      );
    }
  }

  return warnings;
}



