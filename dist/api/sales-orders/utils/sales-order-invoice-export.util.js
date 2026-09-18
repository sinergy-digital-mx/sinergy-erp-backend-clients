"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SALES_ORDER_INVOICE_EXPORT_COLUMNS = void 0;
exports.isExportableInvoice = isExportableInvoice;
exports.pickPrimaryInvoice = pickPrimaryInvoice;
exports.groupInvoicesByOrderId = groupInvoicesByOrderId;
exports.emptyInvoiceExportRow = emptyInvoiceExportRow;
exports.mapInvoiceExportRow = mapInvoiceExportRow;
const VISIBLE_STAMP_STATUSES = new Set([
    'stamped',
    'cancel_pending',
    'cancelled',
    'cancel_error',
]);
const STAMP_STATUS_LABELS = {
    stamped: 'Activa en sistema',
    stamp_error: 'Error de timbrado',
    cancel_pending: 'Cancelación pendiente',
    cancel_error: 'Error de cancelación',
    cancelled: 'Cancelada',
    pending_stamp: 'Pendiente',
    pending: 'Pendiente',
};
const TIPO_COMPROBANTE_LABELS = {
    I: 'Ingreso',
    E: 'Egreso',
    T: 'Traslado',
    N: 'Nómina',
    P: 'Pago',
};
const CANCEL_MOTIVO_LABELS = {
    '01': '01 - Comprobante emitido con errores con relación',
    '02': '02 - Comprobante emitido con errores sin relación',
    '03': '03 - No se llevó a cabo la operación',
    '04': '04 - Operación nominativa en factura global',
};
function isExportableInvoice(invoice) {
    return VISIBLE_STAMP_STATUSES.has(String(invoice.stamp_status || ''));
}
function pickPrimaryInvoice(invoices) {
    const visible = invoices.filter(isExportableInvoice);
    if (visible.length === 0) {
        return null;
    }
    return [...visible].sort((a, b) => {
        const rankDiff = invoiceRank(b) - invoiceRank(a);
        if (rankDiff !== 0)
            return rankDiff;
        return invoiceTime(b) - invoiceTime(a);
    })[0];
}
function groupInvoicesByOrderId(invoices) {
    const map = new Map();
    for (const invoice of invoices) {
        const list = map.get(invoice.source_id) ?? [];
        list.push(invoice);
        map.set(invoice.source_id, list);
    }
    return map;
}
function emptyInvoiceExportRow() {
    return {
        invoice_count: 0,
        invoice_facturado: 'No',
        invoice_uuid: '',
        invoice_uuids: '',
        invoice_series: '',
        invoice_folio: '',
        invoice_series_folio: '',
        invoice_tipo: '',
        invoice_rfc_emisor: '',
        invoice_rfc_receptor: '',
        invoice_receptor: '',
        invoice_subtotal: '',
        invoice_total: '',
        invoice_currency: '',
        invoice_environment: '',
        invoice_stamped_at: '',
        invoice_stamp_status: '',
        invoice_sat_status: '',
        invoice_sat_cancelable: '',
        invoice_sat_cancel_status: '',
        invoice_sat_status_code: '',
        invoice_sat_last_sync: '',
        invoice_cancel_motivo: '',
        invoice_cancel_replacement_uuid: '',
        invoice_stamp_error: '',
    };
}
function mapInvoiceExportRow(invoices, formatDateTime) {
    const visible = invoices.filter(isExportableInvoice);
    const primary = pickPrimaryInvoice(visible);
    if (!primary) {
        return emptyInvoiceExportRow();
    }
    const uuids = visible
        .map((invoice) => invoice.uuid?.trim())
        .filter((uuid) => !!uuid);
    return {
        invoice_count: visible.length,
        invoice_facturado: 'Sí',
        invoice_uuid: primary.uuid?.trim() ?? '',
        invoice_uuids: [...new Set(uuids)].join('; '),
        invoice_series: primary.series?.trim() ?? '',
        invoice_folio: primary.folio?.trim() ?? '',
        invoice_series_folio: [primary.series, primary.folio].filter(Boolean).join('-'),
        invoice_tipo: tipoComprobanteLabel(primary.tipo_comprobante),
        invoice_rfc_emisor: primary.rfc_emisor ?? '',
        invoice_rfc_receptor: primary.rfc_receptor ?? '',
        invoice_receptor: primary.receptor_nombre?.trim() ?? '',
        invoice_subtotal: Number(primary.subtotal) || 0,
        invoice_total: Number(primary.total) || 0,
        invoice_currency: primary.currency ?? 'MXN',
        invoice_environment: environmentLabel(primary.metadata),
        invoice_stamped_at: formatDateTime(primary.stamped_at),
        invoice_stamp_status: STAMP_STATUS_LABELS[primary.stamp_status] ?? primary.stamp_status,
        invoice_sat_status: primary.sat_status?.trim() || 'Sin verificar',
        invoice_sat_cancelable: primary.sat_es_cancelable?.trim() ?? '',
        invoice_sat_cancel_status: primary.sat_estatus_cancelacion?.trim() ?? '',
        invoice_sat_status_code: primary.sat_codigo_estatus?.trim() ?? '',
        invoice_sat_last_sync: formatDateTime(primary.sat_last_sync_at),
        invoice_cancel_motivo: cancelMotivoLabel(primary.cancel_motivo),
        invoice_cancel_replacement_uuid: primary.cancel_replacement_uuid?.trim() ?? '',
        invoice_stamp_error: primary.stamp_error_message?.trim() ?? '',
    };
}
exports.SALES_ORDER_INVOICE_EXPORT_COLUMNS = [
    { header: 'Facturado', key: 'invoice_facturado', width: 12 },
    { header: 'Facturas', key: 'invoice_count', width: 10, type: 'integer' },
    { header: 'UUID', key: 'invoice_uuid', width: 38 },
    { header: 'UUIDs', key: 'invoice_uuids', width: 40 },
    { header: 'Serie', key: 'invoice_series', width: 10 },
    { header: 'Folio factura', key: 'invoice_folio', width: 14 },
    { header: 'Serie-Folio', key: 'invoice_series_folio', width: 16 },
    { header: 'Tipo CFDI', key: 'invoice_tipo', width: 12 },
    { header: 'RFC emisor', key: 'invoice_rfc_emisor', width: 16 },
    { header: 'RFC receptor', key: 'invoice_rfc_receptor', width: 16 },
    { header: 'Receptor', key: 'invoice_receptor', width: 28 },
    { header: 'Subtotal factura', key: 'invoice_subtotal', width: 16, type: 'currency' },
    { header: 'Total factura', key: 'invoice_total', width: 14, type: 'currency' },
    { header: 'Moneda', key: 'invoice_currency', width: 10 },
    { header: 'Ambiente', key: 'invoice_environment', width: 10 },
    { header: 'Fecha timbrado', key: 'invoice_stamped_at', width: 18, type: 'date' },
    { header: 'Estatus timbrado', key: 'invoice_stamp_status', width: 22 },
    { header: 'Estatus SAT', key: 'invoice_sat_status', width: 16 },
    { header: 'Cancelable SAT', key: 'invoice_sat_cancelable', width: 16 },
    { header: 'Estatus cancel. SAT', key: 'invoice_sat_cancel_status', width: 20 },
    { header: 'Código SAT', key: 'invoice_sat_status_code', width: 18 },
    { header: 'Última sync SAT', key: 'invoice_sat_last_sync', width: 18, type: 'date' },
    { header: 'Motivo cancelación', key: 'invoice_cancel_motivo', width: 36 },
    { header: 'UUID sustituto', key: 'invoice_cancel_replacement_uuid', width: 38 },
    { header: 'Error timbrado', key: 'invoice_stamp_error', width: 36 },
];
function invoiceRank(invoice) {
    if (invoice.sat_status === 'Vigente' && invoice.stamp_status === 'stamped')
        return 100;
    if (invoice.stamp_status === 'stamped')
        return 80;
    if (invoice.stamp_status === 'cancel_pending')
        return 60;
    if (invoice.stamp_status === 'cancel_error')
        return 40;
    if (invoice.stamp_status === 'cancelled')
        return 20;
    return 0;
}
function invoiceTime(invoice) {
    const value = invoice.stamped_at ?? invoice.created_at;
    const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
    return Number.isFinite(time) ? time : 0;
}
function tipoComprobanteLabel(code) {
    const key = String(code || '').trim().toUpperCase();
    if (!key)
        return '';
    return TIPO_COMPROBANTE_LABELS[key] ?? key;
}
function cancelMotivoLabel(code) {
    const key = String(code || '').trim();
    if (!key)
        return '';
    return CANCEL_MOTIVO_LABELS[key] ?? key;
}
function environmentLabel(metadata) {
    const raw = String(metadata?.['finkok_environment'] ?? '').trim().toLowerCase();
    if (raw === 'demo')
        return 'DEMO';
    if (raw === 'production')
        return 'PROD';
    return raw ? raw.toUpperCase() : '';
}
//# sourceMappingURL=sales-order-invoice-export.util.js.map