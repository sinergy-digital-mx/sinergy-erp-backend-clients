/** Normaliza códigos de entidad: Contract ≈ contracts, sales_orders ≈ SalesOrder. */
export function normalizeEntityCode(code: string): string {
  let value = (code ?? '').trim().toLowerCase().replace(/[_-]/g, '');
  if (!value) {
    return '';
  }
  if (value.endsWith('ies') && value.length > 4) {
    return `${value.slice(0, -3)}y`;
  }
  if (value.endsWith('s') && value.length > 3 && !value.endsWith('ss')) {
    return value.slice(0, -1);
  }
  return value;
}

export function entityCodesMatch(left: string | undefined, right: string | undefined): boolean {
  if (!left || !right) {
    return false;
  }
  return normalizeEntityCode(left) === normalizeEntityCode(right);
}
