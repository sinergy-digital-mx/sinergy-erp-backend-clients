import { ParsedCfdi } from './cfdi-xml.parser';
export interface PaymentComplementParty {
    rfc: string;
    nombre: string;
    regimen: string;
    postalCode: string;
}
export interface PaymentComplementTax {
    impuesto: '002' | '003';
    tipoFactor: 'Tasa' | 'Exento';
    tasaOCuota: string;
    base: number;
    importe: number;
}
export interface PaymentComplementPayment {
    amount: number;
    paymentDate: string;
    formaPago: string;
    reference?: string | null;
}
export interface PaymentComplementInput {
    series?: string | null;
    folio: string;
    fecha: string;
    lugarExpedicion: string;
    emisor: {
        rfc: string;
        nombre: string;
        regimen: string;
    };
    receptor: PaymentComplementParty;
    related: {
        uuid: string;
        serie?: string | null;
        folio?: string | null;
        moneda: string;
        total: number;
        fecha: string;
    };
    taxes: PaymentComplementTax[];
    objetoImp: '01' | '02';
    payments: PaymentComplementPayment[];
}
export interface BuiltPaymentComplement {
    xml: string;
    amount: number;
}
export declare function buildPaymentComplementXml(input: PaymentComplementInput): BuiltPaymentComplement;
export declare function paymentComplementFecha(now?: Date): string;
export declare function formaPagoFromSalesMethod(method: string | null | undefined): string | null;
export declare function taxesFromIncomeCfdi(cfdi: ParsedCfdi): {
    objetoImp: '01' | '02';
    taxes: PaymentComplementTax[];
};
export interface PaymentComplementPdfLine {
    fecha: string;
    formaPago: string;
    monto: string;
    parcialidad: string;
    saldo: string;
    uuid: string;
}
export declare function readPaymentComplementLines(xml: string): PaymentComplementPdfLine[];
export declare function resolveFechaPago(paymentDate: string, relatedFecha: string, comprobanteFecha: string): string;
