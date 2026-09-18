"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VENDOR_INVOICE_MAX_COUNT = exports.VENDOR_INVOICE_MAX_LENGTH = void 0;
exports.firstVendorInvoiceNumber = firstVendorInvoiceNumber;
exports.formatVendorInvoiceNumbers = formatVendorInvoiceNumbers;
exports.parseStoredVendorInvoiceNumbers = parseStoredVendorInvoiceNumbers;
exports.normalizeVendorInvoiceNumbers = normalizeVendorInvoiceNumbers;
exports.resolveVendorInvoiceInput = resolveVendorInvoiceInput;
const common_1 = require("@nestjs/common");
exports.VENDOR_INVOICE_MAX_LENGTH = 60;
exports.VENDOR_INVOICE_MAX_COUNT = 20;
function firstVendorInvoiceNumber(numbers) {
    return numbers[0] ?? null;
}
function formatVendorInvoiceNumbers(numbers) {
    return numbers.length ? numbers.join(' · ') : null;
}
function parseStoredVendorInvoiceNumbers(stored, fallback) {
    if (Array.isArray(stored)) {
        return stored
            .map((item) => String(item ?? '').trim())
            .filter((item) => item.length > 0);
    }
    if (typeof stored === 'string' && stored.trim()) {
        try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                return parseStoredVendorInvoiceNumbers(parsed, fallback);
            }
        }
        catch {
            const trimmed = stored.trim();
            if (trimmed) {
                return [trimmed];
            }
        }
    }
    const single = fallback?.trim() ?? '';
    return single ? [single] : [];
}
function normalizeVendorInvoiceNumbers(value) {
    const raw = Array.isArray(value)
        ? value
        : value == null || value === ''
            ? []
            : [value];
    const seen = new Set();
    const result = [];
    for (const item of raw) {
        const trimmed = String(item ?? '').trim();
        if (!trimmed) {
            continue;
        }
        if (trimmed.length > exports.VENDOR_INVOICE_MAX_LENGTH) {
            throw new common_1.BadRequestException(`Cada factura de proveedor no puede exceder ${exports.VENDOR_INVOICE_MAX_LENGTH} caracteres`);
        }
        const key = trimmed.toLowerCase();
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);
        result.push(trimmed);
    }
    if (result.length > exports.VENDOR_INVOICE_MAX_COUNT) {
        throw new common_1.BadRequestException(`No se pueden registrar más de ${exports.VENDOR_INVOICE_MAX_COUNT} facturas de proveedor`);
    }
    return result;
}
function resolveVendorInvoiceInput(dto) {
    if (dto.vendor_invoice_numbers !== undefined) {
        return normalizeVendorInvoiceNumbers(dto.vendor_invoice_numbers);
    }
    if (dto.vendor_invoice_number !== undefined) {
        return normalizeVendorInvoiceNumbers(dto.vendor_invoice_number);
    }
    return undefined;
}
//# sourceMappingURL=purchase-order-vendor-invoice.util.js.map