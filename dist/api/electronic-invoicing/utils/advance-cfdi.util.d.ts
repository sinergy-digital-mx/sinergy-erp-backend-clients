export declare const ADVANCE_SAT_CLAVE = "84111506";
export declare const ADVANCE_UNIT_CODE = "ACT";
export declare const ADVANCE_UNIT_NAME = "Actividad";
export declare const ADVANCE_DESCRIPTION = "Anticipo del bien o servicio";
export declare const ADVANCE_APPLICATION_DESCRIPTION = "Aplicaci\u00F3n de anticipo";
export declare const ADVANCE_IDENTIFICATION = "anticipo_CFDI";
export declare const ADVANCE_RELATION_TYPE = "07";
export type AdvanceInvoiceRole = 'standard' | 'advance' | 'merchandise' | 'advance_application';
export interface AdvanceParty {
    rfc: string;
    nombre: string;
    regimen: string;
    postalCode: string;
}
export interface AdvanceConceptInput {
    series?: string | null;
    folio: string;
    baseAmount: number;
    ivaPercentage: number;
    usoCfdi: string;
    formaPago: string;
    metodoPago: 'PUE' | 'PPD';
    emisor: AdvanceParty;
    receptor: AdvanceParty;
    tipoComprobante: 'I' | 'E';
    descripcion: string;
    relatedUuid?: string | null;
}
export interface MerchandiseLineInput {
    satClave: string;
    quantity: number;
    unitPrice: number;
    lineDiscount: number;
    ivaPercentage: number;
    iepsPercentage: number;
    unitCode: string;
    unitName: string;
    description: string;
}
export interface MerchandiseCfdiInput {
    series?: string | null;
    folio: string;
    lines: MerchandiseLineInput[];
    globalDiscount: number;
    advanceBase: number;
    usoCfdi: string;
    formaPago: string;
    metodoPago: 'PUE' | 'PPD';
    emisor: AdvanceParty;
    receptor: AdvanceParty;
    relatedUuid: string;
}
export interface BuiltCfdiAmounts {
    xml: string;
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
}
export declare function inferIvaPercentage(ivaTotal: number, taxableBase: number): number;
export declare function taxableBaseOfDocument(subtotal: number, discountTotal: number, globalDiscount: number): number;
export declare function distributeCents(weights: number[], amountCents: number): number[];
export declare function buildAdvanceConceptCfdi(input: AdvanceConceptInput): BuiltCfdiAmounts;
export declare function buildMerchandiseCfdi(input: MerchandiseCfdiInput): BuiltCfdiAmounts;
export declare function fiveDigitPostalCode(value?: string | null): string;
export declare function resolveSatUnit(unitName?: string | null, itemKind?: string | null): {
    code: string;
    name: string;
};
