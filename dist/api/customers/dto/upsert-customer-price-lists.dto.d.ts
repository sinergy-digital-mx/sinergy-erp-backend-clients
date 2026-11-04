export declare class CustomerPriceListAssignmentDto {
    price_list_id: string;
    is_default?: boolean;
}
export declare class UpsertCustomerPriceListsDto {
    price_lists: CustomerPriceListAssignmentDto[];
}
