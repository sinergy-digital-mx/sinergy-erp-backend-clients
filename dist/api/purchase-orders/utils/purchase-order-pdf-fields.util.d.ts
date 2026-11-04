interface NamedUom {
    name?: string | null;
}
export interface PurchaseOrderLineUomSource {
    product_uom?: {
        uom?: NamedUom | null;
    } | null;
    received_uom?: NamedUom | null;
    uom?: NamedUom | null;
    uom_name?: string | null;
}
export interface PurchaseOrderInvoiceSource {
    vendor_invoice_numbers?: unknown;
    vendor_invoice_number?: string | null;
}
export declare function requestedLineUomName(item: PurchaseOrderLineUomSource, fallback?: string): string;
export declare function receivedLineUomName(item: PurchaseOrderLineUomSource, fallback?: string): string;
export declare function vendorInvoicePdfText(order: PurchaseOrderInvoiceSource, emptyLabel: string): string;
export {};
