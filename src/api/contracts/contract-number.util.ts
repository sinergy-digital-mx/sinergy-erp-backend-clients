export function buildContractNumberFromPropertyCode(code: string): string {
  const rest = code.trim().replace(/^LOT-/i, '');
  return `CONT-${rest}`.slice(0, 50);
}
