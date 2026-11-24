export function cajaRecallMessage(
  recalledByName?: string | null,
  folio?: string | null,
): string {
  const who = (recalledByName || '').trim() || 'Ventas';
  const which = (folio || '').trim();
  return which
    ? `${who} regresó ${which} a POS Ventas`
    : `${who} regresó esta venta a POS Ventas`;
}
