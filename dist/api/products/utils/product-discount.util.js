"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isProductDiscountApplicable = isProductDiscountApplicable;
exports.calculateProductDiscountLineAmounts = calculateProductDiscountLineAmounts;
exports.mapApplicableProductDiscount = mapApplicableProductDiscount;
exports.assertProductDiscountApplicable = assertProductDiscountApplicable;
const common_1 = require("@nestjs/common");
const product_discount_entity_1 = require("../../../entities/products/product-discount.entity");
function isProductDiscountApplicable(discount, productUomId, referenceDate = new Date()) {
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
    if (discount.product_uom_id && discount.product_uom_id !== productUomId) {
        return false;
    }
    return true;
}
function calculateProductDiscountLineAmounts(unitPrice, quantity, discount) {
    const price = Number(unitPrice) || 0;
    const qty = Number(quantity) || 0;
    const value = Number(discount.value) || 0;
    let discountUnit = 0;
    if (discount.discount_type === product_discount_entity_1.ProductDiscountType.PERCENTAGE) {
        discountUnit = (price * value) / 100;
    }
    else {
        discountUnit = Math.min(value, price);
    }
    discountUnit = Math.max(Number(discountUnit.toFixed(2)), 0);
    const lineDiscount = Number((discountUnit * qty).toFixed(2));
    const discountPercentage = price > 0 ? Number(((discountUnit / price) * 100).toFixed(2)) : 0;
    return {
        discount_percentage: discountPercentage,
        discount_unit: discountUnit,
        line_discount: lineDiscount,
    };
}
function mapApplicableProductDiscount(discount) {
    return {
        id: discount.id,
        name: discount.name,
        discount_type: discount.discount_type,
        value: Number(discount.value),
        product_uom_id: discount.product_uom_id,
    };
}
function assertProductDiscountApplicable(discount, productId, productUomId) {
    if (discount.product_id !== productId) {
        throw new common_1.BadRequestException('El descuento no pertenece al producto de la línea');
    }
    if (!isProductDiscountApplicable(discount, productUomId)) {
        throw new common_1.BadRequestException(`El descuento "${discount.name}" no está disponible para esta UOM o vigencia`);
    }
}
//# sourceMappingURL=product-discount.util.js.map