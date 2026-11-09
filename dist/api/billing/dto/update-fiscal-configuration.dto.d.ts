export declare class UpdateFiscalConfigurationDto {
    razon_social?: string;
    rfc?: string;
    persona_type?: string;
    prefix?: string | null;
    fiscal_regime?: string;
    digital_seal?: string;
    digital_seal_password?: string;
    private_key?: string;
    logo?: string;
    use_as_system_logo?: boolean;
    status?: string;
    quotation_expiration_days?: number | null;
    advance_invoicing_enabled?: boolean;
    iva_enabled?: boolean;
    ieps_enabled?: boolean;
    multi_fiscal_transfers_enabled?: boolean;
    global_invoice_auto_enabled?: boolean;
    global_invoice_block_after_month?: boolean;
    global_invoice_hour?: number | null;
    global_invoice_timezone?: string | null;
}
