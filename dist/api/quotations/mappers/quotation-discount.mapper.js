"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapLineItemWithDiscount = mapLineItemWithDiscount;
exports.mapAppliedLineDiscountsFromQuotation = mapAppliedLineDiscountsFromQuotation;
exports.mapOrderDiscountSummary = mapOrderDiscountSummary;
const product_discount_entity_1 = require("../../../entities/products/product-discount.entity");
const global_discount_entity_1 = require("../../../entities/global-discounts/global-discount.entity");
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
function mapAppliedLineDiscountsFromQuotation(quotation) {
    const applied = [];
    for (const item of quotation.line_items ?? []) {
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
function mapOrderDiscountSummary(quotation) {
    const lineDiscounts = mapAppliedLineDiscountsFromQuotation(quotation);
    const lineDiscountTotal = Number(quotation.discount_total) || 0;
    const globalDiscountAmount = Number(quotation.global_discount_amount) || 0;
    return {
        line_discount_total: lineDiscountTotal,
        global_discount_amount: globalDiscountAmount,
        discount_total: Number((lineDiscountTotal + globalDiscountAmount).toFixed(2)),
        line_items: lineDiscounts,
        global_discount: quotation.global_discount_id
            ? {
                global_discount_id: quotation.global_discount_id,
                discount_name: quotation.global_discount?.name ?? 'Descuento global',
                discount_type: quotation.global_discount?.discount_type ??
                    global_discount_entity_1.GlobalDiscountType.PERCENTAGE,
                discount_value: Number(quotation.global_discount?.value ?? 0),
                discount_amount: globalDiscountAmount,
            }
            : null,
    };
}
//# sourceMappingURL=quotation-discount.mapper.js.map