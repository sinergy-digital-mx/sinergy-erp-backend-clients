export declare class StampAdvanceInvoiceDto {
    base_amount?: number;
    iva_percentage?: number;
    uso_cfdi?: string;
    forma_pago?: string;
    metodo_pago?: 'PUE' | 'PPD';
    regimen_fiscal_receptor: string;
    series?: string;
    folio?: string;
    environment?: 'demo' | 'production';
}
