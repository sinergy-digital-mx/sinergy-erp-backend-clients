import { ElectronicInvoice } from '../../../entities/electronic-invoicing/electronic-invoice.entity';
export type SalesOrderInvoiceExportRow = {
    invoice_count: number;
    invoice_facturado: string;
    invoice_uuid: string;
    invoice_uuids: string;
    invoice_series: string;
    invoice_folio: string;
    invoice_series_folio: string;
    invoice_tipo: string;
    invoice_rfc_emisor: string;
    invoice_rfc_receptor: string;
    invoice_receptor: string;
    invoice_subtotal: number | '';
    invoice_total: number | '';
    invoice_currency: string;
    invoice_environment: string;
    invoice_stamped_at: string;
    invoice_stamp_status: string;
    invoice_sat_status: string;
    invoice_sat_cancelable: string;
    invoice_sat_cancel_status: string;
    invoice_sat_status_code: string;
    invoice_sat_last_sync: string;
    invoice_cancel_motivo: string;
    invoice_cancel_replacement_uuid: string;
    invoice_stamp_error: string;
};
export declare function isExportableInvoice(invoice: Pick<ElectronicInvoice, 'stamp_status'>): boolean;
export declare function pickPrimaryInvoice(invoices: ElectronicInvoice[]): ElectronicInvoice | null;
export declare function groupInvoicesByOrderId(invoices: ElectronicInvoice[]): Map<string, ElectronicInvoice[]>;
export declare function emptyInvoiceExportRow(): SalesOrderInvoiceExportRow;
export declare function mapInvoiceExportRow(invoices: ElectronicInvoice[], formatDateTime: (value: Date | string | null | undefined) => string): SalesOrderInvoiceExportRow;
export declare const SALES_ORDER_INVOICE_EXPORT_COLUMNS: ({
    header: string;
    key: string;
    width: number;
    type?: undefined;
} | {
    header: string;
    key: string;
    width: number;
    type: "integer";
} | {
    header: string;
    key: string;
    width: number;
    type: "currency";
} | {
    header: string;
    key: string;
    width: number;
    type: "date";
})[];
