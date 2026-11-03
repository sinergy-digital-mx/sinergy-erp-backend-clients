import { EntityManager } from 'typeorm';
export interface GlobalInvoicePeriod {
    year: number;
    month: number;
    from: string;
    to: string;
    label: string;
}
export declare function parseGlobalInvoiceMonth(value: string | null | undefined): GlobalInvoicePeriod | null;
export declare function currentGlobalInvoiceMonth(now?: Date): string;
export declare function globalInvoiceActiveKey(fiscalConfigurationId: string, year: number, month: number): string;
export declare function monthLabel(year: number, month: number): string;
export declare function resolveGlobalInvoicePayment(orders: Array<{
    payment_status: string;
    payment_method: string | null;
    lines: Array<{
        method: string;
    }>;
}>): {
    formaPago: string;
    metodoPago: 'PUE' | 'PPD';
};
export declare function fiveDigitPostalCode(value: string | null | undefined): string;
export declare function readXmlAttr(xml: string, name: string): string;
export declare function assertSalesOrderNotInGlobalInvoice(manager: EntityManager, tenantId: string, salesOrderId: string): Promise<void>;
