import { ElectronicInvoice } from '../../../entities/electronic-invoicing/electronic-invoice.entity';
export type OrderDownloadKind = 'ticket' | 'original' | 'delivery';
export interface OrderDownloadDocumentRow {
    id: string;
    sales_order_id: string;
    file_name: string;
    file_path: string;
    type_name: string;
    created_at: Date | string;
}
export interface OrderFileShortcut {
    id: string;
    file_name: string;
    kind: OrderDownloadKind;
    file_path: string;
}
export interface OrderInvoiceShortcut {
    id: string;
    series: string | null;
    folio: string | null;
    uuid: string | null;
    tipo_comprobante: string | null;
    stamp_status: string;
    sat_status: string | null;
    total: number;
    currency: string;
    rfc_receptor: string | null;
    receptor_nombre: string | null;
    stamped_at: Date | string | null;
    updated_at: Date | string | null;
    sat_last_sync_at: Date | string | null;
}
export interface OrderDownloads {
    invoice: OrderInvoiceShortcut | null;
    ticket: OrderFileShortcut | null;
    order_document: OrderFileShortcut | null;
}
export declare function emptyOrderDownloads(): OrderDownloads;
export declare function documentDownloadKind(typeName: string | null | undefined): OrderDownloadKind | null;
export declare function buildOrderDownloads(orderIds: string[], invoices: ElectronicInvoice[], documents: OrderDownloadDocumentRow[]): Map<string, OrderDownloads>;
