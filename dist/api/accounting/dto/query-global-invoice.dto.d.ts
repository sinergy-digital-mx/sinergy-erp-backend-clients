export declare class QueryGlobalInvoiceDto {
    month: string;
    fiscal_configuration_id?: string;
}
export declare class CreateGlobalInvoiceDto {
    month: string;
    fiscal_configuration_id: string;
    order_ids: string[];
    environment?: 'demo' | 'production';
}
export declare class CancelGlobalInvoiceDto {
    environment?: 'demo' | 'production';
}
