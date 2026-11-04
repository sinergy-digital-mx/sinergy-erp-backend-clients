"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestedLineUomName = requestedLineUomName;
exports.receivedLineUomName = receivedLineUomName;
exports.vendorInvoicePdfText = vendorInvoicePdfText;
const purchase_order_vendor_invoice_util_1 = require("./purchase-order-vendor-invoice.util");
function firstText(...values) {
    for (const value of values) {
        const trimmed = value?.trim();
        if (trimmed) {
            return trimmed;
        }
    }
    return '';
}
function requestedLineUomName(item, fallback = 'UOM') {
    return (firstText(item.product_uom?.uom?.name, item.uom?.name, item.uom_name) || fallback);
}
function receivedLineUomName(item, fallback = 'UOM') {
    return (firstText(item.received_uom?.name, item.product_uom?.uom?.name, item.uom?.name, item.uom_name) || fallback);
}
function vendorInvoicePdfText(order, emptyLabel) {
    const numbers = (0, purchase_order_vendor_invoice_util_1.parseStoredVendorInvoiceNumbers)(order.vendor_invoice_numbers, order.vendor_invoice_number);
    return (0, purchase_order_vendor_invoice_util_1.formatVendorInvoiceNumbers)(numbers) || emptyLabel;
}
//# sourceMappingURL=purchase-order-pdf-fields.util.js.map