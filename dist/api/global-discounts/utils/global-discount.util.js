"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isGlobalDiscountApplicable = isGlobalDiscountApplicable;
exports.calculateGlobalDiscountAmount = calculateGlobalDiscountAmount;
exports.mapApplicableGlobalDiscount = mapApplicableGlobalDiscount;
exports.assertGlobalDiscountApplicable = assertGlobalDiscountApplicable;
const common_1 = require("@nestjs/common");
const global_discount_entity_1 = require("../../../entities/global-discounts/global-discount.entity");
function isGlobalDiscountApplicable(discount, referenceDate = new Date()) {
    if (!discount.is_active)
        return false;
    if (discount.valid_from) {
        const from = new Date(discount.valid_from);
        from.setHours(0, 0, 0, 0);
        if (referenceDate < from)
            return false;
    }
    if (discount.valid_to) {
        const to = new Date(discount.valid_to);
        to.setHours(23, 59, 59, 999);
        if (referenceDate > to)
            return false;
    }
    return true;
}
function calculateGlobalDiscountAmount(netSubtotal, discount) {
    const base = Math.max(Number(netSubtotal) || 0, 0);
    const value = Number(discount.value) || 0;
    let amount = 0;
    if (discount.discount_type === global_discount_entity_1.GlobalDiscountType.PERCENTAGE) {
        amount = (base * value) / 100;
    }
    else {
        amount = Math.min(value, base);
    }
    return Number(Math.max(amount, 0).toFixed(2));
}
function mapApplicableGlobalDiscount(discount) {
    return {
        id: discount.id,
        name: discount.name,
        discount_type: discount.discount_type,
        value: Number(discount.value),
    };
}
function assertGlobalDiscountApplicable(discount) {
    if (!isGlobalDiscountApplicable(discount)) {
        throw new common_1.BadRequestException(`El descuento global "${discount.name}" no está disponible por vigencia o estado`);
    }
}
//# sourceMappingURL=global-discount.util.js.map