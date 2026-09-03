export interface SelfInvoiceCfdiLine {
    description: string;
    quantity: number;
    unitPrice: number;
    discountUnit: number;
    ivaPercentage: number;
    iepsPercentage: number;
    satClave?: string | null;
    uomName?: string | null;
}
export interface SelfInvoiceCfdiInput {
    serie?: string | null;
    folio: string;
    fecha: string;
    formaPago: string;
    metodoPago: string;
    lugarExpedicion: string;
    subtotalBeforeDiscount?: number;
    globalDiscountAmount?: number;
    emisor: {
        rfc: string;
        nombre: string;
        regimenFiscal: string;
    };
    receptor: {
        rfc: string;
        nombre: string;
        domicilioFiscal: string;
        regimenFiscal: string;
        usoCfdi: string;
    };
    lines: SelfInvoiceCfdiLine[];
}
export declare function buildSelfInvoiceCfdiXml(input: SelfInvoiceCfdiInput): string;
export declare function formatCfdiFecha(date: Date, timeZone?: string): string;
