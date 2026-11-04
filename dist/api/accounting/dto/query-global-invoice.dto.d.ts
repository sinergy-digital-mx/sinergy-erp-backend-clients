export declare class QueryGlobalInvoiceDto {
    month: string;
    billing_branch_id?: string;
}
export declare class CreateGlobalInvoiceDto {
    month: string;
    billing_branch_id: string;
    order_ids: string[];
    environment?: 'demo' | 'production';
}
export declare class CancelGlobalInvoiceDto {
    environment?: 'demo' | 'production';
}
