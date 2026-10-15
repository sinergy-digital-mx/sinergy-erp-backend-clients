"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isInvoiceExtraFlag = isInvoiceExtraFlag;
exports.parseRealCostNumber = parseRealCostNumber;
exports.realCostLineQuantity = realCostLineQuantity;
exports.parseCustomsExchangeRate = parseCustomsExchangeRate;
exports.extrasNeedExchangeRate = extrasNeedExchangeRate;
exports.assertExchangeRateIfNeeded = assertExchangeRateIfNeeded;
exports.derivePersistedLandedCashTotals = derivePersistedLandedCashTotals;
exports.computePurchaseOrderRealCost = computePurchaseOrderRealCost;
exports.isRealCostEnabled = isRealCostEnabled;
const common_1 = require("@nestjs/common");
const purchase_order_line_breakdown_util_1 = require("./purchase-order-line-breakdown.util");
function isInvoiceExtraFlag(value) {
    return value === true || value === 1 || value === '1';
}
function parseRealCostNumber(value, fallback = 0) {
    if (value === undefined || value === null || value === '') {
        return fallback;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}
function realCostLineQuantity(line) {
    const received = parseRealCostNumber(line.received_quantity, 0);
    if (received > 0) {
        return received;
    }
    return Math.max(parseRealCostNumber(line.quantity, 0), 0);
}
function parseCustomsExchangeRate(value) {
    if (value === undefined || value === null || value === '') {
        return null;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new common_1.BadRequestException('El tipo de cambio de aduana debe ser mayor a 0');
    }
    return parsed;
}
function extrasNeedExchangeRate(paymentCurrency, extras) {
    return extras.some((extra) => extra.currency !== paymentCurrency);
}
function assertExchangeRateIfNeeded(paymentCurrency, extras, exchangeRate) {
    if (extrasNeedExchangeRate(paymentCurrency, extras) && exchangeRate == null) {
        throw new common_1.BadRequestException('Indica el tipo de cambio de aduana para convertir gastos en otra moneda');
    }
}
function convertAmount(amount, from, to, exchangeRate) {
    if (from === to) {
        return amount;
    }
    if (exchangeRate == null) {
        return null;
    }
    return from === 'USD' ? amount * exchangeRate : amount / exchangeRate;
}
function sumConvertedExtras(extras, to, exchangeRate) {
    return extras.reduce((sum, extra) => {
        const amount = Math.max(parseRealCostNumber(extra.amount), 0);
        const converted = convertAmount(amount, extra.currency, to, exchangeRate);
        return converted == null ? sum : sum + converted;
    }, 0);
}
function derivePersistedLandedCashTotals(input) {
    const merchandiseMxn = (0, purchase_order_line_breakdown_util_1.roundPoMoney)(parseRealCostNumber(input.merchandise_mxn));
    const extrasMxn = (0, purchase_order_line_breakdown_util_1.roundPoMoney)(parseRealCostNumber(input.extras_mxn));
    const invoiceExtrasMxn = Math.min((0, purchase_order_line_breakdown_util_1.roundPoMoney)(parseRealCostNumber(input.invoice_extras_mxn)), extrasMxn);
    const operatingExtrasMxn = (0, purchase_order_line_breakdown_util_1.roundPoMoney)(extrasMxn - invoiceExtrasMxn);
    const totalMxn = (0, purchase_order_line_breakdown_util_1.roundPoMoney)(merchandiseMxn + extrasMxn);
    const invoiceMxn = (0, purchase_order_line_breakdown_util_1.roundPoMoney)(merchandiseMxn + invoiceExtrasMxn);
    const rate = input.customs_exchange_rate == null || input.customs_exchange_rate === ''
        ? null
        : parseRealCostNumber(input.customs_exchange_rate, 0);
    if (rate == null || rate <= 0) {
        return {
            extras_usd: null,
            total_usd: null,
            total_mxn: totalMxn,
            contracted_mxn: merchandiseMxn,
            contracted_usd: null,
            invoice_mxn: invoiceMxn,
            invoice_usd: null,
            operating_extras_mxn: operatingExtrasMxn,
            operating_extras_usd: null,
        };
    }
    return {
        extras_usd: (0, purchase_order_line_breakdown_util_1.roundPoMoney)(extrasMxn / rate),
        total_usd: (0, purchase_order_line_breakdown_util_1.roundPoMoney)(totalMxn / rate),
        total_mxn: totalMxn,
        contracted_mxn: merchandiseMxn,
        contracted_usd: (0, purchase_order_line_breakdown_util_1.roundPoMoney)(merchandiseMxn / rate),
        invoice_mxn: invoiceMxn,
        invoice_usd: (0, purchase_order_line_breakdown_util_1.roundPoMoney)(invoiceMxn / rate),
        operating_extras_mxn: operatingExtrasMxn,
        operating_extras_usd: (0, purchase_order_line_breakdown_util_1.roundPoMoney)(operatingExtrasMxn / rate),
    };
}
function computePurchaseOrderRealCost(input) {
    const paymentCurrency = input.payment_currency;
    const exchangeRate = parseCustomsExchangeRate(input.customs_exchange_rate);
    const extras = input.extras ?? [];
    const hasExtras = extras.length > 0;
    const hasRealCost = hasExtras || exchangeRate != null;
    const preparedLines = (input.lines ?? []).map((line) => {
        const quantity = realCostLineQuantity(line);
        const vendorUnitCost = (0, purchase_order_line_breakdown_util_1.roundPoUnitCost)(parseRealCostNumber(line.vendor_unit_cost));
        const igiPercentage = Math.max(parseRealCostNumber(line.igi_percentage), 0);
        return { id: line.id, quantity, vendorUnitCost, igiPercentage };
    });
    const merchandiseAmount = preparedLines.reduce((sum, line) => sum + line.quantity * line.vendorUnitCost, 0);
    const extrasAmount = extras.reduce((sum, extra) => sum + Math.max(parseRealCostNumber(extra.amount), 0), 0);
    const merchandiseMxn = convertAmount(merchandiseAmount, paymentCurrency, 'MXN', exchangeRate);
    const extrasMxn = sumConvertedExtras(extras, 'MXN', exchangeRate);
    const extrasUsd = sumConvertedExtras(extras, 'USD', exchangeRate);
    const merchandiseUsd = convertAmount(merchandiseAmount, paymentCurrency, 'USD', exchangeRate);
    const extrasForRatio = merchandiseMxn != null && (hasExtras || exchangeRate != null)
        ? extrasMxn
        : extras
            .filter((extra) => extra.currency === paymentCurrency)
            .reduce((sum, extra) => sum + Math.max(parseRealCostNumber(extra.amount), 0), 0);
    const merchandiseForRatio = merchandiseMxn != null ? merchandiseMxn : merchandiseAmount;
    const incrementRatio = hasRealCost && merchandiseForRatio > 0 ? extrasForRatio / merchandiseForRatio : 0;
    const incrementPercentage = (0, purchase_order_line_breakdown_util_1.roundPoUnitCost)(incrementRatio * 100);
    const lines = preparedLines.map((line) => {
        const taxedVendor = line.vendorUnitCost * (1 + line.igiPercentage / 100);
        const landedVendor = taxedVendor * (1 + incrementRatio);
        const realUsd = convertAmount(landedVendor, paymentCurrency, 'USD', exchangeRate);
        const realMxn = convertAmount(landedVendor, paymentCurrency, 'MXN', exchangeRate);
        return {
            id: line.id,
            quantity: line.quantity,
            vendor_unit_cost: line.vendorUnitCost,
            igi_percentage: line.igiPercentage,
            real_unit_cost_usd: hasRealCost && realUsd != null ? (0, purchase_order_line_breakdown_util_1.roundPoUnitCost)(realUsd) : null,
            real_unit_cost_mxn: hasRealCost && realMxn != null ? (0, purchase_order_line_breakdown_util_1.roundPoUnitCost)(realMxn) : null,
        };
    });
    const invoiceExtras = extras.filter((extra) => extra.include_in_invoice === true);
    const invoiceExtrasMxnRaw = sumConvertedExtras(invoiceExtras, 'MXN', exchangeRate);
    const extrasMxnResult = hasRealCost && (merchandiseMxn != null || extras.every((extra) => extra.currency === 'MXN'))
        ? (0, purchase_order_line_breakdown_util_1.roundPoMoney)(extrasMxn)
        : null;
    const invoiceExtrasMxnResult = extrasMxnResult == null ? null : (0, purchase_order_line_breakdown_util_1.roundPoMoney)(Math.min(invoiceExtrasMxnRaw, extrasMxnResult));
    const operatingExtrasMxnResult = extrasMxnResult == null || invoiceExtrasMxnResult == null
        ? null
        : (0, purchase_order_line_breakdown_util_1.roundPoMoney)(extrasMxnResult - invoiceExtrasMxnResult);
    const extrasUsdResult = extrasMxnResult != null && exchangeRate != null
        ? (0, purchase_order_line_breakdown_util_1.roundPoMoney)(extrasMxnResult / exchangeRate)
        : hasRealCost && extras.every((extra) => extra.currency === 'USD')
            ? (0, purchase_order_line_breakdown_util_1.roundPoMoney)(extrasUsd)
            : null;
    const merchandiseMxnResult = merchandiseMxn == null ? null : (0, purchase_order_line_breakdown_util_1.roundPoMoney)(merchandiseMxn);
    const merchandiseUsdResult = merchandiseUsd == null ? null : (0, purchase_order_line_breakdown_util_1.roundPoMoney)(merchandiseUsd);
    const invoiceMxnResult = merchandiseMxnResult == null || invoiceExtrasMxnResult == null
        ? null
        : (0, purchase_order_line_breakdown_util_1.roundPoMoney)(merchandiseMxnResult + invoiceExtrasMxnResult);
    const operatingExtrasUsdResult = operatingExtrasMxnResult == null || exchangeRate == null
        ? null
        : (0, purchase_order_line_breakdown_util_1.roundPoMoney)(operatingExtrasMxnResult / exchangeRate);
    const invoiceUsdResult = invoiceMxnResult == null || exchangeRate == null
        ? null
        : (0, purchase_order_line_breakdown_util_1.roundPoMoney)(invoiceMxnResult / exchangeRate);
    return {
        has_real_cost: hasRealCost,
        increment_ratio: incrementRatio,
        increment_percentage: incrementPercentage,
        merchandise_amount: (0, purchase_order_line_breakdown_util_1.roundPoMoney)(merchandiseAmount),
        merchandise_mxn: merchandiseMxnResult,
        extras_amount: (0, purchase_order_line_breakdown_util_1.roundPoMoney)(extrasAmount),
        extras_mxn: extrasMxnResult,
        extras_usd: extrasUsdResult,
        contracted_mxn: merchandiseMxnResult,
        contracted_usd: merchandiseUsdResult,
        invoice_extras_mxn: invoiceExtrasMxnResult,
        invoice_mxn: invoiceMxnResult,
        invoice_usd: invoiceUsdResult,
        operating_extras_mxn: operatingExtrasMxnResult,
        operating_extras_usd: operatingExtrasUsdResult,
        total_usd: merchandiseUsdResult != null && extrasUsdResult != null
            ? (0, purchase_order_line_breakdown_util_1.roundPoMoney)(merchandiseUsdResult + extrasUsdResult)
            : null,
        total_mxn: merchandiseMxnResult != null && extrasMxnResult != null
            ? (0, purchase_order_line_breakdown_util_1.roundPoMoney)(merchandiseMxnResult + extrasMxnResult)
            : null,
        lines,
    };
}
function isRealCostEnabled(exchangeRate, extrasCount) {
    return extrasCount > 0 || parseRealCostNumber(exchangeRate, 0) > 0;
}
//# sourceMappingURL=purchase-order-real-cost.util.js.map