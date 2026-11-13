export function resolveConvertSalesOrderType(
  quotationType: string | null | undefined,
  sendToPosCaja?: boolean,
): 'POS' | 'MANUAL' {
  if (sendToPosCaja === true) {
    return 'POS';
  }
  if (sendToPosCaja === false) {
    return 'MANUAL';
  }
  return quotationType === 'POS' ? 'POS' : 'MANUAL';
}
