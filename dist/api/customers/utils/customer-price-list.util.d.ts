export interface CustomerPriceListAssignmentInput {
    price_list_id: string;
    is_default?: boolean;
}
export declare function normalizeCustomerPriceListAssignments(items: CustomerPriceListAssignmentInput[] | null | undefined): Array<{
    price_list_id: string;
    is_default: boolean;
}>;
