import { SelectQueryBuilder } from 'typeorm';
import { Customer } from '../../../entities/customers/customer.entity';
export declare const CUSTOMER_LIST_INSIGHTS: readonly ["with_orders", "without_orders", "fiscal_ready", "fiscal_not_ready", "active", "inactive", "with_email", "without_email"];
export type CustomerListInsight = (typeof CUSTOMER_LIST_INSIGHTS)[number];
export declare const CUSTOMER_INSIGHT_LABELS: Record<CustomerListInsight, string>;
export declare const CUSTOMER_HAS_ORDER_SQL = "EXISTS (\n    SELECT 1 FROM inv_s_sales_orders so\n    WHERE so.customer_id = customer.id\n      AND so.tenant_id = customer.tenant_id\n      AND so.general_status <> 'Cancelada'\n)";
export declare const CUSTOMER_FISCAL_READY_SQL = "(\n    customer.fiscal_rfc IS NOT NULL\n    AND TRIM(customer.fiscal_rfc) <> ''\n    AND UPPER(TRIM(customer.fiscal_rfc)) NOT IN ('XAXX010101000', 'XEXX010101000')\n    AND customer.fiscal_razon_social IS NOT NULL\n    AND TRIM(customer.fiscal_razon_social) <> ''\n    AND TRIM(customer.fiscal_postal_code) REGEXP '^[0-9]{5}$'\n)";
export declare const CUSTOMER_HAS_EMAIL_SQL = "(\n    customer.email IS NOT NULL AND TRIM(customer.email) <> ''\n)";
export declare const CUSTOMER_IS_ACTIVE_SQL = "(status.code = 'ACTIVE')";
export declare const CUSTOMER_IS_INACTIVE_SQL = "(status.code IS NULL OR status.code <> 'ACTIVE')";
export declare function isCustomerListInsight(value: unknown): value is CustomerListInsight;
export declare function customerInsightLabel(insight: CustomerListInsight): string;
export declare function customerInsightWhere(insight: CustomerListInsight): string;
export interface CustomerDirectoryFilter {
    search?: string;
    status_id?: number;
    group_id?: string;
    registered_fiscal_configuration_id?: string;
    insight?: string;
}
export declare function applyCustomerDirectoryFilters(qb: SelectQueryBuilder<Customer>, query?: CustomerDirectoryFilter, options?: {
    applyInsight?: boolean;
}): void;
