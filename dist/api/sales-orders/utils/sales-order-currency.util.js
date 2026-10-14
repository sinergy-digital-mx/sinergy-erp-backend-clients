"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeSalesOrderCurrency = normalizeSalesOrderCurrency;
exports.canDocumentOrderInUsd = canDocumentOrderInUsd;
exports.resolvePosDocumentCurrency = resolvePosDocumentCurrency;
exports.readCfdiAttribute = readCfdiAttribute;
exports.invoiceCurrencyMismatchMessage = invoiceCurrencyMismatchMessage;
function normalizeSalesOrderCurrency(value) {
    return value === 'USD' ? 'USD' : 'MXN';
}
function roundMoney(value) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}
function canDocumentOrderInUsd(usdAppliedMxn, mxnApplied) {
    return roundMoney(usdAppliedMxn) > roundMoney(mxnApplied) + 0.009;
}
function resolvePosDocumentCurrency(input) {
    const requested = normalizeSalesOrderCurrency(input.requested);
    const rate = Number(input.usdExchangeRate ?? 0);
    const usdAppliedMxn = input.amountCashUsd > 0 && rate > 0 ? input.amountCashUsd * rate : 0;
    const mxnApplied = Number(input.amountCashMxn || 0) +
        Number(input.amountTransferMxn || 0) +
        Number(input.amountCardMxn || 0) +
        Number(input.amountCheckMxn || 0) +
        Number(input.amountCreditMxn || 0);
    if (requested !== 'USD') {
        return { currency: 'MXN', exchangeRate: null, error: null };
    }
    if (!canDocumentOrderInUsd(usdAppliedMxn, mxnApplied)) {
        return {
            currency: 'MXN',
            exchangeRate: null,
            error: 'La orden solo puede ser en dólares si el pago en dólares es mayor que el pago en pesos.',
        };
    }
    if (!(rate > 0)) {
        return {
            currency: 'MXN',
            exchangeRate: null,
            error: 'No hay tipo de cambio para dejar la orden en dólares.',
        };
    }
    return { currency: 'USD', exchangeRate: Number(rate.toFixed(6)), error: null };
}
function readCfdiAttribute(xml, name) {
    const match = String(xml || '').match(new RegExp(`\\b${name}="([^"]*)"`, 'i'));
    return match?.[1]?.trim() ?? '';
}
function invoiceCurrencyMismatchMessage(orderCurrency, xml, exchangeRate) {
    const expected = normalizeSalesOrderCurrency(orderCurrency);
    const moneda = readCfdiAttribute(xml, 'Moneda').toUpperCase();
    if (moneda !== expected) {
        return expected === 'USD'
            ? 'La factura debe ser en dólares porque la orden es en dólares.'
            : 'La factura debe ser en pesos porque la orden es en pesos.';
    }
    if (expected !== 'USD') {
        return null;
    }
    const tipoCambio = Number(readCfdiAttribute(xml, 'TipoCambio'));
    const stored = Number(exchangeRate);
    if (!(tipoCambio > 0)) {
        return 'La factura en dólares necesita tipo de cambio.';
    }
    if (!(stored > 0)) {
        return 'La orden en dólares no tiene tipo de cambio.';
    }
    if (Math.abs(tipoCambio - stored) > 0.000001) {
        return 'El tipo de cambio de la factura no coincide con el de la orden.';
    }
    return null;
}
//# sourceMappingURL=sales-order-currency.util.js.map