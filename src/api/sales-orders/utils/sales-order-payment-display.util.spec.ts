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

  it('labels a check POS collection', () => {
    const display = buildSalesOrderPaymentDisplay({
      collection: {
        payment_method: PosSalePaymentMethod.CHECK,
        amount_check_mxn: 12904.99,
      },
    });

    expect(display.payment_method).toBe('check');
    expect(display.payment_method_label).toBe('Cheque');
    expect(display.lines).toEqual([
      { method: 'check', label: 'Cheque', amount_mxn: 12904.99, amount_usd: 0 },
    ]);
  });

  it('labels a dollar check', () => {
    const display = buildSalesOrderPaymentDisplay({
      collection: {
        payment_method: PosSalePaymentMethod.CHECK,
        amount_check_usd: 64.26,
      },
    });

    expect(display.lines).toEqual([
      { method: 'check', label: 'Cheque', amount_mxn: 0, amount_usd: 64.26 },
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

  it('breaks down mixed two cards', () => {
    const display = buildSalesOrderPaymentDisplay({
      collection: {
        payment_method: PosSalePaymentMethod.MIXED,
        amount_card_mxn: 830.5,
        card_payments: [{ amount_mxn: 400 }, { amount_mxn: 430.5 }],
      },
    });

    expect(display.payment_method).toBe('mixed');
    expect(display.payment_breakdown_label).toBe('Tarjeta + Tarjeta');
    expect(display.lines).toEqual([
      { method: 'card', label: 'Tarjeta', amount_mxn: 400, amount_usd: 0 },
      { method: 'card', label: 'Tarjeta', amount_mxn: 430.5, amount_usd: 0 },
    ]);
  });

  it('breaks down mixed two transfers', () => {
    const display = buildSalesOrderPaymentDisplay({
      collection: {
        payment_method: PosSalePaymentMethod.MIXED,
        amount_transfer_mxn: 800,
        transfer_payments: [{ amount_mxn: 300 }, { amount_mxn: 500 }],
      },
    });

    expect(display.payment_method).toBe('mixed');
    expect(display.payment_breakdown_label).toBe('Transferencia + Transferencia');
    expect(display.lines).toEqual([
      { method: 'transfer', label: 'Transferencia', amount_mxn: 300, amount_usd: 0 },
      { method: 'transfer', label: 'Transferencia', amount_mxn: 500, amount_usd: 0 },
    ]);
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
