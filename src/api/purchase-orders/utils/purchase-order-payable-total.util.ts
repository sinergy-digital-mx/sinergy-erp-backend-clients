import {
  derivePersistedLandedCashTotals,
  isRealCostEnabled,
  parseRealCostNumber,
} from './purchase-order-real-cost.util';

export type PurchaseOrderPayableSource = {
  general_status?: string | null;
  payment_currency?: string | null;
  requested_total?: number | string | null;
  received_total?: number | string | null;
  customs_exchange_rate?: number | string | null;
  landed_merchandise_mxn?: number | string | null;
  landed_extras_mxn?: number | string | null;
  landed_invoice_extras_mxn?: number | string | null;
};

export function purchaseOrderHasPersistedRealCost(
  order: PurchaseOrderPayableSource,
): boolean {
  return (
    isRealCostEnabled(order.customs_exchange_rate, 0) ||
    parseRealCostNumber(order.landed_extras_mxn) > 0 ||
    parseRealCostNumber(order.landed_invoice_extras_mxn) > 0 ||
    parseRealCostNumber(order.landed_merchandise_mxn) > 0
  );
}

export function catalogPurchaseOrderTotal(
  order: PurchaseOrderPayableSource,
): number {
  const requestedTotal = Number(order.requested_total || 0);
  const receivedTotal = Number(order.received_total || 0);
  if (order.general_status === 'Recibida') {
    return receivedTotal > 0 ? receivedTotal : requestedTotal;
  }
  return requestedTotal;
}

export function resolvePurchaseOrderPayableTotal(
  order: PurchaseOrderPayableSource,
): number {
  const catalogTotal = catalogPurchaseOrderTotal(order);
  if (!purchaseOrderHasPersistedRealCost(order)) {
    return catalogTotal;
  }
  const cash = derivePersistedLandedCashTotals({
    merchandise_mxn: order.landed_merchandise_mxn,
    extras_mxn: order.landed_extras_mxn,
    invoice_extras_mxn: order.landed_invoice_extras_mxn,
    customs_exchange_rate: order.customs_exchange_rate,
  });
  const currency = String(order.payment_currency ?? 'MXN').trim().toUpperCase();
  const invoiceTotal = currency === 'USD' ? cash.invoice_usd : cash.invoice_mxn;
  if (invoiceTotal == null || invoiceTotal <= 0) {
    return catalogTotal;
  }
  return invoiceTotal;
}
