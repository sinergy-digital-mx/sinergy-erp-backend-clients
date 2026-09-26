export declare class StampElectronicInvoiceDto {
    fiscal_configuration_id: string;
    source_module: 'sales_orders' | 'quotations';
    source_id: string;
    xml: string;
    rfc_receptor: string;
    subtotal: number;
    total: number;
    receptor_nombre?: string;
    series?: string;
    folio?: string;
    tipo_comprobante?: string;
    rfc_emisor?: string;
    currency?: string;
    certificate_serial?: string;
    environment?: 'demo' | 'production';
    metadata?: Record<string, unknown>;
    invoice_role?: 'standard' | 'advance' | 'merchandise' | 'advance_application';
    related_advance_invoice_id?: string;
}
