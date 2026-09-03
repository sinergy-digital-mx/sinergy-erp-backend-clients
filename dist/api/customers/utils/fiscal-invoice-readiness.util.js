"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FISCAL_INVOICE_REQUIRED_FIELDS = exports.GENERIC_INVOICE_RFCS = void 0;
exports.getFiscalInvoiceReadiness = getFiscalInvoiceReadiness;
exports.GENERIC_INVOICE_RFCS = new Set(['XAXX010101000', 'XEXX010101000']);
exports.FISCAL_INVOICE_REQUIRED_FIELDS = [
    'fiscal_rfc',
    'fiscal_razon_social',
    'fiscal_postal_code',
];
function getFiscalInvoiceReadiness(customer) {
    const missing = [];
    if (!customer) {
        return { fiscal_ready_for_invoice: false, fiscal_missing_fields: [...exports.FISCAL_INVOICE_REQUIRED_FIELDS] };
    }
    const rfc = customer.fiscal_rfc?.trim().toUpperCase() ?? '';
    const razon = customer.fiscal_razon_social?.trim() ?? '';
    const postalCode = customer.fiscal_postal_code?.trim() ?? '';
    if (!rfc || exports.GENERIC_INVOICE_RFCS.has(rfc)) {
        missing.push('fiscal_rfc');
    }
    if (!razon) {
        missing.push('fiscal_razon_social');
    }
    if (!/^\d{5}$/.test(postalCode)) {
        missing.push('fiscal_postal_code');
    }
    return {
        fiscal_ready_for_invoice: missing.length === 0,
        fiscal_missing_fields: missing,
    };
}
//# sourceMappingURL=fiscal-invoice-readiness.util.js.map