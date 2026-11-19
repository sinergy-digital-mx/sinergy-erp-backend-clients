import { ElectronicInvoice } from '../../../entities/electronic-invoicing/electronic-invoice.entity';
import {
  mapInvoiceExportRow,
  pickPrimaryInvoice,
} from './sales-order-invoice-export.util';

function invoice(partial: Partial<ElectronicInvoice>): ElectronicInvoice {
  return {
    stamp_status: 'stamped',
    ...partial,
  } as ElectronicInvoice;
}

describe('sales-order-invoice-export', () => {
  it('elige la factura vigente sobre una cancelada', () => {
    const cancelled = invoice({
      uuid: 'aaa',
      stamp_status: 'cancelled',
      sat_status: 'Cancelado',
      stamped_at: new Date('2026-01-01'),
    });
    const vigente = invoice({
      uuid: 'bbb',
      stamp_status: 'stamped',
      sat_status: 'Vigente',
      stamped_at: new Date('2026-02-01'),
    });

    expect(pickPrimaryInvoice([cancelled, vigente])?.uuid).toBe('bbb');
  });

  it('mapea todos los campos de factura', () => {
    const row = mapInvoiceExportRow(
      [
        invoice({
          uuid: '6C3C0C87-1111-2222-3333-444444444444',
          series: 'A',
          folio: '1042',
          tipo_comprobante: 'I',
          rfc_emisor: 'AAA010101AAA',
          rfc_receptor: 'BBB010101BBB',
          receptor_nombre: 'Cliente SA',
          subtotal: 1000,
          total: 1160,
          currency: 'MXN',
          stamp_status: 'stamped',
          sat_status: 'Vigente',
          sat_es_cancelable: 'Cancelable',
          stamped_at: new Date('2026-03-01T15:00:00Z'),
          metadata: { finkok_environment: 'production' },
        }),
      ],
      () => '01/03/2026 09:00',
    );

    expect(row.invoice_facturado).toBe('Sí');
    expect(row.invoice_count).toBe(1);
    expect(row.invoice_uuid).toBe('6C3C0C87-1111-2222-3333-444444444444');
    expect(row.invoice_series_folio).toBe('A-1042');
    expect(row.invoice_tipo).toBe('Ingreso');
    expect(row.invoice_rfc_emisor).toBe('AAA010101AAA');
    expect(row.invoice_total).toBe(1160);
    expect(row.invoice_environment).toBe('PROD');
    expect(row.invoice_stamp_status).toBe('Activa en sistema');
    expect(row.invoice_sat_status).toBe('Vigente');
  });

  it('sin facturas visibles deja columnas vacías', () => {
    const row = mapInvoiceExportRow(
      [invoice({ stamp_status: 'stamp_error', uuid: null })],
      () => '',
    );
    expect(row.invoice_facturado).toBe('No');
    expect(row.invoice_uuid).toBe('');
    expect(row.invoice_count).toBe(0);
  });
});
