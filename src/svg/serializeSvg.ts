export function serializeSvgRoot(root: Element): string {
  return new XMLSerializer().serializeToString(root);
}

export function serializeSvgChildren(root: Element): string {
  return Array.from(root.childNodes)
    .map((node) => new XMLSerializer().serializeToString(node))
    .join('');
}
