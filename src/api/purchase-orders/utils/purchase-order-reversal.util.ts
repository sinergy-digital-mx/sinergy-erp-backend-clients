export const PURCHASE_REVERSAL_QTY_EPSILON = 0.001;

export function roundPurchaseQty(value: unknown): number {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return parseFloat(parsed.toFixed(3));
}

export type PurchaseLotStock = {
  batch_id: string;
  batch_number: string;
  product_label: string;
  initial_quantity: number;
  available_quantity: number;
  missing_quantity: number;
  transferred_from_batch_id?: string | null;
};

export function lotsBlockingFullExit(
  lots: PurchaseLotStock[],
): PurchaseLotStock[] {
  return lots
    .filter((lot) => !lot.transferred_from_batch_id)
    .map((lot) => {
      const initial = roundPurchaseQty(lot.initial_quantity);
      const available = roundPurchaseQty(lot.available_quantity);
      const missing = roundPurchaseQty(initial - available);
      return { ...lot, initial_quantity: initial, available_quantity: available, missing_quantity: missing };
    })
    .filter((lot) => lot.missing_quantity > PURCHASE_REVERSAL_QTY_EPSILON);
}

export function formatBlockedLotsMessage(
  folio: string,
  lots: PurchaseLotStock[],
): string {
  const lines = lots.map(
    (lot) =>
      `${lot.batch_number} (${lot.product_label}): ingresó ${lot.initial_quantity.toFixed(3)} y hay ${lot.available_quantity.toFixed(3)}`,
  );
  return `No se puede sacar el inventario de ${folio}. Primero audita estos lotes y repón la existencia: ${lines.join('; ')}`;
}

export function isPurchaseLotAlreadyExited(
  available: number,
  purchaseNet: number,
): boolean {
  return (
    roundPurchaseQty(available) <= PURCHASE_REVERSAL_QTY_EPSILON
    && roundPurchaseQty(purchaseNet) <= PURCHASE_REVERSAL_QTY_EPSILON
  );
}
