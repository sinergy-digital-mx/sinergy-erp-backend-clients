import {
  globalInvoiceActiveKey,
  parseGlobalInvoiceMonth,
  resolveGlobalInvoicePayment,
} from './global-invoice.util';

describe('global invoice helpers', () => {
  it('lee un mes AAAA-MM y su último día', () => {
    expect(parseGlobalInvoiceMonth('2026-11')).toMatchObject({
      year: 2026,
      month: 11,
      from: '2026-11-01',
      to: '2026-11-30',
    });
    expect(parseGlobalInvoiceMonth('2024-02')?.to).toBe('2024-02-29');
    expect(parseGlobalInvoiceMonth('2026-13')).toBeNull();
  });

  it('usa la forma de pago cuando todas las órdenes coinciden', () => {
    expect(
      resolveGlobalInvoicePayment([
        { payment_status: 'Pagado', payment_method: 'cash', lines: [{ method: 'cash' }] },
        { payment_status: 'Pagado', payment_method: 'cash', lines: [{ method: 'cash' }] },
      ]),
    ).toEqual({ formaPago: '01', metodoPago: 'PUE' });
  });

  it('arma la llave vigente por sucursal y mes', () => {
    expect(globalInvoiceActiveKey('branch-1', 2026, 11)).toBe('branch-1:2026:11');
    expect(globalInvoiceActiveKey('branch-1', 2026, 3)).toBe('branch-1:2026:03');
  });

  it('usa 99 en un mes mixto y PPD si alguna orden no está pagada', () => {
    expect(
      resolveGlobalInvoicePayment([
        { payment_status: 'Pagado', payment_method: 'mixed', lines: [{ method: 'cash' }, { method: 'card' }] },
        { payment_status: 'Pagado', payment_method: 'transfer', lines: [{ method: 'transfer' }] },
      ]),
    ).toEqual({ formaPago: '99', metodoPago: 'PUE' });

    expect(
      resolveGlobalInvoicePayment([
        { payment_status: 'Pendiente', payment_method: 'cash', lines: [{ method: 'cash' }] },
      ]),
    ).toEqual({ formaPago: '99', metodoPago: 'PPD' });
  });
});
