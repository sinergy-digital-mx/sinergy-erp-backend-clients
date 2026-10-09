"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CUSTOMER_IS_INACTIVE_SQL = exports.CUSTOMER_IS_ACTIVE_SQL = exports.CUSTOMER_HAS_EMAIL_SQL = exports.CUSTOMER_FISCAL_READY_SQL = exports.CUSTOMER_HAS_ORDER_SQL = exports.CUSTOMER_INSIGHT_LABELS = exports.CUSTOMER_LIST_INSIGHTS = void 0;
exports.isCustomerListInsight = isCustomerListInsight;
exports.customerInsightLabel = customerInsightLabel;
exports.customerInsightWhere = customerInsightWhere;
exports.applyCustomerDirectoryFilters = applyCustomerDirectoryFilters;
exports.CUSTOMER_LIST_INSIGHTS = [
    'with_orders',
    'without_orders',
    'fiscal_ready',
    'fiscal_not_ready',
    'active',
    'inactive',
    'with_email',
    'without_email',
];
exports.CUSTOMER_INSIGHT_LABELS = {
    with_orders: 'Con órdenes',
    without_orders: 'Sin órdenes',
    fiscal_ready: 'Listos para facturar',
    fiscal_not_ready: 'Sin datos fiscales',
    active: 'Activos',
    inactive: 'Inactivos',
    with_email: 'Con correo',
    without_email: 'Sin correo',
};
exports.CUSTOMER_HAS_ORDER_SQL = `EXISTS (
    SELECT 1 FROM inv_s_sales_orders so
    WHERE so.customer_id = customer.id
      AND so.tenant_id = customer.tenant_id
      AND so.general_status <> 'Cancelada'
)`;
exports.CUSTOMER_FISCAL_READY_SQL = `(
    customer.fiscal_rfc IS NOT NULL
    AND TRIM(customer.fiscal_rfc) <> ''
    AND UPPER(TRIM(customer.fiscal_rfc)) NOT IN ('XAXX010101000', 'XEXX010101000')
    AND customer.fiscal_razon_social IS NOT NULL
    AND TRIM(customer.fiscal_razon_social) <> ''
    AND TRIM(customer.fiscal_postal_code) REGEXP '^[0-9]{5}$'
)`;
exports.CUSTOMER_HAS_EMAIL_SQL = `(
    customer.email IS NOT NULL AND TRIM(customer.email) <> ''
)`;
exports.CUSTOMER_IS_ACTIVE_SQL = `(status.code = 'ACTIVE')`;
exports.CUSTOMER_IS_INACTIVE_SQL = `(status.code IS NULL OR status.code <> 'ACTIVE')`;
function isCustomerListInsight(value) {
    return (typeof value === 'string' &&
        exports.CUSTOMER_LIST_INSIGHTS.includes(value));
}
function customerInsightLabel(insight) {
    return exports.CUSTOMER_INSIGHT_LABELS[insight];
}
function customerInsightWhere(insight) {
    switch (insight) {
        case 'with_orders':
            return exports.CUSTOMER_HAS_ORDER_SQL;
        case 'without_orders':
            return `NOT (${exports.CUSTOMER_HAS_ORDER_SQL})`;
        case 'fiscal_ready':
            return exports.CUSTOMER_FISCAL_READY_SQL;
        case 'fiscal_not_ready':
            return `NOT (${exports.CUSTOMER_FISCAL_READY_SQL})`;
        case 'active':
            return exports.CUSTOMER_IS_ACTIVE_SQL;
        case 'inactive':
            return exports.CUSTOMER_IS_INACTIVE_SQL;
        case 'with_email':
            return exports.CUSTOMER_HAS_EMAIL_SQL;
        case 'without_email':
            return `NOT (${exports.CUSTOMER_HAS_EMAIL_SQL})`;
    }
}
function applyCustomerDirectoryFilters(qb, query, options) {
    if (query?.search) {
        const term = `%${query.search.trim()}%`;
        qb.andWhere(`(
                LOWER(customer.name) LIKE LOWER(:search)
                OR LOWER(customer.lastname) LIKE LOWER(:search)
                OR LOWER(CONCAT(customer.name, ' ', COALESCE(customer.lastname, ''))) LIKE LOWER(:search)
                OR LOWER(CONCAT(COALESCE(customer.lastname, ''), ' ', customer.name)) LIKE LOWER(:search)
                OR LOWER(customer.email) LIKE LOWER(:search)
                OR LOWER(customer.phone) LIKE LOWER(:search)
                OR LOWER(customer.phone_code) LIKE LOWER(:search)
                OR LOWER(CONCAT(COALESCE(customer.phone_code, ''), customer.phone)) LIKE LOWER(:search)
                OR LOWER(customer.company_name) LIKE LOWER(:search)
                OR LOWER(customer.website) LIKE LOWER(:search)
                OR LOWER(customer.additional_name) LIKE LOWER(:search)
                OR LOWER(customer.additional_lastname) LIKE LOWER(:search)
                OR LOWER(CONCAT(customer.additional_name, ' ', COALESCE(customer.additional_lastname, ''))) LIKE LOWER(:search)
                OR LOWER(customer.additional_email) LIKE LOWER(:search)
                OR LOWER(customer.additional_phone) LIKE LOWER(:search)
                OR LOWER(customer.fiscal_rfc) LIKE LOWER(:search)
                OR LOWER(customer.fiscal_razon_social) LIKE LOWER(:search)
                OR LOWER(property.code) LIKE LOWER(:search)
                OR LOWER(property.name) LIKE LOWER(:search)
                OR LOWER(property.cadastral_key) LIKE LOWER(:search)
                OR LOWER(contracts.contract_number) LIKE LOWER(:search)
            )`, { search: term });
    }
    if (query?.status_id) {
        qb.andWhere('customer.status_id = :status_id', {
            status_id: query.status_id,
        });
    }
    if (query?.group_id) {
        qb.andWhere('customer.group_id = :group_id', {
            group_id: query.group_id,
        });
    }
    if (query?.registered_fiscal_configuration_id) {
        qb.andWhere('customer.registered_fiscal_configuration_id = :registered_fiscal_configuration_id', {
            registered_fiscal_configuration_id: query.registered_fiscal_configuration_id,
        });
    }
    if (options?.applyInsight !== false && isCustomerListInsight(query?.insight)) {
        qb.andWhere(customerInsightWhere(query.insight));
    }
}
//# sourceMappingURL=customer-list-insight.util.js.map