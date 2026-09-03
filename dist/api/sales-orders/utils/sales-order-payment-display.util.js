"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SALES_ORDER_PAYMENT_METHOD_LABELS = void 0;
exports.buildSalesOrderPaymentDisplay = buildSalesOrderPaymentDisplay;
const pos_sale_payment_method_enum_1 = require("../../../entities/pos/pos-sale-payment-method.enum");
exports.SALES_ORDER_PAYMENT_METHOD_LABELS = {
    [pos_sale_payment_method_enum_1.PosSalePaymentMethod.CASH]: 'Efectivo',
    [pos_sale_payment_method_enum_1.PosSalePaymentMethod.CARD]: 'Tarjeta',
    [pos_sale_payment_method_enum_1.PosSalePaymentMethod.TRANSFER]: 'Transferencia',
    [pos_sale_payment_method_enum_1.PosSalePaymentMethod.MIXED]: 'Mixto',
    [pos_sale_payment_method_enum_1.PosSalePaymentMethod.CREDIT]: 'Crédito',
};
const LINE_METHODS = [
    pos_sale_payment_method_enum_1.PosSalePaymentMethod.CASH,
    pos_sale_payment_method_enum_1.PosSalePaymentMethod.TRANSFER,
    pos_sale_payment_method_enum_1.PosSalePaymentMethod.CARD,
    pos_sale_payment_method_enum_1.PosSalePaymentMethod.CREDIT,
];
function toNumber(value) {
    const n = Number(value ?? 0);
    return Number.isFinite(n) ? n : 0;
}
function asMethod(value) {
    if (!value)
        return null;
    return Object.values(pos_sale_payment_method_enum_1.PosSalePaymentMethod).includes(value)
        ? value
        : null;
}
function line(method, amountMxn, amountUsd = 0) {
    if (amountMxn <= 0 && amountUsd <= 0)
        return null;
    return {
        method,
        label: exports.SALES_ORDER_PAYMENT_METHOD_LABELS[method],
        amount_mxn: Number(amountMxn.toFixed(2)),
        amount_usd: Number(amountUsd.toFixed(2)),
    };
}
function fromLines(method, lines) {
    if (!method && lines.length === 0) {
        return {
            payment_method: null,
            payment_method_label: null,
            payment_breakdown_label: null,
            lines: [],
        };
    }
    const resolved = method ??
        (lines.length > 1 ? pos_sale_payment_method_enum_1.PosSalePaymentMethod.MIXED : asMethod(lines[0]?.method) ?? null);
    const label = resolved ? exports.SALES_ORDER_PAYMENT_METHOD_LABELS[resolved] : null;
    const breakdown = lines.length > 1 ? lines.map((item) => item.label).join(' + ') : lines[0]?.label ?? label;
    return {
        payment_method: resolved,
        payment_method_label: label,
        payment_breakdown_label: breakdown,
        lines,
    };
}
function fromCollection(collection) {
    const method = asMethod(String(collection.payment_method));
    const lines = [
        line(pos_sale_payment_method_enum_1.PosSalePaymentMethod.CASH, toNumber(collection.amount_cash_mxn), toNumber(collection.amount_cash_usd)),
        line(pos_sale_payment_method_enum_1.PosSalePaymentMethod.TRANSFER, toNumber(collection.amount_transfer_mxn)),
        line(pos_sale_payment_method_enum_1.PosSalePaymentMethod.CARD, toNumber(collection.amount_card_mxn)),
        line(pos_sale_payment_method_enum_1.PosSalePaymentMethod.CREDIT, toNumber(collection.amount_credit_mxn)),
    ].filter((item) => item != null);
    if (lines.length === 0 && method) {
        return {
            payment_method: method,
            payment_method_label: exports.SALES_ORDER_PAYMENT_METHOD_LABELS[method],
            payment_breakdown_label: exports.SALES_ORDER_PAYMENT_METHOD_LABELS[method],
            lines: [],
        };
    }
    return fromLines(method, lines);
}
function fromPayments(payments) {
    const totals = new Map();
    const methods = new Set();
    for (const payment of payments) {
        const method = asMethod(String(payment.payment_method));
        if (!method)
            continue;
        methods.add(method);
        const amount = toNumber(payment.amount);
        const isUsd = String(payment.currency ?? 'MXN').toUpperCase() === 'USD';
        if (method === pos_sale_payment_method_enum_1.PosSalePaymentMethod.MIXED) {
            continue;
        }
        if (!LINE_METHODS.includes(method)) {
            continue;
        }
        const key = method;
        const current = totals.get(key) ?? { mxn: 0, usd: 0 };
        if (isUsd)
            current.usd += amount;
        else
            current.mxn += amount;
        totals.set(key, current);
    }
    const lines = LINE_METHODS.map((method) => {
        const total = totals.get(method);
        return total ? line(method, total.mxn, total.usd) : null;
    }).filter((item) => item != null);
    if (methods.has(pos_sale_payment_method_enum_1.PosSalePaymentMethod.MIXED) && lines.length <= 1) {
        return fromLines(pos_sale_payment_method_enum_1.PosSalePaymentMethod.MIXED, lines);
    }
    const resolved = methods.size > 1 || methods.has(pos_sale_payment_method_enum_1.PosSalePaymentMethod.MIXED)
        ? pos_sale_payment_method_enum_1.PosSalePaymentMethod.MIXED
        : [...methods][0] ?? null;
    return fromLines(resolved, lines);
}
function buildSalesOrderPaymentDisplay(input) {
    if (input.collection) {
        return fromCollection(input.collection);
    }
    const fromPaymentRows = fromPayments(input.payments ?? []);
    if (fromPaymentRows.payment_method) {
        return fromPaymentRows;
    }
    if (input.isCredit) {
        return fromLines(pos_sale_payment_method_enum_1.PosSalePaymentMethod.CREDIT, []);
    }
    return fromLines(null, []);
}
//# sourceMappingURL=sales-order-payment-display.util.js.map