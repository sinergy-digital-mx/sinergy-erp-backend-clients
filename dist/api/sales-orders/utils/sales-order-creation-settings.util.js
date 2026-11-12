"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SALES_ORDER_CREATION_FIELD_KEYS = void 0;
exports.defaultSalesOrderCreationFields = defaultSalesOrderCreationFields;
exports.normalizeSalesOrderCreationFields = normalizeSalesOrderCreationFields;
exports.shouldHideBillingBranch = shouldHideBillingBranch;
exports.todayInBusinessZone = todayInBusinessZone;
exports.resolveDeliveryDateDefault = resolveDeliveryDateDefault;
exports.SALES_ORDER_CREATION_FIELD_KEYS = [
    'fiscal_configuration_id',
    'customer',
    'billing_branch_id',
    'expected_delivery_date',
    'sale_scope',
    'currency',
    'requires_selection_assembly',
    'for_shipping',
    'notes',
];
const LOCKED_KEYS = new Set([
    'fiscal_configuration_id',
    'customer',
]);
const BOOLEAN_KEYS = new Set([
    'requires_selection_assembly',
    'for_shipping',
]);
function defaultSalesOrderCreationFields() {
    return {
        fiscal_configuration_id: {
            visible: true,
            required: true,
            default_value: 'user_primary',
            locked: true,
        },
        customer: {
            visible: true,
            required: true,
            default_value: null,
            locked: true,
        },
        billing_branch_id: {
            visible: true,
            required: true,
            default_value: 'user_primary',
            locked: false,
        },
        expected_delivery_date: {
            visible: true,
            required: true,
            default_value: 'today',
            locked: false,
        },
        sale_scope: {
            visible: true,
            required: true,
            default_value: 'inventory',
            locked: false,
        },
        currency: {
            visible: true,
            required: true,
            default_value: 'MXN',
            locked: false,
        },
        requires_selection_assembly: {
            visible: true,
            required: false,
            default_value: false,
            locked: false,
        },
        for_shipping: {
            visible: true,
            required: false,
            default_value: false,
            locked: false,
        },
        notes: {
            visible: true,
            required: false,
            default_value: null,
            locked: false,
        },
    };
}
function asBoolean(value, fallback) {
    return typeof value === 'boolean' ? value : fallback;
}
function sanitizeDefault(key, value, fallback) {
    if (BOOLEAN_KEYS.has(key)) {
        return typeof value === 'boolean' ? value : fallback === true;
    }
    if (key === 'sale_scope') {
        return value === 'services' || value === 'combined' || value === 'inventory'
            ? value
            : 'inventory';
    }
    if (key === 'currency') {
        return value === 'USD' ? 'USD' : 'MXN';
    }
    if (key === 'expected_delivery_date') {
        if (value === 'today')
            return 'today';
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
            return value.slice(0, 10);
        }
        return 'today';
    }
    if (key === 'billing_branch_id' || key === 'fiscal_configuration_id') {
        return 'user_primary';
    }
    if (key === 'notes') {
        if (typeof value !== 'string')
            return null;
        const trimmed = value.trim();
        return trimmed ? trimmed.slice(0, 2000) : null;
    }
    return fallback;
}
function normalizeSalesOrderCreationFields(raw) {
    const defaults = defaultSalesOrderCreationFields();
    const source = raw && typeof raw === 'object' ? raw : {};
    const fields = { ...defaults };
    for (const key of exports.SALES_ORDER_CREATION_FIELD_KEYS) {
        const incoming = source[key];
        const base = defaults[key];
        const row = incoming && typeof incoming === 'object'
            ? incoming
            : {};
        const locked = LOCKED_KEYS.has(key);
        const visible = locked ? true : asBoolean(row.visible, base.visible);
        let required = locked ? true : asBoolean(row.required, base.required);
        if (BOOLEAN_KEYS.has(key)) {
            required = false;
        }
        if (key === 'billing_branch_id' && visible) {
            required = true;
        }
        fields[key] = {
            visible,
            required,
            default_value: sanitizeDefault(key, row.default_value, base.default_value),
            locked,
        };
    }
    return fields;
}
function shouldHideBillingBranch(fields, branchCount) {
    if (!fields.billing_branch_id.visible)
        return true;
    return branchCount === 1;
}
function todayInBusinessZone(now = new Date()) {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Tijuana',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(now);
}
function resolveDeliveryDateDefault(defaultValue, now = new Date()) {
    if (typeof defaultValue === 'string' && /^\d{4}-\d{2}-\d{2}/.test(defaultValue)) {
        return defaultValue.slice(0, 10);
    }
    return todayInBusinessZone(now);
}
//# sourceMappingURL=sales-order-creation-settings.util.js.map