export interface PdfTextItem {
    str: string;
    x: number;
    y: number;
    page: number;
}
export interface SatCsfFiscalData {
    fiscal_rfc: string;
    fiscal_person_type: 'fisica' | 'moral';
    fiscal_razon_social: string;
    fiscal_postal_code: string;
    fiscal_country: 'MEX';
    fiscal_street?: string | null;
    fiscal_exterior_number?: string | null;
    fiscal_interior_number?: string | null;
    fiscal_colonia?: string | null;
    fiscal_localidad?: string | null;
    fiscal_municipio?: string | null;
    fiscal_state?: string | null;
}
export declare class SatCsfParseError extends Error {
    constructor(message: string);
}
export declare function parseSatCsfTextItems(items: PdfTextItem[]): SatCsfFiscalData;
