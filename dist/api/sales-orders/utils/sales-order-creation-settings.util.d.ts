export declare const SALES_ORDER_CREATION_FIELD_KEYS: readonly ["fiscal_configuration_id", "customer", "billing_branch_id", "expected_delivery_date", "sale_scope", "currency", "requires_selection_assembly", "for_shipping", "notes"];
export type SalesOrderCreationFieldKey = (typeof SALES_ORDER_CREATION_FIELD_KEYS)[number];
export interface SalesOrderCreationFieldConfig {
    visible: boolean;
    required: boolean;
    default_value: string | boolean | null;
    locked: boolean;
}
export type SalesOrderCreationFields = Record<SalesOrderCreationFieldKey, SalesOrderCreationFieldConfig>;
export declare function defaultSalesOrderCreationFields(): SalesOrderCreationFields;
export declare function normalizeSalesOrderCreationFields(raw: unknown): SalesOrderCreationFields;
export declare function shouldHideBillingBranch(fields: SalesOrderCreationFields, branchCount: number): boolean;
export declare function todayInBusinessZone(now?: Date): string;
export declare function resolveDeliveryDateDefault(defaultValue: string | boolean | null, now?: Date): string;
