"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeCustomerPriceListAssignments = normalizeCustomerPriceListAssignments;
function normalizeCustomerPriceListAssignments(items) {
    const unique = [];
    const seen = new Set();
    for (const item of items ?? []) {
        const priceListId = String(item?.price_list_id ?? '').trim();
        if (!priceListId || seen.has(priceListId))
            continue;
        seen.add(priceListId);
        unique.push({
            price_list_id: priceListId,
            is_default: item.is_default === true,
        });
    }
    if (unique.length === 0)
        return [];
    const defaultId = unique.find((item) => item.is_default)?.price_list_id ?? unique[0].price_list_id;
    return unique.map((item) => ({
        price_list_id: item.price_list_id,
        is_default: item.price_list_id === defaultId,
    }));
}
//# sourceMappingURL=customer-price-list.util.js.map