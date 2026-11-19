import {
  applyPaymentSettlement,
  countActiveOverduePayments,
  isDownPaymentTargetMet,
  resolvePaymentOverdueFlag,
  settlePaymentAmounts,
  sumActiveOverdueAmount,
} from './contract-payment-settlement.util';

describe('settlePaymentAmounts', () => {
  it('marca pagado cuando el pendiente redondea a 0', () => {
    expect(settlePaymentAmounts(661.57, 661.569)).toEqual({
      status: 'pagado',
      amount: 661.57,
      amount_paid: 661.57,
      amount_pending: 0,
    });
  });

  it('deja parcial solo si aún falta saldo', () => {
    expect(settlePaymentAmounts(661.57, 400)).toEqual({
      status: 'parcial',
      amount: 661.57,
      amount_paid: 400,
      amount_pending: 261.57,
    });
  });
});

describe('resolvePaymentOverdueFlag', () => {
  const today = new Date(2026, 9, 23);

  it('limpia vencido si ya está pagado', () => {
    expect(resolvePaymentOverdueFlag('pagado', '2026-10-05', today)).toBe(false);
  });

  it('marca vencido solo si sigue abierto y la fecha ya pasó', () => {
    expect(resolvePaymentOverdueFlag('parcial', '2026-10-05', today)).toBe(true);
    expect(resolvePaymentOverdueFlag('pendiente', '2026-10-23', today)).toBe(
      false,
    );
  });
});

describe('applyPaymentSettlement', () => {
  it('corrige un parcial con $0 pendiente y apaga is_overdue', () => {
    const payment = applyPaymentSettlement({
      amount: 661.57,
      amount_paid: 661.57,
      amount_pending: 0,
      status: 'parcial',
      is_overdue: true,
      due_date: '2026-10-05',
    });

    expect(payment.status).toBe('pagado');
    expect(payment.amount_pending).toBe(0);
    expect(payment.is_overdue).toBe(false);
  });
});

describe('countActiveOverduePayments', () => {
  it('no cuenta pagados con bandera vieja de vencido', () => {
    expect(
      countActiveOverduePayments([
        { status: 'pagado', is_overdue: true },
        { status: 'pagado', is_overdue: true },
        { status: 'parcial', is_overdue: true },
      ]),
    ).toBe(1);
  });
});

describe('sumActiveOverdueAmount', () => {
  it('suma solo el pendiente de cuotas abiertas vencidas', () => {
    expect(
      sumActiveOverdueAmount([
        { status: 'pagado', is_overdue: true, amount_pending: 0, amount: 661.57 },
        { status: 'parcial', is_overdue: true, amount_pending: 100, amount: 661.57 },
      ]),
    ).toBe(100);
  });
});

describe('isDownPaymentTargetMet', () => {
  it('acepta diferencia de centavos por redondeo', () => {
    expect(isDownPaymentTargetMet(23307.85, 23307.849)).toBe(true);
  });

  it('sigue pendiente si falta saldo real', () => {
    expect(isDownPaymentTargetMet(23307.85, 23307.75)).toBe(false);
  });
});
