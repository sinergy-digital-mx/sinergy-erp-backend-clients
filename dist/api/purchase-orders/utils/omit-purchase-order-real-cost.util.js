"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.omitPurchaseOrderRealCost = omitPurchaseOrderRealCost;
const purchase_order_real_cost_permission_1 = require("../constants/purchase-order-real-cost-permission");
const NULL_KEYS = new Set([
    'customs_exchange_rate',
    'customs_date',
    'real_unit_cost_usd',
    'real_unit_cost_mxn',
    'landed_extras_usd',
    'landed_total_usd',
    'landed_total_mxn',
]);
const ZERO_KEYS = new Set([
    'landed_increment_percentage',
    'landed_merchandise_mxn',
    'landed_extras_mxn',
    'igi_percentage',
    'extra_costs_count',
]);
const FALSE_KEYS = new Set(['has_real_cost', 'can_edit_real_cost']);
const EMPTY_ARRAY_KEYS = new Set(['extra_costs', 'landed_cost_lines']);
function isRealCostMovement(value) {
    if (!value || typeof value !== 'object') {
        return false;
    }
    return (value.type === purchase_order_real_cost_permission_1.PURCHASE_ORDER_REAL_COST_MOVEMENT_TYPE);
}
function omitPurchaseOrderRealCost(value) {
    return omitValue(value, new WeakMap());
}
function omitValue(value, seen) {
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
            if (isRealCostMovement(item)) {
                changed = true;
                continue;
            }
            const next = omitValue(item, seen);
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
        if (NULL_KEYS.has(key)) {
            copy[key] = null;
            if (source[key] != null) {
                changed = true;
            }
            continue;
        }
        if (ZERO_KEYS.has(key)) {
            copy[key] = 0;
            if (source[key] !== 0) {
                changed = true;
            }
            continue;
        }
        if (FALSE_KEYS.has(key)) {
            copy[key] = false;
            if (source[key] !== false) {
                changed = true;
            }
            continue;
        }
        if (EMPTY_ARRAY_KEYS.has(key)) {
            copy[key] = [];
            if (!Array.isArray(source[key]) || source[key].length > 0) {
                changed = true;
            }
            continue;
        }
        const next = omitValue(source[key], seen);
        copy[key] = next;
        if (next !== source[key]) {
            changed = true;
        }
    }
    if (Array.isArray(copy.movements) && copy.movements !== source.movements) {
        copy.movements_count = copy.movements.length;
        changed = true;
    }
    if (Array.isArray(copy.data) &&
        copy.data !== source.data &&
        typeof source.total === 'number' &&
        copy.data.length !== source.data.length) {
        const removed = source.data.length - copy.data.length;
        copy.total = Math.max(0, source.total - removed);
        changed = true;
    }
    if (!changed) {
        seen.set(value, value);
        return value;
    }
    return copy;
}
//# sourceMappingURL=omit-purchase-order-real-cost.util.js.map