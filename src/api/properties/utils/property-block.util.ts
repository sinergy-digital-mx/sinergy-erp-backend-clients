export function listPropertyBlocks(
  values: Array<string | null | undefined>,
): string[] {
  const unique = new Set<string>();
  for (const value of values) {
    const block = (value ?? '').trim();
    if (block) unique.add(block);
  }
  return [...unique].sort((a, b) =>
    a.localeCompare(b, 'es', { numeric: true, sensitivity: 'base' }),
  );
}
