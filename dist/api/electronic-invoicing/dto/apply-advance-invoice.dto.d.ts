export declare class ApplyAdvanceInvoiceDto {
    uso_cfdi?: string;
    uso_cfdi_aplicacion?: string;
    forma_pago?: string;
    metodo_pago?: 'PUE' | 'PPD';
    regimen_fiscal_receptor: string;
    series?: string;
    environment?: 'demo' | 'production';
}
