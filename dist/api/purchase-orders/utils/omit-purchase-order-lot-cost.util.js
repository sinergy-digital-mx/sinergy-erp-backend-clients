"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.omitPurchaseOrderLotCosts = omitPurchaseOrderLotCosts;
const LOT_COST_KEYS = [
    'unit_cost',
    'amount',
    'real_unit_cost_usd',
    'real_unit_cost_mxn',
];
function isLotNode(value) {
    return (typeof value.batch_number === 'string' &&
        'unit_cost' in value &&
        'received_quantity' in value);
}
function isLotsSummary(value) {
    return ('received_lots' in value &&
        'amount_total' in value &&
        'migrated_quantity' in value);
}
function omitPurchaseOrderLotCosts(value) {
    return walk(value, new WeakMap());
}
function walk(value, seen) {
    if (value == null || typeof value !== 'object') {
        return value;
    }
    if (value instanceof Date || Buffer.isBuffer(value)) {
        return value;
    }
    if (seen.has(value)) {
        return seen.get(value);
    }
    if (Array.isArray(value)) {
        const copy = [];
        seen.set(value, copy);
        let changed = false;
        for (const item of value) {
            const next = walk(item, seen);
            copy.push(next);
            if (next !== item) {
                changed = true;
            }
        }
        return changed ? copy : value;
    }
    const source = value;
    const copy = {};
    seen.set(value, copy);
    let changed = false;
    for (const key of Object.keys(source)) {
        const next = walk(source[key], seen);
        copy[key] = next;
        if (next !== source[key]) {
            changed = true;
        }
    }
    if (isLotNode(copy)) {
        for (const key of LOT_COST_KEYS) {
            if (copy[key] != null) {
                copy[key] = null;
                changed = true;
            }
        }
    }
    if (isLotsSummary(copy) && copy.amount_total != null) {
        copy.amount_total = null;
        changed = true;
    }
    if (!changed) {
        seen.set(value, value);
        return value;
    }
    return copy;
}
//# sourceMappingURL=omit-purchase-order-lot-cost.util.js.map