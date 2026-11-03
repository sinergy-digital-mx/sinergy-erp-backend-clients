export interface InvoiceWhatsappImageInput {
    paid: boolean;
    customerName: string;
    issuerName: string;
    issuerRfc: string | null;
    invoiceFolio: string;
    orderFolio: string;
    uuid: string;
    totalLabel: string;
    stampedAt: string;
}
export declare function buildInvoiceWhatsappSvg(input: InvoiceWhatsappImageInput): string;
export declare function renderInvoiceWhatsappImage(input: InvoiceWhatsappImageInput): Buffer | null;
export declare function buildInvoiceWhatsappCaption(input: InvoiceWhatsappImageInput): string;
