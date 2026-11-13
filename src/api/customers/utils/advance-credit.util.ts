export function roundAdvanceMoney(value: number): number {
  return Number((Number(value) || 0).toFixed(2));
}

export function advanceCreditPending(
  total: number,
  requested: number,
  paid: number,
): number {
  const covered = Math.max(
    roundAdvanceMoney(requested),
    roundAdvanceMoney(paid),
  );
  return roundAdvanceMoney(Math.max(roundAdvanceMoney(total) - covered, 0));
}

export function advanceDocumentPending(total: number, paid: number): number {
  return roundAdvanceMoney(
    Math.max(roundAdvanceMoney(total) - roundAdvanceMoney(paid), 0),
  );
}
