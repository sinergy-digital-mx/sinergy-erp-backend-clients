import { ElectronicInvoice } from '../../../../entities/electronic-invoicing/electronic-invoice.entity';
import {
  buildOrderDownloads,
  documentDownloadKind,
} from '../sales-order-downloads.util';

function invoice(partial: Partial<ElectronicInvoice> & Pick<ElectronicInvoice, 'id' | 'source_id' | 'stamp_status'>): ElectronicInvoice {
  return {
    tipo_comprobante: 'I',
    currency: 'MXN',
    total: 10,
    created_at: new Date('2026-09-01T22:00:00.000Z'),
    ...partial,
  } as ElectronicInvoice;
}

describe('documentDownloadKind', () => {
  it('reconoce ticket y documento de orden', () => {
    expect(documentDownloadKind('TICKET / RECIBO')).toBe('ticket');
    expect(documentDownloadKind('DOCUMENTO_ORIGINAL')).toBe('original');
    expect(documentDownloadKind('ENTREGA')).toBe('delivery');
    expect(documentDownloadKind('otro')).toBeNull();
  });
});

describe('buildOrderDownloads', () => {
  it('prefiere la factura vigente y el PDF original sobre la entrega', () => {
    const map = buildOrderDownloads(
      ['so-1'],
      [
        invoice({
          id: 'old',
          source_id: 'so-1',
          stamp_status: 'cancelled',
          sat_status: 'Cancelado',
          folio: '1',
        }),
        invoice({
          id: 'live',
          source_id: 'so-1',
          stamp_status: 'stamped',
          sat_status: 'Vigente',
          folio: '2',
          uuid: 'uuid-live',
          updated_at: new Date('2026-09-02T18:00:00.000Z'),
        }),
      ],
      [
        {
          id: 'entrega',
          sales_order_id: 'so-1',
          file_name: 'entrega.pdf',
          file_path: 's3/entrega',
          type_name: 'ENTREGA',
          created_at: '2026-09-03 00:00:00',
        },
        {
          id: 'original',
          sales_order_id: 'so-1',
          file_name: 'orden.pdf',
          file_path: 's3/original',
          type_name: 'DOCUMENTO_ORIGINAL',
          created_at: '2026-09-01 00:00:00',
        },
        {
          id: 'ticket',
          sales_order_id: 'so-1',
          file_name: 'ticket.bin',
          file_path: 's3/ticket',
          type_name: 'TICKET / RECIBO',
          created_at: '2026-09-01 00:00:00',
        },
      ],
    );

    const downloads = map.get('so-1');
    expect(downloads?.invoice?.id).toBe('live');
    expect(downloads?.invoice?.uuid).toBe('uuid-live');
    expect(downloads?.ticket?.id).toBe('ticket');
    expect(downloads?.order_document?.kind).toBe('original');
    expect(downloads?.order_document?.id).toBe('original');
  });
});
