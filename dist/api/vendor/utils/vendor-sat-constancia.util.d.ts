import { SatCsfFiscalData } from '../../customers/utils/sat-csf.util';
export interface VendorSatConstanciaPreview {
    rfc: string;
    persona_type: 'Persona Física' | 'Persona Moral';
    razon_social: string;
    street: string | null;
    exterior_number: string | null;
    interior_number: string | null;
    colonia: string | null;
    localidad: string | null;
    city: string | null;
    state: string | null;
    zip_code: string;
    country: 'México';
}
export declare function toVendorSatConstancia(data: SatCsfFiscalData): VendorSatConstanciaPreview;
export declare function assertSatConstanciaPdf(file: {
    buffer?: Buffer;
    mimetype?: string;
    originalname?: string;
    size?: number;
}): void;
