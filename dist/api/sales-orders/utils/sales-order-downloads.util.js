"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emptyOrderDownloads = emptyOrderDownloads;
exports.documentDownloadKind = documentDownloadKind;
exports.buildOrderDownloads = buildOrderDownloads;
const sales_order_invoice_export_util_1 = require("./sales-order-invoice-export.util");
function emptyOrderDownloads() {
    return { invoice: null, ticket: null, order_document: null };
}
function documentDownloadKind(typeName) {
    const type = (typeName || '').trim().toUpperCase();
    if (type === 'TICKET / RECIBO' || type === 'TICKET_RECIBO')
        return 'ticket';
    if (type === 'DOCUMENTO_ORIGINAL')
        return 'original';
    if (type === 'ENTREGA' || type === 'RECIBO' || type === 'DOCUMENTO_RECIBO')
        return 'delivery';
    return null;
}
function buildOrderDownloads(orderIds, invoices, documents) {
    const invoicesByOrder = (0, sales_order_invoice_export_util_1.groupInvoicesByOrderId)(invoices);
    const result = new Map();
    for (const orderId of orderIds) {
        const downloads = emptyOrderDownloads();
        const primary = pickDisplayInvoice(invoicesByOrder.get(orderId) ?? []);
        if (primary) {
            downloads.invoice = {
                id: primary.id,
                series: primary.series ?? null,
                folio: primary.folio ?? null,
                uuid: primary.uuid ?? null,
                tipo_comprobante: primary.tipo_comprobante ?? null,
                rfc_emisor: primary.rfc_emisor ?? null,
                stamp_status: primary.stamp_status,
                sat_status: primary.sat_status ?? null,
                total: Number(primary.total) || 0,
                currency: primary.currency || 'MXN',
                rfc_receptor: primary.rfc_receptor ?? null,
                receptor_nombre: primary.receptor_nombre ?? null,
                stamped_at: primary.stamped_at ?? null,
                updated_at: primary.updated_at ?? null,
                sat_last_sync_at: primary.sat_last_sync_at ?? null,
            };
        }
        const docs = documents
            .filter((doc) => doc.sales_order_id === orderId)
            .sort((a, b) => timeOf(b.created_at) - timeOf(a.created_at));
        let delivery = null;
        for (const doc of docs) {
            const kind = documentDownloadKind(doc.type_name);
            if (!kind)
                continue;
            if (kind === 'ticket' && !downloads.ticket) {
                downloads.ticket = toShortcut(doc, kind);
            }
            else if (kind === 'original' && !downloads.order_document) {
                downloads.order_document = toShortcut(doc, kind);
            }
            else if (kind === 'delivery' && !delivery) {
                delivery = toShortcut(doc, kind);
            }
        }
        if (!downloads.order_document) {
            downloads.order_document = delivery;
        }
        result.set(orderId, downloads);
    }
    return result;
}
const LISTED_STAMP_STATUSES = new Set([
    'stamped',
    'cancel_pending',
    'cancelled',
    'cancel_error',
]);
function pickDisplayInvoice(invoices) {
    const visible = invoices.filter((invoice) => {
        if (String(invoice.sat_status || '') === 'Cancelado')
            return false;
        if (invoice.stamp_status === 'cancelled')
            return false;
        if (LISTED_STAMP_STATUSES.has(String(invoice.stamp_status || '')))
            return true;
        return !!invoice.uuid?.trim();
    });
    if (!visible.length)
        return null;
    return [...visible].sort((a, b) => {
        const aTime = timeOf(a.stamped_at || a.updated_at || a.created_at);
        const bTime = timeOf(b.stamped_at || b.updated_at || b.created_at);
        return bTime - aTime;
    })[0];
}
function toShortcut(doc, kind) {
    return {
        id: doc.id,
        file_name: doc.file_name,
        kind,
        file_path: doc.file_path,
    };
}
function timeOf(value) {
    const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
    return Number.isFinite(time) ? time : 0;
}
//# sourceMappingURL=sales-order-downloads.util.js.map