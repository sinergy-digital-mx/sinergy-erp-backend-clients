export declare const VENDOR_INVOICE_MAX_LENGTH = 60;
export declare const VENDOR_INVOICE_MAX_COUNT = 20;
export declare function firstVendorInvoiceNumber(numbers: string[]): string | null;
export declare function formatVendorInvoiceNumbers(numbers: string[]): string | null;
export declare function parseStoredVendorInvoiceNumbers(stored: unknown, fallback?: string | null): string[];
export declare function normalizeVendorInvoiceNumbers(value?: Array<string | null | undefined> | string | null): string[];
export declare function resolveVendorInvoiceInput(dto: {
    vendor_invoice_numbers?: Array<string | null> | null;
    vendor_invoice_number?: string | null;
}): string[] | undefined;
