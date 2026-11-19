import { resolvePurchaseOrderPayableTotal } from './purchase-order-payable-total.util';

describe('resolvePurchaseOrderPayableTotal', () => {
  it('sin costo real usa el solicitado mientras la OC está creada', () => {
    expect(
      resolvePurchaseOrderPayableTotal({
        general_status: 'Creada',
        payment_currency: 'MXN',
        requested_total: 1000,
        received_total: 0,
      }),
    ).toBe(1000);
  });

  it('sin costo real usa el recibido cuando la OC ya se recibió', () => {
    expect(
      resolvePurchaseOrderPayableTotal({
        general_status: 'Recibida',
        payment_currency: 'USD',
        requested_total: 24600.22,
        received_total: 24000,
      }),
    ).toBe(24000);
  });

  it('con costo real en USD toma el total factura en dólares, no el de catálogo', () => {
    expect(
      resolvePurchaseOrderPayableTotal({
        general_status: 'Recibida',
        payment_currency: 'USD',
        requested_total: 24600.22,
        received_total: 24600.22,
        customs_exchange_rate: 16.9593,
        landed_merchandise_mxn: 417202.51,
        landed_extras_mxn: 33295.01,
        landed_invoice_extras_mxn: 10000,
      }),
    ).toBe(25189.87);
  });

  it('con costo real en MXN toma el total factura en pesos', () => {
    expect(
      resolvePurchaseOrderPayableTotal({
        general_status: 'Creada',
        payment_currency: 'MXN',
        requested_total: 200,
        received_total: 0,
        landed_merchandise_mxn: 200,
        landed_extras_mxn: 100,
        landed_invoice_extras_mxn: 40,
      }),
    ).toBe(240);
  });

  it('si el total factura no se puede armar, conserva el total de catálogo', () => {
    expect(
      resolvePurchaseOrderPayableTotal({
        general_status: 'Creada',
        payment_currency: 'USD',
        requested_total: 500,
        landed_extras_mxn: 80,
      }),
    ).toBe(500);
  });
});
