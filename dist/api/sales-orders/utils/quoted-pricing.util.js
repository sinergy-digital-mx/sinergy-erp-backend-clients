"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quotedUnitPrice = quotedUnitPrice;
exports.quotedLineDiscountAmounts = quotedLineDiscountAmounts;
exports.quotedGlobalDiscountAmount = quotedGlobalDiscountAmount;
const unit_amount_util_1 = require("../../../common/utils/unit-amount.util");
function quotedUnitPrice(value) {
    return (0, unit_amount_util_1.roundUnitAmount)(Number(value) || 0);
}
function quotedLineDiscountAmounts(item) {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = quotedUnitPrice(item.unit_price);
    const discountPercentage = Number(item.discount_percentage || 0);
    const discountUnit = item.discount_unit == null || item.discount_unit === ''
        ? quantity > 0
            ? (unitPrice * discountPercentage) / 100
            : 0
        : Number(item.discount_unit) || 0;
    return {
        discount_percentage: discountPercentage,
        discount_unit: discountUnit,
        line_discount: discountUnit * quantity,
        product_discount_id: item.product_discount_id ?? null,
    };
}
function quotedGlobalDiscountAmount(value) {
    return Number(value || 0);
}
//# sourceMappingURL=quoted-pricing.util.js.map