"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCloneSalesOrderDto = buildCloneSalesOrderDto;
exports.carryOverCustomDescriptions = carryOverCustomDescriptions;
const create_sales_order_dto_1 = require("../dto/create-sales-order.dto");
function buildCloneSalesOrderDto(source, overrides, today) {
    const sourceLines = source.line_items ?? [];
    const byId = new Map((overrides.lines ?? []).map((line) => [line.line_id, line]));
    for (const lineId of byId.keys()) {
        if (!sourceLines.some((line) => line.id === lineId)) {
            throw new Error(`La línea ${lineId} no pertenece a la orden`);
        }
    }
    const lineItems = sourceLines.map((line) => {
        const override = byId.get(line.id);
        const item = new create_sales_order_dto_1.CreateSalesOrderLineItemDto();
        item.product_id = line.product_id;
        item.product_uom_id = line.product_uom_id;
        item.quantity = Number(line.quantity);
        item.unit_price = override?.unit_price ?? Number(line.unit_price);
        if (line.product_discount_id) {
            item.product_discount_id = line.product_discount_id;
        }
        else {
            item.discount_percentage = Number(line.discount_percentage) || 0;
        }
        item.iva_percentage = Number(line.iva_percentage) || 0;
        item.ieps_percentage = Number(line.ieps_percentage) || 0;
        const description = override?.custom_description !== undefined
            ? override.custom_description.trim()
            : (line.custom_description ?? '').trim();
        if (description)
            item.custom_description = description;
        return item;
    });
    const dto = new create_sales_order_dto_1.CreateSalesOrderDto();
    dto.fiscal_configuration_id = source.fiscal_configuration_id;
    if (source.billing_branch_id)
        dto.billing_branch_id = source.billing_branch_id;
    dto.customer_id = source.customer_id;
    dto.expected_delivery_date = overrides.expected_delivery_date ?? today;
    dto.sales_order_type = 'MANUAL';
    dto.currency = source.currency === 'USD' ? 'USD' : 'MXN';
    dto.sale_scope = source.sale_scope;
    dto.payment_status = 'Pendiente';
    if (source.fiscal_razon_social)
        dto.fiscal_razon_social = source.fiscal_razon_social;
    const notes = overrides.notes !== undefined ? overrides.notes : source.notes;
    if (notes)
        dto.notes = notes;
    if (source.seller_user_id)
        dto.seller_user_id = source.seller_user_id;
    if (source.assigned_seller_user_id) {
        dto.assigned_seller_user_id = source.assigned_seller_user_id;
    }
    if (source.global_discount_id)
        dto.global_discount_id = source.global_discount_id;
    dto.requires_selection_assembly = !!source.requires_selection_assembly;
    dto.line_items = lineItems;
    return dto;
}
function carryOverCustomDescriptions(previous, incoming) {
    const pool = previous.filter((line) => line.custom_description?.trim());
    for (const item of incoming) {
        if (item.custom_description !== undefined)
            continue;
        const index = pool.findIndex((line) => line.product_id === item.product_id && line.product_uom_id === item.product_uom_id);
        if (index < 0)
            continue;
        item.custom_description = pool[index].custom_description.trim();
        pool.splice(index, 1);
    }
}
//# sourceMappingURL=sales-order-clone.util.js.map