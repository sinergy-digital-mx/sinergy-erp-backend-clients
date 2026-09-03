export function roundPosMoney(value: number): number {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function expectedCashInDrawer(params: {
  opening: number;
  collectedCash: number;
  removed: number;
}): number {
  return roundPosMoney(params.opening + params.collectedCash - params.removed);
}

export function cashDifference(counted: number, expected: number): number {
  return roundPosMoney(counted - expected);
}
