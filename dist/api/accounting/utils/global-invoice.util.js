"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseGlobalInvoiceMonth = parseGlobalInvoiceMonth;
exports.currentGlobalInvoiceMonth = currentGlobalInvoiceMonth;
exports.globalInvoiceActiveKey = globalInvoiceActiveKey;
exports.monthLabel = monthLabel;
exports.resolveGlobalInvoicePayment = resolveGlobalInvoicePayment;
exports.fiveDigitPostalCode = fiveDigitPostalCode;
exports.readXmlAttr = readXmlAttr;
exports.assertSalesOrderNotInGlobalInvoice = assertSalesOrderNotInGlobalInvoice;
const common_1 = require("@nestjs/common");
const payment_cfdi_util_1 = require("../../electronic-invoicing/utils/payment-cfdi.util");
const BUSINESS_TIME_ZONE = 'America/Tijuana';
function parseGlobalInvoiceMonth(value) {
    const match = /^(\d{4})-(\d{2})$/.exec(String(value ?? '').trim());
    if (!match)
        return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    if (!Number.isInteger(year) || month < 1 || month > 12)
        return null;
    const lastDay = new Date(year, month, 0).getDate();
    const mm = match[2];
    return {
        year,
        month,
        from: `${year}-${mm}-01`,
        to: `${year}-${mm}-${String(lastDay).padStart(2, '0')}`,
        label: monthLabel(year, month),
    };
}
function currentGlobalInvoiceMonth(now = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: BUSINESS_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
    }).formatToParts(now);
    const year = parts.find((part) => part.type === 'year')?.value ?? '0000';
    const month = parts.find((part) => part.type === 'month')?.value ?? '01';
    return `${year}-${month}`;
}
function globalInvoiceActiveKey(billingBranchId, year, month) {
    return `${billingBranchId}:${year}:${String(month).padStart(2, '0')}`;
}
function monthLabel(year, month) {
    const date = new Date(Date.UTC(year, month - 1, 1));
    const label = new Intl.DateTimeFormat('es-MX', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(date);
    return label.charAt(0).toUpperCase() + label.slice(1);
}
function resolveGlobalInvoicePayment(orders) {
    const unpaid = orders.some((order) => order.payment_status !== 'Pagado');
    if (unpaid) {
        return { formaPago: '99', metodoPago: 'PPD' };
    }
    const codes = new Set();
    for (const order of orders) {
        const methods = order.lines
            .map((line) => line.method)
            .filter((method) => method && method !== 'credit');
        if (methods.length > 1) {
            codes.add('99');
            continue;
        }
        const method = methods[0] ?? order.payment_method;
        codes.add((0, payment_cfdi_util_1.formaPagoFromSalesMethod)(method) ?? '99');
    }
    if (codes.size === 1) {
        return { formaPago: [...codes][0], metodoPago: 'PUE' };
    }
    return { formaPago: '99', metodoPago: 'PUE' };
}
function fiveDigitPostalCode(value) {
    const digits = String(value ?? '').replace(/\D/g, '');
    return /^\d{5}$/.test(digits) ? digits : '';
}
function readXmlAttr(xml, name) {
    const match = new RegExp(`\\b${name}="([^"]*)"`).exec(xml);
    return match?.[1] ?? '';
}
async function assertSalesOrderNotInGlobalInvoice(manager, tenantId, salesOrderId) {
    const rows = await manager.query(`SELECT gi.id
     FROM global_invoice_orders gio
     INNER JOIN global_invoices gi ON gi.id = gio.global_invoice_id
     WHERE gio.sales_order_id = ?
       AND gi.tenant_id = ?
       AND gi.status IN ('pending', 'active')
     LIMIT 1`, [salesOrderId, tenantId]);
    if (Array.isArray(rows) && rows.length > 0) {
        throw new common_1.BadRequestException('Esta orden ya está en la factura a público en general del mes. Cancélala en Cobranza si quieres facturarla sola.');
    }
}
//# sourceMappingURL=global-invoice.util.js.map