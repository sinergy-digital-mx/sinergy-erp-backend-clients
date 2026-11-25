export declare class StartAdvanceQuotationDto {
    advance_amount: number;
    advance_case: 'unknown' | 'products';
    advance_iva_percentage?: number;
    advance_uso_cfdi?: string;
    advance_metodo_pago?: 'PUE' | 'PPD';
}
