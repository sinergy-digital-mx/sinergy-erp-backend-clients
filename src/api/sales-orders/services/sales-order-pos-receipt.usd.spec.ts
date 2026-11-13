import { SalesOrderPosReceiptService } from './sales-order-pos-receipt.service';

/** Arma el texto del ticket sin BD ni S3 (método privado). */
function buildTicket(currency: 'MXN' | 'USD', exchangeRate: number | null): string {
  const service = new SalesOrderPosReceiptService(
    null as never, null as never, null as never, null as never,
    null as never, null as never, { get: () => undefined } as never,
  );
  const order = {
    currency,
    exchange_rate: exchangeRate,
    fiscal_razon_social: 'MADERERIA ZONA NORTE',
    fiscal_configuration: { rfc: 'MZN980826EF2' },
    iva_total: 268.8,
    total: 3628.8,
    global_discount_amount: 0,
    line_items: [
      { quantity: 3, unit_price: 1120, discount_unit: 0, product: { name: 'Triplay Alder Euro 3/4' } },
    ],
    notes: null,
  };
  const collection = {
    payment_method: 'credit',
    order_total_mxn: 3628.8,
    amount_credit_mxn: 3628.8,
    created_at: new Date('2026-11-13T23:14:57Z'),
  };
  return (service as any).buildPlainTextReceipt(order, collection, null, 'MZN-CTR-INV-000694', 'https://x/f');
}

describe('Ticket POS en USD', () => {
  it('orden en USD: importes en dólares, T.C. y equivalente en pesos', () => {
    const text = buildTicket('USD', 17.9);
    expect(text).toContain('Moneda: USD  T.C. 17.9000');
    expect(text).toContain('Subtotal: USD 187.71');
    expect(text).toContain('IVA: USD 15.02');
    expect(text).toContain('Total: USD 202.73');
    expect(text).toContain('Equivale a: $3628.80 MXN');
    expect(text).toContain('Credito: USD 202.73');
    expect(text).not.toContain('Total: $3628.80');
  });

  it('orden en MXN: sin cambios', () => {
    const text = buildTicket('MXN', null);
    expect(text).toContain('Subtotal: $3360.00');
    expect(text).toContain('IVA: $268.80');
    expect(text).toContain('Total: $3628.80');
    expect(text).toContain('Credito: $3628.80');
    expect(text).not.toContain('USD 202');
  });
});
