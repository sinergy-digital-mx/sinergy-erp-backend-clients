export declare class UpsertCustomerCreditItemDto {
    fiscal_configuration_id: string;
    credit_enabled: boolean;
    credit_days?: number | null;
    credit_amount?: number | null;
}
export declare class UpsertCustomerCreditsDto {
    credits: UpsertCustomerCreditItemDto[];
}
