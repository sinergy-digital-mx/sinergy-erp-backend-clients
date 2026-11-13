import { ElectronicInvoice } from '../../../entities/electronic-invoicing/electronic-invoice.entity';
import { groupInvoicesByOrderId } from './sales-order-invoice-export.util';

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
  rfc_emisor: string | null;
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

export function emptyOrderDownloads(): OrderDownloads {
  return { invoice: null, ticket: null, order_document: null };
}

export function documentDownloadKind(typeName: string | null | undefined): OrderDownloadKind | null {
  const type = (typeName || '').trim().toUpperCase();
  if (type === 'TICKET / RECIBO' || type === 'TICKET_RECIBO') return 'ticket';
  if (type === 'DOCUMENTO_ORIGINAL') return 'original';
  if (type === 'ENTREGA' || type === 'RECIBO' || type === 'DOCUMENTO_RECIBO') return 'delivery';
  return null;
}

export function buildOrderDownloads(
  orderIds: string[],
  invoices: ElectronicInvoice[],
  documents: OrderDownloadDocumentRow[],
): Map<string, OrderDownloads> {
  const invoicesByOrder = groupInvoicesByOrderId(invoices);
  const result = new Map<string, OrderDownloads>();

  for (const orderId of orderIds) {
    const downloads = emptyOrderDownloads();
    const primary = pickDisplayInvoice(invoicesByOrder.get(orderId) ?? []);
    if (primary) {
      downloads.invoice = {
        id: primary.id,
        series: primary.series ?? null,
        folio: primary.folio ?? null,
        uuid: primary.uuid ?? null,
        tipo_comprobante: primary.tipo_comprobante ?? null,
        rfc_emisor: primary.rfc_emisor ?? null,
        stamp_status: primary.stamp_status,
        sat_status: primary.sat_status ?? null,
        total: Number(primary.total) || 0,
        currency: primary.currency || 'MXN',
        rfc_receptor: primary.rfc_receptor ?? null,
        receptor_nombre: primary.receptor_nombre ?? null,
        stamped_at: primary.stamped_at ?? null,
        updated_at: primary.updated_at ?? null,
        sat_last_sync_at: primary.sat_last_sync_at ?? null,
      };
    }

    const docs = documents
      .filter((doc) => doc.sales_order_id === orderId)
      .sort((a, b) => timeOf(b.created_at) - timeOf(a.created_at));
    let delivery: OrderFileShortcut | null = null;
    for (const doc of docs) {
      const kind = documentDownloadKind(doc.type_name);
      if (!kind) continue;
      if (kind === 'ticket' && !downloads.ticket) {
        downloads.ticket = toShortcut(doc, kind);
      } else if (kind === 'original' && !downloads.order_document) {
        downloads.order_document = toShortcut(doc, kind);
      } else if (kind === 'delivery' && !delivery) {
        delivery = toShortcut(doc, kind);
      }
    }
    if (!downloads.order_document) {
      downloads.order_document = delivery;
    }
    result.set(orderId, downloads);
  }

  return result;
}

const LISTED_STAMP_STATUSES = new Set<string>([
  'stamped',
  'cancel_pending',
  'cancelled',
  'cancel_error',
]);

function pickDisplayInvoice(invoices: ElectronicInvoice[]): ElectronicInvoice | null {
  const visible = invoices.filter((invoice) => {
    if (String(invoice.sat_status || '') === 'Cancelado') return false;
    if (invoice.stamp_status === 'cancelled') return false;
    if (LISTED_STAMP_STATUSES.has(String(invoice.stamp_status || ''))) return true;
    return !!invoice.uuid?.trim();
  });
  if (!visible.length) return null;
  return [...visible].sort((a, b) => {
    const aTime = timeOf(a.stamped_at || a.updated_at || a.created_at);
    const bTime = timeOf(b.stamped_at || b.updated_at || b.created_at);
    return bTime - aTime;
  })[0];
}

function toShortcut(doc: OrderDownloadDocumentRow, kind: OrderDownloadKind): OrderFileShortcut {
  return {
    id: doc.id,
    file_name: doc.file_name,
    kind,
    file_path: doc.file_path,
  };
}

function timeOf(value: Date | string): number {
  const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}
