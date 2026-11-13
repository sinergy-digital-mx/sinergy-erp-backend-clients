interface NamedLine {
  custom_description?: string | null;
  product?: { name?: string | null } | null;
}

export function lineConceptName(line: NamedLine, fallback = 'Producto'): string {
  const custom = line.custom_description?.trim();
  if (custom) return custom;
  return line.product?.name?.trim() || fallback;
}
