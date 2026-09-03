"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapAppliedLineDiscountsFromOrder = mapAppliedLineDiscountsFromOrder;
exports.mapAppliedGlobalDiscountFromOrder = mapAppliedGlobalDiscountFromOrder;
exports.mapAppliedDiscountsFromOrder = mapAppliedDiscountsFromOrder;
exports.mapLineItemWithDiscount = mapLineItemWithDiscount;
exports.mapOrderDiscountSummary = mapOrderDiscountSummary;
const product_discount_entity_1 = require("../../../entities/products/product-discount.entity");
const global_discount_entity_1 = require("../../../entities/global-discounts/global-discount.entity");
function mapAppliedLineDiscountsFromOrder(order) {
    const applied = [];
    for (const item of order.line_items ?? []) {
        if (!item.product_discount_id)
            continue;
        const qty = Number(item.quantity) || 0;
        const discountUnit = Number(item.discount_unit) || 0;
        applied.push({
            line_item_id: item.id,
            product_id: item.product_id,
            product_name: item.product?.name ?? '',
            product_sku: item.product?.sku ?? null,
            product_discount_id: item.product_discount_id,
            discount_name: item.product_discount?.name ?? 'Descuento',
            discount_type: item.product_discount?.discount_type ?? product_discount_entity_1.ProductDiscountType.PERCENTAGE,
            discount_value: Number(item.product_discount?.value ?? item.discount_percentage ?? 0),
            quantity: qty,
            discount_unit: discountUnit,
            discount_amount: Number((discountUnit * qty).toFixed(2)),
        });
    }
    return applied;
}
function mapAppliedGlobalDiscountFromOrder(order) {
    if (!order.global_discount_id)
        return null;
    return {
        global_discount_id: order.global_discount_id,
        discount_name: order.global_discount?.name ?? 'Descuento global',
        discount_type: order.global_discount?.discount_type ?? global_discount_entity_1.GlobalDiscountType.PERCENTAGE,
        discount_value: Number(order.global_discount?.value ?? 0),
        discount_amount: Number(order.global_discount_amount) || 0,
    };
}
function mapAppliedDiscountsFromOrder(order) {
    return mapAppliedLineDiscountsFromOrder(order);
}
function mapLineItemWithDiscount(item) {
    const qty = Number(item.quantity) || 0;
    const discountUnit = Number(item.discount_unit) || 0;
    const lineSubtotal = qty * Number(item.unit_price || 0);
    return {
        ...item,
        line_subtotal: Number(lineSubtotal.toFixed(2)),
        line_discount_amount: Number((discountUnit * qty).toFixed(2)),
        applied_product_discount: item.product_discount_id
            ? {
                id: item.product_discount_id,
                name: item.product_discount?.name ?? null,
                discount_type: item.product_discount?.discount_type ?? null,
                value: item.product_discount ? Number(item.product_discount.value) : null,
            }
            : null,
    };
}
function mapOrderDiscountSummary(order) {
    const lineDiscounts = mapAppliedLineDiscountsFromOrder(order);
    const globalDiscount = mapAppliedGlobalDiscountFromOrder(order);
    const lineDiscountTotal = Number(order.discount_total) || 0;
    const globalDiscountAmount = Number(order.global_discount_amount) || 0;
    return {
        line_discount_total: lineDiscountTotal,
        global_discount_amount: globalDiscountAmount,
        discount_total: Number((lineDiscountTotal + globalDiscountAmount).toFixed(2)),
        line_items: lineDiscounts,
        global_discount: globalDiscount,
    };
}
//# sourceMappingURL=sales-order-discount.mapper.js.map