"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseRealCostNumber = parseRealCostNumber;
exports.realCostLineQuantity = realCostLineQuantity;
exports.parseCustomsExchangeRate = parseCustomsExchangeRate;
exports.extrasNeedExchangeRate = extrasNeedExchangeRate;
exports.assertExchangeRateIfNeeded = assertExchangeRateIfNeeded;
exports.computePurchaseOrderRealCost = computePurchaseOrderRealCost;
exports.isRealCostEnabled = isRealCostEnabled;
const common_1 = require("@nestjs/common");
const purchase_order_line_breakdown_util_1 = require("./purchase-order-line-breakdown.util");
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
    const extrasMxn = extras.reduce((sum, extra) => {
        const amount = Math.max(parseRealCostNumber(extra.amount), 0);
        const converted = convertAmount(amount, extra.currency, 'MXN', exchangeRate);
        return converted == null ? sum : sum + converted;
    }, 0);
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
    return {
        has_real_cost: hasRealCost,
        increment_ratio: incrementRatio,
        increment_percentage: incrementPercentage,
        merchandise_amount: (0, purchase_order_line_breakdown_util_1.roundPoMoney)(merchandiseAmount),
        merchandise_mxn: merchandiseMxn == null ? null : (0, purchase_order_line_breakdown_util_1.roundPoMoney)(merchandiseMxn),
        extras_amount: (0, purchase_order_line_breakdown_util_1.roundPoMoney)(extrasAmount),
        extras_mxn: hasRealCost && (merchandiseMxn != null || extras.every((e) => e.currency === 'MXN'))
            ? (0, purchase_order_line_breakdown_util_1.roundPoMoney)(extrasMxn)
            : null,
        lines,
    };
}
function isRealCostEnabled(exchangeRate, extrasCount) {
    return extrasCount > 0 || parseRealCostNumber(exchangeRate, 0) > 0;
}
//# sourceMappingURL=purchase-order-real-cost.util.js.map