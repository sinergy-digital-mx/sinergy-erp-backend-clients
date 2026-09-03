export declare class StampSelfInvoiceDto {
    email: string;
    phone: string;
    fiscal_rfc: string;
    fiscal_razon_social: string;
    fiscal_person_type?: 'fisica' | 'moral' | 'otro';
    fiscal_postal_code: string;
    fiscal_country?: string;
    fiscal_street?: string;
    fiscal_exterior_number?: string;
    fiscal_interior_number?: string;
    fiscal_colonia?: string;
    fiscal_localidad?: string;
    fiscal_municipio?: string;
    fiscal_state?: string;
    uso_cfdi: string;
    regimen_fiscal_receptor: string;
    forma_pago: string;
    metodo_pago?: 'PUE' | 'PPD';
}
