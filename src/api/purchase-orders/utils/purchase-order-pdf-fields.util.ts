import {
  formatVendorInvoiceNumbers,
  parseStoredVendorInvoiceNumbers,
} from './purchase-order-vendor-invoice.util';

interface NamedUom {
  name?: string | null;
}

export interface PurchaseOrderLineUomSource {
  product_uom?: { uom?: NamedUom | null } | null;
  received_uom?: NamedUom | null;
  uom?: NamedUom | null;
  uom_name?: string | null;
}

export interface PurchaseOrderInvoiceSource {
  vendor_invoice_numbers?: unknown;
  vendor_invoice_number?: string | null;
}

function firstText(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return '';
}

export function requestedLineUomName(
  item: PurchaseOrderLineUomSource,
  fallback = 'UOM',
): string {
  return (
    firstText(item.product_uom?.uom?.name, item.uom?.name, item.uom_name) || fallback
  );
}

export function receivedLineUomName(
  item: PurchaseOrderLineUomSource,
  fallback = 'UOM',
): string {
  return (
    firstText(
      item.received_uom?.name,
      item.product_uom?.uom?.name,
      item.uom?.name,
      item.uom_name,
    ) || fallback
  );
}

export function vendorInvoicePdfText(
  order: PurchaseOrderInvoiceSource,
  emptyLabel: string,
): string {
  const numbers = parseStoredVendorInvoiceNumbers(
    order.vendor_invoice_numbers,
    order.vendor_invoice_number,
  );
  return formatVendorInvoiceNumbers(numbers) || emptyLabel;
}
