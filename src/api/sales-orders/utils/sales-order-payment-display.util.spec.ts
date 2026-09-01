import { PosSalePaymentMethod } from '../../../entities/pos/pos-sale-payment-method.enum';
import { buildSalesOrderPaymentDisplay } from './sales-order-payment-display.util';

describe('buildSalesOrderPaymentDisplay', () => {
  it('labels a cash POS collection', () => {
    const display = buildSalesOrderPaymentDisplay({
      collection: {
        payment_method: PosSalePaymentMethod.CASH,
        amount_cash_mxn: 150,
      },
    });

    expect(display.payment_method).toBe('cash');
    expect(display.payment_method_label).toBe('Efectivo');
    expect(display.payment_breakdown_label).toBe('Efectivo');
    expect(display.lines).toEqual([
      { method: 'cash', label: 'Efectivo', amount_mxn: 150, amount_usd: 0 },
    ]);
  });

  it('breaks down mixed cash + card', () => {
    const display = buildSalesOrderPaymentDisplay({
      collection: {
        payment_method: PosSalePaymentMethod.MIXED,
        amount_cash_mxn: 500,
        amount_card_mxn: 300.5,
      },
    });

    expect(display.payment_method).toBe('mixed');
    expect(display.payment_method_label).toBe('Mixto');
    expect(display.payment_breakdown_label).toBe('Efectivo + Tarjeta');
    expect(display.lines.map((line) => line.method)).toEqual(['cash', 'card']);
  });

  it('falls back to order payments when there is no POS collection', () => {
    const display = buildSalesOrderPaymentDisplay({
      payments: [
        { payment_method: 'transfer', amount: 200 },
        { payment_method: 'cash', amount: 50 },
      ],
    });

    expect(display.payment_method).toBe('mixed');
    expect(display.payment_breakdown_label).toBe('Efectivo + Transferencia');
  });

  it('uses credit when flagged and there is no cobro', () => {
    const display = buildSalesOrderPaymentDisplay({ isCredit: true });
    expect(display.payment_method).toBe('credit');
    expect(display.payment_method_label).toBe('Crédito');
  });
});
